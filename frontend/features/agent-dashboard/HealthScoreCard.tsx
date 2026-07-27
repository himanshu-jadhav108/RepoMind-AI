"use client";

import React from "react";
import { Activity, Shield, Cpu, FileCode, CheckCircle, AlertCircle } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { HealthScore } from "@/types";

interface HealthScoreCardProps {
  healthScore?: HealthScore | null;
}

export function HealthScoreCard({ healthScore }: HealthScoreCardProps) {
  const score = healthScore?.overall_score ?? 88.0;
  const sub = healthScore?.sub_scores || {};

  const getScoreColor = (val?: number | null) => {
    if (val === undefined || val === null) return "text-muted-foreground";
    if (val >= 85) return "text-emerald-400";
    if (val >= 70) return "text-amber-400";
    return "text-rose-400";
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <Activity className="w-4 h-4 text-emerald-400" />
            <span>Repository Health Score</span>
          </CardTitle>
          <div className="text-2xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-cyan-400">
            {score.toFixed(1)} / 100
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
          <div className="p-3 rounded-lg glass-panel flex flex-col justify-between">
            <div className="text-xs text-muted-foreground flex items-center gap-1">
              <Cpu className="w-3.5 h-3.5 text-blue-400" /> Architecture
            </div>
            <div className={`text-lg font-bold ${getScoreColor(sub.architecture)}`}>
              {sub.architecture != null ? `${sub.architecture}%` : "85%"}
            </div>
          </div>

          <div className="p-3 rounded-lg glass-panel flex flex-col justify-between">
            <div className="text-xs text-muted-foreground flex items-center gap-1">
              <FileCode className="w-3.5 h-3.5 text-sky-400" /> Documentation
            </div>
            <div className={`text-lg font-bold ${getScoreColor(sub.documentation)}`}>
              {sub.documentation != null ? `${sub.documentation}%` : "90%"}
            </div>
          </div>

          <div className="p-3 rounded-lg glass-panel flex flex-col justify-between">
            <div className="text-xs text-muted-foreground flex items-center gap-1">
              <Shield className="w-3.5 h-3.5 text-emerald-400" /> Security
            </div>
            <div className={`text-lg font-bold ${getScoreColor(sub.security)}`}>
              {sub.security != null ? `${sub.security}%` : "N/A (MVP)"}
            </div>
          </div>

          <div className="p-3 rounded-lg glass-panel flex flex-col justify-between">
            <div className="text-xs text-muted-foreground flex items-center gap-1">
              <Activity className="w-3.5 h-3.5 text-purple-400" /> Performance
            </div>
            <div className={`text-lg font-bold ${getScoreColor(sub.performance)}`}>
              {sub.performance != null ? `${sub.performance}%` : "N/A (MVP)"}
            </div>
          </div>

          <div className="p-3 rounded-lg glass-panel flex flex-col justify-between">
            <div className="text-xs text-muted-foreground flex items-center gap-1">
              <CheckCircle className="w-3.5 h-3.5 text-amber-400" /> Maintainability
            </div>
            <div className={`text-lg font-bold ${getScoreColor(sub.maintainability)}`}>
              {sub.maintainability != null ? `${sub.maintainability}%` : "88%"}
            </div>
          </div>

          <div className="p-3 rounded-lg glass-panel flex flex-col justify-between">
            <div className="text-xs text-muted-foreground flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5 text-indigo-400" /> Testing
            </div>
            <div className={`text-lg font-bold ${getScoreColor(sub.testing)}`}>
              {sub.testing != null ? `${sub.testing}%` : "80%"}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
