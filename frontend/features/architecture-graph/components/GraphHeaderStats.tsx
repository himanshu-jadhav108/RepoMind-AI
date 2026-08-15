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
    <div className="w-full bg-graphite-panel border-b border-graphite-border p-3 backdrop-blur-xl">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 text-xs font-mono">
        {/* Metric 1 */}
        <div className="p-2 min-h-[44px] rounded-lg bg-graphite-canvas border border-graphite-border flex items-center gap-2.5">
          <div className="p-1.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <Activity className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[10px] text-graphite-muted block">Overall Health</span>
            <span className="font-bold text-emerald-400 text-xs">{health}%</span>
          </div>
        </div>

        {/* Metric 2: Security Severity Red */}
        <div className="p-2 min-h-[44px] rounded-lg bg-graphite-canvas border border-graphite-border flex items-center gap-2.5">
          <div className="p-1.5 rounded bg-severity-critical/10 text-severity-critical border border-severity-critical/20">
            <ShieldAlert className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[10px] text-graphite-muted block">Security Rating</span>
            <span className="font-bold text-severity-critical text-xs">{security}%</span>
          </div>
        </div>

        {/* Metric 3: Performance Warning Amber */}
        <div className="p-2 min-h-[44px] rounded-lg bg-graphite-canvas border border-graphite-border flex items-center gap-2.5">
          <div className="p-1.5 rounded bg-severity-warning/10 text-severity-warning border border-severity-warning/20">
            <Zap className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[10px] text-graphite-muted block">Performance</span>
            <span className="font-bold text-severity-warning text-xs">{performance}%</span>
          </div>
        </div>

        {/* Metric 4: Doc Coverage Green */}
        <div className="p-2 min-h-[44px] rounded-lg bg-graphite-canvas border border-graphite-border flex items-center gap-2.5">
          <div className="p-1.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <BookOpen className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[10px] text-graphite-muted block">Doc Coverage</span>
            <span className="font-bold text-emerald-400 text-xs">{docs}%</span>
          </div>
        </div>

        {/* Metric 5 */}
        <div className="p-2 min-h-[44px] rounded-lg bg-graphite-canvas border border-graphite-border flex items-center gap-2.5">
          <div className="p-1.5 rounded bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <AlertOctagon className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[10px] text-graphite-muted block">Circular Deps</span>
            <span className={`font-bold text-xs ${circular > 0 ? "text-rose-400" : "text-emerald-400"}`}>
              {circular} detected
            </span>
          </div>
        </div>

        {/* Metric 6: Category A Steel Slate Blue */}
        <div className="p-2 min-h-[44px] rounded-lg bg-graphite-canvas border border-graphite-border flex items-center gap-2.5">
          <div className="p-1.5 rounded bg-[#5B82A6]/10 text-[#5B82A6] border border-[#5B82A6]/20">
            <Cpu className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[10px] text-graphite-muted block">Dead Files</span>
            <span className="font-bold text-white text-xs">{dead} files</span>
          </div>
        </div>
      </div>
    </div>
  );
}
