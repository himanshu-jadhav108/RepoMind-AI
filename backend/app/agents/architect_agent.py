import json
from typing import Any, Dict

from app.agents.base_agent import BaseAgent
from app.core.logging import log_agent_event, logger
from app.orchestration.state import AnalysisState


class ArchitectAgent(BaseAgent):
    """
    Architect Agent: Explains overall system architecture, identifies patterns & anti-patterns,
    and produces visual Knowledge Graph metadata per AGENTS.md.
    """

    @property
    def name(self) -> str:
        return "architect_agent"

    async def run(self, state: AnalysisState) -> Dict[str, Any]:
        run_id = state.get("run_id", "run")
        log_agent_event("start", self.name, run_id, "Analyzing repository architecture and module relationships")

        repo_struct = state.get("repo_structure", {})
        kg_data = state.get("knowledge_graph_data", {})
        top_modules = repo_struct.get("top_central_modules", [])
        file_contexts = repo_struct.get("file_contexts", {})
        global_skipped = repo_struct.get("skipped_files", [])

        # Format source code context into prompt
        code_blocks = []
        target_skipped = [f for f in top_modules[:5] if f not in file_contexts]
        for f in global_skipped:
            if f not in target_skipped:
                target_skipped.append(f)

        for path, code in file_contexts.items():
            if path in top_modules[:5] or len(code_blocks) < 5:
                code_blocks.append(f"```python\n# File: {path}\n{code}\n```")
        source_context = "\n\n".join(code_blocks) if code_blocks else "No source code available."

        prompt = f"""
        You are the Architect Agent for RepoMind AI.
        Analyze the repository structure and real source code below to explain the system architecture.

        Repository Overview:
        - Primary Language: {repo_struct.get('primary_language', 'Unknown')}
        - Total Files: {repo_struct.get('total_files', 0)}
        - Top Central Modules: {', '.join(top_modules[:5])}

        Source Code Context:
        {source_context}

        Return a JSON object matching this exact schema:
        {{
            "summary": "Detailed narrative describing overall system architecture and design principles",
            "patterns": ["Clean Architecture", "Modular Strategy"],
            "anti_patterns": ["Potential circular dependency in module X"],
            "reasoning": "Explanation of structural signals observed in source code and dependency graph",
            "confidence": 0.90,
            "evidence": "Quote an actual line range and exact code snippet directly from the provided source code above (e.g. Lines 15-30 in app/main.py). Do not invent line ranges.",
            "referenced_files": {json.dumps(top_modules[:3])}
        }}
        """

        system_instruction = "You are a Senior Software Architect. Output valid JSON only."

        try:
            res = await self.provider_router.generate(
                prompt=prompt,
                system_instruction=system_instruction,
                json_output=True,
                run_id=run_id,
                agent_name=self.name,
            )
            parsed = json.loads(res.content)
            parsed["graph"] = kg_data
            log_agent_event("complete", self.name, run_id, "Architecture analysis complete.")
            agent_status_map = {self.name: "completed"}
            if target_skipped:
                agent_status_map["skipped_files"] = target_skipped
            return {
                "architect_summary": parsed,
                "agent_statuses": agent_status_map,
            }
        except Exception as e:
            logger.warning(f"[{self.name}] Provider call failed. Applying degraded fallback: {str(e)}")
            log_agent_event("degraded", self.name, run_id, f"Degraded fallback: {str(e)}")
            fallback = {
                "summary": f"System architecture for {repo_struct.get('primary_language', 'Unknown')} project containing {repo_struct.get('total_files', 0)} files.",
                "patterns": ["Clean Architecture"],
                "anti_patterns": [],
                "reasoning": "Fallback summary generated from static analysis.",
                "confidence": 0.70,
                "evidence": "Static repository walk",
                "referenced_files": top_modules[:3],
                "graph": kg_data,
            }
            agent_status_map = {self.name: "degraded"}
            if target_skipped:
                agent_status_map["skipped_files"] = target_skipped
            return {
                "architect_summary": fallback,
                "agent_statuses": agent_status_map,
            }
