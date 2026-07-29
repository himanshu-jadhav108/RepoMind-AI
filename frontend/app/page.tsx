import Link from "next/link";
import { Sparkles, ShieldCheck, Cpu, Code2, Layers, GitBranch, ArrowRight } from "lucide-react";
import { RepoInputForm } from "@/features/repo-input/RepoInputForm";
import { Badge } from "@/components/ui/badge";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background flex flex-col selection:bg-primary selection:text-primary-foreground">
      {/* Navigation Header */}
      <header className="w-full border-b border-border/80 glass-panel sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img
              src="/RepoMind_AI_logo.jpeg"
              alt="RepoMind AI Logo"
              className="w-8 h-8 rounded-lg object-cover shadow-md shadow-purple-500/20 border border-purple-500/30"
            />
            <span className="font-extrabold text-lg tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-purple-400 via-pink-400 to-indigo-400">
              RepoMind AI
            </span>
          </div>

          <div className="flex items-center gap-4">
            <Badge variant="outline" className="hidden sm:inline-flex border-purple-500/30 text-purple-300">
              Multi-Agent Engine
            </Badge>
            <a
              href="https://github.com/himanshu-jadhav108/RepoMind-AI"
              target="_blank"
              rel="noreferrer"
              className="text-xs text-muted-foreground hover:text-foreground transition"
            >
              GitHub Docs
            </a>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 pt-16 pb-20 text-center relative overflow-hidden">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-purple-600/15 rounded-full blur-[120px] pointer-events-none" />

        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full glass-panel border border-primary/30 text-xs font-semibold text-primary mb-8 shadow-inner">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Autonomous Multi-Agent AI Engineering Workspace</span>
        </div>

        <h1 className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight max-w-4xl mb-6 bg-clip-text text-transparent bg-gradient-to-b from-foreground via-foreground/90 to-muted-foreground">
          Turn Any Repository into a Fully Explained Engineering Artifact
        </h1>

        <p className="text-muted-foreground text-base sm:text-xl max-w-2xl mb-10 leading-relaxed">
          Delegate codebase analysis, security triage, architecture visualization, and documentation writing to a team of 10 specialized AI agents.
        </p>

        {/* Repository Input Form Component */}
        <RepoInputForm />

        {/* Feature Cards Grid */}
        <div className="max-w-6xl w-full grid grid-cols-1 md:grid-cols-3 gap-6 mt-24 text-left">
          <div className="p-6 rounded-xl glass-card space-y-3">
            <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-400 border border-purple-500/20">
              <Cpu className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-semibold">Repository Knowledge Graph</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Interactive NetworkX dependency graph mapping file structures, module imports, class hierarchies, and symbol calls via React Flow.
            </p>
          </div>

          <div className="p-6 rounded-xl glass-card space-y-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400 border border-emerald-500/20">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-semibold">Reviewer Agent Quality Gate</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Built-in self-correction loop (Review → Feedback → Rewrite → Validate → Approve) filtering low-confidence AI claims before display.
            </p>
          </div>

          <div className="p-6 rounded-xl glass-card space-y-3">
            <div className="w-10 h-10 rounded-lg bg-sky-500/10 flex items-center justify-center text-sky-400 border border-sky-500/20">
              <GitBranch className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-semibold">Explainability by Default</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Every finding carries explicit reasoning, confidence scores, AST evidence snippets, and referenced files so users can verify conclusions.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-border/80 py-6 text-center text-xs text-muted-foreground">
        <p>RepoMind AI — Built with Next.js, FastAPI, LangGraph & Supabase.</p>
      </footer>
    </div>
  );
}
