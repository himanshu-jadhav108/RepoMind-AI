import pytest

from app.analysis_toolkit.code_parser import CodeParser
from app.analysis_toolkit.dependency_graph import DependencyGraphBuilder
from app.core.dependency_injection import get_repo_ingestion_service
from app.core.exceptions import RepoMindException


@pytest.fixture
def repo_service():
    return get_repo_ingestion_service()


@pytest.mark.asyncio
async def test_invalid_github_url_rejection(repo_service):
    from app.models.repo import RepoCreate

    with pytest.raises(RepoMindException) as exc_info:
        await repo_service.register_repository(RepoCreate(repo_url="https://invalid-host.org/not/github"))

    assert exc_info.value.code == "INVALID_REPO_URL"


def test_code_parser_unsupported_file_extension():
    parser = CodeParser()
    parsed = parser.parse_file("test_file.xyz", "binary content here")
    assert parsed["classes"] == []
    assert parsed["functions"] == []
    assert parsed["imports"] == []


def test_dependency_graph_empty_repo():
    builder = DependencyGraphBuilder()
    graph = builder.build_knowledge_graph({}, {})
    react_flow = builder.to_react_flow_format(graph)

    assert graph.number_of_nodes() == 0
    assert graph.number_of_edges() == 0
    assert react_flow["nodes"] == []
    assert react_flow["edges"] == []
