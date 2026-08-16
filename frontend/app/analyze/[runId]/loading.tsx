"use client";

import React, { useEffect, useState } from "react";
import { Sparkles, Layers, Cpu, Info } from "lucide-react";

export default function AnalysisWorkspaceLoading() {
  const [isSlowColdStart, setIsSlowColdStart] = useState(false);

  useEffect(() => {
    // 5-second cold-start advisory timer for Render free-tier containers
    const timer = setTimeout(() => {
      setIsSlowColdStart(true);
    }, 5000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen w-full bg-background text-foreground flex flex-col justify-between font-sans">
      {/* Top Header Placeholder */}
      <div className="w-full border-b border-border bg-card/60 backdrop-blur-md px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-copper/15 border border-copper/30 flex items-center justify-center text-copper font-mono font-bold text-sm">
            RM
          </div>
          <div className="h-4 w-32 bg-muted rounded animate-pulse" />
        </div>
        <div className="h-8 w-24 bg-muted rounded animate-pulse" />
      </div>

      {/* Main Skeleton Grid */}
      <div className="flex-1 max-w-7xl w-full mx-auto p-6 space-y-6 flex flex-col justify-center">
        {/* Cold-Start Advisory Banner (appears only on requests taking > 5s) */}
        {isSlowColdStart && (
          <div className="p-3.5 rounded-xl bg-card border border-copper/30 text-foreground font-mono text-xs flex items-center gap-3 shadow-lg animate-in fade-in duration-300 max-w-2xl mx-auto">
            <Info className="w-4 h-4 text-copper shrink-0" />
            <span className="text-muted-foreground">
              <strong className="text-foreground">Waking up the analysis engine</strong> — this can take up to 30 seconds on the first request after a period of inactivity on free-tier hosting.
            </span>
          </div>
        )}

        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-card border border-border shadow-xl">
            <div className="w-7 h-7 rounded-full border-2 border-copper border-t-transparent animate-spin" />
          </div>
          <div>
            <h2 className="font-display font-bold text-xl text-foreground">
              Initializing Autonomous Workspace
            </h2>
            <p className="font-mono text-xs text-muted-foreground mt-1">
              Hydrating 3D topology graph, agent findings & architecture metrics...
            </p>
          </div>
        </div>

        {/* Skeleton Panels */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl mx-auto w-full opacity-60">
          <div className="p-4 rounded-xl bg-card border border-border space-y-3">
            <div className="h-4 w-28 bg-muted rounded animate-pulse" />
            <div className="h-16 bg-muted/50 rounded animate-pulse" />
          </div>
          <div className="p-4 rounded-xl bg-card border border-border space-y-3">
            <div className="h-4 w-32 bg-muted rounded animate-pulse" />
            <div className="h-16 bg-muted/50 rounded animate-pulse" />
          </div>
          <div className="p-4 rounded-xl bg-card border border-border space-y-3">
            <div className="h-4 w-24 bg-muted rounded animate-pulse" />
            <div className="h-16 bg-muted/50 rounded animate-pulse" />
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="w-full border-t border-border py-4 text-center font-mono text-xs text-muted-foreground">
        RepoMind AI • Autonomous Engineering Platform
      </footer>
    </div>
  );
}
