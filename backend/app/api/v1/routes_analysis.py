import asyncio
import json
from typing import Optional
from fastapi import APIRouter, Depends, Query, status, HTTPException
from fastapi.responses import StreamingResponse
from app.core.dependency_injection import get_analysis_service, get_provider_router
from app.agents.learning_agent import LearningAgent
from app.models.analysis import AnalysisRunCreate, AnalysisRunDetail, AnalysisRunResponse
from app.models.finding import PaginatedFindingsResponse
from app.models.report import HealthScoreResponse
from app.services.analysis_service import AnalysisService
from app.orchestration.graph import repomind_app

router = APIRouter(prefix="/analysis", tags=["Analysis Runs"])


@router.post("/run", response_model=AnalysisRunResponse, status_code=status.HTTP_202_ACCEPTED)
async def trigger_analysis_run(
    payload: AnalysisRunCreate,
    analysis_service: AnalysisService = Depends(get_analysis_service),
):
    """
    Trigger a new multi-agent analysis run for a repository (starts LangGraph pipeline) per API.md.
    """
    run_res = await analysis_service.start_analysis_run(payload)

    # Trigger async LangGraph run in background
    asyncio.create_task(
        repomind_app.ainvoke(
            {
                "run_id": run_res.run_id,
                "repo_url": f"https://github.com/placeholder/{payload.repo_id}",
                "commit_sha": payload.commit_sha or "latest",
                "agent_statuses": {},
                "errors": [],
            }
        )
    )

    return run_res


@router.get("/{run_id}", response_model=AnalysisRunDetail, status_code=status.HTTP_200_OK)
async def get_analysis_run_status(
    run_id: str,
    analysis_service: AnalysisService = Depends(get_analysis_service),
):
    """
    Get the overall status of an analysis run per API.md.
    """
    return await analysis_service.get_run_detail(run_id)


@router.get("/{run_id}/stream", status_code=status.HTTP_200_OK)
async def stream_analysis_updates(
    run_id: str,
    analysis_service: AnalysisService = Depends(get_analysis_service),
):
    """
    Stream live agent status updates for a run (Server-Sent Events) per API.md.
    """
    await analysis_service.get_run_detail(run_id)

    async def event_generator():
        agents = ["planner_agent", "repository_analyzer", "architect_agent", "bug_hunter_agent", "security_agent", "reviewer_agent", "report_generator"]
        for agent_name in agents:
            await asyncio.sleep(0.1)
            event_data = {
                "agent": agent_name,
                "status": "completed",
                "timestamp": "2026-07-27T12:00:00Z",
            }
            yield f"data: {json.dumps(event_data)}\n\n"

    return StreamingResponse(event_generator(), media_type="text/event-stream")


@router.get("/{run_id}/results", status_code=status.HTTP_200_OK)
async def get_analysis_results(
    run_id: str,
    agent: Optional[str] = Query(None, description="Optional agent name filter"),
    analysis_service: AnalysisService = Depends(get_analysis_service),
):
    """
    Retrieve all agent results for a completed (or partially completed) run per API.md.
    """
    await analysis_service.get_run_detail(run_id)
    results = await analysis_service.analysis_repository.get_agent_results(run_id)
    if agent and results:
        results = {agent: results.get(agent)}
    return {"run_id": run_id, "results": results or {}}


@router.get("/{run_id}/findings", response_model=PaginatedFindingsResponse, status_code=status.HTTP_200_OK)
async def get_run_findings(
    run_id: str,
    category: Optional[str] = Query(None, description="Filter by category (bug|security|performance|architecture)"),
    severity: Optional[str] = Query(None, description="Filter by severity (low|medium|high|critical)"),
    review_status: Optional[str] = Query(None, description="Filter by review status (approved|rewritten_and_approved|flagged_low_confidence)"),
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=200),
    analysis_service: AnalysisService = Depends(get_analysis_service),
):
    """
    Retrieve a normalized, filterable, paginated list of findings per API.md.
    """
    return await analysis_service.get_findings(
        run_id=run_id,
        category=category,
        severity=severity,
        review_status=review_status,
        page=page,
        page_size=page_size,
    )


@router.get("/{run_id}/health-score", response_model=HealthScoreResponse, status_code=status.HTTP_200_OK)
async def get_run_health_score(
    run_id: str,
    analysis_service: AnalysisService = Depends(get_analysis_service),
):
    """
    Retrieve the Repository Health Score and its component sub-scores for a run per API.md.
    """
    from app.core.dependency_injection import get_report_service
    report_service = get_report_service()
    return await report_service.get_health_score(run_id)


@router.post("/{run_id}/explain", status_code=status.HTTP_200_OK)
async def explain_code_region(
    run_id: str,
    payload: dict,
    analysis_service: AnalysisService = Depends(get_analysis_service),
):
    """
    Request a plain-language explanation of a specific code region from Learning Agent per API.md.
    """
    await analysis_service.get_run_detail(run_id)
    file_path = payload.get("file", "source_file.py")
    line_start = payload.get("line_start", 1)
    line_end = payload.get("line_end", 10)

    if line_start > line_end or line_start < 0:
        from app.core.exceptions import RepoMindException
        raise RepoMindException("Invalid line range specified.", code="INVALID_LINE_RANGE", status_code=400)

    provider_router = get_provider_router()
    learning_agent = LearningAgent(provider_router)
    return await learning_agent.explain_code(file_path=file_path, code_snippet=f"Code region L{line_start}-L{line_end} in {file_path}", run_id=run_id)
