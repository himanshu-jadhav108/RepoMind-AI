import uuid
from datetime import datetime, timezone
from typing import List, Optional
from app.core.exceptions import AnalysisRunNotFoundException, RepositoryNotFoundException
from app.models.analysis import (
    AgentStatus,
    AgentStatusEnum,
    AnalysisRunCreate,
    AnalysisRunDetail,
    AnalysisRunResponse,
    RunStatus,
)
from app.models.finding import Finding
from app.repositories.analysis_repository import AnalysisRepository
from app.repositories.repo_metadata_repository import RepoMetadataRepository
from app.services.base_service import BaseService


class AnalysisService(BaseService):
    """
    Service layer for triggering, tracking, and retrieving repository analysis runs and findings.
    """

    def __init__(
        self,
        analysis_repository: AnalysisRepository,
        repo_repository: RepoMetadataRepository,
    ) -> None:
        self.analysis_repository = analysis_repository
        self.repo_repository = repo_repository

    async def start_analysis_run(self, payload: AnalysisRunCreate) -> AnalysisRunResponse:
        repo_metadata = await self.repo_repository.get_by_id(payload.repo_id)
        if not repo_metadata:
            raise RepositoryNotFoundException(f"Repository with ID '{payload.repo_id}' not found.")

        run_id = str(uuid.uuid4())
        initial_agents = [
            AgentStatus(name="planner_agent", status=AgentStatusEnum.QUEUED),
            AgentStatus(name="repository_analyzer", status=AgentStatusEnum.QUEUED),
            AgentStatus(name="architect_agent", status=AgentStatusEnum.QUEUED),
            AgentStatus(name="bug_hunter_agent", status=AgentStatusEnum.QUEUED),
            AgentStatus(name="documentation_agent", status=AgentStatusEnum.QUEUED),
            AgentStatus(name="reviewer_agent", status=AgentStatusEnum.QUEUED),
            AgentStatus(name="report_generator", status=AgentStatusEnum.QUEUED),
        ]

        run_detail = AnalysisRunDetail(
            run_id=run_id,
            repo_id=payload.repo_id,
            status=RunStatus.QUEUED,
            agents=initial_agents,
            started_at=datetime.now(timezone.utc),
            completed_at=None,
        )

        await self.analysis_repository.create(run_detail)

        return AnalysisRunResponse(
            run_id=run_id,
            status=RunStatus.QUEUED,
            created_at=run_detail.started_at,
        )

    async def get_run_detail(self, run_id: str) -> AnalysisRunDetail:
        run = await self.analysis_repository.get_by_id(run_id)
        if not run:
            raise AnalysisRunNotFoundException(f"Analysis run with ID '{run_id}' not found.")
        return run

    async def get_findings(
        self,
        run_id: str,
        category: Optional[str] = None,
        severity: Optional[str] = None,
        review_status: Optional[str] = None,
        page: int = 1,
        page_size: int = 50,
    ) -> dict:
        run = await self.analysis_repository.get_by_id(run_id)
        if not run:
            raise AnalysisRunNotFoundException(f"Analysis run with ID '{run_id}' not found.")

        findings = await self.analysis_repository.get_findings(
            run_id, category=category, severity=severity, review_status=review_status
        )

        total_items = len(findings)
        total_pages = (total_items + page_size - 1) // page_size if total_items > 0 else 0
        start_idx = (page - 1) * page_size
        end_idx = start_idx + page_size
        page_data = findings[start_idx:end_idx]

        return {
            "data": page_data,
            "pagination": {
                "page": page,
                "page_size": page_size,
                "total_items": total_items,
                "total_pages": total_pages,
            },
        }
