"use client";

import React, { useMemo } from "react";
import ReactFlow, { Background, Controls, Node, Edge } from "reactflow";
import "reactflow/dist/style.css";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Layers } from "lucide-react";

interface KnowledgeGraphProps {
  graphData?: { nodes: any[]; edges: any[] } | null;
  onNodeClick?: (nodeId: string) => void;
}

export function KnowledgeGraph({ graphData, onNodeClick }: KnowledgeGraphProps) {
  const initialNodes: Node[] = useMemo(() => {
    if (!graphData?.nodes || graphData.nodes.length === 0) {
      return [
        { id: "root", position: { x: 250, y: 50 }, data: { label: "app/main.py" }, style: { background: "#1e293b", color: "#f8fafc", border: "1px solid #6366f1" } },
        { id: "services", position: { x: 100, y: 150 }, data: { label: "services/analysis.py" }, style: { background: "#0f172a", color: "#94a3b8" } },
        { id: "agents", position: { x: 400, y: 150 }, data: { label: "agents/architect.py" }, style: { background: "#0f172a", color: "#94a3b8" } },
      ];
    }

    return graphData.nodes.map((n, idx) => ({
      id: n.id,
      position: { x: (idx % 4) * 220 + 50, y: Math.floor(idx / 4) * 120 + 50 },
      data: { label: n.data?.label || n.id },
      style: {
        background: n.type === "file" ? "#1e293b" : "#0f172a",
        color: "#f8fafc",
        border: "1px solid rgba(99, 102, 241, 0.4)",
        borderRadius: "8px",
        padding: "10px",
        fontSize: "12px",
      },
    }));
  }, [graphData]);

  const initialEdges: Edge[] = useMemo(() => {
    if (!graphData?.edges || graphData.edges.length === 0) {
      return [
        { id: "e1", source: "root", target: "services", animated: true, style: { stroke: "#6366f1" } },
        { id: "e2", source: "root", target: "agents", animated: true, style: { stroke: "#6366f1" } },
      ];
    }

    return graphData.edges.map((e) => ({
      id: e.id,
      source: e.source,
      target: e.target,
      animated: e.animated ?? true,
      style: { stroke: "#6366f1" },
    }));
  }, [graphData]);

  return (
    <Card className="w-full h-[500px] flex flex-col">
      <CardHeader className="py-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Layers className="w-4 h-4 text-indigo-400" />
          <span>Repository Knowledge Graph (Interactive Node Dependency Graph)</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 p-0 relative overflow-hidden rounded-b-xl bg-slate-950">
        <ReactFlow
          nodes={initialNodes}
          edges={initialEdges}
          onNodeClick={(_, node) => onNodeClick && onNodeClick(node.id)}
          fitView
        >
          <Background color="#334155" gap={16} />
          <Controls className="bg-slate-900 border-slate-800 text-white fill-white" />
        </ReactFlow>
      </CardContent>
    </Card>
  );
}
