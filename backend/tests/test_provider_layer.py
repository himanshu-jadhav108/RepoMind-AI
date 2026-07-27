import asyncio
import pytest
from app.core.exceptions import ProviderException, ProviderTimeoutException
from app.providers.gemini_provider import GeminiProvider
from app.providers.groq_provider import GroqProvider
from app.providers.huggingface_provider import HuggingFaceProvider
from app.providers.openai_provider import OpenAIProvider
from app.providers.openrouter_provider import OpenRouterProvider
from app.providers.provider_interface import ProviderInterface, ProviderResponse
from app.providers.provider_router import ProviderRouter


class MockWorkingProvider(ProviderInterface):
    def __init__(self, name_str: str) -> None:
        self._name = name_str

    @property
    def name(self) -> str:
        return self._name

    def is_available(self) -> bool:
        return True

    async def generate(self, prompt: str, **kwargs) -> ProviderResponse:
        return ProviderResponse(
            content=f'{{"result": "mock_response_from_{self.name}"}}',
            provider_name=self.name,
            model_name="mock_model",
            tokens_used=42,
            latency_ms=10.0,
        )

    async def stream(self, prompt: str, **kwargs):
        yield f"mock_stream_{self.name}"


class MockFailingProvider(ProviderInterface):
    def __init__(self, name_str: str) -> None:
        self._name = name_str

    @property
    def name(self) -> str:
        return self._name

    def is_available(self) -> bool:
        return True

    async def generate(self, prompt: str, **kwargs) -> ProviderResponse:
        raise ProviderException(f"Simulated failure in {self.name}")

    async def stream(self, prompt: str, **kwargs):
        raise ProviderException(f"Simulated failure in {self.name}")


class MockSlowProvider(ProviderInterface):
    def __init__(self, name_str: str) -> None:
        self._name = name_str

    @property
    def name(self) -> str:
        return self._name

    def is_available(self) -> bool:
        return True

    async def generate(self, prompt: str, **kwargs) -> ProviderResponse:
        await asyncio.sleep(2.0)
        return ProviderResponse(
            content="slow_response",
            provider_name=self.name,
            model_name="slow_model",
        )

    async def stream(self, prompt: str, **kwargs):
        yield "slow"


def test_provider_names_and_contracts():
    p_gemini = GeminiProvider(api_key="mock_key")
    p_groq = GroqProvider(api_key="mock_key")
    p_openai = OpenAIProvider(api_key="mock_key")
    p_openrouter = OpenRouterProvider(api_key="mock_key")
    p_hf = HuggingFaceProvider(api_key="mock_key")

    assert p_gemini.name == "gemini"
    assert p_groq.name == "groq"
    assert p_openai.name == "openai"
    assert p_openrouter.name == "openrouter"
    assert p_hf.name == "huggingface"

    assert p_gemini.is_available() is True
    assert p_groq.is_available() is True


@pytest.mark.asyncio
async def test_provider_router_failover():
    router = ProviderRouter(max_retries_per_provider=1)
    failing_p = MockFailingProvider("failing_primary")
    working_p = MockWorkingProvider("working_secondary")

    router.register_provider(failing_p)
    router.register_provider(working_p)
    router.set_priority_order(["failing_primary", "working_secondary"])

    res = await router.generate("Test prompt")
    assert res.provider_name == "working_secondary"
    assert "working_secondary" in res.content


@pytest.mark.asyncio
async def test_provider_router_timeout():
    router = ProviderRouter(max_retries_per_provider=1)
    slow_p = MockSlowProvider("slow_primary")
    working_p = MockWorkingProvider("working_backup")

    router.register_provider(slow_p)
    router.register_provider(working_p)
    router.set_priority_order(["slow_primary", "working_backup"])

    # Call with 0.1s timeout to trigger timeout failover
    res = await router.generate("Test prompt", timeout_sec=0.1)
    assert res.provider_name == "working_backup"


@pytest.mark.asyncio
async def test_all_providers_failing_raises_exception():
    router = ProviderRouter(max_retries_per_provider=1)
    failing_1 = MockFailingProvider("fail_1")
    failing_2 = MockFailingProvider("fail_2")

    router.register_provider(failing_1)
    router.register_provider(failing_2)

    with pytest.raises(ProviderException) as exc_info:
        await router.generate("Test prompt")
    assert "All AI providers failed" in str(exc_info.value)
