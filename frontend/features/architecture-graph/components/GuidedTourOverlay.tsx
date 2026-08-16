"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Compass,
  ChevronRight,
  ChevronLeft,
  X,
  Sparkles,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface GuidedTourOverlayProps {
  onHighlightNode?: (nodeId: string) => void;
  onClose?: () => void;
}

const TOUR_STEPS = [
  {
    step: 1,
    title: "Step 1: Repository Overview",
    targetNode: "root",
    description: "Welcome to RepoMind AI Guided Tour! This repository is organized as a full-stack multi-agent AI system with FastAPI backend and Next.js 14 frontend.",
    tip: "Use the zoom controls or scroll wheel to navigate the 2D/3D knowledge graph canvas.",
  },
  {
    step: 2,
    title: "Step 2: Folder Structure",
    targetNode: "backend",
    description: "The core backend is structured around Clean Architecture under `backend/app/`, cleanly separating API routing, domain services, agents, and storage abstractions.",
    tip: "Click on any folder node to expand or collapse its sub-modules dynamically.",
  },
  {
    step: 3,
    title: "Step 3: Core Modules",
    targetNode: "services",
    description: "The domain logic resides in `backend/app/services/`. `analysis_service.py` coordinates LangGraph pipeline runs and persistent state stores.",
    tip: "Services inherit from abstract interfaces for easy mock testing and modular expansion.",
  },
  {
    step: 4,
    title: "Step 4: System Architecture",
    targetNode: "architect_agent",
    description: "Architect Agent inspects component coupling and layer independence. All database access flows through Supabase repositories.",
    tip: "Switch to 'Architecture Pipeline' layout in the toolbar to view layered horizontal flow.",
  },
  {
    step: 5,
    title: "Step 5: Important Files",
    targetNode: "backend/app/main.py",
    description: "Key entry points: `backend/app/main.py` bootstraps FastAPI middleware, CORS policies, and mounts v1 API routers.",
    tip: "Click any file pill to inspect its real source code live in the Code Viewer.",
  },
  {
    step: 6,
    title: "Step 6: Critical Dependencies",
    targetNode: "analysis_service",
    description: "Critical coupling path: API Routes → AnalysisService → LangGraph StateGraph → Reviewer Quality Gate.",
    tip: "Use the Dependency Path Finder tool to trace exact hops between any two files.",
  },
  {
    step: 7,
    title: "Step 7: Potential Issues",
    targetNode: "repo_service",
    description: "Security and Performance Agents flagged background git cloning and rate limiting as priority audit items.",
    tip: "Check the Findings workspace for line-by-line fix suggestions and code snippets.",
  },
  {
    step: 8,
    title: "Step 8: Learning & Next Steps",
    targetNode: "reviewer_agent",
    description: "You've completed the guided tour! Use Repo Copilot Chat or Smart Learning Mode to dive deeper into any file.",
    tip: "Click 'Engineering Review Meeting' to watch agents present their final findings live.",
  },
];

export function GuidedTourOverlay({ onHighlightNode, onClose }: GuidedTourOverlayProps) {
  const [currentStepIdx, setCurrentStepIdx] = useState<number>(0);

  const activeStep = TOUR_STEPS[currentStepIdx];

  const handleNext = () => {
    if (currentStepIdx < TOUR_STEPS.length - 1) {
      const nextIdx = currentStepIdx + 1;
      setCurrentStepIdx(nextIdx);
      if (onHighlightNode && TOUR_STEPS[nextIdx].targetNode) {
        onHighlightNode(TOUR_STEPS[nextIdx].targetNode);
      }
    }
  };

  const handlePrev = () => {
    if (currentStepIdx > 0) {
      const prevIdx = currentStepIdx - 1;
      setCurrentStepIdx(prevIdx);
      if (onHighlightNode && TOUR_STEPS[prevIdx].targetNode) {
        onHighlightNode(TOUR_STEPS[prevIdx].targetNode);
      }
    }
  };

  return (
    <div className="absolute top-4 left-4 z-40 max-w-md w-full font-sans">
      <motion.div
        initial={{ opacity: 0, y: -20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        className="rounded-xl border border-copper/40 bg-card shadow-2xl p-4 backdrop-blur-2xl space-y-3 selection:bg-copper selection:text-white text-foreground"
      >
        {/* Top Header Bar */}
        <div className="flex items-center justify-between border-b border-border pb-2.5">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-copper text-white shadow-md">
              <Compass className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-foreground font-display flex items-center gap-1.5">
                <span>Guided Repository Tour</span>
                <Badge className="bg-copper/10 text-copper border-copper/30 text-[10px] font-mono">
                  Step {activeStep.step} of 8
                </Badge>
              </h4>
            </div>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Step Progress Bar */}
        <div className="w-full bg-border rounded-full h-1.5 overflow-hidden">
          <div
            className="bg-gradient-to-r from-copper to-category-arch h-full transition-all duration-300"
            style={{ width: `${((currentStepIdx + 1) / TOUR_STEPS.length) * 100}%` }}
          />
        </div>

        {/* Content Body */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeStep.step}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.2 }}
            className="space-y-2.5"
          >
            <h5 className="text-sm font-bold text-copper font-display">{activeStep.title}</h5>
            <p className="text-xs text-foreground/90 leading-relaxed font-sans bg-background p-2.5 rounded-lg border border-border">
              {activeStep.description}
            </p>
            <div className="text-[11px] text-sky-600 dark:text-sky-400 font-mono bg-background p-2 rounded-lg border border-border flex items-start gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400 shrink-0 mt-0.5" />
              <span>Pro Tip: {activeStep.tip}</span>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Footer Stepper Controls */}
        <div className="flex items-center justify-between pt-2 border-t border-border">
          <Button
            variant="outline"
            size="sm"
            onClick={handlePrev}
            disabled={currentStepIdx === 0}
            className="h-7 text-xs font-mono gap-1 border-border text-muted-foreground hover:text-foreground"
          >
            <ChevronLeft className="w-3.5 h-3.5" /> Previous
          </Button>

          {currentStepIdx < TOUR_STEPS.length - 1 ? (
            <Button
              size="sm"
              onClick={handleNext}
              className="h-7 text-xs font-mono gap-1 bg-copper hover:bg-copper-hover text-white shadow-lg shadow-copper/20"
            >
              Next Step <ChevronRight className="w-3.5 h-3.5" />
            </Button>
          ) : (
            <Button
              size="sm"
              onClick={onClose}
              className="h-7 text-xs font-mono gap-1 bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/30"
            >
              Finish Tour <CheckCircle2 className="w-3.5 h-3.5" />
            </Button>
          )}
        </div>
      </motion.div>
    </div>
  );
}
