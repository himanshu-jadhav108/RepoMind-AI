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
import { AgentReplayController } from "./components/AgentReplayController";
import dynamic from "next/dynamic";

const KnowledgeGraph3D = dynamic(
  () => import("./KnowledgeGraph3D"),
  {
    ssr: false,
    loading: () => (
      <div className="h-[650px] w-full flex flex-col items-center justify-center bg-slate-950 border border-slate-800 rounded-xl text-indigo-300 font-mono text-sm gap-3 select-none">
        <div className="w-8 h-8 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
        <span>Initializing WebGL 3D Galaxy View...</span>
      </div>
    ),
  }
);

interface KnowledgeGraphProps {
  graphData?: { nodes: any[]; edges: any[] } | null;
  onNodeClick?: (nodeId: string) => void;
  runId?: string;
  findings?: any[];
}

// Register custom node renderers
const nodeTypes = {
  folder: FolderNode,
  file: FileNode,
  class: SymbolNode,
  function: SymbolNode,
  default: FileNode,
};

// Rich pre-computed demo graph representing the actual RepoMind AI project structure (60 nodes, 38 edges)
const DEMO_GRAPH_DATA = {
  nodes: [
    // ── Root ──────────────────────────────────────────────────────────────────
    { id: "root", type: "folder", data: { label: "RepoMind-AI/", child_count: 2, health: "healthy" } },

    // ── Top-level folders ─────────────────────────────────────────────────────
    { id: "backend", type: "folder", data: { label: "backend/", parent_id: "root", child_count: 8, health: "healthy" } },
    { id: "frontend", type: "folder", data: { label: "frontend/", parent_id: "root", child_count: 6, health: "healthy" } },

    // ── Backend sub-folders ───────────────────────────────────────────────────
    { id: "be_agents", type: "folder", data: { label: "agents/", parent_id: "backend", child_count: 10, health: "healthy" } },
    { id: "be_api", type: "folder", data: { label: "api/v1/", parent_id: "backend", child_count: 4, health: "warning" } },
    { id: "be_orchestration", type: "folder", data: { label: "orchestration/", parent_id: "backend", child_count: 2, health: "healthy" } },
    { id: "be_analysis_toolkit", type: "folder", data: { label: "analysis_toolkit/", parent_id: "backend", child_count: 4, health: "healthy" } },
    { id: "be_providers", type: "folder", data: { label: "providers/", parent_id: "backend", child_count: 6, health: "healthy" } },
    { id: "be_services", type: "folder", data: { label: "services/", parent_id: "backend", child_count: 3, health: "healthy" } },
    { id: "be_core", type: "folder", data: { label: "core/", parent_id: "backend", child_count: 4, health: "healthy" } },
    { id: "be_db", type: "folder", data: { label: "db/", parent_id: "backend", child_count: 3, health: "healthy" } },

    // ── Frontend sub-folders ──────────────────────────────────────────────────
    { id: "fe_app", type: "folder", data: { label: "app/", parent_id: "frontend", child_count: 5, health: "healthy" } },
    { id: "fe_features", type: "folder", data: { label: "features/", parent_id: "frontend", child_count: 8, health: "healthy" } },
    { id: "fe_lib", type: "folder", data: { label: "lib/", parent_id: "frontend", child_count: 2, health: "healthy" } },

    // ── Backend Agent Files ───────────────────────────────────────────────────
    { id: "f_base_agent", type: "file", data: { label: "base_agent.py", language: "Python", parent_id: "be_agents", health: "healthy", confidence: 0.98 } },
    { id: "f_planner", type: "file", data: { label: "planner_agent.py", language: "Python", parent_id: "be_agents", health: "healthy", confidence: 0.95 } },
    { id: "f_repo_analyzer", type: "file", data: { label: "repository_analyzer.py", language: "Python", parent_id: "be_agents", health: "healthy", confidence: 0.94 } },
    { id: "f_architect", type: "file", data: { label: "architect_agent.py", language: "Python", parent_id: "be_agents", health: "healthy", confidence: 0.95 } },
    { id: "f_bug_hunter", type: "file", data: { label: "bug_hunter_agent.py", language: "Python", parent_id: "be_agents", health: "warning", confidence: 0.88 } },
    { id: "f_security", type: "file", data: { label: "security_agent.py", language: "Python", parent_id: "be_agents", health: "critical", confidence: 0.96 } },
    { id: "f_performance", type: "file", data: { label: "performance_agent.py", language: "Python", parent_id: "be_agents", health: "healthy", confidence: 0.91 } },
    { id: "f_reviewer", type: "file", data: { label: "reviewer_agent.py", language: "Python", parent_id: "be_agents", health: "ai_generated", confidence: 0.97 } },
    { id: "f_learning", type: "file", data: { label: "learning_agent.py", language: "Python", parent_id: "be_agents", health: "healthy", confidence: 0.92 } },
    { id: "f_docs_agent", type: "file", data: { label: "documentation_agent.py", language: "Python", parent_id: "be_agents", health: "healthy", confidence: 0.89 } },

    // ── Backend API Files ─────────────────────────────────────────────────────
    { id: "f_routes_analysis", type: "file", data: { label: "routes_analysis.py", language: "Python", parent_id: "be_api", health: "warning", confidence: 0.86 } },
    { id: "f_routes_repos", type: "file", data: { label: "routes_repos.py", language: "Python", parent_id: "be_api", health: "healthy", confidence: 0.93 } },
    { id: "f_api_router", type: "file", data: { label: "api_router.py", language: "Python", parent_id: "be_api", health: "healthy", confidence: 0.97 } },

    // ── Orchestration ─────────────────────────────────────────────────────────
    { id: "f_graph", type: "file", data: { label: "graph.py", language: "Python", parent_id: "be_orchestration", health: "healthy", confidence: 0.96 } },
    { id: "f_state", type: "file", data: { label: "state.py", language: "Python", parent_id: "be_orchestration", health: "healthy", confidence: 0.99 } },

    // ── Analysis Toolkit ──────────────────────────────────────────────────────
    { id: "f_git_ingestion", type: "file", data: { label: "git_ingestion.py", language: "Python", parent_id: "be_analysis_toolkit", health: "warning", confidence: 0.87 } },
    { id: "f_code_parser", type: "file", data: { label: "code_parser.py", language: "Python", parent_id: "be_analysis_toolkit", health: "healthy", confidence: 0.90 } },
    { id: "f_dep_graph", type: "file", data: { label: "dependency_graph.py", language: "Python", parent_id: "be_analysis_toolkit", health: "healthy", confidence: 0.94 } },
    { id: "f_context_builder", type: "file", data: { label: "context_builder.py", language: "Python", parent_id: "be_analysis_toolkit", health: "warning", confidence: 0.83 } },

    // ── Providers ─────────────────────────────────────────────────────────────
    { id: "f_provider_router", type: "file", data: { label: "provider_router.py", language: "Python", parent_id: "be_providers", health: "healthy", confidence: 0.98 } },
    { id: "f_gemini", type: "file", data: { label: "gemini_provider.py", language: "Python", parent_id: "be_providers", health: "healthy", confidence: 0.95 } },
    { id: "f_groq", type: "file", data: { label: "groq_provider.py", language: "Python", parent_id: "be_providers", health: "healthy", confidence: 0.94 } },
    { id: "f_openai", type: "file", data: { label: "openai_provider.py", language: "Python", parent_id: "be_providers", health: "healthy", confidence: 0.93 } },
    { id: "f_mock_provider", type: "file", data: { label: "mock_provider.py", language: "Python", parent_id: "be_providers", health: "healthy", confidence: 0.99 } },

    // ── Services & Core ───────────────────────────────────────────────────────
    { id: "f_analysis_service", type: "file", data: { label: "analysis_service.py", language: "Python", parent_id: "be_services", health: "healthy", confidence: 0.94 } },
    { id: "f_config", type: "file", data: { label: "config.py", language: "Python", parent_id: "be_core", health: "warning", confidence: 0.91 } },
    { id: "f_main", type: "file", data: { label: "main.py", language: "Python", parent_id: "backend", health: "healthy", confidence: 0.97 } },

    // ── Frontend Feature Files ────────────────────────────────────────────────
    { id: "f_knowledge_graph", type: "file", data: { label: "KnowledgeGraph.tsx", language: "TypeScript (React)", parent_id: "fe_features", health: "healthy", confidence: 0.93 } },
    { id: "f_kg3d", type: "file", data: { label: "KnowledgeGraph3D.tsx", language: "TypeScript (React)", parent_id: "fe_features", health: "healthy", confidence: 0.94 } },
    { id: "f_agent_timeline", type: "file", data: { label: "AgentTimeline.tsx", language: "TypeScript (React)", parent_id: "fe_features", health: "healthy", confidence: 0.96 } },
    { id: "f_eng_meeting", type: "file", data: { label: "EngineeringReviewMeeting.tsx", language: "TypeScript (React)", parent_id: "fe_features", health: "ai_generated", confidence: 0.95 } },
    { id: "f_findings", type: "file", data: { label: "FindingsWorkspace.tsx", language: "TypeScript (React)", parent_id: "fe_features", health: "healthy", confidence: 0.91 } },
    { id: "f_code_viewer", type: "file", data: { label: "CodeViewer.tsx", language: "TypeScript (React)", parent_id: "fe_features", health: "warning", confidence: 0.86 } },
    { id: "f_report_export", type: "file", data: { label: "ReportExportView.tsx", language: "TypeScript (React)", parent_id: "fe_features", health: "healthy", confidence: 0.90 } },
    { id: "f_api_client", type: "file", data: { label: "api-client.ts", language: "TypeScript", parent_id: "fe_lib", health: "warning", confidence: 0.88 } },
    { id: "f_analyze_page", type: "file", data: { label: "[runId]/page.tsx", language: "TypeScript (React)", parent_id: "fe_app", health: "healthy", confidence: 0.95 } },
    { id: "f_landing_page", type: "file", data: { label: "page.tsx (Landing)", language: "TypeScript (React)", parent_id: "fe_app", health: "healthy", confidence: 0.97 } },

    // ── Key Symbol Nodes ──────────────────────────────────────────────────────
    { id: "s_analysis_state", type: "function", data: { label: "AnalysisState", language: "Python", parent_id: "f_state", health: "healthy", confidence: 0.99 } },
    { id: "s_provider_router_cls", type: "function", data: { label: "ProviderRouter", language: "Python", parent_id: "f_provider_router", health: "healthy", confidence: 0.98 } },
    { id: "s_base_agent_cls", type: "function", data: { label: "BaseAgent", language: "Python", parent_id: "f_base_agent", health: "healthy", confidence: 0.98 } },
    { id: "s_build_graph", type: "function", data: { label: "build_repomind_graph()", language: "Python", parent_id: "f_graph", health: "healthy", confidence: 0.97 } },
  ],
  edges: [
    // Root structure
    { id: "e1", source: "root", target: "backend", label: "contains" },
    { id: "e2", source: "root", target: "frontend", label: "contains" },
    // Backend folders
    { id: "e3", source: "backend", target: "be_agents", label: "contains" },
    { id: "e4", source: "backend", target: "be_api", label: "contains" },
    { id: "e5", source: "backend", target: "be_orchestration", label: "contains" },
    { id: "e6", source: "backend", target: "be_analysis_toolkit", label: "contains" },
    { id: "e7", source: "backend", target: "be_providers", label: "contains" },
    { id: "e8", source: "backend", target: "be_services", label: "contains" },
    { id: "e9", source: "backend", target: "be_core", label: "contains" },
    // Frontend folders
    { id: "e10", source: "frontend", target: "fe_features", label: "contains" },
    { id: "e11", source: "frontend", target: "fe_app", label: "contains" },
    { id: "e12", source: "frontend", target: "fe_lib", label: "contains" },
    // Key import relationships
    { id: "e13", source: "f_graph", target: "f_state", label: "imports", animated: true },
    { id: "e14", source: "f_graph", target: "f_planner", label: "imports", animated: true },
    { id: "e15", source: "f_graph", target: "f_repo_analyzer", label: "imports", animated: true },
    { id: "e16", source: "f_graph", target: "f_architect", label: "imports", animated: true },
    { id: "e17", source: "f_graph", target: "f_security", label: "imports", animated: true },
    { id: "e18", source: "f_graph", target: "f_reviewer", label: "imports", animated: true },
    { id: "e19", source: "f_routes_analysis", target: "f_graph", label: "imports", animated: true },
    { id: "e20", source: "f_routes_analysis", target: "f_analysis_service", label: "imports" },
    { id: "e21", source: "f_analysis_service", target: "f_graph", label: "imports" },
    { id: "e22", source: "f_repo_analyzer", target: "f_git_ingestion", label: "imports" },
    { id: "e23", source: "f_repo_analyzer", target: "f_code_parser", label: "imports" },
    { id: "e24", source: "f_repo_analyzer", target: "f_dep_graph", label: "imports" },
    { id: "e25", source: "f_architect", target: "f_context_builder", label: "imports" },
    { id: "e26", source: "f_provider_router", target: "f_gemini", label: "routes-to" },
    { id: "e27", source: "f_provider_router", target: "f_groq", label: "routes-to" },
    { id: "e28", source: "f_provider_router", target: "f_openai", label: "routes-to" },
    { id: "e29", source: "f_planner", target: "f_base_agent", label: "extends" },
    { id: "e30", source: "f_architect", target: "f_base_agent", label: "extends" },
    { id: "e31", source: "f_security", target: "f_base_agent", label: "extends" },
    { id: "e32", source: "f_reviewer", target: "f_base_agent", label: "extends" },
    // Frontend relationships
    { id: "e33", source: "f_analyze_page", target: "f_agent_timeline", label: "imports" },
    { id: "e34", source: "f_analyze_page", target: "f_knowledge_graph", label: "imports" },
    { id: "e35", source: "f_analyze_page", target: "f_eng_meeting", label: "imports" },
    { id: "e36", source: "f_analyze_page", target: "f_findings", label: "imports" },
    { id: "e37", source: "f_analyze_page", target: "f_api_client", label: "imports" },
    { id: "e38", source: "f_knowledge_graph", target: "f_kg3d", label: "imports" },
    // Symbol edges
    { id: "e39", source: "f_state", target: "s_analysis_state", label: "defines" },
    { id: "e40", source: "f_provider_router", target: "s_provider_router_cls", label: "defines" },
    { id: "e41", source: "f_base_agent", target: "s_base_agent_cls", label: "defines" },
    { id: "e42", source: "f_graph", target: "s_build_graph", label: "defines" },
  ],
};

export function KnowledgeGraph({ graphData, onNodeClick, runId, findings = [] }: KnowledgeGraphProps) {
  const selectedNodeId = useGraphStore((s) => s.selectedNodeId);
  const setSelectedNodeId = useGraphStore((s) => s.setSelectedNodeId);

  const layoutMode = useGraphStore((s) => s.layoutMode);
  const searchQuery = useGraphStore((s) => s.searchQuery);
  const selectedRisk = useGraphStore((s) => s.selectedRisk);
  const drillLevel = useGraphStore((s) => s.drillLevel);
  const expandedNodeIds = useGraphStore((s) => s.expandedNodeIds);
  const selectedAgent = useGraphStore((s) => s.selectedAgent);

  // Raw Graph Data Fallback — only use hardcoded DEMO_GRAPH_DATA if runId is explicitly a demo run
  const rawData = useMemo(() => {
    if (graphData && graphData.nodes && graphData.nodes.length > 0) {
      return graphData;
    }
    if (runId && (runId.includes("demo") || runId === "demo_run")) {
      return DEMO_GRAPH_DATA;
    }
    return graphData || { nodes: [], edges: [] };
  }, [graphData, runId]);


  // Nodes Filter (Search, Risk Tier, Folder Drill-Down)
  const filteredNodes: Node[] = useMemo(() => {
    let nodes = rawData.nodes || [];

    // Search Query Filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      nodes = nodes.filter(
        (n: any) =>
          n.id.toLowerCase().includes(q) ||
          (n.data?.label && n.data.label.toLowerCase().includes(q))
      );
    }

    // Risk Filter
    if (selectedRisk !== "all") {
      nodes = nodes.filter((n: any) => n.data?.health === selectedRisk || selectedRisk === "low");
    }

    // Dynamic Interactive Folder Expansion
    if (!expandedNodeIds.has("*")) {
      nodes = nodes.filter((n: any) => {
        const parentId = n.data?.parent_id || n.data?.parentFolder;
        if (!parentId) return true;
        return expandedNodeIds.has(parentId);
      });
    }

    return nodes.map((n: any) => ({
      id: n.id,
      type: n.type || "file",
      data: n.data || { label: n.id },
      position: { x: 0, y: 0 },
    }));
  }, [rawData, expandedNodeIds, searchQuery, selectedRisk]);

  // Edges Filter with Smart Prioritization & Cap
  const { filteredEdges, totalEdgeCount, isEdgeTruncated } = useMemo(() => {
    const validIds = new Set(filteredNodes.map((n) => n.id));
    const rawEdges = rawData.edges || [];
    const validEdges = rawEdges.filter((e: any) => validIds.has(e.source) && validIds.has(e.target));
    const totalEdgeCount = validEdges.length;

    // Prioritize edges:
    // (a) Edges touching selectedNodeId
    // (b) Animated / import dependency edges
    // (c) Standard structural edges
    const selectedEdges: any[] = [];
    const importEdges: any[] = [];
    const otherEdges: any[] = [];

    for (const e of validEdges) {
      if (selectedNodeId && (e.source === selectedNodeId || e.target === selectedNodeId)) {
        selectedEdges.push(e);
      } else if (e.label === "imports" || e.animated) {
        importEdges.push(e);
      } else {
        otherEdges.push(e);
      }
    }

    const prioritized = [...selectedEdges, ...importEdges, ...otherEdges];
    const capped = prioritized.slice(0, 100);

    const formatted = capped.map((e: any, idx: number) => {
      const isImport = e.label === "imports" || e.animated;
      const isAgentPath = selectedAgent !== null;
      const isSelectedEdge = selectedNodeId && (e.source === selectedNodeId || e.target === selectedNodeId);

      return {
        id: e.id || `edge-${idx}`,
        source: e.source,
        target: e.target,
        type: "smoothstep",
        animated: isImport || isAgentPath || isSelectedEdge,
        style: {
          stroke: isSelectedEdge ? "#a855f7" : isAgentPath ? "#c084fc" : isImport ? "#818cf8" : "#475569",
          strokeWidth: isSelectedEdge ? 3 : isAgentPath ? 2.5 : isImport ? 1.8 : 1.2,
        },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          width: 12,
          height: 12,
          color: isSelectedEdge ? "#a855f7" : isAgentPath ? "#c084fc" : isImport ? "#818cf8" : "#475569",
        },
      };
    });

    return {
      filteredEdges: formatted,
      totalEdgeCount,
      isEdgeTruncated: totalEdgeCount > 100,
    };
  }, [rawData, filteredNodes, selectedAgent, selectedNodeId]);

  // Apply Selected Layout Engine
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

      {/* 3. Agent Replay Controller Bar */}
      <AgentReplayController />

      {/* 4. Main Visualization Canvas (2D ReactFlow or 3D WebGL Galaxy) */}
      <CardContent className="h-[540px] p-0 relative overflow-hidden bg-slate-950">
        {/* Agent Reasoning Traversal Overlay Card */}
        {selectedAgent && <AgentTraversalOverlay agentName={selectedAgent} />}

        {/* Floating Glass Hover Inspector Tooltip */}
        <NodeHoverCard />

        {/* Right-Side Detailed Node Analytics Inspector Drawer */}
        <NodeInspectorSidebar graphData={rawData} runId={runId} findings={findings} />

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
            {isEdgeTruncated && (
              <Panel position="top-right" className="mr-3 mt-3">
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-950/80 border border-amber-500/40 text-amber-200 text-xs font-mono backdrop-blur-md shadow-xl">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>Showing 100 of {totalEdgeCount} edges — refine with search or drill-down</span>
                </div>
              </Panel>
            )}
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
