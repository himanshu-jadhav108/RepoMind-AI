"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RefreshCw, Home, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";

export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log error to console for engineering triage without exposing raw stack to user
    console.error("RepoMind AI Root Application Error:", error);
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

      {/* Main Error Card */}
      <main className="flex-1 flex items-center justify-center p-6">
        <div className="max-w-lg w-full text-center space-y-6">
          <div className="inline-flex p-4 rounded-2xl bg-destructive/10 border border-destructive/30 text-destructive animate-pulse">
            <AlertTriangle className="w-12 h-12" />
          </div>

          <div className="space-y-2">
            <span className="font-mono text-xs uppercase px-2.5 py-1 rounded-md bg-destructive/15 text-destructive border border-destructive/30 font-semibold tracking-wider">
              Application Render Exception
            </span>
            <h1 className="text-3xl sm:text-4xl font-display font-bold tracking-tight text-foreground">
              Something went wrong
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground font-sans max-w-md mx-auto">
              Our autonomous recovery engine caught an unexpected application state. The incident has been logged for diagnosis.
            </p>
          </div>

          {error?.digest && (
            <div className="p-2.5 rounded-lg bg-card border border-border font-mono text-xs text-muted-foreground">
              Error Digest: <span className="text-foreground">{error.digest}</span>
            </div>
          )}

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Button
              onClick={() => reset()}
              variant="gradient"
              size="lg"
              className="w-full sm:w-auto gap-2 min-h-[44px] cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Try Again</span>
            </Button>
            <Link href="/" className="w-full sm:w-auto">
              <Button
                variant="outline"
                size="lg"
                className="w-full sm:w-auto gap-2 border-border text-foreground hover:bg-muted min-h-[44px]"
              >
                <Home className="w-4 h-4" />
                <span>Return to Homepage</span>
              </Button>
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-border py-4 text-center font-mono text-xs text-muted-foreground">
        RepoMind AI • Autonomous Recovery Boundary
      </footer>
    </div>
  );
}
