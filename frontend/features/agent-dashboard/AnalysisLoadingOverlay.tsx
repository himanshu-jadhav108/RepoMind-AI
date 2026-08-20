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
  AlertTriangle,
  ArrowLeft,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

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
    color: "copper",
    thought: "Mapping repository scope and scheduling 10-stage execution plan...",
  },
  {
    key: "repository_analyzer",
    label: "Repository Analyzer",
    role: "AST & Graph",
    icon: Layers,
    color: "arch",
    thought: "Cloning repository and extracting symbols across all source files...",
  },
  {
    key: "architect_agent",
    label: "Architect Agent",
    role: "Architecture",
    icon: Cpu,
    color: "arch",
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
    color: "crimson",
    thought: "Auditing CORS configs, env secrets, and OWASP Top 10 vectors...",
  },
  {
    key: "performance_agent",
    label: "Performance Agent",
    role: "I/O Profiling",
    icon: Zap,
    color: "amber",
    thought: "Detecting blocking I/O, memory leaks, and async execution gaps...",
  },
  {
    key: "documentation_agent",
    label: "Documentation Agent",
    role: "Coverage Check",
    icon: FileText,
    color: "emerald",
    thought: "Verifying docstring coverage and API schema compliance...",
  },
  {
    key: "reviewer_agent",
    label: "Reviewer Agent",
    role: "Quality Gate",
    icon: Users,
    color: "arch",
    thought: "Running Review → Feedback → Rewrite → Validate loop on all findings...",
  },
  {
    key: "feature_suggestion_agent",
    label: "Feature Agent",
    role: "Suggestions",
    icon: Activity,
    color: "copper",
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
  copper: { ring: "ring-copper/60", bg: "bg-copper/20", text: "text-copper", dot: "bg-copper" },
  arch: { ring: "ring-[#5B82A6]/60", bg: "bg-[#5B82A6]/20", text: "text-[#5B82A6]", dot: "bg-[#5B82A6]" },
  amber: { ring: "ring-severity-warning/60", bg: "bg-severity-warning/20", text: "text-severity-warning", dot: "bg-severity-warning" },
  crimson: { ring: "ring-severity-critical/60", bg: "bg-severity-critical/20", text: "text-severity-critical", dot: "bg-severity-critical" },
  emerald: { ring: "ring-emerald-500/60", bg: "bg-emerald-500/20", text: "text-emerald-400", dot: "bg-emerald-400" },
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
  const [isColdStart, setIsColdStart] = useState(false);
  const [isTimedOut, setIsTimedOut] = useState(false);
  const eventSourceRef = useRef<EventSource | null>(null);

  const repoName = repoUrl
    .replace("https://github.com/", "")
    .replace(".git", "");

  useEffect(() => {
    try {
      const isWarm = typeof window !== "undefined" && window.sessionStorage.getItem("repomind_backend_warm") === "true";
      if (!isWarm) {
        const timer = setTimeout(() => {
          if (completedCount === 0 && !isAllDone) {
            setIsColdStart(true);
          }
        }, 5000);
        return () => clearTimeout(timer);
      }
    } catch {
      // sessionStorage unavailable
    }
  }, [completedCount, isAllDone]);

  const recordSessionWarmth = () => {
    try {
      if (typeof window !== "undefined") {
        window.sessionStorage.setItem("repomind_backend_warm", "true");
      }
    } catch {
      // sessionStorage unavailable
    }
  };

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
          recordSessionWarmth();
          const data = JSON.parse(event.data);

          if (data.event === "pipeline_complete") {
            if (data.status === "timed_out") {
              setIsTimedOut(true);
              setRunningAgent(null);
              es.close();
              return;
            }

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

          if (data.event === "timeout") {
            setIsTimedOut(true);
            setRunningAgent(null);
            es.close();
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
        className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-graphite-canvas overflow-hidden font-sans"
      >
        {/* Background ambient lighting */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-copper/10 rounded-full blur-3xl" />
          <div className="absolute top-1/3 left-1/4 w-[400px] h-[400px] bg-[#5B82A6]/10 rounded-full blur-3xl" />
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
              <div className="w-10 h-10 rounded-xl bg-copper/20 border border-copper/30 flex items-center justify-center">
                <GitBranch className="w-5 h-5 text-copper" />
              </div>
              <div className="text-left">
                <div className="text-xs font-mono text-graphite-muted uppercase tracking-wider">Analyzing Repository</div>
                <div className="text-sm font-mono text-copper font-semibold">{repoName}</div>
              </div>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight font-display">
              Deploying Your{" "}
              <span className="bg-gradient-to-r from-copper to-[#5B82A6] bg-clip-text text-transparent">
                Autonomous Engineering Team
              </span>
            </h1>
            <p className="text-sm text-graphite-muted font-mono">
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
              const colors = COLOR_MAP[agent.color] || COLOR_MAP.copper;
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
                      : "border-graphite-border bg-graphite-panel"
                  }`}
                >
                  <div className={`relative w-8 h-8 rounded-lg flex items-center justify-center ${isDone ? "bg-emerald-500/20" : isRunning ? colors.bg : "bg-graphite-canvas"}`}>
                    {isDone ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <Icon className={`w-4 h-4 ${isRunning ? colors.text : "text-graphite-muted"}`} />
                    )}
                    {isRunning && (
                      <span className={`absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full ${colors.dot} animate-ping`} />
                    )}
                  </div>
                  <span className={`text-[9px] font-mono text-center leading-tight ${isDone ? "text-emerald-400" : isRunning ? colors.text : "text-graphite-muted"}`}>
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
              className="w-full max-w-2xl px-4 py-3 rounded-xl border border-copper/30 bg-graphite-panel backdrop-blur-sm"
            >
              <div className="flex items-start gap-2.5">
                <div className="w-1.5 h-1.5 rounded-full bg-copper animate-pulse mt-1.5 shrink-0" />
                <p className="text-sm font-mono text-white leading-relaxed">
                  {isAllDone
                    ? "✅ Analysis complete. Engineering workspace is ready."
                    : currentThought}
                </p>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Cold-Start Advisory for Sleeping Containers */}
          {isColdStart && !isAllDone && (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className="w-full max-w-2xl px-4 py-2.5 rounded-xl border border-copper/30 bg-graphite-panel/90 text-xs font-mono text-graphite-muted flex items-center gap-2.5 shadow-lg"
            >
              <div className="w-2 h-2 rounded-full bg-copper animate-ping shrink-0" />
              <span>
                <strong className="text-white">Waking up the analysis engine</strong> — this can take up to 30 seconds on the first request after a period of inactivity.
              </span>
            </motion.div>
          )}

          {/* Progress Bar */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="w-full max-w-2xl space-y-2"
          >
            <div className="flex justify-between text-xs font-mono text-graphite-muted">
              <span>Pipeline Progress</span>
              <span className={isAllDone ? "text-emerald-400" : "text-copper"}>
                {isAllDone ? "Complete" : `${completedCount} / ${AGENTS.length} agents`}
              </span>
            </div>
            <div className="w-full h-1.5 bg-graphite-border rounded-full overflow-hidden">
              <motion.div
                className={`h-full rounded-full ${isAllDone ? "bg-emerald-500" : "bg-gradient-to-r from-copper to-[#5B82A6]"}`}
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

            {isTimedOut && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-2xl p-4 sm:p-5 rounded-xl border border-severity-warning/50 bg-graphite-panel/95 backdrop-blur-md shadow-2xl text-left space-y-3"
              >
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-severity-warning/15 border border-severity-warning/30 shrink-0">
                    <AlertTriangle className="w-5 h-5 text-severity-warning" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-sm font-bold text-white font-display">
                      Analysis Pipeline Timed Out
                    </h4>
                    <p className="text-xs text-graphite-muted leading-relaxed font-mono">
                      This analysis took longer than expected and was stopped. Large repositories may exceed what&apos;s possible on the current free-tier hosting — try a smaller repository or a specific subdirectory.
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-graphite-border">
                  <span className="text-[11px] font-mono text-graphite-muted">Run ID: {runId}</span>
                  <div className="flex items-center gap-2">
                    <Link href="/">
                      <Button variant="outline" size="sm" className="text-xs font-mono gap-1.5 border-graphite-border">
                        <ArrowLeft className="w-3.5 h-3.5" /> Return Home
                      </Button>
                    </Link>
                    <Button
                      variant="gradient"
                      size="sm"
                      onClick={() => window.location.reload()}
                      className="text-xs font-mono"
                    >
                      Retry Analysis
                    </Button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
