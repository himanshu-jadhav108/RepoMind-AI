import json
from typing import Any, Dict, Optional
from app.core.logging import logger, log_agent_event
from app.providers.provider_router import ProviderRouter

DEFAULT_EXECUTION_PLAN = {
    "agent_order": [
        "planner_agent",
        "repository_analyzer",
        "architect_agent",
        "bug_hunter_agent",
        "security_agent",
        "performance_agent",
        "documentation_agent",
        "reviewer_agent",
        "report_generator",
    ],
    "parallel_groups": [["architect_agent", "bug_hunter_agent", "security_agent"]],
    "scope_limits": {"max_files_deep_parse": 50, "central_module_limit": 10},
    "rationale": "Default execution plan applied: sequential initialization followed by parallel scanning.",
}


class PlannerAgent:
    """
    Runs before any analysis agent to produce an explicit execution plan per AGENTS.md.
    Uses AI Provider Layer to reason about repo size, scope limits, and agent ordering.
    Falls back gracefully to DEFAULT_EXECUTION_PLAN on failure.
    """

    def __init__(self, provider_router: ProviderRouter) -> None:
        self.provider_router = provider_router

    async def plan_execution(self, repo_url: str, run_id: str = "run") -> Dict[str, Any]:
        log_agent_event("start", "planner_agent", run_id, f"Generating execution plan for '{repo_url}'")

        prompt = f"""
        You are the Lead Solution Architect Planner for RepoMind AI.
        Generate a structured execution plan for analyzing the GitHub repository: '{repo_url}'.

        Return a JSON object matching this exact schema:
        {{
            "agent_order": ["planner_agent", "repository_analyzer", "architect_agent", "bug_hunter_agent", "security_agent", "performance_agent", "documentation_agent", "reviewer_agent", "report_generator"],
            "parallel_groups": [["architect_agent", "bug_hunter_agent", "security_agent"]],
            "scope_limits": {{
                "max_files_deep_parse": 50,
                "central_module_limit": 10
            }},
            "rationale": "Detailed explanation of execution ordering and scope tuning"
        }}
        """

        system_instruction = "You are a software execution planner. Output raw JSON only."

        try:
            res = await self.provider_router.generate(
                prompt=prompt,
                system_instruction=system_instruction,
                json_output=True,
                run_id=run_id,
                agent_name="planner_agent",
            )
            parsed_plan = json.loads(res.content)
            log_agent_event("complete", "planner_agent", run_id, f"Execution plan generated successfully: {parsed_plan.get('rationale')}")
            return parsed_plan
        except Exception as e:
            logger.warning(f"[PlannerAgent] Fallback to default execution plan due to error: {str(e)}")
            log_agent_event("degraded", "planner_agent", run_id, f"Using default plan fallback: {str(e)}")
            return DEFAULT_EXECUTION_PLAN
