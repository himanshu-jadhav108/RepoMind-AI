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
from app.providers.provider_router import ProviderRouter


@pytest.fixture
def provider_router():
    return ProviderRouter(max_retries_per_provider=1)


@pytest.fixture
def sample_state():
    return {
        "run_id": "test_agent_run",
        "repo_url": "https://github.com/owner/test-repo",
        "repo_structure": {
            "primary_language": "Python",
            "total_files": 10,
            "top_central_modules": ["app/main.py", "app/service.py"],
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
    assert res["architect_summary"]["confidence"] >= 0.0


@pytest.mark.asyncio
async def test_documentation_agent(provider_router, sample_state):
    agent = DocumentationAgent(provider_router)
    res = await agent.run(sample_state)
    assert "documentation_markdown" in res
    assert "markdown" in res["documentation_markdown"]


@pytest.mark.asyncio
async def test_bug_hunter_agent(provider_router, sample_state):
    agent = BugHunterAgent(provider_router)
    res = await agent.run(sample_state)
    assert "bug_findings" in res
    assert isinstance(res["bug_findings"], list)


@pytest.mark.asyncio
async def test_security_agent(provider_router, sample_state):
    agent = SecurityAgent(provider_router)
    res = await agent.run(sample_state)
    assert "security_findings" in res


@pytest.mark.asyncio
async def test_performance_agent(provider_router, sample_state):
    agent = PerformanceAgent(provider_router)
    res = await agent.run(sample_state)
    assert "performance_findings" in res


@pytest.mark.asyncio
async def test_learning_agent(provider_router):
    agent = LearningAgent(provider_router)
    res = await agent.explain_code("app/main.py", "def hello(): print('world')")
    assert "explanation" in res
    assert "related_concepts" in res


@pytest.mark.asyncio
async def test_feature_suggestion_agent(provider_router, sample_state):
    agent = FeatureSuggestionAgent(provider_router)
    res = await agent.run(sample_state)
    assert "feature_suggestions" in res


@pytest.mark.asyncio
async def test_reviewer_agent(provider_router, sample_state):
    agent = ReviewerAgent(provider_router)
    res = await agent.run(sample_state)
    assert "reviewed_findings" in res
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
