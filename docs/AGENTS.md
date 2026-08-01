# AGENTS.md — RepoMind AI Agent Team

All agents implement a shared `BaseAgent` interface and communicate exclusively through the LangGraph shared state object and the Provider Layer — never directly with each other or with a concrete AI provider.

## Core Architectural Principles

Two principles apply across every agent below and are treated as first-class architecture, not per-agent afterthoughts:

**The Reviewer Agent Loop.** Every high-stakes output — findings, architecture claims, generated documentation — passes through a standard review cycle before reaching the user:

```
Review → Feedback → Rewrite → Validate → Approve
```

If a reviewed output scores below the confidence threshold, it is sent back with structured feedback for the originating agent to rewrite, then re-validated. Only outputs that clear the threshold (or exhaust a bounded retry limit, in which case they're flagged as low-confidence rather than silently dropped) are marked `approved` in shared state. This loop is what separates RepoMind from one-shot generation: agents are expected to be wrong sometimes, and the architecture accounts for that.

**Explainability by default.** Every AI-generated insight — a finding, an architecture claim, a suggestion — carries four attached fields in its output schema:

- `reasoning` — a short explanation of how the agent arrived at the conclusion
- `confidence` — a numeric score (0.0–1.0)
- `evidence` — the specific code snippet(s) or structural signal(s) that triggered the insight
- `referenced_files` — exact file paths (and line ranges where applicable) the insight is grounded in

No agent emits a bare claim without these four fields populated; the Report Generator and frontend surface them directly rather than deriving them after the fact.

---

## 0. Planner Agent

**Purpose**: Runs before any analysis agent to produce an explicit execution plan, making the system's reasoning about *what to do and in what order* visible rather than implicit in code.

**Input**: Repo URL, lightweight pre-scan metadata (repo size, primary language, presence of tests/CI config) gathered via a fast preliminary GitPython pass.

**Output**: A structured `ExecutionPlan` — which agents will run, in what order/parallelism, and why (e.g., "large repo detected, Performance Agent will scope to top-10 highest-centrality modules only").

**Internal Workflow**:
1. Run a lightweight pre-scan (file count, language mix, size) without full Tree-sitter parsing.
2. Prompt the AI provider with the pre-scan summary to produce a plan: agent execution order, any scope limits, and rationale.
3. Validate the plan against the static LangGraph topology (the plan can tune scope/parameters, not invent new edges) and write it to shared state.

**Prompt Strategy**: Single structured call requesting a JSON plan object with a `rationale` field per decision — the rationale is what powers the "planning" step shown in the Agent Timeline.

**Failure Handling**: If planning fails or times out, the system falls back to a default plan (the standard orchestration flow described below with no scope limits) rather than blocking the run — planning optimizes execution, it does not gate it.

**Communication with Other Agents**: Runs first, before Repository Analyzer. Its `ExecutionPlan` is read by the orchestration layer to configure how downstream agents run (e.g., scope limits passed to Performance Agent), and is displayed in the Agent Timeline as the first visible step of the run.

---

## 1. Repository Analyzer

**Purpose**: Entry-point agent. Builds the foundational structural understanding of the repo that all other agents rely on.

**Input**: Repo URL, cloned repo path (from `git_ingestion.py`).

**Output**: File tree, language breakdown, entry points, dependency graph (via `dependency_graph.py`), parsed AST summaries per file (via `code_parser.py`).

**Internal Workflow**:
1. Clone repo via GitPython.
2. Walk file tree, classify files by language/type.
3. Parse source files using a multi-language regex-based symbol extractor (Python, TypeScript, JavaScript, Go, Java) to extract functions, classes, and import relationships.
4. Build a module dependency graph with NetworkX.
5. Emit a structured `RepoStructure` object into shared state.

**Prompt Strategy**: Minimal AI use — mostly deterministic parsing. Where AI is used (e.g., classifying ambiguous file purposes), prompts are short, structured, and request JSON output only.

**Failure Handling**: Deterministic steps (clone, parse, graph build) that fail hard-stop the run with a clear error, since every downstream agent depends on `RepoStructure`. AI-assisted classification failures degrade gracefully — unclassified files are marked `unknown` rather than blocking the run.

**Communication with Other Agents**: Produces the foundational `RepoStructure` that every downstream agent consumes. Runs second, after the Planner Agent, with no agent dependencies of its own.

---

## 2. Architect Agent

**Purpose**: Explains overall system architecture and produces the visual dependency graph.

**Input**: `RepoStructure` from Repository Analyzer.

**Output**: Architecture summary (narrative), layered/module diagram data (for React Flow), identified architectural patterns and anti-patterns.

**Internal Workflow**:
1. Analyze the dependency graph for clusters, layers, and entry/exit points.
2. Prompt the AI provider with a condensed structural summary to produce a narrative explanation and pattern classification.
3. Format output as graph-renderable JSON (nodes/edges) plus prose.

**Prompt Strategy**: Structured prompt containing module list + graph edges; asks for architecture narrative + pattern tags in JSON, keeping token usage low by summarizing rather than pasting raw code.

**Failure Handling**: On provider failure, the Provider Router fails over automatically (see ARCHITECTURE.md); if all providers fail, the agent emits the Knowledge Graph data with an empty narrative and `status: degraded`, so the visual graph still renders even without prose.

**Communication with Other Agents**: Consumes Repository Analyzer output. Its architecture summary and diagram data pass through the Reviewer Agent Loop before being consumed by the Documentation Agent and Report Generator.

---

## 3. Documentation Agent

**Purpose**: Generates human-readable documentation for the repo (README-style overview, module docs).

**Input**: `RepoStructure`, Architect Agent's architecture summary.

**Output**: Generated Markdown documentation (project overview, setup instructions inferred from config files, module-by-module docs).

**Internal Workflow**:
1. Combine structural data and architecture summary.
2. Detect existing docs/README to avoid redundant regeneration; supplement gaps instead of overwriting.
3. Generate per-module documentation in batches to manage context size.

**Prompt Strategy**: Batched prompts per module/directory rather than one giant prompt; each batch includes only relevant symbol summaries, not full file contents, to control token cost.

**Failure Handling**: A failed batch is retried once, then skipped with the affected module marked `undocumented` in the output rather than failing the whole agent — partial documentation is preferred over none.

**Communication with Other Agents**: Depends on Repository Analyzer and Architect Agent. Output passes through the Reviewer Agent Loop for accuracy validation, then feeds into Report Generator and the Learning Agent (as background context).

---

## 4. Bug Hunter Agent

**Purpose**: Detects bugs, code smells, and anti-patterns.

**Input**: `RepoStructure`, parsed ASTs per file.

**Output**: List of findings — file, line range, severity (low/medium/high/critical), description, suggested fix.

**Internal Workflow**:
1. Run static heuristics first (e.g., unused variables, obvious null-deref patterns) using Tree-sitter queries.
2. Send flagged regions plus surrounding context to the AI provider for deeper semantic review.
3. Normalize results into the shared `findings` schema.

**Prompt Strategy**: Per-file or per-function prompts scoped tightly to flagged code, asking for a structured JSON finding list — never a free-form code review essay.

**Failure Handling**: Per-file analysis failures are isolated — a single file's AI review failing does not stop the agent; that file's heuristic-only findings (if any) are kept and marked `ai_review: failed`.

**Communication with Other Agents**: Runs in parallel with Security Agent and Performance Agent after Repository Analyzer completes. Findings are consumed by the Reviewer Agent Loop before reaching Report Generator.

---

## 5. Security Agent

**Purpose**: Identifies security vulnerabilities and unsafe patterns.

**Input**: `RepoStructure`, dependency manifest files (package.json, requirements.txt, etc.), parsed ASTs.

**Output**: Security findings — vulnerability type, severity (CVSS-style tiering), affected file/line, remediation guidance.

**Internal Workflow**:
1. Check dependency manifests for known-risky packages/patterns.
2. Scan code for common vulnerability classes (injection, hardcoded secrets, insecure deserialization, etc.) using targeted Tree-sitter queries.
3. Escalate ambiguous cases to the AI provider for contextual judgment.

**Prompt Strategy**: Highly constrained prompts — provide only the suspicious snippet and ask for a yes/no vulnerability classification plus severity and fix, minimizing hallucination risk.

**Failure Handling**: Deterministic manifest/pattern checks always run regardless of AI availability; only the AI-escalated contextual judgment step degrades on provider failure, defaulting flagged-but-unconfirmed items to `needs_manual_review` rather than silently dropping them — security findings are never suppressed on failure, only downgraded in confidence.

**Communication with Other Agents**: Runs in parallel with Bug Hunter and Performance agents. Findings consumed by the Reviewer Agent Loop, then Report Generator.

---

## 6. Performance Agent

**Purpose**: Identifies performance bottlenecks and inefficient patterns.

**Input**: `RepoStructure`, parsed ASTs, dependency graph (to spot hot-path modules).

**Output**: Performance findings — location, issue type (e.g., N+1 query, unbounded loop, blocking I/O), estimated impact, suggested optimization.

**Internal Workflow**:
1. Use dependency graph centrality to prioritize which modules are worth deep analysis (most-depended-upon code first).
2. Apply pattern-based heuristics for common inefficiencies per language.
3. Use AI provider to reason about non-obvious algorithmic complexity issues in prioritized modules only.

**Prompt Strategy**: Scoped to individual functions with algorithmic-complexity framing; requests Big-O style reasoning and concrete optimization suggestions in structured form.

**Failure Handling**: If the Knowledge Graph centrality data is unavailable, falls back to file-size-based prioritization so the agent still runs, just with a coarser prioritization signal noted in its output.

**Communication with Other Agents**: Runs in parallel with Bug Hunter and Security agents. Findings consumed by the Reviewer Agent Loop, then Report Generator.

---

## 7. Learning Agent

**Purpose**: Produces simplified, educational explanations of complex code for less-experienced users.

**Input**: `RepoStructure`, Documentation Agent output, user-selected file/function (on-demand, from frontend).

**Output**: Plain-language explanations, annotated walkthroughs, suggested learning order for exploring the repo.

**Internal Workflow**:
1. For on-demand requests, take the selected code region plus its immediate context.
2. Generate a layered explanation (what it does → why it's structured this way → related concepts to learn).

**Prompt Strategy**: Explicitly instructs the provider to avoid jargon and prefer analogies; response length is capped to keep explanations skimmable in the UI.

**Failure Handling**: Interactive calls that fail return a clear inline error to the frontend with a retry action — no silent hang, since this is a user-triggered, latency-sensitive call rather than a background batch step.

**Communication with Other Agents**: Consumes Documentation Agent and Repository Analyzer output. Can be invoked on-demand outside the main pipeline (interactive, not purely batch).

---

## 8. Feature Suggestion Agent

**Purpose**: Suggests new features or improvements aligned with the project's apparent goals.

**Input**: `RepoStructure`, Architect Agent summary, Documentation Agent output, existing issues/roadmap files if present.

**Output**: Ranked list of feature suggestions with rationale and rough implementation complexity.

**Internal Workflow**:
1. Infer project purpose and current maturity from structure and docs.
2. Prompt AI provider to propose features that extend (not contradict) the existing architecture.
3. Rank suggestions by estimated effort vs. impact.

**Prompt Strategy**: Provides a condensed "project brief" (purpose, stack, current features) rather than raw code, keeping suggestions strategic rather than implementation-detail-focused.

**Failure Handling**: Non-critical path — on failure, the Report Generator simply omits the Feature Suggestions section rather than blocking the rest of the report.

**Communication with Other Agents**: Depends on Architect and Documentation agents. Feeds into Report Generator.

---

## 9. Reviewer Agent

**Purpose**: Implements the Reviewer Agent Loop described in Core Architectural Principles above. Cross-checks and critiques the outputs of Bug Hunter, Security, Performance, Architect, and Documentation agents to reduce false positives, catch low-confidence claims, and improve output quality before anything reaches the user.

**Input**: Raw outputs from Bug Hunter, Security, Performance, Architect, and Documentation agents (each already carrying `reasoning`/`confidence`/`evidence`/`referenced_files` per the explainability requirement).

**Output**: For each reviewed item — a status of `approved`, `rewritten_and_approved`, or `flagged_low_confidence`, plus the (possibly rewritten) content and an updated confidence score.

**Internal Workflow** (the loop):
1. **Review** — evaluate the item against its own stated evidence: does the evidence actually support the claim? Is confidence well-calibrated?
2. **Feedback** — if below the confidence threshold, generate specific, structured feedback (what's wrong, what's missing) rather than a generic rejection.
3. **Rewrite** — the feedback is sent back to the originating agent's prompt (re-invoked with the original input plus the feedback) to produce a revised output.
4. **Validate** — the revised output is reviewed again against the same threshold.
5. **Approve** — items that pass are marked `approved`; items that fail a bounded number of rewrite attempts (default: 1 retry) are marked `flagged_low_confidence` and still shown to the user, clearly labeled, rather than silently discarded — transparency over hiding uncertainty.

**Prompt Strategy**: Presents each item alongside its source snippet/evidence and asks for a confidence score plus structured justification; batched to review multiple items per call where context allows. Rewrite invocations reuse the originating agent's prompt template with an appended feedback block.

**Failure Handling**: If the review step itself fails (provider outage), the item is passed through unreviewed but explicitly marked `unreviewed` — never silently presented as reviewed-and-approved.

**Communication with Other Agents**: Downstream of Bug Hunter, Security, Performance, Architect, and Documentation agents; can call back into any of them for a rewrite pass. Its output — not the raw agent output — is what the Report Generator and frontend use, and is what powers the review-history shown in the Agent Timeline.

---

## 10. Report Generator

**Purpose**: Consolidates all agent outputs into a single, coherent, exportable report.

**Input**: Outputs from all other agents (Architect, Documentation, Reviewer-validated findings, Learning highlights, Feature Suggestions).

**Output**: Final structured report (Markdown, exportable to PDF) covering architecture, documentation, validated findings by category, and recommendations.

**Internal Workflow**:
1. Collect all finalized agent outputs from shared state.
2. Organize into a consistent report structure with a summary section up front.
3. Render to Markdown; frontend/export layer handles PDF conversion.

**Prompt Strategy**: Primarily templating and assembly rather than heavy AI generation; AI is used only to write a concise executive summary tying findings together.

**Failure Handling**: If the executive-summary generation step fails, the report still renders with all structured sections (findings, docs, graph) and a placeholder note in place of the narrative summary — assembly never blocks on the AI step.

**Communication with Other Agents**: Terminal node — depends on nearly all other agents; runs last. Also assembles the Repository Health Score from each category's approved findings and confidence scores.

### Repository Health Score

The Report Generator rolls approved findings into a single top-line score plus its components:

| Sub-Score | Derived From |
|---|---|
| Architecture Score | Architect Agent's pattern/anti-pattern findings, Knowledge Graph structural metrics (coupling, layering violations) |
| Documentation Score | Documentation Agent coverage (% of modules documented) and Reviewer-approved accuracy |
| Security Score | Security Agent findings, weighted by severity |
| Performance Score | Performance Agent findings, weighted by severity and centrality of affected modules |
| Maintainability Score | Bug Hunter findings density, code smell frequency |
| Testing Score | Presence/coverage signal from Repository Analyzer's structural scan (test file ratio; deeper coverage analysis is future scope) |
| **Overall Health Score** | Weighted aggregate of the above six |

Each sub-score is itself explainable — it links back to the specific approved findings that produced it, consistent with the explainability principle above. For the MVP, Architecture and Documentation scores are fully live; the remaining sub-scores populate as their source agents come online per IMPLEMENTATION_PLAN.md.

---

## LangGraph Orchestration Flow

```
                         ┌────────────────────┐
                         │  Planner Agent       │
                         │ (execution plan)     │
                         └──────────┬──────────┘
                                    │
                         ┌──────────▼──────────┐
                         │ Repository Analyzer │
                         └──────────┬──────────┘
                                    │
                 ┌──────────────────┼──────────────────┐
                 ▼                  ▼                  ▼
        ┌────────────────┐ ┌────────────────┐ ┌──────────────────┐
        │ Architect Agent │ │  Bug Hunter     │ │  Security Agent   │
        └────────┬────────┘ └────────┬────────┘ └─────────┬─────────┘
                 │                   │                     │
                 │          ┌────────▼────────┐            │
                 │          │ Performance      │            │
                 │          │ Agent            │            │
                 │          └────────┬────────┘            │
                 │                   │                     │
                 │                   └──────────┬──────────┘
                 ▼                              ▼
        ┌────────────────┐            ┌──────────────────┐
        │ Documentation   │            │ Reviewer Agent     │
        │ Agent           │            │ (Review→Feedback→  │
        └────────┬────────┘            │ Rewrite→Validate→  │
                 │                     │ Approve)            │
                 │                     └─────────┬─────────┘
                 │                                │
                 ▼                                │
        ┌────────────────┐                        │
        │ Feature         │                        │
        │ Suggestion Agent│                        │
        └────────┬────────┘                        │
                 │                                │
                 └───────────────┬────────────────┘
                                 ▼
                       ┌──────────────────┐
                       │ Report Generator  │
                       └──────────────────┘

  (Learning Agent runs on-demand, outside the main graph,
   triggered interactively from the frontend.)
```

**Execution model**:
- Planner Agent is the single required entry node; it configures scope/parameters for downstream agents but does not alter graph topology.
- Repository Analyzer runs next, with no agent dependencies of its own beyond the plan.
- Architect, Bug Hunter, and Security agents run in parallel branches once structural data is available.
- Performance Agent depends on Bug Hunter completing (to avoid duplicate low-level scanning) and runs after it.
- Documentation Agent depends on Architect Agent's summary and passes through the Reviewer Agent Loop.
- Feature Suggestion Agent depends on Documentation Agent.
- Bug Hunter, Security, and Performance findings converge into the Reviewer Agent Loop for validation (and possible rewrite) before continuing.
- Report Generator is the final join node, waiting on Documentation, Feature Suggestion, and Reviewer-approved outputs before assembling the report and Repository Health Score.
- Shared state is a single typed object (`AnalysisState`) passed through the graph; each agent reads only the fields it depends on and writes only its own output field — preventing cross-agent side effects. Every field written by an analysis agent includes the `reasoning`/`confidence`/`evidence`/`referenced_files` explainability schema.
- The Agent Timeline UI (frontend) subscribes to `AnalysisState` transitions and renders each agent's status, decisions, execution logs, confidence scores, and — for reviewed items — full review history (original → feedback → rewrite → final).

---

## Changes Made

- Added a new Planner Agent (item 0) that produces an execution plan before any analysis agent runs, with its own failure-handling fallback.
- Added a "Core Architectural Principles" section formalizing the Reviewer Agent Loop (Review → Feedback → Rewrite → Validate → Approve) and the explainability schema (`reasoning`/`confidence`/`evidence`/`referenced_files`) as requirements applying to every agent, rather than one-off additions.
- Expanded the existing Reviewer Agent (item 9) from a single-pass cross-check into the full formal loop, including bounded retry behavior and `flagged_low_confidence` handling for transparency.
- Added a "Failure Handling" subsection to every one of the original 10 agents, describing graceful degradation rather than hard failure wherever possible.
- Added a Repository Health Score subsection under Report Generator, defining all seven scores (six sub-scores + overall) and how each is derived, with MVP scope noted.
- Updated the LangGraph Orchestration Flow diagram and execution model bullets to include the Planner Agent as entry node and the Reviewer Agent Loop's internal stages, and added a note on how the Agent Timeline UI consumes shared state.
- All original agent Purpose/Input/Output/Internal Workflow/Prompt Strategy content and the original 9-agent structure preserved unchanged; nothing removed, only extended.
