from typing import Dict, List, Optional

from supabase import Client

from app.models.analysis import AgentStatus, AnalysisRunDetail, RunStatus
from app.models.finding import Finding, FindingCategory, FindingSeverity, ReviewStatus
from app.repositories.base_repository import BaseRepository


class SupabaseAnalysisRepository(BaseRepository[AnalysisRunDetail]):
    """
    Supabase Postgres implementation of AnalysisRepository.
    """

    def __init__(self, client: Client) -> None:
        self.client = client
        self.runs_table = "analysis_runs"
        self.findings_table = "findings"
        self.results_table = "agent_results"
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
        try:
            res = self.client.table(self.runs_table).select("*").eq("id", item_id).execute()
            if res.data and len(res.data) > 0:
                row = res.data[0]
                agents = [AgentStatus(**a) for a in row.get("agents_status", [])]
                return AnalysisRunDetail(
                    run_id=row["id"],
                    repo_id=row["repo_id"],
                    status=RunStatus(row["status"]),
                    agents=agents,
                    started_at=row["started_at"],
                    completed_at=row.get("completed_at"),
                )
            return None
        except Exception:
            return None

    async def create(self, item: AnalysisRunDetail) -> AnalysisRunDetail:
        payload = {
            "id": item.run_id,
            "repo_id": item.repo_id,
            "status": item.status.value,
            "agents_status": [a.model_dump() for a in item.agents],
            "started_at": item.started_at.isoformat(),
            "completed_at": item.completed_at.isoformat() if item.completed_at else None,
        }
        self.client.table(self.runs_table).insert(payload).execute()
        return item

    async def update(self, item_id: str, data: dict) -> Optional[AnalysisRunDetail]:
        payload = dict(data)
        if "agents" in payload:
            payload["agents_status"] = payload.pop("agents")
        self.client.table(self.runs_table).update(payload).eq("id", item_id).execute()
        return await self.get_by_id(item_id)

    async def delete(self, item_id: str) -> bool:
        res = self.client.table(self.runs_table).delete().eq("id", item_id).execute()
        return bool(res.data)

    async def save_findings(self, run_id: str, findings: List[Finding]) -> None:
        if not findings:
            return
        payloads = []
        for f in findings:
            fid = f.id
            try:
                uuid.UUID(str(fid))
            except Exception:
                fid = str(uuid.uuid5(uuid.NAMESPACE_DNS, str(fid)))
            payloads.append(
                {
                    "id": fid,
                    "run_id": run_id,
                    "category": f.category.value,
                    "severity": f.severity.value,
                    "file": f.file,
                    "line_start": f.line_start,
                    "line_end": f.line_end,
                    "description": f.description,
                    "suggested_fix": f.suggested_fix,
                    "reasoning": f.reasoning,
                    "confidence": f.confidence,
                    "evidence": f.evidence,
                    "referenced_files": f.referenced_files,
                    "review_status": f.review_status.value,
                }
            )
        try:
            self.client.table(self.findings_table).insert(payloads).execute()
        except Exception as e:
            logger.warning(f"Failed to insert findings into Supabase: {e}")

    async def get_findings(
        self,
        run_id: str,
        category: Optional[str] = None,
        severity: Optional[str] = None,
        review_status: Optional[str] = None,
    ) -> List[Finding]:
        query = self.client.table(self.findings_table).select("*").eq("run_id", run_id)
        if category:
            query = query.eq("category", category)
        if severity:
            query = query.eq("severity", severity)
        if review_status:
            query = query.eq("review_status", review_status)

        res = query.execute()
        findings = []
        for row in res.data or []:
            findings.append(
                Finding(
                    id=row["id"],
                    category=FindingCategory(row["category"]),
                    severity=FindingSeverity(row["severity"]),
                    file=row["file"],
                    line_start=row.get("line_start", 0),
                    line_end=row.get("line_end", 0),
                    description=row["description"],
                    suggested_fix=row.get("suggested_fix"),
                    reasoning=row["reasoning"],
                    confidence=row["confidence"],
                    evidence=row["evidence"],
                    referenced_files=row.get("referenced_files", []),
                    review_status=ReviewStatus(row.get("review_status", "unreviewed")),
                )
            )
        return findings

    async def save_agent_results(self, run_id: str, results: Dict) -> None:
        try:
            payload = {"run_id": run_id, "results": results}
            self.client.table(self.results_table).upsert(payload).execute()
        except Exception:
            if not hasattr(self, "_results_fallback"):
                self._results_fallback = {}
            self._results_fallback[run_id] = results

    async def get_agent_results(self, run_id: str) -> Dict:
        try:
            res = self.client.table(self.results_table).select("*").eq("run_id", run_id).execute()
            if res.data and len(res.data) > 0:
                return res.data[0].get("results", {})
        except Exception:
            pass
        return getattr(self, "_results_fallback", {}).get(run_id, {})

    async def save_report(self, run_id: str, report_markdown: str, health_score: Dict) -> None:
        try:
            payload = {"run_id": run_id, "report_markdown": report_markdown, "health_score": health_score}
            self.client.table("reports").upsert(payload).execute()
        except Exception:
            if not hasattr(self, "_reports_fallback"):
                self._reports_fallback = {}
            self._reports_fallback[run_id] = {"report_markdown": report_markdown, "health_score": health_score}

    async def get_report_data(self, run_id: str) -> Optional[Dict]:
        try:
            res = self.client.table("reports").select("*").eq("run_id", run_id).execute()
            if res.data and len(res.data) > 0:
                return res.data[0]
        except Exception:
            pass
        return getattr(self, "_reports_fallback", {}).get(run_id)

