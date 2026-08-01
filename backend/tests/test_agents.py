import pytest

from app.agents.architect_agent import ArchitectAgent
from app.agents.bug_hunter_agent import BugHunterAgent
from app.agents.documentation_agent import DocumentationAgent
from app.agents.feature_suggestion_agent import FeatureSuggestionAgent
from app.agents.learning_agent import LearningAgent
from app.agents.performance_agent import PerformanceAgent
from app.agents.report_generator_agent import ReportGeneratorAgent
from app.agents.reviewer_agent import ReviewerAgent
from app.agents.security_agent import SecurityAgent
from app.providers.mock_provider import MockProvider
from app.providers.provider_router import ProviderRouter


@pytest.fixture
def mock_provider():
    return MockProvider()


@pytest.fixture
def provider_router(mock_provider):
    router = ProviderRouter(max_retries_per_provider=1)
    router.register_provider(mock_provider)
    router.set_priority_order(["mock_provider"])
    return router


@pytest.fixture
def sample_state():
    return {
        "run_id": "test_agent_run",
        "repo_url": "https://github.com/owner/test-repo",
        "repo_structure": {
            "primary_language": "Python",
            "total_files": 10,
            "top_central_modules": ["app/main.py", "app/service.py"],
            "file_contexts": {
                "app/main.py": "def handle_request():\n    allow_origins=['*']\n    return {'status': 'ok'}\n"
            },
        },
        "knowledge_graph_data": {"nodes": [], "edges": []},
        "bug_findings": [
            {
                "id": "b1",
                "category": "bug",
                "severity": "medium",
                "file": "app/main.py",
                "line_start": 10,
                "line_end": 20,
                "description": "Unhandled exception in endpoint handler",
                "suggested_fix": "Add try-except block",
                "reasoning": "AST analysis detected missing exception handling",
                "confidence": 0.85,
                "evidence": "def handle(): pass",
                "referenced_files": ["app/main.py"],
            }
        ],
        "agent_statuses": {},
    }


@pytest.mark.asyncio
async def test_architect_agent(provider_router, sample_state):
    agent = ArchitectAgent(provider_router)
    res = await agent.run(sample_state)
    assert "architect_summary" in res
    assert res["agent_statuses"]["architect_agent"] == "completed"
    assert "Clean Architecture" in res["architect_summary"]["patterns"]
    assert res["architect_summary"]["confidence"] >= 0.90


@pytest.mark.asyncio
async def test_documentation_agent(provider_router, sample_state):
    agent = DocumentationAgent(provider_router)
    res = await agent.run(sample_state)
    assert "documentation_markdown" in res
    assert res["agent_statuses"]["documentation_agent"] == "completed"
    assert "markdown" in res["documentation_markdown"]


@pytest.mark.asyncio
async def test_bug_hunter_agent(provider_router, sample_state):
    agent = BugHunterAgent(provider_router)
    res = await agent.run(sample_state)
    assert "bug_findings" in res
    assert res["agent_statuses"]["bug_hunter_agent"] == "completed"
    assert len(res["bug_findings"]) > 0
    assert "exception" in res["bug_findings"][0]["description"].lower()


@pytest.mark.asyncio
async def test_security_agent(provider_router, sample_state):
    agent = SecurityAgent(provider_router)
    res = await agent.run(sample_state)
    assert "security_findings" in res
    assert res["agent_statuses"]["security_agent"] == "completed"
    assert len(res["security_findings"]) > 0
    assert "cors" in res["security_findings"][0]["description"].lower()


@pytest.mark.asyncio
async def test_performance_agent(provider_router, sample_state):
    agent = PerformanceAgent(provider_router)
    res = await agent.run(sample_state)
    assert "performance_findings" in res
    assert res["agent_statuses"]["performance_agent"] == "completed"
    assert len(res["performance_findings"]) > 0
    assert "event loop" in res["performance_findings"][0]["description"].lower()


@pytest.mark.asyncio
async def test_learning_agent(provider_router):
    agent = LearningAgent(provider_router)
    res = await agent.explain_code("app/main.py", "def hello(): print('world')")
    assert "summary" in res
    assert "related_concepts" in res


@pytest.mark.asyncio
async def test_feature_suggestion_agent(provider_router, sample_state):
    agent = FeatureSuggestionAgent(provider_router)
    res = await agent.run(sample_state)
    assert "feature_suggestions" in res
    assert res["agent_statuses"]["feature_suggestion_agent"] == "completed"


@pytest.mark.asyncio
async def test_reviewer_agent(provider_router, sample_state):
    agent = ReviewerAgent(provider_router)
    res = await agent.run(sample_state)
    assert "reviewed_findings" in res
    assert res["agent_statuses"]["reviewer_agent"] == "completed"
    assert len(res["reviewed_findings"]) == 1
    assert res["reviewed_findings"][0]["review_status"] == "approved"


@pytest.mark.asyncio
async def test_report_generator_agent(provider_router, sample_state):
    sample_state["reviewed_findings"] = sample_state["bug_findings"]
    agent = ReportGeneratorAgent(provider_router)
    res = await agent.run(sample_state)
    assert "health_score" in res
    assert "overall_score" in res["health_score"]
    assert "final_report" in res
    assert res["agent_statuses"]["report_generator"] == "completed"


@pytest.mark.asyncio
async def test_agent_prompt_source_code_grounding(provider_router, mock_provider, sample_state):
    """
    Regression test ensuring agent prompts actually contain real file source code.
    """
    agent = ArchitectAgent(provider_router)
    await agent.run(sample_state)
    assert mock_provider.last_prompt is not None
    assert "def handle_request():" in mock_provider.last_prompt
    assert "allow_origins=['*']" in mock_provider.last_prompt

