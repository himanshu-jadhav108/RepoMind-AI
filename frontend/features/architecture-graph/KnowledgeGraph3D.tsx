"use client";

import React, { useMemo, useRef, useState, useCallback } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, Stars, Line } from "@react-three/drei";
import * as THREE from "three";
import { Move, ZoomIn, ZoomOut, RefreshCw, FolderOpen, Sparkles } from "lucide-react";

// P1-3D FIX: this view previously hand-projected sphere coordinates onto a flat
// <canvas> 2D context with manual sin/cos trig — which is why it looked flat and
// slightly jittery no matter how the layout was tuned. This rebuild uses real
// react-three-fiber (WebGL) so nodes get true depth, real perspective, and a
// proper orbit camera, while keeping the same visual language (indigo/cyan/amber
// glow palette, glass label pills, hover HUD) and the same
// { graphData, onNodeClick } contract so nothing else needs to change.

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
  position: [number, number, number];
  radius: number;
  color: string;
}

interface Edge3D {
  id: string;
  source: string;
  target: string;
  animated?: boolean;
}

type LabelPos = { x: number; y: number; visible: boolean; scale: number };

const DEMO_NODES: Node3D[] = [
  { id: "root", label: "backend/app/main.py", shortLabel: "main.py", type: "file", position: [0, 0, 0], radius: 1.1, color: "#a855f7" },
  { id: "backend/services", label: "services/", shortLabel: "services/", type: "folder", position: [-3.2, -1.3, 1.8], radius: 0.9, color: "#38bdf8" },
  { id: "services/analysis.py", label: "analysis_service.py", shortLabel: "analysis_service.py", type: "file", parentFolder: "backend/services", position: [-4.6, -2.2, 2.6], radius: 0.65, color: "#818cf8" },
  { id: "services/repo.py", label: "repo_ingestion.py", shortLabel: "repo_ingestion.py", type: "file", parentFolder: "backend/services", position: [-2.4, -2.4, 0.9], radius: 0.65, color: "#818cf8" },
  { id: "backend/agents", label: "agents/", shortLabel: "agents/", type: "folder", position: [3.4, 1.6, -1.9], radius: 0.9, color: "#38bdf8" },
  { id: "agents/architect.py", label: "architect_agent.py", shortLabel: "architect_agent.py", type: "file", parentFolder: "backend/agents", position: [4.8, 2.5, -2.9], radius: 0.65, color: "#fbbf24" },
  { id: "agents/reviewer.py", label: "reviewer_agent.py", shortLabel: "reviewer_agent.py", type: "file", parentFolder: "backend/agents", position: [2.5, 2.8, -1.0], radius: 0.65, color: "#34d399" },
];

const DEMO_EDGES: Edge3D[] = [
  { id: "e1", source: "root", target: "backend/services", animated: true },
  { id: "e2", source: "root", target: "backend/agents", animated: true },
  { id: "e3", source: "backend/services", target: "services/analysis.py" },
  { id: "e4", source: "backend/services", target: "services/repo.py" },
  { id: "e5", source: "backend/agents", target: "agents/architect.py" },
  { id: "e6", source: "backend/agents", target: "agents/reviewer.py" },
];

function buildNodes(graphData?: { nodes: any[]; edges: any[] } | null): Node3D[] {
  const rawNodes = graphData?.nodes || [];
  if (rawNodes.length === 0) return DEMO_NODES;

  const capped = rawNodes.slice(0, 60);
  const count = capped.length;

  return capped.map((n, idx) => {
    const type = n.type || "file";
    const label = n.data?.label || n.id;
    const parts = label.split("/");
    const shortLabel = parts[parts.length - 1] || label;
    const isRoot = idx === 0 || label.includes("main.py") || label.includes("index.ts");

    let color = "#818cf8";
    let radius = 0.55;
    if (isRoot) {
      color = "#a855f7";
      radius = 1.1;
    } else if (type === "folder") {
      color = "#38bdf8";
      radius = 0.9;
    } else if (type === "class") {
      color = "#fbbf24";
      radius = 0.5;
    } else if (type === "function") {
      color = "#34d399";
      radius = 0.45;
    }

    if (isRoot) {
      return { id: n.id, label, shortLabel, type, position: [0, 0, 0] as [number, number, number], radius, color };
    }

    // Fibonacci sphere distribution for even, non-overlapping placement — same
    // idea as the old canvas version's spherical projection, but now feeding real
    // 3D world-space coordinates instead of manually-projected screen coordinates.
    const goldenAngle = Math.PI * (3 - Math.sqrt(5));
    const y = 1 - (idx / Math.max(1, count - 1)) * 2;
    const radiusAtY = Math.sqrt(Math.max(0, 1 - y * y));
    const theta = goldenAngle * idx;
    const orbit = 3.2 + (idx % 3) * 1.6;

    const x = Math.cos(theta) * radiusAtY * orbit;
    const z = Math.sin(theta) * radiusAtY * orbit;
    const yPos = y * orbit * 0.6;

    return {
      id: n.id,
      label,
      shortLabel,
      type,
      parentFolder: n.parentFolder,
      position: [x, yPos, z] as [number, number, number],
      radius,
      color,
    };
  });
}

function buildEdges(graphData: { nodes: any[]; edges: any[] } | null | undefined, nodes: Node3D[]): Edge3D[] {
  const rawEdges = graphData?.edges || [];
  if (rawEdges.length === 0) return DEMO_EDGES;
  const validIds = new Set(nodes.map((n) => n.id));
  return rawEdges
    .filter((e: any) => validIds.has(e.source) && validIds.has(e.target))
    .slice(0, 90)
    .map((e: any) => ({ id: e.id, source: e.source, target: e.target, animated: !!e.animated }));
}

// A glowing orb: a solid sphere plus a soft additive-ish transparent halo sphere,
// which fakes bloom cheaply (no postprocessing pass needed) while staying real
// WebGL geometry with proper depth — unlike the old canvas radial-gradient trick.
function NodeOrb({
  node,
  isHovered,
  onHover,
  onClick,
}: {
  node: Node3D;
  isHovered: boolean;
  onHover: (n: Node3D | null) => void;
  onClick: (n: Node3D) => void;
}) {
  const scale = isHovered ? 1.35 : 1;
  return (
    <group position={node.position}>
      <mesh
        onPointerOver={(e) => {
          e.stopPropagation();
          onHover(node);
        }}
        onPointerOut={() => onHover(null)}
        onClick={(e) => {
          e.stopPropagation();
          onClick(node);
        }}
      >
        <sphereGeometry args={[node.radius * scale, 24, 24]} />
        <meshStandardMaterial
          color={isHovered ? "#ffffff" : node.color}
          emissive={node.color}
          emissiveIntensity={isHovered ? 1.4 : 0.65}
          roughness={0.35}
          metalness={0.1}
        />
      </mesh>
      {/* Halo glow — transparent, larger, no depth write so it never occludes other nodes */}
      <mesh scale={2.2 * scale}>
        <sphereGeometry args={[node.radius, 16, 16]} />
        <meshBasicMaterial color={node.color} transparent opacity={isHovered ? 0.22 : 0.12} depthWrite={false} />
      </mesh>
    </group>
  );
}

function EdgeLine({
  from,
  to,
  animated,
  highlighted,
}: {
  from: [number, number, number];
  to: [number, number, number];
  animated?: boolean;
  highlighted?: boolean;
}) {
  const particleRef = useRef<THREE.Mesh>(null);
  const t = useRef(Math.random());

  useFrame((_, delta) => {
    if (!particleRef.current) return;
    t.current = (t.current + delta * 0.35) % 1;
    particleRef.current.position.lerpVectors(new THREE.Vector3(...from), new THREE.Vector3(...to), t.current);
  });

  return (
    <>
      <Line
        points={[from, to]}
        color={highlighted ? "#c084fc" : animated ? "#818cf8" : "#475569"}
        transparent
        opacity={highlighted ? 0.9 : animated ? 0.45 : 0.22}
        lineWidth={highlighted ? 2 : 1}
      />
      {(animated || highlighted) && (
        <mesh ref={particleRef}>
          <sphereGeometry args={[highlighted ? 0.07 : 0.05, 8, 8]} />
          <meshBasicMaterial color={highlighted ? "#f43f5e" : "#818cf8"} />
        </mesh>
      )}
    </>
  );
}

// Lives INSIDE the Canvas. Each frame it projects node world positions to screen
// space and reports them up via onUpdate — it renders no DOM/mesh itself, it's a
// pure per-frame data bridge (Canvas can't contain plain DOM elements directly).
function LabelPositionTracker({
  nodes,
  onUpdate,
}: {
  nodes: Node3D[];
  onUpdate: (positions: Map<string, LabelPos>) => void;
}) {
  const { camera, size } = useThree();

  useFrame(() => {
    const vec = new THREE.Vector3();
    const next = new Map<string, LabelPos>();
    nodes.forEach((n) => {
      vec.set(...n.position);
      vec.project(camera);
      const x = (vec.x * 0.5 + 0.5) * size.width;
      const y = (-vec.y * 0.5 + 0.5) * size.height;
      const scale = Math.max(0.5, Math.min(1.3, 1.4 - vec.z));
      next.set(n.id, { x, y, visible: vec.z < 1, scale });
    });
    onUpdate(next);
  });

  return null;
}

// Lives OUTSIDE the Canvas as a plain absolutely-positioned overlay. Reads the
// positions computed by LabelPositionTracker and renders real DOM label pills —
// cheaper and crisper than drei's <Html> reconciler for 50+ simultaneous labels,
// and avoids each label fighting WebGL depth-sorting.
function LabelOverlay({
  nodes,
  hoveredId,
  positions,
}: {
  nodes: Node3D[];
  hoveredId: string | null;
  positions: Map<string, LabelPos>;
}) {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {nodes
        .filter((n) => n.type === "folder" || n.id === "root" || hoveredId === n.id)
        .map((n) => {
          const pos = positions.get(n.id);
          if (!pos || !pos.visible) return null;
          const isHovered = hoveredId === n.id;
          return (
            <div
              key={n.id}
              className="absolute font-mono transition-opacity"
              style={{
                left: pos.x,
                top: pos.y + 14 * pos.scale,
                transform: `translate(-50%, 0) scale(${pos.scale})`,
                transformOrigin: "top center",
              }}
            >
              <div
                className={`px-2 py-0.5 rounded-md border text-[11px] whitespace-nowrap ${
                  isHovered
                    ? "bg-indigo-950/95 border-purple-400/80 text-white"
                    : "bg-slate-900/85 border-indigo-500/35 text-slate-100/95"
                }`}
              >
                {isHovered ? n.label : n.shortLabel}
              </div>
            </div>
          );
        })}
    </div>
  );
}

function Scene({
  nodes,
  edges,
  hoveredNode,
  setHoveredNode,
  onNodeClick,
  orbitControlsRef,
}: {
  nodes: Node3D[];
  edges: Edge3D[];
  hoveredNode: Node3D | null;
  setHoveredNode: (n: Node3D | null) => void;
  onNodeClick: (n: Node3D) => void;
  orbitControlsRef: React.MutableRefObject<any>;
}) {
  const nodeMap = useMemo(() => new Map(nodes.map((n) => [n.id, n])), [nodes]);

  return (
    <>
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} intensity={1.2} color="#a855f7" />
      <pointLight position={[-10, -10, -10]} intensity={0.6} color="#38bdf8" />

      <Stars radius={80} depth={50} count={1200} factor={2.2} fade speed={0.4} />

      {edges.map((edge) => {
        const src = nodeMap.get(edge.source);
        const tgt = nodeMap.get(edge.target);
        if (!src || !tgt) return null;
        const highlighted = !!hoveredNode && (hoveredNode.id === src.id || hoveredNode.id === tgt.id);
        return (
          <EdgeLine key={edge.id} from={src.position} to={tgt.position} animated={edge.animated} highlighted={highlighted} />
        );
      })}

      {nodes.map((node) => (
        <NodeOrb key={node.id} node={node} isHovered={hoveredNode?.id === node.id} onHover={setHoveredNode} onClick={onNodeClick} />
      ))}

      <OrbitControls
        ref={orbitControlsRef}
        enablePan={false}
        minDistance={4}
        maxDistance={26}
        autoRotate={!hoveredNode}
        autoRotateSpeed={0.35}
        dampingFactor={0.08}
      />
    </>
  );
}

export function KnowledgeGraph3D({ graphData, onNodeClick }: KnowledgeGraph3DProps) {
  const [hoveredNode, setHoveredNode] = useState<Node3D | null>(null);
  const [labelPositions, setLabelPositions] = useState<Map<string, LabelPos>>(new Map());
  const orbitControlsRef = useRef<any>(null);

  const nodes = useMemo(() => buildNodes(graphData), [graphData]);
  const edges = useMemo(() => buildEdges(graphData, nodes), [graphData, nodes]);

  const handleNodeClick = useCallback(
    (node: Node3D) => {
      onNodeClick?.(node.id);
    },
    [onNodeClick]
  );

  return (
    <div className="relative w-full h-full min-h-[440px] bg-slate-950 rounded-b-xl overflow-hidden">
      <Canvas
        camera={{ position: [0, 2.5, 9], fov: 50 }}
        dpr={[1, 1.5]}
        gl={{ antialias: true, alpha: false }}
        onCreated={({ gl }) => gl.setClearColor("#030712")}
      >
        <Scene
          nodes={nodes}
          edges={edges}
          hoveredNode={hoveredNode}
          setHoveredNode={setHoveredNode}
          onNodeClick={handleNodeClick}
          orbitControlsRef={orbitControlsRef}
        />
        <LabelPositionTracker nodes={nodes} onUpdate={setLabelPositions} />
      </Canvas>

      <LabelOverlay nodes={nodes} hoveredId={hoveredNode?.id ?? null} positions={labelPositions} />

      {/* Controls */}
      <div className="absolute top-3 right-3 flex items-center gap-1.5 p-1.5 rounded-lg bg-slate-900/80 border border-slate-800 backdrop-blur-md shadow-lg pointer-events-auto">
        <span className="p-1.5 text-slate-500" title="Scroll to zoom in">
          <ZoomIn className="w-4 h-4 text-indigo-400" />
        </span>
        <span className="p-1.5 text-slate-500" title="Scroll to zoom out">
          <ZoomOut className="w-4 h-4 text-indigo-400" />
        </span>
        <button
          onClick={() => orbitControlsRef.current?.reset()}
          className="p-1.5 rounded hover:bg-indigo-600/30 text-slate-200 transition"
          title="Reset 3D Camera"
        >
          <RefreshCw className="w-4 h-4 text-slate-400 hover:rotate-180 transition-transform duration-300" />
        </button>
      </div>

      {/* Hover HUD */}
      {hoveredNode && (
        <div className="absolute bottom-3 left-3 p-3 rounded-lg bg-slate-900/90 border border-indigo-500/30 backdrop-blur-md shadow-2xl text-xs text-slate-200 font-mono flex items-center gap-2.5 max-w-md animate-in fade-in duration-200 pointer-events-none">
          <Sparkles className="w-4 h-4 text-indigo-400 shrink-0" />
          <div>
            <div className="font-bold text-white flex items-center gap-1.5">
              <span>{hoveredNode.label}</span>
              <span className="text-[10px] uppercase px-1.5 py-0.5 rounded bg-sky-500/20 text-sky-300 border border-sky-500/30">
                {hoveredNode.type}
              </span>
            </div>
            {hoveredNode.type === "folder" ? (
              <p className="text-[11px] text-sky-300 mt-1 flex items-center gap-1 font-semibold">
                <FolderOpen className="w-3.5 h-3.5 text-sky-400" />
                <span>Click folder to toggle expansion</span>
              </p>
            ) : (
              <p className="text-[11px] text-slate-400 mt-0.5">Click to inspect file content in code viewer</p>
            )}
          </div>
        </div>
      )}

      {/* Drag & Zoom Instructions */}
      <div className="absolute bottom-3 right-3 p-2 rounded-md bg-slate-900/80 border border-slate-800 backdrop-blur-md text-[11px] text-slate-400 font-mono flex items-center gap-2 pointer-events-none">
        <Move className="w-3.5 h-3.5 text-indigo-400" />
        <span>Drag to orbit • Scroll to zoom • Auto-rotates when idle</span>
      </div>
    </div>
  );
}

export default KnowledgeGraph3D;
