import pytest
from unittest.mock import AsyncMock, MagicMock

from fastapi.testclient import TestClient

from app.api.v1.routes_analysis import _ip_last_request
from app.core.config import settings
from app.core.dependency_injection import get_analysis_service
from app.main import app
from app.models.analysis import AnalysisRunResponse, RunStatus

# Setup mock analysis service so rate limiter is tested in pure isolation
mock_service = MagicMock()
mock_service.start_analysis_run = AsyncMock(
    return_value=AnalysisRunResponse(
        run_id="test-run-id",
        repo_id="test-repo-id",
        status=RunStatus.QUEUED,
        created_at="2026-08-16T00:00:00Z",
    )
)
mock_repo_repo = MagicMock()
mock_repo_repo.get_by_id = AsyncMock(return_value=None)
mock_service.repo_repository = mock_repo_repo

client = TestClient(app)


@pytest.fixture(autouse=True)
def clean_rate_limit_state():
    _ip_last_request.clear()
    app.dependency_overrides[get_analysis_service] = lambda: mock_service
    yield
    _ip_last_request.clear()
    app.dependency_overrides.pop(get_analysis_service, None)


def test_rate_limiter_blocks_consecutive_requests(monkeypatch):
    _ip_last_request.clear()
    monkeypatch.setattr(settings, "ANALYSIS_RATE_LIMIT_SECONDS", 600)
    monkeypatch.setattr(settings, "RATE_LIMIT_BYPASS_LOCALHOST", False)

    # 1. First trigger returns 202 Accepted
    payload = {"repo_id": "test-repo-id"}
    res1 = client.post("/api/v1/analysis/run", json=payload)
    assert res1.status_code == 202
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
    assert res1.status_code == 202

    # With bypass enabled for localhost ("testclient"), second request also passes rate limiter
    res2 = client.post("/api/v1/analysis/run", json=payload)
    assert res2.status_code == 202
