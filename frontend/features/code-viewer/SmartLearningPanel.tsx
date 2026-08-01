"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  GraduationCap,
  Sparkles,
  BookOpen,
  CheckCircle2,
  AlertTriangle,
  Layers,
  Code2,
  Cpu,
} from "lucide-react";
import { Button } from "@/components/ui/button";
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
    <div className="rounded-xl border border-slate-800 bg-slate-950/90 p-4 space-y-4 font-sans selection:bg-purple-500 selection:text-white">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-purple-600/20 text-purple-400 border border-purple-500/30">
            <GraduationCap className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2 font-mono">
              <span>Smart Learning Mode</span>
              <Badge className="bg-purple-950/80 text-purple-300 border-purple-500/40 text-[10px] font-mono">
                Student & Developer Guide
              </Badge>
            </h3>
            <p className="text-[11px] text-slate-400 font-mono">
              Educational breakdowns of architecture, design patterns, & data flow
            </p>
          </div>
        </div>

        {/* Depth Level Selector Tabs */}
        <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-lg border border-slate-800 font-mono text-xs">
          {(["beginner", "intermediate", "advanced"] as const).map((lvl) => (
            <button
              key={lvl}
              onClick={() => setDepth(lvl)}
              className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition ${
                depth === lvl
                  ? "bg-purple-600 text-white shadow-md"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              {lvl.charAt(0).toUpperCase() + lvl.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Explanation Content */}
      {loading ? (
        <div className="py-8 text-center text-xs font-mono text-slate-400 flex items-center justify-center gap-2">
          <Sparkles className="w-4 h-4 text-purple-400 animate-spin" />
          <span>Generating {depth} educational breakdown...</span>
        </div>
      ) : explanation ? (
        <div className="space-y-4">
          {/* Overview */}
          <div>
            <h4 className="text-xs font-semibold text-purple-400 font-mono uppercase tracking-wider mb-1 flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5" /> Conceptual Overview
            </h4>
            <p className="text-xs text-slate-200 leading-relaxed font-sans bg-slate-900/60 p-3 rounded-lg border border-slate-800">
              {explanation.overview}
            </p>
          </div>

          {/* Tech Stack Badges */}
          <div>
            <h4 className="text-xs font-semibold text-indigo-400 font-mono uppercase tracking-wider mb-1">
              Technologies & Libraries Used
            </h4>
            <div className="flex flex-wrap gap-1.5">
              {explanation.tech_stack.map((tech, i) => (
                <Badge key={i} variant="outline" className="border-indigo-500/30 text-indigo-300 bg-indigo-950/40 text-[11px] font-mono">
                  {tech}
                </Badge>
              ))}
            </div>
          </div>

          {/* Key Concepts */}
          <div>
            <h4 className="text-xs font-semibold text-cyan-400 font-mono uppercase tracking-wider mb-1">
              Core Computer Science & Architecture Concepts
            </h4>
            <div className="space-y-1.5 font-mono text-xs">
              {explanation.key_concepts.map((kc, i) => (
                <div key={i} className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800 text-slate-300">
                  {kc}
                </div>
              ))}
            </div>
          </div>

          {/* Best Practices vs Anti-Patterns */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <h4 className="text-xs font-semibold text-emerald-400 font-mono uppercase tracking-wider mb-1 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Best Practices Used
              </h4>
              <div className="space-y-1 font-sans text-xs">
                {explanation.best_practices.map((bp, i) => (
                  <div key={i} className="p-2 rounded bg-emerald-950/30 border border-emerald-500/20 text-emerald-200">
                    {bp}
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h4 className="text-xs font-semibold text-amber-400 font-mono uppercase tracking-wider mb-1 flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5" /> Anti-Patterns to Avoid
              </h4>
              <div className="space-y-1 font-sans text-xs">
                {explanation.anti_patterns.map((ap, i) => (
                  <div key={i} className="p-2 rounded bg-amber-950/30 border border-amber-500/20 text-amber-200">
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
