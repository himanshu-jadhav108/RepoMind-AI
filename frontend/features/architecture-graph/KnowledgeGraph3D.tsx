"use client";

import React, { useEffect, useRef, useState, useMemo } from "react";
import { Folder, FileCode, Cpu, Box, Sparkles, Move, ZoomIn, ZoomOut, RefreshCw } from "lucide-react";

interface KnowledgeGraph3DProps {
  graphData?: { nodes: any[]; edges: any[] } | null;
  onNodeClick?: (nodeId: string) => void;
}

interface Node3D {
  id: string;
  label: string;
  type: string;
  x: number;
  y: number;
  z: number;
  radius: number;
  color: string;
  glowColor: string;
  // Screen projection space
  px: number;
  py: number;
  pz: number;
  scale: number;
}

interface Edge3D {
  id: string;
  source: string;
  target: string;
  label?: string;
  animated?: boolean;
}

// Generate background starfield particles
const STARFIELD = Array.from({ length: 90 }, () => ({
  x: (Math.random() - 0.5) * 1200,
  y: (Math.random() - 0.5) * 800,
  z: Math.random() * 800 - 400,
  size: Math.random() * 1.5 + 0.5,
  alpha: Math.random() * 0.7 + 0.3,
}));

export function KnowledgeGraph3D({ graphData, onNodeClick }: KnowledgeGraph3DProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // 3D Camera State (Angles and Zoom Distance)
  const [rotX, setRotX] = useState<number>(0.2);
  const [rotY, setRotY] = useState<number>(0.4);
  const [zoom, setZoom] = useState<number>(550);
  const [hoveredNode, setHoveredNode] = useState<Node3D | null>(null);
  const isDragging = useRef<boolean>(false);
  const lastMousePos = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // 3D Nodes Initialization (Spherical / Multi-Ring Orbit Layout)
  const nodes3D: Node3D[] = useMemo(() => {
    const rawNodes = graphData?.nodes || [];

    // Fallback demo 3D galaxy nodes if empty
    if (rawNodes.length === 0) {
      return [
        { id: "root", label: "app/main.py", type: "file", x: 0, y: 0, z: 0, radius: 14, color: "#818cf8", glowColor: "rgba(129, 140, 248, 0.6)", px: 0, py: 0, pz: 0, scale: 1 },
        { id: "services", label: "services/analysis.py", type: "file", x: -140, y: -60, z: 80, radius: 10, color: "#38bdf8", glowColor: "rgba(56, 189, 248, 0.5)", px: 0, py: 0, pz: 0, scale: 1 },
        { id: "agents", label: "agents/architect.py", type: "file", x: 160, y: 70, z: -90, radius: 10, color: "#fbbf24", glowColor: "rgba(251, 191, 36, 0.5)", px: 0, py: 0, pz: 0, scale: 1 },
        { id: "providers", label: "providers/router.py", type: "file", x: 80, y: -130, z: 120, radius: 10, color: "#34d399", glowColor: "rgba(52, 211, 153, 0.5)", px: 0, py: 0, pz: 0, scale: 1 },
        { id: "graph", label: "orchestration/graph.py", type: "file", x: -120, y: 110, z: -60, radius: 10, color: "#a78bfa", glowColor: "rgba(167, 139, 250, 0.5)", px: 0, py: 0, pz: 0, scale: 1 },
      ];
    }

    const cappedNodes = rawNodes.slice(0, 50); // Cap at 50 nodes for high 60fps performance
    const count = cappedNodes.length;

    return cappedNodes.map((n, idx) => {
      const type = n.type || "file";
      const label = n.data?.label || n.id;
      const isRoot = idx === 0 || label.includes("main.py") || label.includes("index.ts");

      let color = "#818cf8";
      let glowColor = "rgba(129, 140, 248, 0.5)";
      let radius = 9;

      if (isRoot) {
        color = "#a855f7"; // Vibrant Purple Core
        glowColor = "rgba(168, 85, 247, 0.8)";
        radius = 16;
      } else if (type === "folder") {
        color = "#38bdf8"; // Cyan
        glowColor = "rgba(56, 189, 248, 0.6)";
        radius = 12;
      } else if (type === "class") {
        color = "#fbbf24"; // Amber
        glowColor = "rgba(251, 191, 36, 0.5)";
        radius = 8;
      } else if (type === "function") {
        color = "#34d399"; // Emerald
        glowColor = "rgba(52, 211, 153, 0.5)";
        radius = 7;
      }

      // Calculate 3D Orbital Coordinates (Fibonacci Spiral Sphere Distribution)
      if (isRoot) {
        return { id: n.id, label, type, x: 0, y: 0, z: 0, radius, color, glowColor, px: 0, py: 0, pz: 0, scale: 1 };
      }

      const phi = Math.acos(1 - 2 * ((idx + 0.5) / count));
      const theta = Math.sqrt(count * Math.PI) * phi;
      const orbitRadius = 130 + (idx % 3) * 70; // 3 concentric orbital shells

      const x = orbitRadius * Math.sin(phi) * Math.cos(theta);
      const y = orbitRadius * Math.sin(phi) * Math.sin(theta) * 0.7; // slight vertical flattening
      const z = orbitRadius * Math.cos(phi);

      return {
        id: n.id,
        label,
        type,
        x,
        y,
        z,
        radius,
        color,
        glowColor,
        px: 0,
        py: 0,
        pz: 0,
        scale: 1,
      };
    });
  }, [graphData]);

  // Edges mapping
  const edges3D: Edge3D[] = useMemo(() => {
    const rawEdges = graphData?.edges || [];
    if (rawEdges.length === 0) {
      return [
        { id: "e1", source: "root", target: "services", animated: true },
        { id: "e2", source: "root", target: "agents", animated: true },
        { id: "e3", source: "root", target: "providers", animated: false },
        { id: "e4", source: "root", target: "graph", animated: true },
      ];
    }
    const validIds = new Set(nodes3D.map((n) => n.id));
    return rawEdges
      .filter((e) => validIds.has(e.source) && validIds.has(e.target))
      .slice(0, 70);
  }, [graphData, nodes3D]);

  // 3D Engine Main Animation & Render Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let particleOffset = 0;

    const render = () => {
      // Auto-size canvas to container bounds
      const rect = canvas.getBoundingClientRect();
      const width = rect.width;
      const height = rect.height;

      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
      }

      const cx = width / 2;
      const cy = height / 2;
      const FOV = zoom;

      particleOffset = (particleOffset + 0.015) % 1;

      // Clear Canvas background
      ctx.fillStyle = "#030712";
      ctx.fillRect(0, 0, width, height);

      // Trigonometric projection metrics
      const cosX = Math.cos(rotX);
      const sinX = Math.sin(rotX);
      const cosY = Math.cos(rotY);
      const sinY = Math.sin(rotY);

      // 1. Draw Starfield Background Particles
      STARFIELD.forEach((star) => {
        // Rotate star coordinates
        const x1 = star.x * cosY - star.z * sinY;
        const z1 = star.x * sinY + star.z * cosY;
        const y1 = star.y * cosX - z1 * sinX;
        const z2 = star.y * sinX + z1 * cosX;

        const scale = FOV / (FOV + z2 + 400);
        if (scale > 0) {
          const sx = cx + x1 * scale;
          const sy = cy + y1 * scale;
          ctx.fillStyle = `rgba(148, 163, 184, ${star.alpha * Math.min(1, scale)})`;
          ctx.beginPath();
          ctx.arc(sx, sy, star.size * scale, 0, Math.PI * 2);
          ctx.fill();
        }
      });

      // 2. Draw 3D Concentric Orbital Rings
      [130, 200, 270].forEach((ringRadius, idx) => {
        ctx.beginPath();
        const steps = 60;
        for (let i = 0; i <= steps; i++) {
          const a = (i / steps) * Math.PI * 2;
          const rx = ringRadius * Math.cos(a);
          const ry = 0;
          const rz = ringRadius * Math.sin(a);

          const x1 = rx * cosY - rz * sinY;
          const z1 = rx * sinY + rz * cosY;
          const y1 = ry * cosX - z1 * sinX;
          const z2 = ry * sinX + z1 * cosX;

          const scale = FOV / (FOV + z2 + 400);
          const sx = cx + x1 * scale;
          const sy = cy + y1 * scale;

          if (i === 0) ctx.moveTo(sx, sy);
          else ctx.lineTo(sx, sy);
        }
        ctx.strokeStyle = idx === 0 ? "rgba(99, 102, 241, 0.18)" : "rgba(56, 189, 248, 0.12)";
        ctx.lineWidth = 1;
        ctx.stroke();
      });

      // 3. Project 3D Nodes to 2D Screen Space
      const projectedNodes: (Node3D & { screenX: number; screenY: number; screenZ: number })[] = [];
      const nodeMap = new Map<string, typeof projectedNodes[0]>();

      nodes3D.forEach((node) => {
        // 3D Matrix Rotation (Yaw then Pitch)
        const x1 = node.x * cosY - node.z * sinY;
        const z1 = node.x * sinY + node.z * cosY;
        const y1 = node.y * cosX - z1 * sinX;
        const z2 = node.y * sinX + z1 * cosX;

        const scale = FOV / (FOV + z2 + 400);
        const screenX = cx + x1 * scale;
        const screenY = cy + y1 * scale;

        const proj = {
          ...node,
          screenX,
          screenY,
          screenZ: z2,
          scale,
        };

        projectedNodes.push(proj);
        nodeMap.set(node.id, proj);
      });

      // Sort nodes back-to-front by Z depth for proper 3D rendering order
      projectedNodes.sort((a, b) => b.screenZ - a.screenZ);

      // 4. Render 3D Laser Beam Edges & Moving Energy Particles
      edges3D.forEach((edge) => {
        const src = nodeMap.get(edge.source);
        const tgt = nodeMap.get(edge.target);

        if (src && tgt) {
          const isHighlighted = hoveredNode && (hoveredNode.id === src.id || hoveredNode.id === tgt.id);

          // Draw laser line
          ctx.beginPath();
          ctx.moveTo(src.screenX, src.screenY);
          ctx.lineTo(tgt.screenX, tgt.screenY);
          ctx.strokeStyle = isHighlighted
            ? "#a855f7"
            : edge.animated
            ? "rgba(129, 140, 248, 0.35)"
            : "rgba(71, 85, 105, 0.25)";
          ctx.lineWidth = isHighlighted ? 2.5 : 1.2;
          ctx.stroke();

          // Draw animated energy light particles along the beam
          if (edge.animated || isHighlighted) {
            const px = src.screenX + (tgt.screenX - src.screenX) * particleOffset;
            const py = src.screenY + (tgt.screenY - src.screenY) * particleOffset;
            ctx.fillStyle = isHighlighted ? "#f43f5e" : "#818cf8";
            ctx.beginPath();
            ctx.arc(px, py, isHighlighted ? 3 : 2, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      });

      // 5. Render 3D Glowing Orbs & Labels
      projectedNodes.forEach((node) => {
        const isHovered = hoveredNode?.id === node.id;
        const radius = (node.radius * node.scale) * (isHovered ? 1.4 : 1);

        // Outer Glow Halo
        const glow = ctx.createRadialGradient(
          node.screenX,
          node.screenY,
          0,
          node.screenX,
          node.screenY,
          radius * 2.5
        );
        glow.addColorStop(0, node.glowColor);
        glow.addColorStop(1, "rgba(0, 0, 0, 0)");

        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(node.screenX, node.screenY, radius * 2.5, 0, Math.PI * 2);
        ctx.fill();

        // Solid Node Sphere
        ctx.fillStyle = isHovered ? "#ffffff" : node.color;
        ctx.beginPath();
        ctx.arc(node.screenX, node.screenY, radius, 0, Math.PI * 2);
        ctx.fill();

        // 3D Glass Label Tag (rendered for larger nodes or hovered node)
        if (node.scale > 0.6 || isHovered || node.type === "folder") {
          ctx.font = `${Math.max(10, Math.round(11 * node.scale))}px monospace`;
          ctx.fillStyle = isHovered ? "#ffffff" : "rgba(241, 245, 249, 0.85)";
          ctx.textAlign = "center";
          ctx.fillText(node.label, node.screenX, node.screenY + radius + 14 * node.scale);
        }
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [nodes3D, edges3D, rotX, rotY, zoom, hoveredNode]);

  // Mouse Interactivity (3D Drag Rotation & Hover Selection)
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    isDragging.current = true;
    lastMousePos.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    if (isDragging.current) {
      const dx = e.clientX - lastMousePos.current.x;
      const dy = e.clientY - lastMousePos.current.y;

      setRotY((prev) => prev + dx * 0.006);
      setRotX((prev) => Math.max(-1.2, Math.min(1.2, prev + dy * 0.006)));

      lastMousePos.current = { x: e.clientX, y: e.clientY };
      return;
    }

    // Raycast/Hit-test for node hovering
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;

    const cx = rect.width / 2;
    const cy = rect.height / 2;
    const FOV = zoom;

    const cosX = Math.cos(rotX);
    const sinX = Math.sin(rotX);
    const cosY = Math.cos(rotY);
    const sinY = Math.sin(rotY);

    let hit: Node3D | null = null;

    for (const node of nodes3D) {
      const x1 = node.x * cosY - node.z * sinY;
      const z1 = node.x * sinY + node.z * cosY;
      const y1 = node.y * cosX - z1 * sinX;
      const z2 = node.y * sinX + z1 * cosX;

      const scale = FOV / (FOV + z2 + 400);
      const sx = cx + x1 * scale;
      const sy = cy + y1 * scale;

      const dist = Math.hypot(mx - sx, my - sy);
      if (dist < node.radius * scale + 6) {
        hit = node;
        break;
      }
    }

    setHoveredNode(hit);
  };

  const handleMouseUp = () => {
    isDragging.current = false;
  };

  const handleClick = () => {
    if (hoveredNode && onNodeClick) {
      onNodeClick(hoveredNode.id);
    }
  };

  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    setZoom((prev) => Math.max(250, Math.min(1000, prev - e.deltaY * 0.5)));
  };

  return (
    <div className="relative w-full h-full min-h-[440px] bg-slate-950 rounded-b-xl overflow-hidden cursor-grab active:cursor-grabbing">
      <canvas
        ref={canvasRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onClick={handleClick}
        onWheel={handleWheel}
        className="w-full h-full block"
      />

      {/* Floating 3D Controls overlay */}
      <div className="absolute top-3 right-3 flex items-center gap-1.5 p-1.5 rounded-lg bg-slate-900/80 border border-slate-800 backdrop-blur-md">
        <button
          onClick={() => setZoom((z) => Math.min(900, z + 80))}
          className="p-1.5 rounded hover:bg-slate-800 text-slate-300 transition"
          title="Zoom In"
        >
          <ZoomIn className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => setZoom((z) => Math.max(300, z - 80))}
          className="p-1.5 rounded hover:bg-slate-800 text-slate-300 transition"
          title="Zoom Out"
        >
          <ZoomOut className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => {
            setRotX(0.2);
            setRotY(0.4);
            setZoom(550);
          }}
          className="p-1.5 rounded hover:bg-slate-800 text-slate-300 transition"
          title="Reset Camera"
        >
          <RefreshCw className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Floating Hover HUD Card */}
      {hoveredNode && (
        <div className="absolute bottom-3 left-3 p-3 rounded-lg bg-slate-900/90 border border-indigo-500/30 backdrop-blur-md shadow-xl text-xs text-slate-200 font-mono flex items-center gap-2 max-w-sm">
          <Sparkles className="w-4 h-4 text-indigo-400 shrink-0" />
          <div>
            <div className="font-bold text-white flex items-center gap-1.5">
              <span>{hoveredNode.label}</span>
              <span className="text-[10px] uppercase px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                {hoveredNode.type}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">Click to inspect file content in code viewer</p>
          </div>
        </div>
      )}

      {/* Drag & Rotate Instructions HUD */}
      <div className="absolute bottom-3 right-3 p-2 rounded-md bg-slate-900/70 border border-slate-800 backdrop-blur-md text-[11px] text-slate-400 font-mono flex items-center gap-1.5 pointer-events-none">
        <Move className="w-3.5 h-3.5 text-indigo-400" />
        <span>Drag to rotate 360° • Scroll to zoom</span>
      </div>
    </div>
  );
}
