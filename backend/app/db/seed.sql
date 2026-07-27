-- Seed data for RepoMind AI Database

INSERT INTO repositories (id, owner, name, default_branch, last_analyzed_commit, last_analyzed_at)
VALUES (
    '11111111-1111-1111-1111-111111111111',
    'fastapi',
    'fastapi',
    'main',
    'a1b2c3d4e5f6',
    NOW()
) ON CONFLICT (owner, name) DO NOTHING;

INSERT INTO analysis_runs (id, repo_id, commit_sha, status, agents_status, started_at, completed_at)
VALUES (
    '22222222-2222-2222-2222-222222222222',
    '11111111-1111-1111-1111-111111111111',
    'a1b2c3d4e5f6',
    'completed',
    '[
        {"name": "planner_agent", "status": "completed"},
        {"name": "repository_analyzer", "status": "completed"},
        {"name": "architect_agent", "status": "completed"},
        {"name": "bug_hunter_agent", "status": "completed"},
        {"name": "documentation_agent", "status": "completed"},
        {"name": "reviewer_agent", "status": "completed"},
        {"name": "report_generator", "status": "completed"}
    ]'::jsonb,
    NOW() - INTERVAL '5 minutes',
    NOW()
) ON CONFLICT (id) DO NOTHING;

INSERT INTO findings (
    id, run_id, category, severity, file, line_start, line_end,
    description, suggested_fix, reasoning, confidence, evidence, referenced_files, review_status
)
VALUES (
    '33333333-3333-3333-3333-333333333333',
    '22222222-2222-2222-2222-222222222222',
    'bug',
    'medium',
    'fastapi/applications.py',
    102,
    115,
    'Potential unhandled exception during middleware initialization.',
    'Wrap middleware initialization in try-except block and log detailed context.',
    'Tree-sitter AST queries flagged unhandled initialization exceptions in non-async startup block.',
    0.92,
    'middleware.add(cls, **options)',
    '["fastapi/applications.py"]'::jsonb,
    'approved'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO reports (id, run_id, overall_score, sub_scores, report_markdown)
VALUES (
    '44444444-4444-4444-4444-444444444444',
    '22222222-2222-2222-2222-222222222222',
    88.5,
    '{"architecture": 90.0, "documentation": 95.0, "security": null, "performance": null, "maintainability": null, "testing": null}'::jsonb,
    '# RepoMind AI Audit Report for FastAPI\n\nOverall Health Score: 88.5/100\n'
) ON CONFLICT (id) DO NOTHING;
