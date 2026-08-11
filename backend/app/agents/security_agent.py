import json
from typing import Any, Dict

from app.agents.base_agent import BaseAgent
from app.core.logging import log_agent_event, logger
from app.orchestration.state import AnalysisState


class SecurityAgent(BaseAgent):
    """
    Security Agent: Identifies security vulnerabilities and unsafe patterns per AGENTS.md.
    Uses CVSS severity tiering (low/medium/high/critical) and guidance.
    """

    @property
    def name(self) -> str:
        return "security_agent"

    async def run(self, state: AnalysisState) -> Dict[str, Any]:
        run_id = state.get("run_id", "run")
        log_agent_event("start", self.name, run_id, "Scanning dependency manifests and code for security vulnerabilities")

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
        You are the Security Agent for RepoMind AI.
        Scan the repository files and source code below for security vulnerabilities (e.g. injection, hardcoded secrets, insecure deserialization, unsafe CORS).

        Target Modules: {json.dumps(top_files)}

        Source Code Context:
        {source_context}

        Return a JSON object containing a list of security findings:
        {{
            "findings": [
                {{
                    "id": "sec-1",
                    "category": "security",
                    "severity": "high",
                    "file": "path/to/file.py",
                    "line_start": 5,
                    "line_end": 15,
                    "description": "Vulnerability description",
                    "suggested_fix": "Remediation instructions",
                    "reasoning": "CVSS risk assessment rationale",
                    "confidence": 0.90,
                    "evidence": "Quote an actual line range and exact code snippet directly from the provided source code above (e.g. Lines 5-15 in path/to/file.py). Do not invent line ranges.",
                    "referenced_files": ["path/to/file.py"]
                }}
            ]
        }}
        """

        system_instruction = "You are an Application Security Auditor. Output valid JSON only."

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
                    f["id"] = f"sec-{run_id}-{idx+1}"
                f["category"] = "security"
                f["review_status"] = "unreviewed"

            log_agent_event("complete", self.name, run_id, f"Security scan complete: {len(findings)} findings.")
            agent_status_map = {self.name: "completed"}
            if target_skipped:
                agent_status_map["skipped_files"] = target_skipped
            return {
                "security_findings": findings,
                "agent_statuses": agent_status_map,
            }
        except Exception as e:
            logger.warning(f"[{self.name}] Provider call failed. Applying fallback: {str(e)}")
            agent_status_map = {self.name: "degraded"}
            if target_skipped:
                agent_status_map["skipped_files"] = target_skipped
            return {
                "security_findings": [],
                "agent_statuses": agent_status_map,
            }
