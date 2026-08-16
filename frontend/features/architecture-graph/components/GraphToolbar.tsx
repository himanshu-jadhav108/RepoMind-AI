"use client";

import React from "react";
import { Search, Filter, Layers, Bot } from "lucide-react";
import { useGraphStore, LayoutMode, AgentName } from "../store/useGraphStore";

// Top 5 Curated Premium Layout Views for Hackathon Demo
const TOP_5_LAYOUT_OPTIONS: { id: LayoutMode; label: string }[] = [
  { id: "tree", label: "🌲 1. Tree View (2D ER)" },
  { id: "galaxy", label: "🌌 2. 3D Galaxy View (WebGL)" },
  { id: "force", label: "⚡ 3. Force Physics View" },
  { id: "circular", label: "⭕ 4. Circular Orbit View" },
  { id: "architecture", label: "🏗️ 5. Architecture Pipeline" },
];

const AGENT_OPTIONS: { id: AgentName; label: string }[] = [
  { id: "planner_agent", label: "Planner Agent" },
  { id: "repository_analyzer", label: "Repository Analyzer" },
  { id: "architect_agent", label: "Architect Agent" },
  { id: "bug_hunter_agent", label: "Bug Hunter Agent" },
  { id: "security_agent", label: "Security Agent" },
  { id: "performance_agent", label: "Performance Agent" },
  { id: "documentation_agent", label: "Documentation Agent" },
  { id: "reviewer_agent", label: "Reviewer Agent" },
  { id: "learning_agent", label: "Learning Agent" },
  { id: "feature_suggestion_agent", label: "Feature Suggestion" },
];

export function GraphToolbar() {
  const searchQuery = useGraphStore((s) => s.searchQuery);
  const setSearchQuery = useGraphStore((s) => s.setSearchQuery);

  const layoutMode = useGraphStore((s) => s.layoutMode);
  const setLayoutMode = useGraphStore((s) => s.setLayoutMode);

  const selectedAgent = useGraphStore((s) => s.selectedAgent);
  const setSelectedAgent = useGraphStore((s) => s.setSelectedAgent);

  const selectedRisk = useGraphStore((s) => s.selectedRisk);
  const setSelectedRisk = useGraphStore((s) => s.setSelectedRisk);

  return (
    <div className="w-full bg-card border-b border-border p-3 flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center justify-between gap-3 font-mono text-xs">
      {/* Search Input */}
      <div className="relative flex-1 min-w-[200px] w-full sm:max-w-sm">
        <Search className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Instant search by file, function, class..."
          className="w-full pl-9 pr-3 py-2.5 sm:py-1.5 min-h-[44px] sm:min-h-[36px] rounded-lg bg-background border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-copper transition"
        />
      </div>

      {/* Select Controls Wrapper for Responsive Wrapping */}
      <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-3 w-full sm:w-auto">
        {/* Top 5 Layout Mode Selector */}
        <div className="flex items-center justify-between sm:justify-start gap-2 min-h-[44px] sm:min-h-[36px]">
          <span className="text-muted-foreground flex items-center gap-1 font-semibold shrink-0">
            <Layers className="w-3.5 h-3.5 text-category-arch" /> Layout:
          </span>
          <select
            value={layoutMode}
            onChange={(e) => setLayoutMode(e.target.value as LayoutMode)}
            className="flex-1 sm:flex-initial px-2.5 py-2 sm:py-1.5 min-h-[44px] sm:min-h-[36px] rounded-lg bg-background border border-border text-category-arch font-bold focus:outline-none focus:border-copper cursor-pointer shadow"
          >
            {TOP_5_LAYOUT_OPTIONS.map((opt) => (
              <option key={opt.id} value={opt.id}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* AI Agent Traversal View Selector */}
        <div className="flex items-center justify-between sm:justify-start gap-2 min-h-[44px] sm:min-h-[36px]">
          <span className="text-category-arch flex items-center gap-1 font-semibold shrink-0">
            <Bot className="w-3.5 h-3.5 text-category-arch" /> Agent View:
          </span>
          <select
            value={selectedAgent || ""}
            onChange={(e) => setSelectedAgent(e.target.value ? (e.target.value as AgentName) : null)}
            className="flex-1 sm:flex-initial px-2.5 py-2 sm:py-1.5 min-h-[44px] sm:min-h-[36px] rounded-lg bg-category-arch/10 border border-category-arch/30 text-category-arch font-semibold focus:outline-none focus:border-category-arch cursor-pointer"
          >
            <option value="">Off (Standard View)</option>
            {AGENT_OPTIONS.map((agent) => (
              <option key={agent.id} value={agent.id}>
                🤖 {agent.label}
              </option>
            ))}
          </select>
        </div>

        {/* Risk Level Filter */}
        <div className="flex items-center justify-between sm:justify-start gap-2 min-h-[44px] sm:min-h-[36px]">
          <span className="text-muted-foreground flex items-center gap-1 shrink-0">
            <Filter className="w-3.5 h-3.5 text-muted-foreground" /> Risk:
          </span>
          <select
            value={selectedRisk}
            onChange={(e) => setSelectedRisk(e.target.value as any)}
            className="flex-1 sm:flex-initial px-2 py-2 sm:py-1.5 min-h-[44px] sm:min-h-[36px] rounded-lg bg-background border border-border text-foreground focus:outline-none focus:border-copper cursor-pointer"
          >
            <option value="all">All Risks</option>
            <option value="critical">Critical Only</option>
            <option value="high">High & Critical</option>
            <option value="medium">Medium+</option>
            <option value="low">Low+</option>
          </select>
        </div>
      </div>
    </div>
  );
}
