from fastapi import APIRouter, Depends, status

from app.core.dependency_injection import get_repo_ingestion_service
from app.models.repo import RepoCreate, RepoMetadata, RepoResponse
from app.services.repo_ingestion_service import RepoIngestionService

router = APIRouter(prefix="/repos", tags=["Repositories"])


@router.post("", response_model=RepoResponse, status_code=status.HTTP_201_CREATED)
async def register_repository(
    payload: RepoCreate,
    repo_service: RepoIngestionService = Depends(get_repo_ingestion_service),
):
    """
    Register a GitHub repository for analysis (validates and clones it) per API.md.
    """
    return await repo_service.register_repository(payload)


@router.get("/{repo_id}", response_model=RepoMetadata, status_code=status.HTTP_200_OK)
async def get_repository_metadata(
    repo_id: str,
    repo_service: RepoIngestionService = Depends(get_repo_ingestion_service),
):
    """
    Retrieve metadata for a previously registered repository per API.md.
    """
    return await repo_service.get_repository_metadata(repo_id)
