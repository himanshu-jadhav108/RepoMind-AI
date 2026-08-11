import pytest
pytest.importorskip("supabase", reason="supabase package required for API endpoint integration tests")

from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_health_endpoints():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"

    res_v1 = client.get("/api/v1/health")
    assert res_v1.status_code == 200
    assert res_v1.json()["status"] == "ok"


def test_providers_status_endpoint():
    response = client.get("/api/v1/providers/status")
    assert response.status_code == 200
    data = response.json()
    assert "providers" in data
    assert isinstance(data["providers"], list)


def test_repo_registration_and_get():
    # 1. Invalid URL
    res_bad = client.post("/api/v1/repos", json={"repo_url": "https://notgithub.com/bad/repo"})
    assert res_bad.status_code == 400
    assert "error" in res_bad.json()

    # 2. Valid URL registration (201 Created)
    res_valid = client.post("/api/v1/repos", json={"repo_url": "https://github.com/fastapi/fastapi"})
    assert res_valid.status_code == 201
    repo_data = res_valid.json()
    assert "repo_id" in repo_data
    assert repo_data["owner"] == "fastapi"
    repo_id = repo_data["repo_id"]

    # 3. Duplicate registration (P0-3 FIX: returns 200/201 with existing repo_id instead of 409 error)
    res_dup = client.post("/api/v1/repos", json={"repo_url": "https://github.com/fastapi/fastapi"})
    assert res_dup.status_code in (200, 201)
    assert res_dup.json()["repo_id"] == repo_id

    # 4. Get repo metadata (200 OK)
    res_get = client.get(f"/api/v1/repos/{repo_id}")
    assert res_get.status_code == 200
    assert res_get.json()["repo_id"] == repo_id

    # 5. Get non-existent repo (404 Not Found)
    res_404 = client.get("/api/v1/repos/non-existent-uuid")
    assert res_404.status_code == 404


def test_analysis_run_lifecycle_and_endpoints():
    # Register repo first
    repo_res = client.post("/api/v1/repos", json={"repo_url": "https://github.com/psf/black"})
    repo_id = repo_res.json()["repo_id"]

    # 1. POST /analysis/run (202 Accepted)
    run_res = client.post("/api/v1/analysis/run", json={"repo_id": repo_id})
    assert run_res.status_code == 202
    run_data = run_res.json()
    assert "run_id" in run_data
    run_id = run_data["run_id"]

    # 2. GET /analysis/{runId} (200 OK)
    status_res = client.get(f"/api/v1/analysis/{run_id}")
    assert status_res.status_code == 200
    assert status_res.json()["run_id"] == run_id

    # 3. GET /analysis/{runId}/stream (200 SSE Stream)
    stream_res = client.get(f"/api/v1/analysis/{run_id}/stream")
    assert stream_res.status_code == 200
    assert "text/event-stream" in stream_res.headers["content-type"]

    # 4. GET /analysis/{runId}/results (200 OK)
    results_res = client.get(f"/api/v1/analysis/{run_id}/results")
    assert results_res.status_code == 200
    assert "results" in results_res.json()

    # 5. GET /analysis/{runId}/findings (200 OK Paginated)
    findings_res = client.get(f"/api/v1/analysis/{run_id}/findings?page=1&page_size=10")
    assert findings_res.status_code == 200
    f_data = findings_res.json()
    assert "data" in f_data
    assert "pagination" in f_data

    # 6. GET /analysis/{runId}/health-score (200 OK)
    score_res = client.get(f"/api/v1/analysis/{run_id}/health-score")
    assert score_res.status_code == 200
    assert "overall_score" in score_res.json()
    assert "sub_scores" in score_res.json()

    # 7. POST /analysis/{runId}/explain (200 OK)
    explain_res = client.post(f"/api/v1/analysis/{run_id}/explain", json={"file": "black.py", "line_start": 1, "line_end": 10})
    assert explain_res.status_code == 200
    assert "summary" in explain_res.json()

    # 8. GET /analysis/{runId}/report (200 OK)
    report_res = client.get(f"/api/v1/analysis/{run_id}/report")
    assert report_res.status_code == 200
    assert "report_markdown" in report_res.json()

    # 9. GET /analysis/{runId}/report/export (200 OK Markdown)
    export_md = client.get(f"/api/v1/analysis/{run_id}/report/export?format=md")
    assert export_md.status_code == 200
    assert export_md.headers["content-type"] == "text/markdown; charset=utf-8"

    # 10. GET /analysis/{runId}/report/export (200 OK PDF)
    export_pdf = client.get(f"/api/v1/analysis/{run_id}/report/export?format=pdf")
    assert export_pdf.status_code == 200
    assert export_pdf.headers["content-type"] == "application/pdf"
