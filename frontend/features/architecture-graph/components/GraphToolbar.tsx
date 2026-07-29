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
    <div className="w-full bg-slate-900/90 border-b border-border/80 p-3 backdrop-blur-xl flex flex-wrap items-center justify-between gap-3 font-mono text-xs">
      {/* Search Input */}
      <div className="relative flex-1 min-w-[220px] max-w-sm">
        <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Instant search by file, function, class..."
          className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 transition"
        />
      </div>

      {/* Top 5 Layout Mode Selector */}
      <div className="flex items-center gap-2">
        <span className="text-slate-400 flex items-center gap-1 font-semibold">
          <Layers className="w-3.5 h-3.5 text-indigo-400" /> Layout:
        </span>
        <select
          value={layoutMode}
          onChange={(e) => setLayoutMode(e.target.value as LayoutMode)}
          className="px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-indigo-300 font-bold focus:outline-none focus:border-indigo-500 cursor-pointer shadow"
        >
          {TOP_5_LAYOUT_OPTIONS.map((opt) => (
            <option key={opt.id} value={opt.id}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {/* AI Agent Traversal View Selector */}
      <div className="flex items-center gap-2">
        <span className="text-purple-400 flex items-center gap-1 font-semibold">
          <Bot className="w-3.5 h-3.5 text-purple-400" /> Agent View:
        </span>
        <select
          value={selectedAgent || ""}
          onChange={(e) => setSelectedAgent(e.target.value ? (e.target.value as AgentName) : null)}
          className="px-2.5 py-1.5 rounded-lg bg-purple-950/80 border border-purple-500/40 text-purple-200 font-semibold focus:outline-none focus:border-purple-400 cursor-pointer"
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
      <div className="flex items-center gap-2">
        <span className="text-slate-400 flex items-center gap-1">
          <Filter className="w-3.5 h-3.5 text-slate-400" /> Risk:
        </span>
        <select
          value={selectedRisk}
          onChange={(e) => setSelectedRisk(e.target.value as any)}
          className="px-2 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-300 focus:outline-none focus:border-indigo-500 cursor-pointer"
        >
          <option value="all">All Risks</option>
          <option value="critical">Critical Only</option>
          <option value="high">High & Critical</option>
          <option value="medium">Medium+</option>
          <option value="low">Low+</option>
        </select>
      </div>
    </div>
  );
}
