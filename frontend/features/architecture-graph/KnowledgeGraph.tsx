"use client";

import React, { useMemo, useState } from "react";
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  Node,
  Edge,
  MarkerType,
  Panel,
} from "reactflow";
import "reactflow/dist/style.css";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Layers, Folder, FileCode, Cpu, Box, Maximize2, Sparkles, Orbit } from "lucide-react";
import { KnowledgeGraph3D } from "./KnowledgeGraph3D";

interface KnowledgeGraphProps {
  graphData?: { nodes: any[]; edges: any[] } | null;
  onNodeClick?: (nodeId: string) => void;
}

// Fallback demo graph when graphData is empty/loading
const DEMO_NODES = [
  { id: "root", type: "file", position: { x: 350, y: 40 }, data: { label: "backend/app/main.py", language: "Python" } },
  { id: "orch", type: "file", position: { x: 150, y: 180 }, data: { label: "orchestration/graph.py", language: "Python" } },
  { id: "ingest", type: "file", position: { x: 550, y: 180 }, data: { label: "services/repo_ingestion_service.py", language: "Python" } },
  { id: "router", type: "file", position: { x: 150, y: 320 }, data: { label: "providers/provider_router.py", language: "Python" } },
  { id: "agent", type: "file", position: { x: 550, y: 320 }, data: { label: "agents/architect_agent.py", language: "Python" } },
];

const DEMO_EDGES = [
  { id: "e1", source: "root", target: "orch", label: "imports", animated: true, type: "smoothstep", style: { stroke: "#818cf8" } },
  { id: "e2", source: "root", target: "ingest", label: "imports", animated: true, type: "smoothstep", style: { stroke: "#818cf8" } },
  { id: "e3", source: "orch", target: "router", label: "uses", animated: false, type: "smoothstep", style: { stroke: "#64748b" } },
  { id: "e4", source: "ingest", target: "agent", label: "uses", animated: false, type: "smoothstep", style: { stroke: "#64748b" } },
];

/**
 * Assigns a hierarchical tier (level 0 to 3) to a node based on its type & path
 * to create a beautiful DAG tree architecture layout instead of a straight line grid.
 */
function getNodeLevel(node: any): number {
  const type = node.type || "file";
  const id = (node.id || "").toLowerCase();
  const label = (node.data?.label || id).toLowerCase();

  if (id === "root" || label.includes("main.py") || label.includes("app.py") || label.includes("index.ts")) {
    return 0; // Top entry point
  }
  if (type === "folder" || label.includes("folder")) {
    return 1; // Top folder containers
  }
  if (type === "file" || label.endsWith(".py") || label.endsWith(".ts") || label.endsWith(".js")) {
    return 2; // Services, agents, modules
  }
  return 3; // Classes, functions, symbols
}

export function KnowledgeGraph({ graphData, onNodeClick }: KnowledgeGraphProps) {
  const [viewMode, setViewMode] = useState<"2D" | "3D">("2D");
  const [maxNodesLimit, setMaxNodesLimit] = useState<number>(45);

  // Compute hierarchical tree positions for 2D nodes
  const layoutNodes: Node[] = useMemo(() => {
    const rawNodes = graphData?.nodes || [];

    if (rawNodes.length === 0) {
      return DEMO_NODES.map((n) => ({
        ...n,
        style: getNodeStyle(n.type),
      }));
    }

    const displayNodes = rawNodes.slice(0, maxNodesLimit);

    const tiers: Record<number, any[]> = { 0: [], 1: [], 2: [], 3: [] };
    displayNodes.forEach((n) => {
      const lvl = getNodeLevel(n);
      tiers[lvl].push(n);
    });

    const result: Node[] = [];
    const LEVEL_HEIGHT = 160;
    const NODE_WIDTH = 220;

    Object.keys(tiers).forEach((tierKey) => {
      const lvl = Number(tierKey);
      const nodesInTier = tiers[lvl];
      const count = nodesInTier.length;
      if (count === 0) return;

      const totalWidth = count * NODE_WIDTH;
      const startX = Math.max(50, 400 - totalWidth / 2);

      nodesInTier.forEach((n, idx) => {
        const x = startX + idx * NODE_WIDTH;
        const y = 50 + lvl * LEVEL_HEIGHT;
        const nodeType = n.type || "file";
        const label = n.data?.label || n.id;

        result.push({
          id: n.id,
          position: { x, y },
          data: {
            label: (
              <div className="flex items-center gap-2">
                {getNodeIcon(nodeType)}
                <span className="font-mono truncate max-w-[150px]">{label}</span>
              </div>
            ),
          },
          style: getNodeStyle(nodeType),
        });
      });
    });

    return result;
  }, [graphData, maxNodesLimit]);

  // Transform 2D edges
  const layoutEdges: Edge[] = useMemo(() => {
    const rawEdges = graphData?.edges || [];
    if (rawEdges.length === 0) return DEMO_EDGES;

    const validNodeIds = new Set(layoutNodes.map((n) => n.id));

    return rawEdges
      .filter((e) => validNodeIds.has(e.source) && validNodeIds.has(e.target))
      .slice(0, 80)
      .map((e, idx) => {
        const isImport = e.label === "imports" || e.animated;
        return {
          id: e.id || `edge-${idx}`,
          source: e.source,
          target: e.target,
          type: "smoothstep",
          animated: isImport,
          style: {
            stroke: isImport ? "#818cf8" : "#475569",
            strokeWidth: isImport ? 1.8 : 1.2,
          },
          markerEnd: {
            type: MarkerType.ArrowClosed,
            width: 12,
            height: 12,
            color: isImport ? "#818cf8" : "#475569",
          },
        };
      });
  }, [graphData, layoutNodes]);

  return (
    <Card className="w-full h-[540px] flex flex-col border border-border/80 shadow-lg">
      <CardHeader className="py-3 border-b border-border/60 bg-slate-900/50">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <CardTitle className="flex items-center gap-2 text-base font-semibold">
            <Layers className="w-4 h-4 text-indigo-400" />
            <span>Repository Knowledge Graph</span>
          </CardTitle>

          {/* Mode Toggle & Legends */}
          <div className="flex items-center gap-3 text-xs font-mono">
            {/* 2D / 3D Mode Toggle Button Segment */}
            <div className="flex items-center bg-slate-950 p-1 rounded-lg border border-slate-800">
              <button
                onClick={() => setViewMode("2D")}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition ${
                  viewMode === "2D"
                    ? "bg-indigo-600 text-white shadow"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>2D Tree</span>
              </button>
              <button
                onClick={() => setViewMode("3D")}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition ${
                  viewMode === "3D"
                    ? "bg-purple-600 text-white shadow"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <Orbit className="w-3.5 h-3.5 text-purple-300" />
                <span className="flex items-center gap-1">
                  3D Galaxy <Sparkles className="w-3 h-3 text-amber-300 animate-pulse" />
                </span>
              </button>
            </div>

            {viewMode === "2D" && (
              <>
                <span className="hidden sm:flex items-center gap-1 text-muted-foreground">
                  <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 inline-block" /> Imports
                </span>
                {graphData?.nodes && graphData.nodes.length > maxNodesLimit && (
                  <button
                    onClick={() => setMaxNodesLimit((prev) => (prev === 45 ? 120 : 45))}
                    className="px-2 py-0.5 rounded border border-indigo-500/40 text-indigo-300 hover:bg-indigo-500/10 transition"
                  >
                    {maxNodesLimit === 45 ? `Show All (${graphData.nodes.length})` : "Show Focused (45)"}
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1 p-0 relative overflow-hidden rounded-b-xl bg-slate-950">
        {viewMode === "3D" ? (
          <KnowledgeGraph3D graphData={graphData} onNodeClick={onNodeClick} />
        ) : (
          <ReactFlow
            nodes={layoutNodes}
            edges={layoutEdges}
            onNodeClick={(_, node) => onNodeClick && onNodeClick(node.id)}
            fitView
            fitViewOptions={{ padding: 0.2 }}
            minZoom={0.2}
            maxZoom={1.5}
            onlyRenderVisibleElements={true}
          >
            <Background color="#1e293b" gap={20} size={1} />
            <Controls className="bg-slate-900 border-slate-800 text-white fill-white rounded-lg shadow" />
            <MiniMap
              nodeColor={(n) => (n.style?.background as string) || "#1e293b"}
              maskColor="rgba(15, 23, 42, 0.7)"
              className="bg-slate-900 border-slate-800 rounded-lg hidden sm:block"
            />
            <Panel position="bottom-left" className="m-3">
              <div className="p-2 rounded-md bg-slate-900/80 border border-slate-800 backdrop-blur-md text-[11px] text-slate-300 font-mono flex items-center gap-2">
                <Maximize2 className="w-3.5 h-3.5 text-indigo-400" />
                <span>Hierarchical DAG Tree • Click node to inspect code</span>
              </div>
            </Panel>
          </ReactFlow>
        )}
      </CardContent>
    </Card>
  );
}

function getNodeIcon(type: string) {
  switch (type) {
    case "folder":
      return <Folder className="w-3.5 h-3.5 text-sky-400 shrink-0" />;
    case "class":
      return <Box className="w-3.5 h-3.5 text-amber-400 shrink-0" />;
    case "function":
      return <Cpu className="w-3.5 h-3.5 text-emerald-400 shrink-0" />;
    default:
      return <FileCode className="w-3.5 h-3.5 text-indigo-400 shrink-0" />;
  }
}

function getNodeStyle(type: string): React.CSSProperties {
  switch (type) {
    case "folder":
      return {
        background: "rgba(14, 165, 233, 0.12)",
        color: "#e0f2fe",
        border: "1px solid rgba(56, 189, 248, 0.5)",
        borderRadius: "8px",
        padding: "8px 12px",
        fontSize: "12px",
        boxShadow: "0 0 12px rgba(56, 189, 248, 0.15)",
      };
    case "class":
      return {
        background: "rgba(245, 158, 11, 0.12)",
        color: "#fef3c7",
        border: "1px solid rgba(245, 158, 11, 0.5)",
        borderRadius: "20px",
        padding: "6px 12px",
        fontSize: "11px",
      };
    case "function":
      return {
        background: "rgba(16, 185, 129, 0.12)",
        color: "#d1fae5",
        border: "1px solid rgba(16, 185, 129, 0.5)",
        borderRadius: "20px",
        padding: "6px 12px",
        fontSize: "11px",
      };
    default:
      return {
        background: "rgba(30, 41, 59, 0.9)",
        color: "#f8fafc",
        border: "1px solid rgba(129, 140, 248, 0.4)",
        borderRadius: "8px",
        padding: "8px 12px",
        fontSize: "12px",
        boxShadow: "0 4px 12px rgba(0, 0, 0, 0.3)",
      };
  }
}
