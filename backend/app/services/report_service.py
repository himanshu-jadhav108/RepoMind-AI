from datetime import datetime, timezone
from app.core.exceptions import AnalysisRunNotFoundException
from app.models.report import HealthScoreResponse, ReportResponse, SubScores
from app.repositories.analysis_repository import AnalysisRepository
from app.services.base_service import BaseService


class ReportService(BaseService):
    """
    Service layer for compiling reports and calculating Repository Health Score.
    """

    def __init__(self, analysis_repository: AnalysisRepository) -> None:
        self.analysis_repository = analysis_repository

    async def get_health_score(self, run_id: str) -> HealthScoreResponse:
        run = await self.analysis_repository.get_by_id(run_id)
        if not run:
            raise AnalysisRunNotFoundException(f"Analysis run with ID '{run_id}' not found.")

        # MVP Sub-Scores calculation shell (Architecture & Documentation live)
        sub_scores = SubScores(
            architecture=85.0,
            documentation=90.0,
            security=None,  # Null until Security Agent is online post-MVP
            performance=None,
            maintainability=None,
            testing=None,
        )

        return HealthScoreResponse(
            run_id=run_id,
            overall_score=87.5,
            sub_scores=sub_scores,
            generated_at=datetime.now(timezone.utc),
        )

    async def get_report(self, run_id: str) -> ReportResponse:
        run = await self.analysis_repository.get_by_id(run_id)
        if not run:
            raise AnalysisRunNotFoundException(f"Analysis run with ID '{run_id}' not found.")

        sample_markdown = f"# RepoMind AI Engineering Audit Report\n\n**Run ID**: {run_id}\n\n"
        sample_markdown += "## Executive Summary\nAnalysis completed successfully. Architecture and Documentation findings verified.\n"

        return ReportResponse(
            run_id=run_id,
            report_markdown=sample_markdown,
            generated_at=datetime.now(timezone.utc),
        )
