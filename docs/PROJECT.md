# PROJECT.md — RepoMind AI

## Vision

RepoMind AI is an autonomous engineering workspace that transforms any public GitHub repository into a fully analyzed, explained, and improvable engineering artifact. Instead of chatting with a single assistant, the user delegates work to a team of specialized AI agents — each responsible for a distinct engineering discipline (architecture, security, performance, documentation, bugs, features) — and receives a structured, professional-grade engineering report.

RepoMind AI is **not a chatbot**. It is an AI engineering team accessed through a repository URL — and it is built as a demonstration of true agentic software engineering, not prompt-and-response AI. Four principles distinguish it from a wrapper around a single LLM call:

- **Planning before execution** — a Planner Agent inspects the repository and produces an explicit execution plan before any analysis agent runs, so the system reasons about *what* to do before doing it.
- **Multi-agent collaboration** — ten agents with distinct responsibilities pass structured state through a LangGraph pipeline, some running in parallel, some depending on others' outputs, mirroring how a real engineering team divides labor.
- **Review loops, not one-shot generation** — high-stakes outputs (findings, architecture claims, generated docs) pass through a Reviewer Agent loop (Review → Feedback → Rewrite → Validate → Approve) before being shown to the user, catching hallucinations and low-confidence output the way a senior engineer reviews a PR.
- **Explainability by default** — every AI-generated insight ships with its reasoning, a confidence score, supporting evidence, and the exact files it's based on, so users can trust and verify findings rather than take them on faith.

## Why This Project Fits the OpenAI Codex Hackathon

RepoMind AI is a purpose-built showcase of agentic, Codex-style software engineering rather than a single-turn AI feature bolted onto an app:

- **Technical Execution** — a real multi-agent LangGraph pipeline with typed shared state, a provider-abstraction layer with automatic failover, a repository knowledge graph built from static analysis (GitPython + Tree-sitter + NetworkX), and a review-loop quality gate.
- **Impact** — collapses hours of manual codebase onboarding, security triage, and documentation writing into a single automated run, directly relevant to every developer, student, and OSS maintainer who has ever opened an unfamiliar repo.
- **Use of Codex / Agentic Workflows** — the entire product *is* an agentic workflow: planning, parallel execution, inter-agent dependencies, self-review, and adaptive model routing are core architecture, not add-ons.
- **Creativity** — reframes "analyze my code" as "hire an AI engineering team," with a live agent timeline that visualizes autonomous reasoning in progress rather than hiding it behind a spinner.
- **Demo Quality** — a single URL paste produces a visibly unfolding, multi-agent live demo with a real-time dashboard, ending in a concrete exportable report — a strong narrative arc for a short judged demo.

## Unique Selling Points

- Only tool that turns a GitHub URL into a full multi-disciplinary engineering audit (architecture + bugs + security + performance + docs + roadmap) in one run.
- Every finding is explainable and evidence-linked — not a black-box verdict.
- Provider-agnostic by design — never locked into or dependent on a single LLM vendor's uptime or pricing.
- Review-loop quality gate means findings shown to the user have already survived a second AI pass, reducing hallucinated or low-value output.

## Killer Features

- **Repository Knowledge Graph** — a visual, navigable graph of files, folders, imports, dependencies, call relationships, classes, and functions, built automatically from static analysis.
- **Agent Timeline** — a live UI showing every agent's progress, decisions, execution logs, confidence scores, and review history as the analysis unfolds.
- **Adaptive AI Routing Engine** — the Provider Layer automatically selects the best available LLM per task based on complexity, cost, speed, and live provider availability.
- **Reviewer Agent Loop** — a built-in self-correction cycle (Review → Feedback → Rewrite → Validate → Approve) applied to important agent outputs before they reach the user.
- **Repository Health Score** — a single, explainable score rolled up from Architecture, Documentation, Security, Performance, Maintainability, and Testing sub-scores.

## Demo Flow

1. Paste a public GitHub repository URL.
2. Watch the Planner Agent produce a visible execution plan in the Agent Timeline.
3. Watch agents light up in parallel — Architect building the Knowledge Graph, Bug Hunter and Security Agent scanning concurrently.
4. Show one finding flowing through the Reviewer Agent loop live (Review → Feedback → Rewrite → Validate → Approve) to demonstrate self-correction, not just generation.
5. Land on the Repository Health Score dashboard, then drill into one finding to show reasoning, confidence, evidence, and referenced files.
6. Export the final consolidated report in under two minutes from paste to PDF.

## Problem Statement

Understanding an unfamiliar codebase is slow and expensive:

- New contributors spend hours or days orienting themselves in a repo before making a useful change.
- Recruiters and hiring managers cannot quickly assess the real engineering quality of a candidate's project.
- Maintainers lack time to write and update architecture docs, security notes, and contributor guides.
- Existing AI coding tools are conversational and reactive — they answer questions but don't proactively produce a full analysis.

There is no single tool that ingests a repo and returns a complete, multi-disciplinary engineering assessment automatically.

## Objectives

1. Ingest any public GitHub repository and build a structural understanding of it (files, modules, dependency graph, languages).
2. Run a coordinated set of AI agents that each analyze the repo from a distinct engineering lens.
3. Present results as an interactive workspace, not a wall of chat text.
4. Produce actionable, exportable outputs: architecture diagrams, bug lists, security findings, performance notes, docs, and a contributor roadmap.
5. Remain provider-agnostic — the system must not depend on the availability or pricing of a single LLM vendor.

## Target Users

- **Developers** — evaluating or onboarding onto a new codebase.
- **Students** — learning real-world project architecture and patterns.
- **Open Source Contributors** — finding entry points and understanding contribution guidelines.
- **Recruiters** — assessing engineering quality of a candidate's public repos.
- **Engineering Teams** — auditing legacy or third-party codebases.

## Features

### Core
- GitHub URL ingestion and repository cloning/parsing
- Multi-agent analysis pipeline (10 specialized agents)
- Interactive architecture visualization (dependency/module graph)
- In-browser code viewer with agent annotations (Monaco Editor)
- Auto-generated documentation (README, architecture docs, module docs)
- Bug and code smell detection with severity ratings
- Security vulnerability scanning with remediation guidance
- Performance bottleneck identification
- "Explain this code" simplification mode for learning
- Feature suggestion engine
- Contributor roadmap generation (good-first-issues, entry points, skill map)
- Exportable final report (Markdown/PDF)

### Supporting
- Multi-provider AI layer with automatic failover (Gemini, Groq, OpenAI, Hugging Face, OpenRouter)
- Analysis caching to avoid redundant re-processing of unchanged repos
- Session/history of previously analyzed repositories

## User Journey

1. **Entry** — User pastes a GitHub repository URL on the landing page.
2. **Ingestion** — System clones the repo, parses its structure, and builds a dependency graph.
3. **Orchestration** — LangGraph coordinates the agent team; each agent runs its analysis, some depending on others' outputs.
4. **Live Workspace** — User watches "agents" populate a dashboard in real time (analogous to a team status board): Architect posting a diagram, Bug Hunter posting findings, etc.
5. **Exploration** — User navigates tabs/panels per agent: Architecture, Docs, Bugs, Security, Performance, Learning, Features, Roadmap.
6. **Code Drilldown** — User clicks any finding to jump to the exact file/line in the embedded Monaco viewer.
7. **Export** — User downloads or shares a consolidated report generated by the Report Generator agent.

## MVP Scope

- Single public GitHub repo URL input (no auth required for public repos)
- Repository ingestion via GitPython + Tree-sitter for structural parsing
- Dependency graph construction via NetworkX
- 7 core agents active for MVP: Planner Agent, Repository Analyzer, Architect Agent, Bug Hunter Agent, Documentation Agent, Reviewer Agent, Report Generator
- Basic LangGraph orchestration (planning phase → sequential + one parallel branch → review loop on findings)
- Repository Knowledge Graph (files, folders, imports, dependencies) rendered via React Flow
- Repository Health Score summarizing Architecture, Documentation, and a placeholder for Security/Performance/Maintainability/Testing sub-scores as those agents come online post-MVP
- Single AI provider active (with the provider interface built for multi-provider from day one)
- Minimal but functional frontend: URL input → live agent status → tabbed results view
- Supabase for storing analysis runs and results
- One-click Markdown export of the final report

## Future Scope

- All 10 agents live, with the Reviewer Agent loop applied across every finding category (Security, Performance, Feature Suggestions) and full Repository Health Score (Security, Performance, Maintainability, Testing sub-scores completed)
- Adaptive AI Routing Engine expanded from priority-order failover to true cost/speed/complexity-based model selection per task
- Private repository support via GitHub OAuth
- Multi-repo comparison mode
- CI/CD integration (auto-run RepoMind on every PR)
- Team/workspace accounts with shared analysis history
- Real-time collaborative annotations
- IDE extension (VS Code) surfacing RepoMind findings inline
- Fine-tuned/local model option for security-sensitive codebases
- Historical trend tracking (code health over time across commits)

---

## Changes Made

- Expanded Vision with four explicit agentic-engineering principles (planning, multi-agent collaboration, review loops, explainability) without altering the original vision statement or "not a chatbot" positioning.
- Added "Why This Project Fits the OpenAI Codex Hackathon" mapped directly to the five judging criteria.
- Added Unique Selling Points, Killer Features, and a concrete Demo Flow section.
- Updated MVP Scope to include the new Planner Agent and Reviewer Agent, the Repository Knowledge Graph, and an initial Repository Health Score, keeping the original 5-agent MVP core intact and additive rather than replaced.
- Updated Future Scope to reflect the full Health Score rollout and the Adaptive AI Routing Engine, consistent with AGENTS.md and ARCHITECTURE.md changes.
