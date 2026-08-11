# ARCHITECTURE.md — RepoMind AI

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Frontend (Next.js)                       │
│  URL Input → Live Agent Dashboard → Results Workspace → Export   │
└───────────────────────────────┬───────────────────────────────────┘
                                 │ REST / WebSocket
┌───────────────────────────────▼───────────────────────────────────┐
│                        Backend (FastAPI)                          │
│  ┌───────────────┐  ┌──────────────────┐  ┌────────────────────┐ │
│  │ API Layer      │→│ Service Layer     │→│ Repository Layer    │ │
│  │ (Routes)       │  │ (Use Cases)       │  │ (Data Access)      │ │
│  └───────────────┘  └────────┬──────────┘  └──────────┬─────────┘ │
│                               │                          │         │
│                     ┌─────────▼─────────┐      ┌─────────▼───────┐│
│                     │ LangGraph          │      │ Supabase        ││
│                     │ Orchestration       │      │ (Postgres)      ││
│                     │ (Agent Team)        │      └─────────────────┘│
│                     └─────────┬─────────┘                          │
│                               │                                    │
│                     ┌─────────▼─────────┐                          │
│                     │ AI Provider Layer  │                          │
│                     │ (Gemini/Groq/      │                          │
│                     │ OpenAI/HF/         │                          │
│                     │ OpenRouter)         │                          │
│                     └────────────────────┘                          │
│                                                                     │
│  ┌────────────────────────────────────────────────────────────┐   │
│  │ Repository Analysis Toolkit: GitPython, Regex Symbol Parser, NetworkX│   │
│  └────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

Analysis is triggered by a repo URL, executed as an asynchronous LangGraph run, and streamed back to the frontend as agent-by-agent updates. All AI calls route through a single Provider Layer so business logic is provider-agnostic.

## Data Flow Diagram

```
Repo URL
   │
   ▼
Repo Ingestion (GitPython clone) ──▶ Symbol Extraction (Regex Symbol Parser)
   │                                          │
   │                                          ▼
   │                              Repository Knowledge Graph (NetworkX)
   │                                          │
   ▼                                          ▼
Planner Agent  ◀────────────────  Shared AnalysisState (LangGraph)
   │
   ▼
Analysis Agents (parallel + dependent branches)
   │
   ▼
Reviewer Agent Loop (Review → Feedback → Rewrite → Validate → Approve)
   │
   ▼
Report Generator ──▶ Supabase (persist) ──▶ Frontend (stream + final report)
```

Every arrow into an agent box also passes through the AI Provider Layer when that step requires model inference; deterministic steps (cloning, parsing, graph construction) do not.

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend Framework | Next.js (App Router), TypeScript |
| Styling / UI | TailwindCSS, shadcn/ui |
| Graph Visualization | React Flow |
| Code Viewer | Monaco Editor |
| Backend Framework | FastAPI (Python) |
| AI Orchestration | LangGraph |
| Repo Parsing | GitPython, Regex Symbol Parser |
| Dependency Graphing | NetworkX |
| Database / Auth | Supabase (Postgres + Auth + Storage) |
| Frontend Hosting | Vercel |
| Backend Hosting | Render |

## Folder Structure

```
repomind-ai/
├── frontend/
│   ├── app/
│   │   ├── (marketing)/            # Landing page
│   │   ├── analyze/[runId]/        # Live analysis workspace
│   │   ├── reports/[runId]/        # Final report view
│   │   └── api/                    # Next.js route handlers (BFF, if needed)
│   ├── features/
│   │   ├── repo-input/
│   │   ├── agent-dashboard/
│   │   ├── architecture-graph/
│   │   ├── code-viewer/
│   │   ├── findings-panels/        # bugs, security, performance, etc.
│   │   └── report-export/
│   ├── components/ui/              # shadcn primitives
│   ├── lib/                        # api client, websocket client, utils
│   └── types/
│
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   ├── v1/
│   │   │   │   ├── routes_repo.py
│   │   │   │   ├── routes_analysis.py
│   │   │   │   └── routes_reports.py
│   │   ├── services/
│   │   │   ├── analysis_service.py
│   │   │   ├── repo_ingestion_service.py
│   │   │   └── report_service.py
│   │   ├── repositories/
│   │   │   ├── analysis_repository.py
│   │   │   └── repo_metadata_repository.py
│   │   ├── agents/
│   │   │   ├── base_agent.py
│   │   │   ├── planner_agent.py
│   │   │   ├── repository_analyzer.py
│   │   │   ├── architect_agent.py
│   │   │   ├── documentation_agent.py
│   │   │   ├── bug_hunter_agent.py
│   │   │   ├── security_agent.py
│   │   │   ├── performance_agent.py
│   │   │   ├── learning_agent.py
│   │   │   ├── feature_suggestion_agent.py
│   │   │   ├── reviewer_agent.py
│   │   │   └── report_generator_agent.py
│   │   ├── orchestration/
│   │   │   ├── graph.py            # LangGraph definition
│   │   │   └── state.py            # Shared graph state schema
│   │   ├── providers/
│   │   │   ├── provider_interface.py
│   │   │   ├── gemini_provider.py
│   │   │   ├── groq_provider.py
│   │   │   ├── openai_provider.py
│   │   │   ├── huggingface_provider.py
│   │   │   ├── openrouter_provider.py
│   │   │   └── provider_router.py  # Failover logic
│   │   ├── analysis_toolkit/
│   │   │   ├── git_ingestion.py    # GitPython
│   │   │   ├── code_parser.py      # Tree-sitter
│   │   │   └── dependency_graph.py # NetworkX
│   │   ├── core/
│   │   │   ├── config.py
│   │   │   ├── dependency_injection.py
│   │   │   └── logging.py
│   │   └── models/                 # Pydantic schemas + DB models
│   └── tests/
│
└── docs/                            # This documentation set
```

## Frontend Design

- **App Router** with route segments per workflow stage: input → live analysis → report.
- **Feature-based structure**: each capability (agent dashboard, architecture graph, code viewer) is a self-contained feature module with its own components, hooks, and types.
- **Live updates** consumed via WebSocket/SSE from the backend, rendered as agent "cards" transitioning through states (queued → running → complete → failed).
- **React Flow** renders the module dependency graph produced by the Architect Agent, with clickable nodes linking into the Monaco code viewer.
- **shadcn/ui** provides consistent primitives (tabs, cards, badges, dialogs) styled via Tailwind design tokens.

## Backend Design

Follows **Clean Architecture** with strict layer boundaries:

1. **API Layer** — FastAPI routers; only handles HTTP concerns (validation, status codes, serialization). No business logic.
2. **Service Layer** — Use-case orchestration (e.g., `AnalysisService.start_run()`); coordinates repositories, the analysis toolkit, and the LangGraph orchestration.
3. **Repository Layer** — Data access abstraction over Supabase; services never touch the database client directly.
4. **Agent Layer** — Each agent is a discrete unit implementing a common `BaseAgent` interface; agents receive shared graph state and return structured findings.
5. **Provider Layer** — Sole gateway to external AI providers; enforces the rule that business logic never calls a provider directly.

**Dependency Injection** wires services, repositories, and the provider router at startup, keeping components testable and swappable.

## Database Design

Core Supabase (Postgres) tables:

| Table | Purpose |
|---|---|
| `repositories` | Metadata for each analyzed repo (URL, owner, default branch, last analyzed) |
| `analysis_runs` | One row per analysis execution (status, timestamps, triggering user) |
| `agent_results` | One row per agent per run (agent name, status, output JSON, tokens used) |
| `findings` | Normalized findings across agents (type, severity, file, line, description) |
| `reports` | Final generated report content and export metadata per run |
| `provider_usage` | Logs of which provider handled which agent call, for failover auditing |

Row-level security scopes data access per user/session once auth is introduced (post-MVP).

## AI Provider Layer

- A single `ProviderInterface` defines the contract (`generate()`, `stream()`, capability flags).
- Each provider (Gemini, Groq, OpenAI, Hugging Face, OpenRouter) implements this interface in its own adapter.
- A `ProviderRouter` selects the active provider per call, based on configured priority order, and **automatically fails over** to the next provider on error, rate limit, or timeout.
- Agents depend only on `ProviderInterface`, never on a concrete provider — enforced by dependency injection at the agent layer.
- Provider selection and failover events are logged to `provider_usage` for observability.

## Deployment Architecture

```
┌────────────────┐        HTTPS        ┌──────────────────┐        ┌──────────────────┐
│  Vercel          │ ◀── REST/WS ─────▶ │  Render            │ ◀────▶ │  Supabase          │
│  (Next.js SSR/CSR)│                    │  (FastAPI service) │        │  (Postgres+Auth)   │
└────────────────┘                     └──────────────────┘        └──────────────────┘
                                                  │
                                                  ▼
                                        ┌──────────────────┐
                                        │  External AI       │
                                        │  Providers (via     │
                                        │  Provider Layer)    │
                                        └──────────────────┘
```

- **Frontend**: Next.js app deployed to Vercel, connected to the backend via REST/WebSocket over HTTPS.
- **Backend**: FastAPI app deployed to Render as a web service; long-running analysis jobs run as async background tasks within the same service for MVP (dedicated worker/queue is future scope).
- **Database**: Supabase-hosted Postgres, accessed by the backend via its service-role client; frontend never talks to Supabase directly for analysis data (goes through backend API).
- **Environment separation**: distinct Render/Vercel/Supabase projects for staging and production.

## Rate Limiting & Resource Protection

To ensure the backend API remains reliable and publicly accessible when hosted on free-tier infrastructure:

- **Shared Free-Tier LLM Key Protection**: All demo visitors share common free-tier AI provider keys (e.g. Gemini, Groq). Per-IP rate limiting prevents a single user or automated crawler from consuming daily API quotas.
- **Fair Use Policy**: Analysis run triggers (`POST /api/v1/analysis/run`) are limited to **1 run per IP every 10 minutes** by default (`ANALYSIS_RATE_LIMIT_SECONDS = 600`), keeping the live demo available for everyone.
- **Configurable Control**: The interval is configurable via `ANALYSIS_RATE_LIMIT_SECONDS` (lowered for development/demos, raised for production), and `RATE_LIMIT_BYPASS_LOCALHOST` allows local development testing when enabled.
- **User-Friendly Error Handling**: Hits return an `HTTP 429 Too Many Requests` status with a `Retry-After` header and a human-readable JSON message designed for direct frontend display.

## Repository Knowledge Graph

The Repository Analyzer builds a typed graph representation of the codebase, not just a flat dependency list:

- **Nodes**: files, folders, classes, functions/methods.
- **Edges**: folder containment, file imports, class inheritance, function call relationships.
- **Construction**: The multi-language symbol parser (`code_parser.py`) extracts class definitions, methods, and import statements per file; GitPython supplies the file/folder tree; NetworkX assembles nodes and edges into a single directed graph and computes centrality (to prioritize which modules matter most for deeper agent analysis, per RULES.md performance rules).
- **Consumption**: the Architect Agent renders it as the architecture diagram; the Performance Agent uses centrality to prioritize hot-path modules; the frontend renders it interactively via React Flow, with nodes clickable into the Monaco code viewer.
- **Persistence**: serialized per `repo_url + commit_sha` and cached (see Caching Strategy) so it is built once per commit and reused by every agent and by the frontend graph view.

This graph is the structural backbone the rest of the system reasons over — agents query it rather than re-deriving structure independently.

### Multi-Language Symbol Extraction Design Tradeoff

RepoMind AI utilizes a lightweight, regex-based symbol parser (`code_parser.py`) for extracting class definitions, functions, and import statements across 15+ programming languages rather than heavy language-specific Abstract Syntax Tree (AST) parsers (such as `tree-sitter` or Python's native `ast` module). This is a deliberate engineering tradeoff: no single AST library supports 15+ heterogeneous languages uniformly without compiling per-language native C/C++ bindings or introducing heavy external binary dependencies. Regex-based pattern matching provides deterministic, high-throughput symbol and dependency extraction across polyglot codebases while remaining lightweight, fast, and serverless-friendly for free-tier deployments.

## Adaptive AI Routing Engine

The Provider Layer's `ProviderRouter` extends beyond simple priority-order failover (see AI Provider Layer above) into task-aware routing:

- Each agent call is tagged with a **task profile**: complexity (e.g., single-file summarization vs. whole-repo architecture reasoning), latency sensitivity (interactive Learning Agent calls vs. batch Documentation Agent calls), and an approximate token budget.
- The router scores available providers against the task profile using configured weights for **cost, speed, and current availability**, and selects the best fit rather than always the first-priority provider.
- If the top-scoring provider fails or is degraded, the router falls back to the next-best score — the same failover mechanism, now informed by task fit rather than a static list.
- Routing decisions are logged to `provider_usage` alongside the task profile, so routing quality is auditable and tunable after the hackathon demo.
- For the one-week MVP, routing can ship as a simplified weighted scoring function over 2 live providers; full multi-factor optimization across all 5 is future scope (see IMPLEMENTATION_PLAN.md).

## Caching Strategy

- **Repo-level cache**: keyed by `repo_url + commit_sha`; if a repo has already been analyzed at that exact commit, cached `agent_results` are served instantly instead of re-running agents.
- **Parsing cache**: Extracted symbol metadata and the NetworkX dependency graph are cached per commit to avoid redundant parsing across agents that need structural data.
- **Provider response cache**: short-TTL cache for identical prompts (e.g., re-running the same agent during development) to reduce cost during iteration.
- Cache invalidation is commit-based, not time-based — a new commit on the same repo always triggers a fresh run.

---

## Changes Made

- Added a Data Flow Diagram tracing a request from repo URL through ingestion, the Planner Agent, analysis agents, the Reviewer Agent loop, and final report persistence.
- Added a dedicated Repository Knowledge Graph section describing nodes, edges, construction, consumption, and persistence, cross-referenced with existing Caching Strategy and RULES.md.
- Added an Adaptive AI Routing Engine section extending the existing AI Provider Layer's failover logic with cost/speed/complexity-aware scoring, explicitly scoped down for the one-week MVP.
- Added a visual Deployment Diagram alongside the existing prose deployment description (kept the prose unchanged).
- Added `planner_agent.py` to the existing folder structure to reflect the new Planner Agent from AGENTS.md.
- All original sections (High-Level Architecture, Tech Stack, Folder Structure, Frontend/Backend/Database Design, AI Provider Layer, Deployment Architecture, Caching Strategy) preserved with original wording intact.
