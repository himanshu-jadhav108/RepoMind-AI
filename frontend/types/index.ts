export type RunStatus = "queued" | "running" | "completed" | "failed";

export type AgentStatusEnum = "queued" | "running" | "completed" | "failed" | "degraded";

export interface AgentStatus {
  name: string;
  status: AgentStatusEnum;
  current_task?: string;
  files_analyzed?: number;
  progress?: number;
  estimated_remaining_sec?: number;
  error?: string;
}

export interface RepoMetadata {
  repo_id: string;
  owner: string;
  name: string;
  repo_name?: string;
  repo_url?: string;
  default_branch: string;
  created_at?: string;
  last_analyzed_commit?: string;
  last_analyzed_at?: string;
}

export type FindingCategory = "bug" | "security" | "performance" | "architecture";
export type FindingSeverity = "low" | "medium" | "high" | "critical";
export type ReviewStatus = "approved" | "rewritten_and_approved" | "flagged_low_confidence" | "unreviewed";

export interface CodeExplanation {
  summary: string;
  line_by_line: { lines: string; explanation: string }[];
  analogy: string;
  common_pitfalls: string[];
  related_concepts: string[];
  source_is_real?: boolean;
  file?: string;
  line_start?: number;
  line_end?: number;
}

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
  why_recommendation_exists?: string;
  potential_limitations?: string;
}

export interface HealthDimensionMetric {
  score: number;
  reasoning: string;
  evidence: string;
}

export interface SubScores {
  architecture?: number | HealthDimensionMetric | null;
  security?: number | HealthDimensionMetric | null;
  performance?: number | HealthDimensionMetric | null;
  documentation?: number | HealthDimensionMetric | null;
  testing?: number | HealthDimensionMetric | null;
  maintainability?: number | HealthDimensionMetric | null;
  technical_debt?: number | HealthDimensionMetric | null;
}

export interface HealthScore {
  run_id: string;
  overall_score: number;
  overall_reasoning?: string;
  overall_evidence?: string;
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

export interface AgentPresentation {
  agent_id?: string;
  agent_name: string;
  role?: string;
  agent_role?: string;
  avatar?: string;
  avatar_color?: string;
  speech?: string;
  key_point?: string;
  summary?: string;
  reasoning?: string;
  confidence?: number;
  evidence?: string;
  referenced_files?: string[];
  code_reference?: string;
  severity?: "low" | "medium" | "high" | "critical";
  recommended_actions?: string[];
}

export interface ReviewMeetingData {
  run_id: string;
  meeting_title: string;
  verdict: string;
  verdict_reasoning: string;
  overall_confidence: number;
  presentations: AgentPresentation[];
}

export interface CopilotChatMessage {
  sender: "user" | "copilot";
  text: string;
  timestamp: string;
  referenced_files?: string[];
  confidence?: number;
}

export interface PathStep {
  node: string;
  layer: string;
  description: string;
}

export interface PathFinderResult {
  run_id: string;
  source: string;
  target: string;
  hop_count: number;
  path_found: boolean;
  steps: PathStep[];
  summary: string;
}

export interface SmartLearningExplanation {
  run_id: string;
  file: string;
  depth: "beginner" | "intermediate" | "advanced";
  explanation: {
    title: string;
    overview: string;
    tech_stack: string[];
    key_concepts: string[];
    best_practices: string[];
    anti_patterns: string[];
  };
}

