"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Layers,
  ChevronDown,
  ChevronRight,
  FileCode,
  Cpu,
  Globe,
  Database,
  ShieldCheck,
  Zap,
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
    color: "from-sky-500/15 to-card border-sky-500/30 text-sky-600 dark:text-sky-400",
    badgeColor: "bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/40",
    icon: <Globe className="w-4 h-4 text-sky-600 dark:text-sky-400" />,
  },
  {
    id: "api",
    title: "2. API Controller & Gateway Layer",
    color: "from-copper/15 to-card border-copper/30 text-copper",
    badgeColor: "bg-copper/10 text-copper border-copper/40",
    icon: <Layers className="w-4 h-4 text-copper" />,
  },
  {
    id: "services",
    title: "3. Domain Services Layer",
    color: "from-category-arch/15 to-card border-category-arch/30 text-category-arch",
    badgeColor: "bg-category-arch/10 text-category-arch border-category-arch/40",
    icon: <Cpu className="w-4 h-4 text-category-arch" />,
  },
  {
    id: "agents",
    title: "4. Multi-Agent AI Engineering Intelligence",
    color: "from-severity-warning/15 to-card border-severity-warning/30 text-severity-warning",
    badgeColor: "bg-severity-warning/10 text-severity-warning border-severity-warning/40",
    icon: <Zap className="w-4 h-4 text-severity-warning" />,
  },
  {
    id: "repositories",
    title: "5. Repository & Data Access Abstractions",
    color: "from-emerald-500/15 to-card border-emerald-500/30 text-emerald-600 dark:text-emerald-400",
    badgeColor: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/40",
    icon: <Database className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />,
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
    <div className="w-full p-5 bg-card rounded-2xl border border-border space-y-4 font-sans text-foreground shadow-xl">

      <div className="flex items-center justify-between border-b border-border pb-3">
        <div>
          <h3 className="text-base font-bold text-foreground flex items-center gap-2 font-display">
            <Layers className="w-5 h-5 text-category-arch" />
            <span>Architecture Layer View</span>
          </h3>
          <p className="text-xs text-muted-foreground font-mono">
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
              className={`rounded-xl border bg-gradient-to-r ${layer.color} shadow-sm overflow-hidden transition-all`}
            >
              {/* Layer Swimlane Header */}
              <button
                onClick={() => toggleLayer(layer.id)}
                className="w-full p-3 flex items-center justify-between bg-card/90 hover:bg-card transition text-left cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  {layer.icon}
                  <span className="text-sm font-bold font-display text-foreground">{layer.title}</span>
                  <Badge className={`${layer.badgeColor} text-[10px] font-mono font-semibold`}>
                    {layerNodes.length} Modules
                  </Badge>
                </div>

                <div className="text-muted-foreground">
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
                    className="p-3 bg-background/80 border-t border-border grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 font-mono text-xs"
                  >
                    {layerNodes.length > 0 ? (
                      layerNodes.map((n: any) => (
                        <button
                          key={n.id}
                          onClick={() => onNodeClick && onNodeClick(n.data?.label || n.id)}
                          className="flex items-center justify-between p-2.5 rounded-lg bg-card border border-border hover:border-copper/60 hover:bg-muted text-left transition group shadow-sm cursor-pointer"
                        >
                          <div className="flex items-center gap-2 truncate">
                            <FileCode className="w-3.5 h-3.5 text-category-arch shrink-0 group-hover:scale-110 transition-transform" />
                            <span className="truncate text-foreground font-semibold">
                              {n.data?.label || n.id}
                            </span>
                          </div>
                          <Badge variant="outline" className="text-[9px] border-border text-muted-foreground shrink-0 font-mono">
                            {n.data?.language || "Module"}
                          </Badge>
                        </button>
                      ))
                    ) : (
                      <div className="col-span-full py-2 text-center text-xs text-muted-foreground font-mono italic">
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
