from typing import Dict, Tuple

import networkx as nx

from app.analysis_toolkit.code_parser import CodeParser
from app.analysis_toolkit.dependency_graph import DependencyGraphBuilder
from app.analysis_toolkit.git_ingestion import GitIngestionService
from app.core.logging import log_agent_event


class RepositoryAnalyzer:
    """
    Entry-point agent that builds the foundational structural understanding of the repo:
    1. Clones repo via GitPython.
    2. Scans file tree & classifies languages.
    3. Parses source files with CodeParser for AST symbol extraction.
    4. Builds module dependency graph with NetworkX (Repository Knowledge Graph).
    5. Computes centrality metrics to prioritize downstream agent analysis.
    """

    def __init__(self) -> None:
        self.git_ingestion = GitIngestionService()
        self.code_parser = CodeParser()
        self.graph_builder = DependencyGraphBuilder()

    def analyze_repository(self, repo_url: str, run_id: str = "local_run") -> Tuple[Dict, nx.DiGraph, Dict]:
        """
        Executes static analysis pipeline on repo URL.
        Returns (repo_structure, knowledge_graph, react_flow_graph).
        """
        log_agent_event("start", "repository_analyzer", run_id, f"Beginning static analysis for '{repo_url}'")

        # Step 1: Clone repo
        clone_path, commit_sha = self.git_ingestion.clone_repository(repo_url)

        try:
            # Step 2: Scan file tree and classify languages
            scan_results = self.git_ingestion.scan_repository(clone_path)
            scan_results["commit_sha"] = commit_sha
            scan_results["repo_url"] = repo_url

            # Step 3: Parse AST symbols per file
            symbol_map = self.code_parser.parse_repository_symbols(clone_path, scan_results["files"])

            # Step 4: Build NetworkX Knowledge Graph
            knowledge_graph = self.graph_builder.build_knowledge_graph(scan_results, symbol_map)

            # Step 5: Compute centrality metrics and extract top modules
            top_central = self.graph_builder.get_top_central_modules(knowledge_graph, top_n=10)
            scan_results["top_central_modules"] = [mod for mod, score in top_central]

            # Step 6: Serialize to React Flow graph format
            react_flow_graph = self.graph_builder.to_react_flow_format(knowledge_graph)

            log_agent_event(
                "complete",
                "repository_analyzer",
                run_id,
                f"Completed static analysis: {scan_results['total_files']} files, {knowledge_graph.number_of_nodes()} nodes in graph.",
            )

            return scan_results, knowledge_graph, react_flow_graph
        finally:
            # Always cleanup ephemeral clone workspace
            self.git_ingestion.cleanup(clone_path)
