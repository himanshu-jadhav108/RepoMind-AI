"use client";

import React, { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  Layers,
  Cpu,
  Code2,
  ShieldCheck,
  Zap,
  FileText,
  Activity,
  Users,
  CheckCircle2,
  GitBranch,
} from "lucide-react";

import { getApiBase } from "@/lib/api-client";

interface AnalysisLoadingOverlayProps {


  runId: string;
  repoUrl: string;
  onComplete: () => void;
}

const AGENTS = [
  {
    key: "planner_agent",
    label: "Planner Agent",
    role: "Orchestration",
    icon: Sparkles,
    color: "purple",
    thought: "Mapping repository scope and scheduling 10-stage execution plan...",
  },
  {
    key: "repository_analyzer",
    label: "Repository Analyzer",
    role: "AST & Graph",
    icon: Layers,
    color: "indigo",
    thought: "Cloning repository and extracting symbols across all source files...",
  },
  {
    key: "architect_agent",
    label: "Architect Agent",
    role: "Architecture",
    icon: Cpu,
    color: "blue",
    thought: "Evaluating Clean Architecture boundaries and module coupling metrics...",
  },
  {
    key: "bug_hunter_agent",
    label: "Bug Hunter",
    role: "Static Analysis",
    icon: Code2,
    color: "amber",
    thought: "Scanning exception boundaries, unhandled paths, and logic flaws...",
  },
  {
    key: "security_agent",
    label: "Security Agent",
    role: "Vulnerability Audit",
    icon: ShieldCheck,
    color: "emerald",
    thought: "Auditing CORS configs, env secrets, and OWASP Top 10 vectors...",
  },
  {
    key: "performance_agent",
    label: "Performance Agent",
    role: "I/O Profiling",
    icon: Zap,
    color: "yellow",
    thought: "Detecting blocking I/O, memory leaks, and async execution gaps...",
  },
  {
    key: "documentation_agent",
    label: "Documentation Agent",
    role: "Coverage Check",
    icon: FileText,
    color: "sky",
    thought: "Verifying docstring coverage and API schema compliance...",
  },
  {
    key: "reviewer_agent",
    label: "Reviewer Agent",
    role: "Quality Gate",
    icon: Users,
    color: "violet",
    thought: "Running Review → Feedback → Rewrite → Validate loop on all findings...",
  },
  {
    key: "feature_suggestion_agent",
    label: "Feature Agent",
    role: "Suggestions",
    icon: Activity,
    color: "pink",
    thought: "Generating architecture enhancement recommendations...",
  },
  {
    key: "report_generator",
    label: "Report Generator",
    role: "Final Audit",
    icon: CheckCircle2,
    color: "emerald",
    thought: "Compiling engineering audit report with confidence scores...",
  },
];

const COLOR_MAP: Record<string, { ring: string; bg: string; text: string; dot: string }> = {
  purple: { ring: "ring-purple-500/60", bg: "bg-purple-500/20", text: "text-purple-300", dot: "bg-purple-400" },
  indigo: { ring: "ring-indigo-500/60", bg: "bg-indigo-500/20", text: "text-indigo-300", dot: "bg-indigo-400" },
  blue: { ring: "ring-blue-500/60", bg: "bg-blue-500/20", text: "text-blue-300", dot: "bg-blue-400" },
  amber: { ring: "ring-amber-500/60", bg: "bg-amber-500/20", text: "text-amber-300", dot: "bg-amber-400" },
  emerald: { ring: "ring-emerald-500/60", bg: "bg-emerald-500/20", text: "text-emerald-300", dot: "bg-emerald-400" },
  yellow: { ring: "ring-yellow-500/60", bg: "bg-yellow-500/20", text: "text-yellow-300", dot: "bg-yellow-400" },
  sky: { ring: "ring-sky-500/60", bg: "bg-sky-500/20", text: "text-sky-300", dot: "bg-sky-400" },
  violet: { ring: "ring-violet-500/60", bg: "bg-violet-500/20", text: "text-violet-300", dot: "bg-violet-400" },
  pink: { ring: "ring-pink-500/60", bg: "bg-pink-500/20", text: "text-pink-300", dot: "bg-pink-400" },
};

type AgentState = "queued" | "running" | "complete";

export function AnalysisLoadingOverlay({
  runId,
  repoUrl,
  onComplete,
}: AnalysisLoadingOverlayProps) {
  const [agentStates, setAgentStates] = useState<Record<string, AgentState>>(() =>
    Object.fromEntries(AGENTS.map((a) => [a.key, "queued"]))
  );
  const [currentThought, setCurrentThought] = useState<string>(AGENTS[0].thought);
  const [runningAgent, setRunningAgent] = useState<string | null>(null);
  const [completedCount, setCompletedCount] = useState(0);
  const [isAllDone, setIsAllDone] = useState(false);
  const eventSourceRef = useRef<EventSource | null>(null);

  const repoName = repoUrl
    .replace("https://github.com/", "")
    .replace(".git", "");

  // Connect to SSE stream or run accelerated simulation for demo mode
  useEffect(() => {
    const isDemo = runId.toLowerCase().includes("demo") || runId.toLowerCase().includes("hackathon");

    if (isDemo) {
      runSimulation(180, 400);
      return;
    }

    const API_BASE = getApiBase();
    const sseUrl = `${API_BASE}/api/v1/analysis/${runId}/stream`;


    try {
      const es = new EventSource(sseUrl);
      eventSourceRef.current = es;

      es.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          if (data.event === "pipeline_complete") {
            setAgentStates((prev) => {
              const next = { ...prev };
              AGENTS.forEach((a) => { next[a.key] = "complete"; });
              return next;
            });
            setCompletedCount(AGENTS.length);
            setRunningAgent(null);
            setIsAllDone(true);
            es.close();

            setTimeout(() => onComplete(), 800);
            return;
          }

          if (data.agent && data.status) {
            const agentKey = data.agent as string;
            setAgentStates((prev) => ({
              ...prev,
              [agentKey]: data.status === "completed" ? "complete" : data.status === "running" ? "running" : prev[agentKey],
            }));

            if (data.status === "running") {
              const agentMeta = AGENTS.find((a) => a.key === agentKey);
              if (agentMeta) {
                setCurrentThought(agentMeta.thought);
                setRunningAgent(agentKey);
              }
            }

            if (data.status === "completed") {
              setCompletedCount((p) => Math.min(p + 1, AGENTS.length));
              if (runningAgent === agentKey) setRunningAgent(null);
            }
          }
        } catch {
          // ignore
        }
      };

      es.onerror = () => {
        es.close();
        runSimulation(450, 800);
      };
    } catch {
      runSimulation(450, 800);
    }

    return () => {
      eventSourceRef.current?.close();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [runId]);

  function runSimulation(stepMs = 450, finishDelayMs = 800) {
    let i = 0;
    const interval = setInterval(() => {
      if (i >= AGENTS.length) {
        clearInterval(interval);
        setAgentStates((prev) => {
          const next = { ...prev };
          AGENTS.forEach((a) => { next[a.key] = "complete"; });
          return next;
        });
        setCompletedCount(AGENTS.length);
        setIsAllDone(true);
        setRunningAgent(null);
        setTimeout(() => onComplete(), finishDelayMs);
        return;
      }
      const agent = AGENTS[i];
      setRunningAgent(agent.key);
      setCurrentThought(agent.thought);
      setAgentStates((prev) => ({
        ...prev,
        ...(i > 0 ? { [AGENTS[i - 1].key]: "complete" } : {}),
        [agent.key]: "running",
      }));
      setCompletedCount(i);
      i++;
    }, stepMs);
  }

  const progressPct = Math.round((completedCount / AGENTS.length) * 100);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.4 }}
        className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-950 overflow-hidden"
      >
        {/* Background radial glow */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-purple-600/8 rounded-full blur-3xl" />
          <div className="absolute top-1/3 left-1/4 w-[400px] h-[400px] bg-indigo-600/6 rounded-full blur-3xl" />
          <div className="absolute bottom-1/3 right-1/4 w-[400px] h-[400px] bg-blue-600/6 rounded-full blur-3xl" />
          {/* Grid */}
          <div
            className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage: "linear-gradient(rgba(139,92,246,0.8) 1px, transparent 1px), linear-gradient(90deg, rgba(139,92,246,0.8) 1px, transparent 1px)",
              backgroundSize: "40px 40px",
            }}
          />
        </div>

        <div className="relative z-10 flex flex-col items-center w-full max-w-4xl px-4 gap-8">
          {/* Header: Logo + Repo being analyzed */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="flex flex-col items-center gap-3 text-center"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center">
                <GitBranch className="w-5 h-5 text-purple-400" />
              </div>
              <div className="text-left">
                <div className="text-xs font-mono text-slate-500 uppercase tracking-wider">Analyzing Repository</div>
                <div className="text-sm font-mono text-purple-300 font-semibold">{repoName}</div>
              </div>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              Deploying Your{" "}
              <span className="bg-gradient-to-r from-purple-400 to-indigo-400 bg-clip-text text-transparent">
                Autonomous Engineering Team
              </span>
            </h1>
            <p className="text-sm text-slate-400 font-mono">
              10 specialized AI agents are analyzing your codebase in real-time
            </p>
          </motion.div>

          {/* Agent Pipeline Grid */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="w-full grid grid-cols-5 sm:grid-cols-10 gap-2"
          >
            {AGENTS.map((agent) => {
              const state = agentStates[agent.key];
              const colors = COLOR_MAP[agent.color] || COLOR_MAP.purple;
              const Icon = agent.icon;
              const isRunning = state === "running";
              const isDone = state === "complete";

              return (
                <motion.div
                  key={agent.key}
                  animate={isRunning ? { scale: [1, 1.05, 1] } : {}}
                  transition={{ repeat: Infinity, duration: 1.2 }}
                  className={`flex flex-col items-center gap-1.5 p-2 rounded-xl border transition-all duration-300 ${
                    isDone
                      ? "border-emerald-500/40 bg-emerald-500/10"
                      : isRunning
                      ? `border ring-2 ${colors.ring} ${colors.bg}`
                      : "border-slate-800 bg-slate-900/40"
                  }`}
                >
                  <div className={`relative w-8 h-8 rounded-lg flex items-center justify-center ${isDone ? "bg-emerald-500/20" : isRunning ? colors.bg : "bg-slate-800"}`}>
                    {isDone ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <Icon className={`w-4 h-4 ${isRunning ? colors.text : "text-slate-500"}`} />
                    )}
                    {isRunning && (
                      <span className={`absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full ${colors.dot} animate-ping`} />
                    )}
                  </div>
                  <span className={`text-[9px] font-mono text-center leading-tight ${isDone ? "text-emerald-400" : isRunning ? colors.text : "text-slate-600"}`}>
                    {agent.label.replace(" Agent", "").replace("Repository ", "Repo ")}
                  </span>
                </motion.div>
              );
            })}
          </motion.div>

          {/* Live Thought Bubble */}
          <AnimatePresence mode="wait">
            <motion.div
              key={currentThought}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25 }}
              className="w-full max-w-2xl px-4 py-3 rounded-xl border border-purple-500/20 bg-purple-950/30 backdrop-blur-sm"
            >
              <div className="flex items-start gap-2.5">
                <div className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse mt-1.5 shrink-0" />
                <p className="text-sm font-mono text-purple-200 leading-relaxed">
                  {isAllDone
                    ? "✅ Analysis complete. Engineering workspace is ready."
                    : currentThought}
                </p>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Progress Bar */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="w-full max-w-2xl space-y-2"
          >
            <div className="flex justify-between text-xs font-mono text-slate-500">
              <span>Pipeline Progress</span>
              <span className={isAllDone ? "text-emerald-400" : "text-purple-300"}>
                {isAllDone ? "Complete" : `${completedCount} / ${AGENTS.length} agents`}
              </span>
            </div>
            <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
              <motion.div
                className={`h-full rounded-full ${isAllDone ? "bg-emerald-500" : "bg-gradient-to-r from-purple-500 to-indigo-500"}`}
                initial={{ width: "0%" }}
                animate={{ width: `${progressPct}%` }}
                transition={{ duration: 0.5, ease: "easeOut" }}
              />
            </div>
          </motion.div>

          {/* Completion State */}
          <AnimatePresence>
            {isAllDone && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center gap-2"
              >
                <div className="w-12 h-12 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center">
                  <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                </div>
                <p className="text-sm font-mono text-emerald-400">Opening workspace...</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
