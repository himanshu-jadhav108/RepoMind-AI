import { Node, Edge } from "reactflow";

export function getRadialLayout(
  nodes: Node[],
  edges: Edge[]
): { nodes: Node[]; edges: Edge[] } {
  if (nodes.length === 0) return { nodes, edges };

  const centerNode = nodes.find(
    (n) => n.id === "root" || n.id.includes("main.py") || n.id.includes("index.ts")
  ) || nodes[0];

  const otherNodes = nodes.filter((n) => n.id !== centerNode.id);
  const count = otherNodes.length;

  const RADIUS_STEP = 160;
  const layoutedNodes: Node[] = [];

  // Place center root node at origin
  layoutedNodes.push({
    ...centerNode,
    position: { x: 400, y: 300 },
  });

  // Group nodes into concentric orbital shells (15 nodes per ring shell)
  otherNodes.forEach((node, idx) => {
    const ringIndex = Math.floor(idx / 12) + 1;
    const itemsInRing = Math.min(12, count - (ringIndex - 1) * 12);
    const indexInRing = idx % 12;

    const angle = (indexInRing / itemsInRing) * Math.PI * 2;
    const distance = ringIndex * RADIUS_STEP;

    const x = 400 + distance * Math.cos(angle);
    const y = 300 + distance * Math.sin(angle);

    layoutedNodes.push({
      ...node,
      position: { x, y },
    });
  });

  return { nodes: layoutedNodes, edges };
}
