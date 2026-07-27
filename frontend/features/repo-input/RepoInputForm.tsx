"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Github, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { registerRepository, startAnalysisRun } from "@/lib/api-client";

export function RepoInputForm() {
  const router = useRouter();
  const [repoUrl, setRepoUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      // 3. Navigate to live analysis workspace
      router.push(`/analyze/${run.run_id}`);
    } catch (err: any) {
      setError(err.message || "Failed to trigger repository analysis.");
      setLoading(false);
    }
  };

  const handleSampleClick = (sampleUrl: string) => {
    setRepoUrl(sampleUrl);
  };

  return (
    <div className="w-full max-w-2xl mx-auto space-y-4">
      <form onSubmit={handleSubmit} className="relative flex items-center">
        <div className="relative w-full">
          <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none text-muted-foreground">
            <Github className="w-5 h-5" />
          </div>
          <input
            type="url"
            value={repoUrl}
            onChange={(e) => setRepoUrl(e.target.value)}
            placeholder="Paste public GitHub URL (e.g. https://github.com/fastapi/fastapi)"
            required
            className="w-full h-14 pl-12 pr-36 rounded-xl glass-panel text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 border border-border/80 transition-all"
          />
          <div className="absolute inset-y-1.5 right-1.5 flex items-center">
            <Button
              type="submit"
              disabled={loading}
              variant="gradient"
              size="lg"
              className="h-11 rounded-lg gap-2"
            >
              {loading ? (
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
        <div className="p-3 text-sm rounded-lg bg-destructive/10 border border-destructive/20 text-destructive">
          {error}
        </div>
      )}

      {/* Quick sample repo triggers for demo */}
      <div className="flex flex-wrap items-center justify-center gap-2 text-xs text-muted-foreground pt-2">
        <span className="flex items-center gap-1">
          <Sparkles className="w-3.5 h-3.5 text-primary" /> Try sample repos:
        </span>
        <button
          type="button"
          onClick={() => handleSampleClick("https://github.com/fastapi/fastapi")}
          className="px-2.5 py-1 rounded-md bg-secondary hover:bg-secondary/80 text-foreground transition"
        >
          fastapi/fastapi
        </button>
        <button
          type="button"
          onClick={() => handleSampleClick("https://github.com/psf/black")}
          className="px-2.5 py-1 rounded-md bg-secondary hover:bg-secondary/80 text-foreground transition"
        >
          psf/black
        </button>
        <button
          type="button"
          onClick={() => handleSampleClick("https://github.com/expressjs/express")}
          className="px-2.5 py-1 rounded-md bg-secondary hover:bg-secondary/80 text-foreground transition"
        >
          expressjs/express
        </button>
      </div>
    </div>
  );
}
