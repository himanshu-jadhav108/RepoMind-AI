import asyncio
from typing import Any, Dict

from langgraph.graph import END, START, StateGraph

from app.agents.architect_agent import ArchitectAgent
from app.agents.bug_hunter_agent import BugHunterAgent
from app.agents.documentation_agent import DocumentationAgent
from app.agents.feature_suggestion_agent import FeatureSuggestionAgent
from app.agents.performance_agent import PerformanceAgent
from app.agents.planner_agent import PlannerAgent
from app.agents.report_generator_agent import ReportGeneratorAgent
from app.agents.repository_analyzer import RepositoryAnalyzer
from app.agents.reviewer_agent import ReviewerAgent
from app.agents.security_agent import SecurityAgent

# get_provider_router is imported lazily inside each node to avoid module-level
# supabase dependency that breaks test collection when supabase is not installed.
from app.core.logging import logger
from app.orchestration.state import AnalysisState

# ---------------------------------------------------------------------------
# P0-1 FIX: Live agent status tracker for real-time SSE streaming.
# Format: {run_id: {agent_name: "queued" | "running" | "completed" | "degraded" | "failed"}}
# Written by each node as it executes; read by the SSE endpoint in routes_analysis.py.
# ---------------------------------------------------------------------------
# ---------------------------------------------------------------------------
# Live agent status tracker for real-time SSE streaming & storage persistence.
# Keyed by run_id; synchronized with AnalysisRepository.
# ---------------------------------------------------------------------------
_run_live_statuses: Dict[str, Dict[str, Any]] = {}


async def _set_agent_status(run_id: str, agent_name: str, status: str, extra_data: Dict[str, Any] | None = None) -> None:
    """Update live agent status in persistent analysis repository."""
    if run_id not in _run_live_statuses:
        _run_live_statuses[run_id] = {}
    _run_live_statuses[run_id][agent_name] = status
    if extra_data:
        _run_live_statuses[run_id].update(extra_data)
    logger.debug(f"[LiveStatus] run={run_id} agent={agent_name} -> {status}")

    try:
        from app.core.dependency_injection import get_analysis_service
        service = get_analysis_service()
        if service and service.analysis_repository:
            await service.analysis_repository.update_agent_status(run_id, agent_name, status, extra_data)
    except Exception as e:
        logger.debug(f"[LiveStatus] Persistence skip: {e}")


def _extract_agent_status(result: Dict[str, Any], agent_name: str) -> str:
    """Safely extract the agent status string from a node result dict."""
    statuses = result.get("agent_statuses", {})
    return statuses.get(agent_name, "completed")


# ---------------------------------------------------------------------------
# Node Definitions — each node sets running → completed/degraded/failed
# ---------------------------------------------------------------------------

async def planner_node(state: AnalysisState) -> Dict[str, Any]:
    run_id = state.get("run_id", "run")
    repo_url = state.get("repo_url", "")
    await _set_agent_status(run_id, "planner_agent", "running")
    from app.core.dependency_injection import get_provider_router
    provider_router = get_provider_router()
    planner = PlannerAgent(provider_router)
    try:
        plan = await planner.plan_execution(repo_url, run_id=run_id)
        await _set_agent_status(run_id, "planner_agent", "completed")
        return {
            "execution_plan": plan,
            "agent_statuses": {"planner_agent": "completed"},
        }
    except Exception as e:
        logger.warning(f"[planner_node] Failed: {e}")
        await _set_agent_status(run_id, "planner_agent", "degraded")
        return {
            "execution_plan": {},
            "agent_statuses": {"planner_agent": "degraded"},
        }


async def repository_analyzer_node(state: AnalysisState) -> Dict[str, Any]:
    """
    P0-5 FIX: Wraps blocking GitPython clone + filesystem scan in run_in_executor
    so the asyncio event loop is NOT frozen during the clone operation.
    """
    run_id = state.get("run_id", "run")
    repo_url = state.get("repo_url", "")
    await _set_agent_status(run_id, "repository_analyzer", "running")
    analyzer = RepositoryAnalyzer()

    try:
        # Run the blocking clone + parse pipeline in a thread-pool worker (P0-5)
        loop = asyncio.get_event_loop()
        scan_results, _, react_flow_graph = await loop.run_in_executor(
            None,  # uses default ThreadPoolExecutor
            analyzer.analyze_repository,
            repo_url,
            run_id,
        )
        await _set_agent_status(run_id, "repository_analyzer", "completed", extra_data={"knowledge_graph": react_flow_graph})
        return {
            "repo_structure": scan_results,
            "knowledge_graph_data": react_flow_graph,
            "agent_statuses": {"repository_analyzer": "completed"},
        }

    except Exception as e:
        logger.error(f"[repository_analyzer_node] Failed: {e}", exc_info=True)
        await _set_agent_status(run_id, "repository_analyzer", "failed")
        raise  # Propagate so LangGraph marks the run as failed


async def architect_node(state: AnalysisState) -> Dict[str, Any]:
    run_id = state.get("run_id", "run")
    await _set_agent_status(run_id, "architect_agent", "running")
    from app.core.dependency_injection import get_provider_router
    provider_router = get_provider_router()
    agent = ArchitectAgent(provider_router)
    result = await agent.run(state)
    await _set_agent_status(run_id, "architect_agent", _extract_agent_status(result, "architect_agent"))
    return result


async def bug_hunter_node(state: AnalysisState) -> Dict[str, Any]:
    run_id = state.get("run_id", "run")
    await _set_agent_status(run_id, "bug_hunter_agent", "running")
    from app.core.dependency_injection import get_provider_router
    provider_router = get_provider_router()
    agent = BugHunterAgent(provider_router)
    result = await agent.run(state)
    await _set_agent_status(run_id, "bug_hunter_agent", _extract_agent_status(result, "bug_hunter_agent"))
    return result


async def security_node(state: AnalysisState) -> Dict[str, Any]:
    run_id = state.get("run_id", "run")
    await _set_agent_status(run_id, "security_agent", "running")
    from app.core.dependency_injection import get_provider_router
    provider_router = get_provider_router()
    agent = SecurityAgent(provider_router)
    result = await agent.run(state)
    await _set_agent_status(run_id, "security_agent", _extract_agent_status(result, "security_agent"))
    return result


async def performance_node(state: AnalysisState) -> Dict[str, Any]:
    run_id = state.get("run_id", "run")
    await _set_agent_status(run_id, "performance_agent", "running")
    from app.core.dependency_injection import get_provider_router
    provider_router = get_provider_router()
    agent = PerformanceAgent(provider_router)
    result = await agent.run(state)
    await _set_agent_status(run_id, "performance_agent", _extract_agent_status(result, "performance_agent"))
    return result


async def documentation_node(state: AnalysisState) -> Dict[str, Any]:
    run_id = state.get("run_id", "run")
    await _set_agent_status(run_id, "documentation_agent", "running")
    from app.core.dependency_injection import get_provider_router
    provider_router = get_provider_router()
    agent = DocumentationAgent(provider_router)
    result = await agent.run(state)
    await _set_agent_status(run_id, "documentation_agent", _extract_agent_status(result, "documentation_agent"))
    return result


async def feature_suggestion_node(state: AnalysisState) -> Dict[str, Any]:
    run_id = state.get("run_id", "run")
    await _set_agent_status(run_id, "feature_suggestion_agent", "running")
    from app.core.dependency_injection import get_provider_router
    provider_router = get_provider_router()
    agent = FeatureSuggestionAgent(provider_router)
    result = await agent.run(state)
    await _set_agent_status(run_id, "feature_suggestion_agent", _extract_agent_status(result, "feature_suggestion_agent"))
    return result


async def reviewer_loop_node(state: AnalysisState) -> Dict[str, Any]:
    run_id = state.get("run_id", "run")
    retry_count = state.get("reviewer_retry_count", 0)
    await _set_agent_status(run_id, "reviewer_agent", "running")
    from app.core.dependency_injection import get_provider_router
    provider_router = get_provider_router()
    agent = ReviewerAgent(provider_router)
    result = await agent.run(state)
    await _set_agent_status(run_id, "reviewer_agent", _extract_agent_status(result, "reviewer_agent"))

    reviewed = result.get("reviewed_findings", [])
    rejected_categories = set()
    for f in reviewed:
        status_val = f.get("review_status")
        if status_val in ("rejected", "flagged_low_confidence"):
            cat = str(f.get("category", "")).lower()
            if cat in ("bug", "bugs"):
                rejected_categories.add("bug_hunter_agent")
            elif cat in ("sec", "security"):
                rejected_categories.add("security_agent")
            elif cat in ("perf", "performance"):
                rejected_categories.add("performance_agent")
            elif cat in ("arch", "architecture"):
                rejected_categories.add("architect_agent")
            else:
                rejected_categories.add("bug_hunter_agent")

    if rejected_categories and retry_count < 2:
        result["review_passed"] = False
        result["reviewer_retry_count"] = retry_count + 1
        priority_order = ["bug_hunter_agent", "security_agent", "performance_agent", "architect_agent"]
        target = next((ag for ag in priority_order if ag in rejected_categories), "bug_hunter_agent")
        result["rejected_agent_target"] = target
        result["review_feedback"] = f"Retry {retry_count + 1}: Refine evidence and filter low-confidence claims for {target}."
    else:
        result["review_passed"] = True
        result["reviewer_retry_count"] = retry_count
        result["rejected_agent_target"] = "report_generator"

    return result


def route_after_reviewer(state: AnalysisState) -> str:
    """Conditional router: loops back to rejected finding-producing agent (architect/bug_hunter/security/performance) on rejection up to 2 retries."""
    review_passed = state.get("review_passed", True)
    retry_count = state.get("reviewer_retry_count", 0)
    target_agent = state.get("rejected_agent_target", "bug_hunter_agent")
    if not review_passed and retry_count <= 2 and target_agent in ("architect_agent", "bug_hunter_agent", "security_agent", "performance_agent"):
        logger.info(f"[ReviewerLoop] Rejection detected for {target_agent}. Retrying branch (Attempt {retry_count}/2)...")
        return target_agent
    return "report_generator"


async def report_generator_node(state: AnalysisState) -> Dict[str, Any]:
    run_id = state.get("run_id", "run")
    await _set_agent_status(run_id, "report_generator", "running")
    from app.core.dependency_injection import get_provider_router
    provider_router = get_provider_router()
    agent = ReportGeneratorAgent(provider_router)
    result = await agent.run(state)
    await _set_agent_status(run_id, "report_generator", _extract_agent_status(result, "report_generator"))
    return result


# ---------------------------------------------------------------------------
# Graph Construction
# ---------------------------------------------------------------------------

def build_repomind_graph() -> StateGraph:
    """
    Constructs the LangGraph StateGraph defining agent nodes, sequential/parallel
    branches, Reviewer Agent convergence, self-correction retry loop, and Report Generator termination.
    """
    workflow = StateGraph(AnalysisState)

    # Add Nodes
    workflow.add_node("planner_agent", planner_node)
    workflow.add_node("repository_analyzer", repository_analyzer_node)
    workflow.add_node("architect_agent", architect_node)
    workflow.add_node("bug_hunter_agent", bug_hunter_node)
    workflow.add_node("security_agent", security_node)
    workflow.add_node("performance_agent", performance_node)
    workflow.add_node("documentation_agent", documentation_node)
    workflow.add_node("feature_suggestion_agent", feature_suggestion_node)
    workflow.add_node("reviewer_agent_loop", reviewer_loop_node)
    workflow.add_node("report_generator", report_generator_node)

    # Entry point
    workflow.add_edge(START, "planner_agent")
    workflow.add_edge("planner_agent", "repository_analyzer")

    # Fan-out branches after Repository Analyzer
    workflow.add_edge("repository_analyzer", "architect_agent")
    workflow.add_edge("repository_analyzer", "bug_hunter_agent")
    workflow.add_edge("repository_analyzer", "security_agent")

    # Sequential dependencies within branches
    workflow.add_edge("architect_agent", "documentation_agent")
    workflow.add_edge("documentation_agent", "feature_suggestion_agent")
    workflow.add_edge("bug_hunter_agent", "performance_agent")

    # Convergence into Reviewer Agent Loop
    workflow.add_edge("feature_suggestion_agent", "reviewer_agent_loop")
    workflow.add_edge("performance_agent", "reviewer_agent_loop")
    workflow.add_edge("security_agent", "reviewer_agent_loop")

    # Conditional Self-Correction Loop / Final join to Report Generator
    workflow.add_conditional_edges(
        "reviewer_agent_loop",
        route_after_reviewer,
        {
            "architect_agent": "architect_agent",
            "bug_hunter_agent": "bug_hunter_agent",
            "security_agent": "security_agent",
            "performance_agent": "performance_agent",
            "report_generator": "report_generator",
        },
    )
    workflow.add_edge("report_generator", END)

    return workflow


# Compiled LangGraph app singleton
repomind_app = build_repomind_graph().compile()
