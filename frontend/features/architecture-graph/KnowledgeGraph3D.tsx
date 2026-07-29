"use client";

import React, { useEffect, useRef, useState, useMemo } from "react";
import { Folder, FileCode, Cpu, Box, Sparkles, Move, ZoomIn, ZoomOut, RefreshCw, FolderOpen, ChevronRight } from "lucide-react";

interface KnowledgeGraph3DProps {
  graphData?: { nodes: any[]; edges: any[] } | null;
  onNodeClick?: (nodeId: string) => void;
}

interface Node3D {
  id: string;
  label: string;
  type: string;
  parentFolder?: string;
  x: number;
  y: number;
  z: number;
  radius: number;
  color: string;
  glowColor: string;
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

// Background starfield particles
const STARFIELD = Array.from({ length: 95 }, () => ({
  x: (Math.random() - 0.5) * 1300,
  y: (Math.random() - 0.5) * 850,
  z: Math.random() * 800 - 400,
  size: Math.random() * 1.6 + 0.4,
  alpha: Math.random() * 0.7 + 0.3,
}));

export function KnowledgeGraph3D({ graphData, onNodeClick }: KnowledgeGraph3DProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // 3D Camera Rotation State
  const [rotX, setRotX] = useState<number>(0.2);
  const [rotY, setRotY] = useState<number>(0.4);

  // Smooth Lerp Zoom Engine State
  const targetZoomRef = useRef<number>(550);
  const currentZoomRef = useRef<number>(550);

  // Folder Expansion State (Set of expanded folder IDs)
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set(["root_folder", "backend/app"]));
  const [hoveredNode, setHoveredNode] = useState<Node3D | null>(null);

  const isDragging = useRef<boolean>(false);
  const lastMousePos = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // 3D Nodes Initialization with Folder Hierarchy Grouping
  const nodes3D: Node3D[] = useMemo(() => {
    const rawNodes = graphData?.nodes || [];

    if (rawNodes.length === 0) {
      return [
        { id: "root", label: "app/main.py", type: "file", x: 0, y: 0, z: 0, radius: 15, color: "#a855f7", glowColor: "rgba(168, 85, 247, 0.8)", px: 0, py: 0, pz: 0, scale: 1 },
        { id: "backend/services", label: "services/", type: "folder", x: -160, y: -70, z: 80, radius: 13, color: "#38bdf8", glowColor: "rgba(56, 189, 248, 0.7)", px: 0, py: 0, pz: 0, scale: 1 },
        { id: "services/analysis.py", label: "analysis.py", type: "file", parentFolder: "backend/services", x: -220, y: -110, z: 120, radius: 9, color: "#818cf8", glowColor: "rgba(129, 140, 248, 0.5)", px: 0, py: 0, pz: 0, scale: 1 },
        { id: "services/repo.py", label: "repo.py", type: "file", parentFolder: "backend/services", x: -120, y: -120, z: 40, radius: 9, color: "#818cf8", glowColor: "rgba(129, 140, 248, 0.5)", px: 0, py: 0, pz: 0, scale: 1 },
        { id: "backend/agents", label: "agents/", type: "folder", x: 170, y: 80, z: -90, radius: 13, color: "#38bdf8", glowColor: "rgba(56, 189, 248, 0.7)", px: 0, py: 0, pz: 0, scale: 1 },
        { id: "agents/architect.py", label: "architect.py", type: "file", parentFolder: "backend/agents", x: 230, y: 130, z: -140, radius: 9, color: "#fbbf24", glowColor: "rgba(251, 191, 36, 0.5)", px: 0, py: 0, pz: 0, scale: 1 },
        { id: "agents/reviewer.py", label: "reviewer.py", type: "file", parentFolder: "backend/agents", x: 120, y: 140, z: -50, radius: 9, color: "#34d399", glowColor: "rgba(52, 211, 153, 0.5)", px: 0, py: 0, pz: 0, scale: 1 },
      ];
    }

    const cappedNodes = rawNodes.slice(0, 55);
    const count = cappedNodes.length;

    return cappedNodes.map((n, idx) => {
      const type = n.type || "file";
      const label = n.data?.label || n.id;
      const id = n.id;
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
        glowColor = "rgba(56, 189, 248, 0.7)";
        radius = 13;
      } else if (type === "class") {
        color = "#fbbf24"; // Amber
        glowColor = "rgba(251, 191, 36, 0.5)";
        radius = 8;
      } else if (type === "function") {
        color = "#34d399"; // Emerald
        glowColor = "rgba(52, 211, 153, 0.5)";
        radius = 7;
      }

      if (isRoot) {
        return { id, label, type, x: 0, y: 0, z: 0, radius, color, glowColor, px: 0, py: 0, pz: 0, scale: 1 };
      }

      // Spherical distribution
      const phi = Math.acos(1 - 2 * ((idx + 0.5) / count));
      const theta = Math.sqrt(count * Math.PI) * phi;
      const orbitRadius = 135 + (idx % 3) * 75;

      const x = orbitRadius * Math.sin(phi) * Math.cos(theta);
      const y = orbitRadius * Math.sin(phi) * Math.sin(theta) * 0.75;
      const z = orbitRadius * Math.cos(phi);

      return {
        id,
        label,
        type,
        parentFolder: n.parentFolder,
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

  // Containment & Import Edges
  const edges3D: Edge3D[] = useMemo(() => {
    const rawEdges = graphData?.edges || [];
    if (rawEdges.length === 0) {
      return [
        { id: "e1", source: "root", target: "backend/services", animated: true },
        { id: "e2", source: "root", target: "backend/agents", animated: true },
        { id: "e3", source: "backend/services", target: "services/analysis.py", animated: false },
        { id: "e4", source: "backend/services", target: "services/repo.py", animated: false },
        { id: "e5", source: "backend/agents", target: "agents/architect.py", animated: false },
        { id: "e6", source: "backend/agents", target: "agents/reviewer.py", animated: false },
      ];
    }
    const validIds = new Set(nodes3D.map((n) => n.id));
    return rawEdges.filter((e) => validIds.has(e.source) && validIds.has(e.target)).slice(0, 80);
  }, [graphData, nodes3D]);

  // 3D Render & Smooth Lerp Zoom Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let particleOffset = 0;

    const render = () => {
      // Smooth Lerp Zoom Calculation (Current Zoom -> Target Zoom)
      currentZoomRef.current += (targetZoomRef.current - currentZoomRef.current) * 0.14;

      const rect = canvas.getBoundingClientRect();
      const width = rect.width;
      const height = rect.height;

      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
      }

      const cx = width / 2;
      const cy = height / 2;
      const FOV = currentZoomRef.current;

      particleOffset = (particleOffset + 0.015) % 1;

      // Clear Canvas Background
      ctx.fillStyle = "#030712";
      ctx.fillRect(0, 0, width, height);

      const cosX = Math.cos(rotX);
      const sinX = Math.sin(rotX);
      const cosY = Math.cos(rotY);
      const sinY = Math.sin(rotY);

      // 1. Draw Starfield Background
      STARFIELD.forEach((star) => {
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

      // 2. Draw Concentric 3D Orbital Rings
      [135, 210, 285].forEach((ringRadius, idx) => {
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
        ctx.strokeStyle = idx === 0 ? "rgba(99, 102, 241, 0.2)" : "rgba(56, 189, 248, 0.12)";
        ctx.lineWidth = 1;
        ctx.stroke();
      });

      // 3. Project 3D Nodes to 2D Screen Space
      const projectedNodes: (Node3D & { screenX: number; screenY: number; screenZ: number })[] = [];
      const nodeMap = new Map<string, typeof projectedNodes[0]>();

      nodes3D.forEach((node) => {
        const x1 = node.x * cosY - node.z * sinY;
        const z1 = node.x * sinY + node.z * cosY;
        const y1 = node.y * cosX - z1 * sinX;
        const z2 = node.y * sinX + z1 * cosX;

        const scale = FOV / (FOV + z2 + 400);
        const screenX = cx + x1 * scale;
        const screenY = cy + y1 * scale;

        const proj = { ...node, screenX, screenY, screenZ: z2, scale };
        projectedNodes.push(proj);
        nodeMap.set(node.id, proj);
      });

      // Sort nodes back-to-front by Z depth for realistic 3D layering
      projectedNodes.sort((a, b) => b.screenZ - a.screenZ);

      // 4. Render Glowing Folder Sub-Cluster Bounding Boxes (for expanded folders)
      nodes3D
        .filter((n) => n.type === "folder")
        .forEach((folderNode) => {
          const isExpanded = expandedFolders.has(folderNode.id) || expandedFolders.has(folderNode.label);
          const projFolder = nodeMap.get(folderNode.id);

          if (projFolder) {
            // Find child nodes contained in this folder
            const children = projectedNodes.filter(
              (cn) =>
                cn.id.startsWith(folderNode.id) ||
                cn.label.startsWith(folderNode.label) ||
                cn.parentFolder === folderNode.id
            );

            if (children.length > 0) {
              // Calculate 2D bounding box around folder & its internal contents
              let minX = projFolder.screenX;
              let maxX = projFolder.screenX;
              let minY = projFolder.screenY;
              let maxY = projFolder.screenY;

              children.forEach((c) => {
                minX = Math.min(minX, c.screenX - 25 * c.scale);
                maxX = Math.max(maxX, c.screenX + 25 * c.scale);
                minY = Math.min(minY, c.screenY - 25 * c.scale);
                maxY = Math.max(maxY, c.screenY + 25 * c.scale);
              });

              const pad = 18 * projFolder.scale;
              const boxW = maxX - minX + pad * 2;
              const boxH = maxY - minY + pad * 2;
              const boxX = minX - pad;
              const boxY = minY - pad;

              // Draw Glowing 3D Glass Folder Box Enclosure
              ctx.save();
              ctx.fillStyle = isExpanded
                ? "rgba(14, 165, 233, 0.08)"
                : "rgba(15, 23, 42, 0.35)";
              ctx.strokeStyle = isExpanded
                ? "rgba(56, 189, 248, 0.6)"
                : "rgba(56, 189, 248, 0.25)";
              ctx.lineWidth = isExpanded ? 1.8 : 1;
              if (!isExpanded) ctx.setLineDash([4, 4]);

              ctx.beginPath();
              ctx.roundRect(boxX, boxY, boxW, boxH, 10 * projFolder.scale);
              ctx.fill();
              ctx.stroke();

              // Folder Header Label Box Tag
              ctx.fillStyle = isExpanded ? "rgba(14, 165, 233, 0.9)" : "rgba(30, 41, 59, 0.85)";
              ctx.fillRect(boxX, boxY - 18 * projFolder.scale, Math.min(boxW, 140 * projFolder.scale), 18 * projFolder.scale);
              ctx.fillStyle = "#ffffff";
              ctx.font = `${Math.max(9, Math.round(10 * projFolder.scale))}px monospace`;
              ctx.textAlign = "left";
              ctx.fillText(
                `📁 ${folderNode.label} (${children.length})`,
                boxX + 6,
                boxY - 5 * projFolder.scale
              );
              ctx.restore();
            }
          }
        });

      // 5. Render 3D Laser Beam Edges & Moving Energy Particles
      edges3D.forEach((edge) => {
        const src = nodeMap.get(edge.source);
        const tgt = nodeMap.get(edge.target);

        if (src && tgt) {
          const isHighlighted = hoveredNode && (hoveredNode.id === src.id || hoveredNode.id === tgt.id);

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

          // Animated energy light particle
          if (edge.animated || isHighlighted) {
            const px = src.screenX + (tgt.screenX - src.screenX) * particleOffset;
            const py = src.screenY + (tgt.screenY - src.screenY) * particleOffset;
            ctx.fillStyle = isHighlighted ? "#f43f5e" : "#818cf8";
            ctx.beginPath();
            ctx.arc(px, py, isHighlighted ? 3.5 : 2, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      });

      // 6. Render 3D Glowing Orbs & Labels
      projectedNodes.forEach((node) => {
        const isHovered = hoveredNode?.id === node.id;
        const radius = (node.radius * node.scale) * (isHovered ? 1.35 : 1);

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

        // Node Label Tag
        if (node.scale > 0.55 || isHovered || node.type === "folder") {
          ctx.font = `${Math.max(10, Math.round(11 * node.scale))}px monospace`;
          ctx.fillStyle = isHovered ? "#ffffff" : "rgba(241, 245, 249, 0.9)";
          ctx.textAlign = "center";
          ctx.fillText(node.label, node.screenX, node.screenY + radius + 13 * node.scale);
        }
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [nodes3D, edges3D, rotX, rotY, hoveredNode, expandedFolders]);

  // Smooth Zoom Trigger Helper
  const applySmoothZoom = (delta: number) => {
    targetZoomRef.current = Math.max(260, Math.min(1100, targetZoomRef.current + delta));
  };

  // Mouse Handlers
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

    // Raycast hit-test
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;

    const cx = rect.width / 2;
    const cy = rect.height / 2;
    const FOV = currentZoomRef.current;

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
      if (dist < node.radius * scale + 8) {
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
    if (!hoveredNode) return;

    // Folder Expansion Toggle Action
    if (hoveredNode.type === "folder") {
      setExpandedFolders((prev) => {
        const next = new Set(prev);
        if (next.has(hoveredNode.id) || next.has(hoveredNode.label)) {
          next.delete(hoveredNode.id);
          next.delete(hoveredNode.label);
        } else {
          next.add(hoveredNode.id);
          next.add(hoveredNode.label);
        }
        return next;
      });
    }

    if (onNodeClick) {
      onNodeClick(hoveredNode.id);
    }
  };

  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    // Smooth Lerp Zoom on Wheel Scroll
    applySmoothZoom(-e.deltaY * 0.65);
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

      {/* Smooth 3D Controls overlay */}
      <div className="absolute top-3 right-3 flex items-center gap-1.5 p-1.5 rounded-lg bg-slate-900/80 border border-slate-800 backdrop-blur-md shadow-lg">
        <button
          onClick={() => applySmoothZoom(120)}
          className="p-1.5 rounded hover:bg-indigo-600/30 text-slate-200 transition"
          title="Smooth Zoom In"
        >
          <ZoomIn className="w-4 h-4 text-indigo-400" />
        </button>
        <button
          onClick={() => applySmoothZoom(-120)}
          className="p-1.5 rounded hover:bg-indigo-600/30 text-slate-200 transition"
          title="Smooth Zoom Out"
        >
          <ZoomOut className="w-4 h-4 text-indigo-400" />
        </button>
        <button
          onClick={() => {
            setRotX(0.2);
            setRotY(0.4);
            targetZoomRef.current = 550;
          }}
          className="p-1.5 rounded hover:bg-indigo-600/30 text-slate-200 transition"
          title="Reset 3D Camera"
        >
          <RefreshCw className="w-4 h-4 text-slate-400 hover:rotate-180 transition-transform duration-300" />
        </button>
      </div>

      {/* Floating Hover HUD Card with Folder Expand Indicator */}
      {hoveredNode && (
        <div className="absolute bottom-3 left-3 p-3 rounded-lg bg-slate-900/90 border border-indigo-500/30 backdrop-blur-md shadow-2xl text-xs text-slate-200 font-mono flex items-center gap-2.5 max-w-md animate-in fade-in duration-200">
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
                <span>Click folder to {expandedFolders.has(hoveredNode.id) || expandedFolders.has(hoveredNode.label) ? "collapse" : "expand 3D internal subfolder box"}</span>
              </p>
            ) : (
              <p className="text-[11px] text-slate-400 mt-0.5">Click to inspect file content in code viewer</p>
            )}
          </div>
        </div>
      )}

      {/* Navigation Legend HUD */}
      <div className="absolute bottom-3 right-3 p-2 rounded-md bg-slate-900/80 border border-slate-800 backdrop-blur-md text-[11px] text-slate-400 font-mono flex items-center gap-2 pointer-events-none">
        <Move className="w-3.5 h-3.5 text-indigo-400" />
        <span>Smooth Scroll Zoom • Drag 360° • Click Folder to Expand Subfolder Box</span>
      </div>
    </div>
  );
}
