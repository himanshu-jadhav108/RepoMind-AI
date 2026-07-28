from abc import ABC, abstractmethod
from typing import Any, AsyncGenerator, Optional

from pydantic import BaseModel


class ProviderResponse(BaseModel):
    content: str
    raw_response: Optional[Any] = None
    provider_name: str
    model_name: str
    tokens_used: int = 0
    latency_ms: float = 0.0


class ProviderInterface(ABC):
    """
    Abstract interface for all AI Providers (Gemini, Groq, OpenAI, Hugging Face, OpenRouter).
    Strictly enforced: Business logic and agents MUST NOT call external provider SDKs directly.
    """

    @property
    @abstractmethod
    def name(self) -> str:
        """Returns the identifier name of the provider adapter"""
        pass

    @abstractmethod
    async def generate(
        self,
        prompt: str,
        system_instruction: Optional[str] = None,
        json_output: bool = True,
        temperature: float = 0.2,
        max_tokens: Optional[int] = None,
    ) -> ProviderResponse:
        """
        Generates a response from the provider given prompt options.
        """
        pass

    @abstractmethod
    async def stream(
        self,
        prompt: str,
        system_instruction: Optional[str] = None,
        temperature: float = 0.2,
    ) -> AsyncGenerator[str, None]:
        """
        Streams response tokens as an async generator.
        """
        pass

    @abstractmethod
    def is_available(self) -> bool:
        """
        Checks whether credentials/API keys are configured and available.
        """
        pass
