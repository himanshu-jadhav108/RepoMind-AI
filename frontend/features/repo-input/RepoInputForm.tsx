"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Github, Loader2, Sparkles, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { registerRepository, startAnalysisRun, startHackathonDemoRun } from "@/lib/api-client";
import { AnalysisLoadingOverlay } from "@/features/agent-dashboard/AnalysisLoadingOverlay";

export function RepoInputForm() {
  const router = useRouter();
  const [repoUrl, setRepoUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeRunId, setActiveRunId] = useState<string | null>(null);
  const [activeRepoUrl, setActiveRepoUrl] = useState<string>("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!repoUrl.trim()) return;

    setLoading(true);
    setError(null);

    try {
      // 1. Register repository
      const repo = await registerRepository(repoUrl.trim());
      // 2. Trigger multi-agent analysis run
      const run = await startAnalysisRun(repo.repo_id);
      // 3. Show cinematic loading overlay — it drives SSE and navigates on completion
      setActiveRepoUrl(repoUrl.trim());
      setActiveRunId(run.run_id);
    } catch (err: any) {
      setError(err.message || "Failed to trigger repository analysis.");
      setLoading(false);
    }
  };

  const handleStartDemoMode = async () => {
    setLoading(true);
    setError(null);
    try {
      const demo = await startHackathonDemoRun();
      const demoId = demo.run_id || `demo-hackathon-${Date.now()}`;
      setActiveRepoUrl("https://github.com/himanshu-jadhav108/RepoMind-AI (Hackathon Demo)");
      setActiveRunId(demoId);
    } catch (err: any) {
      setError(err.message || "Failed to initialize demo mode.");
      setLoading(false);
    }
  };

  const handleSampleClick = async (sampleUrl: string) => {
    setRepoUrl(sampleUrl);
    setLoading(true);
    setError(null);
    try {
      const repo = await registerRepository(sampleUrl);
      const run = await startAnalysisRun(repo.repo_id);
      setActiveRepoUrl(sampleUrl);
      setActiveRunId(run.run_id);
    } catch (err: any) {
      setError(err.message || "Failed to trigger repository analysis.");
      setLoading(false);
    }
  };

  // When overlay completes, navigate to workspace
  const handleOverlayComplete = () => {
    if (activeRunId) {
      router.push(`/analyze/${activeRunId}`);
    }
  };

  return (
    <>
      {/* Cinematic analysis loading overlay */}
      {activeRunId && (
        <AnalysisLoadingOverlay
          runId={activeRunId}
          repoUrl={activeRepoUrl}
          onComplete={handleOverlayComplete}
        />
      )}

      <div className="w-full max-w-2xl mx-auto space-y-4">
        {/* Prominent Hackathon Judge Demo Button */}
        <Button
          type="button"
          onClick={handleStartDemoMode}
          disabled={loading || !!activeRunId}
          variant="outline"
          size="lg"
          className="w-full gap-2.5 bg-graphite-panel border-2 border-copper/60 text-white hover:border-copper font-mono text-sm shadow-xl px-6 py-3.5 rounded-xl transition ring-1 ring-copper/30 cursor-pointer"
        >
          {loading && activeRepoUrl.includes("Demo") ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin text-copper" />
              <span className="font-bold">Initializing Multi-Agent Team Demo...</span>
            </>
          ) : (
            <>
              <Zap className="w-5 h-5 text-amber-400 animate-bounce" />
              <span className="font-bold">⚡ Hackathon Judge Demo Mode (Instant Pre-Analyzed Workspace)</span>
            </>
          )}
        </Button>

        {/* Repository GitHub Input Form */}
        <form onSubmit={handleSubmit} className="relative flex items-center font-mono">
          <div className="relative w-full">
            <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none text-graphite-muted">
              <Github className="w-5 h-5" />
            </div>
            <input
              type="url"
              value={repoUrl}
              onChange={(e) => setRepoUrl(e.target.value)}
              placeholder="Paste public GitHub URL (e.g. https://github.com/fastapi/fastapi)"
              required
              className="w-full h-14 pl-12 pr-36 rounded-xl bg-graphite-canvas text-sm text-foreground placeholder:text-graphite-muted focus:outline-none focus:ring-2 focus:ring-copper/50 border border-graphite-border transition-all"
            />
            <div className="absolute inset-y-1.5 right-1.5 flex items-center">
              <Button
                type="submit"
                disabled={loading || !!activeRunId}
                variant="gradient"
                size="lg"
                className="h-11 rounded-lg gap-2 cursor-pointer"
              >
                {loading && !activeRepoUrl.includes("Demo") ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Analyzing...</span>
                  </>
                ) : (
                  <>
                    <span>Analyze Repo</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </Button>
            </div>
          </div>
        </form>

        {error && (
          <div className="p-3 text-sm rounded-lg bg-destructive/10 border border-destructive/20 text-destructive font-mono">
            {error}
          </div>
        )}

        {/* Quick sample repo triggers for demo */}
        <div className="flex flex-wrap items-center justify-center gap-2 text-xs text-muted-foreground pt-2 font-mono">
          <span className="flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-primary" /> Try sample repos:
          </span>
          <button
            type="button"
            onClick={() => handleSampleClick("https://github.com/fastapi/fastapi")}
            disabled={loading}
            className="px-2.5 py-1 rounded-md bg-secondary hover:bg-secondary/80 text-foreground transition cursor-pointer"
          >
            fastapi/fastapi
          </button>
          <button
            type="button"
            onClick={() => handleSampleClick("https://github.com/psf/black")}
            disabled={loading}
            className="px-2.5 py-1 rounded-md bg-secondary hover:bg-secondary/80 text-foreground transition cursor-pointer"
          >
            psf/black
          </button>
          <button
            type="button"
            onClick={() => handleSampleClick("https://github.com/expressjs/express")}
            disabled={loading}
            className="px-2.5 py-1 rounded-md bg-secondary hover:bg-secondary/80 text-foreground transition cursor-pointer"
          >
            expressjs/express
          </button>
        </div>
      </div>
    </>
  );
}
