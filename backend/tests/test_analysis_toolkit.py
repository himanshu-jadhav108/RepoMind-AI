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


def test_parallel_symbol_parsing_performance_and_equivalence(tmp_path):
    import time
    from app.analysis_toolkit.code_parser import CodeParser

    parser = CodeParser()
    files_list = []

    # Generate 200 synthetic source files with Python, TypeScript, and Java snippets
    for i in range(200):
        if i % 3 == 0:
            filename = f"module_{i}.py"
            code = f"""
import os
import sys
from app.services import service_{i}

class Controller_{i}:
    def __init__(self):
        pass

def handle_request_{i}():
    return {i}
"""
            lang = "Python"
        elif i % 3 == 1:
            filename = f"component_{i}.tsx"
            code = f"""
import React from 'react';
import {{ Button }} from '@/components/ui/button';

export class Widget_{i} {{}}
export function renderWidget_{i}() {{ return null; }}
"""
            lang = "TypeScript"
        else:
            filename = f"Service_{i}.java"
            code = f"""
import java.util.List;

public class Service_{i} {{
    public void execute_{i}() {{}}
}}
"""
            lang = "Java"

        file_path = tmp_path / filename
        file_path.write_text(code, encoding="utf-8")
        files_list.append({
            "path": filename,
            "name": filename,
            "language": lang,
            "size_bytes": len(code),
        })

    # Sequential baseline parsing (max_workers=1)
    t0 = time.perf_counter()
    sequential_map = parser.parse_repository_symbols(str(tmp_path), files_list, max_workers=1)
    seq_duration = time.perf_counter() - t0

    # Parallel parsing (max_workers=8)
    t1 = time.perf_counter()
    parallel_map = parser.parse_repository_symbols(str(tmp_path), files_list, max_workers=8)
    par_duration = time.perf_counter() - t1

    # (a) Assert equivalence: parallel parsing produces exact identical structure and content
    assert len(parallel_map) == 200
    assert parallel_map == sequential_map
    assert seq_duration >= 0 and par_duration >= 0

    # Check specific symbol extractions
    assert "Controller_0" in parallel_map["module_0.py"]["classes"]
    assert "handle_request_0" in parallel_map["module_0.py"]["functions"]
    assert "Widget_1" in parallel_map["component_1.tsx"]["classes"]

    # (b) Regression guard on timing
    assert par_duration < 5.0, f"Parallel parsing took too long: {par_duration:.3f}s"


def test_git_clone_retry_on_transient_failure(monkeypatch, tmp_path):
    import os
    from pathlib import Path
    from unittest.mock import MagicMock
    from git.exc import GitCommandError
    from app.analysis_toolkit.git_ingestion import GitIngestionService

    service = GitIngestionService(workspace_base_dir=str(tmp_path), clone_timeout_sec=5.0)

    call_count = 0

    def mock_clone_from(url, to_path, **kwargs):
        nonlocal call_count
        call_count += 1
        if call_count == 1:
            raise GitCommandError("clone", 128, stderr="fatal: unable to access 'https://github.com/foo/bar': Could not resolve host: github.com")
        # Second attempt succeeds
        mock_repo = MagicMock()
        mock_repo.head.commit.hexsha = "abc12345"
        (Path(to_path) / "README.md").write_text("hello", encoding="utf-8")
        return mock_repo

    monkeypatch.setattr("git.Repo.clone_from", mock_clone_from)

    cloned_dir, commit_sha = service.clone_repository("https://github.com/foo/bar", max_retries=1, retry_delay_sec=0.01)
    assert call_count == 2
    assert commit_sha == "abc12345"
    assert os.path.exists(cloned_dir)
    service.cleanup(cloned_dir)


def test_git_clone_no_retry_on_404_permanent_failure(monkeypatch, tmp_path):
    from git.exc import GitCommandError
    from app.analysis_toolkit.git_ingestion import GitIngestionService
    from app.core.exceptions import RepositoryNotFoundException

    service = GitIngestionService(workspace_base_dir=str(tmp_path), clone_timeout_sec=5.0)
    call_count = 0

    def mock_clone_from(url, to_path, **kwargs):
        nonlocal call_count
        call_count += 1
        raise GitCommandError("clone", 128, stderr="fatal: repository 'https://github.com/foo/notfound.git/' not found")

    monkeypatch.setattr("git.Repo.clone_from", mock_clone_from)

    with pytest.raises(RepositoryNotFoundException) as exc_info:
        service.clone_repository("https://github.com/foo/notfound", max_retries=2, retry_delay_sec=0.01)

    # Must fail fast on 404 without retrying
    assert call_count == 1
    assert "was not found or is private" in str(exc_info.value)


def test_git_clone_exhausted_retries_transient_failure(monkeypatch, tmp_path):
    from git.exc import GitCommandError
    from app.analysis_toolkit.git_ingestion import GitIngestionService
    from app.core.exceptions import UnprocessableRepoException

    service = GitIngestionService(workspace_base_dir=str(tmp_path), clone_timeout_sec=5.0)
    call_count = 0

    def mock_clone_from(url, to_path, **kwargs):
        nonlocal call_count
        call_count += 1
        raise GitCommandError("clone", 128, stderr="fatal: unable to access 'https://github.com/foo/bar': Connection timed out")

    monkeypatch.setattr("git.Repo.clone_from", mock_clone_from)

    with pytest.raises(UnprocessableRepoException) as exc_info:
        service.clone_repository("https://github.com/foo/bar", max_retries=1, retry_delay_sec=0.01)

    # 1 initial attempt + 1 retry = 2 total attempts
    assert call_count == 2
    assert "Unable to reach GitHub" in str(exc_info.value)

