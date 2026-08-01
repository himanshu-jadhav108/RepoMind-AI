"use client";

import React, { useMemo, useState, useRef, Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Stars, Line, Html } from "@react-three/drei";
import { Folder, FileCode, Cpu, Box, Sparkles, RefreshCw, ZoomIn, ZoomOut, FolderOpen, Layers } from "lucide-react";
import { useGraphStore } from "./store/useGraphStore";

interface KnowledgeGraph3DProps {
  graphData?: { nodes: any[]; edges: any[] } | null;
  onNodeClick?: (nodeId: string) => void;
}

interface Node3D {
  id: string;
  label: string;
  shortLabel: string;
  type: string;
  parentFolder?: string;
  x: number;
  y: number;
  z: number;
  radius: number;
  color: string;
}

interface Edge3D {
  id: string;
  source: string;
  target: string;
  label?: string;
}

// ---------------------------------------------------------------------------
// R3F WebGL Scene Component (Rendered inside Canvas context)
// ---------------------------------------------------------------------------
function WebGLGraphScene({
  nodes,
  edges,
  selectedNodeId,
  hoveredNode,
  onNodeSelect,
  setHoveredNode,
}: {
  nodes: Node3D[];
  edges: Edge3D[];
  selectedNodeId: string | null;
  hoveredNode: Node3D | null;
  onNodeSelect: (id: string) => void;
  setHoveredNode: (node: Node3D | null) => void;
}) {
  const nodeMap = useMemo(() => {
    const map = new Map<string, Node3D>();
    nodes.forEach((n) => map.set(n.id, n));
    return map;
  }, [nodes]);

  return (
    <>
      <ambientLight intensity={0.7} />
      <pointLight position={[120, 120, 120]} intensity={1.8} color="#818cf8" />
      <pointLight position={[-120, -120, -120]} intensity={0.9} color="#a855f7" />

      {/* Starfield Background */}
      <Stars radius={250} depth={90} count={1800} factor={4} saturation={0} fade speed={1.5} />

      {/* 3D Edge Lines */}
      {edges.map((edge, idx) => {
        const src = nodeMap.get(edge.source);
        const tgt = nodeMap.get(edge.target);
        if (!src || !tgt) return null;

        const isHighlighted =
          selectedNodeId === edge.source ||
          selectedNodeId === edge.target ||
          (hoveredNode && (hoveredNode.id === edge.source || hoveredNode.id === edge.target));

        const lineColor = isHighlighted ? "#a855f7" : "#475569";
        const lineWidth = isHighlighted ? 2.5 : 1;

        return (
          <Line
            key={`edge-${edge.id || idx}`}
            points={[
              [src.x, src.y, src.z],
              [tgt.x, tgt.y, tgt.z],
            ]}
            color={lineColor}
            lineWidth={lineWidth}
            transparent
            opacity={isHighlighted ? 0.95 : 0.4}
          />
        );
      })}

      {/* 3D Node Spheres */}
      {nodes.map((node) => {
        const isSelected = selectedNodeId === node.id;
        const isHovered = hoveredNode?.id === node.id;
        const sphereRadius = isSelected ? node.radius * 0.45 : isHovered ? node.radius * 0.4 : node.radius * 0.32;

        return (
          <group
            key={node.id}
            position={[node.x, node.y, node.z]}
            onClick={(e) => {
              e.stopPropagation();
              onNodeSelect(node.id);
            }}
            onPointerOver={(e) => {
              e.stopPropagation();
              setHoveredNode(node);
            }}
            onPointerOut={() => setHoveredNode(null)}
          >
            <mesh>
              <sphereGeometry args={[sphereRadius, 32, 32]} />
              <meshStandardMaterial
                color={node.color}
                emissive={node.color}
                emissiveIntensity={isSelected ? 1.4 : isHovered ? 0.9 : 0.45}
                roughness={0.2}
                metalness={0.3}
              />
            </mesh>

            {/* Label Popover on Hover or Selection */}
            {(isSelected || isHovered) && (
              <Html distanceFactor={160} zIndexRange={[100, 0]}>
                <div className="px-2.5 py-1 rounded-lg bg-slate-900/90 border border-indigo-500/50 text-indigo-200 text-xs font-mono font-bold whitespace-nowrap shadow-xl pointer-events-none backdrop-blur-md flex items-center gap-1.5">
                  <Sparkles className="w-3 h-3 text-indigo-400" />
                  <span>{node.shortLabel}</span>
                </div>
              </Html>
            )}
          </group>
        );
      })}

      {/* OrbitControls for Camera Interaction */}
      <OrbitControls enableDamping dampingFactor={0.05} minDistance={40} maxDistance={750} />
    </>
  );
}

// ---------------------------------------------------------------------------
// Main KnowledgeGraph3D Container Component
// ---------------------------------------------------------------------------
export default function KnowledgeGraph3D({ graphData, onNodeClick }: KnowledgeGraph3DProps) {
  const selectedNodeId = useGraphStore((s) => s.selectedNodeId);
  const setSelectedNodeId = useGraphStore((s) => s.setSelectedNodeId);

  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set(["root_folder", "backend/app"]));
  const [hoveredNode, setHoveredNode] = useState<Node3D | null>(null);

  // Compute 3D Sphere Coordinates for Nodes
  const nodes3D: Node3D[] = useMemo(() => {
    const rawNodes = graphData?.nodes || [];

    if (rawNodes.length === 0) {
      // Demo 3D Node fallback
      return [
        { id: "root", label: "backend/app/main.py", shortLabel: "main.py", type: "file", x: 0, y: 0, z: 0, radius: 16, color: "#a855f7" },
        { id: "backend/services", label: "services/", shortLabel: "services/", type: "folder", x: -160, y: -80, z: 90, radius: 13, color: "#38bdf8" },
        { id: "services/analysis.py", label: "analysis_service.py", shortLabel: "analysis_service.py", type: "file", parentFolder: "backend/services", x: -240, y: -130, z: 140, radius: 10, color: "#818cf8" },
        { id: "services/repo.py", label: "repo_ingestion.py", shortLabel: "repo_ingestion.py", type: "file", parentFolder: "backend/services", x: -120, y: -140, z: 40, radius: 10, color: "#818cf8" },
        { id: "backend/agents", label: "agents/", shortLabel: "agents/", type: "folder", x: 170, y: 90, z: -100, radius: 13, color: "#38bdf8" },
        { id: "agents/architect.py", label: "architect_agent.py", shortLabel: "architect_agent.py", type: "file", parentFolder: "backend/agents", x: 250, y: 140, z: -160, radius: 10, color: "#fbbf24" },
        { id: "agents/reviewer.py", label: "reviewer_agent.py", shortLabel: "reviewer_agent.py", type: "file", parentFolder: "backend/agents", x: 130, y: 150, z: -50, radius: 10, color: "#34d399" },
      ];
    }

    const cappedNodes = rawNodes.slice(0, 50);
    const count = cappedNodes.length;

    return cappedNodes.map((n, idx) => {
      const type = n.type || "file";
      const label = n.data?.label || n.id;
      const parts = label.split("/");
      const shortLabel = parts[parts.length - 1] || label;
      const isRoot = idx === 0 || label.includes("main.py") || label.includes("index.ts");

      let color = "#818cf8";
      let radius = 9;

      if (isRoot) {
        color = "#a855f7"; // Core entry point
        radius = 16;
      } else if (type === "folder") {
        color = "#38bdf8"; // Folder
        radius = 13;
      } else if (label.includes("agent")) {
        color = "#fbbf24"; // Agent yellow
      } else if (label.includes("service") || label.includes("repo")) {
        color = "#34d399"; // Service green
      }

      // Compute spherical distribution coordinates
      const phi = Math.acos(-1 + (2 * idx) / count);
      const theta = Math.sqrt(count * Math.PI) * phi;
      const baseDist = isRoot ? 0 : 180 + (idx % 3) * 60;

      const x = isRoot ? 0 : baseDist * Math.cos(theta) * Math.sin(phi);
      const y = isRoot ? 0 : baseDist * Math.sin(theta) * Math.sin(phi);
      const z = isRoot ? 0 : baseDist * Math.cos(phi);

      return {
        id: n.id,
        label,
        shortLabel,
        type,
        parentFolder: n.data?.parentFolder,
        x,
        y,
        z,
        radius,
        color,
      };
    });
  }, [graphData?.nodes]);

  const edges3D: Edge3D[] = useMemo(() => {
    const rawEdges = graphData?.edges || [];
    if (rawEdges.length === 0) {
      return [
        { id: "e1", source: "root", target: "backend/services" },
        { id: "e2", source: "backend/services", target: "services/analysis.py" },
        { id: "e3", source: "backend/services", target: "services/repo.py" },
        { id: "e4", source: "root", target: "backend/agents" },
        { id: "e5", source: "backend/agents", target: "agents/architect.py" },
        { id: "e6", source: "backend/agents", target: "agents/reviewer.py" },
      ];
    }
    return rawEdges.slice(0, 80).map((e, idx) => ({
      id: e.id || `e3d-${idx}`,
      source: e.source,
      target: e.target,
      label: e.label,
    }));
  }, [graphData?.edges]);

  const handleNodeSelect = (id: string) => {
    setSelectedNodeId(id);
    onNodeClick?.(id);
  };

  return (
    <div className="relative w-full h-[650px] min-h-[500px] rounded-xl bg-slate-950 border border-slate-800 overflow-hidden font-mono select-none">
      {/* 3D WebGL Canvas Scene */}
      <Canvas
        camera={{ position: [0, 0, 420], fov: 60 }}
        style={{ width: "100%", height: "100%", position: "absolute", top: 0, left: 0 }}
        gl={{ antialias: true, alpha: true }}
      >
        <Suspense fallback={null}>
          <WebGLGraphScene
            nodes={nodes3D}
            edges={edges3D}
            selectedNodeId={selectedNodeId}
            hoveredNode={hoveredNode}
            onNodeSelect={handleNodeSelect}
            setHoveredNode={setHoveredNode}
          />
        </Suspense>
      </Canvas>

      {/* Header Overlay Toolbar */}
      <div className="absolute top-4 left-4 z-10 flex items-center gap-3">
        <div className="px-3 py-1.5 rounded-lg bg-slate-900/90 border border-indigo-500/40 text-xs font-semibold text-indigo-300 backdrop-blur-md flex items-center gap-2 shadow-lg">
          <Layers className="w-4 h-4 text-indigo-400 animate-pulse" />
          <span>WebGL 3D Orbit View</span>
        </div>

        <div className="px-3 py-1.5 rounded-lg bg-slate-900/90 border border-slate-800 text-xs text-slate-400 backdrop-blur-md shadow-lg">
          {nodes3D.length} Nodes • {edges3D.length} Edges
        </div>
      </div>

      {/* Footer Instructions Badge */}
      <div className="absolute bottom-4 right-4 z-10 text-right">
        <div className="px-3 py-1.5 rounded-lg bg-slate-900/90 border border-slate-800 text-[11px] text-slate-400 backdrop-blur-md shadow-lg flex items-center gap-2">
          <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
          <span>Left-Click Drag to Rotate • Scroll to Zoom • Click Node to Inspect</span>
        </div>
      </div>
    </div>
  );
}
