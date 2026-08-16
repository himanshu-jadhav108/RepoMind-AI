import React from "react";

export default function RootLoading() {
  return (
    <div className="min-h-screen w-full bg-background text-foreground flex flex-col items-center justify-center p-6 font-sans">
      <div className="flex flex-col items-center space-y-4 max-w-sm text-center">
        {/* Animated Brand Ring */}
        <div className="relative flex items-center justify-center w-16 h-16">
          <div className="absolute inset-0 rounded-2xl border-2 border-copper/30 animate-ping opacity-30" />
          <div className="w-14 h-14 rounded-2xl bg-card border border-border flex items-center justify-center shadow-xl">
            <div className="w-6 h-6 rounded-full border-2 border-copper border-t-transparent animate-spin" />
          </div>
        </div>

        <div className="space-y-1">
          <h2 className="font-display font-bold text-lg text-foreground tracking-tight">
            Loading RepoMind <span className="text-copper">AI</span>
          </h2>
          <p className="font-mono text-xs text-muted-foreground">
            Synchronizing topology state & UI tokens...
          </p>
        </div>
      </div>
    </div>
  );
}
