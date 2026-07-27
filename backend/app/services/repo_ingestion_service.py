import re
import uuid
from datetime import datetime, timezone
from urllib.parse import urlparse
from app.core.exceptions import InvalidRepoUrlException, RepositoryAlreadyExistsException
from app.models.repo import RepoCreate, RepoMetadata, RepoResponse
from app.repositories.repo_metadata_repository import RepoMetadataRepository
from app.services.base_service import BaseService


class RepoIngestionService(BaseService):
    """
    Service layer for validating, parsing, and registering GitHub repositories.
    Does not depend on HTTP/FastAPI request objects directly.
    """

    def __init__(self, repo_repository: RepoMetadataRepository) -> None:
        self.repo_repository = repo_repository

    def parse_github_url(self, repo_url: str) -> tuple[str, str]:
        """
        Extracts owner and repo name from GitHub URL.
        """
        parsed = urlparse(repo_url)
        if parsed.netloc and parsed.netloc.lower() not in ["github.com", "www.github.com"]:
            raise InvalidRepoUrlException("Only github.com repository URLs are supported.")

        path_parts = [p for p in parsed.path.strip("/").split("/") if p]
        if len(path_parts) < 2:
            raise InvalidRepoUrlException("URL must be in format: https://github.com/owner/repo")

        owner = path_parts[0]
        name = re.sub(r"\.git$", "", path_parts[1], flags=re.IGNORECASE)
        return owner, name

    async def register_repository(self, payload: RepoCreate) -> RepoResponse:
        url_str = str(payload.repo_url)
        owner, name = self.parse_github_url(url_str)

        existing = await self.repo_repository.get_by_url(owner, name)
        if existing:
            raise RepositoryAlreadyExistsException(f"Repository '{owner}/{name}' is already registered.")

        repo_id = str(uuid.uuid4())
        metadata = RepoMetadata(
            repo_id=repo_id,
            owner=owner,
            name=name,
            default_branch="main",
            last_analyzed_commit=None,
            last_analyzed_at=None,
        )
        await self.repo_repository.create(metadata)

        return RepoResponse(
            repo_id=repo_id,
            owner=owner,
            name=name,
            default_branch="main",
            created_at=datetime.now(timezone.utc),
        )

    async def get_repository_metadata(self, repo_id: str) -> RepoMetadata:
        metadata = await self.repo_repository.get_by_id(repo_id)
        if not metadata:
            from app.core.exceptions import RepositoryNotFoundException
            raise RepositoryNotFoundException(f"Repository with ID '{repo_id}' not found.")
        return metadata
