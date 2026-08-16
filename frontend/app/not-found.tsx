"use client";

import React from "react";
import Link from "next/link";
import { Compass, Home, Zap, ArrowRight, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";

export default function NotFound() {
  return (
    <div className="min-h-screen w-full bg-background text-foreground flex flex-col justify-between font-sans selection:bg-primary selection:text-primary-foreground">
      {/* Top Header */}
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

      {/* Main 404 Content */}
      <main className="flex-1 flex items-center justify-center p-6">
        <div className="max-w-lg w-full text-center space-y-6">
          <div className="inline-flex p-4 rounded-2xl bg-copper/10 border border-copper/30 text-copper animate-agent-pulse">
            <Compass className="w-12 h-12" />
          </div>

          <div className="space-y-2">
            <span className="font-mono text-xs uppercase px-2.5 py-1 rounded-md bg-category-arch/15 text-category-arch border border-category-arch/30 font-semibold tracking-wider">
              HTTP 404 • Topology Route Not Found
            </span>
            <h1 className="text-3xl sm:text-4xl font-display font-bold tracking-tight text-foreground">
              Repository Route Lost in Space
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground font-sans max-w-md mx-auto">
              The requested repository analysis, page route, or asset could not be located in RepoMind AI&apos;s Knowledge Graph index.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-card border border-border text-left font-mono text-xs space-y-2 text-muted-foreground">
            <div className="flex items-center gap-2 text-foreground font-semibold">
              <ShieldAlert className="w-4 h-4 text-copper" />
              <span>Recommended Next Steps:</span>
            </div>
            <ul className="list-disc list-inside space-y-1 text-[11px]">
              <li>Verify the GitHub repository URL or Run ID format.</li>
              <li>Launch a new multi-agent static & architectural audit.</li>
              <li>Or explore our pre-cached Hackathon Judge Demo workspace.</li>
            </ul>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Link href="/" className="w-full sm:w-auto">
              <Button variant="gradient" size="lg" className="w-full sm:w-auto gap-2 min-h-[44px]">
                <Home className="w-4 h-4" />
                <span>Return to Homepage</span>
              </Button>
            </Link>
            <Link href="/analyze/demo-hackathon-workspace" className="w-full sm:w-auto">
              <Button variant="outline" size="lg" className="w-full sm:w-auto gap-2 border-copper/40 text-foreground hover:bg-copper/10 min-h-[44px]">
                <Zap className="w-4 h-4 text-amber-500" />
                <span>Open Demo Workspace</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-border py-4 text-center font-mono text-xs text-muted-foreground">
        RepoMind AI • Autonomous Multi-Agent Engineering Architecture
      </footer>
    </div>
  );
}
