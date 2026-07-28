from typing import Optional

from supabase import Client

from app.models.repo import RepoMetadata
from app.repositories.base_repository import BaseRepository


class SupabaseRepoMetadataRepository(BaseRepository[RepoMetadata]):
    """
    Supabase Postgres implementation of RepoMetadataRepository.
    """

    def __init__(self, client: Client) -> None:
        self.client = client
        self.table = "repositories"

    async def get_by_id(self, item_id: str) -> Optional[RepoMetadata]:
        try:
            res = self.client.table(self.table).select("*").eq("id", item_id).execute()
            if res.data and len(res.data) > 0:
                row = res.data[0]
                return RepoMetadata(
                    repo_id=row["id"],
                    owner=row["owner"],
                    name=row["name"],
                    default_branch=row["default_branch"],
                    last_analyzed_commit=row.get("last_analyzed_commit"),
                    last_analyzed_at=row.get("last_analyzed_at"),
                )
            return None
        except Exception:
            return None

    async def get_by_url(self, owner: str, name: str) -> Optional[RepoMetadata]:
        res = (
            self.client.table(self.table)
            .select("*")
            .ilike("owner", owner)
            .ilike("name", name)
            .execute()
        )
        if res.data and len(res.data) > 0:
            row = res.data[0]
            return RepoMetadata(
                repo_id=row["id"],
                owner=row["owner"],
                name=row["name"],
                default_branch=row["default_branch"],
                last_analyzed_commit=row.get("last_analyzed_commit"),
                last_analyzed_at=row.get("last_analyzed_at"),
            )
        return None

    async def create(self, item: RepoMetadata) -> RepoMetadata:
        payload = {
            "id": item.repo_id,
            "owner": item.owner,
            "name": item.name,
            "default_branch": item.default_branch,
            "last_analyzed_commit": item.last_analyzed_commit,
            "last_analyzed_at": item.last_analyzed_at.isoformat()
            if item.last_analyzed_at
            else None,
        }
        res = self.client.table(self.table).insert(payload).execute()
        return item

    async def update(self, item_id: str, data: dict) -> Optional[RepoMetadata]:
        self.client.table(self.table).update(data).eq("id", item_id).execute()
        return await self.get_by_id(item_id)

    async def delete(self, item_id: str) -> bool:
        res = self.client.table(self.table).delete().eq("id", item_id).execute()
        return bool(res.data)
