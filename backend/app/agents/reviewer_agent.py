import json
from typing import Any, Dict, List
from app.agents.base_agent import BaseAgent
from app.core.logging import logger, log_agent_event
from app.orchestration.state import AnalysisState


class ReviewerAgent(BaseAgent):
    """
    Reviewer Agent: Implements the formal Reviewer Agent Loop (Review -> Feedback -> Rewrite -> Validate -> Approve)
    over agent findings and outputs to catch false positives and calibrate confidence scores per AGENTS.md.
    """

    @property
    def name(self) -> str:
        return "reviewer_agent"

    async def run(self, state: AnalysisState) -> Dict[str, Any]:
        run_id = state.get("run_id", "run")
        log_agent_event("start", self.name, run_id, "Executing Reviewer Agent Loop over findings and outputs")

        raw_findings = (
            (state.get("bug_findings") or [])
            + (state.get("security_findings") or [])
            + (state.get("performance_findings") or [])
        )

        if not raw_findings:
            log_agent_event("complete", self.name, run_id, "No findings to review.")
            return {
                "reviewed_findings": [],
                "agent_statuses": {self.name: "completed"},
            }

        prompt = f"""
        You are the Reviewer Agent for RepoMind AI.
        Audit the raw agent findings below against their evidence and code context.

        Raw Findings: {json.dumps(raw_findings)}

        Evaluate each finding against these rules:
        1. Does evidence actually support the claim?
        2. Is confidence score well-calibrated (≥ 0.70)?
        3. If below 0.70, attempt to rewrite description and fix to meet approval threshold.

        Return a JSON object containing the reviewed findings list:
        {{
            "reviewed_findings": [
                {{
                    "id": "finding-id",
                    "category": "bug|security|performance|architecture",
                    "severity": "low|medium|high|critical",
                    "file": "path",
                    "line_start": 0,
                    "line_end": 0,
                    "description": "Reviewed description",
                    "suggested_fix": "Reviewed fix",
                    "reasoning": "Reviewed reasoning",
                    "confidence": 0.85,
                    "evidence": "Evidence signal",
                    "referenced_files": ["path"],
                    "review_status": "approved"
                }}
            ]
        }}
        """

        system_instruction = "You are a Senior Reviewer Quality Gate Auditor. Output valid JSON only."

        try:
            res = await self.provider_router.generate(
                prompt=prompt,
                system_instruction=system_instruction,
                json_output=True,
                run_id=run_id,
                agent_name=self.name,
            )
            parsed = json.loads(res.content)
            reviewed = parsed.get("reviewed_findings", [])
            log_agent_event("complete", self.name, run_id, f"Reviewer Agent Loop approved {len(reviewed)} items.")
            return {
                "reviewed_findings": reviewed,
                "agent_statuses": {self.name: "completed"},
            }
        except Exception as e:
            logger.warning(f"[{self.name}] Provider call failed. Applying default threshold pass: {str(e)}")
            # Fallback review evaluation: evaluate confidence threshold
            fallback_reviewed = []
            for f in raw_findings:
                f_copy = dict(f)
                if f_copy.get("confidence", 0.0) >= 0.70:
                    f_copy["review_status"] = "approved"
                else:
                    f_copy["review_status"] = "flagged_low_confidence"
                fallback_reviewed.append(f_copy)

            return {
                "reviewed_findings": fallback_reviewed,
                "agent_statuses": {self.name: "degraded"},
            }
