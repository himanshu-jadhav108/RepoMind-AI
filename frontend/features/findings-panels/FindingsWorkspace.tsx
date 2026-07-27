"use client";

import React, { useState } from "react";
import { AlertCircle, CheckCircle2, FileText, Filter, HelpCircle, ShieldAlert, Zap, Layers, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Finding } from "@/types";

interface FindingsWorkspaceProps {
  findings: Finding[];
  architectSummary?: any;
  documentationMarkdown?: string;
  featureSuggestions?: any[];
  onSelectFinding?: (file: string, line: number) => void;
}

export function FindingsWorkspace({
  findings,
  architectSummary,
  documentationMarkdown,
  featureSuggestions,
  onSelectFinding,
}: FindingsWorkspaceProps) {
  const [activeTab, setActiveTab] = useState<"bugs" | "security" | "performance" | "architecture" | "docs" | "features">("bugs");
  const [severityFilter, setSeverityFilter] = useState<string>("all");

  const filteredFindings = findings.filter((f) => {
    const categoryMatch = activeTab === "bugs" ? f.category === "bug" : f.category === activeTab;
    const severityMatch = severityFilter === "all" || f.severity === severityFilter;
    return categoryMatch && severityMatch;
  });

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case "critical":
        return <Badge variant="critical">CRITICAL</Badge>;
      case "high":
        return <Badge variant="destructive">HIGH</Badge>;
      case "medium":
        return <Badge variant="warning">MEDIUM</Badge>;
      default:
        return <Badge variant="info" className="font-bold">LOW</Badge>;
    }
  };

  const getReviewBadge = (status: string) => {
    if (status === "approved" || status === "rewritten_and_approved") {
      return (
        <Badge variant="success" className="gap-1">
          <CheckCircle2 className="w-3 h-3" /> Reviewed & Approved
        </Badge>
      );
    }
    if (status === "flagged_low_confidence") {
      return (
        <Badge variant="warning" className="gap-1">
          <AlertCircle className="w-3 h-3" /> Flagged Low Confidence
        </Badge>
      );
    }
    return <Badge variant="outline">Unreviewed</Badge>;
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <CardTitle className="text-base flex items-center gap-2">
            <Layers className="w-4 h-4 text-primary" />
            <span>Agent Findings & Intelligence Workspace</span>
          </CardTitle>

          {/* Severity filter dropdown */}
          <div className="flex items-center gap-2 text-xs">
            <Filter className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="text-muted-foreground">Severity:</span>
            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className="bg-secondary text-foreground rounded-md px-2 py-1 border border-border text-xs focus:outline-none"
            >
              <option value="all">All Severities</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>
        </div>

        {/* Tab Selection */}
        <div className="flex flex-wrap gap-2 pt-3 border-b border-border">
          <button
            onClick={() => setActiveTab("bugs")}
            className={`px-3 py-1.5 text-xs font-medium rounded-t-lg transition border-b-2 ${
              activeTab === "bugs"
                ? "border-primary text-primary bg-primary/10"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            🐛 Bugs & Smells ({findings.filter((f) => f.category === "bug").length})
          </button>
          <button
            onClick={() => setActiveTab("security")}
            className={`px-3 py-1.5 text-xs font-medium rounded-t-lg transition border-b-2 ${
              activeTab === "security"
                ? "border-emerald-500 text-emerald-400 bg-emerald-500/10"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            🛡️ Security ({findings.filter((f) => f.category === "security").length})
          </button>
          <button
            onClick={() => setActiveTab("performance")}
            className={`px-3 py-1.5 text-xs font-medium rounded-t-lg transition border-b-2 ${
              activeTab === "performance"
                ? "border-purple-500 text-purple-400 bg-purple-500/10"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            ⚡ Performance ({findings.filter((f) => f.category === "performance").length})
          </button>
          <button
            onClick={() => setActiveTab("architecture")}
            className={`px-3 py-1.5 text-xs font-medium rounded-t-lg transition border-b-2 ${
              activeTab === "architecture"
                ? "border-blue-500 text-blue-400 bg-blue-500/10"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            🏛️ Architecture
          </button>
          <button
            onClick={() => setActiveTab("docs")}
            className={`px-3 py-1.5 text-xs font-medium rounded-t-lg transition border-b-2 ${
              activeTab === "docs"
                ? "border-sky-500 text-sky-400 bg-sky-500/10"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            📄 Documentation
          </button>
          <button
            onClick={() => setActiveTab("features")}
            className={`px-3 py-1.5 text-xs font-medium rounded-t-lg transition border-b-2 ${
              activeTab === "features"
                ? "border-pink-500 text-pink-400 bg-pink-500/10"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            💡 Feature Proposals
          </button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4 pt-2">
        {/* Architecture Tab View */}
        {activeTab === "architecture" && (
          <div className="space-y-3">
            <div className="p-4 rounded-xl glass-panel space-y-2">
              <h4 className="text-sm font-semibold text-blue-400">Architect Narrative Overview</h4>
              <p className="text-xs text-foreground/90 leading-relaxed">
                {architectSummary?.summary || "Clean Architecture pattern detected with modular service separation."}
              </p>
              {architectSummary?.patterns && (
                <div className="flex gap-2 pt-2">
                  {architectSummary.patterns.map((p: string, idx: number) => (
                    <Badge key={idx} variant="outline" className="text-xs">
                      {p}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Documentation Tab View */}
        {activeTab === "docs" && (
          <div className="p-4 rounded-xl glass-panel font-mono text-xs whitespace-pre-wrap text-foreground/90 max-h-96 overflow-y-auto">
            {documentationMarkdown || "# Project Documentation Overview\nAuto-generated documentation ready for export."}
          </div>
        )}

        {/* Feature Suggestions Tab View */}
        {activeTab === "features" && (
          <div className="space-y-3">
            {(featureSuggestions || [
              { title: "Automated PR Triage Workflow", description: "Integrate GitHub Actions trigger for automatic RepoMind scanning on pull requests.", impact: "high", effort: "medium" },
            ]).map((s, idx) => (
              <div key={idx} className="p-4 rounded-xl glass-panel border border-pink-500/20 space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold text-pink-400 flex items-center gap-2">
                    <Sparkles className="w-4 h-4" /> {s.title}
                  </h4>
                  <div className="flex gap-2">
                    <Badge variant="outline">Impact: {s.impact}</Badge>
                    <Badge variant="outline">Effort: {s.effort}</Badge>
                  </div>
                </div>
                <p className="text-xs text-foreground/80">{s.description}</p>
              </div>
            ))}
          </div>
        )}

        {/* Findings List View for Bugs, Security, Performance */}
        {["bugs", "security", "performance"].includes(activeTab) && (
          <div className="space-y-3">
            {filteredFindings.length === 0 ? (
              <div className="p-8 text-center text-xs text-muted-foreground glass-panel rounded-xl">
                No {activeTab} findings recorded for current filter.
              </div>
            ) : (
              filteredFindings.map((f) => (
                <div
                  key={f.id}
                  className="p-4 rounded-xl glass-card space-y-3 border border-border/80 hover:border-primary/30 transition"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      {getSeverityBadge(f.severity)}
                      {getReviewBadge(f.review_status)}
                      <button
                        type="button"
                        onClick={() => onSelectFinding && onSelectFinding(f.file, f.line_start)}
                        className="text-xs font-mono text-primary hover:underline"
                      >
                        {f.file}:{f.line_start}
                      </button>
                    </div>
                    <Badge variant="outline" className="text-xs font-mono">
                      Confidence: {(f.confidence * 100).toFixed(0)}%
                    </Badge>
                  </div>

                  <p className="text-sm font-medium text-foreground">{f.description}</p>

                  {f.suggested_fix && (
                    <div className="p-2.5 rounded-lg bg-emerald-950/30 border border-emerald-500/20 text-xs text-emerald-300">
                      <span className="font-semibold text-emerald-400">Suggested Fix:</span> {f.suggested_fix}
                    </div>
                  )}

                  {/* Explainability Accordion Details */}
                  <div className="pt-2 border-t border-border/50 text-xs space-y-1.5 text-muted-foreground">
                    <div>
                      <span className="font-semibold text-foreground">Reasoning:</span> {f.reasoning}
                    </div>
                    <div>
                      <span className="font-semibold text-foreground">Evidence:</span>{" "}
                      <code className="px-1.5 py-0.5 rounded bg-slate-900 text-amber-300 font-mono">
                        {f.evidence}
                      </code>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
