import * as d3 from "d3-force";
import { Node, Edge } from "reactflow";

interface SimulationNode extends d3.SimulationNodeDatum {
  id: string;
  x?: number;
  y?: number;
}

interface SimulationLink extends d3.SimulationLinkDatum<SimulationNode> {
  source: string | SimulationNode;
  target: string | SimulationNode;
}

export function getForceLayout(
  nodes: Node[],
  edges: Edge[]
): { nodes: Node[]; edges: Edge[] } {
  if (nodes.length === 0) return { nodes, edges };

  const simNodes: SimulationNode[] = nodes.map((n) => ({
    id: n.id,
    x: n.position?.x || Math.random() * 600,
    y: n.position?.y || Math.random() * 600,
  }));

  const simLinks: SimulationLink[] = edges.map((e) => ({
    source: e.source,
    target: e.target,
  }));

  const simulation = d3
    .forceSimulation<SimulationNode>(simNodes)
    .force("charge", d3.forceManyBody().strength(-350))
    .force("center", d3.forceCenter(400, 300))
    .force("link", d3.forceLink<SimulationNode, SimulationLink>(simLinks).id((d) => d.id).distance(140))
    .force("collide", d3.forceCollide().radius(80))
    .stop();

  // Run simulation iterations to reach stable physics equilibrium
  for (let i = 0; i < 200; ++i) {
    simulation.tick();
  }

  const posMap = new Map<string, { x: number; y: number }>();
  simNodes.forEach((n) => {
    posMap.set(n.id, { x: n.x || 0, y: n.y || 0 });
  });

  const layoutedNodes = nodes.map((node) => {
    const pos = posMap.get(node.id);
    if (!pos) return node;
    return {
      ...node,
      position: { x: pos.x, y: pos.y },
    };
  });

  return { nodes: layoutedNodes, edges };
}
