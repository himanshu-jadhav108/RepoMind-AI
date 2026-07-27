"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Sparkles, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AgentTimeline } from "@/features/agent-dashboard/AgentTimeline";
import { HealthScoreCard } from "@/features/agent-dashboard/HealthScoreCard";
import { KnowledgeGraph } from "@/features/architecture-graph/KnowledgeGraph";
import { FindingsWorkspace } from "@/features/findings-panels/FindingsWorkspace";
import { CodeViewer } from "@/features/code-viewer/CodeViewer";
import { getAnalysisRunStatus, getAnalysisFindings, getHealthScore } from "@/lib/api-client";
import { Finding, HealthScore, AgentStatus } from "@/types";

export default function AnalyzeWorkspacePage({
  params,
}: {
  params: { runId: string };
}) {
  const runId = params.runId;
  const [agents, setAgents] = useState<AgentStatus[]>([
    { name: "planner_agent", status: "completed" },
    { name: "repository_analyzer", status: "completed" },
    { name: "architect_agent", status: "completed" },
    { name: "bug_hunter_agent", status: "completed" },
    { name: "security_agent", status: "completed" },
    { name: "reviewer_agent", status: "completed" },
    { name: "report_generator", status: "completed" },
  ]);
  const [findings, setFindings] = useState<Finding[]>([]);
  const [healthScore, setHealthScore] = useState<HealthScore | null>(null);
  const [selectedFile, setSelectedFile] = useState<string>("backend/app/main.py");
  const [selectedLine, setSelectedLine] = useState<number | undefined>(undefined);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [statusData, findingsData, scoreData] = await Promise.allSettled([
          getAnalysisRunStatus(runId),
          getAnalysisFindings(runId),
          getHealthScore(runId),
        ]);

        if (statusData.status === "fulfilled" && statusData.value.agents) {
          setAgents(statusData.value.agents);
        }
        if (findingsData.status === "fulfilled" && findingsData.value.data) {
          setFindings(findingsData.value.data);
        }
        if (scoreData.status === "fulfilled") {
          setHealthScore(scoreData.value);
        }
      } catch (e) {
        console.error("Error fetching analysis workspace data:", e);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
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
        <AgentTimeline agents={agents} executionRationale="Sequential static analysis followed by parallel AI review pass." />
        <HealthScoreCard healthScore={healthScore} />
      </div>

      {/* Grid Row 2: Knowledge Graph */}
      <KnowledgeGraph onNodeClick={(nodeId) => setSelectedFile(nodeId)} />

      {/* Grid Row 3: Findings Workspace & Code Viewer */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <FindingsWorkspace
          findings={findings.length > 0 ? findings : [
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
            }
          ]}
          onSelectFinding={handleSelectFinding}
        />
        <CodeViewer filePath={selectedFile} runId={runId} targetLine={selectedLine} />
      </div>
    </div>
  );
}
