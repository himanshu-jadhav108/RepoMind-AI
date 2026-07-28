import tempfile
from pathlib import Path

import pytest

from app.agents.planner_agent import DEFAULT_EXECUTION_PLAN, PlannerAgent
from app.orchestration.graph import build_repomind_graph, repomind_app
from app.orchestration.state import AnalysisState
from app.providers.provider_router import ProviderRouter


@pytest.fixture
def mock_repo_dir():
    temp_dir = tempfile.mkdtemp(prefix="orchestration_test_")
    py_file = Path(temp_dir) / "app.py"
    py_file.write_text("print('Orchestration Test')", encoding="utf-8")
    yield temp_dir
    import shutil
    shutil.rmtree(temp_dir, ignore_errors=True)


@pytest.mark.asyncio
async def test_planner_agent_fallback():
    router = ProviderRouter(max_retries_per_provider=1)
    planner = PlannerAgent(router)
    # Router has no API keys, should trigger graceful fallback
    plan = await planner.plan_execution("https://github.com/test/repo", run_id="test_run")

    assert "agent_order" in plan
    assert "rationale" in plan
    assert plan == DEFAULT_EXECUTION_PLAN


def test_graph_compilation():
    workflow = build_repomind_graph()
    app = workflow.compile()
    assert app is not None


@pytest.mark.asyncio
async def test_langgraph_pipeline_execution(mock_repo_dir, monkeypatch):
    # Patch clone_repository to use local mock directory
    monkeypatch.setattr(
        "app.agents.repository_analyzer.GitIngestionService.clone_repository",
        lambda self, url: (mock_repo_dir, "test_commit_sha"),
    )

    initial_state: AnalysisState = {
        "run_id": "test_pipeline_run",
        "repo_url": "https://github.com/test/pipeline-repo",
        "commit_sha": "head",
        "agent_statuses": {},
        "errors": [],
    }

    final_state = await repomind_app.ainvoke(initial_state)

    assert "execution_plan" in final_state
    assert "repo_structure" in final_state
    assert "knowledge_graph_data" in final_state
    assert "architect_summary" in final_state
    assert "reviewed_findings" in final_state
    assert "final_report" in final_state
    assert final_state["agent_statuses"].get("report_generator") == "completed"
