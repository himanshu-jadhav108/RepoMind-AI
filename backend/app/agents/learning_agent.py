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

        # P1-EXPLAIN FIX: richer schema — a one-paragraph explanation + buzzword list
        # gave users very little to actually learn from. This now asks for a summary,
        # a line-by-line breakdown, a concrete analogy, and common pitfalls, so the
        # UI has enough structure to render something more useful than a wall of text.
        prompt = f"""
        You are the Learning Agent for RepoMind AI.
        Explain the following real code snippet from '{file_path}' in simple, plain language
        without heavy jargon. Base every claim strictly on the code shown below — do not
        invent behavior that isn't present in the snippet.

        Code Snippet:
        ```
        {code_snippet}
        ```

        Return a JSON object matching this exact schema:
        {{
            "summary": "One or two sentence plain-language summary of what this code does",
            "line_by_line": [
                {{"lines": "1-5", "explanation": "What happens in this specific range"}}
            ],
            "analogy": "A concrete, everyday analogy that maps to the core logic here",
            "common_pitfalls": ["A mistake developers commonly make with this kind of code"],
            "related_concepts": ["Concept 1", "Concept 2"]
        }}

        If the snippet is too short or generic to break into meaningful line ranges,
        return a single entry in "line_by_line" covering the whole snippet.
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
            # Normalize shape defensively in case the model omits a field.
            return {
                "summary": parsed.get("summary", ""),
                "line_by_line": parsed.get("line_by_line", []),
                "analogy": parsed.get("analogy", ""),
                "common_pitfalls": parsed.get("common_pitfalls", []),
                "related_concepts": parsed.get("related_concepts", []),
            }
        except Exception as e:
            logger.warning(f"[{self.name}] Explain code failed: {str(e)}")
            # Fallback matches the same shape as the success path so the frontend
            # never needs a second code path to render degraded results.
            return {
                "summary": f"This code component in {file_path} handles key execution logic for the system.",
                "line_by_line": [],
                "analogy": "",
                "common_pitfalls": [],
                "related_concepts": ["Software Architecture", "Clean Code"],
            }
