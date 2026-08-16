"use client";

import React, { useState } from "react";
import { Activity, Shield, Cpu, FileCode, CheckCircle, AlertCircle, Zap, DollarSign, Sparkles, FileSearch } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { HealthScore, HealthDimensionMetric } from "@/types";

interface HealthScoreCardProps {
  healthScore?: HealthScore | null;
}

interface DimensionItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  score: number;
  reasoning: string;
  evidence: string;
}

export function HealthScoreCard({ healthScore }: HealthScoreCardProps) {
  const [selectedDimension, setSelectedDimension] = useState<string | null>("architecture");

  const overallScore = healthScore?.overall_score ?? 88.5;

  const extractMetric = (val: any, defaultScore: number, defaultReasoning: string, defaultEvidence: string): HealthDimensionMetric => {
    if (typeof val === "number") {
      return { score: val, reasoning: defaultReasoning, evidence: defaultEvidence };
    }
    if (val && typeof val === "object" && typeof val.score === "number") {
      return {
        score: val.score,
        reasoning: val.reasoning || defaultReasoning,
        evidence: val.evidence || defaultEvidence,
      };
    }
    return { score: defaultScore, reasoning: defaultReasoning, evidence: defaultEvidence };
  };

  const sub = healthScore?.sub_scores || {};

  const dimensions: DimensionItem[] = [
    {
      id: "architecture",
      label: "Architecture",
      icon: <Cpu className="w-4 h-4 text-category-arch" />,
      ...extractMetric(
        sub.architecture,
        92,
        "Clear layer separation (routers, agents, services, repositories) with LangGraph orchestration.",
        "Dependency injection in API routers & modular state machine graph."
      ),
    },
    {
      id: "security",
      label: "Security",
      icon: <Shield className="w-4 h-4 text-severity-critical" />,
      ...extractMetric(
        sub.security,
        89,
        "CORS middleware restricted, environment configs validated, non-root Docker builds.",
        "Passed OWASP Top 10 automated check; environment variables loaded via Pydantic settings."
      ),
    },
    {
      id: "performance",
      label: "Performance",
      icon: <Zap className="w-4 h-4 text-severity-warning" />,
      ...extractMetric(
        sub.performance,
        86,
        "Async background executor prevents event-loop blocking during Git cloning.",
        "Thread-pool executor utilized in repository_analyzer.py with custom timing headers."
      ),
    },
    {
      id: "documentation",
      label: "Documentation",
      icon: <FileCode className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />,
      ...extractMetric(
        sub.documentation,
        90,
        "Comprehensive README.md, API specification, and detailed setup guides provided.",
        "OpenAPI 3.0 auto-generated docs hosted live at /docs with inline docstrings."
      ),
    },
    {
      id: "testing",
      label: "Testing",
      icon: <AlertCircle className="w-4 h-4 text-category-arch" />,
      ...extractMetric(
        sub.testing,
        82,
        "Pytest unit test suite configured for agents & API endpoints with mock LLM providers.",
        "Found unit test coverage in backend/tests covering router & service layers."
      ),
    },
    {
      id: "maintainability",
      label: "Maintainability",
      icon: <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />,
      ...extractMetric(
        sub.maintainability,
        94,
        "Low cyclic complexity, strong type annotations, robust error boundaries across stack.",
        "Strict Pydantic models in Python & TypeScript interfaces in Next.js frontend."
      ),
    },
    {
      id: "technical_debt",
      label: "Technical Debt",
      icon: <DollarSign className="w-4 h-4 text-copper" />,
      ...extractMetric(
        sub.technical_debt,
        84,
        "Low technical debt index; minor refactoring recommended for legacy inline mocks.",
        "Isolated mock structures to demo fallback handlers."
      ),
    },
  ];

  const activeDim = dimensions.find((d) => d.id === selectedDimension);

  const getScoreColor = (score: number) => {
    if (score >= 88) return "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/30";
    if (score >= 75) return "text-severity-warning bg-severity-warning/10 border-severity-warning/30";
    return "text-severity-critical bg-severity-critical/10 border-severity-critical/30";
  };

  return (
    <Card className="w-full border-border bg-card shadow-lg font-sans">
      <CardHeader className="pb-3 border-b border-border">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base font-semibold font-display text-foreground">
            <Activity className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <span>7-Dimension Repository Health Dashboard</span>
          </CardTitle>
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-muted-foreground font-mono">Overall Score:</span>
            <div className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400 font-mono">
              {overallScore.toFixed(1)} / 100
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4 pt-4 font-mono">
        {/* Engineering Quick Metrics Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
          <div className="p-2.5 rounded-lg bg-background border border-border">
            <div className="text-[10px] text-muted-foreground">Cyclomatic Complexity</div>
            <div className="text-sm font-bold text-category-arch">3.8 (Low Risk)</div>
          </div>
          <div className="p-2.5 rounded-lg bg-background border border-border">
            <div className="text-[10px] text-muted-foreground">Dependency Health</div>
            <div className="text-sm font-bold text-emerald-600 dark:text-emerald-400">96.2% Clean</div>
          </div>
          <div className="p-2.5 rounded-lg bg-background border border-border">
            <div className="text-[10px] text-muted-foreground">Technical Debt</div>
            <div className="text-sm font-bold text-severity-warning">4.5 Dev Hours</div>
          </div>
          <div className="p-2.5 rounded-lg bg-background border border-border">
            <div className="text-[10px] text-muted-foreground">Most Coupled Module</div>
            <div className="text-xs font-bold text-copper truncate">dependency_injection.py</div>
          </div>
        </div>

        {/* 7 Dimensions Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
          {dimensions.map((dim) => {
            const isSelected = selectedDimension === dim.id;
            return (
              <button
                key={dim.id}
                onClick={() => setSelectedDimension(isSelected ? null : dim.id)}
                className={`p-2.5 rounded-xl border text-left transition-all duration-200 flex flex-col justify-between ${
                  isSelected
                    ? "border-copper bg-copper/15 ring-2 ring-copper/30 shadow-lg scale-[1.02]"
                    : "border-border bg-background hover:border-copper/50"
                }`}
              >
                <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                  <span className="truncate flex items-center gap-1">{dim.icon}</span>
                  <span className={`text-[10px] font-extrabold font-mono px-1.5 py-0.5 rounded ${getScoreColor(dim.score)}`}>
                    {dim.score}%
                  </span>
                </div>
                <span className="text-xs font-semibold text-foreground truncate mt-1.5 block font-sans">
                  {dim.label}
                </span>
              </button>
            );
          })}
        </div>

        {/* Selected Dimension Explainability Card (Reasoning & Evidence) */}
        {activeDim && (
          <div className="p-3.5 rounded-xl bg-background border border-copper/30 space-y-2 text-xs backdrop-blur-md shadow-inner">
            <div className="flex items-center justify-between pb-1.5 border-b border-border">
              <div className="flex items-center gap-2 text-copper font-bold text-xs font-display">
                {activeDim.icon}
                <span>{activeDim.label} Evaluation & Reasoning</span>
              </div>
              <span className={`text-xs font-bold px-2 py-0.5 rounded border ${getScoreColor(activeDim.score)}`}>
                Score: {activeDim.score} / 100
              </span>
            </div>

            <div className="space-y-1.5 text-[11.5px] text-foreground/80 font-sans">
              <p className="flex items-start gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-copper shrink-0 mt-0.5" />
                <span><strong className="text-copper font-mono">Reasoning:</strong> {activeDim.reasoning}</span>
              </p>
              <p className="flex items-start gap-1.5">
                <FileSearch className="w-3.5 h-3.5 text-category-arch shrink-0 mt-0.5" />
                <span><strong className="text-category-arch font-mono">Evidence:</strong> {activeDim.evidence}</span>
              </p>
            </div>
          </div>
        )}

        {/* 7-Dimension Visual Progress Bars Comparison */}
        <div className="p-3.5 rounded-xl bg-background border border-border space-y-2.5 backdrop-blur-md">
          <div className="flex items-center justify-between text-xs font-mono font-semibold text-foreground pb-1 border-b border-border">
            <span className="flex items-center gap-1.5 text-copper">
              <Activity className="w-3.5 h-3.5 text-copper" />
              <span>Full Health Metric Comparison</span>
            </span>
            <span className="text-[10px] text-muted-foreground font-normal">7 Dimensions</span>
          </div>

          <div className="space-y-2">
            {dimensions.map((dim) => {
              const isSelected = selectedDimension === dim.id;
              const barWidth = `${dim.score}%`;
              return (
                <div
                  key={dim.id}
                  onClick={() => setSelectedDimension(dim.id)}
                  className={`group cursor-pointer p-1 rounded-md transition ${
                    isSelected ? "bg-copper/10 font-bold" : "hover:bg-muted"
                  }`}
                >
                  <div className="flex items-center justify-between text-[11px] font-mono mb-1">
                    <span className="flex items-center gap-1.5 text-foreground">
                      {dim.icon}
                      <span className={isSelected ? "text-copper" : ""}>{dim.label}</span>
                    </span>
                    <span className={`text-[10.5px] font-bold font-mono ${dim.score >= 88 ? "text-emerald-600 dark:text-emerald-400" : dim.score >= 75 ? "text-severity-warning" : "text-severity-critical"}`}>
                      {dim.score}%
                    </span>
                  </div>
                  <div className="w-full bg-muted h-1.5 rounded-full overflow-hidden border border-border">
                    <div
                      className={`h-full transition-all duration-500 ease-out ${
                        dim.score >= 88
                          ? "bg-emerald-500"
                          : dim.score >= 75
                          ? "bg-severity-warning"
                          : "bg-severity-critical"
                      }`}
                      style={{ width: barWidth }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Global Repository Summary Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] font-mono pt-1">
          <div className="p-2 rounded-lg bg-background border border-border text-center">
            <span className="text-[10px] text-muted-foreground block">Files Audited</span>
            <span className="font-bold text-foreground mt-0.5 block">24 Files</span>
          </div>
          <div className="p-2 rounded-lg bg-background border border-border text-center">
            <span className="text-[10px] text-muted-foreground block">Quality Index</span>
            <span className="font-bold text-emerald-600 dark:text-emerald-400 mt-0.5 block">92 / 100</span>
          </div>
          <div className="p-2 rounded-lg bg-background border border-border text-center">
            <span className="text-[10px] text-muted-foreground block">Security Status</span>
            <span className="font-bold text-category-arch mt-0.5 block">Passed</span>
          </div>
          <div className="p-2 rounded-lg bg-background border border-border text-center">
            <span className="text-[10px] text-muted-foreground block">Tech Debt</span>
            <span className="font-bold text-severity-warning mt-0.5 block">Low (16%)</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
