import json
from typing import Any, Dict
from app.agents.base_agent import BaseAgent
from app.core.logging import logger, log_agent_event
from app.orchestration.state import AnalysisState


class DocumentationAgent(BaseAgent):
    """
    Documentation Agent: Generates project README overview and module docs per AGENTS.md.
    """

    @property
    def name(self) -> str:
        return "documentation_agent"

    async def run(self, state: AnalysisState) -> Dict[str, Any]:
        run_id = state.get("run_id", "run")
        log_agent_event("start", self.name, run_id, "Generating project documentation and README overview")

        repo_struct = state.get("repo_structure", {})
        arch_summary = state.get("architect_summary", {}).get("summary", "")

        prompt = f"""
        You are the Documentation Agent for RepoMind AI.
        Generate comprehensive documentation for the repository below.

        Architecture Context: {arch_summary}
        Primary Language: {repo_struct.get('primary_language', 'Unknown')}
        Total Files: {repo_struct.get('total_files', 0)}

        Return a JSON object matching this exact schema:
        {{
            "overview_markdown": "# Project Overview\\n\\nDetailed overview of the repository...",
            "module_docs_markdown": "## Module Breakdown\\n\\nDocumentation per module...",
            "coverage_pct": 95.0,
            "reasoning": "Inferred module purposes from AST symbol definitions and file structure",
            "confidence": 0.88,
            "evidence": "AST symbol definitions across modules",
            "referenced_files": {json.dumps(repo_struct.get('top_central_modules', [])[:3])}
        }}
        """

        system_instruction = "You are a Technical Writer. Output valid JSON only."

        try:
            res = await self.provider_router.generate(
                prompt=prompt,
                system_instruction=system_instruction,
                json_output=True,
                run_id=run_id,
                agent_name=self.name,
            )
            parsed = json.loads(res.content)
            full_markdown = f"{parsed.get('overview_markdown', '')}\n\n{parsed.get('module_docs_markdown', '')}"
            parsed["markdown"] = full_markdown
            log_agent_event("complete", self.name, run_id, "Documentation generated successfully.")
            return {
                "documentation_markdown": parsed,
                "agent_statuses": {self.name: "completed"},
            }
        except Exception as e:
            logger.warning(f"[{self.name}] Provider call failed. Applying fallback: {str(e)}")
            fallback_md = f"# Project Overview\n\nAuto-generated documentation for {repo_struct.get('primary_language', 'project')}.\n"
            return {
                "documentation_markdown": {
                    "markdown": fallback_md,
                    "coverage_pct": 50.0,
                    "reasoning": "Fallback summary due to provider outage",
                    "confidence": 0.60,
                    "evidence": "Static file tree",
                    "referenced_files": repo_struct.get("top_central_modules", [])[:3],
                },
                "agent_statuses": {self.name: "degraded"},
            }
