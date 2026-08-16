"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { AlertOctagon, RefreshCw, ArrowLeft, Zap, Layers } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";

export default function AnalysisRunError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("RepoMind AI Analysis Page Error:", error);
  }, [error]);

  return (
    <div className="min-h-screen w-full bg-background text-foreground flex flex-col justify-between font-sans">
      {/* Header */}
      <header className="w-full border-b border-border bg-card/60 backdrop-blur-md px-6 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-lg bg-copper/15 border border-copper/30 flex items-center justify-center text-copper font-mono font-bold text-sm group-hover:scale-105 transition">
            RM
          </div>
          <span className="font-display font-bold text-base tracking-tight text-foreground">
            RepoMind <span className="text-copper">AI</span>
          </span>
        </Link>
        <ThemeToggle />
      </header>

      {/* Main Error Box */}
      <main className="flex-1 flex items-center justify-center p-6">
        <div className="max-w-lg w-full text-center space-y-6">
          <div className="inline-flex p-4 rounded-2xl bg-severity-warning/10 border border-severity-warning/30 text-severity-warning">
            <AlertOctagon className="w-12 h-12" />
          </div>

          <div className="space-y-2">
            <span className="font-mono text-xs uppercase px-2.5 py-1 rounded-md bg-severity-warning/15 text-severity-warning border border-severity-warning/30 font-semibold tracking-wider">
              Analysis Execution Unreachable
            </span>
            <h1 className="text-2xl sm:text-3xl font-display font-bold tracking-tight text-foreground">
              Unable to Load Repository Analysis
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground font-sans max-w-md mx-auto">
              We couldn&apos;t load this analysis workspace. The run may not exist, the multi-agent pipeline may have encountered an unhandled exception, or the backend service is currently waking up from sleep.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Button
              onClick={() => reset()}
              variant="gradient"
              size="lg"
              className="w-full sm:w-auto gap-2 min-h-[44px] cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Retry Loading</span>
            </Button>
            <Link href="/" className="w-full sm:w-auto">
              <Button
                variant="outline"
                size="lg"
                className="w-full sm:w-auto gap-2 border-border text-foreground hover:bg-muted min-h-[44px]"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Submit New Repo</span>
              </Button>
            </Link>
            <Link href="/analyze/demo-hackathon-workspace" className="w-full sm:w-auto">
              <Button
                variant="outline"
                size="lg"
                className="w-full sm:w-auto gap-2 border-copper/40 text-foreground hover:bg-copper/10 min-h-[44px]"
              >
                <Zap className="w-4 h-4 text-amber-500" />
                <span>Open Demo</span>
              </Button>
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-border py-4 text-center font-mono text-xs text-muted-foreground">
        RepoMind AI • Analysis Workspace Error Boundary
      </footer>
    </div>
  );
}
