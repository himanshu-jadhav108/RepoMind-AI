"use client";

import React, { useState, useEffect } from "react";
import { Play, Pause, RotateCcw, FastForward } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useGraphStore, AgentName } from "../store/useGraphStore";

interface ReplayStep {
  id: string;
  agent: AgentName | null;
  title: string;
  description: string;
  activeNodeId: string;
  durationMs: number;
}

const REPLAY_STEPS: ReplayStep[] = [
  {
    id: "step-1",
    agent: null,
    title: "1. Repository Cloned",
    description: "Git repository cloned into isolated workspace container.",
    activeNodeId: "root",
    durationMs: 1500,
  },
  {
    id: "step-2",
    agent: "repository_analyzer",
    title: "2. Files Discovered & Parsed",
    description: "AST parser extracted source files, syntax trees, and symbols.",
    activeNodeId: "backend",
    durationMs: 1800,
  },
  {
    id: "step-3",
    agent: "repository_analyzer",
    title: "3. Dependency Graph Built",
    description: "Resolved import relations and constructed interactive dependency network.",
    activeNodeId: "services",
    durationMs: 1800,
  },
  {
    id: "step-4",
    agent: "planner_agent",
    title: "4. Planner Strategy Formulated",
    description: "Planner Agent mapped 10 execution stages for parallel agent pass.",
    activeNodeId: "root",
    durationMs: 2000,
  },
  {
    id: "step-5",
    agent: "architect_agent",
    title: "5. Architectural Evaluation",
    description: "Architect Agent validated Clean Architecture service boundaries.",
    activeNodeId: "architect_agent",
    durationMs: 2200,
  },
  {
    id: "step-6",
    agent: "security_agent",
    title: "6. Security Audit Pass",
    description: "Security Agent audited CORS settings, env vars, and credentials.",
    activeNodeId: "analysis_service",
    durationMs: 2200,
  },
  {
    id: "step-7",
    agent: "performance_agent",
    title: "7. Performance Pass",
    description: "Performance Agent verified non-blocking thread-pool executors.",
    activeNodeId: "repo_service",
    durationMs: 2000,
  },
  {
    id: "step-8",
    agent: "reviewer_agent",
    title: "8. Reviewer Verification Loop",
    description: "Reviewer Agent checked claims & evidence, clearing findings.",
    activeNodeId: "reviewer_agent",
    durationMs: 2200,
  },
  {
    id: "step-9",
    agent: null,
    title: "9. Final Report & Health Score",
    description: "Synthesized audit report and 7-dimension repository health metrics.",
    activeNodeId: "root",
    durationMs: 1500,
  },
];

export function AgentReplayController() {
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);

  const setSelectedAgent = useGraphStore((s) => s.setSelectedAgent);
  const setSelectedNodeId = useGraphStore((s) => s.setSelectedNodeId);

  const activeStep = REPLAY_STEPS[currentStepIndex];

  useEffect(() => {
    if (!isPlaying) return;

    const timer = setTimeout(() => {
      if (currentStepIndex < REPLAY_STEPS.length - 1) {
        const nextIndex = currentStepIndex + 1;
        setCurrentStepIndex(nextIndex);
        const nextStep = REPLAY_STEPS[nextIndex];
        setSelectedAgent(nextStep.agent);
        setSelectedNodeId(nextStep.activeNodeId);
      } else {
        setIsPlaying(false);
      }
    }, activeStep.durationMs / playbackSpeed);

    return () => clearTimeout(timer);
  }, [isPlaying, currentStepIndex, playbackSpeed, activeStep, setSelectedAgent, setSelectedNodeId]);

  const handleStartReplay = () => {
    setCurrentStepIndex(0);
    const firstStep = REPLAY_STEPS[0];
    setSelectedAgent(firstStep.agent);
    setSelectedNodeId(firstStep.activeNodeId);
    setIsPlaying(true);
  };

  const handleTogglePause = () => {
    setIsPlaying(!isPlaying);
  };

  const handleReset = () => {
    setIsPlaying(false);
    setCurrentStepIndex(0);
    setSelectedAgent(null);
    setSelectedNodeId(null);
  };

  const progressPct = Math.round(((currentStepIndex + 1) / REPLAY_STEPS.length) * 100);

  return (
    <div className="w-full bg-graphite-panel border-b border-graphite-border p-3 font-mono text-xs text-white flex flex-wrap items-center justify-between gap-3 shadow-lg">
      <div className="flex items-center gap-2">
        <Button
          variant="gradient"
          size="sm"
          onClick={handleStartReplay}
          className="gap-1.5 text-xs font-bold"
        >
          <Play className="w-3.5 h-3.5 fill-current" />
          <span>▶ Replay Analysis</span>
        </Button>

        {isPlaying ? (
          <Button variant="outline" size="sm" onClick={handleTogglePause} className="gap-1 text-xs border-graphite-border">
            <Pause className="w-3.5 h-3.5 text-severity-warning" /> Pause
          </Button>
        ) : currentStepIndex > 0 ? (
          <Button variant="outline" size="sm" onClick={() => setIsPlaying(true)} className="gap-1 text-xs border-graphite-border">
            <Play className="w-3.5 h-3.5 text-emerald-400" /> Resume
          </Button>
        ) : null}

        <Button variant="ghost" size="sm" onClick={handleReset} className="gap-1 text-xs text-graphite-muted">
          <RotateCcw className="w-3.5 h-3.5" /> Reset
        </Button>
      </div>

      <div className="flex-1 min-w-[260px] bg-graphite-canvas px-3 py-1.5 rounded-lg border border-graphite-border flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 truncate">
          <span className="relative flex h-2 w-2">
            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${isPlaying ? "bg-copper" : "bg-graphite-muted"} opacity-75`}></span>
            <span className={`relative inline-flex rounded-full h-2 w-2 ${isPlaying ? "bg-copper" : "bg-graphite-muted"}`}></span>
          </span>
          <span className="font-bold text-copper truncate">{activeStep.title}:</span>
          <span className="text-graphite-muted text-[11px] truncate">{activeStep.description}</span>
        </div>
        <Badge variant="outline" className="text-[10px] shrink-0 border-copper/30 text-copper bg-copper/10">
          {progressPct}%
        </Badge>
      </div>

      <div className="flex items-center gap-1.5">
        <FastForward className="w-3.5 h-3.5 text-[#5B82A6]" />
        <span className="text-graphite-muted text-[11px]">Speed:</span>
        {[1, 1.5, 2].map((spd) => (
          <button
            key={spd}
            onClick={() => setPlaybackSpeed(spd)}
            className={`px-2 py-0.5 rounded text-[10px] font-bold border transition ${
              playbackSpeed === spd
                ? "bg-[#5B82A6]/20 text-[#5B82A6] border-[#5B82A6]/40"
                : "bg-graphite-canvas text-graphite-muted border-graphite-border hover:text-white"
            }`}
          >
            {spd}x
          </button>
        ))}
      </div>
    </div>
  );
}
