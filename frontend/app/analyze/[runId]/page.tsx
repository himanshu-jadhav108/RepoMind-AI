"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { ArrowLeft, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AgentTimeline } from "@/features/agent-dashboard/AgentTimeline";
import { HealthScoreCard } from "@/features/agent-dashboard/HealthScoreCard";
import { KnowledgeGraph } from "@/features/architecture-graph/KnowledgeGraph";
import { FindingsWorkspace } from "@/features/findings-panels/FindingsWorkspace";
import { CodeViewer } from "@/features/code-viewer/CodeViewer";
import {
  getAnalysisRunStatus,
  getAnalysisFindings,
  getHealthScore,
  getKnowledgeGraph,
} from "@/lib/api-client";
import { Finding, HealthScore, AgentStatus, KnowledgeGraphData } from "@/types";

// Agents start as "queued" — SSE updates each to "running" then "completed" in real-time
const INITIAL_AGENT_STATUSES: AgentStatus[] = [
  { name: "planner_agent", status: "queued" },
  { name: "repository_analyzer", status: "queued" },
  { name: "architect_agent", status: "queued" },
  { name: "bug_hunter_agent", status: "queued" },
  { name: "security_agent", status: "queued" },
  { name: "performance_agent", status: "queued" },
  { name: "documentation_agent", status: "queued" },
  { name: "feature_suggestion_agent", status: "queued" },
  { name: "reviewer_agent", status: "queued" },
  { name: "report_generator", status: "queued" },
];

const DEMO_FINDINGS: Finding[] = [
  {
    id: "demo-f1",
    category: "bug",
    severity: "medium",
    file: "backend/app/main.py",
    line_start: 40,
    line_end: 55,
    description: "Potential unhandled exception during route middleware invocation.",
    suggested_fix: "Add try-except block around middleware call.",
    reasoning: "AST parser identified unhandled exception path in HTTP middleware wrapper.",
    confidence: 0.85,
    evidence: "process_time_ms = round((time.time() - start_time) * 1000, 2)",
    referenced_files: ["backend/app/main.py"],
    review_status: "approved",
  },
];

export default function AnalyzeWorkspacePage({
  params,
}: {
  params: { runId: string };
}) {
  const runId = params.runId;

  const [agents, setAgents] = useState<AgentStatus[]>(INITIAL_AGENT_STATUSES);
  const [findings, setFindings] = useState<Finding[]>([]);
  const [healthScore, setHealthScore] = useState<HealthScore | null>(null);
  // P0-2 FIX: null = not yet fetched, empty object = fetched but no graph data
  const [graphData, setGraphData] = useState<KnowledgeGraphData | null>(null);
  const [selectedFile, setSelectedFile] = useState<string>("backend/app/main.py");
  const [selectedLine, setSelectedLine] = useState<number | undefined>(undefined);
  const [plannerRationale, setPlannerRationale] = useState<string>(
    "Multi-agent analysis running — sequential static analysis followed by parallel AI review pass."
  );

  // ----- fetchPostCompletionData defined FIRST so SSE useEffect can reference it -----
  // Called when SSE signals pipeline_complete — fetches all final persisted results.
  const fetchPostCompletionData = useCallback(async () => {
    try {
      const [findingsData, scoreData, graphResult] = await Promise.allSettled([
        getAnalysisFindings(runId),
        getHealthScore(runId),
        getKnowledgeGraph(runId),
      ]);

      if (findingsData.status === "fulfilled" && findingsData.value?.data) {
        setFindings(findingsData.value.data);
      }
      if (scoreData.status === "fulfilled") {
        setHealthScore(scoreData.value);
      }
      if (graphResult.status === "fulfilled") {
        setGraphData(graphResult.value);
      }
    } catch (e) {
      console.error("Error fetching post-completion data:", e);
    }
  }, [runId]);

  // P0-1 FIX: Connect to SSE endpoint to receive real-time agent status updates.
  // fetchPostCompletionData is defined above so the closure captures the stable reference.
  useEffect(() => {
    const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
    const sseUrl = `${API_BASE}/api/v1/analysis/${runId}/stream`;
    let eventSource: EventSource | null = null;

    try {
      eventSource = new EventSource(sseUrl);

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          if (data.event === "pipeline_complete") {
            // Pipeline finished — fetch persisted findings, health score, and graph
            fetchPostCompletionData();
            eventSource?.close();
            return;
          }

          if (data.event === "timeout") {
            eventSource?.close();
            return;
          }

          // Real agent status event from a LangGraph node
          if (data.agent && data.status) {
            setAgents((prev) => {
              const exists = prev.some((a) => a.name === data.agent);
              const updated = prev.map((a) =>
                a.name === data.agent ? { ...a, status: data.status } : a
              );
              // Append if this is a dynamic agent not in the initial list
              return exists ? updated : [...updated, { name: data.agent, status: data.status }];
            });
          }
        } catch {
          // Ignore malformed SSE frames
        }
      };

      eventSource.onerror = () => {
        eventSource?.close();
      };
    } catch {
      // SSE not available (e.g. during SSR) — fetchPostCompletionData will still run on mount fallback
    }

    return () => {
      eventSource?.close();
    };
  }, [runId, fetchPostCompletionData]);

  // Fetch initial run status and knowledge graph on mount (non-SSE data)
  useEffect(() => {
    async function fetchInitialData() {
      try {
        const [statusData, graphResult] = await Promise.allSettled([
          getAnalysisRunStatus(runId),
          getKnowledgeGraph(runId), // P0-2 FIX: real knowledge graph from backend
        ]);

        if (statusData.status === "fulfilled" && statusData.value?.agents) {
          setAgents(statusData.value.agents);
        }
        if (statusData.status === "fulfilled" && statusData.value?.execution_plan?.rationale) {
          setPlannerRationale(statusData.value.execution_plan.rationale);
        }

        // P0-2 FIX: Pass real graph data to KnowledgeGraph; empty = show demo fallback
        if (graphResult.status === "fulfilled") {
          setGraphData(graphResult.value);
        }
      } catch (e) {
        console.error("Error fetching initial workspace data:", e);
      }
    }

    fetchInitialData();
  }, [runId]);

  const handleSelectFinding = (file: string, line: number) => {
    setSelectedFile(file);
    setSelectedLine(line);
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-border pb-4">
        <div className="flex items-center gap-3">
          <Link href="/">
            <Button variant="outline" size="sm" className="gap-1.5 text-xs">
              <ArrowLeft className="w-4 h-4" /> Back to Search
            </Button>
          </Link>
          <div>
            <h1 className="text-xl font-bold flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              <span>Live Engineering Workspace</span>
            </h1>
            <p className="text-xs text-muted-foreground font-mono">Run ID: {runId}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link href={`/reports/${runId}`}>
            <Button variant="gradient" size="sm" className="gap-1.5 text-xs">
              View Consolidated Audit Report
            </Button>
          </Link>
        </div>
      </div>

      {/* Grid Row 1: Agent Timeline & Health Score Card */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <AgentTimeline agents={agents} executionRationale={plannerRationale} />
        <HealthScoreCard healthScore={healthScore} />
      </div>

      {/* Grid Row 2: Knowledge Graph — P0-2 FIX: real graphData from backend */}
      <KnowledgeGraph
        graphData={graphData}
        onNodeClick={(nodeId) => setSelectedFile(nodeId)}
      />

      {/* Grid Row 3: Findings Workspace & Code Viewer */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <FindingsWorkspace
          findings={findings.length > 0 ? findings : DEMO_FINDINGS}
          onSelectFinding={handleSelectFinding}
        />
        <CodeViewer filePath={selectedFile} runId={runId} targetLine={selectedLine} />
      </div>
    </div>
  );
}
