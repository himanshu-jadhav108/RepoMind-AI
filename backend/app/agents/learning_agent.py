import json
from typing import Any, Dict

from app.agents.base_agent import BaseAgent
from app.core.logging import log_agent_event, logger
from app.orchestration.state import AnalysisState


class LearningAgent(BaseAgent):
    """
    Learning Agent: Produces plain-language, jargon-free explanations of complex code for learning per AGENTS.md.
    Invoked on-demand interactively.
    """

    @property
    def name(self) -> str:
        return "learning_agent"

    async def run(self, state: AnalysisState) -> Dict[str, Any]:
        return {"agent_statuses": {self.name: "completed"}}

    async def explain_code(self, file_path: str, code_snippet: str, run_id: str = "interactive") -> Dict[str, Any]:
        log_agent_event("start", self.name, run_id, f"Generating plain-language explanation for '{file_path}'")

        prompt = f"""
        You are the Learning Agent for RepoMind AI.
        Explain the following code snippet from '{file_path}' in simple, plain language without heavy jargon.

        Code Snippet:
        ```
        {code_snippet}
        ```

        Return a JSON object:
        {{
            "explanation": "Simple step-by-step plain language walkthrough of what this code does and why it's structured this way",
            "related_concepts": ["Concept 1", "Concept 2"]
        }}
        """

        system_instruction = "You are a friendly Coding Mentor. Prefer analogies and clear explanations. Output valid JSON."

        try:
            res = await self.provider_router.generate(
                prompt=prompt,
                system_instruction=system_instruction,
                json_output=True,
                run_id=run_id,
                agent_name=self.name,
            )
            parsed = json.loads(res.content)
            return parsed
        except Exception as e:
            logger.warning(f"[{self.name}] Explain code failed: {str(e)}")
            return {
                "explanation": f"This code component in {file_path} handles key execution logic for the system.",
                "related_concepts": ["Software Architecture", "Clean Code"],
            }
