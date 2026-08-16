from pathlib import Path
from typing import Dict, List, Optional, Tuple

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
        if not files_list:
            return G

        # 0. Add synthetic root node representing the repository itself
        root_id = "__repo_root__"
        repo_name = repo_structure.get("repo_name") or repo_structure.get("name") or "RepoMind-AI"
        G.add_node(
            root_id,
            type="root",
            label=f"{repo_name}/",
            language="Root",
        )

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
                current_parent = root_id
                for part in parts[:-1]:
                    folder_path = f"{current_parent}/{part}" if current_parent != root_id else part
                    if folder_path not in folders_added:
                        G.add_node(folder_path, type="folder", label=part)
                        folders_added.add(folder_path)
                        G.add_edge(current_parent, folder_path, relation="contains")
                    current_parent = folder_path
                G.add_edge(current_parent, file_path, relation="contains")
            else:
                # Top-level root file (e.g. README.md, package.json)
                G.add_edge(root_id, file_path, relation="contains")


        # 2. Add symbols (classes & functions) and import edges
        file_paths_set = set(G.nodes)

        # Optimization: Build one-time lookup indices for O(1) import resolution.
        # Complexity improvement:
        # Before: O(files * imports * files) due to nested linear scan over all files for every import statement.
        # After:  O(files) one-time index construction + O(files * imports) dict lookups.
        normalized_module_to_file: Dict[str, str] = {}
        basename_to_files: Dict[str, List[str]] = {}

        for f_path in file_paths_set:
            if G.nodes[f_path].get("type") != "file":
                continue

            clean_p = f_path.replace("\\", "/").replace(".py", "").replace(".ts", "").replace(".js", "").replace("/", ".")
            clean_p = clean_p.strip(".")
            normalized_module_to_file[clean_p] = f_path

            base_name = Path(f_path).stem
            if base_name:
                if base_name not in basename_to_files:
                    basename_to_files[base_name] = []
                basename_to_files[base_name].append(f_path)

        def _resolve_import(imp: str, current_file: str) -> Optional[str]:
            clean_imp = imp.replace("\\", "/").replace(".py", "").replace(".ts", "").replace(".js", "").replace("/", ".")
            clean_imp = clean_imp.strip(".")
            if not clean_imp:
                return None

            # 1. Direct O(1) exact normalized match
            if clean_imp in normalized_module_to_file:
                target = normalized_module_to_file[clean_imp]
                if target != current_file:
                    return target

            # 2. Lookup by module/file stem name with closest path prefix match
            stem = clean_imp.split(".")[-1]
            candidates = basename_to_files.get(stem, [])
            matching_targets = []
            for target in candidates:
                if target == current_file:
                    continue
                clean_target = target.replace("\\", "/").replace(".py", "").replace(".ts", "").replace(".js", "").replace("/", ".")
                if clean_imp in target or clean_target.endswith(clean_imp) or clean_imp in clean_target:
                    matching_targets.append(target)

            if not matching_targets:
                return None

            if len(matching_targets) == 1:
                return matching_targets[0]

            # Prefer candidate sharing longest path prefix with current_file
            cur_parts = Path(current_file).parts
            def common_prefix_len(tgt: str) -> int:
                tgt_parts = Path(tgt).parts
                length = 0
                for p1, p2 in zip(cur_parts, tgt_parts):
                    if p1 == p2:
                        length += 1
                    else:
                        break
                return length

            matching_targets.sort(key=common_prefix_len, reverse=True)
            return matching_targets[0]

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

            # Import dependencies between files using O(1) index lookup
            for imp in symbols.get("imports", []):
                target_path = _resolve_import(imp, file_path)
                if target_path:
                    G.add_edge(file_path, target_path, relation="imports")

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
