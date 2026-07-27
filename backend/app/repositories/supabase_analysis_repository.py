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

    async def get_by_id(self, item_id: str) -> Optional[AnalysisRunDetail]:
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
        self.client.table(self.runs_table).update(data).eq("id", item_id).execute()
        return await self.get_by_id(item_id)

    async def delete(self, item_id: str) -> bool:
        res = self.client.table(self.runs_table).delete().eq("id", item_id).execute()
        return bool(res.data)

    async def save_findings(self, run_id: str, findings: List[Finding]) -> None:
        if not findings:
            return
        payloads = [
            {
                "id": f.id,
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
            for f in findings
        ]
        self.client.table(self.findings_table).insert(payloads).execute()

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
