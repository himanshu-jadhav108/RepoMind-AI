"use client";

import React from "react";
import { Handle, Position } from "reactflow";
import { FileCode, Sparkles, AlertTriangle, ShieldCheck } from "lucide-react";
import { useGraphStore } from "../store/useGraphStore";

export function FileNode({ id, data }: { id: string; data: any }) {
  const selectedNodeId = useGraphStore((s) => s.selectedNodeId);
  const setSelectedNodeId = useGraphStore((s) => s.setSelectedNodeId);
  const setHoveredNode = useGraphStore((s) => s.setHoveredNode);

  const isSelected = selectedNodeId === id;
  const health = data.health || "healthy"; // "healthy" | "warning" | "critical" | "ai_generated"
  const confidence = data.confidence || 0.88;
  const language = data.language || "Python";

  // Health Status Ring Color
  let ringColor = "border-emerald-500/60 shadow-emerald-500/20";
  let badgeBg = "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20";

  if (health === "warning") {
    ringColor = "border-severity-warning/60 shadow-severity-warning/20";
    badgeBg = "bg-severity-warning/10 text-severity-warning border-severity-warning/20";
  } else if (health === "critical") {
    ringColor = "border-severity-critical/60 shadow-severity-critical/30";
    badgeBg = "bg-severity-critical/10 text-severity-critical border-severity-critical/20";
  } else if (health === "ai_generated") {
    ringColor = "border-copper/70 shadow-copper/30";
    badgeBg = "bg-copper/10 text-copper border-copper/20";
  }

  return (
    <div
      onMouseEnter={(e) => setHoveredNode(data, { x: e.clientX, y: e.clientY })}
      onMouseLeave={() => setHoveredNode(null)}
      onClick={() => setSelectedNodeId(id)}
      className={`group relative flex items-center gap-3 px-3.5 py-2.5 rounded-xl border backdrop-blur-xl transition-all duration-300 shadow-md cursor-pointer ${
        isSelected
          ? "bg-card border-category-arch ring-2 ring-category-arch/50 shadow-lg"
          : `bg-card/95 ${ringColor} hover:border-category-arch/60`
      }`}
    >
      <Handle type="target" position={Position.Top} className="!bg-category-arch !w-2 !h-2" />

      {/* Language / Health Icon */}
      <div className={`p-1.5 rounded-lg border ${badgeBg}`}>
        {health === "critical" ? (
          <AlertTriangle className="w-4 h-4 text-severity-critical" />
        ) : health === "ai_generated" ? (
          <Sparkles className="w-4 h-4 text-copper animate-pulse" />
        ) : (
          <FileCode className="w-4 h-4 text-category-arch" />
        )}
      </div>

      <div className="flex flex-col">
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-bold text-foreground font-mono tracking-tight max-w-[140px] truncate">
            {data.label}
          </span>
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-[9px] uppercase tracking-wider px-1.5 py-0.2 rounded font-mono bg-background text-muted-foreground border border-border">
            {language}
          </span>
          <span className="text-[9px] font-mono text-category-arch flex items-center gap-0.5">
            <ShieldCheck className="w-2.5 h-2.5" /> {(confidence * 100).toFixed(0)}% AI
          </span>
        </div>
      </div>

      <Handle type="source" position={Position.Bottom} className="!bg-category-arch !w-2 !h-2" />
    </div>
  );
}
