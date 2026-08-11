"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Sparkles,
  ShieldCheck,
  AlertTriangle,
  FileCode,
  CheckCircle2,
  BookOpen,
  HelpCircle,
  Code2,
  ChevronDown,
  ChevronUp,
  Lightbulb,
} from "lucide-react";
import { useGraphStore } from "../store/useGraphStore";
import { explainCodeSnippet, filterFindingsByFile } from "@/lib/api-client";
import { CodeExplanation, Finding } from "@/types";

interface NodeInspectorSidebarProps {
  graphData?: any;
  runId?: string;
  findings?: Finding[];
  inline?: boolean;
}

export function NodeInspectorSidebar({ graphData, runId, findings = [], inline = false }: NodeInspectorSidebarProps) {
  const selectedNodeId = useGraphStore((s) => s.selectedNodeId);
  const setSelectedNodeId = useGraphStore((s) => s.setSelectedNodeId);

  const [explanation, setExplanation] = useState<CodeExplanation | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedLines, setExpandedLines] = useState<boolean>(true);

  const nodeData = graphData?.nodes?.find((n: any) => n.id === selectedNodeId) || {
    id: selectedNodeId,
    data: { label: selectedNodeId, language: "Python" },
  };

  const label = nodeData.data?.label || selectedNodeId;
  const language = nodeData.data?.language || "Python";
  const filePath = nodeData.data?.file_path || label;

  useEffect(() => {
    if (!selectedNodeId) {
      setExplanation(null);
      return;
    }

    let isMounted = true;
    setLoading(true);
    setError(null);

    explainCodeSnippet(runId || "local_run", filePath, 1, 60)
      .then((data) => {
        if (isMounted) {
          setExplanation(data);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(err.message || "Could not load AI code explanation.");
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [selectedNodeId, runId, filePath]);

  if (!selectedNodeId && !inline) return null;

  if (!selectedNodeId && inline) {
    return (
      <div className="w-full h-full min-h-[420px] rounded-xl bg-slate-900/80 border border-slate-800 p-6 flex flex-col items-center justify-center text-center font-mono text-xs text-slate-400 gap-3">
        <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
          <BookOpen className="w-5 h-5" />
        </div>
        <div className="space-y-1 max-w-xs">
          <span className="font-bold text-slate-200 block text-sm">Learning Agent Analysis</span>
          <p className="text-slate-400 text-[11px] leading-relaxed">
            Click any node in the Architecture Graph or select a file to view instant AI code explanations & line-by-line breakdowns.
          </p>
        </div>
      </div>
    );
  }

  // Filter findings matching selectedNodeId
  const nodeFindings = findings.filter(
    (f: any) =>
      f.file === selectedNodeId ||
      (Array.isArray(f.referenced_files) && f.referenced_files.includes(selectedNodeId))
  );

  const containerClasses = inline
    ? "w-full rounded-xl bg-slate-900/90 border border-slate-800 p-5 font-mono text-slate-100 shadow-xl overflow-y-auto max-h-[520px] flex flex-col space-y-4"
    : "fixed top-0 right-0 h-full w-96 bg-slate-900/95 border-l border-indigo-500/30 backdrop-blur-2xl shadow-2xl z-[999] flex flex-col font-mono text-slate-100 p-5 overflow-y-auto";

  return (
    <AnimatePresence>
      <motion.aside
        initial={inline ? { opacity: 0, y: 10 } : { x: "100%", opacity: 0 }}
        animate={inline ? { opacity: 1, y: 0 } : { x: 0, opacity: 1 }}
        exit={inline ? { opacity: 0, y: 10 } : { x: "100%", opacity: 0 }}
        transition={{ type: "spring", damping: 25, stiffness: 220 }}
        className={containerClasses}
      >

        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <FileCode className="w-5 h-5 text-indigo-400" />
            <h2 className="font-bold text-sm text-white truncate max-w-[220px]" title={label || undefined}>
              {label}
            </h2>
          </div>
          <button
            onClick={() => setSelectedNodeId(null)}
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Section 1: Overview Badges */}
        <div className="py-4 space-y-3 border-b border-slate-800">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400">Node Identifier:</span>
            <span className="font-bold text-indigo-300 truncate max-w-[180px]" title={selectedNodeId || undefined}>
              {selectedNodeId}
            </span>

          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400">Language / Type:</span>
            <span className="px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-semibold uppercase">
              {language}
            </span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400">File Findings:</span>
            <span
              className={`font-bold px-2 py-0.5 rounded text-xs border ${
                nodeFindings.length > 0
                  ? "bg-amber-500/20 text-amber-300 border-amber-500/30"
                  : "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
              }`}
            >
              {nodeFindings.length > 0 ? `${nodeFindings.length} Issues` : "0 Issues"}
            </span>
          </div>
        </div>

        {/* Section 2: AI Code Explanation & Learning Agent Analysis */}
        <div className="py-4 border-b border-slate-800 space-y-3">
          <h3 className="text-xs font-semibold text-indigo-400 flex items-center gap-1.5">
            <BookOpen className="w-4 h-4 text-indigo-400" /> Learning Agent Analysis
          </h3>

          {loading && (
            <div className="space-y-2 p-3 rounded-lg bg-slate-950/60 border border-slate-800 animate-pulse">
              <div className="h-3 bg-slate-800 rounded w-3/4"></div>
              <div className="h-3 bg-slate-800 rounded w-full"></div>
              <div className="h-3 bg-slate-800 rounded w-5/6"></div>
            </div>
          )}

          {error && (
            <p className="text-xs text-rose-400 p-3 rounded-lg bg-rose-950/30 border border-rose-500/30">
              {error}
            </p>
          )}

          {!loading && explanation && (
            <div className="space-y-3">
              {/* Summary */}
              {explanation.summary && (
                <p className="text-xs text-slate-200 leading-relaxed p-3 rounded-lg bg-slate-950/70 border border-slate-800">
                  {explanation.summary}
                </p>
              )}

              {/* Analogy Callout Box */}
              {explanation.analogy && (
                <div className="p-3 rounded-lg bg-indigo-950/40 border border-indigo-500/30 text-xs text-indigo-200 space-y-1">
                  <div className="font-semibold text-indigo-300 flex items-center gap-1.5">
                    <Lightbulb className="w-3.5 h-3.5 text-amber-400" /> Intuitive Analogy
                  </div>
                  <p className="text-[11px] text-indigo-200/90 leading-normal">{explanation.analogy}</p>
                </div>
              )}

              {/* Expandable Line-by-Line Breakdown */}
              {explanation.line_by_line && explanation.line_by_line.length > 0 && (
                <div className="rounded-lg bg-slate-950/70 border border-slate-800 overflow-hidden">
                  <button
                    onClick={() => setExpandedLines(!expandedLines)}
                    className="w-full flex items-center justify-between p-2.5 text-xs font-semibold text-slate-300 hover:bg-slate-800/50 transition"
                  >
                    <span className="flex items-center gap-1.5">
                      <Code2 className="w-3.5 h-3.5 text-sky-400" /> Line-by-Line Breakdown
                    </span>
                    {expandedLines ? (
                      <ChevronUp className="w-3.5 h-3.5 text-slate-400" />
                    ) : (
                      <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                    )}
                  </button>

                  {expandedLines && (
                    <div className="p-2.5 pt-0 space-y-2 border-t border-slate-800/60">
                      {explanation.line_by_line.map((item, idx) => (
                        <div key={idx} className="text-[11px] space-y-0.5">
                          <span className="font-bold text-sky-400">Lines {item.lines}:</span>
                          <p className="text-slate-300 leading-normal">{item.explanation}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Common Pitfalls Callout */}
              {explanation.common_pitfalls && explanation.common_pitfalls.length > 0 && (
                <div className="p-3 rounded-lg bg-amber-950/30 border border-amber-500/30 text-xs text-amber-200 space-y-1.5">
                  <div className="font-semibold text-amber-300 flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-400" /> Common Pitfalls
                  </div>
                  <ul className="list-disc list-inside text-[11px] text-amber-200/90 space-y-1">
                    {explanation.common_pitfalls.map((pitfall, idx) => (
                      <li key={idx}>{pitfall}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Related Concepts */}
              {explanation.related_concepts && explanation.related_concepts.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {explanation.related_concepts.map((concept, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 rounded text-[10px] bg-slate-800 text-indigo-300 border border-slate-700 font-semibold"
                    >
                      {concept}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Section 3: File Audit Findings */}
        <div className="py-4 space-y-3">
          <h3 className="text-xs font-semibold text-amber-400 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4" /> Security & Quality Audit
          </h3>

          {nodeFindings.length > 0 ? (
            <div className="space-y-2">
              {nodeFindings.map((f: any, idx: number) => (
                <div
                  key={idx}
                  className="p-3 rounded-lg bg-amber-950/30 border border-amber-500/30 text-xs text-amber-200 space-y-1"
                >
                  <div className="font-semibold flex items-center justify-between">
                    <span className="uppercase text-[10px] font-bold text-amber-400 px-1.5 py-0.5 rounded bg-amber-500/20">
                      {f.severity || "medium"}
                    </span>
                    <span className="text-[10px] text-slate-400">Lines {f.line_start || 1}-{f.line_end || 10}</span>
                  </div>
                  <p className="text-xs text-slate-200 font-medium">{f.description}</p>
                  {f.suggested_fix && (
                    <p className="text-[11px] text-amber-300/80 italic mt-1">Fix: {f.suggested_fix}</p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800 text-xs text-slate-400 space-y-1">
              <div className="font-semibold text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Sanitization Verified
              </div>
              <p className="text-[11px] text-slate-400">No findings for this file.</p>
            </div>
          )}
        </div>
      </motion.aside>
    </AnimatePresence>
  );
}
