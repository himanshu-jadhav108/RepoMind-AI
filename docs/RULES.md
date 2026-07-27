# RULES.md — RepoMind AI Engineering Rules

## Coding Standards

- **TypeScript** (frontend): strict mode enabled; no `any` without an explicit inline justification comment; prefer explicit return types on exported functions.
- **Python** (backend): type hints required on all function signatures; Pydantic models for all request/response schemas; format with `black`, lint with `ruff`.
- Functions should do one thing; prefer composition over deeply nested logic.
- No commented-out code committed to the repo — delete it, git history preserves it.
- No magic numbers/strings — extract to named constants or config.

## Naming Conventions

- **Files**: `kebab-case` for frontend files/folders, `snake_case` for Python files.
- **React components**: `PascalCase` (e.g., `AgentStatusCard.tsx`).
- **Python classes**: `PascalCase` (e.g., `AnalysisService`).
- **Python functions/variables**: `snake_case`.
- **TypeScript variables/functions**: `camelCase`.
- **Agents**: named consistently as `<Domain>Agent` in code (e.g., `BugHunterAgent`) matching AGENTS.md terminology exactly.
- **API routes**: plural nouns, versioned under `/api/v1/...`, matching API.md exactly.
- **Database tables**: `snake_case`, plural (e.g., `analysis_runs`).

## Folder Organization

- Follow the feature-based structure defined in ARCHITECTURE.md exactly — do not introduce ad hoc top-level folders.
- Backend: strict layer separation — `api/` never imports from `repositories/` directly; it must go through `services/`.
- Agents live only in `agents/`; orchestration logic lives only in `orchestration/`. Agents must not import LangGraph graph definitions.
- Frontend feature modules are self-contained: a feature's components, hooks, and types stay within its folder; shared code goes in `lib/` or `components/ui/`.

## Error Handling

- Backend: all service-layer exceptions are typed (custom exception classes), never bare `Exception`. API layer maps typed exceptions to appropriate HTTP status codes via a centralized exception handler.
- Every agent call is wrapped with a timeout and a defined failure path that still allows the LangGraph run to continue (partial results over total failure).
- Frontend: every data-fetching hook must handle loading, error, and empty states explicitly — no silent failures.
- Provider failures must trigger the Provider Router's failover logic before surfacing an error to the agent layer.

## Logging

- Structured logging only (JSON logs), never plain string concatenation for log messages.
- Log at agent boundaries: agent start, agent complete, agent failure, with `run_id` and `agent_name` in every log line for traceability.
- Log every provider call: provider used, latency, success/failure, token usage (no prompt/response content in logs by default — see Security Rules).
- No `print()` statements in backend code — use the configured logger.

## AI Provider Usage Rules

- **No business logic may call an AI provider SDK directly.** All AI calls go through `ProviderInterface` via the `ProviderRouter`.
- Agents depend on the interface, injected via the DI container — never instantiate a provider adapter directly inside an agent.
- Every provider adapter must implement full interface parity (same method signatures) so failover is transparent to callers.
- Provider priority order is configuration, not hardcoded — changeable without code changes.
- Prompts must request structured (JSON) output wherever the consumer is code, not a human reading free text.
- Token budgets per agent call should be estimated and capped before sending; oversized inputs get summarized/truncated by the calling service, not by the provider.

## LangGraph Rules

- Every agent reads only the `AnalysisState` fields it depends on and writes only its own output field — no agent mutates another agent's field, even during a Reviewer Agent rewrite (rewrites go through the originating agent, not a direct state edit).
- Graph topology (which nodes exist and their static edges) is defined once in `orchestration/graph.py`; the Planner Agent may configure scope/parameters within that topology but must never add or remove edges at runtime.
- Every node must be idempotent with respect to caching: re-running a node with unchanged input and an unchanged commit must produce a cache hit, not a fresh AI call.
- Parallel branches must not share mutable state — each parallel node writes to a distinct field so results can merge without races.
- Every node has an explicit timeout; a node that exceeds it fails into its documented Failure Handling path from AGENTS.md rather than hanging the graph.
- The Reviewer Agent Loop's rewrite path is bounded (default: 1 retry) and must be enforced in the graph itself, not left to agent-level convention, to guarantee the graph always terminates.

## Prompt Engineering Rules

- Every agent prompt requesting structured data must specify the exact JSON schema expected and instruct the model to return JSON only, no prose wrapper.
- Prompts must request the explainability fields (`reasoning`, `confidence`, `evidence`, `referenced_files`) explicitly wherever an agent output feeds Report Generator or the frontend — never bolt these on after the fact.
- Prompts are versioned alongside code (stored as templates in the agent's module, not inline strings scattered through logic) so prompt changes are reviewable in PRs like any other code change.
- Prefer few-shot examples over long instructional prose when steering output format; keep system-style instructions short and testable.
- Never interpolate raw, unescaped user-controlled repository content directly into a prompt without a clear delimiter — treat repository code as untrusted input from a prompt-injection standpoint, even though RepoMind never executes it.
- Reviewer Agent rewrite prompts must include the specific feedback from the review step, not just "try again" — vague retries waste tokens and rarely improve output.

## Security Rules

- No secrets (API keys, DB credentials) committed to the repo — environment variables only, `.env` files gitignored.
- Cloned repositories are processed in an isolated, ephemeral workspace per run; never executed — RepoMind reads and parses code, it never runs it.
- Sanitize all user-supplied input (repo URLs) before use in shell commands or file paths to prevent injection.
- AI provider prompts/responses containing source code are not logged in full; only metadata (tokens, latency, status) is logged by default.
- Supabase row-level security enforced once auth is introduced; no direct client-side database access for analysis data — always via backend API.
- Dependency manifests scanned by the Security Agent are read-only inputs; RepoMind never installs a target repo's dependencies.

## Performance Rules

- Repo-level caching (by `repo_url + commit_sha`) is mandatory before any full re-analysis — check cache first, always.
- Tree-sitter parsing and dependency graph construction happen once per commit and are shared across agents via shared state, never re-parsed per agent.
- Agents that can run in parallel (per the LangGraph orchestration flow) must not be arbitrarily serialized in implementation.
- Large repos: Repository Analyzer must apply sensible limits (e.g., max files deeply parsed) with graceful degradation rather than timing out the whole run.
- Frontend: paginate/virtualize long findings lists; do not render unbounded lists directly.

## Git Commit Convention

- Commit messages: `<type>(<scope>): <summary>` (e.g., `feat(agents): add bug hunter agent`), types limited to `feat`, `fix`, `refactor`, `docs`, `test`, `chore`.
- Scope should name the affected module or agent (e.g., `feat(planner-agent): add pre-scan step`, `fix(api): correct findings pagination`).
- Summary is imperative mood, lowercase, no trailing period (e.g., `add reviewer agent rewrite loop`, not `Added the rewrite loop.`).
- Each commit should be a single logical change; avoid bundling unrelated fixes into one commit even within the same PR.

## Branch Naming Convention

- `feature/<short-description>` for new functionality (e.g., `feature/planner-agent`, `feature/health-score-api`).
- `fix/<short-description>` for bug fixes.
- `refactor/<short-description>` for non-behavioral restructuring.
- `docs/<short-description>` for documentation-only changes (including edits to this file set).
- Branch names are `kebab-case`, no ticket numbers required for a solo hackathon build, but phase references are encouraged where useful (e.g., `feature/phase3-reviewer-loop`).

## Git Workflow

- `main` is always deployable. Feature work happens on the branches named per Branch Naming Convention above.
- No direct commits to `main` once collaborators are involved — pull requests only, even for solo development once the project stabilizes past MVP.
- Each PR should map to one phase/feature from IMPLEMENTATION_PLAN.md where possible, not an unrelated grab-bag of changes.

## Testing Guidelines

- Backend: unit tests for services and repositories with mocked dependencies (especially mocked `ProviderInterface` — tests never call real AI providers).
- Agent logic tested by feeding fixed `RepoStructure` fixtures and asserting on output shape, not exact AI wording (AI output is non-deterministic — assert structure/schema, not content).
- Reviewer Agent Loop tested explicitly: feed a fixture below the confidence threshold and assert the rewrite path triggers exactly once before either approval or `flagged_low_confidence`, per the bounded-retry rule in LangGraph Rules.
- Integration test: at least one end-to-end run against a small, stable public test repository, run in CI.
- Frontend: component tests for critical interactive elements (repo input form, findings list filtering, Agent Timeline status transitions); avoid over-testing static presentational components.
- Provider adapters tested against interface contract compliance, not live API calls, in the standard test suite.
- Given the one-week timeline, prioritize integration coverage of the happy path end-to-end run over exhaustive unit coverage of every branch — breadth of confidence over depth, for hackathon scope.

## Documentation Standards

- This six-file documentation set (PROJECT, ARCHITECTURE, AGENTS, IMPLEMENTATION_PLAN, API, RULES) is the source of truth; code should follow it, and any deliberate deviation during implementation must be reflected back into the relevant doc, not left to drift silently.
- Every document that is revised carries a "Changes Made" section at the end summarizing what changed and why, so the documentation's own history stays legible without relying on git blame.
- Docstrings required on every public service method, agent class, and provider adapter — one-line purpose minimum, matching the Purpose/Input/Output framing used in AGENTS.md.
- API documentation (API.md) must stay in exact sync with actual FastAPI route definitions — route, method, and schema drift between code and docs is treated as a bug.
- README at the repo root stays short and points into `docs/` for anything beyond setup instructions, rather than duplicating content that already lives in this documentation set.

## UI Consistency Rules

- All UI built from shadcn/ui primitives + Tailwind tokens — no ad hoc inline styles or competing component libraries.
- Severity levels (low/medium/high/critical) use one consistent color mapping across every panel (Bugs, Security, Performance, Report).
- Agent status (queued/running/completed/failed) uses one consistent visual language (badge/icon set) everywhere it appears.
- Code references (file + line) are always rendered as clickable links into the Monaco viewer — never plain text.
- Loading and empty states are required for every data-driven view before it ships — no view ships with only the "happy path" implemented.

---

## Changes Made

- Added a new **LangGraph Rules** section covering state-mutation boundaries, static topology, idempotency/caching, parallel-branch isolation, node timeouts, and bounded Reviewer Agent Loop retries — enforcing AGENTS.md's orchestration model at the rules level.
- Added a new **Prompt Engineering Rules** section covering structured-output requirements, mandatory explainability fields, prompt versioning as code, few-shot preference, prompt-injection hygiene for untrusted repo content, and specific (not vague) rewrite feedback for the Reviewer Agent Loop.
- Split the original **Git Workflow** section into **Git Commit Convention** (message format, scope, imperative summaries) and **Branch Naming Convention** (prefix scheme, kebab-case, phase references), with a slimmer Git Workflow section retained for the remaining process rules — original commit message format preserved exactly.
- Renamed **Testing Strategy** to **Testing Guidelines** and extended it with explicit Reviewer Agent Loop test coverage and an explicit hackathon-scope prioritization note (breadth over depth given the one-week timeline); all original bullets preserved.
- Added a new **Documentation Standards** section establishing this doc set as source of truth, requiring "Changes Made" sections on revision (this file included), docstring expectations, API-doc/code sync, and README scope.
- All original sections (Coding Standards, Naming Conventions, Folder Organization, Error Handling, Logging, AI Provider Usage Rules, Security Rules, Performance Rules, UI Consistency Rules) preserved unchanged in content and order.
