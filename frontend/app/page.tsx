"use client";

import React, { useState } from "react";
import dynamic from "next/dynamic";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  ShieldCheck,
  Cpu,
  Code2,
  Layers,
  GitBranch,
  Zap,
  Activity,
  Bot,
  FileText,
  Terminal,
  Globe,
  GraduationCap,
  Box,
  Eye,
} from "lucide-react";

import { RepoInputForm } from "@/features/repo-input/RepoInputForm";
import { Badge } from "@/components/ui/badge";

// Dynamically import 3D WebGL Knowledge Graph for Hero Centerpiece (SSR disabled for Three.js canvas)
const KnowledgeGraph3D = dynamic(
  () => import("@/features/architecture-graph/KnowledgeGraph3D"),
  {
    ssr: false,
    loading: () => (
      <div className="h-[460px] bg-graphite-panel rounded-xl border border-graphite-border flex flex-col items-center justify-center font-mono text-xs text-graphite-muted space-y-2">
        <div className="w-6 h-6 border-2 border-copper border-t-transparent rounded-full animate-spin" />
        <span>Initializing 3D WebGL Knowledge Topology Canvas...</span>
      </div>
    ),
  }
);

export type AgentCategoryKey = "arch" | "security" | "perf" | "qa";

interface AgentDef {
  id: string;
  name: string;
  category: AgentCategoryKey;
  categoryLabel: string;
  categoryHeader: string;
  accentColor: string;
  borderColor: string;
  badgeBg: string;
  badgeText: string;
  icon: React.ReactNode;
  role: string;
  description: string;
  tools: string[];
}

const AGENTS_LIST: AgentDef[] = [
  // Category A: Architecture & Dependency Topology (#5B82A6 Steel Slate Blue)
  {
    id: "planner",
    name: "Planner Agent",
    category: "arch",
    categoryLabel: "Architecture & Dependency Topology",
    categoryHeader: "SYS::ARCH_TOPOLOGY",
    accentColor: "#5B82A6",
    borderColor: "border-[#5B82A6]/40",
    badgeBg: "bg-[#5B82A6]/15",
    badgeText: "text-[#5B82A6]",
    icon: <Sparkles className="w-4 h-4 text-[#5B82A6]" />,
    role: "Orchestration & Scope Decomposition",
    description: "Parses repository scope, maps module imports, and schedules 10 parallel/sequential agent execution tasks across LangGraph DAG.",
    tools: ["LangGraph DAG", "Scope Analyzer", "Task Planner"],
  },
  {
    id: "analyzer",
    name: "Repository Analyzer",
    category: "arch",
    categoryLabel: "Architecture & Dependency Topology",
    categoryHeader: "SYS::ARCH_TOPOLOGY",
    accentColor: "#5B82A6",
    borderColor: "border-[#5B82A6]/40",
    badgeBg: "bg-[#5B82A6]/15",
    badgeText: "text-[#5B82A6]",
    icon: <Layers className="w-4 h-4 text-[#5B82A6]" />,
    role: "Symbol Extraction & Graph Builder",
    description: "Clones repo, parses source AST symbols across 15+ languages via regex extractor, and constructs NetworkX 2D/3D Knowledge Graph.",
    tools: ["GitIngestion Engine", "Regex Symbol Parser", "NetworkX Graph Builder"],
  },
  {
    id: "architect",
    name: "Architect Agent",
    category: "arch",
    categoryLabel: "Architecture & Dependency Topology",
    categoryHeader: "SYS::ARCH_TOPOLOGY",
    accentColor: "#5B82A6",
    borderColor: "border-[#5B82A6]/40",
    badgeBg: "bg-[#5B82A6]/15",
    badgeText: "text-[#5B82A6]",
    icon: <Cpu className="w-4 h-4 text-[#5B82A6]" />,
    role: "System Architecture & Layer Audit",
    description: "Evaluates Clean Architecture boundaries, module coupling metrics, service abstractions, and design pattern adherence.",
    tools: ["Pattern Classifier", "Coupling Metric Engine", "Layer Auditor"],
  },

  // Category B: Static Analysis & Vulnerability Triage (#FF3B30 High-Voltage Crimson)
  {
    id: "security",
    name: "Security Agent",
    category: "security",
    categoryLabel: "Static Analysis & Vulnerability Triage",
    categoryHeader: "SYS::SEC_TRIAGE",
    accentColor: "#FF3B30",
    borderColor: "border-[#FF3B30]/40",
    badgeBg: "bg-[#FF3B30]/15",
    badgeText: "text-[#FF3B30]",
    icon: <ShieldCheck className="w-4 h-4 text-[#FF3B30]" />,
    role: "Vulnerability & CVE Triage",
    description: "Audits CORS origins, environment secrets, SQL injection vectors, and hardcoded credential exposure across codebase.",
    tools: ["OWASP Ruleset", "Secrets Scanner", "CVE Inspector"],
  },
  {
    id: "bughunter",
    name: "Bug Hunter Agent",
    category: "security",
    categoryLabel: "Static Analysis & Vulnerability Triage",
    categoryHeader: "SYS::SEC_TRIAGE",
    accentColor: "#FF3B30",
    borderColor: "border-[#FF3B30]/40",
    badgeBg: "bg-[#FF3B30]/15",
    badgeText: "text-[#FF3B30]",
    icon: <Code2 className="w-4 h-4 text-[#FF3B30]" />,
    role: "Control Flow & Error Path Audit",
    description: "Identifies unhandled exception branches, middleware failures, null dereferences, and async error gaps.",
    tools: ["Control Flow Analyzer", "AST Heuristic Engine", "Exception Scanner"],
  },

  // Category C: Runtime & IO Performance (#FFB000 Amber Alert)
  {
    id: "performance",
    name: "Performance Agent",
    category: "perf",
    categoryLabel: "Runtime & IO Performance",
    categoryHeader: "SYS::PERF_PROFILER",
    accentColor: "#FFB000",
    borderColor: "border-[#FFB000]/40",
    badgeBg: "bg-[#FFB000]/15",
    badgeText: "text-[#FFB000]",
    icon: <Zap className="w-4 h-4 text-[#FFB000]" />,
    role: "Event-Loop & IO Bottleneck Audit",
    description: "Detects blocking synchronous IO on event loops, unindexed queries, heavy nested loops, and memory leaks.",
    tools: ["Async Event Profiler", "Executor Auditor", "Memory Telemetry"],
  },

  // Category D: Verification & Developer Onboarding (#00E676 Terminal Green)
  {
    id: "documentation",
    name: "Documentation Agent",
    category: "qa",
    categoryLabel: "Verification & Developer Onboarding",
    categoryHeader: "SYS::QA_LEARNING",
    accentColor: "#00E676",
    borderColor: "border-[#00E676]/40",
    badgeBg: "bg-[#00E676]/15",
    badgeText: "text-[#00E676]",
    icon: <FileText className="w-4 h-4 text-[#00E676]" />,
    role: "Docstrings & Specs Verification",
    description: "Verifies inline Python docstrings, README setup instructions, OpenAPI schema contracts, and API documentation completeness.",
    tools: ["Docstring Parser", "OpenAPI Validator", "Markdown Generator"],
  },
  {
    id: "reviewer",
    name: "Reviewer Agent Loop",
    category: "qa",
    categoryLabel: "Verification & Developer Onboarding",
    categoryHeader: "SYS::QA_LEARNING",
    accentColor: "#00E676",
    borderColor: "border-[#00E676]/40",
    badgeBg: "bg-[#00E676]/15",
    badgeText: "text-[#00E676]",
    icon: <Terminal className="w-4 h-4 text-[#00E676]" />,
    role: "Self-Correction Quality Gate",
    description: "Runs Review → Feedback → Rewrite → Validate → Approve verification loop, discarding false-positive AI findings.",
    tools: ["Verification Loop", "Confidence Scorer", "Claim Validator"],
  },
  {
    id: "learning",
    name: "Learning Agent",
    category: "qa",
    categoryLabel: "Verification & Developer Onboarding",
    categoryHeader: "SYS::QA_LEARNING",
    accentColor: "#00E676",
    borderColor: "border-[#00E676]/40",
    badgeBg: "bg-[#00E676]/15",
    badgeText: "text-[#00E676]",
    icon: <GraduationCap className="w-4 h-4 text-[#00E676]" />,
    role: "Codebase Mentor & Analogy Generator",
    description: "Synthesizes onboarding mental models, architectural analogies, line-by-line breakdowns, and concept guides.",
    tools: ["Analogy Engine", "Line Breakdown Parser", "Concept Guide"],
  },
  {
    id: "copilot",
    name: "Repository Copilot",
    category: "qa",
    categoryLabel: "Verification & Developer Onboarding",
    categoryHeader: "SYS::QA_LEARNING",
    accentColor: "#00E676",
    borderColor: "border-[#00E676]/40",
    badgeBg: "bg-[#00E676]/15",
    badgeText: "text-[#00E676]",
    icon: <Bot className="w-4 h-4 text-[#00E676]" />,
    role: "Multi-Turn Interactive RAG Copilot",
    description: "Answers natural language queries about codebase symbols, dependency paths, and refactoring strategies.",
    tools: ["Multi-Turn RAG", "AST Query Engine", "Refactor Assistant"],
  },
];

export default function HomePage() {
  const [selectedAgentId, setSelectedAgentId] = useState<string>("planner");
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<AgentCategoryKey | "all">("all");

  const activeAgent = AGENTS_LIST.find((a) => a.id === selectedAgentId) || AGENTS_LIST[0];
  const filteredAgents = activeCategoryFilter === "all"
    ? AGENTS_LIST
    : AGENTS_LIST.filter((a) => a.category === activeCategoryFilter);

  return (
    <div className="min-h-screen bg-graphite-canvas text-foreground flex flex-col font-sans selection:bg-copper selection:text-white">
      {/* Navigation Header */}
      <header className="w-full border-b border-graphite-border bg-graphite-canvas/95 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/RepoMind_AI_logo.jpeg"
              alt="RepoMind AI Logo"
              className="w-7 h-7 rounded object-cover border border-graphite-border"
            />
            <div className="flex items-center gap-2">
              <span className="font-display font-bold text-lg tracking-tight text-white">
                RepoMind AI
              </span>
              <span className="text-[10px] font-mono text-copper bg-copper/10 px-2 py-0.5 rounded border border-copper/30 uppercase tracking-wide">
                v1.0 Engine
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Badge variant="outline" className="hidden sm:inline-flex border-graphite-border text-graphite-muted font-mono text-xs">
              ChatGPT Codex Hackathon
            </Badge>
            <a
              href="https://github.com/himanshu-jadhav108/RepoMind-AI"
              target="_blank"
              rel="noreferrer"
              className="text-xs text-graphite-muted hover:text-white transition font-mono flex items-center gap-1.5 px-2.5 py-1 rounded bg-graphite-panel border border-graphite-border"
            >
              <Globe className="w-3.5 h-3.5 text-copper" />
              <span>GitHub</span>
            </a>
          </div>
        </div>
      </header>

      {/* Hero Section — centerpiece WebGL graph topology canvas */}
      <main className="flex-1 flex flex-col items-center px-4 pt-8 pb-16 relative">
        <div className="max-w-6xl w-full text-center space-y-6">
          {/* Header Badge */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded bg-graphite-panel border border-graphite-border text-xs font-mono text-copper"
          >
            <Terminal className="w-3.5 h-3.5 text-copper" />
            <span>AUTONOMOUS MULTI-AGENT CODEBASE AUDIT & TOPOLOGY ENGINE</span>
          </motion.div>

          {/* Display Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-3xl sm:text-5xl md:text-6xl font-display font-bold tracking-tight max-w-4xl mx-auto leading-tight text-white"
          >
            Don&apos;t Read Repositories Blind. <br />
            <span className="text-copper">Inspect 3D Knowledge Topology</span> & AI Audits.
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-graphite-muted text-sm sm:text-base max-w-2xl mx-auto leading-relaxed font-mono"
          >
            Clone any public GitHub repo. 10 specialized AI agents extract AST symbol graphs, audit security CVEs, profile performance bottlenecks, and build an interactive 3D WebGL knowledge topology.
          </motion.p>

          {/* HERO CENTERPIECE: Live WebGL 3D Graph Viewport Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="w-full max-w-5xl mx-auto rounded-xl bg-graphite-panel border border-graphite-border shadow-2xl overflow-hidden text-left"
          >
            {/* Viewport Control Bar */}
            <div className="panel-header px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
              <div className="flex items-center gap-2.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="font-bold text-white tracking-wider">VIEWPORT::3D_KNOWLEDGE_TOPOLOGY</span>
                <span className="text-graphite-muted hidden sm:inline">|</span>
                <span className="text-graphite-muted hidden sm:inline">350 files parsed • 1,200 symbols mapped</span>
              </div>

              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded bg-copper/10 text-copper border border-copper/30 text-[11px]">
                  Interactive WebGL Canvas
                </span>
              </div>
            </div>

            {/* In-Canvas Repository Form & Canvas Bar */}
            <div className="p-3 bg-graphite-canvas/80 border-b border-graphite-border">
              <RepoInputForm />
            </div>

            {/* 3D WebGL Graph Feature Centerpiece */}
            <div className="relative h-[420px] w-full bg-graphite-canvas">
              <KnowledgeGraph3D />
            </div>
          </motion.div>

          {/* Telemetry Indicator Metrics Bar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="max-w-5xl w-full mx-auto grid grid-cols-2 sm:grid-cols-4 gap-3 text-left font-mono pt-4"
          >
            <div className="p-3 rounded-lg bg-graphite-panel border border-graphite-border flex items-center gap-3">
              <div className="p-2 rounded bg-[#5B82A6]/10 text-[#5B82A6]">
                <Layers className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[10px] text-graphite-muted block uppercase">Symbol Parser</span>
                <span className="text-xs font-bold text-white">15+ Languages</span>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-graphite-panel border border-graphite-border flex items-center gap-3">
              <div className="p-2 rounded bg-severity-critical/10 text-severity-critical">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[10px] text-graphite-muted block uppercase">Security Triage</span>
                <span className="text-xs font-bold text-severity-critical">OWASP Top 10</span>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-graphite-panel border border-graphite-border flex items-center gap-3">
              <div className="p-2 rounded bg-severity-warning/10 text-severity-warning">
                <Zap className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[10px] text-graphite-muted block uppercase">Profiler</span>
                <span className="text-xs font-bold text-severity-warning">Event-Loop & IO</span>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-graphite-panel border border-graphite-border flex items-center gap-3">
              <div className="p-2 rounded bg-copper/10 text-copper">
                <Activity className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[10px] text-graphite-muted block uppercase">DAG Engine</span>
                <span className="text-xs font-bold text-copper">LangGraph 10-Agent</span>
              </div>
            </div>
          </motion.div>

          {/* AGENT WORKSPACE SECTION — 4-Category Color-Coded Redesign */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="max-w-5xl w-full mx-auto mt-16 text-left space-y-4"
          >
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-graphite-border pb-3 gap-3">
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2 font-display">
                  <Bot className="w-4 h-4 text-copper" />
                  <span>Autonomous AI Engineering Team (10 Agents)</span>
                </h2>
                <p className="text-xs text-graphite-muted font-mono mt-0.5">
                  Categorized by output domain and severity language. Select an agent to inspect execution tools.
                </p>
              </div>

              {/* Functional Category Filter Buttons */}
              <div className="flex flex-wrap gap-1.5 font-mono text-[11px]">
                <button
                  onClick={() => setActiveCategoryFilter("all")}
                  className={`px-2.5 py-1 rounded border transition ${
                    activeCategoryFilter === "all"
                      ? "bg-copper text-white border-copper font-bold"
                      : "bg-graphite-panel text-graphite-muted border-graphite-border hover:text-white"
                  }`}
                >
                  ALL (10)
                </button>
                <button
                  onClick={() => setActiveCategoryFilter("arch")}
                  className={`px-2.5 py-1 rounded border transition ${
                    activeCategoryFilter === "arch"
                      ? "bg-[#5B82A6]/20 text-[#5B82A6] border-[#5B82A6] font-bold"
                      : "bg-graphite-panel text-graphite-muted border-graphite-border hover:text-white"
                  }`}
                >
                  ARCH (3)
                </button>
                <button
                  onClick={() => setActiveCategoryFilter("security")}
                  className={`px-2.5 py-1 rounded border transition ${
                    activeCategoryFilter === "security"
                      ? "bg-[#FF3B30]/20 text-[#FF3B30] border-[#FF3B30] font-bold"
                      : "bg-graphite-panel text-graphite-muted border-graphite-border hover:text-white"
                  }`}
                >
                  SECURITY (2)
                </button>
                <button
                  onClick={() => setActiveCategoryFilter("perf")}
                  className={`px-2.5 py-1 rounded border transition ${
                    activeCategoryFilter === "perf"
                      ? "bg-[#FFB000]/20 text-[#FFB000] border-[#FFB000] font-bold"
                      : "bg-graphite-panel text-graphite-muted border-graphite-border hover:text-white"
                  }`}
                >
                  PERF (1)
                </button>
                <button
                  onClick={() => setActiveCategoryFilter("qa")}
                  className={`px-2.5 py-1 rounded border transition ${
                    activeCategoryFilter === "qa"
                      ? "bg-[#00E676]/20 text-[#00E676] border-[#00E676] font-bold"
                      : "bg-graphite-panel text-graphite-muted border-graphite-border hover:text-white"
                  }`}
                >
                  QA & DOCS (4)
                </button>
              </div>
            </div>

            {/* Agent Selector Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-2">
              {filteredAgents.map((agent) => {
                const isSelected = selectedAgentId === agent.id;
                return (
                  <button
                    key={agent.id}
                    onClick={() => setSelectedAgentId(agent.id)}
                    className={`p-2.5 rounded-lg border text-left font-mono transition-all duration-150 flex flex-col gap-1.5 ${
                      isSelected
                        ? `${agent.borderColor} bg-graphite-panel ${agent.badgeText} shadow-md ring-1 ring-white/10 scale-[1.02]`
                        : "bg-graphite-panel/60 border-graphite-border text-graphite-muted hover:text-white hover:border-graphite-muted/40"
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="text-[10px] uppercase tracking-wider text-graphite-muted">
                        {agent.categoryHeader}
                      </span>
                      {agent.icon}
                    </div>
                    <span className="text-xs font-bold text-white truncate">{agent.name}</span>
                  </button>
                );
              })}
            </div>

            {/* Selected Agent Workspace Active Detail Panel */}
            <AnimatePresence mode="wait">
              <motion.div
                key={activeAgent.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.15 }}
                className={`p-4 sm:p-5 rounded-xl bg-graphite-panel ${activeAgent.borderColor} border shadow-xl space-y-3 font-mono`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-graphite-border pb-3">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${activeAgent.badgeBg} border ${activeAgent.borderColor}`}>
                      {activeAgent.icon}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-mono ${activeAgent.badgeText} uppercase tracking-wider`}>
                          [{activeAgent.categoryHeader}]
                        </span>
                      </div>
                      <h3 className="text-base font-bold text-white font-display">{activeAgent.name}</h3>
                      <span className="text-xs text-graphite-muted">{activeAgent.role}</span>
                    </div>
                  </div>

                  <Badge variant="outline" className={`${activeAgent.borderColor} ${activeAgent.badgeText} ${activeAgent.badgeBg} text-xs font-mono`}>
                    LangGraph DAG Pipeline Node
                  </Badge>
                </div>

                <p className="text-xs text-foreground/90 leading-relaxed font-sans">
                  {activeAgent.description}
                </p>

                <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px]">
                  <span className="text-graphite-muted">Engine Toolkit:</span>
                  {activeAgent.tools.map((tool, idx) => (
                    <span
                      key={idx}
                      className={`px-2 py-0.5 rounded bg-graphite-canvas border border-graphite-border ${activeAgent.badgeText} font-mono`}
                    >
                      ⚡ {tool}
                    </span>
                  ))}
                </div>
              </motion.div>
            </AnimatePresence>
          </motion.div>

          {/* Technical Feature Cards Grid */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="max-w-5xl w-full mx-auto grid grid-cols-1 md:grid-cols-3 gap-4 mt-12 text-left font-mono"
          >
            <div className="p-5 rounded-xl bg-graphite-panel border border-graphite-border space-y-2.5">
              <div className="w-9 h-9 rounded bg-[#5B82A6]/15 text-[#5B82A6] border border-[#5B82A6]/30 flex items-center justify-center">
                <Box className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-bold text-white font-display">Symbol Graph Extraction</h3>
              <p className="text-xs text-graphite-muted leading-relaxed">
                Multi-language regex symbol parser scanning 15+ languages without heavy external AST binaries, building NetworkX dependency trees.
              </p>
            </div>

            <div className="p-5 rounded-xl bg-graphite-panel border border-graphite-border space-y-2.5">
              <div className="w-9 h-9 rounded bg-severity-critical/15 text-severity-critical border border-severity-critical/30 flex items-center justify-center">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-bold text-white font-display">Self-Correction Quality Gate</h3>
              <p className="text-xs text-graphite-muted leading-relaxed">
                Reviewer Agent loop (Review → Feedback → Validate → Approve) filtering out low-confidence AI claims before report generation.
              </p>
            </div>

            <div className="p-5 rounded-xl bg-graphite-panel border border-graphite-border space-y-2.5">
              <div className="w-9 h-9 rounded bg-copper/15 text-copper border border-copper/30 flex items-center justify-center">
                <Eye className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-bold text-white font-display">Explainability & Source Line Evidence</h3>
              <p className="text-xs text-graphite-muted leading-relaxed">
                Every finding includes line ranges, confidence scores, reasoning steps, and shallow git re-clone source evidence snippets.
              </p>
            </div>
          </motion.div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-graphite-border py-6 bg-graphite-canvas font-mono text-xs text-graphite-muted">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/RepoMind_AI_logo.jpeg" alt="Logo" className="w-4 h-4 rounded object-cover" />
            <span className="text-white font-bold">RepoMind AI</span>
            <span>— Autonomous Repository Audit Workspace</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded bg-graphite-panel border border-graphite-border text-[11px]">LangGraph</span>
            <span className="px-2 py-0.5 rounded bg-graphite-panel border border-graphite-border text-[11px]">FastAPI</span>
            <span className="px-2 py-0.5 rounded bg-graphite-panel border border-graphite-border text-[11px]">3D WebGL</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
