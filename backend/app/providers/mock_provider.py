import json
from typing import Any, AsyncGenerator, Dict, List, Optional

from app.providers.provider_interface import ProviderInterface, ProviderResponse


class MockProvider(ProviderInterface):
    """
    Mock AI Provider implementation for unit testing agent workflows and prompt generation.
    Returns deterministic JSON responses matching agent schemas and tracks prompt history.
    """

    def __init__(self, canned_responses: Optional[Dict[str, Any]] = None) -> None:
        self.canned_responses = canned_responses or {}
        self.last_prompt: str = ""
        self.last_system_instruction: Optional[str] = None
        self.prompt_history: List[str] = []

    @property
    def name(self) -> str:
        return "mock_provider"

    def is_available(self) -> bool:
        return True

    async def generate(
        self,
        prompt: str,
        system_instruction: Optional[str] = None,
        json_output: bool = True,
        temperature: float = 0.2,
        max_tokens: Optional[int] = None,
    ) -> ProviderResponse:
        self.last_prompt = prompt
        self.last_system_instruction = system_instruction
        self.prompt_history.append(prompt)

        p_lower = prompt.lower()
        s_lower = (system_instruction or "").lower()

        # Select canned response based on prompt context
        if "reviewer" in p_lower or "reviewer" in s_lower or "reviewer" in (system_instruction or "").lower():
            resp_dict = {
                "verdict": "approved",
                "review_status": "approved",
                "feedback": "All agent findings verified against AST static call graph.",
                "confidence": 0.96,
                "reviewed_findings": [
                    {
                        "id": "b1",
                        "category": "bug",
                        "severity": "medium",
                        "file": "app/main.py",
                        "line_start": 10,
                        "line_end": 20,
                        "description": "Unhandled exception in endpoint handler",
                        "suggested_fix": "Add try-except block",
                        "reasoning": "AST analysis detected missing exception handling",
                        "confidence": 0.85,
                        "evidence": "def handle(): pass",
                        "referenced_files": ["app/main.py"],
                        "review_status": "approved",
                    }
                ],
            }
        elif "architect" in p_lower or "architect" in s_lower:
            resp_dict = {
                "summary": "Clean Architecture modular decomposition with decoupled services.",
                "patterns": ["Clean Architecture", "Repository Pattern"],
                "anti_patterns": [],
                "reasoning": "Verified clean boundary separation across controllers and data layer.",
                "confidence": 0.95,
                "evidence": "Lines 1-25 in app/main.py",
                "referenced_files": ["app/main.py"],
            }
        elif "bug hunter" in p_lower or "bug" in s_lower:
            resp_dict = {
                "findings": [
                    {
                        "id": "bug-mock-1",
                        "category": "bug",
                        "severity": "medium",
                        "file": "app/main.py",
                        "line_start": 10,
                        "line_end": 20,
                        "description": "Potential unhandled exception in endpoint handler.",
                        "suggested_fix": "Wrap route handler call in try-except block.",
                        "reasoning": "Source code analysis identified unhandled exception path.",
                        "confidence": 0.88,
                        "evidence": "def handle_request(): raise Exception()",
                        "referenced_files": ["app/main.py"],
                    }
                ]
            }
        elif "security" in p_lower or "security" in s_lower:
            resp_dict = {
                "findings": [
                    {
                        "id": "sec-mock-1",
                        "category": "security",
                        "severity": "high",
                        "file": "app/main.py",
                        "line_start": 5,
                        "line_end": 15,
                        "description": "Wildcard CORS origin configured on production route.",
                        "suggested_fix": "Restrict CORS allowed origins to trusted domains.",
                        "reasoning": "OWASP Top 10 A05:2021 Security Misconfiguration.",
                        "confidence": 0.94,
                        "evidence": "allow_origins=['*']",
                        "referenced_files": ["app/main.py"],
                    }
                ]
            }
        elif "performance" in p_lower or "performance" in s_lower:
            resp_dict = {
                "findings": [
                    {
                        "id": "perf-mock-1",
                        "category": "performance",
                        "severity": "medium",
                        "file": "app/main.py",
                        "line_start": 15,
                        "line_end": 25,
                        "description": "Synchronous file reading on main event loop thread.",
                        "suggested_fix": "Use asyncio or run_in_executor for disk I/O.",
                        "reasoning": "Blocking main event loop degrades server throughput.",
                        "confidence": 0.90,
                        "evidence": "open(file).read()",
                        "referenced_files": ["app/main.py"],
                    }
                ]
            }
        elif "documentation" in p_lower or "docstring" in s_lower:
            resp_dict = {
                "summary": "Verified OpenAPI routes and docstrings.",
                "markdown": "# Module Documentation\n- `app/main.py`: Entrypoint",
                "coverage": 0.85,
                "missing_docs": [],
            }
        elif "reviewer" in p_lower or "review" in s_lower:
            resp_dict = {
                "verdict": "approved",
                "review_status": "approved",
                "feedback": "All agent findings verified against AST static call graph.",
                "confidence": 0.96,
                "reviewed_findings": [
                    {
                        "id": "b1",
                        "category": "bug",
                        "severity": "medium",
                        "file": "app/main.py",
                        "line_start": 10,
                        "line_end": 20,
                        "description": "Unhandled exception in endpoint handler",
                        "suggested_fix": "Add try-except block",
                        "reasoning": "AST analysis detected missing exception handling",
                        "confidence": 0.85,
                        "evidence": "def handle(): pass",
                        "referenced_files": ["app/main.py"],
                        "review_status": "approved",
                    }
                ],
            }
        else:
            resp_dict = {
                "status": "completed",
                "message": "Mock completion response generated.",
                "explanation": "Mock plain-language explanation.",
                "related_concepts": ["Clean Architecture", "LangGraph"],
                "suggestions": ["Add rate limiting", "Add unit tests"],
            }

        return ProviderResponse(
            content=json.dumps(resp_dict),
            raw_response=resp_dict,
            provider_name=self.name,
            model_name="mock-v1",
            tokens_used=150,
            latency_ms=10.0,
        )

    async def stream(
        self,
        prompt: str,
        system_instruction: Optional[str] = None,
        temperature: float = 0.2,
    ) -> AsyncGenerator[str, None]:
        yield "Mock token stream"
