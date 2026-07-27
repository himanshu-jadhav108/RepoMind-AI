import Link from "next/link";

export default function HomePage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-4 text-center bg-gradient-to-b from-background via-card to-background">
      <div className="inline-flex items-center gap-2 px-3 py-1 text-xs font-semibold rounded-full bg-primary/10 text-primary border border-primary/20 mb-6">
        <span>🚀 RepoMind AI Phase 1 Skeleton Ready</span>
      </div>
      <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-purple-400 via-pink-400 to-indigo-400 max-w-3xl mb-4">
        Autonomous AI Engineering Team for Any Repository
      </h1>
      <p className="text-muted-foreground text-lg sm:text-xl max-w-2xl mb-8">
        Delegate codebase analysis, security triage, architecture visualization, and documentation writing to a multi-agent AI pipeline.
      </p>
      <div className="flex gap-4">
        <Link
          href="/analyze/demo-run"
          className="px-6 py-3 rounded-lg font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition"
        >
          Explore Demo Workspace
        </Link>
      </div>
    </div>
  );
}
