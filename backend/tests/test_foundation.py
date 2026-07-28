import pytest

from app.core.dependency_injection import (
    get_analysis_service,
    get_provider_router,
    get_repo_ingestion_service,
)
from app.core.exceptions import (
    InvalidRepoUrlException,
)
from app.models.analysis import AnalysisRunCreate, RunStatus
from app.models.repo import RepoCreate, RepoResponse


@pytest.mark.asyncio
async def test_repo_url_parsing():
    service = get_repo_ingestion_service()
    owner, name = service.parse_github_url("https://github.com/fastapi/fastapi")
    assert owner == "fastapi"
    assert name == "fastapi"

    with pytest.raises(InvalidRepoUrlException):
        service.parse_github_url("https://notgithub.com/owner/repo")

    with pytest.raises(InvalidRepoUrlException):
        service.parse_github_url("https://github.com/invalid")


@pytest.mark.asyncio
async def test_repo_registration_flow():
    service = get_repo_ingestion_service()
    payload = RepoCreate(repo_url="https://github.com/owner/repo-test")
    res = await service.register_repository(payload)

    assert isinstance(res, RepoResponse)
    assert res.owner == "owner"
    assert res.name == "repo-test"

    # Registering duplicate returns existing repo metadata (P0-3 FIX)
    res_dup = await service.register_repository(payload)
    assert res_dup.repo_id == res.repo_id


@pytest.mark.asyncio
async def test_analysis_run_trigger():
    repo_service = get_repo_ingestion_service()
    analysis_service = get_analysis_service()

    repo = await repo_service.register_repository(
        RepoCreate(repo_url="https://github.com/test/run-test")
    )
    run_res = await analysis_service.start_analysis_run(
        AnalysisRunCreate(repo_id=repo.repo_id)
    )

    assert run_res.status == RunStatus.QUEUED
    run_detail = await analysis_service.get_run_detail(run_res.run_id)
    assert run_detail.repo_id == repo.repo_id
    assert len(run_detail.agents) == 7


@pytest.mark.asyncio
async def test_provider_router_status():
    router = get_provider_router()
    status_list = router.get_status()
    assert isinstance(status_list, list)
