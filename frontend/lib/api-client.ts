import { Finding, HealthScore, RepoMetadata, KnowledgeGraphData } from "@/types";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export async function registerRepository(repoUrl: string): Promise<RepoMetadata> {
  const res = await fetch(`${API_BASE}/api/v1/repos`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ repo_url: repoUrl }),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error?.message || "Failed to register repository.");
  }

  return res.json();
}

export async function startAnalysisRun(repoId: string): Promise<{ run_id: string; status: string }> {
  const res = await fetch(`${API_BASE}/api/v1/analysis/run`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ repo_id: repoId }),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error?.message || "Failed to start analysis run.");
  }

  return res.json();
}

export async function getAnalysisRunStatus(runId: string) {
  const res = await fetch(`${API_BASE}/api/v1/analysis/${runId}`);
  if (!res.ok) throw new Error("Failed to fetch run status.");
  return res.json();
}

export async function getAnalysisFindings(
  runId: string,
  category?: string,
  severity?: string,
  reviewStatus?: string
): Promise<{ data: Finding[]; pagination: any }> {
  const params = new URLSearchParams();
  if (category) params.append("category", category);
  if (severity) params.append("severity", severity);
  if (reviewStatus) params.append("review_status", reviewStatus);

  const res = await fetch(`${API_BASE}/api/v1/analysis/${runId}/findings?${params.toString()}`);
  if (!res.ok) throw new Error("Failed to fetch findings.");
  return res.json();
}

export async function getHealthScore(runId: string): Promise<HealthScore> {
  const res = await fetch(`${API_BASE}/api/v1/analysis/${runId}/health-score`);
  if (!res.ok) throw new Error("Failed to fetch health score.");
  return res.json();
}

export async function getFinalReport(runId: string): Promise<{ run_id: string; report_markdown: string }> {
  const res = await fetch(`${API_BASE}/api/v1/analysis/${runId}/report`);
  if (!res.ok) throw new Error("Failed to fetch report.");
  return res.json();
}

export async function explainCodeSnippet(
  runId: string,
  file: string,
  lineStart: number,
  lineEnd: number,
  codeSnippet?: string
) {
  const res = await fetch(`${API_BASE}/api/v1/analysis/${runId}/explain`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      file,
      line_start: lineStart,
      line_end: lineEnd,
      code_snippet: codeSnippet,
    }),
  });
  if (!res.ok) throw new Error("Failed to generate code explanation.");
  return res.json();
}

// P0-2 FIX: Fetch the real Repository Knowledge Graph (React Flow format)
// built by the Repository Analyzer + NetworkX pipeline on the backend.
export async function getKnowledgeGraph(runId: string): Promise<KnowledgeGraphData> {
  try {
    const res = await fetch(`${API_BASE}/api/v1/analysis/${runId}/graph`);
    if (!res.ok) return { nodes: [], edges: [] };
    const data = await res.json();
    return (data.graph as KnowledgeGraphData) || { nodes: [], edges: [] };
  } catch {
    // Graceful degradation — KnowledgeGraph component falls back to demo nodes
    return { nodes: [], edges: [] };
  }
}
