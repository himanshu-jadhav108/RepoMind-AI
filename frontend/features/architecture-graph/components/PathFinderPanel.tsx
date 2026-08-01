"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  GitBranch,
  ArrowRight,
  Search,
  CheckCircle2,
  X,
  Layers,
  FileCode,
  Database,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PathFinderResult } from "@/types";
import { getDependencyPath } from "@/lib/api-client";

interface PathFinderPanelProps {
  runId: string;
  availableNodes?: string[];
  onClose?: () => void;
}

const DEFAULT_NODES = [
  "frontend/app/page.tsx",
  "frontend/lib/api-client.ts",
  "backend/app/api/v1/routes_analysis.py",
  "backend/app/services/analysis_service.py",
  "backend/app/repositories/supabase_analysis_repository.py",
  "backend/app/orchestration/graph.py",
  "backend/app/core/security.py",
  "Supabase PostgreSQL DB",
];

export function PathFinderPanel({ runId, availableNodes, onClose }: PathFinderPanelProps) {
  const nodeList = availableNodes && availableNodes.length > 0 ? availableNodes : DEFAULT_NODES;

  const [source, setSource] = useState<string>(nodeList[0] || "frontend/app/page.tsx");
  const [target, setTarget] = useState<string>(nodeList[nodeList.length - 1] || "Supabase PostgreSQL DB");
  const [pathResult, setPathResult] = useState<PathFinderResult | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const handleTrace = async () => {
    try {
      setLoading(true);
      const res = await getDependencyPath(runId, source, target);
      setPathResult(res);
    } catch (e) {
      console.error("Failed to trace path:", e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="absolute bottom-4 left-4 z-40 max-w-lg w-full font-sans">
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        className="rounded-2xl border border-indigo-500/40 bg-slate-950/95 shadow-2xl p-4 backdrop-blur-2xl space-y-4 selection:bg-indigo-500 selection:text-white"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-indigo-600 text-white shadow-md">
              <GitBranch className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-white font-mono flex items-center gap-1.5">
                <span>Dependency Path Finder</span>
                <Badge className="bg-indigo-950/80 text-indigo-300 border-indigo-500/40 text-[10px] font-mono">
                  Layer Tracer
                </Badge>
              </h4>
            </div>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-7 w-7 p-0 text-slate-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Source & Target Dropdowns */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono">
          <div>
            <label className="block text-[11px] text-indigo-300 mb-1 font-semibold">
              Source Module / Component:
            </label>
            <select
              value={source}
              onChange={(e) => setSource(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 text-slate-200 rounded-lg p-2 focus:outline-none focus:border-indigo-500 truncate"
            >
              {nodeList.map((n, i) => (
                <option key={i} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] text-purple-300 mb-1 font-semibold">
              Target Module / Database:
            </label>
            <select
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 text-slate-200 rounded-lg p-2 focus:outline-none focus:border-purple-500 truncate"
            >
              {nodeList.map((n, i) => (
                <option key={i} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </div>
        </div>

        <Button
          variant="gradient"
          size="sm"
          onClick={handleTrace}
          disabled={loading}
          className="w-full h-8 text-xs font-mono gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30"
        >
          {loading ? (
            "Computing Shortest Path..."
          ) : (
            <>
              <GitBranch className="w-3.5 h-3.5" /> Visualize Dependency Path
            </>
          )}
        </Button>

        {/* Path Result Trace Timeline */}
        {pathResult && pathResult.steps && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="space-y-2 border-t border-slate-800 pt-3"
          >
            <div className="text-[11px] text-slate-300 font-mono flex items-center justify-between">
              <span>Path Hops: {pathResult.hop_count}</span>
              <Badge className="bg-emerald-950 text-emerald-300 border-emerald-500/40 text-[10px]">
                Valid Inverted Path
              </Badge>
            </div>

            <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1 font-mono text-xs">
              {pathResult.steps.map((step, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-2 p-2 rounded-lg bg-slate-900/80 border border-slate-800/80"
                >
                  <div className="w-5 h-5 rounded-full bg-indigo-950 text-indigo-400 border border-indigo-500/40 flex items-center justify-center text-[10px] font-bold shrink-0">
                    {idx + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-white truncate">{step.node}</div>
                    <div className="text-[10px] text-slate-400 flex items-center gap-1">
                      <Badge variant="outline" className="text-[9px] border-slate-700 py-0 px-1">
                        {step.layer}
                      </Badge>
                      <span className="truncate">{step.description}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
