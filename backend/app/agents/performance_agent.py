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

        prompt = f"""
        You are the Performance Agent for RepoMind AI.
        Inspect the central modules for algorithmic performance bottlenecks (e.g. N+1 queries, unbounded loops, blocking I/O on async loops).

        Target Central Modules: {json.dumps(top_files)}

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
                    "evidence": "Code loop or blocking call",
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
            return {
                "performance_findings": findings,
                "agent_statuses": {self.name: "completed"},
            }
        except Exception as e:
            logger.warning(f"[{self.name}] Provider call failed. Applying fallback: {str(e)}")
            return {
                "performance_findings": [],
                "agent_statuses": {self.name: "degraded"},
            }
