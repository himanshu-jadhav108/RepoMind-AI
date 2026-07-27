from typing import Dict, Optional
from app.models.repo import RepoMetadata
from app.repositories.base_repository import BaseRepository


class RepoMetadataRepository(BaseRepository[RepoMetadata]):
    """
    Repository for managing repository metadata entities.
    Provides in-memory fallback for testing until Supabase database layer is connected in Phase 3.
    """

    def __init__(self) -> None:
        self._store: Dict[str, RepoMetadata] = {}

    async def get_by_id(self, item_id: str) -> Optional[RepoMetadata]:
        return self._store.get(item_id)

    async def get_by_url(self, owner: str, name: str) -> Optional[RepoMetadata]:
        for repo in self._store.values():
            if repo.owner.lower() == owner.lower() and repo.name.lower() == name.lower():
                return repo
        return None

    async def create(self, item: RepoMetadata) -> RepoMetadata:
        self._store[item.repo_id] = item
        return item

    async def update(self, item_id: str, data: dict) -> Optional[RepoMetadata]:
        existing = await self.get_by_id(item_id)
        if not existing:
            return None
        updated_data = existing.model_dump()
        updated_data.update(data)
        updated_item = RepoMetadata(**updated_data)
        self._store[item_id] = updated_item
        return updated_item

    async def delete(self, item_id: str) -> bool:
        if item_id in self._store:
            del self._store[item_id]
            return True
        return False
