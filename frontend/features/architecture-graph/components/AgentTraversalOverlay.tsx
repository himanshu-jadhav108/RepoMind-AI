"use client";

import React from "react";
import { Bot, ArrowRight, ShieldCheck, CheckCircle2 } from "lucide-react";
import { useGraphStore, AgentName } from "../store/useGraphStore";

interface AgentTraversalOverlayProps {
  agentName: AgentName;
}

const AGENT_TRAVERSALS: Record<AgentName, { path: string[]; reasoning: string; confidence: number }> = {
  planner_agent: {
    path: ["root", "backend/app/main.py", "orchestration/graph.py"],
    reasoning: "Planner Agent mapped 10 execution stages and scheduled parallel AI analysis tasks.",
    confidence: 0.96,
  },
  repository_analyzer: {
    path: ["root", "backend/app/main.py", "analysis_toolkit/code_parser.py", "analysis_toolkit/dependency_graph.py"],
    reasoning: "Static analysis extracted AST symbols and built module dependency graph.",
    confidence: 0.98,
  },
  architect_agent: {
    path: ["backend/app/main.py", "services/analysis_service.py", "repositories/analysis_repository.py"],
    reasoning: "Architect Agent identified Clean Architecture boundaries & repository layer patterns.",
    confidence: 0.94,
  },
  bug_hunter_agent: {
    path: ["services/repo_ingestion_service.py", "api/v1/routes_analysis.py"],
    reasoning: "Bug Hunter Agent identified potential duplicate registration & async clone event loop blockage.",
    confidence: 0.91,
  },
  security_agent: {
    path: ["core/config.py", "api/v1/routes_analysis.py", "db/supabase_client.py"],
    reasoning: "Security Agent audited CORS environment parsing and validated Supabase query parameters.",
    confidence: 0.95,
  },
  performance_agent: {
    path: ["orchestration/graph.py", "analysis_toolkit/git_ingestion.py"],
    reasoning: "Performance Agent verified async run_in_executor offloading for git operations.",
    confidence: 0.92,
  },
  documentation_agent: {
    path: ["docs/SETUP_GUIDE.md", "README.md", "pyproject.toml"],
    reasoning: "Documentation Agent verified setup guide steps & environment variable documentation.",
    confidence: 0.89,
  },
  reviewer_agent: {
    path: ["agents/reviewer_agent.py", "models/finding.py"],
    reasoning: "Reviewer Agent executed confidence validation pass across all generated findings.",
    confidence: 0.97,
  },
  learning_agent: {
    path: ["agents/learning_agent.py", "api/v1/routes_analysis.py"],
    reasoning: "Learning Agent prepared plain-language code walkthroughs for interactive explainability.",
    confidence: 0.93,
  },
  feature_suggestion_agent: {
    path: ["agents/feature_suggestion_agent.py", "frontend/app/analyze/[runId]/page.tsx"],
    reasoning: "Feature Suggestion Agent proposed 3D WebGL Galaxy Visualization and live SSE timeline integration.",
    confidence: 0.95,
  },
};

export function AgentTraversalOverlay({ agentName }: AgentTraversalOverlayProps) {
  const setSelectedAgent = useGraphStore((s) => s.setSelectedAgent);
  const data = AGENT_TRAVERSALS[agentName] || AGENT_TRAVERSALS.architect_agent;

  return (
    <div className="absolute top-16 left-3 z-30 max-w-sm p-3.5 rounded-xl bg-card/95 border border-category-arch/40 backdrop-blur-xl shadow-2xl text-xs font-mono text-foreground animate-in fade-in duration-300">
      <div className="flex items-center justify-between border-b border-border pb-2 mb-2">
        <div className="flex items-center gap-2">
          <Bot className="w-4 h-4 text-category-arch animate-bounce" />
          <span className="font-bold text-foreground uppercase tracking-wider font-display">{agentName.replace("_", " ")}</span>
        </div>
        <button
          onClick={() => setSelectedAgent(null)}
          className="text-muted-foreground hover:text-foreground transition text-[10px]"
        >
          Close
        </button>
      </div>

      <p className="text-[11px] text-muted-foreground leading-relaxed mb-2.5 font-sans">
        {data.reasoning}
      </p>

      {/* Traversal Path */}
      <div className="p-2 rounded-lg bg-background border border-border mb-2 font-mono">
        <span className="text-[10px] text-category-arch font-semibold block mb-1">Inspected Reasoning Path:</span>
        <div className="flex flex-wrap items-center gap-1 text-[10.5px]">
          {data.path.map((node, i) => (
            <React.Fragment key={node}>
              <span className="px-1.5 py-0.5 rounded bg-card text-foreground border border-category-arch/30">
                {node}
              </span>
              {i < data.path.length - 1 && <ArrowRight className="w-3 h-3 text-category-arch shrink-0" />}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Confidence */}
      <div className="flex items-center justify-between text-[11px] font-bold text-emerald-600 dark:text-emerald-400 font-mono">
        <span className="flex items-center gap-1 text-category-arch">
          <ShieldCheck className="w-3.5 h-3.5" /> Verification Status:
        </span>
        <span className="flex items-center gap-1">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> {(data.confidence * 100).toFixed(0)}% Confidence
        </span>
      </div>
    </div>
  );
}
