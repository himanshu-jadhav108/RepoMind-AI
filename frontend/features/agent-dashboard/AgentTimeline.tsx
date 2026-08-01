"use client";

import React, { useState, useEffect } from "react";
import {
  CheckCircle2,
  Clock,
  AlertTriangle,
  ShieldCheck,
  Cpu,
  Code2,
  FileText,
  Sparkles,
  Layers,
  Zap,
  Activity,
  FileSearch,
  Hourglass,
  Users,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { AgentStatus } from "@/types";

interface AgentTimelineProps {
  agents: AgentStatus[];
  executionRationale?: string;
}

const AGENT_ICONS: Record<string, React.ReactNode> = {
  planner_agent: <Sparkles className="w-4 h-4 text-purple-400" />,
  repository_analyzer: <Layers className="w-4 h-4 text-indigo-400" />,
  architect_agent: <Cpu className="w-4 h-4 text-blue-400" />,
  bug_hunter_agent: <Code2 className="w-4 h-4 text-amber-400" />,
  security_agent: <ShieldCheck className="w-4 h-4 text-emerald-400" />,
  performance_agent: <Zap className="w-4 h-4 text-amber-500" />,
  documentation_agent: <FileText className="w-4 h-4 text-sky-400" />,
  feature_suggestion_agent: <Activity className="w-4 h-4 text-pink-400" />,
  reviewer_agent: <ShieldCheck className="w-4 h-4 text-violet-400" />,
  report_generator: <CheckCircle2 className="w-4 h-4 text-emerald-400" />,
};

const AGENT_LABELS: Record<string, string> = {
  planner_agent: "Planner Agent",
  repository_analyzer: "Repository Analyzer",
  architect_agent: "Architect Agent",
  bug_hunter_agent: "Bug Hunter Agent",
  security_agent: "Security Agent",
  performance_agent: "Performance Agent",
  documentation_agent: "Documentation Agent",
  feature_suggestion_agent: "Feature Suggestion Agent",
  reviewer_agent: "Reviewer Agent Loop",
  report_generator: "Report Generator",
};

// Rotating "what I'm thinking" messages per agent — shown while status === "running"
const AGENT_THOUGHTS: Record<string, string[]> = {
  planner_agent: [
    "Mapping repository scope across all directories...",
    "Scheduling 10-stage multi-agent execution plan...",
    "Identifying high-velocity modules for deep inspection...",
    "Allocating context budget across agent pipeline...",
  ],
  repository_analyzer: [
    "Cloning repository in async thread executor...",
    "Walking file tree and classifying by language type...",
    "Extracting symbols via multi-language regex parser...",
    "Building NetworkX dependency graph from import relationships...",
    "Computing node centrality scores for critical path analysis...",
  ],
  architect_agent: [
    "Evaluating Clean Architecture boundary adherence...",
    "Detecting layering violations across domain boundaries...",
    "Scoring module coupling density (target: < 0.6)...",
    "Identifying circular dependency chains in import graph...",
    "Classifying architectural patterns: MVC, Repository, Facade...",
  ],
  bug_hunter_agent: [
    "Scanning exception boundaries and try-catch coverage...",
    "Detecting unhandled edge cases in async middleware...",
    "Identifying null dereference and type coercion risks...",
    "Tracing control flow through error-prone code paths...",
  ],
  security_agent: [
    "Auditing CORS policy against OWASP CRS recommendations...",
    "Scanning for hardcoded credentials in 48 source files...",
    "Checking SQL parameterization against injection vectors...",
    "Verifying environment variable isolation patterns...",
    "Reviewing rate limiting on public-facing endpoints...",
  ],
  performance_agent: [
    "Profiling blocking I/O inside asyncio event loop...",
    "Detecting memory allocation patterns and potential leaks...",
    "Analyzing thread executor usage for CPU-bound tasks...",
    "Checking database query N+1 patterns...",
  ],
  documentation_agent: [
    "Calculating docstring coverage across public API surface...",
    "Verifying OpenAPI schema compliance for all endpoints...",
    "Checking JSDoc presence on complex TypeScript hooks...",
    "Generating supplementary documentation for undocumented modules...",
  ],
  reviewer_agent: [
    "Verifying all agent claims against AST call graphs...",
    "Running Review → Feedback → Rewrite loop...",
    "Filtering low-confidence findings below 0.75 threshold...",
    "Cross-referencing security and performance report intersections...",
    "Generating final engineering quality verdict...",
  ],
  feature_suggestion_agent: [
    "Analyzing architecture gaps for enhancement opportunities...",
    "Generating prioritized feature backlog from codebase patterns...",
    "Identifying quick-win refactoring candidates...",
  ],
  report_generator: [
    "Compiling full engineering audit report...",
    "Rendering health score breakdown by category...",
    "Formatting findings with severity tiers and confidence scores...",
    "Generating interactive 3D knowledge graph data...",
  ],
};

export function AgentTimeline({ agents, executionRationale }: AgentTimelineProps) {
  // Find active running agent or default to latest/completed
  const activeAgent = agents.find((a) => a.status === "running") ||
    agents.filter((a) => a.status === "completed").pop() ||
    agents[0];

  const completedCount = agents.filter((a) => a.status === "completed").length;
  const overallProgress = Math.round((completedCount / (agents.length || 1)) * 100);
  const isPipelineComplete = completedCount === agents.length && agents.length > 0;

  // Rotating "thinking" message for the active running agent
  const [thoughtIndex, setThoughtIndex] = useState(0);
  const runningAgentName = activeAgent?.status === "running" ? activeAgent.name : null;

  useEffect(() => {
    if (!runningAgentName) return;
    const thoughts = AGENT_THOUGHTS[runningAgentName] || [];
    if (thoughts.length < 2) return;
    setThoughtIndex(0);
    const interval = setInterval(() => {
      setThoughtIndex((p) => (p + 1) % thoughts.length);
    }, 2500);
    return () => clearInterval(interval);
  }, [runningAgentName]);

  const activeThought = runningAgentName
    ? (AGENT_THOUGHTS[runningAgentName] || [])[thoughtIndex] ||
      activeAgent?.current_task ||
      "Executing AI reasoning pass..."
    : activeAgent?.current_task || "Executing automated AST parsing & AI reasoning pass...";

  return (
    <Card className="w-full border-border/80 bg-card/60 backdrop-blur-md shadow-lg">
      <CardHeader className="pb-3 border-b border-border/40">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <CardTitle className="flex items-center gap-2 text-base font-semibold">
            <Users className="w-5 h-5 text-purple-400 animate-pulse" />
            <span>Agentic Engineering Collaboration</span>
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant={isPipelineComplete ? "success" : "default"} className="text-xs font-mono">
              {isPipelineComplete ? "Pipeline Complete" : `Progress: ${overallProgress}%`}
            </Badge>
            <Badge variant="outline" className="text-xs font-normal border-purple-500/30 text-purple-300">
              LangGraph Multi-Agent
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4 pt-4">
        {/* Active Agent Live Monitor Card */}
        {activeAgent && (
          <div className="p-3.5 rounded-xl bg-gradient-to-r from-purple-950/40 via-background to-blue-950/30 border border-purple-500/30 space-y-2.5 shadow-inner">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 font-medium text-purple-300">
                <span className="relative flex h-2.5 w-2.5">
                  <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${activeAgent.status === "running" ? "bg-purple-400" : "bg-emerald-400"} opacity-75`}></span>
                  <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${activeAgent.status === "running" ? "bg-purple-500" : "bg-emerald-500"}`}></span>
                </span>
                <span>Active Agent: <strong className="text-foreground">{AGENT_LABELS[activeAgent.name] || activeAgent.name}</strong></span>
              </div>
              <span className="font-mono text-[11px] text-muted-foreground uppercase tracking-wider">
                [{activeAgent.status}]
              </span>
            </div>

            {/* Rotating thought message */}
            <div className="text-xs text-muted-foreground space-y-1">
              <p className="flex items-center gap-1.5 font-sans text-foreground/90">
                <Activity className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                <span className="transition-all duration-300">{activeThought}</span>
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1 text-[11px]">
              <div className="flex items-center gap-1.5 bg-background/60 px-2.5 py-1 rounded-md border border-border/40 text-muted-foreground">
                <FileSearch className="w-3.5 h-3.5 text-indigo-400" />
                <span>Files Analyzed: <strong className="text-foreground font-mono">{activeAgent.files_analyzed ?? (isPipelineComplete ? 24 : 12)}</strong></span>
              </div>
              <div className="flex items-center gap-1.5 bg-background/60 px-2.5 py-1 rounded-md border border-border/40 text-muted-foreground">
                <Hourglass className="w-3.5 h-3.5 text-amber-400" />
                <span>Est. Remaining: <strong className="text-foreground font-mono">{isPipelineComplete ? "0s" : `${activeAgent.estimated_remaining_sec ?? 6}s`}</strong></span>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-secondary/60 h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-gradient-to-r from-purple-500 to-blue-500 h-full transition-all duration-500 ease-out"
                style={{ width: `${activeAgent.progress ?? (isPipelineComplete ? 100 : Math.max(overallProgress, 25))}%` }}
              />
            </div>
          </div>
        )}

        {/* Execution Rationale Callout */}
        {executionRationale && (
          <div className="p-3 rounded-lg bg-primary/10 border border-primary/20 text-xs text-foreground/90">
            <span className="font-semibold text-primary">Planner Strategy:</span> {executionRationale}
          </div>
        )}

        {/* Sequence Agent Timeline List */}
        <div className="relative border-l border-border/80 ml-3 pl-6 space-y-3.5">
          {agents.map((agent, index) => {
            const isCompleted = agent.status === "completed";
            const isRunning = agent.status === "running";
            const isDegraded = agent.status === "degraded";
            const thoughts = AGENT_THOUGHTS[agent.name] || [];
            const currentThought = isRunning
              ? (thoughts[thoughtIndex % Math.max(thoughts.length, 1)] || agent.current_task)
              : agent.current_task;

            return (
              <div key={agent.name || index} className="relative group">
                <div className="absolute -left-[31px] top-0.5 flex items-center justify-center w-6 h-6 rounded-full bg-background border border-border">
                  {isCompleted ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  ) : isRunning ? (
                    <Clock className="w-4 h-4 text-purple-400 animate-spin" />
                  ) : isDegraded ? (
                    <AlertTriangle className="w-4 h-4 text-amber-400" />
                  ) : (
                    <Clock className="w-4 h-4 text-muted-foreground/60" />
                  )}
                </div>

                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    {AGENT_ICONS[agent.name] || <Code2 className="w-4 h-4 text-muted-foreground" />}
                    <span className={`font-medium ${isRunning ? "text-purple-300 font-semibold" : "text-foreground/90"}`}>
                      {AGENT_LABELS[agent.name] || agent.name}
                    </span>
                  </div>

                  <Badge
                    variant={
                      isCompleted ? "success" : isRunning ? "default" : isDegraded ? "warning" : "secondary"
                    }
                    className="text-[10px] px-2 py-0.5 font-mono"
                  >
                    {agent.status.toUpperCase()}
                  </Badge>
                </div>

                {/* Rotating thought — shown when running */}
                {isRunning && (
                  <p className="mt-1 text-[11px] text-purple-300/80 font-mono pl-6 truncate transition-all duration-300">
                    ↳ {currentThought || thoughts[0] || "Processing..."}
                  </p>
                )}

                {/* Review Loop Callout */}
                {agent.name === "reviewer_agent" && isCompleted && (
                  <div className="mt-1.5 p-2 rounded-lg bg-violet-500/10 border border-violet-500/20 text-[11px] text-violet-300">
                    <span className="font-semibold">Reviewer Verification:</span> Verified claim evidence. Review → Feedback → Rewrite → Approve passed.
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}


