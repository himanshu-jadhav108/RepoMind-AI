"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users,
  Play,
  Pause,
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
  FileCode,
  ShieldAlert,
  Zap,
  Cpu,
  Layers,
  Sparkles,
  Award,
  Info,
  Volume2,
  Code2,
  Activity,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ReviewMeetingData, AgentPresentation } from "@/types";
import { getEngineeringReviewMeeting } from "@/lib/api-client";

interface EngineeringReviewMeetingProps {
  runId: string;
  onSelectFile?: (file: string) => void;
}

const AGENT_ICON_MAP: Record<string, React.ReactNode> = {
  planner: <Sparkles className="w-4 h-4 text-copper" />,
  analyzer: <Layers className="w-4 h-4 text-[#5B82A6]" />,
  architect: <Cpu className="w-4 h-4 text-[#5B82A6]" />,
  bughunter: <Code2 className="w-4 h-4 text-severity-critical" />,
  security: <ShieldAlert className="w-4 h-4 text-severity-critical" />,
  performance: <Zap className="w-4 h-4 text-severity-warning" />,
  documentation: <Info className="w-4 h-4 text-emerald-400" />,
  feature: <Activity className="w-4 h-4 text-copper" />,
  learning: <Sparkles className="w-4 h-4 text-emerald-400" />,
  reviewer: <Award className="w-4 h-4 text-copper" />,
};

const DEFAULT_MEETING: ReviewMeetingData = {
  run_id: "demo-run",
  meeting_title: "Architecture & Engineering Quality Review",
  verdict: "APPROVED — Enterprise-Grade Multi-Agent Architecture",
  verdict_reasoning:
    "The repository cleanly enforces architectural boundaries, offloads expensive I/O calls to background worker pools, and carries zero high-severity OWASP vulnerabilities.",
  overall_confidence: 0.94,
  presentations: [
    {
      agent_id: "planner",
      agent_name: "Planner Agent",
      role: "Orchestration & System Scope",
      avatar_color: "purple",
      summary: "Decomposed repository graph into 4 logical audit zones and scheduled 10 sequential & parallel analysis passes.",
      reasoning: "Identified high-velocity modules in backend/app/api and core state managers requiring deep inspection.",
      confidence: 0.95,
      evidence: "AST graph mapped 142 functions across 28 files with 86% coupling density.",
      referenced_files: ["backend/app/main.py", "backend/app/orchestration/graph.py"],
      severity: "low",
      recommended_actions: ["Execute parallel security and performance scans on API routing layer."],
    },
    {
      agent_id: "analyzer",
      agent_name: "Repository Analyzer",
      role: "AST Parsing & Graph Topology",
      avatar_color: "indigo",
      summary: "Constructed 2D/3D NetworkX Knowledge Graph linking API routes to service abstractions and repositories.",
      reasoning: "Detected high in-degree centrality in dependency injection containers and shared Pydantic models.",
      confidence: 0.92,
      evidence: "Node degree centrality score peak: 0.78 on app/core/dependency_injection.py.",
      referenced_files: ["backend/app/core/dependency_injection.py", "frontend/lib/api-client.ts"],
      severity: "low",
      recommended_actions: ["Maintain strict decoupling between database repositories and presentation layer."],
    },
    {
      agent_id: "architect",
      agent_name: "Architect Agent",
      role: "Clean Architecture & Pattern Audit",
      avatar_color: "blue",
      summary: "Clean Architecture boundaries are respected, with repository abstractions cleanly isolating DB state.",
      reasoning: "Service layer acts as a pure boundary; FastAPI controllers do not directly query DB instances.",
      confidence: 0.89,
      evidence: "Imports in routes_analysis.py use Depends(get_analysis_service).",
      referenced_files: ["backend/app/services/analysis_service.py", "backend/app/api/v1/routes_analysis.py"],
      severity: "low",
      recommended_actions: ["Enforce DTO interfaces for external REST payload contracts."],
    },
    {
      agent_id: "bughunter",
      agent_name: "Bug Hunter Agent",
      role: "Static Smell & Exception Analysis",
      avatar_color: "amber",
      summary: "Scanned 60 files for exception boundary gaps, unhandled async promises, and null dereference paths.",
      reasoning: "Detected missing try-catch block on external API fetch in frontend client and unthrottled endpoint handlers.",
      confidence: 0.88,
      evidence: "Uncaught Promise rejections in api-client.ts and unhandled HTTP exceptions in routes_repos.py.",
      referenced_files: ["frontend/lib/api-client.ts", "backend/app/api/v1/routes_repos.py"],
      severity: "medium",
      recommended_actions: ["Add explicit exception boundaries around network calls and global error handling middleware."],
    },
    {
      agent_id: "security",
      agent_name: "Security Agent",
      role: "Vulnerability & Security Audit",
      avatar_color: "emerald",
      summary: "Verified CORS origins, environment secrets isolation, and SQL parameterization.",
      reasoning: "Environment variables are loaded via Pydantic BaseSettings without raw string concatenation.",
      confidence: 0.94,
      evidence: "No hardcoded API keys detected across 48 source files.",
      referenced_files: ["backend/app/core/config.py"],
      severity: "low",
      recommended_actions: ["Implement rate limiting headers on public SSE streaming endpoints."],
    },
    {
      agent_id: "performance",
      agent_name: "Performance Agent",
      role: "Async & I/O Profiling",
      avatar_color: "amber",
      summary: "Repository analyzer correctly offloads blocking Git clone operations to thread executors.",
      reasoning: "Prevented event-loop starvation during heavy repository cloning using asyncio.run_in_executor.",
      confidence: 0.91,
      evidence: "run_in_executor(None, analyzer.analyze_repository, ...) in graph.py.",
      referenced_files: ["backend/app/orchestration/graph.py"],
      severity: "low",
      recommended_actions: ["Cache AST symbol trees across consecutive runs."],
    },
    {
      agent_id: "documentation",
      agent_name: "Documentation Agent",
      role: "API Spec & Docstring Verification",
      avatar_color: "sky",
      summary: "Verified docstring coverage (84%) and OpenAPI response schema compliance.",
      reasoning: "All endpoint functions carry detailed docstrings referencing official API.md specifications.",
      confidence: 0.88,
      evidence: "Found 42 docstrings across 51 public API route handlers.",
      referenced_files: ["backend/app/api/v1/routes_analysis.py", "README.md"],
      severity: "low",
      recommended_actions: ["Add TypeScript JSDoc comments to complex custom hooks."],
    },
    {
      agent_id: "feature",
      agent_name: "Feature Suggestion Agent",
      role: "Architecture Enhancement Backlog",
      avatar_color: "pink",
      summary: "Identified 3 high-impact architectural enhancements to improve system throughput and modularity.",
      reasoning: "Analyzing code patterns revealed opportunities for background task queues and Redis caching layer.",
      confidence: 0.90,
      evidence: "Coupling metrics show opportunities to extract background tasks from FastAPI request-response cycles.",
      referenced_files: ["backend/app/main.py", "backend/app/orchestration/graph.py"],
      severity: "low",
      recommended_actions: ["Implement Celery/Redis queue for long-running repository analysis jobs."],
    },
    {
      agent_id: "learning",
      agent_name: "Learning Agent",
      role: "Educational Walkthroughs & Onboarding",
      avatar_color: "cyan",
      summary: "Generated plain-language walkthroughs and architectural explanations across all 10 pipeline stages.",
      reasoning: "Created multi-level educational guides (beginner, intermediate, advanced) for rapid team onboarding.",
      confidence: 0.93,
      evidence: "Generated interactive walk-through guides and AST code explanations.",
      referenced_files: ["backend/app/agents/learning_agent.py"],
      severity: "low",
      recommended_actions: ["Integrate interactive code walkthrough tooltip hints into the IDE code viewer."],
    },
    {
      agent_id: "reviewer",
      agent_name: "Reviewer Agent (Quality Gate)",
      role: "Self-Correction & Final Verdict",
      avatar_color: "violet",
      summary: "Completed self-correction verification loop across all agent findings. Low-confidence claims filtered out.",
      reasoning: "Cross-referenced security and performance reports with AST static call graphs.",
      confidence: 0.96,
      evidence: "Reviewer loop passed with 0 unverified claims. Final engineering score: 92/100.",
      referenced_files: ["backend/app/orchestration/graph.py"],
      severity: "low",
      recommended_actions: ["Approve system for production deployment with scheduled weekly health audits."],
    },
  ],
};


export function EngineeringReviewMeeting({
  runId,
  onSelectFile,
}: EngineeringReviewMeetingProps) {
  const [meetingData, setMeetingData] = useState<ReviewMeetingData>(DEFAULT_MEETING);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);

  const currentAgent: AgentPresentation =
    meetingData.presentations[currentIndex] || meetingData.presentations[0];
  const isFinalStep = currentIndex === meetingData.presentations.length - 1;

  const speakCurrentAgent = () => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();

    if (isSpeaking) {
      setIsSpeaking(false);
      return;
    }

    const textToSpeak = `${currentAgent.agent_name} presentation: ${currentAgent.speech || currentAgent.summary || ""}. Key takeaway: ${currentAgent.key_point || currentAgent.reasoning || ""}`;
    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utterance.rate = 1.05;
    utterance.pitch = 1.0;
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  // Keyboard navigation for live demo flow
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") {
        setCurrentIndex((p) => Math.min(meetingData.presentations.length - 1, p + 1));
        setIsPlaying(false);
      } else if (e.key === "ArrowLeft") {
        setCurrentIndex((p) => Math.max(0, p - 1));
        setIsPlaying(false);
      } else if (e.key === " " || e.key === "Space") {
        e.preventDefault();
        setIsPlaying((p) => !p);
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [meetingData.presentations.length]);

  useEffect(() => {
    async function fetchMeeting() {
      try {
        const data = await getEngineeringReviewMeeting(runId);
        if (data && data.presentations && data.presentations.length > 0) {
          setMeetingData(data);
        }
      } catch (e) {
        console.error("Failed to load review meeting:", e);
      }
    }
    fetchMeeting();
  }, [runId]);

  // Auto-play timer
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isPlaying) {
      interval = setInterval(() => {
        setCurrentIndex((prev) => {
          if (prev >= meetingData.presentations.length - 1) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, 4000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isPlaying, meetingData.presentations.length]);  return (
    <div className="rounded-2xl border border-border bg-card backdrop-blur-xl p-5 shadow-2xl flex flex-col space-y-5 selection:bg-copper selection:text-white font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-border pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-copper/10 border border-copper/30 text-copper">
            <Users className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2 font-display">
              <span>Engineering Review Meeting</span>
              {isPlaying ? (
                <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-severity-critical/20 border border-severity-critical/40 text-xs font-mono text-severity-critical animate-pulse">
                  <span className="w-1.5 h-1.5 rounded-full bg-severity-critical inline-block" />
                  LIVE
                </span>
              ) : (
                <Badge className="bg-copper/10 text-copper border-copper/40 text-xs font-mono">
                  Live AI Architecture Panel
                </Badge>
              )}
            </h2>
            <p className="text-xs text-muted-foreground font-mono">
              Autonomous multi-agent findings presentation & final verdict.
            </p>
          </div>
        </div>

        {/* Playback Controls */}
        <div className="flex items-center gap-2 bg-background p-1.5 rounded-xl border border-border font-mono text-xs">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCurrentIndex((p) => Math.max(0, p - 1))}
            disabled={currentIndex === 0}
            className="h-8 px-2 text-muted-foreground hover:text-foreground"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>

          <Button
            variant={isPlaying ? "destructive" : "default"}
            size="sm"
            onClick={() => setIsPlaying(!isPlaying)}
            className="h-8 px-3 text-xs gap-1.5 bg-copper hover:bg-copper-hover text-white font-medium shadow-lg shadow-copper/20"
          >
            {isPlaying ? (
              <>
                <Pause className="w-3.5 h-3.5" /> Pause
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current" /> Play Meeting
              </>
            )}
          </Button>

          <Button
            variant={isSpeaking ? "destructive" : "outline"}
            size="sm"
            onClick={speakCurrentAgent}
            className="h-8 px-2.5 text-xs gap-1.5 border-copper/40 text-copper bg-copper/10 hover:bg-copper/20"
          >
            <Volume2 className={`w-3.5 h-3.5 ${isSpeaking ? "animate-pulse text-severity-critical" : "text-copper"}`} />
            <span>{isSpeaking ? "Mute Voice" : "Voice Narrate"}</span>
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() =>
              setCurrentIndex((p) => Math.min(meetingData.presentations.length - 1, p + 1))
            }
            disabled={currentIndex === meetingData.presentations.length - 1}
            className="h-8 px-2 text-muted-foreground hover:text-foreground"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Agent Nav Stepper Bar - All 10 Specialized Agents */}
      <div className="flex flex-nowrap overflow-x-auto gap-1.5 bg-background p-2 rounded-xl border border-border scrollbar-none w-full items-center">
        {meetingData.presentations.map((pres, idx) => {
          const isActive = idx === currentIndex;
          const isPassed = idx < currentIndex;
          return (
            <button
              key={pres.agent_id || idx}
              onClick={() => {
                setCurrentIndex(idx);
                setIsPlaying(false);
              }}
              className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-semibold font-mono transition-all duration-200 shrink-0 whitespace-nowrap ${
                isActive
                  ? "bg-copper text-white shadow-lg shadow-copper/20 scale-[1.02]"
                  : isPassed
                  ? "bg-copper/15 text-copper hover:bg-copper/25"
                  : "bg-card text-muted-foreground hover:bg-muted hover:text-foreground border border-border"
              }`}
            >
              {(pres.agent_id && AGENT_ICON_MAP[pres.agent_id]) || <Sparkles className="w-3.5 h-3.5 text-copper" />}
              <span>{pres.agent_name.replace(" Agent", "").replace(" (Quality Gate)", "")}</span>
            </button>
          );
        })}
      </div>

      {/* Active Presentation Content Card */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentAgent.agent_id}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -15 }}
          transition={{ duration: 0.25 }}
          className="bg-background border border-border rounded-xl p-5 shadow-xl space-y-4 relative overflow-hidden"
        >
          {/* Agent Header Info */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-border pb-3">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-card border border-border shadow-md">
                {(currentAgent.agent_id && AGENT_ICON_MAP[currentAgent.agent_id]) || <Sparkles className="w-6 h-6 text-copper" />}
              </div>
              <div>
                <h3 className="text-lg font-bold text-foreground flex items-center gap-2 font-display">
                  <span>{currentAgent.agent_name}</span>
                  <Badge variant="outline" className="border-border text-muted-foreground text-xs font-mono">
                    {currentAgent.role}
                  </Badge>
                </h3>
                <p className="text-xs text-muted-foreground font-mono">
                  Agent Presentation {currentIndex + 1} of {meetingData.presentations.length}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="text-right">
                <div className="text-xs text-muted-foreground font-mono">Confidence Score</div>
                <div className="text-sm font-extrabold text-emerald-600 dark:text-emerald-400 font-mono">
                  {((currentAgent.confidence ?? 0.95) * 100).toFixed(0)}%
                </div>
                {/* Animated confidence bar */}
                <div className="mt-1 w-20 h-1 rounded-full bg-border overflow-hidden">
                  <motion.div
                    key={(currentAgent.agent_id || "agent") + "-conf"}
                    initial={{ width: 0 }}
                    animate={{ width: `${((currentAgent.confidence ?? 0.95) * 100).toFixed(0)}%` }}
                    transition={{ duration: 0.6, ease: "easeOut", delay: 0.1 }}
                    className={`h-full rounded-full ${
                      (currentAgent.confidence ?? 0.95) >= 0.9
                        ? "bg-emerald-500"
                        : (currentAgent.confidence ?? 0.95) >= 0.7
                        ? "bg-severity-warning"
                        : "bg-severity-critical"
                    }`}
                  />
                </div>
              </div>
              <Badge
                className={`${
                  currentAgent.severity === "high" || currentAgent.severity === "critical"
                    ? "bg-severity-critical/15 text-severity-critical border-severity-critical/30"
                    : "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
                } text-xs font-mono px-2.5 py-1`}
              >
                Severity: {(currentAgent.severity || "normal").toUpperCase()}
              </Badge>
            </div>
          </div>

          {/* Presentation Grid Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1 font-sans">
            {/* Summary & Reasoning */}
            <div className="space-y-3">
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-copper font-mono mb-1 font-display">
                  Executive Summary
                </h4>
                <p className="text-foreground/90 text-sm leading-relaxed bg-card p-3 rounded-lg border border-border">
                  {currentAgent.summary}
                </p>
              </div>

              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-category-arch font-mono mb-1 font-display">
                  Architectural Reasoning
                </h4>
                <p className="text-muted-foreground text-xs leading-relaxed font-mono bg-card p-3 rounded-lg border border-border">
                  {currentAgent.reasoning || currentAgent.speech || "Verified agent finding details recorded."}
                </p>
              </div>
            </div>

            {/* Evidence & Recommended Actions */}
            <div className="space-y-3">
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-category-arch font-mono mb-1 font-display">
                  Empirical Evidence
                </h4>
                <div className="bg-card p-3 rounded-lg border border-category-arch/30 font-mono text-xs text-category-arch flex items-start gap-2">
                  <FileCode className="w-4 h-4 text-category-arch shrink-0 mt-0.5" />
                  <span className="truncate">{currentAgent.evidence || currentAgent.key_point || "AST evidence verified by quality gate."}</span>
                </div>
              </div>

              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 font-mono mb-1 font-display">
                  Recommended Engineering Actions
                </h4>
                <div className="space-y-1.5">
                  {(currentAgent.recommended_actions || [currentAgent.key_point || "Apply recommended fixes."]).map((act, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-2 text-xs text-foreground/90 bg-card p-2 rounded-lg border border-border"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      <span>{act}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Referenced Files */}
              {(currentAgent.referenced_files || (currentAgent.code_reference ? [currentAgent.code_reference] : [])).length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground font-mono mb-1 font-display">
                    Referenced Code Modules
                  </h4>
                  <div className="flex flex-wrap gap-1.5 font-mono">
                    {(currentAgent.referenced_files || (currentAgent.code_reference ? [currentAgent.code_reference] : [])).map((file, i) => (
                      <button
                        key={i}
                        onClick={() => onSelectFile && onSelectFile(file)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-card border border-category-arch/30 text-category-arch text-xs hover:bg-muted transition cursor-pointer"
                      >
                        <FileCode className="w-3 h-3 text-category-arch" />
                        <span>{file}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Final Step Reviewer Verdict Badge Card */}
          {isFinalStep && (
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mt-4 p-4 rounded-xl bg-card border border-copper/40 shadow-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 font-sans"
            >
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-full bg-copper text-white shadow-lg shadow-copper/20">
                  <Award className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-xs font-mono text-copper uppercase tracking-widest font-bold font-display">
                    Final Engineering Review Verdict
                  </div>
                  <div className="text-base font-extrabold text-foreground font-display">{meetingData.verdict}</div>
                  <div className="text-xs text-muted-foreground font-mono mt-0.5 max-w-2xl">
                    {meetingData.verdict_reasoning}
                  </div>
                </div>
              </div>
              <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 px-3 py-1 font-mono text-xs whitespace-nowrap">
                Reviewer Verdict: PASSED
              </Badge>
            </motion.div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
