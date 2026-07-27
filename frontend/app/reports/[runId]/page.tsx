export default function ReportPage({
  params,
}: {
  params: { runId: string };
}) {
  return (
    <div className="p-8 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold mb-2">Final Engineering Audit Report</h1>
      <p className="text-muted-foreground mb-6">Run ID: {params.runId}</p>
      <div className="p-6 rounded-xl glass-card border border-border">
        <p className="text-sm">Consolidated report viewer and export page placeholder.</p>
      </div>
    </div>
  );
}
