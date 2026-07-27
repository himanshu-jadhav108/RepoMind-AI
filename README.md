# RepoMind AI — Autonomous Engineering Workspace

RepoMind AI turns any public GitHub repository into a fully analyzed, explained, and improvable engineering artifact using an autonomous, multi-agent AI team.

---

## Documentation

Full architectural specifications, data flows, and project rules live in the `docs/` directory:

- [PROJECT.md](file:///d:/Projects/RepoMind%20AI/docs/PROJECT.md) — Vision, Objectives, MVP Scope, Demo Flow
- [ARCHITECTURE.md](file:///d:/Projects/RepoMind%20AI/docs/ARCHITECTURE.md) — System Architecture, Folder Structure, Data Flows
- [AGENTS.md](file:///d:/Projects/RepoMind%20AI/docs/AGENTS.md) — Multi-Agent Team Definitions & Reviewer Loop Specifications
- [IMPLEMENTATION_PLAN.md](file:///d:/Projects/RepoMind%20AI/docs/IMPLEMENTATION_PLAN.md) — Priority Matrix & Phased Implementation Plan
- [API.md](file:///d:/Projects/RepoMind%20AI/docs/API.md) — REST API Endpoints & Request/Response Schemas
- [RULES.md](file:///d:/Projects/RepoMind%20AI/docs/RULES.md) — Engineering Standards, Coding Conventions, Security & Prompt Rules

---

## Quickstart

### Prerequisites
- Python 3.10+
- Node.js 18+
- Docker & Docker Compose (optional)

### Backend Setup
```bash
cd backend
python -m venv .venv
# On Windows PowerShell:
.venv\Scripts\Activate.ps1
# On Linux/macOS:
source .venv/bin/activate

pip install -e .[dev]
uvicorn app.main:app --reload
```
The FastAPI backend runs at `http://localhost:8000`. Swagger documentation is available at `http://localhost:8000/docs`.

### Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
The Next.js frontend runs at `http://localhost:3000`.

---

## Verification & Testing

- Backend Health Check: `GET http://localhost:8000/health` or `http://localhost:8000/api/v1/health`
- Backend Linting: `ruff check backend/` & `black --check backend/`
- Frontend Type Check: `npm run typecheck` inside `frontend/`
