import dagre from "dagre";
import { Node, Edge } from "reactflow";

export function getDagreLayout(
  nodes: Node[],
  edges: Edge[],
  direction: "TB" | "LR" = "TB"
): { nodes: Node[]; edges: Edge[] } {
  if (nodes.length === 0) return { nodes, edges };

  // 1. Enrich Edges: Automatically connect folder nodes to child file nodes if explicit edges are missing
  const augmentedEdges: Edge[] = [...edges];
  const edgeSet = new Set(edges.map((e) => `${e.source}->${e.target}`));

  const folderNodes = nodes.filter((n) => n.type === "folder");
  const fileNodes = nodes.filter((n) => n.type !== "folder" && n.id !== "root");

  folderNodes.forEach((folder) => {
    fileNodes.forEach((file) => {
      const parentId = file.data?.parent_id || file.data?.parentFolder;
      const isChild =
        parentId === folder.id ||
        file.id.startsWith(folder.id) ||
        (file.data?.label || "").startsWith(folder.data?.label || "");

      if (isChild && !edgeSet.has(`${folder.id}->${file.id}`)) {
        augmentedEdges.push({
          id: `auto-${folder.id}-${file.id}`,
          source: folder.id,
          target: file.id,
          type: "smoothstep",
        });
        edgeSet.add(`${folder.id}->${file.id}`);
      }
    });
  });

  // Root to Folder Auto-Connections
  const rootNode = nodes.find((n) => n.id === "root" || (n.data?.label || "").includes("main.py"));
  if (rootNode) {
    folderNodes.forEach((folder) => {
      if (!edgeSet.has(`${rootNode.id}->${folder.id}`)) {
        augmentedEdges.push({
          id: `auto-root-${folder.id}`,
          source: rootNode.id,
          target: folder.id,
          type: "smoothstep",
        });
      }
    });
  }

  // 2. Try Dagre Tree Layout
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));
  dagreGraph.setGraph({
    rankdir: direction,
    nodesep: 80,
    ranksep: 130,
    marginx: 40,
    marginy: 40,
  });

  const NODE_W = 240;
  const NODE_H = 75;

  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, { width: NODE_W, height: NODE_H });
  });

  augmentedEdges.forEach((edge) => {
    if (dagreGraph.hasNode(edge.source) && dagreGraph.hasNode(edge.target)) {
      dagreGraph.setEdge(edge.source, edge.target);
    }
  });

  dagre.layout(dagreGraph);

  // 3. Compute position & check vertical tier distribution
  let minY = Infinity;
  let maxY = -Infinity;

  const layoutedNodes = nodes.map((node) => {
    const nodeWithPos = dagreGraph.node(node.id);
    const x = nodeWithPos ? nodeWithPos.x - NODE_W / 2 : 0;
    const y = nodeWithPos ? nodeWithPos.y - NODE_H / 2 : 0;

    minY = Math.min(minY, y);
    maxY = Math.max(maxY, y);

    return {
      ...node,
      position: { x, y },
    };
  });

  // 4. Fallback Tier-Grid System if Dagre collapses nodes into a single flat line (maxY - minY < 50)
  if (maxY - minY < 50 && nodes.length > 2) {
    // Categorize into 4 Vertical Architecture Tiers
    const tier0: Node[] = []; // Root / Entry
    const tier1: Node[] = []; // Folders
    const tier2: Node[] = []; // Files
    const tier3: Node[] = []; // Classes & Functions

    nodes.forEach((n) => {
      if (n.id === "root" || (n.data?.label || "").includes("main.py")) {
        tier0.push(n);
      } else if (n.type === "folder") {
        tier1.push(n);
      } else if (n.type === "class" || n.type === "function") {
        tier3.push(n);
      } else {
        tier2.push(n);
      }
    });

    const tiers = [tier0, tier1, tier2, tier3].filter((t) => t.length > 0);
    const MAX_COLS_PER_ROW = 3;

    let currentY = 50;
    const finalGridNodes: Node[] = [];

    tiers.forEach((tierNodes) => {
      const rowsCount = Math.ceil(tierNodes.length / MAX_COLS_PER_ROW);

      tierNodes.forEach((node, idx) => {
        const col = idx % MAX_COLS_PER_ROW;
        const row = Math.floor(idx / MAX_COLS_PER_ROW);

        const itemsInCurrentRow = Math.min(
          MAX_COLS_PER_ROW,
          tierNodes.length - row * MAX_COLS_PER_ROW
        );

        // Center row elements horizontally
        const startX = 400 - ((itemsInCurrentRow - 1) * 260) / 2;
        const x = startX + col * 260;
        const y = currentY + row * 120;

        finalGridNodes.push({
          ...node,
          position: { x, y },
        });
      });

      currentY += rowsCount * 120 + 70;
    });

    return { nodes: finalGridNodes, edges: augmentedEdges };
  }

  return { nodes: layoutedNodes, edges: augmentedEdges };
}
