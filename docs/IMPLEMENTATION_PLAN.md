# IMPLEMENTATION_PLAN.md — RepoMind AI

Roadmap optimized for a working MVP within **one week** for the OpenAI Codex India Hackathon 2026, followed by post-MVP hardening and expansion phases.

## Priority Breakdown (MoSCoW)

| Priority | Items |
|---|---|
| **Must Have** | Provider Layer + failover, Repository Analyzer, Knowledge Graph, Planner Agent, Architect Agent, Bug Hunter Agent, Documentation Agent, Reviewer Agent Loop, Report Generator, frontend agent dashboard + results workspace, Vercel/Render/Supabase deployment |
| **Should Have** | Commit-based caching, Markdown export, explainability fields surfaced in UI (reasoning/confidence/evidence), Agent Timeline with review history, initial Repository Health Score (Architecture + Documentation sub-scores) |
| **Nice to Have** | Security Agent, Performance Agent (both scoped down if time allows within the week), PDF export, Adaptive AI Routing beyond simple failover |
| **Future** | Learning Agent, Feature Suggestion Agent, full Repository Health Score (all six sub-scores), Auth/private repos, CI/CD integration, multi-repo comparison, VS Code extension |

This maps directly onto the phases below — every "Must Have" item is scheduled within Phases 0–6; "Should Have" items are folded in where time allows without threatening the demo-critical path; "Nice to Have" and "Future" items are explicitly deferred to Post-MVP phases.

---

## Phase 0 — Foundation Setup (Day 1, Morning)

**Goals**: Get both apps scaffolded and talking to each other with the architecture rules enforced from the start.

**Features**: Project scaffolding only, no user-facing functionality.

**Deliverables**:
- Next.js frontend scaffolded with TypeScript, TailwindCSS, shadcn/ui installed
- FastAPI backend scaffolded with the Clean Architecture folder structure (api/services/repositories/agents/providers/core)
- Supabase project created; connection wired via a repository-layer client
- Dependency injection container set up in the backend
- Basic health-check endpoint and matching frontend ping to confirm connectivity
- `.env` templates for both apps, no secrets committed

**Dependencies**: None.

---

## Phase 1 — AI Provider Layer (Day 1, Afternoon)

**Goals**: Build the provider abstraction before any agent touches an AI call, so the "no direct provider calls" rule is structurally enforced.

**Features**:
- `ProviderInterface` contract
- Adapters for at least 2 providers at MVP time (e.g., Gemini + Groq), with interface support for all 5
- `ProviderRouter` with priority-ordered failover logic
- Provider usage logging

**Deliverables**:
- Working `generate()` call through the router, tested against both live providers
- Automatic failover verified by simulating a provider failure

**Dependencies**: Phase 0 backend scaffold.

---

## Phase 2 — Repository Ingestion & Structural Analysis (Day 2)

**Priority**: Must Have

**Goals**: Turn a GitHub URL into structured, analyzable data — the Repository Knowledge Graph everything else reasons over.

**Features**:
- Repo cloning via GitPython
- File tree walk + language classification
- Tree-sitter parsing for symbol extraction
- NetworkX dependency graph construction (the Repository Knowledge Graph: files, folders, imports, dependencies, call relationships, classes, functions)
- Repository Analyzer agent implemented end-to-end
- Planner Agent implemented (lightweight pre-scan + execution plan, per AGENTS.md), running ahead of Repository Analyzer

**Deliverables**:
- `POST /repos/analyze` accepts a URL and returns a structural summary
- Knowledge Graph persisted to Supabase (`repositories`, `analysis_runs` tables live)
- Planner Agent produces a visible `ExecutionPlan` consumable by the frontend Agent Timeline

**Dependencies**: Phase 0 (backend, DB), Phase 1 (not directly required for this agent, but interface must exist).

---

## Phase 3 — Core Agent Team + LangGraph Orchestration (Day 3–4)

**Priority**: Must Have

**Goals**: Get the MVP agent subset running as a coordinated pipeline, including the Reviewer Agent Loop as a first-class step — not an afterthought.

**Features**:
- LangGraph graph definition with shared `AnalysisState`, including the explainability schema (`reasoning`/`confidence`/`evidence`/`referenced_files`) on every agent output
- Architect Agent (architecture summary + graph data)
- Bug Hunter Agent (findings with severity)
- Documentation Agent (generated docs)
- Reviewer Agent implementing the full loop (Review → Feedback → Rewrite → Validate → Approve) over Architect, Bug Hunter, and Documentation outputs
- Report Generator (consolidated Markdown report, including initial Repository Health Score from Architecture + Documentation sub-scores)
- Planner-configured orchestration: sequential + one parallel branch (Architect and Bug Hunter in parallel after Repository Analyzer), scoped by the Phase 2 Planner Agent's plan

**Deliverables**:
- `POST /analysis/run` triggers the full graph and returns a run ID
- Results retrievable per agent via `GET /analysis/{runId}/results`
- End-to-end run against a real public repo producing all MVP agent outputs, each carrying review status (`approved` / `rewritten_and_approved` / `flagged_low_confidence`)

**Dependencies**: Phase 1 (Provider Layer), Phase 2 (structural data, Planner Agent).

---

## Phase 4 — Frontend Workspace (Day 4–5)

**Priority**: Must Have (core workspace); Should Have (explainability surfacing, full Agent Timeline detail)

**Goals**: Give users a working interface to trigger and view analysis, with the agentic reasoning visibly on display — this is the phase that carries most of the Demo Quality score.

**Features**:
- Landing page with repo URL input
- Agent Timeline: live agent status dashboard (polling or WebSocket-driven) showing each agent's state, and — for reviewed items — review history (original → feedback → rewrite → final)
- Tabbed results workspace: Architecture (React Flow Knowledge Graph), Docs, Bugs, Report
- Monaco Editor code viewer wired to findings (click finding → jump to file/line)
- Explainability surfacing: each finding/insight card shows reasoning, confidence score, evidence, and referenced files (Should Have — build the data plumbing in Phase 3, prioritize this rendering if time is tight)

**Deliverables**:
- Full user journey working: paste URL → watch Planner produce a plan → watch agents run → explore results with explainability → view report
- Responsive layout using shadcn/ui components

**Dependencies**: Phase 3 (backend API surface must exist).

---

## Phase 5 — Caching, Export, and Polish (Day 6)

**Priority**: Must Have (caching, Markdown export, error states); Nice to Have (PDF export)

**Goals**: Make repeated use efficient and outputs shareable.

**Features**:
- Commit-based caching for repo structure and agent results
- Markdown export of final report
- Error states and retry handling in the frontend (failed agent, provider outage)
- Loading/empty states polish

**Deliverables**:
- Re-analyzing an unchanged repo returns cached results instantly
- Report download working end-to-end
- Graceful degradation when a provider fails mid-run

**Dependencies**: Phase 3 (results to cache/export), Phase 4 (UI to surface states).

---

## Phase 6 — Deployment & MVP Launch (Day 7)

**Priority**: Must Have

**Goals**: Ship the MVP to production infrastructure and rehearse the Demo Flow from PROJECT.md end-to-end before submission.

**Features**:
- Frontend deployed to Vercel
- Backend deployed to Render
- Supabase production project configured with environment separation
- Basic monitoring/logging in place

**Deliverables**:
- Publicly accessible MVP URL
- Smoke-tested end-to-end flow on production infrastructure
- README/deployment notes for future contributors

**Dependencies**: All prior phases functionally complete.

---

## Post-MVP Phases (Future Scope)

### Phase 7 — Remaining Agent Team
**Priority**: Nice to Have (Security Agent, Performance Agent — attempt within the week if Phases 0–6 land early) / Future (Learning Agent, Feature Suggestion Agent).

Add Security Agent, Performance Agent, Learning Agent (on-demand), and Feature Suggestion Agent; extend the Reviewer Agent Loop to cover Security and Performance findings; expand LangGraph orchestration to the full 10-agent flow described in AGENTS.md. Complete the remaining Repository Health Score sub-scores (Security, Performance, Maintainability, Testing) as each source agent comes online.

### Phase 8 — Adaptive Routing & Auth
**Priority**: Future.

Expand the Provider Router from priority-order failover into full cost/speed/complexity-aware Adaptive AI Routing (see ARCHITECTURE.md). GitHub OAuth integration, private repo access, per-user analysis history, Supabase row-level security.

### Phase 9 — Collaboration & Integrations
**Priority**: Future.

CI/CD integration (PR-triggered analysis), team workspaces, VS Code extension, multi-repo comparison.

---

## Changes Made

- Added a "Priority Breakdown (MoSCoW)" table up front, classifying every major feature as Must/Should/Nice/Future, mapped onto the existing phase structure rather than replacing it.
- Added `**Priority**` tags to each phase heading so the priority classification is visible in-line, without altering phase goals, features, deliverables, or dependencies that were already correct.
- Folded the new Planner Agent into Phase 2 and the Reviewer Agent Loop into Phase 3, since both are now part of the Must Have MVP core per AGENTS.md, instead of leaving them implicit.
- Added explainability-field and Agent Timeline detail to Phase 4 as a Should Have, called out separately from the Must Have core workspace so scope can flex under time pressure without cutting the demo-critical path.
- Reclassified Phase 7 (originally "Remaining Agent Team") to distinguish Security/Performance Agents (Nice to Have, attempt if ahead of schedule) from Learning/Feature Suggestion Agents (Future), and folded in completion of the remaining Health Score sub-scores.
- Renamed the old Phase 8 to "Adaptive Routing & Auth" to include the Adaptive AI Routing Engine expansion alongside the original Auth & Private Repos scope, both marked Future.
- All original phase day-ranges, goals, and core deliverables preserved unchanged.
