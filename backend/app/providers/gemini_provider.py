import asyncio
import json
import time
from typing import AsyncGenerator, Optional
import httpx
from app.core.config import settings
from app.core.exceptions import ProviderException, ProviderTimeoutException
from app.core.logging import logger
from app.providers.provider_interface import ProviderInterface, ProviderResponse


class GeminiProvider(ProviderInterface):
    """
    Google Gemini AI Provider Adapter using direct HTTP REST API.
    """

    def __init__(self, api_key: Optional[str] = None, model_name: str = "gemini-1.5-flash") -> None:
        self.api_key = api_key or settings.GEMINI_API_KEY
        self.model_name = model_name

    @property
    def name(self) -> str:
        return "gemini"

    def is_available(self) -> bool:
        return bool(self.api_key and "your-gemini" not in self.api_key)

    async def generate(
        self,
        prompt: str,
        system_instruction: Optional[str] = None,
        json_output: bool = True,
        temperature: float = 0.2,
        max_tokens: Optional[int] = None,
    ) -> ProviderResponse:
        if not self.is_available():
            raise ProviderException("Gemini API key is not configured.")

        url = f"https://generativelanguage.googleapis.com/v1beta/models/{self.model_name}:generateContent?key={self.api_key}"

        contents = []
        if system_instruction:
            contents.append({"role": "user", "parts": [{"text": f"System Instruction: {system_instruction}"}]})
        contents.append({"role": "user", "parts": [{"text": prompt}]})

        payload = {
            "contents": contents,
            "generationConfig": {
                "temperature": temperature,
            },
        }
        if json_output:
            payload["generationConfig"]["responseMimeType"] = "application/json"
        if max_tokens:
            payload["generationConfig"]["maxOutputTokens"] = max_tokens

        start_time = time.time()

        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post(url, json=payload)
                response.raise_for_status()
                data = response.json()

            latency_ms = (time.time() - start_time) * 1000
            candidates = data.get("candidates", [])
            if not candidates:
                raise ProviderException("Gemini returned empty response candidates.")

            text_content = candidates[0].get("content", {}).get("parts", [{}])[0].get("text", "")
            usage = data.get("usageMetadata", {})
            tokens_used = usage.get("totalTokenCount", 0)

            return ProviderResponse(
                content=text_content,
                raw_response=data,
                provider_name=self.name,
                model_name=self.model_name,
                tokens_used=tokens_used,
                latency_ms=latency_ms,
            )
        except httpx.TimeoutException as e:
            raise ProviderTimeoutException(f"Gemini API call timed out: {str(e)}")
        except Exception as e:
            raise ProviderException(f"Gemini API call failed: {str(e)}")

    async def stream(
        self,
        prompt: str,
        system_instruction: Optional[str] = None,
        temperature: float = 0.2,
    ) -> AsyncGenerator[str, None]:
        res = await self.generate(prompt, system_instruction, json_output=False, temperature=temperature)
        yield res.content
