import asyncio
from datetime import datetime, timezone
from typing import Dict, Any
from langgraph.graph import StateGraph, END, START
from app.agents.architect_agent import ArchitectAgent
from app.agents.bug_hunter_agent import BugHunterAgent
from app.agents.documentation_agent import DocumentationAgent
from app.agents.feature_suggestion_agent import FeatureSuggestionAgent
from app.agents.performance_agent import PerformanceAgent
from app.agents.planner_agent import PlannerAgent
from app.agents.repository_analyzer import RepositoryAnalyzer
from app.agents.report_generator_agent import ReportGeneratorAgent
from app.agents.reviewer_agent import ReviewerAgent
from app.agents.security_agent import SecurityAgent
from app.core.dependency_injection import get_provider_router
from app.core.logging import logger, log_agent_event
from app.orchestration.state import AnalysisState


# --- Node Definitions for LangGraph Pipeline ---

async def planner_node(state: AnalysisState) -> Dict[str, Any]:
    run_id = state.get("run_id", "run")
    repo_url = state.get("repo_url", "")
    provider_router = get_provider_router()
    planner = PlannerAgent(provider_router)
    return await planner.run_planner(repo_url, run_id=run_id) if hasattr(planner, "run_planner") else {
        "execution_plan": await planner.plan_execution(repo_url, run_id=run_id),
        "agent_statuses": {"planner_agent": "completed"},
    }


async def repository_analyzer_node(state: AnalysisState) -> Dict[str, Any]:
    run_id = state.get("run_id", "run")
    repo_url = state.get("repo_url", "")
    analyzer = RepositoryAnalyzer()
    scan_results, _, react_flow_graph = analyzer.analyze_repository(repo_url, run_id=run_id)

    return {
        "repo_structure": scan_results,
        "knowledge_graph_data": react_flow_graph,
        "agent_statuses": {"repository_analyzer": "completed"},
    }


async def architect_node(state: AnalysisState) -> Dict[str, Any]:
    provider_router = get_provider_router()
    agent = ArchitectAgent(provider_router)
    return await agent.run(state)


async def bug_hunter_node(state: AnalysisState) -> Dict[str, Any]:
    provider_router = get_provider_router()
    agent = BugHunterAgent(provider_router)
    return await agent.run(state)


async def security_node(state: AnalysisState) -> Dict[str, Any]:
    provider_router = get_provider_router()
    agent = SecurityAgent(provider_router)
    return await agent.run(state)


async def performance_node(state: AnalysisState) -> Dict[str, Any]:
    provider_router = get_provider_router()
    agent = PerformanceAgent(provider_router)
    return await agent.run(state)


async def documentation_node(state: AnalysisState) -> Dict[str, Any]:
    provider_router = get_provider_router()
    agent = DocumentationAgent(provider_router)
    return await agent.run(state)


async def feature_suggestion_node(state: AnalysisState) -> Dict[str, Any]:
    provider_router = get_provider_router()
    agent = FeatureSuggestionAgent(provider_router)
    return await agent.run(state)


async def reviewer_loop_node(state: AnalysisState) -> Dict[str, Any]:
    provider_router = get_provider_router()
    agent = ReviewerAgent(provider_router)
    return await agent.run(state)


async def report_generator_node(state: AnalysisState) -> Dict[str, Any]:
    provider_router = get_provider_router()
    agent = ReportGeneratorAgent(provider_router)
    return await agent.run(state)


# --- Graph Construction Function ---

def build_repomind_graph() -> StateGraph:
    """
    Constructs the LangGraph StateGraph defining agent nodes, parallel branches,
    Reviewer Agent Loop convergence, and Report Generator termination.
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

    # Static Graph Topology Edges
    workflow.add_edge(START, "planner_agent")
    workflow.add_edge("planner_agent", "repository_analyzer")

    # Fan-out parallel branches after Repository Analyzer
    workflow.add_edge("repository_analyzer", "architect_agent")
    workflow.add_edge("repository_analyzer", "bug_hunter_agent")
    workflow.add_edge("repository_analyzer", "security_agent")

    # Sequential dependencies
    workflow.add_edge("architect_agent", "documentation_agent")
    workflow.add_edge("documentation_agent", "feature_suggestion_agent")
    workflow.add_edge("bug_hunter_agent", "performance_agent")

    # Convergence into Reviewer Agent Loop
    workflow.add_edge("feature_suggestion_agent", "reviewer_agent_loop")
    workflow.add_edge("performance_agent", "reviewer_agent_loop")
    workflow.add_edge("security_agent", "reviewer_agent_loop")

    # Final Join to Report Generator
    workflow.add_edge("reviewer_agent_loop", "report_generator")
    workflow.add_edge("report_generator", END)

    return workflow


# Compiled LangGraph app singleton
repomind_app = build_repomind_graph().compile()
