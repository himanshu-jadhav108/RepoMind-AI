export type RunStatus = "queued" | "running" | "completed" | "failed";

export type AgentStatusEnum = "queued" | "running" | "completed" | "failed" | "degraded";

export interface AgentStatus {
  name: string;
  status: AgentStatusEnum;
  error?: string;
}

export interface RepoMetadata {
  repo_id: string;
  owner: string;
  name: string;
  default_branch: string;
  last_analyzed_commit?: string;
  last_analyzed_at?: string;
}

export type FindingCategory = "bug" | "security" | "performance" | "architecture";
export type FindingSeverity = "low" | "medium" | "high" | "critical";
export type ReviewStatus = "approved" | "rewritten_and_approved" | "flagged_low_confidence" | "unreviewed";

export interface Finding {
  id: string;
  category: FindingCategory;
  severity: FindingSeverity;
  file: string;
  line_start: number;
  line_end: number;
  description: string;
  suggested_fix?: string;
  reasoning: string;
  confidence: number;
  evidence: string;
  referenced_files: string[];
  review_status: ReviewStatus;
}

export interface SubScores {
  architecture?: number | null;
  documentation?: number | null;
  security?: number | null;
  performance?: number | null;
  maintainability?: number | null;
  testing?: number | null;
}

export interface HealthScore {
  run_id: string;
  overall_score: number;
  sub_scores: SubScores;
  generated_at: string;
}

export interface GraphNode {
  id: string;
  type?: string;
  data: {
    label: string;
    language?: string;
    size_bytes?: number;
  };
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
  animated?: boolean;
}

export interface KnowledgeGraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
}
