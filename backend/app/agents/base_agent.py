from abc import ABC, abstractmethod
from typing import Any, Dict, Optional
from app.orchestration.state import AnalysisState
from app.providers.provider_router import ProviderRouter


class BaseAgent(ABC):
    """
    Abstract base class for all RepoMind AI Agents per AGENTS.md.
    Enforces that every agent depends on ProviderRouter and never directly calls an LLM SDK.
    """

    def __init__(self, provider_router: ProviderRouter) -> None:
        self.provider_router = provider_router

    @property
    @abstractmethod
    def name(self) -> str:
        """Unique identifier name for the agent (e.g. 'architect_agent')"""
        pass

    @abstractmethod
    async def run(self, state: AnalysisState) -> Dict[str, Any]:
        """
        Executes the agent's task consuming shared AnalysisState and returning a state update dict.
        """
        pass
