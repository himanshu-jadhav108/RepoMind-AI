import json
from typing import Any, Dict, List
from app.agents.base_agent import BaseAgent
from app.core.logging import logger, log_agent_event
from app.orchestration.state import AnalysisState


class FeatureSuggestionAgent(BaseAgent):
    """
    Feature Suggestion Agent: Proposes strategic new features aligned with project goals per AGENTS.md.
    """

    @property
    def name(self) -> str:
        return "feature_suggestion_agent"

    async def run(self, state: AnalysisState) -> Dict[str, Any]:
        run_id = state.get("run_id", "run")
        log_agent_event("start", self.name, run_id, "Generating strategic feature suggestions")

        repo_struct = state.get("repo_structure", {})
        arch_summary = state.get("architect_summary", {}).get("summary", "")

        prompt = f"""
        You are the Feature Suggestion Agent for RepoMind AI.
        Propose strategic feature improvements for the project based on its purpose and architecture.

        Architecture Context: {arch_summary}
        Primary Language: {repo_struct.get('primary_language', 'Unknown')}

        Return a JSON object:
        {{
            "suggestions": [
                {{
                    "title": "Feature Title",
                    "description": "Clear rationale explaining how this extends existing architecture",
                    "impact": "high",
                    "effort": "medium"
                }}
            ]
        }}
        """

        system_instruction = "You are a Technical Product Manager. Output valid JSON only."

        try:
            res = await self.provider_router.generate(
                prompt=prompt,
                system_instruction=system_instruction,
                json_output=True,
                run_id=run_id,
                agent_name=self.name,
            )
            parsed = json.loads(res.content)
            suggestions = parsed.get("suggestions", [])
            log_agent_event("complete", self.name, run_id, f"Generated {len(suggestions)} feature suggestions.")
            return {
                "feature_suggestions": suggestions,
                "agent_statuses": {self.name: "completed"},
            }
        except Exception as e:
            logger.warning(f"[{self.name}] Provider call failed. Applying fallback: {str(e)}")
            return {
                "feature_suggestions": [],
                "agent_statuses": {self.name: "degraded"},
            }
