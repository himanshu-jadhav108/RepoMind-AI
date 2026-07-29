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
  let badgeBg = "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";

  if (health === "warning") {
    ringColor = "border-amber-500/60 shadow-amber-500/20";
    badgeBg = "bg-amber-500/10 text-amber-400 border-amber-500/20";
  } else if (health === "critical") {
    ringColor = "border-rose-500/60 shadow-rose-500/30";
    badgeBg = "bg-rose-500/10 text-rose-400 border-rose-500/20";
  } else if (health === "ai_generated") {
    ringColor = "border-purple-500/70 shadow-purple-500/30";
    badgeBg = "bg-purple-500/10 text-purple-300 border-purple-500/20";
  }

  return (
    <div
      onMouseEnter={(e) => setHoveredNode(data, { x: e.clientX, y: e.clientY })}
      onMouseLeave={() => setHoveredNode(null)}
      onClick={() => setSelectedNodeId(id)}
      className={`group relative flex items-center gap-3 px-3.5 py-2.5 rounded-xl border backdrop-blur-xl transition-all duration-300 shadow-md cursor-pointer ${
        isSelected
          ? "bg-indigo-900/90 border-indigo-400 ring-2 ring-indigo-400/50 shadow-indigo-500/40"
          : `bg-slate-900/90 ${ringColor} hover:border-indigo-400/60`
      }`}
    >
      <Handle type="target" position={Position.Top} className="!bg-indigo-400 !w-2 !h-2" />

      {/* Language / Health Icon */}
      <div className={`p-1.5 rounded-lg border ${badgeBg}`}>
        {health === "critical" ? (
          <AlertTriangle className="w-4 h-4 text-rose-400" />
        ) : health === "ai_generated" ? (
          <Sparkles className="w-4 h-4 text-purple-300 animate-pulse" />
        ) : (
          <FileCode className="w-4 h-4 text-indigo-400" />
        )}
      </div>

      <div className="flex flex-col">
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-bold text-slate-100 font-mono tracking-tight max-w-[140px] truncate">
            {data.label}
          </span>
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-[9px] uppercase tracking-wider px-1.5 py-0.2 rounded font-mono bg-slate-800 text-slate-300 border border-slate-700">
            {language}
          </span>
          <span className="text-[9px] font-mono text-indigo-300 flex items-center gap-0.5">
            <ShieldCheck className="w-2.5 h-2.5" /> {(confidence * 100).toFixed(0)}% AI
          </span>
        </div>
      </div>

      <Handle type="source" position={Position.Bottom} className="!bg-indigo-400 !w-2 !h-2" />
    </div>
  );
}
