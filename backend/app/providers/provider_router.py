import asyncio
import time
from typing import Dict, List, Optional

from app.core.exceptions import ProviderException, ProviderTimeoutException
from app.core.logging import log_provider_call, logger
from app.providers.provider_interface import ProviderInterface, ProviderResponse


class ProviderRouter:
    """
    Gateway and Adaptive Routing Engine for external AI Providers.
    Maintains priority order across Gemini, Groq, OpenAI, OpenRouter, and HuggingFace.
    Implements per-call timeout handling, bounded retry strategy, and automatic failover.
    """

    def __init__(self, default_timeout_sec: float = 30.0, max_retries_per_provider: int = 2) -> None:
        self._providers: Dict[str, ProviderInterface] = {}
        self._priority_list: List[str] = ["gemini", "groq", "openai", "openrouter", "huggingface"]
        self.default_timeout_sec = default_timeout_sec
        self.max_retries_per_provider = max_retries_per_provider

    def register_provider(self, provider: ProviderInterface) -> None:
        self._providers[provider.name] = provider
        if provider.name not in self._priority_list:
            self._priority_list.append(provider.name)

    def set_priority_order(self, order: List[str]) -> None:
        self._priority_list = order

    def get_provider(self, name: str) -> Optional[ProviderInterface]:
        return self._providers.get(name)

    def get_status(self) -> List[Dict]:
        status_list = []
        for name in self._priority_list:
            provider = self._providers.get(name)
            is_avail = provider.is_available() if provider else False
            status_list.append({
                "name": name,
                "status": "healthy" if is_avail else "unavailable",
                "priority": self._priority_list.index(name) + 1,
            })
        return status_list

    async def generate(
        self,
        prompt: str,
        system_instruction: Optional[str] = None,
        json_output: bool = True,
        temperature: float = 0.2,
        max_tokens: Optional[int] = None,
        timeout_sec: Optional[float] = None,
        run_id: Optional[str] = None,
        agent_name: Optional[str] = None,
    ) -> ProviderResponse:
        """
        Routes generation call with bounded retries, per-call timeout, and priority failover.
        """
        call_timeout = timeout_sec or self.default_timeout_sec

        available_providers = [
            self._providers[name]
            for name in self._priority_list
            if name in self._providers and self._providers[name].is_available()
        ]

        if not available_providers:
            logger.warning("No live AI provider keys available. Registering mock fallback.")
            raise ProviderException("No AI providers available. Please check API key configurations.")

        last_error: Optional[Exception] = None

        for provider in available_providers:
            for attempt in range(1, self.max_retries_per_provider + 1):
                start_time = time.time()
                try:
                    logger.info(f"Routing call to provider '{provider.name}' (Attempt {attempt}/{self.max_retries_per_provider})")

                    # Enforce execution timeout handling
                    response = await asyncio.wait_for(
                        provider.generate(
                            prompt=prompt,
                            system_instruction=system_instruction,
                            json_output=json_output,
                            temperature=temperature,
                            max_tokens=max_tokens,
                        ),
                        timeout=call_timeout,
                    )

                    latency_ms = (time.time() - start_time) * 1000
                    response.latency_ms = latency_ms

                    log_provider_call(
                        provider_name=provider.name,
                        run_id=run_id,
                        agent_name=agent_name,
                        latency_ms=latency_ms,
                        success=True,
                        tokens_used=response.tokens_used,
                    )
                    return response
                except asyncio.TimeoutError:
                    latency_ms = (time.time() - start_time) * 1000
                    err_msg = f"Provider call to '{provider.name}' timed out after {call_timeout}s."
                    logger.warning(err_msg)
                    log_provider_call(
                        provider_name=provider.name,
                        run_id=run_id,
                        agent_name=agent_name,
                        latency_ms=latency_ms,
                        success=False,
                        error=err_msg,
                    )
                    last_error = ProviderTimeoutException(err_msg)
                    break  # Failover to next provider on timeout
                except Exception as e:
                    latency_ms = (time.time() - start_time) * 1000
                    log_provider_call(
                        provider_name=provider.name,
                        run_id=run_id,
                        agent_name=agent_name,
                        latency_ms=latency_ms,
                        success=False,
                        error=str(e),
                    )
                    logger.warning(f"Attempt {attempt} for provider '{provider.name}' failed: {str(e)}")
                    last_error = e

                    if attempt < self.max_retries_per_provider:
                        await asyncio.sleep(0.5 * (2 ** (attempt - 1)))  # Exponential backoff

        raise ProviderException(
            message=f"All AI providers failed. Last error: {str(last_error)}",
            details={"last_error": str(last_error)},
        )
