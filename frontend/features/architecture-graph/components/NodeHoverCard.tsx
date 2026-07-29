"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Shield, AlertCircle, FileCode, Layers, ArrowRight } from "lucide-react";
import { useGraphStore } from "../store/useGraphStore";

export function NodeHoverCard() {
  const hoveredNode = useGraphStore((s) => s.hoveredNode);
  const hoverPos = useGraphStore((s) => s.hoverPos);

  if (!hoveredNode || !hoverPos) return null;

  const health = hoveredNode.health || "healthy";
  const confidence = hoveredNode.confidence || 0.88;
  const complexity = hoveredNode.complexity || "Low";

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 10 }}
        transition={{ duration: 0.15, ease: "easeOut" }}
        style={{
          position: "fixed",
          left: Math.min(window.innerWidth - 320, hoverPos.x + 15),
          top: Math.min(window.innerHeight - 260, hoverPos.y + 15),
          zIndex: 9999,
        }}
        className="w-72 p-3.5 rounded-xl bg-slate-900/95 border border-indigo-500/30 backdrop-blur-2xl shadow-2xl text-slate-100 font-mono pointer-events-none"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-2 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <FileCode className="w-4 h-4 text-indigo-400" />
            <span className="font-bold text-xs text-white truncate max-w-[170px]">
              {hoveredNode.label || hoveredNode.id}
            </span>
          </div>
          <span className="text-[10px] uppercase font-semibold px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
            {hoveredNode.language || hoveredNode.type || "Code"}
          </span>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 gap-2 my-2.5 text-[11px]">
          <div className="p-2 rounded-lg bg-slate-950/60 border border-slate-800/80">
            <span className="text-[10px] text-slate-400 block">AI Confidence</span>
            <span className="font-bold text-emerald-400 flex items-center gap-1 mt-0.5">
              <Sparkles className="w-3 h-3 text-emerald-400" />
              {(confidence * 100).toFixed(0)}%
            </span>
          </div>

          <div className="p-2 rounded-lg bg-slate-950/60 border border-slate-800/80">
            <span className="text-[10px] text-slate-400 block">Complexity</span>
            <span className="font-bold text-indigo-300 mt-0.5 block">{complexity}</span>
          </div>
        </div>

        {/* AI Quick Summary */}
        <div className="p-2 rounded-lg bg-indigo-950/30 border border-indigo-500/20 text-[11px] text-slate-300">
          <span className="text-[10px] text-indigo-400 font-semibold block mb-0.5 flex items-center gap-1">
            <Shield className="w-3 h-3" /> AI Engineering Insight
          </span>
          <p className="text-[10.5px] leading-tight text-slate-300 line-clamp-2">
            {hoveredNode.summary || "Core architecture module parsed & validated by Architect Agent."}
          </p>
        </div>

        {/* Footer info */}
        <div className="mt-2 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-400">
          <span className="flex items-center gap-1 text-indigo-300">
            <Layers className="w-3 h-3" /> Health: {health.toUpperCase()}
          </span>
          <span className="text-slate-400 flex items-center gap-0.5">
            Click to inspect <ArrowRight className="w-2.5 h-2.5" />
          </span>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
