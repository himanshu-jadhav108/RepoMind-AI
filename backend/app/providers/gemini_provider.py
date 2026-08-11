import time
from typing import AsyncGenerator, Optional

import httpx

from app.core.config import settings
from app.core.exceptions import ProviderException, ProviderTimeoutException
from app.providers.provider_interface import ProviderInterface, ProviderResponse


class GeminiProvider(ProviderInterface):
    """
    Google Gemini AI Provider Adapter using direct HTTP REST API.
    Supports automatic fallback across model variants.
    """

    def __init__(
        self,
        api_key: Optional[str] = None,
        model_name: str = "gemini-2.5-flash",
        name_override: Optional[str] = None,
    ) -> None:
        self.api_key = api_key or settings.GEMINI_API_KEY
        self.model_name = model_name
        self._name = name_override or "gemini"

    @property
    def name(self) -> str:
        return self._name

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
            raise ProviderException(f"Gemini API key is not configured for {self.name}.")

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

        models_to_try = [self.model_name, "gemini-2.5-flash", "gemini-1.5-flash-latest", "gemini-1.5-flash"]
        unique_models = []
        for m in models_to_try:
            if m not in unique_models:
                unique_models.append(m)

        last_error = None
        for current_model in unique_models:
            url = f"https://generativelanguage.googleapis.com/v1beta/models/{current_model}:generateContent?key={self.api_key}"
            try:
                async with httpx.AsyncClient(timeout=30.0) as client:
                    response = await client.post(url, json=payload)
                    response.raise_for_status()
                    data = response.json()

                latency_ms = (time.time() - start_time) * 1000
                candidates = data.get("candidates", [])
                if not candidates:
                    raise ProviderException(f"[{self.name}] Gemini returned empty response candidates.")

                text_content = candidates[0].get("content", {}).get("parts", [{}])[0].get("text", "")
                usage = data.get("usageMetadata", {})
                tokens_used = usage.get("totalTokenCount", 0)

                return ProviderResponse(
                    content=text_content,
                    raw_response=data,
                    provider_name=self.name,
                    model_name=current_model,
                    tokens_used=tokens_used,
                    latency_ms=latency_ms,
                )
            except Exception as err:
                last_error = err
                continue

        raise ProviderException(f"[{self.name}] Gemini API call failed across all model variants: {last_error}")

    async def stream(
        self,
        prompt: str,
        system_instruction: Optional[str] = None,
        temperature: float = 0.2,
    ) -> AsyncGenerator[str, None]:
        res = await self.generate(prompt, system_instruction, json_output=False, temperature=temperature)
        yield res.content
