import pytest

from app.agents.architect_agent import ArchitectAgent
from app.agents.planner_agent import DEFAULT_EXECUTION_PLAN, PlannerAgent
from app.providers.provider_router import ProviderRouter


class FailingMockProvider:
    """Mock provider adapter that always raises runtime errors to simulate outage."""

    def __init__(self, name: str = "failing_provider") -> None:
        self._name = name

    @property
    def name(self) -> str:
        return self._name

    def is_available(self) -> bool:
        # P0-4 FIX: Must be a regular method (not @property) because ProviderRouter
        # calls provider.is_available() — a @property would return bool causing
        # TypeError: 'bool' object is not callable.
        return True

    async def generate(self, prompt: str, **kwargs):
        raise RuntimeError(f"Simulated outage / 500 server error on {self._name}")


@pytest.mark.asyncio
async def test_provider_router_failover_simulation():
    # Router with 2 failing providers followed by mock fallback
    router = ProviderRouter(max_retries_per_provider=1)
    router.register_provider(FailingMockProvider("primary_failing_gemini"))
    router.register_provider(FailingMockProvider("secondary_failing_groq"))

    planner = PlannerAgent(router)
    # PlannerAgent should gracefully degrade to DEFAULT_EXECUTION_PLAN
    plan = await planner.plan_execution("https://github.com/owner/failover-test-repo", run_id="failover_run")
    assert plan == DEFAULT_EXECUTION_PLAN


@pytest.mark.asyncio
async def test_agent_degraded_status_on_total_provider_outage():
    router = ProviderRouter(max_retries_per_provider=1)
    router.register_provider(FailingMockProvider("outage_provider"))

    agent = ArchitectAgent(router)
    state = {
        "run_id": "outage_run",
        "repo_structure": {"primary_language": "Python", "total_files": 5},
        "knowledge_graph_data": {},
    }

    res = await agent.run(state)
    assert "architect_summary" in res
    assert res["agent_statuses"]["architect_agent"] == "degraded"
    assert res["architect_summary"]["confidence"] == 0.70
