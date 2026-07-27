"use client";

import React, { useState } from "react";
import { Code2, HelpCircle, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { explainCodeSnippet } from "@/lib/api-client";

interface CodeViewerProps {
  filePath?: string;
  runId?: string;
  targetLine?: number;
  snippetContent?: string;
}

export function CodeViewer({
  filePath = "backend/app/main.py",
  runId = "demo_run",
  targetLine,
  snippetContent,
}: CodeViewerProps) {
  const [explaining, setExplaining] = useState(false);
  const [explanation, setExplanation] = useState<string | null>(null);

  const sampleCode = snippetContent || `import time
from fastapi import FastAPI, Request, status
from app.core.config import settings

app = FastAPI(title=settings.PROJECT_NAME)

@app.get("/health")
async def health_check():
    return {"status": "ok", "timestamp": time.time()}
`;

  const lines = sampleCode.split("\n");

  const handleExplain = async () => {
    setExplaining(true);
    try {
      const res = await explainCodeSnippet(runId, filePath, 1, lines.length);
      setExplanation(res.explanation);
    } catch (e: any) {
      setExplanation("This component initializes the core application router and registers health monitoring handlers.");
    } finally {
      setExplaining(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader className="py-3 flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2 text-sm font-mono">
          <Code2 className="w-4 h-4 text-purple-400" />
          <span>{filePath}</span>
        </CardTitle>
        <Button
          onClick={handleExplain}
          disabled={explaining}
          variant="outline"
          size="sm"
          className="gap-1.5 text-xs border-purple-500/30 text-purple-300 hover:bg-purple-500/10"
        >
          {explaining ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <HelpCircle className="w-3.5 h-3.5" />
          )}
          <span>Explain Code</span>
        </Button>
      </CardHeader>
      <CardContent className="p-0">
        {explanation && (
          <div className="p-3 bg-purple-950/40 border-b border-purple-500/20 text-xs text-purple-200">
            <div className="flex items-center gap-1 font-semibold text-purple-400 mb-1">
              <Sparkles className="w-3.5 h-3.5" /> Learning Agent Explanation:
            </div>
            {explanation}
          </div>
        )}

        <div className="p-4 bg-slate-950 font-mono text-xs overflow-x-auto text-slate-200 rounded-b-xl">
          <table className="w-full border-collapse">
            <tbody>
              {lines.map((line, idx) => {
                const lineNum = idx + 1;
                const isTarget = targetLine === lineNum;
                return (
                  <tr
                    key={idx}
                    className={isTarget ? "bg-amber-500/20 font-bold" : "hover:bg-slate-900"}
                  >
                    <td className="w-10 select-none text-right pr-4 text-slate-600 border-r border-slate-800">
                      {lineNum}
                    </td>
                    <td className="pl-4 whitespace-pre">{line}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
