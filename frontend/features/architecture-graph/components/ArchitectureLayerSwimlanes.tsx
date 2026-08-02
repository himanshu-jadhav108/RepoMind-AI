"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Layers,
  ChevronDown,
  ChevronRight,
  FileCode,
  ShieldCheck,
  Zap,
  Cpu,
  Globe,
  Database,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface ArchitectureLayerSwimlanesProps {
  graphData?: { nodes: any[]; edges: any[] } | null;
  onNodeClick?: (nodeId: string) => void;
}

const DEFAULT_DEMO_NODES = [
  // 1. Presentation Layer (Frontend)
  { id: "f_landing_page", data: { label: "page.tsx (Landing UI)", language: "TypeScript (React)", parent_id: "fe_app" } },
  { id: "f_analyze_page", data: { label: "[runId]/page.tsx (Workspace)", language: "TypeScript (React)", parent_id: "fe_app" } },
  { id: "f_knowledge_graph", data: { label: "KnowledgeGraph.tsx", language: "TypeScript (React)", parent_id: "fe_features" } },
  { id: "f_kg3d", data: { label: "KnowledgeGraph3D.tsx", language: "TypeScript (React)", parent_id: "fe_features" } },
  { id: "f_eng_meeting", data: { label: "EngineeringReviewMeeting.tsx", language: "TypeScript (React)", parent_id: "fe_features" } },
  { id: "f_findings", data: { label: "FindingsWorkspace.tsx", language: "TypeScript (React)", parent_id: "fe_features" } },
  { id: "f_code_viewer", data: { label: "CodeViewer.tsx", language: "TypeScript (React)", parent_id: "fe_features" } },
  { id: "f_report_export", data: { label: "ReportExportView.tsx", language: "TypeScript (React)", parent_id: "fe_features" } },
  { id: "f_api_client", data: { label: "api-client.ts", language: "TypeScript", parent_id: "fe_lib" } },

  // 2. API Controller & Gateway Layer
  { id: "f_main", data: { label: "backend/app/main.py", language: "Python", parent_id: "backend" } },
  { id: "f_routes_analysis", data: { label: "routes_analysis.py", language: "Python", parent_id: "be_api" } },
  { id: "f_api_router", data: { label: "api_router.py", language: "Python", parent_id: "be_api" } },

  // 3. Domain Services Layer
  { id: "f_analysis_service", data: { label: "analysis_service.py", language: "Python", parent_id: "be_services" } },
  { id: "f_report_service", data: { label: "report_service.py", language: "Python", parent_id: "be_services" } },
  { id: "f_context_builder", data: { label: "context_builder.py", language: "Python", parent_id: "be_analysis_toolkit" } },
  { id: "f_graph_builder", data: { label: "dependency_graph_builder.py", language: "Python", parent_id: "be_analysis_toolkit" } },
  { id: "f_config", data: { label: "config.py", language: "Python", parent_id: "be_core" } },

  // 4. Multi-Agent AI Engineering Intelligence
  { id: "f_graph", data: { label: "orchestration/graph.py", language: "Python", parent_id: "be_orchestration" } },
  { id: "f_planner", data: { label: "planner_agent.py", language: "Python", parent_id: "be_agents" } },
  { id: "f_repo_analyzer", data: { label: "repository_analyzer.py", language: "Python", parent_id: "be_agents" } },
  { id: "f_architect", data: { label: "architect_agent.py", language: "Python", parent_id: "be_agents" } },
  { id: "f_bug_hunter", data: { label: "bug_hunter_agent.py", language: "Python", parent_id: "be_agents" } },
  { id: "f_security", data: { label: "security_agent.py", language: "Python", parent_id: "be_agents" } },
  { id: "f_performance", data: { label: "performance_agent.py", language: "Python", parent_id: "be_agents" } },
  { id: "f_reviewer", data: { label: "reviewer_agent.py", language: "Python", parent_id: "be_agents" } },
  { id: "f_learning", data: { label: "learning_agent.py", language: "Python", parent_id: "be_agents" } },

  // 5. Repository & Data Access Abstractions
  { id: "f_analysis_repo", data: { label: "analysis_repository.py", language: "Python", parent_id: "be_repositories" } },
  { id: "f_git_ingestion", data: { label: "git_ingestion.py", language: "Python", parent_id: "be_analysis_toolkit" } },
  { id: "f_provider_router", data: { label: "provider_router.py", language: "Python", parent_id: "be_providers" } },
];

const LAYERS_SPEC = [
  {
    id: "frontend",
    title: "1. Presentation Layer (Frontend)",
    color: "from-cyan-500/20 to-blue-500/10 border-cyan-500/30 text-cyan-300",
    badgeColor: "bg-cyan-950 text-cyan-300 border-cyan-500/40",
    icon: <Globe className="w-4 h-4 text-cyan-400" />,
  },
  {
    id: "api",
    title: "2. API Controller & Gateway Layer",
    color: "from-purple-500/20 to-indigo-500/10 border-purple-500/30 text-purple-300",
    badgeColor: "bg-purple-950 text-purple-300 border-purple-500/40",
    icon: <Layers className="w-4 h-4 text-purple-400" />,
  },
  {
    id: "services",
    title: "3. Domain Services Layer",
    color: "from-blue-500/20 to-indigo-500/10 border-blue-500/30 text-blue-300",
    badgeColor: "bg-blue-950 text-blue-300 border-blue-500/40",
    icon: <Cpu className="w-4 h-4 text-blue-400" />,
  },
  {
    id: "agents",
    title: "4. Multi-Agent AI Engineering Intelligence",
    color: "from-amber-500/20 to-yellow-500/10 border-amber-500/30 text-amber-300",
    badgeColor: "bg-amber-950 text-amber-300 border-amber-500/40",
    icon: <Zap className="w-4 h-4 text-amber-400" />,
  },
  {
    id: "repositories",
    title: "5. Repository & Data Access Abstractions",
    color: "from-emerald-500/20 to-teal-500/10 border-emerald-500/30 text-emerald-300",
    badgeColor: "bg-emerald-950 text-emerald-300 border-emerald-500/40",
    icon: <Database className="w-4 h-4 text-emerald-400" />,
  },
];

function matchNodeToLayer(node: any, layerId: string): boolean {
  const str = `${node.id || ""} ${node.data?.label || ""} ${node.data?.parent_id || ""}`.toLowerCase();

  if (layerId === "frontend") {
    return str.includes("fe_") || str.includes("tsx") || str.includes("ts") || str.includes("frontend") || str.includes("page") || str.includes("client");
  }
  if (layerId === "api") {
    return str.includes("be_api") || str.includes("routes") || str.includes("main.py") || str.includes("controller") || str.includes("api_router");
  }
  if (layerId === "services") {
    return str.includes("service") || str.includes("context_builder") || str.includes("dependency_graph") || str.includes("config");
  }
  if (layerId === "agents") {
    return str.includes("agent") || str.includes("orchestration") || str.includes("graph.py") || str.includes("planner") || str.includes("architect") || str.includes("reviewer") || str.includes("be_agents");
  }
  if (layerId === "repositories") {
    return str.includes("repo") || str.includes("git_ingestion") || str.includes("db") || str.includes("provider") || str.includes("be_providers") || str.includes("be_repositories");
  }
  return false;
}

export function ArchitectureLayerSwimlanes({ graphData, onNodeClick }: ArchitectureLayerSwimlanesProps) {
  const [collapsedLayers, setCollapsedLayers] = useState<Record<string, boolean>>({});

  const inputNodes = graphData?.nodes && graphData.nodes.length > 0 ? graphData.nodes : DEFAULT_DEMO_NODES;
  // Filter out folder and root structural container nodes so only file/function modules appear
  const fileNodes = inputNodes.filter((n: any) => n.type === "file" || n.type === "function" || !n.type);

  const toggleLayer = (layerId: string) => {
    setCollapsedLayers((prev) => ({ ...prev, [layerId]: !prev[layerId] }));
  };

  return (
    <div className="w-full p-5 bg-slate-950 rounded-2xl border border-slate-800 space-y-4 font-sans selection:bg-purple-500 selection:text-white shadow-2xl">

      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div>
          <h3 className="text-base font-bold text-white flex items-center gap-2 font-mono">
            <Layers className="w-5 h-5 text-indigo-400" />
            <span>Architecture Layer View</span>
          </h3>
          <p className="text-xs text-slate-400 font-mono">
            Nodes grouped into color-coded Clean Architecture swimlanes
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {LAYERS_SPEC.map((layer) => {
          const layerNodes = fileNodes.filter((n: any) => matchNodeToLayer(n, layer.id));
          const isCollapsed = collapsedLayers[layer.id];

          return (
            <div
              key={layer.id}
              className={`rounded-xl border bg-gradient-to-r ${layer.color} shadow-lg overflow-hidden transition-all`}
            >
              {/* Layer Swimlane Header */}
              <button
                onClick={() => toggleLayer(layer.id)}
                className="w-full p-3 flex items-center justify-between bg-slate-950/60 hover:bg-slate-950/80 transition text-left cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  {layer.icon}
                  <span className="text-sm font-bold font-mono text-white">{layer.title}</span>
                  <Badge className={`${layer.badgeColor} text-[10px] font-mono`}>
                    {layerNodes.length} Modules
                  </Badge>
                </div>

                <div className="text-slate-400">
                  {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </div>
              </button>

              {/* Layer Nodes Content Grid */}
              <AnimatePresence>
                {!isCollapsed && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="p-3 bg-slate-950/90 border-t border-slate-800/80 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 font-mono text-xs"
                  >
                    {layerNodes.length > 0 ? (
                      layerNodes.map((n: any) => (
                        <button
                          key={n.id}
                          onClick={() => onNodeClick && onNodeClick(n.data?.label || n.id)}
                          className="flex items-center justify-between p-2.5 rounded-lg bg-slate-900/80 border border-slate-800 hover:border-indigo-500/50 hover:bg-slate-800/80 text-left transition group shadow-sm cursor-pointer"
                        >
                          <div className="flex items-center gap-2 truncate">
                            <FileCode className="w-3.5 h-3.5 text-indigo-400 shrink-0 group-hover:scale-110 transition-transform" />
                            <span className="truncate text-slate-200 group-hover:text-white font-semibold">
                              {n.data?.label || n.id}
                            </span>
                          </div>
                          <Badge variant="outline" className="text-[9px] border-slate-700 text-slate-400 shrink-0">
                            {n.data?.language || "Module"}
                          </Badge>
                        </button>
                      ))
                    ) : (
                      <div className="col-span-full py-2 text-center text-xs text-slate-500 font-mono italic">
                        Clean layer abstraction — no direct violations.
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </div>
  );
}
