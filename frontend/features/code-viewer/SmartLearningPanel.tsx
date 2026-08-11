"use client";

import React, { useState, useEffect } from "react";
import {
  GraduationCap,
  Sparkles,
  BookOpen,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { SmartLearningExplanation } from "@/types";
import { getSmartLearningExplanation } from "@/lib/api-client";

interface SmartLearningPanelProps {
  runId: string;
  filePath: string;
}

export function SmartLearningPanel({ runId, filePath }: SmartLearningPanelProps) {
  const [depth, setDepth] = useState<"beginner" | "intermediate" | "advanced">("intermediate");
  const [explanation, setExplanation] = useState<SmartLearningExplanation["explanation"] | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    async function fetchLearnData() {
      try {
        setLoading(true);
        const res = await getSmartLearningExplanation(runId, filePath, depth);
        if (res && res.explanation) {
          setExplanation(res.explanation);
        }
      } catch (e) {
        console.error("Failed to load smart learning explanation:", e);
      } finally {
        setLoading(false);
      }
    }
    fetchLearnData();
  }, [runId, filePath, depth]);

  return (
    <div className="rounded-xl border border-graphite-border bg-graphite-canvas p-4 space-y-4 font-sans selection:bg-copper selection:text-white">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-graphite-border pb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <GraduationCap className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2 font-display">
              <span>Smart Learning Mode</span>
              <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30 text-[10px] font-mono">
                Category D: QA & Docs
              </Badge>
            </h3>
            <p className="text-[11px] text-graphite-muted font-mono">
              Educational breakdowns of architecture, design patterns, & data flow
            </p>
          </div>
        </div>

        {/* Depth Level Selector Tabs */}
        <div className="flex items-center gap-1 bg-graphite-panel p-1 rounded-lg border border-graphite-border font-mono text-xs">
          {(["beginner", "intermediate", "advanced"] as const).map((lvl) => (
            <button
              key={lvl}
              onClick={() => setDepth(lvl)}
              className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition ${
                depth === lvl
                  ? "bg-copper text-white shadow-md"
                  : "text-graphite-muted hover:text-white"
              }`}
            >
              {lvl.charAt(0).toUpperCase() + lvl.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Explanation Content */}
      {loading ? (
        <div className="py-8 text-center text-xs font-mono text-graphite-muted flex items-center justify-center gap-2">
          <Sparkles className="w-4 h-4 text-copper animate-spin" />
          <span>Generating {depth} educational breakdown...</span>
        </div>
      ) : explanation ? (
        <div className="space-y-4 font-mono">
          {/* Overview */}
          <div>
            <h4 className="text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-1 flex items-center gap-1.5 font-display">
              <BookOpen className="w-3.5 h-3.5" /> Conceptual Overview
            </h4>
            <p className="text-xs text-foreground/90 leading-relaxed font-sans bg-graphite-panel p-3 rounded-lg border border-graphite-border">
              {explanation.overview}
            </p>
          </div>

          {/* Tech Stack Badges */}
          <div>
            <h4 className="text-xs font-semibold text-[#5B82A6] uppercase tracking-wider mb-1 font-display">
              Technologies & Libraries Used
            </h4>
            <div className="flex flex-wrap gap-1.5">
              {explanation.tech_stack.map((tech, i) => (
                <Badge key={i} variant="outline" className="border-[#5B82A6]/30 text-[#5B82A6] bg-[#5B82A6]/10 text-[11px] font-mono">
                  {tech}
                </Badge>
              ))}
            </div>
          </div>

          {/* Key Concepts */}
          <div>
            <h4 className="text-xs font-semibold text-copper uppercase tracking-wider mb-1 font-display">
              Core Computer Science & Architecture Concepts
            </h4>
            <div className="space-y-1.5 text-xs">
              {explanation.key_concepts.map((kc, i) => (
                <div key={i} className="p-2.5 rounded-lg bg-graphite-panel border border-graphite-border text-foreground/90">
                  {kc}
                </div>
              ))}
            </div>
          </div>

          {/* Best Practices vs Anti-Patterns */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 font-sans">
            <div>
              <h4 className="text-xs font-semibold text-emerald-400 font-mono uppercase tracking-wider mb-1 flex items-center gap-1 font-display">
                <CheckCircle2 className="w-3.5 h-3.5" /> Best Practices Used
              </h4>
              <div className="space-y-1 text-xs">
                {explanation.best_practices.map((bp, i) => (
                  <div key={i} className="p-2 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                    {bp}
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h4 className="text-xs font-semibold text-severity-warning font-mono uppercase tracking-wider mb-1 flex items-center gap-1 font-display">
                <AlertTriangle className="w-3.5 h-3.5" /> Anti-Patterns to Avoid
              </h4>
              <div className="space-y-1 text-xs">
                {explanation.anti_patterns.map((ap, i) => (
                  <div key={i} className="p-2 rounded bg-severity-warning/10 border border-severity-warning/20 text-severity-warning">
                    {ap}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
