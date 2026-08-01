"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { ArrowLeft, Sparkles, Users, Compass, GitBranch, Layers, GraduationCap, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AgentTimeline } from "@/features/agent-dashboard/AgentTimeline";
import { HealthScoreCard } from "@/features/agent-dashboard/HealthScoreCard";
import { KnowledgeGraph } from "@/features/architecture-graph/KnowledgeGraph";
import { FindingsWorkspace } from "@/features/findings-panels/FindingsWorkspace";
import { CodeViewer } from "@/features/code-viewer/CodeViewer";
import { EngineeringReviewMeeting } from "@/features/review-meeting/EngineeringReviewMeeting";
import { RepoCopilotChat } from "@/features/copilot-chat/RepoCopilotChat";
import { GuidedTourOverlay } from "@/features/architecture-graph/components/GuidedTourOverlay";
import { PathFinderPanel } from "@/features/architecture-graph/components/PathFinderPanel";
import { ArchitectureLayerSwimlanes } from "@/features/architecture-graph/components/ArchitectureLayerSwimlanes";
import { SmartLearningPanel } from "@/features/code-viewer/SmartLearningPanel";
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
    category: "security",
    severity: "critical",
    file: "backend/app/core/config.py",
    line_start: 18,
    line_end: 26,
    description: "CORS wildcard origin detected in production-mode configuration. Accepts requests from any domain, bypassing cross-origin protection.",
    suggested_fix: "Replace allow_origins=['*'] with an explicit allowlist of trusted origins loaded from environment variables.",
    reasoning: "Security Agent identified CORS_ORIGINS resolves to a wildcard in the default settings fallback. In production this exposes the API to CSRF attacks from arbitrary origins.",
    confidence: 0.96,
    evidence: "CORS_ORIGINS: list = [\"*\"]  # line 22 in config.py settings model",
    referenced_files: ["backend/app/core/config.py", "backend/app/main.py"],
    review_status: "approved",
  },
  {
    id: "demo-f2",
    category: "security",
    severity: "high",
    file: "backend/app/api/v1/routes_analysis.py",
    line_start: 574,
    line_end: 590,
    description: "No rate limiting on /analysis/run endpoint. An attacker can trigger unlimited concurrent LLM pipeline executions, exhausting all API quota and causing denial-of-service.",
    suggested_fix: "Implement per-IP rate limiting (max 1 run per 3 minutes) using a middleware or in-memory token bucket. Return HTTP 429 on excess requests.",
    reasoning: "The endpoint accepts POST with no authentication, session checking, or request throttling. It immediately spawns a full LangGraph pipeline for any caller.",
    confidence: 0.98,
    evidence: "POST /api/v1/analysis/run — no rate limit decorator or IP check in route handler",
    referenced_files: ["backend/app/api/v1/routes_analysis.py"],
    review_status: "rewritten_and_approved",
  },
  {
    id: "demo-f3",
    category: "bug",
    severity: "high",
    file: "backend/app/analysis_toolkit/git_ingestion.py",
    line_start: 65,
    line_end: 80,
    description: "Repository size validation runs AFTER cloning completes. A 499MB repository will exhaust container RAM before the size check fires.",
    suggested_fix: "Use GitHub API to pre-validate repository size via /repos/{owner}/{repo} before initiating git clone.",
    reasoning: "check_repo_size() walks the cloned directory after Repo.clone_from() completes. On Render's 512MB free-tier container, a near-limit repo will OOM-kill the process before this check runs.",
    confidence: 0.92,
    evidence: "check_repo_size() called after clone_with_timeout() in analyze_repository()",
    referenced_files: ["backend/app/analysis_toolkit/git_ingestion.py"],
    review_status: "approved",
  },
  {
    id: "demo-f4",
    category: "performance",
    severity: "high",
    file: "backend/app/analysis_toolkit/context_builder.py",
    line_start: 1,
    line_end: 50,
    description: "Context builder is limited to max_files=7 per agent call. For repositories with 100+ files, agents analyze only 7 files and report as if the full codebase was reviewed.",
    suggested_fix: "Implement tiered file selection using NetworkX centrality scores — pass top-K files by degree centrality to ensure agents see the most architecturally significant modules.",
    reasoning: "Context truncation at 7 files means agents may miss security vulnerabilities in peripheral modules. The pipeline claims to analyze 'the repository' but inspects <10% of large codebases.",
    confidence: 0.88,
    evidence: "max_files: int = 7 default in ContextBuilder.__init__()",
    referenced_files: ["backend/app/analysis_toolkit/context_builder.py"],
    review_status: "flagged_low_confidence",
  },
  {
    id: "demo-f5",
    category: "performance",
    severity: "medium",
    file: "backend/app/orchestration/graph.py",
    line_start: 45,
    line_end: 78,
    description: "LangGraph pipeline nodes run sequentially inside a single asyncio event loop. Architect, Bug Hunter, Security, and Performance agents could execute in parallel without state conflicts.",
    suggested_fix: "Refactor post-analyzer nodes to use asyncio.gather() with independent state partitions, reducing total pipeline execution time by an estimated 40-60%.",
    reasoning: "Each specialist agent reads from AnalysisState.repo_structure but writes to independent keys (security_findings, perf_findings). There is no write conflict that prevents parallel execution.",
    confidence: 0.83,
    evidence: "add_edge('repository_analyzer', 'architect_agent') — sequential, not parallel fan-out",
    referenced_files: ["backend/app/orchestration/graph.py"],
    review_status: "approved",
  },
  {
    id: "demo-f6",
    category: "architecture",
    severity: "medium",
    file: "backend/app/api/v1/routes_analysis.py",
    line_start: 348,
    line_end: 386,
    description: "Business logic (LearningAgent instantiation, file path resolution) is embedded directly in route handler functions instead of being delegated to the service layer.",
    suggested_fix: "Extract LearningAgent execution into AnalysisService.explain_code() method. Route handlers should only handle HTTP concerns: parsing, validation, and response formatting.",
    reasoning: "Clean Architecture principle violated: the API layer directly instantiates AI agents and resolves file paths. This creates untestable controller code and violates the dependency inversion principle.",
    confidence: 0.91,
    evidence: "learning_agent = LearningAgent(provider_router) inside explain_code_region route handler",
    referenced_files: ["backend/app/api/v1/routes_analysis.py", "backend/app/services/analysis_service.py"],
    review_status: "approved",
  },
  {
    id: "demo-f7",
    category: "bug",
    severity: "medium",
    file: "frontend/lib/api-client.ts",
    line_start: 104,
    line_end: 116,
    description: "getKnowledgeGraph() silently catches all errors and returns empty nodes/edges. If the backend graph endpoint fails, the UI shows a blank graph with no user notification.",
    suggested_fix: "Add an error state parameter to the return type. Propagate errors to the calling component so users see an actionable error message instead of an empty graph canvas.",
    reasoning: "The catch block returns { nodes: [], edges: [] } — identical to the empty-state result. The UI cannot distinguish 'graph not ready' from 'API call failed', leading to silent failures.",
    confidence: 0.94,
    evidence: "catch { return { nodes: [], edges: [] }; } in getKnowledgeGraph()",
    referenced_files: ["frontend/lib/api-client.ts", "frontend/features/architecture-graph/KnowledgeGraph.tsx"],
    review_status: "rewritten_and_approved",
  },
  {
    id: "demo-f8",
    category: "architecture",
    severity: "low",
    file: "backend/app/providers/provider_router.py",
    line_start: 17,
    line_end: 44,
    description: "Provider priority order is hardcoded as a class constant. Changing provider priority (e.g. switching to Groq-first during Gemini quota exhaustion) requires a code change and redeployment.",
    suggested_fix: "Load provider priority from environment variable PROVIDER_PRIORITY_ORDER. Allow runtime override via an admin API endpoint without requiring redeployment.",
    reasoning: "In a production system, provider priority should be tunable at runtime based on latency, cost, and quota metrics. Hardcoding the list reduces operational flexibility.",
    confidence: 0.79,
    evidence: "self._priority_list: List[str] = ['gemini', 'groq', 'openai', 'openrouter', 'huggingface']",
    referenced_files: ["backend/app/providers/provider_router.py"],
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
  const [findings, setFindings] = useState<Finding[]>(DEMO_FINDINGS);
  const [healthScore, setHealthScore] = useState<HealthScore | null>(null);
  const [graphData, setGraphData] = useState<KnowledgeGraphData | null>(null);
  const [selectedFile, setSelectedFile] = useState<string>("backend/app/main.py");
  const [selectedLine, setSelectedLine] = useState<number | undefined>(undefined);
  const [plannerRationale, setPlannerRationale] = useState<string>(
    "Multi-agent analysis running — sequential static analysis followed by parallel AI review pass."
  );

  // Feature Toggle States
  const [activeTab, setActiveTab] = useState<"workspace" | "meeting" | "layers" | "learning">("meeting");
  const [showGuidedTour, setShowGuidedTour] = useState<boolean>(false);
  const [showPathFinder, setShowPathFinder] = useState<boolean>(false);

  // ----- fetchPostCompletionData defined FIRST so SSE useEffect can reference it -----
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

  // Connect to SSE endpoint for live updates
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
            fetchPostCompletionData();
            eventSource?.close();
            return;
          }

          if (data.event === "timeout") {
            eventSource?.close();
            return;
          }

          if (data.agent && data.status) {
            setAgents((prev) => {
              const exists = prev.some((a) => a.name === data.agent);
              const updated = prev.map((a) =>
                a.name === data.agent ? { ...a, status: data.status } : a
              );
              return exists ? updated : [...updated, { name: data.agent, status: data.status }];
            });
          }
        } catch {
          // Ignore SSE frames
        }
      };

      eventSource.onerror = () => {
        eventSource?.close();
      };
    } catch {
      // Fallback
    }

    return () => {
      eventSource?.close();
    };
  }, [runId, fetchPostCompletionData]);

  // Fetch initial run status and knowledge graph
  useEffect(() => {
    async function fetchInitialData() {
      try {
        const [statusData, graphResult] = await Promise.allSettled([
          getAnalysisRunStatus(runId),
          getKnowledgeGraph(runId),
        ]);

        if (statusData.status === "fulfilled" && statusData.value?.agents) {
          setAgents(statusData.value.agents);
        }
        if (statusData.status === "fulfilled" && statusData.value?.execution_plan?.rationale) {
          setPlannerRationale(statusData.value.execution_plan.rationale);
        }

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
    <div className="min-h-screen bg-background text-foreground flex flex-col p-4 sm:p-6 space-y-6 max-w-7xl mx-auto selection:bg-purple-500 selection:text-white">
      {/* Top Action Bar */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 border-b border-border pb-4">
        <div className="flex items-center gap-3">
          <Link href="/">
            <Button variant="outline" size="sm" className="gap-1.5 text-xs">
              <ArrowLeft className="w-4 h-4" /> Home
            </Button>
          </Link>
          <div className="flex items-center gap-2.5">
            <img
              src="/RepoMind_AI_logo.jpeg"
              alt="RepoMind AI Logo"
              className="w-8 h-8 rounded-lg object-cover border border-purple-500/30 shadow"
            />
            <div>
              <h1 className="text-xl font-bold flex items-center gap-2">
                <span>Autonomous Engineering Workspace</span>
                <Badge className="bg-purple-950/80 text-purple-300 border-purple-500/40 text-xs font-mono">
                  Multi-Agent Team
                </Badge>
              </h1>
              <p className="text-xs text-muted-foreground font-mono">Run ID: {runId}</p>
            </div>
          </div>
        </div>

        {/* Feature Navigation Tabs */}
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant={activeTab === "meeting" ? "gradient" : "outline"}
            size="sm"
            onClick={() => setActiveTab("meeting")}
            className="gap-1.5 text-xs font-mono"
          >
            <Users className="w-3.5 h-3.5" /> Engineering Review Meeting
          </Button>

          <Button
            variant={activeTab === "workspace" ? "gradient" : "outline"}
            size="sm"
            onClick={() => setActiveTab("workspace")}
            className="gap-1.5 text-xs font-mono"
          >
            <Zap className="w-3.5 h-3.5" /> Live Workspace
          </Button>

          <Button
            variant={activeTab === "layers" ? "gradient" : "outline"}
            size="sm"
            onClick={() => setActiveTab("layers")}
            className="gap-1.5 text-xs font-mono"
          >
            <Layers className="w-3.5 h-3.5" /> Layer View
          </Button>

          <Button
            variant={activeTab === "learning" ? "gradient" : "outline"}
            size="sm"
            onClick={() => setActiveTab("learning")}
            className="gap-1.5 text-xs font-mono"
          >
            <GraduationCap className="w-3.5 h-3.5" /> Smart Learning
          </Button>

          <Link href={`/reports/${runId}`}>
            <Button variant="outline" size="sm" className="gap-1.5 text-xs font-mono text-purple-300 border-purple-500/30">
              Audit Report
            </Button>
          </Link>
        </div>
      </div>

      {/* Feature 1: Engineering Review Meeting */}
      {activeTab === "meeting" && (
        <EngineeringReviewMeeting
          runId={runId}
          onSelectFile={(f) => {
            setSelectedFile(f);
            setActiveTab("workspace");
          }}
        />
      )}

      {/* Feature 5: Layer View */}
      {activeTab === "layers" && (
        <div className="h-[600px]">
          <ArchitectureLayerSwimlanes
            graphData={graphData}
            onNodeClick={(nodeId) => {
              setSelectedFile(nodeId);
              setActiveTab("workspace");
            }}
          />
        </div>
      )}

      {/* Feature 8: Smart Learning Mode View */}
      {activeTab === "learning" && (
        <SmartLearningPanel runId={runId} filePath={selectedFile} />
      )}

      {/* Feature 2: Main Live Workspace Grid */}
      {activeTab === "workspace" && (
        <>
          {/* Feature Toolbar for Graph Additions */}
          <div className="flex items-center justify-between bg-slate-900/60 p-2.5 rounded-xl border border-slate-800 font-mono text-xs">
            <div className="flex items-center gap-2">
              <span className="text-slate-400">Interactive Tools:</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowGuidedTour(!showGuidedTour)}
                className="h-7 text-[11px] gap-1.5 border-purple-500/30 text-purple-300 bg-purple-950/40"
              >
                <Compass className="w-3.5 h-3.5" /> {showGuidedTour ? "Close Tour" : "Start Guided Tour"}
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowPathFinder(!showPathFinder)}
                className="h-7 text-[11px] gap-1.5 border-indigo-500/30 text-indigo-300 bg-indigo-950/40"
              >
                <GitBranch className="w-3.5 h-3.5" /> {showPathFinder ? "Close Path Finder" : "Dependency Path Finder"}
              </Button>
            </div>
          </div>

          {/* Grid Row 1: Agent Timeline & Health Score Card */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <AgentTimeline agents={agents} executionRationale={plannerRationale} />
            <HealthScoreCard healthScore={healthScore} />
          </div>

          {/* Grid Row 2: Knowledge Graph Canvas with Overlays */}
          <div className="relative">
            {showGuidedTour && (
              <GuidedTourOverlay
                onHighlightNode={(nodeId) => setSelectedFile(nodeId)}
                onClose={() => setShowGuidedTour(false)}
              />
            )}

            {showPathFinder && (
              <PathFinderPanel
                runId={runId}
                onClose={() => setShowPathFinder(false)}
              />
            )}

            <KnowledgeGraph
              graphData={graphData}
              onNodeClick={(nodeId) => setSelectedFile(nodeId)}
              runId={runId}
              findings={findings}
            />
          </div>

          {/* Grid Row 3: Findings Workspace & Code Viewer */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <FindingsWorkspace
              findings={findings.length > 0 ? findings : DEMO_FINDINGS}
              onSelectFinding={handleSelectFinding}
            />
            <CodeViewer filePath={selectedFile} runId={runId} targetLine={selectedLine} />
          </div>
        </>
      )}

      {/* Feature 2: Repository Copilot Chat (Floating Drawer) */}
      <RepoCopilotChat
        runId={runId}
        onSelectFile={(f) => setSelectedFile(f)}
      />
    </div>
  );
}

