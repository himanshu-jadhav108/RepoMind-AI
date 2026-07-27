import pytest
from app.agents.bug_hunter_agent import BugHunterAgent
from app.agents.reviewer_agent import ReviewerAgent
from app.agents.security_agent import SecurityAgent
from app.models.finding import FindingCategory, FindingSeverity, ReviewStatus
from app.providers.provider_router import ProviderRouter


@pytest.fixture
def provider_router():
    return ProviderRouter(max_retries_per_provider=1)


@pytest.mark.asyncio
async def test_explainability_fields_integrity(provider_router):
    state = {
        "run_id": "test_exp_run",
        "repo_structure": {"top_central_modules": ["app/main.py"]},
        "knowledge_graph_data": {},
    }

    bug_agent = BugHunterAgent(provider_router)
    res = await bug_agent.run(state)
    findings = res.get("bug_findings", [])

    assert len(findings) > 0
    for f in findings:
        # Verify 4 mandatory explainability fields
        assert "reasoning" in f and isinstance(f["reasoning"], str)
        assert "confidence" in f and isinstance(f["confidence"], float)
        assert 0.0 <= f["confidence"] <= 1.0
        assert "evidence" in f and isinstance(f["evidence"], str)
        assert "referenced_files" in f and isinstance(f["referenced_files"], list)


@pytest.mark.asyncio
async def test_reviewer_loop_confidence_threshold_pass(provider_router):
    reviewer = ReviewerAgent(provider_router)

    state = {
        "run_id": "test_rev_run",
        "bug_findings": [
            {
                "id": "f1",
                "category": "bug",
                "severity": "medium",
                "file": "app/main.py",
                "line_start": 10,
                "line_end": 20,
                "description": "High confidence finding",
                "suggested_fix": "Fix issue",
                "reasoning": "Clear AST evidence",
                "confidence": 0.85,
                "evidence": "def main(): pass",
                "referenced_files": ["app/main.py"],
            },
            {
                "id": "f2",
                "category": "bug",
                "severity": "low",
                "file": "app/utils.py",
                "line_start": 5,
                "line_end": 10,
                "description": "Low confidence claim",
                "suggested_fix": "Check code",
                "reasoning": "Uncertain signal",
                "confidence": 0.40,
                "evidence": "weak signal",
                "referenced_files": ["app/utils.py"],
            },
        ],
    }

    res = await reviewer.run(state)
    reviewed = res.get("reviewed_findings", [])

    assert len(reviewed) == 2

    # High confidence item (0.85 >= 0.70) must be approved
    f1_rev = next(item for item in reviewed if item["id"] == "f1")
    assert f1_rev["review_status"] == "approved"

    # Low confidence item (0.40 < 0.70) must be flagged_low_confidence
    f2_rev = next(item for item in reviewed if item["id"] == "f2")
    assert f2_rev["review_status"] == "flagged_low_confidence"
