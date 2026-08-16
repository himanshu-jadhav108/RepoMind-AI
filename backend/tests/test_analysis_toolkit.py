import tempfile
from pathlib import Path

import pytest

from app.agents.repository_analyzer import RepositoryAnalyzer
from app.analysis_toolkit.code_parser import CodeParser
from app.analysis_toolkit.dependency_graph import DependencyGraphBuilder
from app.analysis_toolkit.git_ingestion import GitIngestionService


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


def test_git_ingestion_url_validation():
    from app.core.exceptions import UnprocessableRepoException
    ingestion = GitIngestionService()

    # Valid GitHub URLs
    ingestion.validate_repo_url("https://github.com/owner/repo")
    ingestion.validate_repo_url("https://github.com/owner/repo.git")

    # Invalid URLs (SSRF protection)
    with pytest.raises(UnprocessableRepoException):
        ingestion.validate_repo_url("http://evil-site.com/malicious")

    with pytest.raises(UnprocessableRepoException):
        ingestion.validate_repo_url("file:///etc/passwd")


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


def test_dependency_graph_performance_large_repo():
    import time

    builder = DependencyGraphBuilder()

    files = []
    symbol_map = {}
    total_files_count = 350

    for i in range(total_files_count):
        file_path = f"app/module_{i}.py"
        files.append({
            "path": file_path,
            "name": f"module_{i}.py",
            "language": "Python",
            "size_bytes": 100,
        })
        symbol_map[file_path] = {
            "classes": [f"Class{i}"],
            "functions": [f"fn_{i}"],
            "imports": [],
        }

    # Add hand-picked known imports
    symbol_map["app/module_10.py"]["imports"] = ["app.module_20", "module_30"]
    symbol_map["app/module_100.py"]["imports"] = ["module_200"]

    repo_structure = {"files": files, "total_files": total_files_count}

    start_time = time.perf_counter()
    graph = builder.build_knowledge_graph(repo_structure, symbol_map)
    elapsed = time.perf_counter() - start_time

    # (a) Verify hand-picked import edges
    assert graph.has_edge("app/module_10.py", "app/module_20.py")
    assert graph.edges["app/module_10.py", "app/module_20.py"]["relation"] == "imports"

    assert graph.has_edge("app/module_10.py", "app/module_30.py")
    assert graph.edges["app/module_10.py", "app/module_30.py"]["relation"] == "imports"

    assert graph.has_edge("app/module_100.py", "app/module_200.py")
    assert graph.edges["app/module_100.py", "app/module_200.py"]["relation"] == "imports"

    # (b) Regression guard: must complete in well under 1-2 seconds (usually < 0.1s)
    assert elapsed < 2.0, f"build_knowledge_graph took too long ({elapsed:.3f}s) for {total_files_count} files"


def test_knowledge_graph_single_connected_component():
    import networkx as nx

    builder = DependencyGraphBuilder()

    # Synthetic multi-root folder structure with at least 3 distinct top-level folders and a root file
    repo_structure = {
        "repo_name": "RepoMind-AI",
        "files": [
            {"path": "backend/app/main.py", "name": "main.py", "language": "Python", "size_bytes": 500},
            {"path": "backend/app/services/calc.py", "name": "calc.py", "language": "Python", "size_bytes": 300},
            {"path": "frontend/src/App.tsx", "name": "App.tsx", "language": "TypeScript", "size_bytes": 400},
            {"path": "docs/architecture.md", "name": "architecture.md", "language": "Markdown", "size_bytes": 200},
            {"path": "README.md", "name": "README.md", "language": "Markdown", "size_bytes": 150},
        ],
    }

    symbol_map = {
        "backend/app/main.py": {"classes": ["App"], "functions": ["start"], "imports": ["backend.app.services.calc"]},
        "backend/app/services/calc.py": {"classes": [], "functions": ["add"], "imports": []},
        "frontend/src/App.tsx": {"classes": [], "functions": ["App"], "imports": []},
        "docs/architecture.md": {"classes": [], "functions": [], "imports": []},
        "README.md": {"classes": [], "functions": [], "imports": []},
    }

    graph = builder.build_knowledge_graph(repo_structure, symbol_map)

    # 1. Assert root node exists with type root
    assert "__repo_root__" in graph
    assert graph.nodes["__repo_root__"]["type"] == "root"

    # 2. Assert top-level folders connect to root via "contains"
    assert graph.has_edge("__repo_root__", "backend")
    assert graph.edges["__repo_root__", "backend"]["relation"] == "contains"
    assert graph.has_edge("__repo_root__", "frontend")
    assert graph.edges["__repo_root__", "frontend"]["relation"] == "contains"
    assert graph.has_edge("__repo_root__", "docs")
    assert graph.edges["__repo_root__", "docs"]["relation"] == "contains"
    assert graph.has_edge("__repo_root__", "README.md")
    assert graph.edges["__repo_root__", "README.md"]["relation"] == "contains"

    # 3. Assert subfolder and file contains edges
    assert graph.has_edge("backend", "backend/app")
    assert graph.has_edge("backend/app", "backend/app/main.py")

    # 4. Assert graph is a single weakly-connected component (no disconnected floating clusters)
    assert nx.is_weakly_connected(graph), "Graph should be a single weakly connected component"
    assert nx.number_weakly_connected_components(graph) == 1

