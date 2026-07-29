"use client";

import React, { useMemo, useCallback } from "react";
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
import { Card, CardContent } from "@/components/ui/card";
import { Layers, Maximize2, Bot, Sparkles, SlidersHorizontal } from "lucide-react";

import { useGraphStore } from "./store/useGraphStore";
import { getDagreLayout } from "./layout-engine/dagreLayout";
import { getForceLayout } from "./layout-engine/forceLayout";
import { getRadialLayout } from "./layout-engine/radialLayout";

import { FolderNode } from "./custom-nodes/FolderNode";
import { FileNode } from "./custom-nodes/FileNode";
import { SymbolNode } from "./custom-nodes/SymbolNode";

import { GraphHeaderStats } from "./components/GraphHeaderStats";
import { GraphToolbar } from "./components/GraphToolbar";
import { NodeHoverCard } from "./components/NodeHoverCard";
import { NodeInspectorSidebar } from "./components/NodeInspectorSidebar";
import { AgentTraversalOverlay } from "./components/AgentTraversalOverlay";
import { KnowledgeGraph3D } from "./KnowledgeGraph3D";

interface KnowledgeGraphProps {
  graphData?: { nodes: any[]; edges: any[] } | null;
  onNodeClick?: (nodeId: string) => void;
}

// Register custom node renderers
const nodeTypes = {
  folder: FolderNode,
  file: FileNode,
  class: SymbolNode,
  function: SymbolNode,
  default: FileNode,
};

// Fallback demo graph data
const DEMO_GRAPH_DATA = {
  nodes: [
    { id: "root", type: "file", data: { label: "backend/app/main.py", language: "Python", health: "healthy", confidence: 0.96 } },
    { id: "backend", type: "folder", data: { label: "backend/", child_count: 8 } },
    { id: "frontend", type: "folder", data: { label: "frontend/", child_count: 12 } },
    { id: "services", type: "folder", data: { label: "backend/app/services/", parent_id: "backend", child_count: 3 } },
    { id: "agents", type: "folder", data: { label: "backend/app/agents/", parent_id: "backend", child_count: 10 } },
    { id: "analysis_service", type: "file", data: { label: "analysis_service.py", language: "Python", parent_id: "services", health: "healthy", confidence: 0.94 } },
    { id: "repo_service", type: "file", data: { label: "repo_ingestion_service.py", language: "Python", parent_id: "services", health: "warning", confidence: 0.88 } },
    { id: "architect_agent", type: "file", data: { label: "architect_agent.py", language: "Python", parent_id: "agents", health: "healthy", confidence: 0.95 } },
    { id: "reviewer_agent", type: "file", data: { label: "reviewer_agent.py", language: "Python", parent_id: "agents", health: "ai_generated", confidence: 0.97 } },
  ],
  edges: [
    { id: "e1", source: "root", target: "backend", label: "contains", animated: false },
    { id: "e2", source: "root", target: "frontend", label: "contains", animated: false },
    { id: "e3", source: "backend", target: "services", label: "contains", animated: false },
    { id: "e4", source: "backend", target: "agents", label: "contains", animated: false },
    { id: "e5", source: "services", target: "analysis_service", label: "contains", animated: false },
    { id: "e6", source: "services", target: "repo_service", label: "contains", animated: false },
    { id: "e7", source: "agents", target: "architect_agent", label: "contains", animated: false },
    { id: "e8", source: "agents", target: "reviewer_agent", label: "contains", animated: false },
    { id: "e9", source: "analysis_service", target: "architect_agent", label: "imports", animated: true },
  ],
};

export function KnowledgeGraph({ graphData, onNodeClick }: KnowledgeGraphProps) {
  // Read state from Zustand Graph Store
  const drillLevel = useGraphStore((s) => s.drillLevel);
  const expandedNodeIds = useGraphStore((s) => s.expandedNodeIds);
  const layoutMode = useGraphStore((s) => s.layoutMode);
  const selectedAgent = useGraphStore((s) => s.selectedAgent);
  const searchQuery = useGraphStore((s) => s.searchQuery);
  const selectedRisk = useGraphStore((s) => s.selectedRisk);
  const setSelectedNodeId = useGraphStore((s) => s.setSelectedNodeId);

  const rawData = graphData?.nodes && graphData.nodes.length > 0 ? graphData : DEMO_GRAPH_DATA;

  // Filter & Drill-down Nodes (Level 1 to Level 5)
  const filteredNodes: Node[] = useMemo(() => {
    let nodes = rawData.nodes || [];

    // Search Query Filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      nodes = nodes.filter(
        (n: any) =>
          n.id.toLowerCase().includes(q) ||
          (n.data?.label || "").toLowerCase().includes(q) ||
          (n.data?.language || "").toLowerCase().includes(q)
      );
    }

    // Risk Filter
    if (selectedRisk !== "all") {
      nodes = nodes.filter((n: any) => n.data?.health === selectedRisk || selectedRisk === "low");
    }

    // Dynamic Interactive Folder Expansion (Click folder to reveal subfolders & files)
    if (!expandedNodeIds.has("*")) {
      nodes = nodes.filter((n: any) => {
        const parentId = n.data?.parent_id || n.data?.parentFolder;
        if (!parentId) return true; // Top-level nodes with no parent are always visible
        return expandedNodeIds.has(parentId);
      });
    }

    return nodes.map((n: any) => ({
      id: n.id,
      type: n.type || "file",
      data: n.data || { label: n.id },
      position: { x: 0, y: 0 },
    }));
  }, [rawData, drillLevel, expandedNodeIds, searchQuery, selectedRisk]);

  // Edges Filter
  const filteredEdges: Edge[] = useMemo(() => {
    const validIds = new Set(filteredNodes.map((n) => n.id));
    const rawEdges = rawData.edges || [];

    return rawEdges
      .filter((e: any) => validIds.has(e.source) && validIds.has(e.target))
      .slice(0, 100)
      .map((e: any, idx: number) => {
        const isImport = e.label === "imports" || e.animated;
        const isAgentPath = selectedAgent !== null;

        return {
          id: e.id || `edge-${idx}`,
          source: e.source,
          target: e.target,
          type: "smoothstep",
          animated: isImport || isAgentPath,
          style: {
            stroke: isAgentPath ? "#c084fc" : isImport ? "#818cf8" : "#475569",
            strokeWidth: isAgentPath ? 2.5 : isImport ? 1.8 : 1.2,
          },
          markerEnd: {
            type: MarkerType.ArrowClosed,
            width: 12,
            height: 12,
            color: isAgentPath ? "#c084fc" : isImport ? "#818cf8" : "#475569",
          },
        };
      });
  }, [rawData, filteredNodes, selectedAgent]);

  // Apply Selected Layout Engine (Tree, Force, Radial, Architecture, etc.)
  const { nodes: layoutedNodes, edges: layoutedEdges } = useMemo(() => {
    if (layoutMode === "force" || layoutMode === "network" || layoutMode === "heatmap") {
      return getForceLayout(filteredNodes, filteredEdges);
    }
    if (layoutMode === "circular" || layoutMode === "module") {
      return getRadialLayout(filteredNodes, filteredEdges);
    }
    if (layoutMode === "architecture") {
      return getDagreLayout(filteredNodes, filteredEdges, "LR");
    }
    // Default Tree & Folder Layouts
    return getDagreLayout(filteredNodes, filteredEdges, "TB");
  }, [filteredNodes, filteredEdges, layoutMode]);

  // Handle Node Click
  const handleNodeClickInternal = useCallback(
    (e: any, node: Node) => {
      if (e) {
        if (typeof e.preventDefault === "function") e.preventDefault();
        if (typeof e.stopPropagation === "function") e.stopPropagation();
      }
      setSelectedNodeId(node.id);
      if (onNodeClick) {
        onNodeClick(node.id);
      }
    },
    [setSelectedNodeId, onNodeClick]
  );

  return (
    <Card className="w-full flex flex-col border border-border/80 shadow-2xl overflow-hidden bg-slate-950">
      {/* 1. Top Repository AI Statistics Panel */}
      <GraphHeaderStats />

      {/* 2. Interactive Search, Filters & Layout Switcher Toolbar */}
      <GraphToolbar />

      {/* 3. Main Visualization Canvas (2D ReactFlow or 3D WebGL Galaxy) */}
      <CardContent className="h-[540px] p-0 relative overflow-hidden bg-slate-950">
        {/* Agent Reasoning Traversal Overlay Card */}
        {selectedAgent && <AgentTraversalOverlay agentName={selectedAgent} />}

        {/* Floating Glass Hover Inspector Tooltip */}
        <NodeHoverCard />

        {/* Right-Side Detailed Node Analytics Inspector Drawer */}
        <NodeInspectorSidebar graphData={rawData} />

        {/* Layout Render Condition */}
        {layoutMode === "galaxy" ? (
          <KnowledgeGraph3D graphData={rawData} onNodeClick={onNodeClick} />
        ) : (
          <ReactFlow
            nodes={layoutedNodes}
            edges={layoutedEdges}
            nodeTypes={nodeTypes}
            onNodeClick={handleNodeClickInternal}
            fitView
            fitViewOptions={{ padding: 0.25, duration: 300 }}
            minZoom={0.1}
            maxZoom={3.0}
            panOnDrag={true}
            nodesDraggable={true}
            zoomOnScroll={true}
            zoomOnPinch={true}
            zoomOnDoubleClick={true}
          >
            <Background color="#1e293b" gap={20} size={1} />
            <Controls className="bg-slate-900 border-slate-800 text-white fill-white rounded-lg shadow-xl" />
            <MiniMap
              pannable={true}
              zoomable={false} // Prevents scroll wheel over MiniMap from jumping viewport off-screen
              nodeColor={(n) => {
                if (n.type === "folder") return "#38bdf8";
                if (n.type === "class") return "#fbbf24";
                if (n.type === "function") return "#34d399";
                return "#818cf8";
              }}
              maskColor="rgba(15, 23, 42, 0.75)"
              className="bg-slate-900 border-slate-800 rounded-lg hidden sm:block shadow-lg cursor-grab active:cursor-grabbing"
            />
            <Panel position="bottom-left" className="m-3">
              <div className="p-2.5 rounded-lg bg-slate-900/90 border border-slate-800 backdrop-blur-md text-[11px] text-slate-300 font-mono flex items-center gap-2 shadow-lg">
                <Maximize2 className="w-3.5 h-3.5 text-indigo-400" />
                <span>
                  {layoutMode.toUpperCase()} Layout • Level {drillLevel} Drill-down • Click node to inspect
                </span>
              </div>
            </Panel>
          </ReactFlow>
        )}
      </CardContent>
    </Card>
  );
}
