-- RepoMind AI — Initial Supabase Schema Migration (001_initial_schema.sql)
-- Created in accordance with ARCHITECTURE.md, AGENTS.md, and API.md specifications.

-- Enable UUID extension if not enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Repositories Table
CREATE TABLE IF NOT EXISTS repositories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner TEXT NOT NULL,
    name TEXT NOT NULL,
    default_branch TEXT NOT NULL DEFAULT 'main',
    last_analyzed_commit TEXT,
    last_analyzed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_owner_name UNIQUE (owner, name)
);

-- 2. Analysis Runs Table
CREATE TABLE IF NOT EXISTS analysis_runs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    repo_id UUID NOT NULL REFERENCES repositories(id) ON DELETE CASCADE,
    commit_sha TEXT,
    status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'running', 'completed', 'failed')),
    agents_status JSONB NOT NULL DEFAULT '[]'::jsonb,
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

-- 3. Agent Results Table
CREATE TABLE IF NOT EXISTS agent_results (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    run_id UUID NOT NULL REFERENCES analysis_runs(id) ON DELETE CASCADE,
    agent_name TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('queued', 'running', 'completed', 'failed', 'degraded')),
    output_json JSONB NOT NULL DEFAULT '{}'::jsonb,
    tokens_used INTEGER NOT NULL DEFAULT 0,
    latency_ms DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Findings Table (Normalized findings across Bug Hunter, Security, Performance, Architect)
CREATE TABLE IF NOT EXISTS findings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    run_id UUID NOT NULL REFERENCES analysis_runs(id) ON DELETE CASCADE,
    category TEXT NOT NULL CHECK (category IN ('bug', 'security', 'performance', 'architecture')),
    severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    file TEXT NOT NULL,
    line_start INTEGER NOT NULL DEFAULT 0,
    line_end INTEGER NOT NULL DEFAULT 0,
    description TEXT NOT NULL,
    suggested_fix TEXT,
    
    -- Explainability Fields (AGENTS.md & API.md)
    reasoning TEXT NOT NULL,
    confidence DOUBLE PRECISION NOT NULL CHECK (confidence >= 0.0 AND confidence <= 1.0),
    evidence TEXT NOT NULL,
    referenced_files JSONB NOT NULL DEFAULT '[]'::jsonb,
    
    -- Reviewer Agent Loop Status
    review_status TEXT NOT NULL DEFAULT 'unreviewed' CHECK (review_status IN ('approved', 'rewritten_and_approved', 'flagged_low_confidence', 'unreviewed')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Reports Table
CREATE TABLE IF NOT EXISTS reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    run_id UUID NOT NULL UNIQUE REFERENCES analysis_runs(id) ON DELETE CASCADE,
    overall_score DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    sub_scores JSONB NOT NULL DEFAULT '{}'::jsonb,
    report_markdown TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. Provider Usage Audit Log Table
CREATE TABLE IF NOT EXISTS provider_usage (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    run_id UUID REFERENCES analysis_runs(id) ON DELETE CASCADE,
    agent_name TEXT,
    provider_name TEXT NOT NULL,
    model_name TEXT,
    tokens_used INTEGER NOT NULL DEFAULT 0,
    latency_ms DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    success BOOLEAN NOT NULL DEFAULT TRUE,
    error TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for optimal query performance
CREATE INDEX IF NOT EXISTS idx_repositories_owner_name ON repositories(owner, name);
CREATE INDEX IF NOT EXISTS idx_analysis_runs_repo_id ON analysis_runs(repo_id);
CREATE INDEX IF NOT EXISTS idx_findings_run_id ON findings(run_id);
CREATE INDEX IF NOT EXISTS idx_findings_category_severity ON findings(category, severity);
CREATE INDEX IF NOT EXISTS idx_findings_review_status ON findings(review_status);
CREATE INDEX IF NOT EXISTS idx_provider_usage_run_id ON provider_usage(run_id);
