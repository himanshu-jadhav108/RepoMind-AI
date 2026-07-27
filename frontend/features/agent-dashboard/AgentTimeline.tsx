"use client";

import React from "react";
import { CheckCircle2, Clock, AlertTriangle, ShieldCheck, Cpu, Code2, FileText, Sparkles, Layers } from "lucide-react";
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
  documentation_agent: <FileText className="w-4 h-4 text-sky-400" />,
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

export function AgentTimeline({ agents, executionRationale }: AgentTimelineProps) {
  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <Sparkles className="w-4 h-4 text-primary" />
            <span>Agent Execution Timeline & Review Loop</span>
          </CardTitle>
          <Badge variant="outline" className="text-xs font-normal">
            Multi-Agent LangGraph Pipeline
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {executionRationale && (
          <div className="p-3 rounded-lg bg-primary/10 border border-primary/20 text-xs text-foreground/90">
            <span className="font-semibold text-primary">Planner Rationale:</span> {executionRationale}
          </div>
        )}

        <div className="relative border-l border-border/80 ml-3 pl-6 space-y-4">
          {agents.map((agent, index) => {
            const isCompleted = agent.status === "completed";
            const isRunning = agent.status === "running";
            const isDegraded = agent.status === "degraded";

            return (
              <div key={agent.name || index} className="relative group">
                <div className="absolute -left-[31px] top-0.5 flex items-center justify-center w-6 h-6 rounded-full bg-background border border-border">
                  {isCompleted ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  ) : isRunning ? (
                    <Clock className="w-4 h-4 text-primary animate-spin" />
                  ) : isDegraded ? (
                    <AlertTriangle className="w-4 h-4 text-amber-400" />
                  ) : (
                    <Clock className="w-4 h-4 text-muted-foreground" />
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {AGENT_ICONS[agent.name] || <Code2 className="w-4 h-4 text-muted-foreground" />}
                    <span className="text-sm font-medium">
                      {AGENT_LABELS[agent.name] || agent.name}
                    </span>
                  </div>

                  <Badge
                    variant={
                      isCompleted ? "success" : isRunning ? "default" : isDegraded ? "warning" : "secondary"
                    }
                  >
                    {agent.status.toUpperCase()}
                  </Badge>
                </div>

                {/* Review Loop Detail Callout for Reviewer Agent */}
                {agent.name === "reviewer_agent" && isCompleted && (
                  <div className="mt-2 p-2.5 rounded-lg bg-violet-500/10 border border-violet-500/20 text-xs text-violet-300">
                    <span className="font-semibold">Reviewer Agent Loop Active:</span> Verified claims & evidence support. Outputs cleared quality threshold (Review → Feedback → Rewrite → Validate → Approve).
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
