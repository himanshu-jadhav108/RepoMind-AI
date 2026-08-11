from typing import Dict, List, Optional

from app.models.analysis import AnalysisRunDetail
from app.models.finding import Finding
from app.repositories.base_repository import BaseRepository


class AnalysisRepository(BaseRepository[AnalysisRunDetail]):
    """
    Repository for managing analysis runs, findings, and reports.
    Provides in-memory fallback for testing until Supabase database layer is connected.
    """

    def __init__(self) -> None:
        self._runs: Dict[str, AnalysisRunDetail] = {}
        self._findings: Dict[str, List[Finding]] = {}
        self._results: Dict[str, Dict] = {}
        self._reports: Dict[str, Dict] = {}
        self._live_statuses: Dict[str, Dict] = {}

    async def update_agent_status(self, run_id: str, agent_name: str, status: str, extra_data: Optional[Dict] = None) -> None:
        if run_id not in self._live_statuses:
            self._live_statuses[run_id] = {}
        self._live_statuses[run_id][agent_name] = status
        if extra_data:
            self._live_statuses[run_id].update(extra_data)

        run_detail = await self.get_by_id(run_id)
        if run_detail:
            from app.models.analysis import AgentStatus, AgentStatusEnum
            st_val = status if status in AgentStatusEnum.__members__.values() else "completed"
            status_enum = AgentStatusEnum(st_val)
            updated = False
            for ag in run_detail.agents:
                if ag.name == agent_name:
                    ag.status = status_enum
                    updated = True
                    break
            if not updated:
                run_detail.agents.append(AgentStatus(name=agent_name, status=status_enum))
            await self.update(run_id, {"agents": [a.model_dump() for a in run_detail.agents]})

    async def get_live_statuses(self, run_id: str) -> Dict:
        live = dict(self._live_statuses.get(run_id, {}))
        run_detail = await self.get_by_id(run_id)
        if run_detail and run_detail.agents:
            for ag in run_detail.agents:
                st = ag.status.value if hasattr(ag.status, "value") else str(ag.status)
                if ag.name not in live:
                    live[ag.name] = st
        return live

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
            self._reports.pop(item_id, None)
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

    async def save_report(self, run_id: str, report_markdown: str, health_score: Dict) -> None:
        self._reports[run_id] = {"report_markdown": report_markdown, "health_score": health_score}

    async def get_report_data(self, run_id: str) -> Optional[Dict]:
        return self._reports.get(run_id)
