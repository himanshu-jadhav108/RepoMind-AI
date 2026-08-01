"use client";

import React, { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  ShieldCheck,
  Cpu,
  Code2,
  Layers,
  GitBranch,
  ArrowRight,
  Zap,
  Activity,
  Bot,
  CheckCircle2,
  FileText,
  FileSearch,
  Users,
  Terminal,
  Globe,
  Award,
} from "lucide-react";
import { RepoInputForm } from "@/features/repo-input/RepoInputForm";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const AGENTS_LIST = [
  {
    id: "planner",
    name: "Planner Agent",
    icon: <Sparkles className="w-5 h-5 text-purple-400" />,
    color: "from-purple-500/20 to-indigo-500/10 border-purple-500/30",
    role: "Orchestration & Decomposition",
    description: "Parses repository scope, maps dependencies, and schedules 10 parallel/sequential agent execution tasks.",
    tools: ["LangGraph DAG", "Scope Analyzer", "Task Planner"],
  },
  {
    id: "analyzer",
    name: "Repository Analyzer",
    icon: <Layers className="w-5 h-5 text-indigo-400" />,
    color: "from-indigo-500/20 to-blue-500/10 border-indigo-500/30",
    role: "Symbol Extraction & Graph Builder",
    description: "Clones repo, parses source AST symbols across 15+ languages via multi-language regex extractor, and builds NetworkX 2D/3D Knowledge Graph.",
    tools: ["GitPython", "Regex Extractor", "NetworkX 3D"],
  },
  {
    id: "architect",
    name: "Architect Agent",
    icon: <Cpu className="w-5 h-5 text-blue-400" />,
    color: "from-blue-500/20 to-cyan-500/10 border-blue-500/30",
    role: "System Architecture Audit",
    description: "Evaluates Clean Architecture boundaries, design patterns, module coupling, and service layer abstractions.",
    tools: ["Pattern Classifier", "Coupling Metric Engine", "Layer Audit"],
  },
  {
    id: "bughunter",
    name: "Bug Hunter Agent",
    icon: <Code2 className="w-5 h-5 text-amber-400" />,
    color: "from-amber-500/20 to-yellow-500/10 border-amber-500/30",
    role: "Static Smell & Error Analysis",
    description: "Identifies unhandled exception paths, middleware failures, null dereferences, and async deadlocks.",
    tools: ["Control Flow Graph", "AST Heuristic Engine", "Exception Scanner"],
  },
  {
    id: "security",
    name: "Security Agent",
    icon: <ShieldCheck className="w-5 h-5 text-emerald-400" />,
    color: "from-emerald-500/20 to-teal-500/10 border-emerald-500/30",
    role: "Vulnerability & CVE Audit",
    description: "Audits CORS origins, environment configs, SQL injection patterns, and secrets management.",
    tools: ["OWASP Top 10", "Bandit Rules", "Secrets Scanner"],
  },
  {
    id: "performance",
    name: "Performance Agent",
    icon: <Zap className="w-5 h-5 text-amber-500" />,
    color: "from-yellow-500/20 to-amber-500/10 border-yellow-500/30",
    role: "Event-Loop & IO Profiling",
    description: "Detects blocking IO on event loops, unindexed queries, heavy synchronous loops, and memory leaks.",
    tools: ["Async Profiler", "Executor Audit", "Memory Monitor"],
  },
  {
    id: "documentation",
    name: "Documentation Agent",
    icon: <FileText className="w-5 h-5 text-sky-400" />,
    color: "from-sky-500/20 to-blue-500/10 border-sky-500/30",
    role: "Docstrings & OpenAPI Verification",
    description: "Verifies inline Python docstrings, README clarity, OpenAPI specs, and setup instructions.",
    tools: ["Docstring Parser", "OpenAPI Validator", "Markdown Generator"],
  },
  {
    id: "reviewer",
    name: "Reviewer Agent Loop",
    icon: <ShieldCheck className="w-5 h-5 text-violet-400" />,
    color: "from-violet-500/20 to-purple-500/10 border-violet-500/30",
    role: "Self-Correction Quality Gate",
    description: "Executes Review → Feedback → Rewrite → Validate → Approve loop, filtering low-confidence AI claims.",
    tools: ["Verification Loop", "Confidence Scorer", "Claim Validation"],
  },
];

export default function HomePage() {
  const [selectedAgentId, setSelectedAgentId] = useState<string>("planner");
  const activeAgent = AGENTS_LIST.find((a) => a.id === selectedAgentId) || AGENTS_LIST[0];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-purple-500 selection:text-white overflow-hidden font-sans">
      {/* Navigation Header */}
      <header className="w-full border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <motion.img
              whileHover={{ scale: 1.1, rotate: 5 }}
              transition={{ type: "spring", stiffness: 400 }}
              src="/RepoMind_AI_logo.jpeg"
              alt="RepoMind AI Logo"
              className="w-9 h-9 rounded-xl object-cover shadow-lg shadow-purple-500/30 border border-purple-500/40 cursor-pointer"
            />
            <span className="font-extrabold text-xl tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-purple-400 via-pink-400 to-indigo-400">
              RepoMind AI
            </span>
          </div>

          <div className="flex items-center gap-4">
            <Badge variant="outline" className="hidden sm:inline-flex border-purple-500/40 text-purple-300 bg-purple-950/40 font-mono text-xs">
              ChatGPT Codex India Hackathon
            </Badge>
            <a
              href="https://github.com/himanshu-jadhav108/RepoMind-AI"
              target="_blank"
              rel="noreferrer"
              className="text-xs text-slate-400 hover:text-white transition font-mono flex items-center gap-1"
            >
              <Globe className="w-3.5 h-3.5 text-purple-400" /> GitHub Repo
            </a>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 pt-12 pb-20 text-center relative overflow-hidden">
        {/* Animated Background Glowing Orbs */}
        <motion.div
          animate={{
            scale: [1, 1.25, 1],
            opacity: [0.25, 0.45, 0.25],
          }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] bg-purple-600/20 rounded-full blur-[140px] pointer-events-none"
        />
        <motion.div
          animate={{
            scale: [1.2, 1, 1.2],
            opacity: [0.2, 0.4, 0.2],
          }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-1/3 left-1/3 w-[500px] h-[300px] bg-cyan-600/15 rounded-full blur-[120px] pointer-events-none"
        />

        {/* Hero Badge */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-purple-950/80 border border-purple-500/40 text-xs font-semibold text-purple-300 mb-6 shadow-xl backdrop-blur-md font-mono"
        >
          <Sparkles className="w-4 h-4 text-purple-400 animate-pulse" />
          <span>Autonomous Multi-Agent AI Engineering Platform</span>
        </motion.div>

        {/* Animated Hero Title */}
        <motion.h1
          initial="hidden"
          animate="visible"
          variants={{
            hidden: { opacity: 0 },
            visible: {
              opacity: 1,
              transition: { staggerChildren: 0.05, delayChildren: 0.1 },
            },
          }}
          className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight max-w-5xl mb-6 font-sans leading-tight flex flex-wrap justify-center gap-x-3 gap-y-1"
        >
          {"Turn Any Repository into an".split(" ").map((word, i) => (
            <motion.span
              key={i}
              variants={{
                hidden: { opacity: 0, y: 25, filter: "blur(8px)" },
                visible: { opacity: 1, y: 0, filter: "blur(0px)", transition: { type: "spring", stiffness: 120, damping: 14 } },
              }}
              className="inline-block text-white"
            >
              {word}
            </motion.span>
          ))}
          {"Explained,".split(" ").map((word, i) => (
            <motion.span
              key={`exp-${i}`}
              variants={{
                hidden: { opacity: 0, y: 25, filter: "blur(8px)" },
                visible: { opacity: 1, y: 0, filter: "blur(0px)", transition: { type: "spring", stiffness: 120, damping: 14 } },
              }}
              className="inline-block bg-clip-text text-transparent bg-gradient-to-r from-purple-400 via-pink-400 to-indigo-400 drop-shadow-[0_0_25px_rgba(168,85,247,0.4)]"
            >
              {word}
            </motion.span>
          ))}
          {"Audit-Ready".split(" ").map((word, i) => (
            <motion.span
              key={`audit-${i}`}
              variants={{
                hidden: { opacity: 0, y: 25, filter: "blur(8px)" },
                visible: { opacity: 1, y: 0, filter: "blur(0px)", transition: { type: "spring", stiffness: 120, damping: 14 } },
              }}
              className="inline-block bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-emerald-400 drop-shadow-[0_0_25px_rgba(56,189,248,0.4)]"
            >
              {word}
            </motion.span>
          ))}
          {"Engineering Artifact".split(" ").map((word, i) => (
            <motion.span
              key={`artifact-${i}`}
              variants={{
                hidden: { opacity: 0, y: 25, filter: "blur(8px)" },
                visible: { opacity: 1, y: 0, filter: "blur(0px)", transition: { type: "spring", stiffness: 120, damping: 14 } },
              }}
              className="inline-block text-white"
            >
              {word}
            </motion.span>
          ))}
        </motion.h1>

        {/* Animated Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 20, filter: "blur(6px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ duration: 0.8, delay: 0.45, ease: "easeOut" }}
          className="text-slate-300 text-base sm:text-xl max-w-3xl mb-10 leading-relaxed font-mono"
        >
          Delegate{" "}
          <span className="text-purple-300 font-semibold px-1.5 py-0.5 rounded bg-purple-950/60 border border-purple-500/30">
            architecture discovery
          </span>
          ,{" "}
          <span className="text-emerald-300 font-semibold px-1.5 py-0.5 rounded bg-emerald-950/60 border border-emerald-500/30">
            security triage
          </span>
          ,{" "}
          <span className="text-cyan-300 font-semibold px-1.5 py-0.5 rounded bg-cyan-950/60 border border-cyan-500/30">
            2D/3D knowledge graph visualization
          </span>
          , and report generation to an autonomous team of{" "}
          <span className="text-amber-300 font-bold px-2 py-0.5 rounded bg-amber-950/60 border border-amber-500/30">
            10 specialized AI agents
          </span>
          .
        </motion.p>

        {/* Prominent Demo & Input Form Container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="w-full max-w-2xl space-y-4"
        >
          <RepoInputForm />
        </motion.div>

        {/* Live Metrics Ticker Bar */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.4 }}
          className="max-w-4xl w-full grid grid-cols-2 sm:grid-cols-4 gap-3 mt-12 text-left font-mono"
        >
          <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 backdrop-blur-md flex items-center gap-3">
            <div className="p-2 rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-400">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block uppercase">Multi-Agent</span>
              <span className="text-sm font-bold text-white">10 Specialized Agents</span>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 backdrop-blur-md flex items-center gap-3">
            <div className="p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
              <Activity className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block uppercase">Health Index</span>
              <span className="text-sm font-bold text-emerald-400">7 Health Dimensions</span>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 backdrop-blur-md flex items-center gap-3">
            <div className="p-2 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block uppercase">Visualization</span>
              <span className="text-sm font-bold text-indigo-300">2D / 3D WebGL Graph</span>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 backdrop-blur-md flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400">
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block uppercase">Orchestration</span>
              <span className="text-sm font-bold text-amber-300">LangGraph DAG Engine</span>
            </div>
          </div>
        </motion.div>

        {/* Interactive 10-Agent Live Showcase Section */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5 }}
          className="max-w-5xl w-full mt-20 text-left space-y-4"
        >
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-slate-800 pb-3 gap-2">
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2 font-sans">
                <Bot className="w-5 h-5 text-purple-400" />
                <span>Interactive AI Engineering Team</span>
              </h2>
              <p className="text-xs text-slate-400 font-mono mt-0.5">
                Click any agent below to inspect its role, tools, and execution strategy.
              </p>
            </div>
            <Badge variant="outline" className="border-purple-500/30 text-purple-300 font-mono text-[11px]">
              LangGraph State Machine
            </Badge>
          </div>

          {/* Agent Selection Chips - Single Row Layout */}
          <div className="flex flex-nowrap overflow-x-auto gap-1.5 pt-2 pb-1 scrollbar-none w-full items-center">
            {AGENTS_LIST.map((agent) => {
              const isSelected = selectedAgentId === agent.id;
              return (
                <button
                  key={agent.id}
                  onClick={() => setSelectedAgentId(agent.id)}
                  className={`px-2.5 py-1.5 rounded-xl border text-[11px] font-mono transition-all duration-200 flex items-center gap-1.5 shrink-0 whitespace-nowrap ${
                    isSelected
                      ? "bg-purple-950/80 border-purple-500/60 text-purple-200 ring-2 ring-purple-500/30 shadow-lg scale-[1.02]"
                      : "bg-slate-900/60 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700"
                  }`}
                >
                  {agent.icon}
                  <span>{agent.name}</span>
                </button>
              );
            })}
          </div>

          {/* Selected Agent Active Card Display */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeAgent.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className={`p-5 rounded-2xl bg-gradient-to-r ${activeAgent.color} border backdrop-blur-xl shadow-2xl space-y-3 font-mono`}
            >
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 shadow">
                    {activeAgent.icon}
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white font-sans">{activeAgent.name}</h3>
                    <span className="text-xs text-purple-300">{activeAgent.role}</span>
                  </div>
                </div>
                <Badge variant="outline" className="border-emerald-500/30 text-emerald-400 bg-emerald-500/10 text-xs">
                  Active in Pipeline
                </Badge>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed font-sans">
                {activeAgent.description}
              </p>

              <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px]">
                <span className="text-slate-400">Toolkit & Engine:</span>
                {activeAgent.tools.map((t, idx) => (
                  <span
                    key={idx}
                    className="px-2.5 py-0.5 rounded-md bg-slate-950/80 border border-slate-800 text-purple-200 font-mono"
                  >
                    ⚡ {t}
                  </span>
                ))}
              </div>
            </motion.div>
          </AnimatePresence>
        </motion.div>

        {/* Feature Cards Grid */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="max-w-6xl w-full grid grid-cols-1 md:grid-cols-3 gap-6 mt-16 text-left"
        >
          <motion.div
            whileHover={{ y: -6, scale: 1.02 }}
            transition={{ type: "spring", stiffness: 300 }}
            className="p-6 rounded-2xl bg-slate-900/80 border border-purple-500/30 backdrop-blur-xl shadow-xl space-y-3"
          >
            <div className="w-11 h-11 rounded-xl bg-purple-500/15 flex items-center justify-center text-purple-400 border border-purple-500/30 shadow-inner">
              <Cpu className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-white font-sans">Repository Knowledge Graph</h3>
            <p className="text-xs text-slate-400 leading-relaxed font-mono">
              Interactive 2D ReactFlow and 3D WebGL Galaxy graph mapping file structures, module imports, class hierarchies, and symbol call trees.
            </p>
          </motion.div>

          <motion.div
            whileHover={{ y: -6, scale: 1.02 }}
            transition={{ type: "spring", stiffness: 300 }}
            className="p-6 rounded-2xl bg-slate-900/80 border border-emerald-500/30 backdrop-blur-xl shadow-xl space-y-3"
          >
            <div className="w-11 h-11 rounded-xl bg-emerald-500/15 flex items-center justify-center text-emerald-400 border border-emerald-500/30 shadow-inner">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-white font-sans">Reviewer Agent Quality Gate</h3>
            <p className="text-xs text-slate-400 leading-relaxed font-mono">
              Self-correction verification loop (Review → Feedback → Rewrite → Validate → Approve) clearing AI findings before final report generation.
            </p>
          </motion.div>

          <motion.div
            whileHover={{ y: -6, scale: 1.02 }}
            transition={{ type: "spring", stiffness: 300 }}
            className="p-6 rounded-2xl bg-slate-900/80 border border-sky-500/30 backdrop-blur-xl shadow-xl space-y-3"
          >
            <div className="w-11 h-11 rounded-xl bg-sky-500/15 flex items-center justify-center text-sky-400 border border-sky-500/30 shadow-inner">
              <GitBranch className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-white font-sans">Explainability by Default</h3>
            <p className="text-xs text-slate-400 leading-relaxed font-mono">
              Every finding includes AI Reasoning, Confidence %, AST Evidence Snippets, Referenced Files, Recommendation Rationale, and Limitations.
            </p>
          </motion.div>
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-slate-800/80 py-8 bg-slate-950">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-mono text-slate-400">
          <div className="flex items-center gap-2">
            <img src="/RepoMind_AI_logo.jpeg" alt="Logo" className="w-5 h-5 rounded object-cover" />
            <span className="text-slate-300 font-bold">RepoMind AI</span> — Autonomous Software Engineering Workspace
          </div>
          <div className="flex items-center gap-3">
            <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800">LangGraph</span>
            <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800">FastAPI</span>
            <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800">Next.js 14</span>
            <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800">3D WebGL</span>
          </div>
        </div>
      </footer>
    </div>
  );
}


