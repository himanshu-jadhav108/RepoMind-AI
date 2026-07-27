import time
from typing import Dict, List, Optional
from app.core.exceptions import ProviderException
from app.core.logging import logger, log_provider_call
from app.providers.provider_interface import ProviderInterface, ProviderResponse


class ProviderRouter:
    """
    Gateway and Failover Router for external AI Providers.
    Selects active provider based on priority order and automatically fails over on errors.
    """

    def __init__(self) -> None:
        self._providers: Dict[str, ProviderInterface] = {}
        self._priority_list: List[str] = []

    def register_provider(self, provider: ProviderInterface, priority: int = 100) -> None:
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
            status_list.append({
                "name": name,
                "status": "healthy" if (provider and provider.is_available()) else "unavailable",
                "priority": self._priority_list.index(name) + 1
            })
        return status_list

    async def generate(
        self,
        prompt: str,
        system_instruction: Optional[str] = None,
        json_output: bool = True,
        temperature: float = 0.2,
        max_tokens: Optional[int] = None,
        run_id: Optional[str] = None,
        agent_name: Optional[str] = None,
    ) -> ProviderResponse:
        """
        Attempts to generate response by iterating through providers in priority order.
        Fails over automatically to the next available provider on exception.
        """
        available_providers = [
            self._providers[name]
            for name in self._priority_list
            if name in self._providers and self._providers[name].is_available()
        ]

        if not available_providers:
            # Fallback when no live external provider keys are configured
            logger.warning("No live AI provider keys available. Operating in degraded fallback mode.")
            raise ProviderException("No AI providers available. Check API key configurations.")

        last_error: Optional[Exception] = None

        for provider in available_providers:
            start_time = time.time()
            try:
                logger.info(f"Routing AI call to provider: {provider.name}")
                response = await provider.generate(
                    prompt=prompt,
                    system_instruction=system_instruction,
                    json_output=json_output,
                    temperature=temperature,
                    max_tokens=max_tokens,
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
                logger.warning(f"Provider {provider.name} failed: {str(e)}. Attempting failover...")
                last_error = e

        raise ProviderException(
            message=f"All AI providers failed. Last error: {str(last_error)}",
            details={"last_error": str(last_error)},
        )
