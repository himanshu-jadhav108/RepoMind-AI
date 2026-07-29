"use client";

import React from "react";
import { Handle, Position } from "reactflow";
import { Box, Cpu } from "lucide-react";
import { useGraphStore } from "../store/useGraphStore";

export function SymbolNode({ id, data }: { id: string; data: any }) {
  const setHoveredNode = useGraphStore((s) => s.setHoveredNode);
  const isClass = data.symbol_type === "class" || data.type === "class";

  return (
    <div
      onMouseEnter={(e) => setHoveredNode(data, { x: e.clientX, y: e.clientY })}
      onMouseLeave={() => setHoveredNode(null)}
      className={`flex items-center gap-2 px-3 py-1.5 rounded-full border backdrop-blur-md transition-all duration-200 shadow cursor-pointer ${
        isClass
          ? "bg-amber-950/80 border-amber-500/50 text-amber-200"
          : "bg-emerald-950/80 border-emerald-500/50 text-emerald-200"
      }`}
    >
      <Handle type="target" position={Position.Top} className="!bg-indigo-400 !w-1.5 !h-1.5" />

      {isClass ? (
        <Box className="w-3.5 h-3.5 text-amber-400 shrink-0" />
      ) : (
        <Cpu className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
      )}

      <span className="text-[11px] font-mono font-medium truncate max-w-[130px]">
        {data.label}
      </span>

      <Handle type="source" position={Position.Bottom} className="!bg-indigo-400 !w-1.5 !h-1.5" />
    </div>
  );
}
