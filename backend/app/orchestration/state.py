import operator
from typing import Annotated, Any, Dict, List, Optional, TypedDict


def merge_dicts(left: Dict[str, str], right: Dict[str, str]) -> Dict[str, str]:
    """Reducer function to merge dictionary updates from parallel graph branches."""
    res = dict(left or {})
    if right:
        res.update(right)
    return res


class AnalysisState(TypedDict, total=False):
    """
    Shared graph state object passed through the LangGraph pipeline per AGENTS.md & ARCHITECTURE.md.
    Every agent reads only the fields it depends on and writes only its own output field.
    Parallel nodes use Annotated dictionary reducers to avoid state update collisions.
    """

    # Identifiers & Inputs
    run_id: str
    repo_url: str
    commit_sha: str

    # Execution Plan (Planner Agent)
    execution_plan: Dict[str, Any]

    # Repository Structural Data (Repository Analyzer)
    repo_structure: Dict[str, Any]
    knowledge_graph_data: Dict[str, Any]

    # Analysis Agent Outputs
    architect_summary: Dict[str, Any]
    bug_findings: List[Dict[str, Any]]
    security_findings: List[Dict[str, Any]]
    performance_findings: List[Dict[str, Any]]
    documentation_markdown: Dict[str, Any]
    feature_suggestions: List[Dict[str, Any]]

    # Reviewer Agent Loop Output
    reviewed_findings: List[Dict[str, Any]]

    # Final Consolidated Output (Report Generator)
    health_score: Dict[str, Any]
    final_report: Dict[str, Any]

    # Agent Lifecycle & Metadata Tracking (with parallel branch reducers)
    agent_statuses: Annotated[Dict[str, str], merge_dicts]
    errors: Annotated[List[Dict[str, Any]], operator.add]
