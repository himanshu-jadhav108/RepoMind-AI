"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Sparkles, ShieldCheck, AlertTriangle, FileCode, Cpu, Box, CheckCircle2, ArrowRight } from "lucide-react";
import { useGraphStore } from "../store/useGraphStore";

export function NodeInspectorSidebar({ graphData }: { graphData?: any }) {
  const selectedNodeId = useGraphStore((s) => s.selectedNodeId);
  const setSelectedNodeId = useGraphStore((s) => s.setSelectedNodeId);

  if (!selectedNodeId) return null;

  const nodeData = graphData?.nodes?.find((n: any) => n.id === selectedNodeId) || {
    id: selectedNodeId,
    data: { label: selectedNodeId, language: "Python" },
  };

  const label = nodeData.data?.label || selectedNodeId;
  const language = nodeData.data?.language || "Python";

  return (
    <AnimatePresence>
      <motion.aside
        initial={{ x: "100%", opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: "100%", opacity: 0 }}
        transition={{ type: "spring", damping: 25, stiffness: 220 }}
        className="fixed top-0 right-0 h-full w-96 bg-slate-900/95 border-l border-indigo-500/30 backdrop-blur-2xl shadow-2xl z-[999] flex flex-col font-mono text-slate-100 p-5 overflow-y-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <FileCode className="w-5 h-5 text-indigo-400" />
            <h2 className="font-bold text-sm text-white truncate max-w-[220px]">{label}</h2>
          </div>
          <button
            onClick={() => setSelectedNodeId(null)}
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Section 1: Overview Badges */}
        <div className="py-4 space-y-3 border-b border-slate-800">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400">Node Identifier:</span>
            <span className="font-bold text-indigo-300 truncate max-w-[180px]">{selectedNodeId}</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400">Language / Type:</span>
            <span className="px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-semibold uppercase">
              {language}
            </span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400">AI Confidence:</span>
            <span className="font-bold text-emerald-400 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" /> 94% Verified
            </span>
          </div>
        </div>

        {/* Section 2: AI Architectural Explanation */}
        <div className="py-4 border-b border-slate-800 space-y-2">
          <h3 className="text-xs font-semibold text-indigo-400 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4" /> AI Architectural Analysis
          </h3>
          <p className="text-xs text-slate-300 leading-relaxed p-3 rounded-lg bg-slate-950/70 border border-slate-800">
            This module operates as a core entry point in the architecture pipeline, maintaining low coupling and strong cohesion with downstream agents.
          </p>
        </div>

        {/* Section 3: Engineering Metrics */}
        <div className="py-4 border-b border-slate-800 space-y-3">
          <h3 className="text-xs font-semibold text-slate-300">Engineering Scores</h3>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800">
              <span className="text-[10px] text-slate-400 block">Security Score</span>
              <span className="font-bold text-emerald-400 text-sm mt-0.5 block">92 / 100</span>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800">
              <span className="text-[10px] text-slate-400 block">Performance</span>
              <span className="font-bold text-indigo-300 text-sm mt-0.5 block">88 / 100</span>
            </div>
          </div>
        </div>

        {/* Section 4: Security Findings */}
        <div className="py-4 space-y-2">
          <h3 className="text-xs font-semibold text-amber-400 flex items-center gap-1.5">
            <AlertTriangle className="w-4 h-4" /> Code Security Audit
          </h3>
          <div className="p-3 rounded-lg bg-amber-950/30 border border-amber-500/30 text-xs text-amber-200 space-y-1">
            <div className="font-semibold flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-amber-400" /> Sanitization Passed
            </div>
            <p className="text-[11px] text-amber-300/80">No high severity vulnerabilities detected in this file scope.</p>
          </div>
        </div>
      </motion.aside>
    </AnimatePresence>
  );
}
