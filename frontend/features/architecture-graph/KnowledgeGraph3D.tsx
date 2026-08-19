"use client";

import React, { useEffect, useRef, useState, useMemo, useCallback } from "react";
import { Move, ZoomIn, ZoomOut, RefreshCw, FolderOpen, Sparkles, Layers, ChevronDown, ChevronUp, Palette, Cpu, X, FileCode, ExternalLink } from "lucide-react";
import * as THREE from "three";
import { useGraphStore } from "./store/useGraphStore";

interface KnowledgeGraph3DProps {
  graphData?: { nodes: any[]; edges: any[] } | null;
  onNodeClick?: (nodeId: string) => void;
}

interface Node3DData {
  id: string;
  label: string;
  shortLabel: string;
  type: string; // "folder" | "file" | "class" | "function"
  language: string;
  languageKey: string;
  color: string;
  val: number;
  degree: number;
  isRoot: boolean;
  x?: number;
  y?: number;
  z?: number;
}

interface Link3DData {
  id: string;
  source: string | Node3DData;
  target: string | Node3DData;
  animated?: boolean;
}

// ── Language & Type Palette (Warm Graphite & Industrial Copper Redesign) ────
export const LANGUAGE_PALETTE: Record<
  string,
  { label: string; color: string; bgClass: string; textClass: string; borderClass: string }
> = {
  root: {
    label: "Root Anchor",
    color: "#D97736", // Warm Copper
    bgClass: "bg-[#D97736]/20",
    textClass: "text-[#D97736]",
    borderClass: "border-[#D97736]/40",
  },
  folder: {
    label: "Folder / Architecture",
    color: "#5B82A6", // Steel Blue Architecture
    bgClass: "bg-[#5B82A6]/20",
    textClass: "text-[#5B82A6]",
    borderClass: "border-[#5B82A6]/40",
  },
  python: {
    label: "Python",
    color: "#E5A93C", // Warm Amber Gold
    bgClass: "bg-[#E5A93C]/20",
    textClass: "text-[#E5A93C]",
    borderClass: "border-[#E5A93C]/40",
  },
  typescript: {
    label: "TypeScript / JS",
    color: "#38BDF8", // Vibrant Cyan Teal
    bgClass: "bg-[#38BDF8]/20",
    textClass: "text-[#38BDF8]",
    borderClass: "border-[#38BDF8]/40",
  },
  json: {
    label: "JSON / Config",
    color: "#34D399", // Mint Teal
    bgClass: "bg-[#34D399]/20",
    textClass: "text-[#34D399]",
    borderClass: "border-[#34D399]/40",
  },
  markdown: {
    label: "Markdown / Docs",
    color: "#FB7185", // Coral Rose
    bgClass: "bg-[#FB7185]/20",
    textClass: "text-[#FB7185]",
    borderClass: "border-[#FB7185]/40",
  },
  css: {
    label: "CSS / Styling",
    color: "#60A5FA", // Sky Slate
    bgClass: "bg-[#60A5FA]/20",
    textClass: "text-[#60A5FA]",
    borderClass: "border-[#60A5FA]/40",
  },
  other: {
    label: "Other Source",
    color: "#94A3B8", // Muted Slate
    bgClass: "bg-[#94A3B8]/20",
    textClass: "text-[#94A3B8]",
    borderClass: "border-[#94A3B8]/40",
  },
};

function resolveLanguageKey(n: any): string {
  const type = n.type || "file";
  const label = (n.data?.label || n.id || "").toLowerCase();
  
  if (n.id === "root" || n.id === "__repo_root__" || type === "root" || label === "repomind-ai/" || label === "root") return "root";
  if (type === "folder") return "folder";

  const rawLang = (n.data?.language || "").toLowerCase();
  if (rawLang.includes("python") || rawLang.includes("py")) return "python";
  if (
    rawLang.includes("typescript") ||
    rawLang.includes("javascript") ||
    rawLang.includes("react") ||
    rawLang.includes("ts") ||
    rawLang.includes("js")
  ) {
    return "typescript";
  }
  if (
    rawLang.includes("json") ||
    rawLang.includes("config") ||
    rawLang.includes("yaml") ||
    rawLang.includes("toml")
  ) {
    return "json";
  }
  if (rawLang.includes("markdown") || rawLang.includes("doc")) return "markdown";
  if (rawLang.includes("css") || rawLang.includes("style")) return "css";

  // Fallback to extension check
  if (label.endsWith(".py")) return "python";
  if (label.endsWith(".ts") || label.endsWith(".tsx") || label.endsWith(".js") || label.endsWith(".jsx")) return "typescript";
  if (label.endsWith(".json") || label.endsWith(".yaml") || label.endsWith(".yml") || label.endsWith(".toml") || label.endsWith(".env")) return "json";
  if (label.endsWith(".md") || label.endsWith(".rst") || label.endsWith(".txt")) return "markdown";
  if (label.endsWith(".css") || label.endsWith(".scss") || label.endsWith(".less")) return "css";

  return "other";
}

// Fallback high-quality demo data structure representing RepoMind AI codebase
const FALLBACK_DEMO_NODES = [
  { id: "root", type: "folder", data: { label: "RepoMind-AI/", language: "Root" } },
  { id: "backend", type: "folder", data: { label: "backend/", language: "Folder" } },
  { id: "frontend", type: "folder", data: { label: "frontend/", language: "Folder" } },
  { id: "be_agents", type: "folder", data: { label: "backend/agents/", language: "Folder" } },
  { id: "be_api", type: "folder", data: { label: "backend/api/v1/", language: "Folder" } },
  { id: "be_toolkit", type: "folder", data: { label: "backend/analysis_toolkit/", language: "Folder" } },
  { id: "be_providers", type: "folder", data: { label: "backend/providers/", language: "Folder" } },
  { id: "f_main_py", type: "file", data: { label: "main.py", language: "Python" } },
  { id: "f_dep_graph", type: "file", data: { label: "dependency_graph.py", language: "Python" } },
  { id: "f_code_parser", type: "file", data: { label: "code_parser.py", language: "Python" } },
  { id: "f_planner", type: "file", data: { label: "planner_agent.py", language: "Python" } },
  { id: "f_architect", type: "file", data: { label: "architect_agent.py", language: "Python" } },
  { id: "f_bug_hunter", type: "file", data: { label: "bug_hunter_agent.py", language: "Python" } },
  { id: "f_gemini", type: "file", data: { label: "gemini_provider.py", language: "Python" } },
  { id: "f_kg3d", type: "file", data: { label: "KnowledgeGraph3D.tsx", language: "TypeScript (React)" } },
  { id: "f_kg2d", type: "file", data: { label: "KnowledgeGraph.tsx", language: "TypeScript (React)" } },
  { id: "f_api_client", type: "file", data: { label: "api-client.ts", language: "TypeScript" } },
  { id: "f_package_json", type: "file", data: { label: "package.json", language: "JSON / Config" } },
  { id: "f_readme", type: "file", data: { label: "README.md", language: "Markdown" } },
];

const FALLBACK_DEMO_EDGES = [
  { id: "e1", source: "root", target: "backend" },
  { id: "e2", source: "root", target: "frontend" },
  { id: "e3", source: "backend", target: "be_agents" },
  { id: "e4", source: "backend", target: "be_api" },
  { id: "e5", source: "backend", target: "be_toolkit" },
  { id: "e6", source: "backend", target: "be_providers" },
  { id: "e7", source: "backend", target: "f_main_py" },
  { id: "e8", source: "be_toolkit", target: "f_dep_graph" },
  { id: "e9", source: "be_toolkit", target: "f_code_parser" },
  { id: "e10", source: "be_agents", target: "f_planner" },
  { id: "e11", source: "be_agents", target: "f_architect" },
  { id: "e12", source: "be_agents", target: "f_bug_hunter" },
  { id: "e13", source: "be_providers", target: "f_gemini" },
  { id: "e14", source: "frontend", target: "f_kg3d" },
  { id: "e15", source: "frontend", target: "f_kg2d" },
  { id: "e16", source: "frontend", target: "f_api_client" },
  { id: "e17", source: "frontend", target: "f_package_json" },
  { id: "e18", source: "root", target: "f_readme" },
  { id: "e19", source: "f_kg3d", target: "f_kg2d" },
  { id: "e20", source: "f_dep_graph", target: "f_code_parser" },
];

const MAX_RENDER_NODES = 500;

export function KnowledgeGraph3D({ graphData, onNodeClick }: KnowledgeGraph3DProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const graphInstanceRef = useRef<any>(null);
  const [hoveredNode, setHoveredNode] = useState<Node3DData | null>(null);
  const [selectedNode, setSelectedNode] = useState<Node3DData | null>(null);
  const [activeFolderDrill, setActiveFolderDrill] = useState<string | null>(null);
  const [isLegendOpen, setIsLegendOpen] = useState(true);
  const [isMounted, setIsMounted] = useState(false);

  // ── Prepare Nodes & Edges with Degree Calculations & Language Colors ────
  const { nodes, links, neighborMap, linkMap, isLargeGraph } = useMemo(() => {
    const rawNodes = graphData?.nodes && graphData.nodes.length > 0 ? graphData.nodes : FALLBACK_DEMO_NODES;
    const rawEdges = graphData?.edges && graphData.edges.length > 0 ? graphData.edges : FALLBACK_DEMO_EDGES;

    const degreeMap = new Map<string, number>();
    const nMap = new Map<string, Set<string>>();
    const lMap = new Set<string>();

    rawEdges.forEach((e: any) => {
      const src = typeof e.source === "object" ? e.source.id : e.source;
      const tgt = typeof e.target === "object" ? e.target.id : e.target;
      degreeMap.set(src, (degreeMap.get(src) || 0) + 1);
      degreeMap.set(tgt, (degreeMap.get(tgt) || 0) + 1);

      if (!nMap.has(src)) nMap.set(src, new Set());
      if (!nMap.has(tgt)) nMap.set(tgt, new Set());
      nMap.get(src)!.add(tgt);
      nMap.get(tgt)!.add(src);

      lMap.add(`${src}___${tgt}`);
      lMap.add(`${tgt}___${src}`);
    });

    const isLarge = rawNodes.length > MAX_RENDER_NODES;

    // Filter nodes if large repo exceeds render cap (Fix 3)
    let effectiveRawNodes = rawNodes;
    if (isLarge) {
      const essentialNodes = rawNodes.filter((n: any) => {
        const type = n.type || "file";
        const langKey = resolveLanguageKey(n);
        return langKey === "root" || type === "folder" || n.id === "__repo_root__" || n.id === "root";
      });
      const essentialIds = new Set(essentialNodes.map((n: any) => n.id));

      let additionalFiles: any[] = [];
      if (activeFolderDrill) {
        additionalFiles = rawNodes.filter((n: any) => {
          if (essentialIds.has(n.id)) return false;
          const idStr = String(n.id);
          const labelStr = String(n.data?.label || n.id);
          return idStr.startsWith(`${activeFolderDrill}/`) || labelStr.startsWith(`${activeFolderDrill}/`);
        });
      } else {
        const remainingBudget = Math.max(0, MAX_RENDER_NODES - essentialNodes.length);
        const nonEssentialFiles = rawNodes.filter((n: any) => !essentialIds.has(n.id));
        nonEssentialFiles.sort((a: any, b: any) => {
          const degA = degreeMap.get(a.id) || 0;
          const degB = degreeMap.get(b.id) || 0;
          return degB - degA;
        });
        additionalFiles = nonEssentialFiles.slice(0, remainingBudget);
      }

      effectiveRawNodes = [...essentialNodes, ...additionalFiles];
    }

    const parsedNodes: Node3DData[] = effectiveRawNodes.map((n: any) => {
      const label = n.data?.label || n.id;
      const parts = label.split("/");
      const shortLabel = parts[parts.length - 1] || label;
      const langKey = resolveLanguageKey(n);
      const palette = LANGUAGE_PALETTE[langKey] || LANGUAGE_PALETTE.other;
      const degree = degreeMap.get(n.id) || 0;
      const isRoot = langKey === "root";

      // Importance / Volume scale based on degree & hub standing
      const val = isRoot ? 32 : n.type === "folder" ? 16 + degree * 2 : 4 + Math.min(degree * 2.5, 20);

      return {
        id: n.id,
        label,
        shortLabel,
        type: n.type || "file",
        language: palette.label,
        languageKey: langKey,
        color: palette.color,
        val,
        degree,
        isRoot,
      };
    });

    const validIds = new Set(parsedNodes.map((n) => n.id));
    const parsedLinks: Link3DData[] = rawEdges
      .map((e: any) => {
        const src = typeof e.source === "object" ? e.source.id : e.source;
        const tgt = typeof e.target === "object" ? e.target.id : e.target;
        return { id: e.id || `e-${src}-${tgt}`, source: src, target: tgt, animated: !!e.animated };
      })
      .filter((e) => validIds.has(e.source as string) && validIds.has(e.target as string));

    return { nodes: parsedNodes, links: parsedLinks, neighborMap: nMap, linkMap: lMap, isLargeGraph: isLarge };
  }, [graphData, activeFolderDrill]);

  // Keep ref to hoveredNode for dynamic graph accessor updates
  const hoveredNodeRef = useRef<Node3DData | null>(null);
  useEffect(() => {
    hoveredNodeRef.current = hoveredNode;
  }, [hoveredNode]);

  // ── Initialize & Manage 3d-force-graph Instance ──────────────────────────
  useEffect(() => {
    setIsMounted(true);
    let forceGraphInstance: any = null;
    let isSubscribed = true;

    const initGraph = async () => {
      if (!containerRef.current) return;

      // Dynamic import to prevent SSR window issues in Next.js
      const ForceGraph3DModule = ((await import("3d-force-graph")).default || (await import("3d-force-graph"))) as any;
      if (!isSubscribed || !containerRef.current) return;

      containerRef.current.innerHTML = "";

      const graph = ForceGraph3DModule()(containerRef.current)
        .backgroundColor("#121316")
        .width(containerRef.current.clientWidth || 800)
        .height(containerRef.current.clientHeight || 540)
        .graphData({ nodes, links })
        .nodeId("id")
        .nodeLabel((n: any) => `<div style="font-family: monospace; font-size: 11px; padding: 4px 8px; background: rgba(18,19,22,0.9); border: 1px solid rgba(91,130,166,0.4); border-radius: 6px; color: #fff;">
          <strong>${n.label}</strong> <span style="color: ${n.color};">(${n.language})</span><br/>
          <span style="color: #94A3B8; font-size: 10px;">Connections: ${n.degree}</span>
        </div>`)
        .nodeThreeObject((node: any) => {
          const group = new THREE.Group();
          const radius = Math.max(2.2, Math.min(11, Math.sqrt(node.val) * 1.8));

          // Core Sphere Mesh
          const geometry = new THREE.SphereGeometry(radius, 24, 24);
          const material = new THREE.MeshStandardMaterial({
            color: node.color,
            emissive: node.color,
            emissiveIntensity: 0.5,
            roughness: 0.35,
            metalness: 0.15,
          });
          const sphere = new THREE.Mesh(geometry, material);
          group.add(sphere);

          // P1-3D Requirement 5: Soft selective glow ONLY for hub nodes & repo root (not uniform blurred halos)
          if (node.isRoot || node.degree >= 4) {
            const haloGeo = new THREE.SphereGeometry(radius * 1.5, 16, 16);
            const haloMat = new THREE.MeshBasicMaterial({
              color: node.color,
              transparent: true,
              opacity: 0.18,
              depthWrite: false,
            });
            const halo = new THREE.Mesh(haloGeo, haloMat);
            group.add(halo);
          }

          return group;
        })
        // P1-3D Requirement 6: Thin edge lines with subgraph hover tracing
        .linkColor((link: any) => {
          const activeHover = hoveredNodeRef.current;
          if (!activeHover) return "rgba(91, 130, 166, 0.35)";

          const srcId = typeof link.source === "object" ? link.source.id : link.source;
          const tgtId = typeof link.target === "object" ? link.target.id : link.target;
          const isConnected = srcId === activeHover.id || tgtId === activeHover.id;

          return isConnected ? "#D97736" : "rgba(91, 130, 166, 0.08)";
        })
        .linkWidth((link: any) => {
          const activeHover = hoveredNodeRef.current;
          if (!activeHover) return 1.0;

          const srcId = typeof link.source === "object" ? link.source.id : link.source;
          const tgtId = typeof link.target === "object" ? link.target.id : link.target;
          return srcId === activeHover.id || tgtId === activeHover.id ? 2.5 : 0.5;
        })
        .linkOpacity((link: any) => {
          const activeHover = hoveredNodeRef.current;
          if (!activeHover) return 0.4;

          const srcId = typeof link.source === "object" ? link.source.id : link.source;
          const tgtId = typeof link.target === "object" ? link.target.id : link.target;
          return srcId === activeHover.id || tgtId === activeHover.id ? 0.95 : 0.08;
        })
        .onNodeClick((node: any) => {
          if (!node) return;
          setSelectedNode(node);
          useGraphStore.getState().setSelectedNodeId(node.id);
          if (onNodeClick) onNodeClick(node.id);

          // Support drilldown into folder for large graphs
          if (node.type === "folder" && isLargeGraph) {
            setActiveFolderDrill((prev) => (prev === node.id ? null : node.id));
          }

          // Smoothly frame camera on clicked node
          if (graph && typeof node.x === "number") {
            const distance = 80;
            const hyp = Math.hypot(node.x, node.y, node.z) || 1;
            const distRatio = 1 + distance / hyp;
            graph.cameraPosition(
              { x: node.x * distRatio, y: node.y * distRatio, z: node.z * distRatio },
              node,
              1000
            );
          }
        })
        .onBackgroundClick(() => {
          setSelectedNode(null);
          useGraphStore.getState().setSelectedNodeId(null);
        })
        .onNodeHover((node: any) => {
          setHoveredNode(node || null);
          if (graph) {
            graph.linkColor(graph.linkColor());
            graph.linkWidth(graph.linkWidth());
            graph.linkOpacity(graph.linkOpacity());
          }
        });

      // Configure d3-force-3d forces for organic hub-and-spoke separation
      graph.d3Force("charge")?.strength(-120);
      graph.d3Force("link")?.distance(35);

      // P1-3D Requirement 4: Camera idle auto-rotate & touch controls
      const controls = graph.controls();
      if (controls) {
        controls.autoRotate = true;
        controls.autoRotateSpeed = 0.5;
        controls.enableZoom = true;
        controls.enablePan = true;
        controls.dampingFactor = 0.08;
      }

      graphInstanceRef.current = graph;
      forceGraphInstance = graph;
    };

    initGraph();

    // Resize Observer for responsive graph canvas
    const handleResize = () => {
      if (containerRef.current && graphInstanceRef.current) {
        graphInstanceRef.current.width(containerRef.current.clientWidth);
        graphInstanceRef.current.height(containerRef.current.clientHeight);
      }
    };
    window.addEventListener("resize", handleResize);

    return () => {
      isSubscribed = false;
      window.removeEventListener("resize", handleResize);
      if (forceGraphInstance && typeof forceGraphInstance._destructor === "function") {
        forceGraphInstance._destructor();
      }
    };
  }, [nodes, links, onNodeClick]);

  const handleResetCamera = useCallback(() => {
    if (graphInstanceRef.current) {
      graphInstanceRef.current.cameraPosition({ x: 0, y: 0, z: 240 }, { x: 0, y: 0, z: 0 }, 800);
    }
  }, []);

  return (
    <div className="relative w-full h-full min-h-[460px] sm:min-h-[540px] bg-[#121316] rounded-b-xl overflow-hidden font-sans select-none">
      {/* 3D Force Graph WebGL Container */}
      <div ref={containerRef} className="w-full h-full min-h-[460px] sm:min-h-[540px]" />

      {/* Large Repository Top-Level Degradation Notice (Fix 3) */}
      {isLargeGraph && (
        <div className="absolute top-3 left-3 flex flex-wrap items-center gap-2 p-2 px-3 rounded-lg bg-graphite-panel/95 border border-[#5B82A6]/40 backdrop-blur-md shadow-xl z-10 pointer-events-auto text-xs font-mono max-w-[85%] sm:max-w-md">
          <FolderOpen className="w-3.5 h-3.5 text-[#5B82A6] shrink-0" />
          <span className="text-graphite-muted leading-tight">
            {activeFolderDrill ? (
              <>
                Drilling into: <strong className="text-white">{activeFolderDrill}</strong>
              </>
            ) : (
              "Showing top-level structure — this repository is large, drill into a folder to see files"
            )}
          </span>
          {activeFolderDrill && (
            <button
              onClick={() => setActiveFolderDrill(null)}
              className="ml-auto px-2 py-0.5 rounded bg-[#5B82A6]/20 hover:bg-[#5B82A6]/30 text-[#5B82A6] transition text-[10px] font-semibold"
            >
              Reset View
            </button>
          )}
        </div>
      )}

      {/* Top-Right HUD Camera & View Controls */}
      <div className="absolute top-3 right-3 flex items-center gap-1.5 p-1.5 rounded-lg bg-graphite-panel/90 border border-graphite-border backdrop-blur-md shadow-xl z-10 pointer-events-auto">
        <button
          onClick={() => {
            if (graphInstanceRef.current) {
              const currentPos = graphInstanceRef.current.cameraPosition();
              graphInstanceRef.current.cameraPosition(
                { x: currentPos.x * 0.8, y: currentPos.y * 0.8, z: currentPos.z * 0.8 },
                null,
                300
              );
            }
          }}
          className="p-2 sm:p-1.5 rounded hover:bg-[#5B82A6]/20 text-[#5B82A6] transition min-h-[44px] sm:min-h-[32px] flex items-center justify-center"
          title="Zoom In"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <button
          onClick={() => {
            if (graphInstanceRef.current) {
              const currentPos = graphInstanceRef.current.cameraPosition();
              graphInstanceRef.current.cameraPosition(
                { x: currentPos.x * 1.25, y: currentPos.y * 1.25, z: currentPos.z * 1.25 },
                null,
                300
              );
            }
          }}
          className="p-2 sm:p-1.5 rounded hover:bg-[#5B82A6]/20 text-[#5B82A6] transition min-h-[44px] sm:min-h-[32px] flex items-center justify-center"
          title="Zoom Out"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <button
          onClick={handleResetCamera}
          className="p-2 sm:p-1.5 rounded hover:bg-copper/20 text-white transition min-h-[44px] sm:min-h-[32px] flex items-center justify-center"
          title="Reset Camera View"
        >
          <RefreshCw className="w-4 h-4 text-graphite-muted hover:rotate-180 transition-transform duration-300" />
        </button>
      </div>

      {/* Selected / Hover HUD Inspector Card (Fixed Left Corner) */}
      {(selectedNode || hoveredNode) && (
        <div
          className={`absolute bottom-3 left-3 p-3.5 rounded-xl border backdrop-blur-md shadow-2xl text-xs font-mono max-w-xs sm:max-w-md animate-in fade-in duration-200 z-20 ${
            selectedNode
              ? "bg-card/95 border-copper/60 text-foreground pointer-events-auto ring-1 ring-copper/40"
              : "bg-card/90 border-border text-foreground pointer-events-none"
          }`}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-2.5 overflow-hidden">
              <div
                className="w-4 h-4 rounded-full shrink-0 shadow-lg mt-0.5"
                style={{
                  backgroundColor: (selectedNode || hoveredNode)!.color,
                  boxShadow: `0 0 10px ${(selectedNode || hoveredNode)!.color}`,
                }}
              />
              <div className="overflow-hidden">
                <div className="font-bold text-foreground flex items-center gap-2 font-display truncate">
                  <span className="truncate">{(selectedNode || hoveredNode)!.label}</span>
                  <span
                    className="text-[10px] uppercase px-1.5 py-0.5 rounded border shrink-0 font-mono font-semibold"
                    style={{
                      backgroundColor: `${(selectedNode || hoveredNode)!.color}20`,
                      color: (selectedNode || hoveredNode)!.color,
                      borderColor: `${(selectedNode || hoveredNode)!.color}40`,
                    }}
                  >
                    {(selectedNode || hoveredNode)!.language}
                  </span>
                </div>
                <div className="text-[11px] text-muted-foreground mt-1 font-mono flex flex-wrap items-center gap-2">
                  <span className="capitalize">Type: {(selectedNode || hoveredNode)!.type}</span>
                  <span>•</span>
                  <span className="text-foreground font-semibold">{(selectedNode || hoveredNode)!.degree} Connections</span>
                  {selectedNode && (
                    <>
                      <span>•</span>
                      <span className="text-copper font-semibold">Selected</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {selectedNode && (
              <button
                onClick={() => {
                  setSelectedNode(null);
                  useGraphStore.getState().setSelectedNodeId(null);
                }}
                className="p-1 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition cursor-pointer shrink-0"
                title="Deselect Node"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Part 2: Collapsible Language Legend Overlay (Bottom-Right Corner) */}
      <div className="absolute bottom-3 right-3 z-10 pointer-events-auto">
        <div className="bg-graphite-panel/95 border border-graphite-border rounded-lg backdrop-blur-md shadow-2xl overflow-hidden font-mono text-[11px] transition-all duration-300">
          {/* Legend Header */}
          <button
            onClick={() => setIsLegendOpen(!isLegendOpen)}
            className="w-full px-3 py-2 bg-graphite-canvas/60 border-b border-graphite-border/60 flex items-center justify-between gap-3 text-graphite-muted hover:text-white transition min-h-[44px] sm:min-h-[36px]"
          >
            <span className="flex items-center gap-1.5 font-semibold text-white">
              <Palette className="w-3.5 h-3.5 text-copper" /> Language Legend
            </span>
            {isLegendOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
          </button>

          {/* Legend Body */}
          {isLegendOpen && (
            <div className="p-2.5 grid grid-cols-2 gap-x-4 gap-y-1.5 max-w-[280px]">
              {Object.entries(LANGUAGE_PALETTE).map(([key, item]) => (
                <div key={key} className="flex items-center gap-2">
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: item.color, boxShadow: `0 0 6px ${item.color}80` }}
                  />
                  <span className="text-graphite-muted truncate text-[10px]">{item.label}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Mobile Orbit Gesture Guidance */}
      <div className="absolute top-3 left-3 p-2 rounded-md bg-graphite-panel/80 border border-graphite-border/60 backdrop-blur-md text-[10px] text-graphite-muted font-mono hidden sm:flex items-center gap-2 pointer-events-none">
        <Move className="w-3 h-3 text-[#5B82A6]" />
        <span>Drag to orbit • Scroll/pinch to zoom • Connected nodes cluster</span>
      </div>
    </div>
  );
}

export default KnowledgeGraph3D;
