from typing import Dict, List, Optional
from app.models.analysis import AnalysisRunDetail
from app.models.finding import Finding
from app.repositories.base_repository import BaseRepository


class AnalysisRepository(BaseRepository[AnalysisRunDetail]):
    """
    Repository for managing analysis runs and results.
    Provides in-memory fallback for testing until Supabase database layer is connected in Phase 3.
    """

    def __init__(self) -> None:
        self._runs: Dict[str, AnalysisRunDetail] = {}
        self._findings: Dict[str, List[Finding]] = {}
        self._results: Dict[str, Dict] = {}

    async def get_by_id(self, item_id: str) -> Optional[AnalysisRunDetail]:
        return self._runs.get(item_id)

    async def create(self, item: AnalysisRunDetail) -> AnalysisRunDetail:
        self._runs[item.run_id] = item
        return item

    async def update(self, item_id: str, data: dict) -> Optional[AnalysisRunDetail]:
        existing = await self.get_by_id(item_id)
        if not existing:
            return None
        updated_data = existing.model_dump()
        updated_data.update(data)
        updated_item = AnalysisRunDetail(**updated_data)
        self._runs[item_id] = updated_item
        return updated_item

    async def delete(self, item_id: str) -> bool:
        if item_id in self._runs:
            del self._runs[item_id]
            self._findings.pop(item_id, None)
            self._results.pop(item_id, None)
            return True
        return False

    async def save_findings(self, run_id: str, findings: List[Finding]) -> None:
        self._findings[run_id] = findings

    async def get_findings(
        self,
        run_id: str,
        category: Optional[str] = None,
        severity: Optional[str] = None,
        review_status: Optional[str] = None,
    ) -> List[Finding]:
        all_findings = self._findings.get(run_id, [])
        filtered = all_findings
        if category:
            filtered = [f for f in filtered if f.category.value == category]
        if severity:
            filtered = [f for f in filtered if f.severity.value == severity]
        if review_status:
            filtered = [f for f in filtered if f.review_status.value == review_status]
        return filtered

    async def save_agent_results(self, run_id: str, results: Dict) -> None:
        self._results[run_id] = results

    async def get_agent_results(self, run_id: str) -> Dict:
        return self._results.get(run_id, {})
