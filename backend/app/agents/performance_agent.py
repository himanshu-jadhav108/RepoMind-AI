import json
from typing import Any, Dict

from app.agents.base_agent import BaseAgent
from app.core.logging import log_agent_event, logger
from app.orchestration.state import AnalysisState


class PerformanceAgent(BaseAgent):
    """
    Performance Agent: Identifies performance bottlenecks and inefficient patterns in central modules per AGENTS.md.
    """

    @property
    def name(self) -> str:
        return "performance_agent"

    async def run(self, state: AnalysisState) -> Dict[str, Any]:
        run_id = state.get("run_id", "run")
        log_agent_event("start", self.name, run_id, "Analyzing central modules for algorithmic performance bottlenecks")

        repo_struct = state.get("repo_structure", {})
        top_files = repo_struct.get("top_central_modules", [])[:5]
        file_contexts = repo_struct.get("file_contexts", {})
        global_skipped = repo_struct.get("skipped_files", [])

        # Format source code context into prompt
        code_blocks = []
        target_skipped = [f for f in top_files if f not in file_contexts]
        for f in global_skipped:
            if f not in target_skipped:
                target_skipped.append(f)

        for path, code in file_contexts.items():
            if path in top_files or len(code_blocks) < 5:
                code_blocks.append(f"```python\n# File: {path}\n{code}\n```")
        source_context = "\n\n".join(code_blocks) if code_blocks else "No source code available."

        prompt = f"""
        You are the Performance Agent for RepoMind AI.
        Inspect the central modules and source code below for algorithmic performance bottlenecks (e.g. N+1 queries, unbounded loops, blocking I/O on async loops).

        Target Central Modules: {json.dumps(top_files)}

        Source Code Context:
        {source_context}

        Return a JSON object containing performance findings:
        {{
            "findings": [
                {{
                    "id": "perf-1",
                    "category": "performance",
                    "severity": "medium",
                    "file": "path/to/file.py",
                    "line_start": 20,
                    "line_end": 40,
                    "description": "Performance bottleneck description",
                    "suggested_fix": "Optimization guidance",
                    "reasoning": "Algorithmic complexity analysis (Big-O)",
                    "confidence": 0.85,
                    "evidence": "Quote an actual line range and exact code snippet directly from the provided source code above (e.g. Lines 20-30 in path/to/file.py). Do not invent line ranges.",
                    "referenced_files": ["path/to/file.py"]
                }}
            ]
        }}
        """

        system_instruction = "You are a Performance Optimization Engineer. Output valid JSON only."

        try:
            res = await self.provider_router.generate(
                prompt=prompt,
                system_instruction=system_instruction,
                json_output=True,
                run_id=run_id,
                agent_name=self.name,
            )
            parsed = json.loads(res.content)
            findings = parsed.get("findings", [])

            for idx, f in enumerate(findings):
                if "id" not in f or not f["id"]:
                    f["id"] = f"perf-{run_id}-{idx+1}"
                f["category"] = "performance"
                f["review_status"] = "unreviewed"

            log_agent_event("complete", self.name, run_id, f"Performance scan complete: {len(findings)} findings.")
            agent_status_map = {self.name: "completed"}
            if target_skipped:
                agent_status_map["skipped_files"] = target_skipped
            return {
                "performance_findings": findings,
                "agent_statuses": agent_status_map,
            }
        except Exception as e:
            logger.warning(f"[{self.name}] Provider call failed. Applying fallback: {str(e)}")
            agent_status_map = {self.name: "degraded"}
            if target_skipped:
                agent_status_map["skipped_files"] = target_skipped
            return {
                "performance_findings": [],
                "agent_statuses": agent_status_map,
            }
