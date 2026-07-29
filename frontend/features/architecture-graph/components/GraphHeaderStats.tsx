"use client";

import React from "react";
import { ShieldAlert, Zap, BookOpen, AlertOctagon, Cpu, Activity } from "lucide-react";

interface GraphHeaderStatsProps {
  stats?: {
    overallHealth?: number;
    securityScore?: number;
    performanceScore?: number;
    docCoverage?: number;
    circularDeps?: number;
    deadFiles?: number;
  };
}

export function GraphHeaderStats({ stats }: GraphHeaderStatsProps) {
  const health = stats?.overallHealth || 88;
  const security = stats?.securityScore || 92;
  const performance = stats?.performanceScore || 85;
  const docs = stats?.docCoverage || 90;
  const circular = stats?.circularDeps || 0;
  const dead = stats?.deadFiles || 0;

  return (
    <div className="w-full bg-slate-950/80 border-b border-border/80 p-3 backdrop-blur-xl">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 text-xs font-mono">
        {/* Metric 1 */}
        <div className="p-2 rounded-lg bg-slate-900/80 border border-slate-800 flex items-center gap-2.5">
          <div className="p-1.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <Activity className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 block">Overall Health</span>
            <span className="font-bold text-emerald-400 text-xs">{health}%</span>
          </div>
        </div>

        {/* Metric 2 */}
        <div className="p-2 rounded-lg bg-slate-900/80 border border-slate-800 flex items-center gap-2.5">
          <div className="p-1.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <ShieldAlert className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 block">Security Rating</span>
            <span className="font-bold text-indigo-300 text-xs">{security}%</span>
          </div>
        </div>

        {/* Metric 3 */}
        <div className="p-2 rounded-lg bg-slate-900/80 border border-slate-800 flex items-center gap-2.5">
          <div className="p-1.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Zap className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 block">Performance</span>
            <span className="font-bold text-amber-300 text-xs">{performance}%</span>
          </div>
        </div>

        {/* Metric 4 */}
        <div className="p-2 rounded-lg bg-slate-900/80 border border-slate-800 flex items-center gap-2.5">
          <div className="p-1.5 rounded bg-sky-500/10 text-sky-400 border border-sky-500/20">
            <BookOpen className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 block">Doc Coverage</span>
            <span className="font-bold text-sky-300 text-xs">{docs}%</span>
          </div>
        </div>

        {/* Metric 5 */}
        <div className="p-2 rounded-lg bg-slate-900/80 border border-slate-800 flex items-center gap-2.5">
          <div className="p-1.5 rounded bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <AlertOctagon className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 block">Circular Deps</span>
            <span className={`font-bold text-xs ${circular > 0 ? "text-rose-400" : "text-emerald-400"}`}>
              {circular} detected
            </span>
          </div>
        </div>

        {/* Metric 6 */}
        <div className="p-2 rounded-lg bg-slate-900/80 border border-slate-800 flex items-center gap-2.5">
          <div className="p-1.5 rounded bg-purple-500/10 text-purple-400 border border-purple-500/20">
            <Cpu className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 block">Dead Files</span>
            <span className="font-bold text-slate-300 text-xs">{dead} files</span>
          </div>
        </div>
      </div>
    </div>
  );
}
