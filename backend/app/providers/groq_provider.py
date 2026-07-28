import time
from typing import AsyncGenerator, Optional
import httpx
from app.core.config import settings
from app.core.exceptions import ProviderException, ProviderTimeoutException
from app.providers.provider_interface import ProviderInterface, ProviderResponse


class GroqProvider(ProviderInterface):
    """
    Groq AI Provider Adapter (LLaMA-3.3-70B) using 100% free Groq Cloud API.
    """

    def __init__(self, api_key: Optional[str] = None, model_name: str = "llama-3.3-70b-versatile") -> None:
        self.api_key = api_key or settings.GROQ_API_KEY
        self.model_name = model_name

    @property
    def name(self) -> str:
        return "groq"

    def is_available(self) -> bool:
        return bool(self.api_key and "your-groq" not in self.api_key)

    async def generate(
        self,
        prompt: str,
        system_instruction: Optional[str] = None,
        json_output: bool = True,
        temperature: float = 0.2,
        max_tokens: Optional[int] = None,
    ) -> ProviderResponse:
        if not self.is_available():
            raise ProviderException("Groq API key is not configured.")

        url = "https://api.groq.com/openai/v1/chat/completions"
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }

        messages = []
        if system_instruction:
            messages.append({"role": "system", "content": system_instruction})
        messages.append({"role": "user", "content": prompt})

        payload = {
            "model": self.model_name,
            "messages": messages,
            "temperature": temperature,
        }
        if json_output:
            payload["response_format"] = {"type": "json_object"}
        if max_tokens:
            payload["max_tokens"] = max_tokens

        start_time = time.time()

        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post(url, headers=headers, json=payload)
                response.raise_for_status()
                data = response.json()

            latency_ms = (time.time() - start_time) * 1000
            choices = data.get("choices", [])
            if not choices:
                raise ProviderException("Groq returned empty chat completion choices.")

            content = choices[0].get("message", {}).get("content", "")
            usage = data.get("usage", {})
            tokens_used = usage.get("total_tokens", 0)

            return ProviderResponse(
                content=content,
                raw_response=data,
                provider_name=self.name,
                model_name=self.model_name,
                tokens_used=tokens_used,
                latency_ms=latency_ms,
            )
        except httpx.TimeoutException as e:
            raise ProviderTimeoutException(f"Groq API call timed out: {str(e)}")
        except Exception as e:
            raise ProviderException(f"Groq API call failed: {str(e)}")

    async def stream(
        self,
        prompt: str,
        system_instruction: Optional[str] = None,
        temperature: float = 0.2,
    ) -> AsyncGenerator[str, None]:
        res = await self.generate(prompt, system_instruction, json_output=False, temperature=temperature)
        yield res.content
