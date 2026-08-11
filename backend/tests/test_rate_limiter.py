import pytest
pytest.importorskip("supabase", reason="supabase package required for API endpoint tests")

from fastapi import FastAPI
from fastapi.testclient import TestClient

from app.api.v1.routes_analysis import _ip_last_request, router
from app.core.config import settings

app = FastAPI()
app.include_router(router, prefix="/api/v1")

client = TestClient(app)


def test_rate_limiter_blocks_consecutive_requests(monkeypatch):
    _ip_last_request.clear()
    monkeypatch.setattr(settings, "ANALYSIS_RATE_LIMIT_SECONDS", 600)
    monkeypatch.setattr(settings, "RATE_LIMIT_BYPASS_LOCALHOST", False)

    # 1. First trigger returns 202 (or triggers endpoint logic past rate limiter)
    # Note: repo registration is bypassed since we are testing rate limit layer directly
    payload = {"repo_id": "test-repo-id"}
    res1 = client.post("/api/v1/analysis/run", json=payload)
    # Even if start_analysis_run raises 404/error, the rate limiter allowed it past the check
    assert res1.status_code != 429

    # 2. Second trigger immediately after must return 429 Too Many Requests
    res2 = client.post("/api/v1/analysis/run", json=payload)
    assert res2.status_code == 429
    assert "Retry-After" in res2.headers
    assert res2.headers["Retry-After"].isdigit()

    data = res2.json()
    assert "detail" in data
    detail = data["detail"]
    assert detail.startswith("Rate limit reached.")
    assert "To keep our free-tier AI services available for everyone" in detail
    assert "limited to 1 run every 10 minutes per IP" in detail
    assert "Please try again in" in detail


def test_rate_limiter_bypass_localhost(monkeypatch):
    _ip_last_request.clear()
    monkeypatch.setattr(settings, "ANALYSIS_RATE_LIMIT_SECONDS", 600)
    monkeypatch.setattr(settings, "RATE_LIMIT_BYPASS_LOCALHOST", True)

    payload = {"repo_id": "test-repo-id"}
    res1 = client.post("/api/v1/analysis/run", json=payload)
    assert res1.status_code != 429

    # With bypass enabled for localhost ("testclient"), second request also passes rate limiter
    res2 = client.post("/api/v1/analysis/run", json=payload)
    assert res2.status_code != 429
