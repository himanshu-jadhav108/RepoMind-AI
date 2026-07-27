export default function AnalyzeWorkspacePage({
  params,
}: {
  params: { runId: string };
}) {
  return (
    <div className="p-8 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold mb-2">Live Agent Workspace</h1>
      <p className="text-muted-foreground mb-6">Run ID: {params.runId}</p>
      <div className="p-6 rounded-xl glass-card border border-border">
        <p className="text-sm">Agent timeline and multi-panel findings workspace placeholder.</p>
      </div>
    </div>
  );
}
