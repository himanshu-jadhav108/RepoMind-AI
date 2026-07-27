# RepoMind AI — Autonomous Multi-Agent Repository Intelligence Platform

RepoMind AI is an enterprise-grade, autonomous software engineering intelligence platform. It analyzes codebases using a multi-agent architecture, producing interactive knowledge graphs, structural explanations, security & performance audits, code quality assessments, and exportable engineering reports.

---

## 🌟 Key Features

- **Multi-Agent Orchestration**: Powered by LangGraph with parallel scanning branches and a formal Reviewer Agent Loop (`Review → Feedback → Rewrite → Validate → Approve`).
- **AI Provider Layer & Failover Router**: Supports Google Gemini, Groq, OpenAI, OpenRouter, and HuggingFace with priority failover, execution timeouts, bounded exponential backoff retries, and audit logging.
- **Repository Knowledge Graph**: Builds NetworkX dependency graphs mapping file structures, module imports, class hierarchies, and symbol calls, serialized for React Flow interactive visualization.
- **Explainability by Default**: Every AI-generated finding carries 4 mandatory explainability fields: `reasoning`, `confidence` (0.0–1.0), `evidence` (AST snippet), and `referenced_files`.
- **Repository Health Score**: Calculates an overall health score (0–100) alongside 6 sub-scores (Architecture, Documentation, Security, Performance, Maintainability, Testing).
- **Interactive Code Viewer & Learning Agent**: In-browser code viewer with line numbers, agent annotations, line jumping, and plain-language code region explanations.
- **Exportable Engineering Reports**: One-click export of consolidated audit reports in Markdown (`.md`) and PDF (`.pdf`) formats.

---

## 🏗 System Architecture & Phasing

RepoMind AI is built following **Clean Architecture** principles in the backend and a **Feature-Based** structure in the frontend:

```text
RepoMind-AI/
├── backend/
│   ├── app/
│   │   ├── agents/            # BaseAgent & 10 specialized AI Agents
│   │   ├── analysis_toolkit/  # Git ingestion, AST symbol parser, NetworkX dependency graph
│   │   ├── api/v1/            # REST API endpoints (repos, analysis, findings, stream, reports)
│   │   ├── core/              # Config, domain exceptions, structured logging, DI container
│   │   ├── db/                # Supabase client, SQL migrations, seed scripts
│   │   ├── models/            # Pydantic schemas (repo, analysis, finding, report)
│   │   ├── orchestration/     # LangGraph AnalysisState & StateGraph graph workflow
│   │   ├── providers/         # ProviderInterface, failover router, Gemini/Groq/OpenAI adapters
│   │   ├── repositories/      # Repositories abstract & Supabase/In-memory implementations
│   │   └── services/          # Business logic services (RepoIngestion, Analysis, Report)
│   └── tests/                 # Comprehensive pytest test suite (38 tests passing)
├── frontend/
│   ├── app/                   # Next.js 14 App Router (Landing, Analyze Workspace, Standalone Report)
│   ├── components/ui/         # Glassmorphism UI primitives (Badge, Button, Card)
│   ├── features/              # Feature components (AgentTimeline, KnowledgeGraph, CodeViewer, etc.)
│   ├── lib/                   # API client and utility helpers
│   └── types/                 # TypeScript interfaces
├── docs/                      # Single source of truth documentation (PROJECT.md, ARCHITECTURE.md, etc.)
└── docker-compose.yml         # Containerized local development orchestrator
```

---

## ⚡ Quick Start & Development Setup

### 1. Environment Configuration

Copy `.env.example` in `backend/` to `.env`:

```bash
cp backend/.env.example backend/.env
```

Configure your environment variables in `backend/.env`:

```env
PROJECT_NAME="RepoMind AI"
ENVIRONMENT="development"

# Supabase Postgres Configuration
SUPABASE_URL="https://your-supabase-project.supabase.co"
SUPABASE_SERVICE_ROLE_KEY="your-supabase-service-role-key"

# AI Provider API Keys (At least one key is required for live LLM execution)
GEMINI_API_KEY="your-gemini-api-key"
GROQ_API_KEY="your-groq-api-key"
OPENAI_API_KEY="your-openai-api-key"
OPENROUTER_API_KEY="your-openrouter-api-key"
HUGGINGFACE_API_KEY="your-huggingface-api-key"
```

---

### 2. Database Initialization (Supabase)

RepoMind AI comes with complete SQL migrations and seed scripts:

1. Open your Supabase SQL Editor for your project.
2. Execute the migration SQL script located at:
   `backend/app/db/migrations/001_initial_schema.sql`
3. (Optional) Run the seed script to populate sample data:
   ```bash
   python backend/app/db/seed.py
   ```

*Note: If no Supabase keys are provided, RepoMind AI automatically falls back to an in-memory repository for local offline development.*

---

### 3. Running Locally with Docker Compose

To start both the FastAPI backend (Port 8000) and Next.js frontend (Port 3000) simultaneously:

```bash
docker-compose up --build
```

Access points:
- **Frontend App**: `http://localhost:3000`
- **FastAPI REST API**: `http://localhost:8000`
- **Interactive Swagger Docs**: `http://localhost:8000/docs`
- **ReDoc API Docs**: `http://localhost:8000/redoc`

---

### 4. Running Backend & Frontend Standalone

#### Backend Setup
```bash
cd backend
python -m venv .venv
# On Windows PowerShell:
.venv\Scripts\Activate.ps1
# On Linux/macOS:
source .venv/bin/activate

pip install -e .
python app/main.py
```

#### Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

---

## 🧪 Running Verification Test Suites

### Backend Unit & Integration Tests (38 Passing Tests)

```bash
# Set PYTHONPATH to backend directory
$env:PYTHONPATH="backend"
python -m pytest backend/tests -v
```

Test coverage includes:
- Foundation & exception envelope formatting (`test_foundation.py`)
- Database repositories & in-memory fallbacks (`test_database.py`)
- Repository analysis toolkit, AST parser & NetworkX graph (`test_analysis_toolkit.py`)
- AI Provider Layer & priority failover router (`test_provider_layer.py`)
- LangGraph Orchestration & state reducers (`test_orchestration.py`)
- All 10 specialized AI Agents (`test_agents.py`)
- REST API v1 routes & SSE streaming (`test_api_endpoints.py`)
- Mandatory explainability fields & Reviewer loop (`test_explainability_review_loop.py`)
- Provider outage failover simulation (`test_provider_failover_simulation.py`)
- Edge cases & invalid inputs (`test_edge_cases.py`)

### Frontend Typecheck & Production Build

```bash
cd frontend
npm run typecheck
npm run build
```

---

## 📄 License & Attribution

RepoMind AI is open-source software licensed under the MIT License.
