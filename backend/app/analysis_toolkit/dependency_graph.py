from pathlib import Path
from typing import Dict, List, Tuple

import networkx as nx

from app.core.logging import logger


class DependencyGraphBuilder:
    """
    Builds a NetworkX directed graph representing the Repository Knowledge Graph.
    Computes graph centrality to prioritize hot-path modules for downstream agents.
    Serializes to React Flow graph format for frontend visualization.
    """

    def build_knowledge_graph(self, repo_structure: Dict, symbol_map: Dict[str, Dict]) -> nx.DiGraph:
        G = nx.DiGraph()

        files_list = repo_structure.get("files", [])

        # 1. Add file and folder nodes
        folders_added = set()
        for f in files_list:
            file_path = f["path"]
            G.add_node(
                file_path,
                type="file",
                label=f["name"],
                language=f["language"],
                size_bytes=f["size_bytes"],
            )

            # Folder hierarchy containment edges
            parts = Path(file_path).parts
            if len(parts) > 1:
                folder_path = "/".join(parts[:-1])
                if folder_path not in folders_added:
                    G.add_node(folder_path, type="folder", label=parts[-2])
                    folders_added.add(folder_path)
                G.add_edge(folder_path, file_path, relation="contains")

        # 2. Add symbols (classes & functions) and import edges
        file_paths_set = set(G.nodes)

        for file_path, symbols in symbol_map.items():
            if file_path not in G:
                continue

            # Class nodes
            for cls_name in symbols.get("classes", []):
                cls_id = f"{file_path}::{cls_name}"
                G.add_node(cls_id, type="class", label=cls_name, parent_file=file_path)
                G.add_edge(file_path, cls_id, relation="defines")

            # Function nodes
            for fn_name in symbols.get("functions", []):
                fn_id = f"{file_path}::{fn_name}"
                G.add_node(fn_id, type="function", label=fn_name, parent_file=file_path)
                G.add_edge(file_path, fn_id, relation="defines")

            # Import dependencies between files
            for imp in symbols.get("imports", []):
                # Try resolving import path against file paths in the graph
                for target_path in file_paths_set:
                    if target_path == file_path:
                        continue
                    clean_target = target_path.replace("/", ".").replace(".py", "").replace(".ts", "").replace(".js", "")
                    if imp in target_path or clean_target.endswith(imp):
                        G.add_edge(file_path, target_path, relation="imports")
                        break

        logger.info(f"Built Knowledge Graph with {G.number_of_nodes()} nodes and {G.number_of_edges()} edges.")
        return G

    def compute_centrality(self, G: nx.DiGraph) -> Dict[str, float]:
        """
        Computes Degree Centrality for nodes in the graph to identify top hot-path modules.
        """
        if G.number_of_nodes() == 0:
            return {}
        try:
            return nx.degree_centrality(G)
        except Exception as e:
            logger.warning(f"Centrality computation failed: {str(e)}")
            return {node: 0.0 for node in G.nodes}

    def get_top_central_modules(self, G: nx.DiGraph, top_n: int = 10) -> List[Tuple[str, float]]:
        """
        Returns top-N most central file/module nodes.
        """
        centrality = self.compute_centrality(G)
        # Filter to file nodes only
        file_centrality = [
            (node, score) for node, score in centrality.items()
            if G.nodes[node].get("type") == "file"
        ]
        file_centrality.sort(key=lambda x: x[1], reverse=True)
        return file_centrality[:top_n]

    def to_react_flow_format(self, G: nx.DiGraph) -> Dict[str, List[Dict]]:
        """
        Serializes NetworkX graph to React Flow renderable format ({ nodes: [...], edges: [...] }).
        """
        nodes = []
        edges = []

        for node_id, attrs in G.nodes(data=True):
            node_type = attrs.get("type", "default")
            label = attrs.get("label", node_id)
            nodes.append({
                "id": node_id,
                "type": node_type,
                "data": {
                    "label": label,
                    "language": attrs.get("language"),
                    "size_bytes": attrs.get("size_bytes"),
                },

            })

        for idx, (source, target, attrs) in enumerate(G.edges(data=True)):
            edges.append({
                "id": f"e-{idx}-{source}-{target}",
                "source": source,
                "target": target,
                "label": attrs.get("relation", "relates_to"),
                "animated": attrs.get("relation") == "imports",
            })

        return {"nodes": nodes, "edges": edges}
