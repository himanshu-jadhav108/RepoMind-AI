"use client";

import React from "react";
import { Handle, Position } from "reactflow";
import { Folder, FolderOpen, ChevronRight, ChevronDown } from "lucide-react";
import { useGraphStore } from "../store/useGraphStore";

export function FolderNode({ id, data }: { id: string; data: any }) {
  const expandedNodeIds = useGraphStore((s) => s.expandedNodeIds);
  const toggleExpandNode = useGraphStore((s) => s.toggleExpandNode);
  const setHoveredNode = useGraphStore((s) => s.setHoveredNode);

  const isExpanded = expandedNodeIds.has(id) || expandedNodeIds.has("*");
  const childCount = data.child_count || data.size_bytes || 0;

  return (
    <div
      onMouseEnter={(e) => setHoveredNode(data, { x: e.clientX, y: e.clientY })}
      onMouseLeave={() => setHoveredNode(null)}
      className={`group relative flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl border backdrop-blur-xl transition-all duration-300 shadow-md cursor-pointer ${
        isExpanded
          ? "bg-sky-950/80 border-sky-500/60 shadow-sky-500/20"
          : "bg-slate-900/90 border-slate-800 hover:border-sky-500/40"
      }`}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        toggleExpandNode(id);
      }}
    >
      <Handle type="target" position={Position.Top} className="!bg-sky-400 !w-2 !h-2" />

      <div className="p-1.5 rounded-lg bg-sky-500/10 text-sky-400 border border-sky-500/20">
        {isExpanded ? <FolderOpen className="w-4 h-4" /> : <Folder className="w-4 h-4" />}
      </div>

      <div className="flex flex-col">
        <span className="text-xs font-semibold text-sky-100 font-mono tracking-tight flex items-center gap-1">
          {data.label}
        </span>
        {childCount > 0 && (
          <span className="text-[10px] text-sky-400/80 font-mono">
            {childCount} items inside
          </span>
        )}
      </div>

      <div className="ml-auto text-sky-400/70 group-hover:text-sky-300 transition">
        {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
      </div>

      <Handle type="source" position={Position.Bottom} className="!bg-sky-400 !w-2 !h-2" />
    </div>
  );
}
