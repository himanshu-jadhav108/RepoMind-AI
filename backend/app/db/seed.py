import asyncio
import sys
from datetime import datetime, timezone
from pathlib import Path

# Add backend directory to sys.path
backend_dir = Path(__file__).resolve().parent.parent.parent
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

from app.core.dependency_injection import get_analysis_service  # noqa: E402
from app.core.logging import logger  # noqa: E402
from app.db.supabase_client import get_supabase_client  # noqa: E402
from app.models.analysis import (  # noqa: E402
    AgentStatus,
    AgentStatusEnum,
    AnalysisRunDetail,
    RunStatus,
)


async def seed_demo_workspace_data() -> bool:
    """
    Seed a complete pre-analyzed demo workspace run ('demo-hackathon-workspace')
    into the active repository (Supabase or in-memory fallback).
    """
    try:
        analysis_service = get_analysis_service()
        demo_run_id = "demo-hackathon-workspace"

        existing = await analysis_service.analysis_repository.get_by_id(demo_run_id)
        if existing:
            logger.info(f"Demo workspace '{demo_run_id}' is already seeded.")
            return True

        _now = datetime.now(timezone.utc)
        demo_run = AnalysisRunDetail(
            run_id=demo_run_id,
            repo_id="repo-repomind-ai",
            status=RunStatus.COMPLETED,
            agents=[
                AgentStatus(name="planner_agent", status=AgentStatusEnum.COMPLETED),
                AgentStatus(name="repository_analyzer", status=AgentStatusEnum.COMPLETED),
                AgentStatus(name="architect_agent", status=AgentStatusEnum.COMPLETED),
                AgentStatus(name="bug_hunter_agent", status=AgentStatusEnum.COMPLETED),
                AgentStatus(name="security_agent", status=AgentStatusEnum.COMPLETED),
                AgentStatus(name="performance_agent", status=AgentStatusEnum.COMPLETED),
                AgentStatus(name="documentation_agent", status=AgentStatusEnum.COMPLETED),
                AgentStatus(name="reviewer_agent", status=AgentStatusEnum.COMPLETED),
                AgentStatus(name="feature_suggestion_agent", status=AgentStatusEnum.COMPLETED),
                AgentStatus(name="report_generator", status=AgentStatusEnum.COMPLETED),
            ],
            started_at=_now,
            completed_at=_now,
        )
        await analysis_service.analysis_repository.create(demo_run)
        logger.info(f"Successfully seeded demo workspace '{demo_run_id}'.")
        return True
    except Exception as e:
        logger.warning(f"Failed to seed demo workspace data: {e}")
        return False


def run_seed():
    """
    Standalone CLI runner for database & workspace seeding.
    """
    logger.info("Starting standalone database and demo workspace seeding...")

    # 1. Supabase SQL Seed check
    client = get_supabase_client()
    if client:
        sql_path = Path(__file__).resolve().parent / "seed.sql"
        if sql_path.exists():
            logger.info(f"Found SQL schema seed file at {sql_path}.")
    else:
        logger.info("Supabase credentials not configured. Running with in-memory persistence fallback.")

    # 2. Seed Demo Workspace Record
    success = asyncio.run(seed_demo_workspace_data())
    if success:
        logger.info("Demo workspace seeding completed successfully.")
    else:
        logger.error("Demo workspace seeding encountered an issue.")


if __name__ == "__main__":
    run_seed()
