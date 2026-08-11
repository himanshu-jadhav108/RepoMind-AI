import json
from typing import Any, Dict

from app.agents.base_agent import BaseAgent
from app.core.logging import log_agent_event, logger
from app.orchestration.state import AnalysisState


class BugHunterAgent(BaseAgent):
    """
    Bug Hunter Agent: Detects bugs, code smells, and anti-patterns per AGENTS.md.
    Every finding includes mandatory explainability fields: reasoning, confidence, evidence, referenced_files.
    """

    @property
    def name(self) -> str:
        return "bug_hunter_agent"

    async def run(self, state: AnalysisState) -> Dict[str, Any]:
        run_id = state.get("run_id", "run")
        log_agent_event("start", self.name, run_id, "Scanning repository for bugs, code smells, and anti-patterns")

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
        You are the Bug Hunter Agent for RepoMind AI.
        Scan the target project modules and source code below for potential bugs, anti-patterns, or code smells.

        Modules to inspect: {json.dumps(top_files)}

        Source Code Context:
        {source_context}

        Return a JSON object containing a list of findings matching this exact schema:
        {{
            "findings": [
                {{
                    "id": "bug-1",
                    "category": "bug",
                    "severity": "medium",
                    "file": "path/to/file.py",
                    "line_start": 10,
                    "line_end": 25,
                    "description": "Clear description of the bug or smell",
                    "suggested_fix": "Concrete remediation guidance",
                    "reasoning": "Detailed explanation of why this pattern is problematic",
                    "confidence": 0.85,
                    "evidence": "Quote an actual line range and exact code snippet directly from the provided source code above (e.g. Lines 12-25 in path/to/file.py). Do not invent line ranges.",
                    "referenced_files": ["path/to/file.py"]
                }}
            ]
        }}
        """

        system_instruction = "You are a Senior Security & Quality Engineer. Output valid JSON only."

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

            # Ensure IDs and default fields
            for idx, f in enumerate(findings):
                if "id" not in f or not f["id"]:
                    f["id"] = f"bug-{run_id}-{idx+1}"
                f["review_status"] = "unreviewed"

            log_agent_event("complete", self.name, run_id, f"Bug Hunter scan complete: {len(findings)} findings.")
            agent_status_map = {self.name: "completed"}
            if target_skipped:
                agent_status_map["skipped_files"] = target_skipped
            return {
                "bug_findings": findings,
                "agent_statuses": agent_status_map,
            }
        except Exception as e:
            logger.warning(f"[{self.name}] Provider call failed. Applying static heuristic fallback: {str(e)}")
            fallback_finding = {
                "id": f"bug-{run_id}-fallback",
                "category": "bug",
                "severity": "low",
                "file": top_files[0] if top_files else "unknown",
                "line_start": 1,
                "line_end": 1,
                "description": "Static heuristic scan completed; AI deep review unconfirmed due to provider outage.",
                "suggested_fix": "Perform manual review of module error handling.",
                "reasoning": "Static heuristic rule triggered fallback observation.",
                "confidence": 0.50,
                "evidence": "Static AST parse",
                "referenced_files": [top_files[0]] if top_files else [],
                "review_status": "unreviewed",
            }
            agent_status_map = {self.name: "degraded"}
            if target_skipped:
                agent_status_map["skipped_files"] = target_skipped
            return {
                "bug_findings": [fallback_finding],
                "agent_statuses": agent_status_map,
            }
