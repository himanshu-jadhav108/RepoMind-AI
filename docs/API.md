# API.md — RepoMind AI REST API

Base URL: `/api/v1`

All responses are JSON. All timestamps are ISO 8601 UTC.

## Conventions

### Versioning Strategy
- The API is versioned in the URL path (`/api/v1/...`). Breaking changes ship as `/api/v2/...` rather than mutating `v1` in place; additive, backward-compatible fields may be added to `v1` responses without a version bump.
- MVP ships `v1` only. No deprecation policy is needed until a `v2` exists.

### Error Response Format
Every non-2xx response returns a consistent envelope, regardless of endpoint:
```json
{
  "error": {
    "code": "string (machine-readable, e.g. REPO_NOT_FOUND)",
    "message": "string (human-readable)",
    "details": {}
  }
}
```
This applies in addition to the per-endpoint status codes listed below — those describe *when* an error occurs, this describes its *shape*.

### Authentication Flow
- **MVP**: all endpoints are unauthenticated for public-repo analysis — no login required, consistent with PROJECT.md's MVP scope (public repos only, no auth).
- **Post-MVP** (private repos, per IMPLEMENTATION_PLAN.md Phase 8): authentication moves to GitHub OAuth. Flow: client redirects to `GET /auth/github/login` → GitHub OAuth consent → callback to `GET /auth/github/callback` exchanges the code for a Supabase-issued session token → subsequent requests carry `Authorization: Bearer <token>`. Endpoints affected by this future change are marked `(auth required post-MVP)` inline below where relevant.

### Pagination
List-returning endpoints that can grow large (e.g., findings on a big repo) accept `page` and `page_size` query params (defaults `page=1`, `page_size=50`, max `page_size=200`) and return:
```json
{
  "data": [ /* items */ ],
  "pagination": { "page": 1, "page_size": 50, "total_items": 0, "total_pages": 0 }
}
```

---

## Repositories

### `POST /repos`

**Purpose**: Register a GitHub repository for analysis (validates and clones it).

**Request**:
```json
{
  "repo_url": "https://github.com/owner/repo"
}
```

**Response** (201):
```json
{
  "repo_id": "uuid",
  "owner": "string",
  "name": "string",
  "default_branch": "string",
  "created_at": "timestamp"
}
```

**Status Codes**:
- `201 Created` — Repository registered
- `400 Bad Request` — Invalid or malformed URL
- `404 Not Found` — Repository does not exist or is private/inaccessible
- `409 Conflict` — Repository already registered
- `422 Unprocessable Entity` — URL valid but repo unparseable (e.g., empty repo)

---

### `GET /repos/{repoId}`

**Purpose**: Retrieve metadata for a previously registered repository.

**Request**: Path param `repoId`.

**Response** (200):
```json
{
  "repo_id": "uuid",
  "owner": "string",
  "name": "string",
  "default_branch": "string",
  "last_analyzed_commit": "string",
  "last_analyzed_at": "timestamp"
}
```

**Status Codes**:
- `200 OK`
- `404 Not Found` — Unknown `repoId`

---

## Analysis Runs

### `POST /analysis/run`

**Purpose**: Trigger a new multi-agent analysis run for a repository (starts the LangGraph pipeline).

**Request**:
```json
{
  "repo_id": "uuid",
  "commit_sha": "string (optional, defaults to latest on default branch)",
  "force_refresh": "boolean (optional, default false — bypasses cache)"
}
```

**Response** (202):
```json
{
  "run_id": "uuid",
  "status": "queued",
  "created_at": "timestamp"
}
```

**Status Codes**:
- `202 Accepted` — Run queued/started
- `400 Bad Request` — Missing or invalid `repo_id`
- `404 Not Found` — Unknown `repo_id`
- `409 Conflict` — An identical run (same repo + commit, not forced) is already cached/in progress

---

### `GET /analysis/{runId}`

**Purpose**: Get the overall status of an analysis run.

**Request**: Path param `runId`.

**Response** (200):
```json
{
  "run_id": "uuid",
  "repo_id": "uuid",
  "status": "queued | running | completed | failed",
  "agents": [
    { "name": "repository_analyzer", "status": "completed" },
    { "name": "architect_agent", "status": "running" },
    { "name": "bug_hunter_agent", "status": "queued" }
  ],
  "started_at": "timestamp",
  "completed_at": "timestamp | null"
}
```

**Status Codes**:
- `200 OK`
- `404 Not Found` — Unknown `runId`

---

### `GET /analysis/{runId}/stream`

**Purpose**: Stream live agent status updates for a run (Server-Sent Events or WebSocket upgrade).

**Request**: Path param `runId`.

**Response** (200, streamed):
```json
{ "agent": "bug_hunter_agent", "status": "completed", "timestamp": "timestamp" }
```
Stream of events, one per agent state transition, until the run reaches `completed` or `failed`.

**Status Codes**:
- `200 OK` — Stream opened
- `404 Not Found` — Unknown `runId`

---

### `GET /analysis/{runId}/results`

**Purpose**: Retrieve all agent results for a completed (or partially completed) run.

**Request**: Path param `runId`. Optional query param `agent` to filter to a single agent.

**Response** (200):
```json
{
  "run_id": "uuid",
  "results": {
    "architect_agent": { "summary": "string", "graph": { "nodes": [], "edges": [] } },
    "bug_hunter_agent": { "findings": [ { "file": "string", "line": 0, "severity": "string", "description": "string" } ] },
    "documentation_agent": { "markdown": "string" }
  }
}
```

**Status Codes**:
- `200 OK`
- `404 Not Found` — Unknown `runId`
- `409 Conflict` — Run not yet completed (partial results still available via query param, full results require completion)

---

## Findings

### `GET /analysis/{runId}/findings`

**Purpose**: Retrieve a normalized, filterable, paginated list of findings across Bug Hunter, Security, and Performance agents (post Reviewer Agent Loop validation).

**Request**: Path param `runId`. Optional query params: `severity`, `category` (bug | security | performance), `file`, `review_status` (approved | rewritten_and_approved | flagged_low_confidence), plus standard `page` / `page_size` (see Conventions).

**Response** (200):
```json
{
  "data": [
    {
      "id": "uuid",
      "category": "bug | security | performance",
      "severity": "low | medium | high | critical",
      "file": "string",
      "line_start": 0,
      "line_end": 0,
      "description": "string",
      "suggested_fix": "string",
      "reasoning": "string",
      "confidence": 0.0,
      "evidence": "string",
      "referenced_files": ["string"],
      "review_status": "approved | rewritten_and_approved | flagged_low_confidence"
    }
  ],
  "pagination": { "page": 1, "page_size": 50, "total_items": 0, "total_pages": 0 }
}
```

**Status Codes**:
- `200 OK`
- `404 Not Found` — Unknown `runId`

---

## Health Score

### `GET /analysis/{runId}/health-score`

**Purpose**: Retrieve the Repository Health Score and its component sub-scores (see AGENTS.md) for a run.

**Request**: Path param `runId`.

**Response** (200):
```json
{
  "run_id": "uuid",
  "overall_score": 0.0,
  "sub_scores": {
    "architecture": 0.0,
    "documentation": 0.0,
    "security": 0.0,
    "performance": 0.0,
    "maintainability": 0.0,
    "testing": 0.0
  },
  "generated_at": "timestamp"
}
```
Sub-scores for agents not yet active in the current deployment (see IMPLEMENTATION_PLAN.md phasing) are returned as `null` rather than a fabricated value.

**Status Codes**:
- `200 OK`
- `404 Not Found` — Unknown `runId`
- `409 Conflict` — Score not yet computed (run incomplete)

---

## Learning (On-Demand)

### `POST /analysis/{runId}/explain`

**Purpose**: Request a plain-language explanation of a specific code region from the Learning Agent (interactive, outside the main graph).

**Request**:
```json
{
  "file": "string",
  "line_start": 0,
  "line_end": 0
}
```

**Response** (200):
```json
{
  "explanation": "string",
  "related_concepts": ["string"]
}
```

**Status Codes**:
- `200 OK`
- `400 Bad Request` — Invalid line range
- `404 Not Found` — Unknown `runId` or file not part of the analyzed repo

---

## Reports

### `GET /analysis/{runId}/report`

**Purpose**: Retrieve the final consolidated report generated by the Report Generator agent.

**Request**: Path param `runId`.

**Response** (200):
```json
{
  "run_id": "uuid",
  "report_markdown": "string",
  "generated_at": "timestamp"
}
```

**Status Codes**:
- `200 OK`
- `404 Not Found` — Unknown `runId`
- `409 Conflict` — Report not yet generated (run incomplete)

---

### `GET /analysis/{runId}/report/export`

**Purpose**: Export the final report as a downloadable file.

**Request**: Path param `runId`. Query param `format` (`md` | `pdf`).

**Response** (200): Binary file stream with appropriate `Content-Type` and `Content-Disposition` headers.

**Status Codes**:
- `200 OK`
- `400 Bad Request` — Unsupported `format` value
- `404 Not Found` — Unknown `runId`
- `409 Conflict` — Report not yet available

---

## System

### `GET /health`

**Purpose**: Health check for uptime monitoring.

**Response** (200):
```json
{ "status": "ok", "timestamp": "timestamp" }
```

**Status Codes**:
- `200 OK`

### `GET /providers/status`

**Purpose**: Report current AI provider availability and active/failover state (observability into the Provider Layer).

**Response** (200):
```json
{
  "providers": [
    { "name": "gemini", "status": "healthy", "priority": 1 },
    { "name": "groq", "status": "healthy", "priority": 2 },
    { "name": "openai", "status": "degraded", "priority": 3 }
  ]
}
```

**Status Codes**:
- `200 OK`

---

## Changes Made

- Added a "Conventions" section covering Versioning Strategy, a standard Error Response Format envelope, an Authentication Flow (unauthenticated MVP, GitHub OAuth post-MVP), and a standard Pagination shape — applied consistently rather than per-endpoint ad hoc.
- Updated `GET /analysis/{runId}/findings` to use the standard paginated response shape and added `reasoning`, `evidence`, `referenced_files`, and `review_status` fields to each finding to reflect the explainability and Reviewer Agent Loop requirements from AGENTS.md; added a `review_status` filter.
- Added a new `GET /analysis/{runId}/health-score` endpoint under a new "Health Score" grouping, exposing the Repository Health Score and its six sub-scores from AGENTS.md, with `null` handling for not-yet-active sub-scores.
- All original endpoints (repos, analysis run lifecycle, stream, results, explain, reports, export, health, provider status) preserved with their original routes, request/response shapes, and status codes intact — only the findings endpoint's shape changed, and only additively.
