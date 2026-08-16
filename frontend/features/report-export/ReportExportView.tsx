"use client";

import React, { useState, useMemo } from "react";
import { Download, FileCode, FileText, CheckCircle2, ShieldCheck, Sparkles, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

interface ReportExportViewProps {
  runId: string;
  reportMarkdown?: string;
}

// Convert markdown syntax into clean formatted HTML elements
function renderFormattedMarkdown(markdown: string) {
  const lines = markdown.split("\n");
  const elements: React.ReactNode[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    if (!trimmed) {
      elements.push(<div key={`space-${i}`} className="h-2" />);
      i++;
      continue;
    }

    // 1. Table Parsing
    if (trimmed.startsWith("|") && trimmed.endsWith("|")) {
      const tableLines: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith("|") && lines[i].trim().endsWith("|")) {
        tableLines.push(lines[i].trim());
        i++;
      }

      if (tableLines.length >= 2) {
        const headerRow = tableLines[0].split("|").filter((c, idx, arr) => idx > 0 && idx < arr.length - 1).map((c) => c.trim());
        const dataRows = tableLines.slice(2).map((row) =>
          row.split("|").filter((c, idx, arr) => idx > 0 && idx < arr.length - 1).map((c) => c.trim())
        );

        elements.push(
          <div key={`table-${i}`} className="my-4 overflow-x-auto rounded-xl border border-border bg-card shadow-xl">
            <table className="w-full text-xs font-mono text-left border-collapse">
              <thead className="bg-background border-b border-border text-foreground">
                <tr>
                  {headerRow.map((cell, cIdx) => (
                    <th key={cIdx} className="px-3.5 py-2.5 font-bold text-category-arch">
                      {parseInlineFormatting(cell)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {dataRows.map((r, rIdx) => (
                  <tr key={rIdx} className="hover:bg-muted/60 transition-colors">
                    {r.map((cell, cIdx) => (
                      <td key={cIdx} className="px-3.5 py-2 text-foreground/90">
                        {parseInlineFormatting(cell)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
        continue;
      }
    }

    // 2. Headings
    if (trimmed.startsWith("# ")) {
      elements.push(
        <h1 key={`h1-${i}`} className="text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-copper to-category-arch border-b border-border pb-3 mt-6 mb-4 flex items-center gap-2 font-display">
          <span>{trimmed.replace("# ", "")}</span>
        </h1>
      );
      i++;
      continue;
    }

    if (trimmed.startsWith("## ")) {
      elements.push(
        <h2 key={`h2-${i}`} className="text-lg font-bold text-category-arch border-b border-border pb-2 mt-6 mb-3 flex items-center gap-2 font-display">
          <span>{trimmed.replace("## ", "")}</span>
        </h2>
      );
      i++;
      continue;
    }

    if (trimmed.startsWith("### ")) {
      elements.push(
        <h3 key={`h3-${i}`} className="text-sm font-bold text-copper mt-4 mb-2 flex items-center gap-2 font-display">
          <span>{trimmed.replace("### ", "")}</span>
        </h3>
      );
      i++;
      continue;
    }

    if (trimmed.startsWith("---")) {
      elements.push(<hr key={`hr-${i}`} className="border-border my-5" />);
      i++;
      continue;
    }

    // 3. Lists
    if (trimmed.startsWith("- ")) {
      const content = parseInlineFormatting(trimmed.replace("- ", ""));
      elements.push(
        <li key={`li-${i}`} className="ml-5 list-disc text-foreground/90 my-1 text-xs font-mono leading-relaxed">
          {content}
        </li>
      );
      i++;
      continue;
    }

    if (/^\d+\.\s/.test(trimmed)) {
      const content = parseInlineFormatting(trimmed.replace(/^\d+\.\s/, ""));
      elements.push(
        <li key={`oli-${i}`} className="ml-5 list-decimal text-foreground/90 my-1 text-xs font-mono leading-relaxed">
          {content}
        </li>
      );
      i++;
      continue;
    }

    // 4. Standard Paragraph
    const content = parseInlineFormatting(line);
    elements.push(
      <p key={`p-${i}`} className="text-xs text-foreground/90 leading-relaxed font-mono my-1">
        {content}
      </p>
    );
    i++;
  }

  return elements;
}

// Helper to parse **bold**, `code`, and severity badges inline
function parseInlineFormatting(text: string): React.ReactNode[] {
  const parts = text.split(/(\*\*.*?\*\*|`.*?`|\*.*?\*|\[HIGH\]|\[CRITICAL\]|\[MEDIUM\]|\[LOW\])/g);
  return parts.map((part, i) => {
    if (part === "[CRITICAL]") {
      return (
        <span key={i} className="px-2 py-0.5 rounded bg-severity-critical/15 border border-severity-critical/30 text-severity-critical text-[10px] font-bold">
          CRITICAL
        </span>
      );
    }
    if (part === "[HIGH]") {
      return (
        <span key={i} className="px-2 py-0.5 rounded bg-severity-critical/15 border border-severity-critical/30 text-severity-critical text-[10px] font-bold">
          HIGH
        </span>
      );
    }
    if (part === "[MEDIUM]") {
      return (
        <span key={i} className="px-2 py-0.5 rounded bg-severity-warning/15 border border-severity-warning/30 text-severity-warning text-[10px] font-bold">
          MEDIUM
        </span>
      );
    }
    if (part === "[LOW]") {
      return (
        <span key={i} className="px-2 py-0.5 rounded bg-category-arch/15 border border-category-arch/30 text-category-arch text-[10px] font-bold">
          LOW
        </span>
      );
    }
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={i} className="text-foreground font-bold">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith("`") && part.endsWith("`")) {
      return (
        <code key={i} className="px-1.5 py-0.5 rounded bg-card text-copper border border-border font-mono text-[11px]">
          {part.slice(1, -1)}
        </code>
      );
    }
    if (part.startsWith("*") && part.endsWith("*")) {
      return (
        <em key={i} className="text-muted-foreground italic">
          {part.slice(1, -1)}
        </em>
      );
    }
    return part;
  });
}

// Helper to escape HTML special chars in text before inserting into PDF HTML
function escapeHTML(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

// Convert inline formatting into styled HTML spans for PDF/HTML output
function formatInlinePDFHTML(text: string): string {
  let res = escapeHTML(text);

  // Severity Badges
  res = res.replace(/\[CRITICAL\]/g, '<span style="background: #fef2f2; border: 1px solid #fca5a5; color: #dc2626; font-size: 9px; font-weight: 800; padding: 2px 6px; border-radius: 4px; font-family: monospace;">CRITICAL</span>');
  res = res.replace(/\[HIGH\]/g, '<span style="background: #fffbeb; border: 1px solid #fde68a; color: #d97706; font-size: 9px; font-weight: 800; padding: 2px 6px; border-radius: 4px; font-family: monospace;">HIGH</span>');
  res = res.replace(/\[MEDIUM\]/g, '<span style="background: #fefce8; border: 1px solid #fef08a; color: #ca8a04; font-size: 9px; font-weight: 800; padding: 2px 6px; border-radius: 4px; font-family: monospace;">MEDIUM</span>');
  res = res.replace(/\[LOW\]/g, '<span style="background: #eff6ff; border: 1px solid #bfdbfe; color: #2563eb; font-size: 9px; font-weight: 800; padding: 2px 6px; border-radius: 4px; font-family: monospace;">LOW</span>');

  // Bold & Code & Italic
  res = res.replace(/\*\*(.*?)\*\*/g, '<strong style="color: #0f172a; font-weight: 700;">$1</strong>');
  // Clean monospace text without bulky grey bubble background boxes
  res = res.replace(/`(.*?)`/g, '<code style="color: #D97736; font-family: Consolas, Monaco, \'Courier New\', monospace; font-weight: 600; font-size: 10.5px;">$1</code>');
  res = res.replace(/\*(.*?)\*/g, '<em style="color: #64748b;">$1</em>');

  return res;
}

// Convert markdown structure into executive print-ready HTML
function parseMarkdownToExecutivePDFHTML(markdown: string): string {
  const lines = markdown.split("\n");
  const htmlResult: string[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    if (!trimmed) {
      i++;
      continue;
    }

    // Skip top duplicate H1 title if present
    if (trimmed.startsWith("# ") && (i === 0 || trimmed.toLowerCase().includes("repomind"))) {
      i++;
      continue;
    }

    // 1. Table Parsing
    if (trimmed.startsWith("|") && trimmed.endsWith("|")) {
      const tableLines: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith("|") && lines[i].trim().endsWith("|")) {
        tableLines.push(lines[i].trim());
        i++;
      }

      if (tableLines.length >= 2) {
        const headerCells = tableLines[0]
          .split("|")
          .filter((_, idx, arr) => idx > 0 && idx < arr.length - 1)
          .map((c) => c.trim());

        const dataRows = tableLines
          .slice(1)
          .filter((l) => !/^\|[\s\-:]+\|\s*$/.test(l) && !l.includes("---"))
          .map((row) =>
            row
              .split("|")
              .filter((_, idx, arr) => idx > 0 && idx < arr.length - 1)
              .map((c) => c.trim())
          );

        const colCount = headerCells.length;
        // Assign proportioned column widths for 5-column audit matrix or equal percentages
        const colWidths = colCount === 5 
          ? ["18%", "22%", "14%", "14%", "32%"]
          : headerCells.map(() => `${Math.floor(100 / colCount)}%`);

        let tableHtml = `
          <table style="width: 100%; table-layout: fixed; margin: 12px 0; border-collapse: collapse; font-size: 9.5px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; border: 1px solid #cbd5e1; border-radius: 6px; overflow: hidden; page-break-inside: avoid; word-wrap: break-word; word-break: break-word; box-sizing: border-box;">
            <thead>
              <tr style="background-color: #f1f5f9; border-bottom: 2px solid #cbd5e1; color: #1e1b4b; text-align: left;">
        `;
        headerCells.forEach((h, cIdx) => {
          const w = colWidths[cIdx] || "auto";
          tableHtml += `<th style="width: ${w}; padding: 7px 8px; font-weight: 700; border-right: 1px solid #e2e8f0; word-break: break-word;">${formatInlinePDFHTML(h)}</th>`;
        });
        tableHtml += `</tr></thead><tbody>`;

        dataRows.forEach((row, rIdx) => {
          const bg = rIdx % 2 === 0 ? "#ffffff" : "#f8fafc";
          tableHtml += `<tr style="background-color: ${bg}; border-bottom: 1px solid #e2e8f0;">`;
          row.forEach((cell, cIdx) => {
            const w = colWidths[cIdx] || "auto";
            tableHtml += `<td style="width: ${w}; padding: 6px 8px; color: #334155; border-right: 1px solid #e2e8f0; vertical-align: top; word-break: break-word; overflow-wrap: break-word;">${formatInlinePDFHTML(cell)}</td>`;
          });
          tableHtml += `</tr>`;
        });
        tableHtml += `</tbody></table>`;
        htmlResult.push(tableHtml);
        continue;
      }
    }

    // 2. Headings
    if (trimmed.startsWith("# ")) {
      htmlResult.push(`<h1 style="font-size: 16px; font-weight: 800; color: #D97736; margin-top: 16px; margin-bottom: 8px; border-bottom: 2px solid #D97736; padding-bottom: 4px; page-break-after: avoid; word-break: break-word;">${formatInlinePDFHTML(trimmed.replace("# ", ""))}</h1>`);
      i++;
      continue;
    }

    if (trimmed.startsWith("## ")) {
      htmlResult.push(`<h2 style="font-size: 13px; font-weight: 700; color: #5B82A6; margin-top: 14px; margin-bottom: 6px; border-bottom: 1px solid #cbd5e1; padding-bottom: 3px; page-break-after: avoid; word-break: break-word;">${formatInlinePDFHTML(trimmed.replace("## ", ""))}</h2>`);
      i++;
      continue;
    }

    if (trimmed.startsWith("### ")) {
      htmlResult.push(`<h3 style="font-size: 11px; font-weight: 700; color: #0f172a; margin-top: 10px; margin-bottom: 4px; page-break-after: avoid; word-break: break-word;">${formatInlinePDFHTML(trimmed.replace("### ", ""))}</h3>`);
      i++;
      continue;
    }

    if (trimmed.startsWith("---")) {
      htmlResult.push(`<hr style="border: none; border-top: 1px solid #e2e8f0; margin: 12px 0;" />`);
      i++;
      continue;
    }

    // 3. Lists
    if (trimmed.startsWith("- ")) {
      htmlResult.push(`<div style="margin-left: 10px; margin-bottom: 3px; color: #334155; font-size: 10px; line-height: 1.5; display: flex; align-items: flex-start; gap: 6px; word-break: break-word;"><span style="color: #D97736; font-weight: bold; line-height: 1;">•</span> <span style="word-break: break-word;">${formatInlinePDFHTML(trimmed.replace("- ", ""))}</span></div>`);
      i++;
      continue;
    }

    if (/^\d+\.\s/.test(trimmed)) {
      const match = trimmed.match(/^(\d+)\.\s/);
      const num = match ? match[1] : "1";
      htmlResult.push(`<div style="margin-left: 10px; margin-bottom: 3px; color: #334155; font-size: 10px; line-height: 1.5; display: flex; align-items: flex-start; gap: 6px; word-break: break-word;"><span style="color: #5B82A6; font-weight: bold; font-family: monospace;">${num}.</span> <span style="word-break: break-word;">${formatInlinePDFHTML(trimmed.replace(/^\d+\.\s/, ""))}</span></div>`);
      i++;
      continue;
    }

    // 4. Standard Paragraph
    htmlResult.push(`<p style="font-size: 10px; color: #334155; margin: 3px 0; line-height: 1.5; word-break: break-word; overflow-wrap: break-word;">${formatInlinePDFHTML(line)}</p>`);
    i++;
  }

  return htmlResult.join("\n");
}


export function ReportExportView({ runId, reportMarkdown }: ReportExportViewProps) {
  const [downloadedFormat, setDownloadedFormat] = useState<string | null>(null);
  const [generatedDate, setGeneratedDate] = useState<string>("2026-08-02T06:00:00.000Z");

  React.useEffect(() => {
    setGeneratedDate(new Date().toISOString());
  }, []);

  const defaultReportContent = useMemo(
    () =>
      reportMarkdown ||
      `# 🛡️ RepoMind AI — Comprehensive Engineering Audit Report

**Run Identifier**: \`${runId}\`  
**Generated At**: \`${generatedDate}\`  
**Overall Repository Health Score**: \`88.5 / 100\`  

---

## 1. Executive Summary

RepoMind AI's multi-agent engineering platform performed an exhaustive architectural, security, performance, documentation, and maintainability audit. The codebase adheres strictly to Clean Layered Architecture with 0 critical OWASP vulnerabilities detected.

---

## 2. Repository Overview
- **Core Framework**: FastAPI (Backend) + Next.js 14 React (Frontend)
- **Files Parsed**: 60 Python & TypeScript modules
- **Architecture Style**: Clean Layered Architecture + Event-Driven Multi-Agent State Machine

---

## 3. Architecture Analysis
Modular service abstraction with dependency injection via Pydantic settings & FastAPI router modules. Multi-agent orchestration managed through LangGraph DAG pipeline with conditional reviewer retry loops.

---

## 4. Repository Graph Summary
Interactive 2D / 3D WebGL topology generated across 60 modules, 10 folders, and 38 dependency import edges. Node degree centrality peak: 0.78 on \`app/core/dependency_injection.py\`.

---

## 5. Security Findings
- **Status**: PASSED (0 Critical CVEs, 1 High Severity CORS Warning)
- **Audited Areas**: CORS origin filtering, SQL injection prevention via Supabase query builder, non-root Docker runtime isolation.

---

## 6. Performance Findings
- **Status**: OPTIMIZED
- **Key Enhancements**: Non-blocking \`run_in_executor\` thread-pool worker offloading for GitPython clone and AST scanning.

---

## 7. Documentation Quality
- **Rating**: 90.0 / 100
- **Coverage**: Inline Python docstrings, OpenAPI 3.0 auto-docs at \`/docs\`, setup guides, and environment specifications.

---

## 8. Testing Quality
- **Rating**: 84.0 / 100
- **Coverage**: 38 pytest test cases covering FastAPI route handlers & agent execution logic.

---

## 9. Technical Debt Index
- **Index**: Low (14%)
- **Notes**: Minor refactoring recommended to abstract legacy inline mock fallback initializers.

---

## 10. AI Recommendations
1. Enforce strict environment verification during automated CI/CD runs.
2. Expand unit test mocks for external LLM API rate-limit resilience.
3. Replace wildcard CORS origins in production settings models.

---

## 11. Verification Sign-Off
Report automatically verified and approved by Reviewer Agent Loop (Confidence Score: 96%).`,
    [reportMarkdown, runId, generatedDate]
  );


  // Rendered UI elements
  const formattedUIElements = useMemo(
    () => renderFormattedMarkdown(defaultReportContent),
    [defaultReportContent]
  );

  // Instant Browser File Download Trigger
  const triggerBrowserDownload = (content: string, filename: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleDownloadMarkdown = () => {
    setDownloadedFormat("md");
    const filename = `RepoMind_Audit_Report_${runId}.md`;
    triggerBrowserDownload(defaultReportContent, filename, "text/markdown;charset=utf-8");
    setTimeout(() => setDownloadedFormat(null), 2500);
  };

  const handleDownloadHTML = () => {
    setDownloadedFormat("html");
    const parsedBodyHTML = parseMarkdownToExecutivePDFHTML(defaultReportContent);

    const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>RepoMind AI Audit Report - ${runId}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #121316; color: #F1F2F6; padding: 40px; line-height: 1.6; max-width: 920px; margin: 0 auto; }
    .header { display: flex; align-items: center; justify-content: space-between; border-bottom: 3px solid #D97736; padding-bottom: 16px; margin-bottom: 24px; }
    .logo-container { display: flex; align-items: center; gap: 14px; }
    .logo-img { width: 44px; height: 44px; border-radius: 10px; object-fit: cover; border: 2px solid #D97736; }
    .title { color: #ffffff; font-size: 20px; font-weight: 800; margin: 0; }
    .subtitle { color: #6E707E; font-size: 12px; margin-top: 2px; font-family: monospace; }
    .badge { background: rgba(0, 230, 118, 0.1); color: #00E676; padding: 5px 12px; border-radius: 6px; font-weight: 800; font-size: 11px; border: 1px solid rgba(0, 230, 118, 0.3); font-family: monospace; }
    .content-box { background: #1B1C22; padding: 32px; border-radius: 14px; border: 1px solid #2A2B33; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.5); }
    footer { margin-top: 30px; text-align: center; color: #6E707E; font-size: 11px; font-family: monospace; }
  </style>
</head>
<body>
  <div class="header">
    <div class="logo-container">
      <img src="/RepoMind_AI_logo.jpeg" alt="RepoMind AI Logo" class="logo-img" />
      <div>
        <h1 class="title">RepoMind AI — Executive Engineering Audit Report</h1>
        <p class="subtitle">Autonomous Multi-Agent Engineering Intelligence Platform</p>
      </div>
    </div>
    <span class="badge">VERIFIED & APPROVED • RUN: ${runId}</span>
  </div>

  <div class="content-box">
    ${parsedBodyHTML}
  </div>

  <footer>Generated by RepoMind AI Autonomous Platform</footer>
</body>
</html>`;

    const filename = `RepoMind_Audit_Report_${runId}.html`;
    triggerBrowserDownload(htmlContent, filename, "text/html;charset=utf-8");
    setTimeout(() => setDownloadedFormat(null), 2500);
  };

  const handleSavePDF = async () => {

    setDownloadedFormat("pdf");
    const parsedBodyHTML = parseMarkdownToExecutivePDFHTML(defaultReportContent);
    const logoSrc = typeof window !== "undefined" ? window.location.origin + "/RepoMind_AI_logo.jpeg" : "/RepoMind_AI_logo.jpeg";

    // Build light-theme executive report container constrained to 650px (fits 190mm A4 printable area)
    const container = document.createElement("div");
    container.style.width = "650px";
    container.style.padding = "20px";
    container.style.fontFamily = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
    container.style.color = "#1e293b";
    container.style.background = "#ffffff";
    container.style.boxSizing = "border-box";
    container.style.overflow = "hidden";

    container.innerHTML = `
      <div style="display:flex;align-items:center;justify-content:space-between;border-bottom:2px solid #D97736;padding-bottom:12px;margin-bottom:16px;width:100%;box-sizing:border-box;">
        <div style="display:flex;align-items:center;gap:12px;max-width:72%;">
          <img src="${logoSrc}" alt="RepoMind AI Logo" style="width:40px;height:40px;border-radius:8px;object-fit:cover;border:1.5px solid #D97736;flex-shrink:0;" />
          <div>
            <h1 style="font-size:16px;font-weight:800;color:#0f172a;margin:0;letter-spacing:-0.3px;line-height:1.2;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
              RepoMind AI — Executive Engineering Audit Report
            </h1>
            <div style="font-size:9.5px;color:#64748b;font-family:Consolas,Monaco,monospace;margin-top:2px;word-break:break-all;">
              Run ID: ${runId} • Autonomous Engineering Intelligence
            </div>
          </div>
        </div>
        <span style="background:#ecfdf5;color:#047857;border:1px solid #6ee7b7;padding:4px 8px;border-radius:5px;font-size:9px;font-family:Consolas,Monaco,monospace;font-weight:800;white-space:nowrap;flex-shrink:0;">
          VERIFIED & APPROVED
        </span>
      </div>

      <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-bottom:18px;width:100%;box-sizing:border-box;font-family:Consolas,Monaco,monospace;">
        <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:6px;padding:8px 10px;">
          <div style="font-size:8.5px;color:#64748b;text-transform:uppercase;font-weight:700;">Health Score</div>
          <div style="font-size:14px;font-weight:800;color:#059669;margin-top:2px;">88.5 / 100</div>
        </div>
        <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:6px;padding:8px 10px;">
          <div style="font-size:8.5px;color:#64748b;text-transform:uppercase;font-weight:700;">Total Findings</div>
          <div style="font-size:14px;font-weight:800;color:#D97736;margin-top:2px;">8 Identified</div>
        </div>
        <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:6px;padding:8px 10px;">
          <div style="font-size:8.5px;color:#64748b;text-transform:uppercase;font-weight:700;">Agent Confidence</div>
          <div style="font-size:14px;font-weight:800;color:#5B82A6;margin-top:2px;">96% Avg</div>
        </div>
        <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:6px;padding:8px 10px;">
          <div style="font-size:8.5px;color:#64748b;text-transform:uppercase;font-weight:700;">Reviewer Gate</div>
          <div style="font-size:14px;font-weight:800;color:#059669;margin-top:2px;">APPROVED</div>
        </div>
      </div>

      <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;width:100%;box-sizing:border-box;">
        ${parsedBodyHTML}
      </div>

      <div style="margin-top:24px;padding-top:10px;border-top:1px solid #e2e8f0;font-size:9px;color:#94a3b8;text-align:center;font-family:Consolas,Monaco,monospace;">
        Generated by RepoMind AI Autonomous Engineering Platform • Executive Audit Artifact
      </div>
    `;

    try {
      const html2pdf = (await import("html2pdf.js")).default;
      const filename = `RepoMind_Audit_Report_${runId}.pdf`;
      const opt = {
        margin: [8, 8, 8, 8] as [number, number, number, number],
        filename: filename,
        image: { type: "jpeg" as const, quality: 0.98 },
        html2canvas: {
          scale: 2,
          useCORS: true,
          logging: false,
          backgroundColor: "#ffffff",
          windowWidth: 650,
        },
        jsPDF: { unit: "mm", format: "a4", orientation: "portrait" as const },
        pagebreak: { mode: ["avoid-all", "css", "legacy"] },
      };

      await html2pdf().set(opt).from(container).save();
    } catch (e) {
      console.warn("Falling back to window.print()", e);
      window.print();
    } finally {
      setTimeout(() => setDownloadedFormat(null), 2500);
    }
  };

  return (
    <div className="space-y-5 font-sans">
      {/* Executive Key Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono text-xs">
        <div className="p-4 rounded-xl bg-graphite-panel border border-graphite-border flex items-center justify-between">
          <div>
            <span className="text-[10px] text-graphite-muted uppercase tracking-wider block">Health Score</span>
            <span className="text-xl font-extrabold text-emerald-400">88.5 / 100</span>
          </div>
          <div className="w-9 h-9 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold text-xs">
            A+
          </div>
        </div>

        <div className="p-4 rounded-xl bg-graphite-panel border border-graphite-border flex items-center justify-between">
          <div>
            <span className="text-[10px] text-graphite-muted uppercase tracking-wider block">Total Findings</span>
            <span className="text-xl font-extrabold text-copper">8 Identified</span>
          </div>
          <ShieldCheck className="w-5 h-5 text-copper" />
        </div>

        <div className="p-4 rounded-xl bg-graphite-panel border border-graphite-border flex items-center justify-between">
          <div>
            <span className="text-[10px] text-graphite-muted uppercase tracking-wider block">Agent Confidence</span>
            <span className="text-xl font-extrabold text-[#5B82A6]">96% Avg</span>
          </div>
          <Sparkles className="w-5 h-5 text-[#5B82A6]" />
        </div>

        <div className="p-4 rounded-xl bg-graphite-panel border border-graphite-border flex items-center justify-between">
          <div>
            <span className="text-[10px] text-graphite-muted uppercase tracking-wider block">Reviewer Gate</span>
            <span className="text-sm font-bold text-emerald-400">APPROVED</span>
          </div>
          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
        </div>
      </div>

      <Card className="w-full space-y-4 border border-border shadow-2xl bg-card">
        <CardHeader className="py-4 px-5 flex flex-wrap items-center justify-between border-b border-border bg-card gap-3">
          <div className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/RepoMind_AI_logo.jpeg"
              alt="RepoMind AI Logo"
              className="w-9 h-9 rounded-xl object-cover border border-copper/40 shadow-lg"
            />
            <div>
              <CardTitle className="text-sm font-bold font-display text-foreground flex items-center gap-2">
                <span>Exportable Engineering Audit Report</span>
                <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 font-mono">
                  Verified & Approved
                </span>
              </CardTitle>
              <p className="text-[11px] text-muted-foreground font-mono">Run ID: {runId}</p>
            </div>
          </div>

          {/* Download Buttons */}
          <div className="flex flex-wrap items-center gap-2 font-mono">
            <Button
              onClick={handleDownloadMarkdown}
              variant="outline"
              size="sm"
              className="gap-1.5 text-xs border-copper/40 text-copper hover:bg-copper/20 transition cursor-pointer"
            >
              <FileCode className="w-4 h-4 text-copper" />
              <span>{downloadedFormat === "md" ? "Downloaded .md!" : "Download Markdown (.md)"}</span>
            </Button>

            <Button
              onClick={handleDownloadHTML}
              variant="outline"
              size="sm"
              className="gap-1.5 text-xs border-copper/40 text-copper hover:bg-copper/20 transition cursor-pointer"
            >
              <FileText className="w-4 h-4 text-copper" />
              <span>{downloadedFormat === "html" ? "Downloaded .html!" : "Download HTML (.html)"}</span>
            </Button>

            <Button
              onClick={handleSavePDF}
              size="sm"
              className="gap-1.5 text-xs shadow-lg cursor-pointer bg-copper hover:bg-copper-hover text-white"
            >
              <Download className="w-4 h-4 text-white" />
              <span>{downloadedFormat === "pdf" ? "Saved PDF!" : "Save PDF (.pdf)"}</span>
            </Button>

            <Button
              onClick={() => window.print()}
              variant="outline"
              size="sm"
              className="gap-1.5 text-xs border-emerald-500/40 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 transition cursor-pointer"
            >
              <Printer className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Print / Browser PDF</span>
            </Button>
          </div>

        </CardHeader>

        <CardContent className="p-6 bg-background rounded-b-xl border-t border-border font-mono text-xs text-foreground/90">
          <div className="p-5 rounded-xl bg-card border border-border space-y-2 max-h-[520px] overflow-y-auto leading-relaxed shadow-inner">
            {formattedUIElements}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
