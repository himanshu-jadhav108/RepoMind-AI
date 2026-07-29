import asyncio
import json
from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, Depends, Query, status
from fastapi.responses import StreamingResponse

from app.agents.learning_agent import LearningAgent
from app.core.dependency_injection import get_analysis_service, get_provider_router
from app.core.logging import logger
from app.models.analysis import (
    AgentStatus,
    AgentStatusEnum,
    AnalysisRunCreate,
    AnalysisRunDetail,
    AnalysisRunResponse,
    RunStatus,
)
from app.models.finding import (
    Finding,
    FindingCategory,
    FindingSeverity,
    PaginatedFindingsResponse,
    ReviewStatus,
)
from app.models.report import HealthScoreResponse
from app.orchestration.graph import _run_live_statuses, repomind_app
from app.services.analysis_service import AnalysisService

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

    # Fetch actual registered repository metadata to construct real GitHub URL for git cloning
    repo_meta = await analysis_service.repo_repository.get_by_id(payload.repo_id)
    if repo_meta and repo_meta.owner and repo_meta.name:
        repo_url = f"https://github.com/{repo_meta.owner}/{repo_meta.name}"
    else:
        repo_url = f"https://github.com/placeholder/{payload.repo_id}"

    # P0-1 FIX: Initialise live status entry so SSE can start polling immediately
    _run_live_statuses[run_res.run_id] = {}

    # Async background task — persists results on pipeline completion
    async def run_pipeline_task():
        try:
            logger.info(f"Starting background LangGraph execution for run '{run_res.run_id}' ({repo_url})")

            # Execute LangGraph pipeline
            final_state = await repomind_app.ainvoke(
                {
                    "run_id": run_res.run_id,
                    "repo_url": repo_url,
                    "commit_sha": payload.commit_sha or "latest",
                    "agent_statuses": {},
                    "errors": [],
                }
            )

            # 1. Persist Findings
            raw_reviewed = final_state.get("reviewed_findings", [])
            finding_objs = []
            for f in raw_reviewed:
                if isinstance(f, dict):
                    finding_objs.append(
                        Finding(
                            id=f.get("id", f"finding-{run_res.run_id}"),
                            category=FindingCategory(f.get("category", "bug")),
                            severity=FindingSeverity(f.get("severity", "medium")),
                            file=f.get("file", "unknown"),
                            line_start=f.get("line_start", 1),
                            line_end=f.get("line_end", 1),
                            description=f.get("description", ""),
                            suggested_fix=f.get("suggested_fix"),
                            reasoning=f.get("reasoning", ""),
                            confidence=float(f.get("confidence", 0.8)),
                            evidence=f.get("evidence", ""),
                            referenced_files=f.get("referenced_files", []),
                            review_status=ReviewStatus(f.get("review_status", "approved")),
                        )
                    )

            if finding_objs:
                await analysis_service.analysis_repository.save_findings(run_res.run_id, finding_objs)

            # 2. Persist Report & Health Score
            health_score = final_state.get("health_score", {"overall_score": 88.0})
            report_data = final_state.get("final_report", {})
            report_md = report_data.get("markdown") if isinstance(report_data, dict) else str(report_data)

            if report_md or health_score:
                await analysis_service.analysis_repository.save_report(
                    run_res.run_id,
                    report_markdown=report_md or f"# Audit Report for {repo_url}",
                    health_score=health_score,
                )

            # P0-2 FIX: Persist knowledge graph data so the /graph endpoint can serve it
            knowledge_graph = final_state.get("knowledge_graph_data")
            if knowledge_graph:
                await analysis_service.analysis_repository.save_agent_results(
                    run_res.run_id,
                    {
                        "knowledge_graph": knowledge_graph,
                        "architect_summary": final_state.get("architect_summary"),
                        "documentation_markdown": final_state.get("documentation_markdown"),
                        "feature_suggestions": final_state.get("feature_suggestions"),
                    },
                )

            # 3. Update agent statuses and set run status to COMPLETED
            agent_statuses_dict = final_state.get("agent_statuses", {})
            updated_agents = []
            for name, st in agent_statuses_dict.items():
                st_enum = AgentStatusEnum.COMPLETED if st in ["completed", "degraded"] else AgentStatusEnum.FAILED
                updated_agents.append(AgentStatus(name=name, status=st_enum))

            existing_run = await analysis_service.analysis_repository.get_by_id(run_res.run_id)
            if existing_run:
                # "agents" is the correct field name on AnalysisRunDetail (not "agents_status")
                await analysis_service.analysis_repository.update(
                    run_res.run_id,
                    {
                        "status": RunStatus.COMPLETED.value,
                        "agents": [a.model_dump() for a in updated_agents] if updated_agents else [a.model_dump() for a in existing_run.agents],
                        "completed_at": datetime.now(timezone.utc).isoformat(),
                    },
                )
            logger.info(f"Background analysis task for run '{run_res.run_id}' completed successfully.")

        except Exception as e:
            logger.error(f"Background analysis task for '{run_res.run_id}' failed: {str(e)}", exc_info=True)
            existing_run = await analysis_service.analysis_repository.get_by_id(run_res.run_id)
            if existing_run:
                await analysis_service.analysis_repository.update(run_res.run_id, {"status": RunStatus.FAILED.value})
            # Mark all remaining agents as failed in live status
            _run_live_statuses[run_res.run_id]["__error__"] = str(e)

    asyncio.create_task(run_pipeline_task())

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
    P0-1 FIX: Stream REAL live agent status updates (Server-Sent Events) per API.md.
    Polls _run_live_statuses (written by each LangGraph node as it executes) every 1.5s.
    Terminates when the run reaches COMPLETED or FAILED state, or after 5 minutes.
    """
    await analysis_service.get_run_detail(run_id)

    async def event_generator():
        seen_agents: set = set()
        max_wait_seconds = 300  # 5-minute hard timeout
        elapsed = 0.0
        poll_interval = 1.5

        while elapsed < max_wait_seconds:
            live = _run_live_statuses.get(run_id, {})

            # Emit any newly completed/running agents not yet seen
            for agent_name, agent_status in list(live.items()):
                if agent_name.startswith("__"):
                    continue  # skip internal marker keys
                if agent_name not in seen_agents:
                    seen_agents.add(agent_name)
                    event_data = {
                        "agent": agent_name,
                        "status": agent_status,
                        "timestamp": datetime.now(timezone.utc).isoformat(),
                    }
                    yield f"data: {json.dumps(event_data)}\n\n"

            # Check persistent store for run completion
            try:
                run_detail = await analysis_service.analysis_repository.get_by_id(run_id)
                if run_detail and run_detail.status in (RunStatus.COMPLETED, RunStatus.FAILED):
                    # Flush any remaining agent statuses
                    for agent_name, agent_status in list(_run_live_statuses.get(run_id, {}).items()):
                        if not agent_name.startswith("__") and agent_name not in seen_agents:
                            seen_agents.add(agent_name)
                            yield f"data: {json.dumps({'agent': agent_name, 'status': agent_status, 'timestamp': datetime.now(timezone.utc).isoformat()})}\n\n"
                    # Emit final pipeline_complete event
                    completion_event = {
                        "event": "pipeline_complete",
                        "status": run_detail.status.value,
                        "timestamp": datetime.now(timezone.utc).isoformat(),
                    }
                    yield f"data: {json.dumps(completion_event)}\n\n"
                    return
            except Exception:
                pass  # Continue streaming even if status check fails

            await asyncio.sleep(poll_interval)
            elapsed += poll_interval

        # Timeout — emit a timeout signal
        yield f"data: {json.dumps({'event': 'timeout', 'timestamp': datetime.now(timezone.utc).isoformat()})}\n\n"

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",  # Disable Nginx buffering for SSE
        },
    )


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


# P0-2 FIX: Dedicated endpoint to serve the NetworkX knowledge graph in React Flow format
@router.get("/{run_id}/graph", status_code=status.HTTP_200_OK)
async def get_knowledge_graph(
    run_id: str,
    analysis_service: AnalysisService = Depends(get_analysis_service),
):
    """
    Returns the Repository Knowledge Graph (React Flow format) built by the Repository Analyzer.
    P0-2 FIX: Frontend now fetches real graph data instead of showing hardcoded demo nodes.
    """
    await analysis_service.get_run_detail(run_id)
    results = await analysis_service.analysis_repository.get_agent_results(run_id)
    graph_data = results.get("knowledge_graph") if results else None
    return {
        "run_id": run_id,
        "graph": graph_data or {"nodes": [], "edges": []},
    }


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
    code_snippet = payload.get("code_snippet")

    if line_start > line_end or line_start < 0:
        from app.core.exceptions import RepoMindException
        raise RepoMindException("Invalid line range specified.", code="INVALID_LINE_RANGE", status_code=400)

    if not code_snippet:
        code_snippet = f"Code snippet from module {file_path} (lines {line_start} to {line_end})"

    provider_router = get_provider_router()
    learning_agent = LearningAgent(provider_router)
    return await learning_agent.explain_code(file_path=file_path, code_snippet=code_snippet, run_id=run_id)


@router.get("/{run_id}/report", status_code=status.HTTP_200_OK)
async def get_run_report(
    run_id: str,
    analysis_service: AnalysisService = Depends(get_analysis_service),
):
    """
    Retrieve the consolidated engineering markdown audit report for a completed run per API.md.
    """
    await analysis_service.get_run_detail(run_id)
    from app.core.dependency_injection import get_report_service
    report_service = get_report_service()
    report_res = await report_service.get_final_report(run_id)
    return {"run_id": run_id, "report_markdown": report_res.report_markdown}


@router.get("/{run_id}/report/export", status_code=status.HTTP_200_OK)
async def export_run_report(
    run_id: str,
    format: str = Query("md", description="Export format: md or html"),
    analysis_service: AnalysisService = Depends(get_analysis_service),
):
    """
    Export the consolidated engineering audit report as a downloadable file attachment (.md or .html).
    """
    from fastapi.responses import Response
    await analysis_service.get_run_detail(run_id)
    from app.core.dependency_injection import get_report_service
    report_service = get_report_service()
    report_res = await report_service.get_final_report(run_id)
    content = report_res.report_markdown

    if format == "html":
        media_type = "text/html"
        filename = f"RepoMind_Audit_Report_{run_id}.html"
        content = f"<html><body><h1>RepoMind AI Audit Report</h1><pre>{content}</pre></body></html>"
    else:
        media_type = "text/markdown"
        filename = f"RepoMind_Audit_Report_{run_id}.md"

    return Response(
        content=content,
        media_type=media_type,
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )
