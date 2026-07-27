import os
import tempfile
from pathlib import Path
import pytest
from app.analysis_toolkit.git_ingestion import GitIngestionService
from app.analysis_toolkit.code_parser import CodeParser
from app.analysis_toolkit.dependency_graph import DependencyGraphBuilder
from app.agents.repository_analyzer import RepositoryAnalyzer


@pytest.fixture
def mock_repo_dir():
    """Creates a temporary synthetic repository structure for testing static analysis."""
    temp_dir = tempfile.mkdtemp(prefix="mock_repo_")

    # Create dummy files
    py_file = Path(temp_dir) / "main.py"
    py_file.write_text(
        "import os\nfrom utils import helper\n\nclass MainApp:\n    pass\n\ndef main():\n    helper()\n",
        encoding="utf-8",
    )

    helper_file = Path(temp_dir) / "utils" / "helper.py"
    helper_file.parent.mkdir(parents=True, exist_ok=True)
    helper_file.write_text("def helper():\n    print('Hello World')\n", encoding="utf-8")

    ts_file = Path(temp_dir) / "index.ts"
    ts_file.write_text(
        "import { helper } from './utils/helper';\nexport class Component {}\nexport function render() {}\n",
        encoding="utf-8",
    )

    yield temp_dir

    # Cleanup
    import shutil
    shutil.rmtree(temp_dir, ignore_errors=True)


def test_git_ingestion_scan(mock_repo_dir):
    ingestion = GitIngestionService()
    results = ingestion.scan_repository(mock_repo_dir)

    assert results["total_files"] >= 3
    assert "Python" in results["language_breakdown"]
    assert "TypeScript" in results["language_breakdown"]
    assert results["primary_language"] in ["Python", "TypeScript"]


def test_code_parser_symbols(mock_repo_dir):
    parser = CodeParser()
    py_file = str(Path(mock_repo_dir) / "main.py")
    symbols = parser.parse_file(py_file, "Python")

    assert "MainApp" in symbols["classes"]
    assert "main" in symbols["functions"]
    assert "os" in symbols["imports"]


def test_dependency_graph_builder(mock_repo_dir):
    ingestion = GitIngestionService()
    parser = CodeParser()
    builder = DependencyGraphBuilder()

    scan_res = ingestion.scan_repository(mock_repo_dir)
    symbol_map = parser.parse_repository_symbols(mock_repo_dir, scan_res["files"])
    graph = builder.build_knowledge_graph(scan_res, symbol_map)

    assert graph.number_of_nodes() > 0
    top_central = builder.get_top_central_modules(graph, top_n=5)
    assert isinstance(top_central, list)

    rf_format = builder.to_react_flow_format(graph)
    assert "nodes" in rf_format
    assert "edges" in rf_format


def test_repository_analyzer_pipeline(mock_repo_dir):
    analyzer = RepositoryAnalyzer()
    # Mock clone_repository to use local mock_repo_dir directly
    analyzer.git_ingestion.clone_repository = lambda url: (mock_repo_dir, "test_sha")

    scan_results, graph, rf_format = analyzer.analyze_repository("https://github.com/test/repo")

    assert scan_results["total_files"] >= 3
    assert graph.number_of_nodes() > 0
    assert len(rf_format["nodes"]) > 0
