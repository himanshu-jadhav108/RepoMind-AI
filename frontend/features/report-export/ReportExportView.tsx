"use client";

import React, { useState } from "react";
import { Download, FileCode, FileText, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

interface ReportExportViewProps {
  runId: string;
  reportMarkdown?: string;
}

export function ReportExportView({ runId, reportMarkdown }: ReportExportViewProps) {
  const [downloading, setDownloading] = useState<string | null>(null);

  const sampleReport =
    reportMarkdown ||
    `# RepoMind AI Engineering Audit Report\n\n**Run ID**: \`${runId}\`  \n**Overall Health Score**: \`88.5/100\`\n\n## Executive Summary\nMulti-agent analysis completed successfully across architecture, bugs, security, and documentation.\n\n## Approved Findings\n- **[MEDIUM]** \`backend/app/main.py:40\` — Potential unhandled exception during middleware initialization. *(Confidence: 85%)*\n\n## Architecture Overview\nClean Architecture pattern with modular service separation.`;

  const handleExport = (format: "md" | "pdf") => {
    setDownloading(format);
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
    const downloadUrl = `${apiUrl}/api/v1/analysis/${runId}/report/export?format=${format}`;
    window.open(downloadUrl, "_blank");
    setTimeout(() => setDownloading(null), 1000);
  };

  return (
    <Card className="w-full space-y-4">
      <CardHeader className="py-3 flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2 text-base">
          <FileText className="w-4 h-4 text-emerald-400" />
          <span>Exportable Final Engineering Audit Report</span>
        </CardTitle>

        <div className="flex gap-2">
          <Button
            onClick={() => handleExport("md")}
            variant="outline"
            size="sm"
            className="gap-1.5 text-xs"
          >
            <FileCode className="w-3.5 h-3.5 text-sky-400" />
            <span>Download Markdown (.md)</span>
          </Button>

          <Button
            onClick={() => handleExport("pdf")}
            variant="gradient"
            size="sm"
            className="gap-1.5 text-xs"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export PDF (.pdf)</span>
          </Button>
        </div>
      </CardHeader>

      <CardContent className="p-6 bg-slate-950 rounded-b-xl border-t border-border">
        <div className="prose prose-invert max-w-none text-xs font-mono whitespace-pre-wrap text-slate-200">
          {sampleReport}
        </div>
      </CardContent>
    </Card>
  );
}
