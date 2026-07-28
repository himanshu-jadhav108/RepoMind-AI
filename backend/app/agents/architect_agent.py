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

        prompt = f"""
        You are the Architect Agent for RepoMind AI.
        Analyze the repository structure below and explain the system architecture.

        Repository Overview:
        - Primary Language: {repo_struct.get('primary_language', 'Unknown')}
        - Total Files: {repo_struct.get('total_files', 0)}
        - Top Central Modules: {', '.join(top_modules[:5])}

        Return a JSON object matching this exact schema:
        {{
            "summary": "Detailed narrative describing overall system architecture and design principles",
            "patterns": ["Clean Architecture", "Modular Strategy"],
            "anti_patterns": ["Potential circular dependency in module X"],
            "reasoning": "Explanation of structural signals observed in dependency graph",
            "confidence": 0.90,
            "evidence": "NetworkX graph centrality metrics",
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
            return {
                "architect_summary": parsed,
                "agent_statuses": {self.name: "completed"},
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
            return {
                "architect_summary": fallback,
                "agent_statuses": {self.name: "degraded"},
            }
