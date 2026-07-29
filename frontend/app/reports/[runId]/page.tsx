"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ReportExportView } from "@/features/report-export/ReportExportView";
import { getFinalReport } from "@/lib/api-client";

export default function StandaloneReportPage({
  params,
}: {
  params: { runId: string };
}) {
  const runId = params.runId;
  const [reportMd, setReportMd] = useState<string | undefined>(undefined);

  useEffect(() => {
    async function fetchReport() {
      try {
        const data = await getFinalReport(runId);
        setReportMd(data.report_markdown);
      } catch (e) {
        console.error("Error fetching report markdown:", e);
      }
    }
    fetchReport();
  }, [runId]);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col p-4 sm:p-6 space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between border-b border-border pb-4">
        <div className="flex items-center gap-3">
          <Link href={`/analyze/${runId}`}>
            <Button variant="outline" size="sm" className="gap-1.5 text-xs">
              <ArrowLeft className="w-4 h-4" /> Return to Workspace
            </Button>
          </Link>
          <div className="flex items-center gap-2.5">
            <img
              src="/RepoMind_AI_logo.jpeg"
              alt="RepoMind AI Logo"
              className="w-8 h-8 rounded-lg object-cover border border-purple-500/30 shadow"
            />
            <h1 className="text-xl font-bold flex items-center gap-2">
              <span>Audit Report & Export Center</span>
            </h1>
          </div>
        </div>
      </div>

      <ReportExportView runId={runId} reportMarkdown={reportMd} />
    </div>
  );
}
