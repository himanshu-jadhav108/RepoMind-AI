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
        Explain the code snippet from '{file_path}' in clear, jargon-free plain language.

        Code Snippet:
        ```python
        {code_snippet}
        ```

        Return a JSON object matching this exact schema:
        {{
            "summary": "A concise one-sentence high-level overview of what this file does",
            "line_by_line": [
                {{"lines": "1-15", "explanation": "Imports dependencies and initializes core service layer."}}
            ],
            "analogy": "A simple, intuitive real-world analogy describing the core logic",
            "common_pitfalls": ["Common bug or pitfall developers might make when editing this file"],
            "related_concepts": ["Clean Architecture", "Dependency Injection"]
        }}
        """

        system_instruction = "You are a friendly Senior Software Architect and Coding Mentor. Output valid JSON only."

        try:
            res = await self.provider_router.generate(
                prompt=prompt,
                system_instruction=system_instruction,
                json_output=True,
                run_id=run_id,
                agent_name=self.name,
            )
            parsed = json.loads(res.content)
            # Guarantee schema fields exist
            if "summary" not in parsed:
                parsed["summary"] = f"Core module {file_path} handles key execution logic for the repository."
            if "line_by_line" not in parsed or not isinstance(parsed["line_by_line"], list):
                parsed["line_by_line"] = []
            if "analogy" not in parsed:
                parsed["analogy"] = "Functions like a central dispatcher routing requests to domain handlers."
            if "common_pitfalls" not in parsed or not isinstance(parsed["common_pitfalls"], list):
                parsed["common_pitfalls"] = []
            if "related_concepts" not in parsed or not isinstance(parsed["related_concepts"], list):
                parsed["related_concepts"] = ["Software Architecture", "Modular Design"]
            return parsed
        except Exception as e:
            logger.warning(f"[{self.name}] Explain code failed: {str(e)}")
            return {
                "summary": f"Module '{file_path}' handles core structural logic for the application.",
                "line_by_line": [],
                "analogy": "Acts as an orchestration node connecting component layers.",
                "common_pitfalls": [],
                "related_concepts": ["Clean Architecture", "Modular Design"],
            }
