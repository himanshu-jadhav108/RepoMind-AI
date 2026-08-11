# 🚀 Master Setup & Operations Guide — RepoMind AI

Welcome to **RepoMind AI**, an enterprise-grade, autonomous software engineering intelligence platform. This guide provides a comprehensive, step-by-step walkthrough for setting up, configuring, running, and testing the entire project locally from scratch.

> [!NOTE]
> All source code files across all 12 implementation phases have been written, tested, and pushed to your Git repository (`main` branch). Follow this guide to initialize your database, configure API keys, and run the system locally.

---

## 📋 Table of Contents

1. [Prerequisites & System Requirements](#1-prerequisites--system-requirements)
2. [Project Architecture Overview](#2-project-architecture-overview)
3. [Environment Configuration & API Keys](#3-environment-configuration--api-keys)
4. [Supabase Postgres Database Setup & Schema Migrations](#4-supabase-postgres-database-setup--schema-migrations)
5. [Backend Setup & Python Environment](#5-backend-setup--python-environment)
6. [Frontend Setup & Node.js Environment](#6-frontend-setup--nodejs-environment)
7. [Running the Application (Docker Compose vs Standalone)](#7-running-the-application-docker-compose-vs-standalone)
8. [Step-by-Step Guide: Running Your First Repository Analysis](#8-step-by-step-guide-running-your-first-repository-analysis)
9. [REST API Endpoint Reference](#9-rest-api-endpoint-reference)
10. [Automated Testing & Verification Playbook](#10-automated-testing--verification-playbook)
11. [Troubleshooting & FAQ](#11-troubleshooting--faq)

---

## 1. Prerequisites & System Requirements

Before setting up RepoMind AI, ensure you have the following installed on your machine:

- **Operating System**: Windows 10/11, macOS, or Linux.
- **Git**: Git 2.30+ installed (`git --version`).
- **Python**: Python 3.11 or Python 3.13 (`python --version`).
- **Node.js & npm**: Node.js v18.0+ or v20.0+ (`node -v`, `npm -v`).
- **Docker & Docker Compose** (Optional, for containerized execution): Docker Desktop installed (`docker --version`, `docker-compose --version`).
- **Supabase Account** (Optional): A free account on [supabase.com](https://supabase.com) for persistent Postgres database storage. (If omitted, RepoMind AI automatically uses an in-memory repository for offline testing).

---

## 2. Project Architecture Overview

RepoMind AI follows **Clean Architecture** principles in the backend and a **Feature-Based** structure in the frontend:

```text
RepoMind-AI/
├── backend/
│   ├── app/
│   │   ├── agents/            # BaseAgent & 10 specialized AI Agents
│   │   ├── analysis_toolkit/  # Git ingestion, multi-language symbol parser, NetworkX dependency graph
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
├── docs/                      # Master documentation (PROJECT.md, ARCHITECTURE.md, AGENTS.md, etc.)
└── docker-compose.yml         # Containerized local development orchestrator
```

---

## 3. Environment Configuration & API Keys

### Step 3.1: Create Environment Variable File

Navigate to the `backend/` directory and copy `.env.example` to create your active `.env` file:

**On Windows PowerShell:**
```powershell
Copy-Item backend\.env.example backend\.env
```

**On Linux / macOS / Bash:**
```bash
cp backend/.env.example backend/.env
```

### Step 3.2: Configure `.env` Settings

Open `backend/.env` in your code editor and populate your keys:

```env
# Application Settings
PROJECT_NAME="RepoMind AI"
VERSION="1.0.0"
ENVIRONMENT="development"
HOST="0.0.0.0"
PORT=8000

# CORS Origins
CORS_ORIGINS=["http://localhost:3000", "http://127.0.0.1:3000"]

# Supabase Postgres Configuration (Optional for offline testing)
SUPABASE_URL="https://your-project-id.supabase.co"
SUPABASE_SERVICE_ROLE_KEY="your-supabase-service-role-key"

# AI Provider API Keys
# (At least ONE valid API key is recommended for live LLM execution.
# If no keys are set, RepoMind AI falls back gracefully to deterministic analysis & mock responses).
GEMINI_API_KEY="your-gemini-api-key"
GROQ_API_KEY="your-groq-api-key"
OPENAI_API_KEY="your-openai-api-key"
OPENROUTER_API_KEY="your-openrouter-api-key"
HUGGINGFACE_API_KEY="your-huggingface-api-key"

# Operational Thresholds
MAX_FILES_PARSE_LIMIT=100
DEFAULT_CONFIDENCE_THRESHOLD=0.70
MAX_REVIEW_RETRYS=1
```

---

## 4. Supabase Postgres Database Setup & Schema Migrations

RepoMind AI supports Supabase Postgres for persistent database storage.

### Step 4.1: Obtain Supabase Credentials
1. Go to [https://supabase.com](https://supabase.com) and log into your account.
2. Click **New Project** and select your organization.
3. Once your project is created, navigate to **Project Settings → API**.
4. Copy the **Project URL** and paste it into `SUPABASE_URL` in `backend/.env`.
5. Copy the **`service_role` secret key** and paste it into `SUPABASE_SERVICE_ROLE_KEY` in `backend/.env`.

### Step 4.2: Execute SQL Schema Migrations
1. In your Supabase Dashboard, click on **SQL Editor** in the left sidebar.
2. Click **New Query**.
3. Open the migration file in your project:
   `backend/app/db/migrations/001_initial_schema.sql`
4. Copy the complete SQL script content and paste it into the Supabase SQL Editor.
5. Click **Run** (or press Ctrl + Enter).
6. Verify that the 6 tables (`repositories`, `analysis_runs`, `agent_results`, `findings`, `reports`, `provider_usage`) were successfully created.

### Step 4.3: Populate Seed Data (Optional)
To insert initial sample repository metadata and findings into your database:

**On Windows PowerShell:**
```powershell
$env:PYTHONPATH="backend"
backend\.venv\Scripts\python.exe backend/app/db/seed.py
```

**On Linux / macOS:**
```bash
PYTHONPATH=backend python backend/app/db/seed.py
```

---

## 5. Backend Setup & Python Environment

### Step 5.1: Create Python Virtual Environment
Navigate to the root directory `RepoMind-AI/`:

**On Windows PowerShell:**
```powershell
python -m venv backend\.venv
```

**On Linux / macOS:**
```bash
python3 -m venv backend/.venv
```

### Step 5.2: Activate Virtual Environment

**On Windows PowerShell:**
```powershell
.\backend\.venv\Scripts\Activate.ps1
```

**On Linux / macOS:**
```bash
source backend/.venv/bin/activate
```

### Step 5.3: Install Python Dependencies

If your terminal current directory is `D:\Projects\RepoMind AI\backend`:
```powershell
pip install -e .
```

If your terminal current directory is the root project folder `D:\Projects\RepoMind AI`:
```powershell
pip install -e backend/
```

This installs FastAPI, Uvicorn, Pydantic v2, NetworkX, GitPython, LangGraph, pytest, and all required adapters.

---

## 6. Frontend Setup & Node.js Environment

### Step 6.1: Navigate & Install Dependencies
Open a new terminal window, navigate to `frontend/`, and install npm packages:

```bash
cd frontend
npm install
```

This installs Next.js 14, React 18, TailwindCSS, React Flow (`reactflow`), Lucide Icons, and UI utilities.

### Step 6.2: Verify Frontend Environment Variables
By default, the frontend connects to the backend at `http://localhost:8000`. If you run the backend on a custom port, create `frontend/.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

---

## 7. Running the Application (Docker Compose vs Standalone)

You can run RepoMind AI using either **Docker Compose** (recommended for production-like execution) or **Standalone Local Dev Servers**.

---

### Option A: Running via Docker Compose (Single Command)

Ensure Docker Desktop is running on your system, then run:

```bash
docker-compose up --build
```

Docker will build and launch two containers:
1. **Backend Container**: Listening on `http://localhost:8000`
2. **Frontend Container**: Listening on `http://localhost:3000`

To stop Docker Compose: Press `Ctrl + C` or run `docker-compose down`.

---

### Option B: Running Standalone Local Dev Servers

#### Terminal 1 — Start FastAPI Backend:
**Windows PowerShell:**
```powershell
$env:PYTHONPATH="backend"
backend\.venv\Scripts\python.exe backend/app/main.py
```

**Linux / macOS:**
```bash
PYTHONPATH=backend backend/.venv/bin/python backend/app/main.py
```

The backend server will start on `http://localhost:8000`.

#### Terminal 2 — Start Next.js Frontend Dev Server:
```bash
cd frontend
npm run dev
```

The frontend server will start on `http://localhost:3000`.

---

## 8. Step-by-Step Guide: Running Your First Repository Analysis

Once both servers are running, follow these steps to perform an end-to-end repository analysis:

1. Open your web browser and navigate to `http://localhost:3000`.
2. On the **Landing Page**, locate the central search bar under **"Turn Any Repository into a Fully Explained Engineering Artifact"**.
3. Paste a public GitHub repository URL into the input field, for example:
   `https://github.com/fastapi/fastapi`
   *(Or click one of the quick sample buttons: `fastapi/fastapi`, `psf/black`, `expressjs/express`).*
4. Click **Analyze Repo**.
5. You will be automatically redirected to the **Live Engineering Workspace**:
   `http://localhost:3000/analyze/[runId]`
6. Observe the live features:
   - **Agent Execution Timeline**: Tracks the Planner Agent rationale, agent status progression (`queued` → `running` → `completed`), and the Reviewer Agent Loop review gate.
   - **Repository Health Score Widget**: Displays overall health score (e.g. `88.5 / 100`) and sub-scores (Architecture, Documentation, Security, Performance, Maintainability, Testing).
   - **Interactive Knowledge Graph**: Explore module relationships mapped visually with React Flow. Click any file node to inspect its contents.
   - **Findings Workspace**: Switch tabs between Bugs, Security, Performance, Architecture, Documentation, and Feature Proposals. Filter by severity (`Critical`, `High`, `Medium`, `Low`). Inspect explainability fields (`Reasoning`, `Confidence %`, `Source Line Evidence Code Block`).
   - **Code Viewer & Learning Agent**: View syntax-highlighted source code with line numbers. Click **"Explain Code Region"** to get a plain-language walkthrough generated by the Learning Agent.
7. Click **"View Consolidated Audit Report"** or navigate to `http://localhost:3000/reports/[runId]` to view the final report and download Markdown (`.md`) or PDF (`.pdf`) exports.

---

## 9. REST API Endpoint Reference

The backend provides a complete REST API v1. You can inspect and interact with all endpoints via the interactive Swagger UI at `http://localhost:8000/docs`.

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/health` or `/api/v1/health` | Uptime health check |
| `GET` | `/api/v1/providers/status` | Current AI provider availability & active failover order |
| `POST` | `/api/v1/repos` | Register a GitHub repository for analysis |
| `GET` | `/api/v1/repos/{repoId}` | Retrieve metadata for a registered repository |
| `POST` | `/api/v1/analysis/run` | Trigger a new multi-agent LangGraph analysis run |
| `GET` | `/api/v1/analysis/{runId}` | Retrieve run status and agent lifecycle states |
| `GET` | `/api/v1/analysis/{runId}/stream` | Stream live agent status updates via SSE / EventStream |
| `GET` | `/api/v1/analysis/{runId}/results` | Retrieve raw results from all agents |
| `GET` | `/api/v1/analysis/{runId}/findings` | Retrieve paginated, filterable findings list |
| `GET` | `/api/v1/analysis/{runId}/health-score` | Retrieve Repository Health Score & sub-scores |
| `POST` | `/api/v1/analysis/{runId}/explain` | Request plain-language code region explanation from Learning Agent |
| `GET` | `/api/v1/analysis/{runId}/report` | Retrieve final consolidated audit report |
| `GET` | `/api/v1/analysis/{runId}/report/export` | Export final report as downloadable `.md` or `.pdf` file |

---

## 10. Automated Testing & Verification Playbook

### Running Backend Pytest Suite (38 Passing Tests)

Run the full pytest suite from the project root:

**Windows PowerShell:**
```powershell
$env:PYTHONPATH="backend"
backend\.venv\Scripts\python.exe -m pytest backend/tests -v
```

**Linux / macOS:**
```bash
PYTHONPATH=backend backend/.venv/bin/python -m pytest backend/tests -v
```

**Test Suite Coverage Summary:**
- `test_foundation.py`: Pydantic models & standard exception envelope.
- `test_database.py`: Supabase repositories & in-memory fallbacks.
- `test_analysis_toolkit.py`: Ephemeral Git cloning, symbol parser, NetworkX graph.
- `test_provider_layer.py`: Gemini, Groq, OpenAI adapters & failover router.
- `test_orchestration.py`: LangGraph AnalysisState & StateGraph pipeline execution.
- `test_agents.py`: All 10 specialized AI Agents.
- `test_api_endpoints.py`: All 13 REST API routes & SSE streaming.
- `test_explainability_review_loop.py`: Mandatory explainability fields & Reviewer loop thresholding.
- `test_provider_failover_simulation.py`: Simulated 500 server errors & provider outage fallbacks.
- `test_edge_cases.py`: Invalid GitHub URLs, empty repos, and unsupported file extensions.

### Running Frontend Typecheck & Production Build

Navigate to `frontend/` and execute:

```bash
# 1. Run TypeScript Typecheck
npm run typecheck

# 2. Test Production Build Optimization
npm run build
```

---

## 11. Troubleshooting & FAQ

### Issue 1: "No live AI provider keys available. Registering mock fallback."
- **Cause**: No API keys (`GEMINI_API_KEY`, `GROQ_API_KEY`, etc.) were configured in `backend/.env`.
- **Solution**: RepoMind AI automatically degrades gracefully and uses deterministic static analysis + structured fallback responses. To enable live AI generation, register at least one free API key (e.g. Google Gemini or Groq) in `backend/.env`.

### Issue 2: "Supabase connection error / Fallback to memory repository"
- **Cause**: `SUPABASE_URL` or `SUPABASE_SERVICE_ROLE_KEY` is missing or invalid.
- **Solution**: Check your `backend/.env` credentials. If you intend to run offline without Supabase, ignore this warning; RepoMind AI automatically uses its built-in in-memory fallback.

### Issue 3: `ModuleNotFoundError: No module named 'app'` when running pytest
- **Cause**: `PYTHONPATH` environment variable is not set to `backend`.
- **Solution**:
  - Windows PowerShell: `$env:PYTHONPATH="backend"`
  - Linux/macOS: `export PYTHONPATH=backend`

### Issue 4: Next.js Frontend cannot reach Backend API
- **Cause**: Backend server is not running on Port 8000 or CORS origin is blocked.
- **Solution**: Ensure backend is running on `http://localhost:8000` and `CORS_ORIGINS` in `backend/.env` includes `"http://localhost:3000"`.

---

## 🎯 Summary

RepoMind AI is fully built, hardened, and ready for development, testing, and production deployment!

If you have any questions or need further assistance, consult the documentation files in the `docs/` folder:
- [docs/PROJECT.md](file:///d:/Projects/RepoMind%20AI/docs/PROJECT.md)
- [docs/ARCHITECTURE.md](file:///d:/Projects/RepoMind%20AI/docs/ARCHITECTURE.md)
- [docs/AGENTS.md](file:///d:/Projects/RepoMind%20AI/docs/AGENTS.md)
- [docs/API.md](file:///d:/Projects/RepoMind%20AI/docs/API.md)
