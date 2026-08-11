"use client";

import React, { useState } from "react";
import { AlertCircle, CheckCircle2, Filter, Layers, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
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
        <Badge variant="success" className="gap-1 font-mono">
          <CheckCircle2 className="w-3 h-3" /> Reviewed & Approved
        </Badge>
      );
    }
    if (status === "flagged_low_confidence") {
      return (
        <Badge variant="warning" className="gap-1 font-mono">
          <AlertCircle className="w-3 h-3" /> Flagged Low Confidence
        </Badge>
      );
    }
    return <Badge variant="outline" className="font-mono border-graphite-border">Unreviewed</Badge>;
  };

  return (
    <Card className="w-full h-[650px] flex flex-col border-graphite-border bg-graphite-panel font-sans">
      <CardHeader className="pb-3 shrink-0 border-b border-graphite-border">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <CardTitle className="text-base flex items-center gap-2 font-display text-white">
            <Layers className="w-4 h-4 text-copper" />
            <span>Agent Findings & Intelligence Workspace</span>
          </CardTitle>

          {/* Severity filter dropdown */}
          <div className="flex items-center gap-2 text-xs font-mono">
            <Filter className="w-3.5 h-3.5 text-graphite-muted" />
            <span className="text-graphite-muted">Severity:</span>
            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className="bg-graphite-canvas text-white rounded-md px-2 py-1 border border-graphite-border text-xs focus:outline-none focus:border-copper cursor-pointer"
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
        <div className="flex flex-wrap gap-2 pt-3 font-mono text-xs">
          <button
            onClick={() => setActiveTab("bugs")}
            className={`px-3 py-1.5 font-medium rounded-t-lg transition border-b-2 ${
              activeTab === "bugs"
                ? "border-severity-critical text-severity-critical bg-severity-critical/10"
                : "border-transparent text-graphite-muted hover:text-white"
            }`}
          >
            🐛 Bugs & Smells ({findings.filter((f) => f.category === "bug").length})
          </button>
          <button
            onClick={() => setActiveTab("security")}
            className={`px-3 py-1.5 font-medium rounded-t-lg transition border-b-2 ${
              activeTab === "security"
                ? "border-severity-critical text-severity-critical bg-severity-critical/10"
                : "border-transparent text-graphite-muted hover:text-white"
            }`}
          >
            🛡️ Security ({findings.filter((f) => f.category === "security").length})
          </button>
          <button
            onClick={() => setActiveTab("performance")}
            className={`px-3 py-1.5 font-medium rounded-t-lg transition border-b-2 ${
              activeTab === "performance"
                ? "border-severity-warning text-severity-warning bg-severity-warning/10"
                : "border-transparent text-graphite-muted hover:text-white"
            }`}
          >
            ⚡ Performance ({findings.filter((f) => f.category === "performance").length})
          </button>
          <button
            onClick={() => setActiveTab("architecture")}
            className={`px-3 py-1.5 font-medium rounded-t-lg transition border-b-2 ${
              activeTab === "architecture"
                ? "border-[#5B82A6] text-[#5B82A6] bg-[#5B82A6]/10"
                : "border-transparent text-graphite-muted hover:text-white"
            }`}
          >
            🏛️ Architecture
          </button>
          <button
            onClick={() => setActiveTab("docs")}
            className={`px-3 py-1.5 font-medium rounded-t-lg transition border-b-2 ${
              activeTab === "docs"
                ? "border-emerald-500 text-emerald-400 bg-emerald-500/10"
                : "border-transparent text-graphite-muted hover:text-white"
            }`}
          >
            📄 Documentation
          </button>
          <button
            onClick={() => setActiveTab("features")}
            className={`px-3 py-1.5 font-medium rounded-t-lg transition border-b-2 ${
              activeTab === "features"
                ? "border-copper text-copper bg-copper/10"
                : "border-transparent text-graphite-muted hover:text-white"
            }`}
          >
            💡 Feature Proposals
          </button>
        </div>
      </CardHeader>

      <CardContent className="flex-1 overflow-y-auto space-y-4 pt-4">
        {/* Architecture Tab View */}
        {activeTab === "architecture" && (
          <div className="space-y-3 font-mono">
            <div className="p-4 rounded-xl bg-graphite-canvas border border-graphite-border space-y-2">
              <h4 className="text-sm font-semibold text-[#5B82A6] font-display">Architect Narrative Overview</h4>
              <p className="text-xs text-foreground/90 leading-relaxed font-sans">
                {architectSummary?.summary || "Clean Architecture pattern detected with modular service separation."}
              </p>
              {architectSummary?.patterns && (
                <div className="flex gap-2 pt-2">
                  {architectSummary.patterns.map((p: string, idx: number) => (
                    <Badge key={idx} variant="outline" className="text-xs border-[#5B82A6]/30 text-[#5B82A6]">
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
          <div className="p-4 rounded-xl bg-graphite-canvas border border-graphite-border font-mono text-xs whitespace-pre-wrap text-foreground/90 max-h-96 overflow-y-auto">
            {documentationMarkdown || "# Project Documentation Overview\nAuto-generated documentation ready for export."}
          </div>
        )}

        {/* Feature Suggestions Tab View */}
        {activeTab === "features" && (
          <div className="space-y-3 font-mono">
            {(featureSuggestions || [
              { title: "Automated PR Triage Workflow", description: "Integrate GitHub Actions trigger for automatic RepoMind scanning on pull requests.", impact: "high", effort: "medium" },
            ]).map((s, idx) => (
              <div key={idx} className="p-4 rounded-xl bg-graphite-canvas border border-copper/30 space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold text-copper flex items-center gap-2 font-display">
                    <Sparkles className="w-4 h-4 text-copper" /> {s.title}
                  </h4>
                  <div className="flex gap-2">
                    <Badge variant="outline" className="border-copper/30 text-copper">Impact: {s.impact}</Badge>
                    <Badge variant="outline" className="border-graphite-border text-graphite-muted">Effort: {s.effort}</Badge>
                  </div>
                </div>
                <p className="text-xs text-foreground/80 font-sans">{s.description}</p>
              </div>
            ))}
          </div>
        )}

        {/* Findings List View for Bugs, Security, Performance */}
        {["bugs", "security", "performance"].includes(activeTab) && (
          <div className="space-y-3 font-sans">
            {filteredFindings.length === 0 ? (
              <div className="p-8 text-center text-xs text-graphite-muted bg-graphite-canvas rounded-xl border border-graphite-border font-mono">
                No {activeTab} findings recorded for current filter.
              </div>
            ) : (
              filteredFindings.map((f) => (
                <div
                  key={f.id}
                  className="p-4 rounded-xl bg-graphite-canvas space-y-3 border border-graphite-border hover:border-copper/30 transition"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      {getSeverityBadge(f.severity)}
                      {getReviewBadge(f.review_status)}
                      <button
                        type="button"
                        onClick={() => onSelectFinding && onSelectFinding(f.file, f.line_start)}
                        className="text-xs font-mono text-copper hover:underline"
                      >
                        {f.file}:{f.line_start}
                      </button>
                    </div>
                    <Badge variant="outline" className="text-xs font-mono border-graphite-border text-graphite-muted">
                      Confidence: {(f.confidence * 100).toFixed(0)}%
                    </Badge>
                  </div>

                  <p className="text-sm font-medium text-white">{f.description}</p>

                  {f.suggested_fix && (
                    <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-400 font-mono">
                      <span className="font-semibold text-emerald-400">Suggested Fix:</span> {f.suggested_fix}
                    </div>
                  )}

                  {/* Explainability Callout Grid */}
                  <div className="pt-3 border-t border-graphite-border text-xs space-y-2 text-graphite-muted font-mono">
                    <div className="p-2 rounded-lg bg-copper/10 border border-copper/20 text-white font-mono">
                      <strong className="text-copper font-mono">AI Reasoning:</strong> {f.reasoning}
                    </div>

                    <div className="p-2 rounded-lg bg-graphite-panel border border-graphite-border text-severity-warning">
                      <strong className="text-severity-warning">Evidence Snippet:</strong>{" "}
                      <code className="text-severity-warning font-mono">{f.evidence}</code>
                    </div>

                    {/* Referenced Files list */}
                    {f.referenced_files && f.referenced_files.length > 0 && (
                      <div className="flex flex-wrap items-center gap-1.5 pt-1">
                        <span className="text-graphite-muted font-sans">Referenced Files:</span>
                        {f.referenced_files.map((refFile, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => onSelectFinding && onSelectFinding(refFile, 1)}
                            className="px-2 py-0.5 rounded bg-graphite-panel text-[#5B82A6] border border-[#5B82A6]/30 hover:underline text-[11px]"
                          >
                            📄 {refFile}
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Why Recommendation Exists & Potential Limitations */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 font-sans text-[11px]">
                      <div className="p-2 rounded-lg bg-graphite-panel border border-[#5B82A6]/20 text-white/90">
                        <strong className="text-[#5B82A6] block mb-0.5 font-mono">Why Recommendation Exists:</strong>
                        {f.why_recommendation_exists || "Prevents runtime error propagation and enforces clean layer separation."}
                      </div>

                      <div className="p-2 rounded-lg bg-graphite-panel border border-severity-warning/20 text-white/90">
                        <strong className="text-severity-warning block mb-0.5 font-mono">Potential Limitations:</strong>
                        {f.potential_limitations || "Static heuristic analysis; verify behavior under heavy concurrent load."}
                      </div>
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
