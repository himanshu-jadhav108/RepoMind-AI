import time
from typing import AsyncGenerator, Optional
import httpx
from app.core.config import settings
from app.core.exceptions import ProviderException, ProviderTimeoutException
from app.providers.provider_interface import ProviderInterface, ProviderResponse


class HuggingFaceProvider(ProviderInterface):
    """
    HuggingFace Inference API Provider Adapter.
    """

    def __init__(self, api_key: Optional[str] = None, model_name: str = "meta-llama/Meta-Llama-3-8B-Instruct") -> None:
        self.api_key = api_key or getattr(settings, "HUGGINGFACE_API_KEY", None)
        self.model_name = model_name

    @property
    def name(self) -> str:
        return "huggingface"

    def is_available(self) -> bool:
        return bool(self.api_key and "your-huggingface" not in self.api_key)

    async def generate(
        self,
        prompt: str,
        system_instruction: Optional[str] = None,
        json_output: bool = True,
        temperature: float = 0.2,
        max_tokens: Optional[int] = None,
    ) -> ProviderResponse:
        if not self.is_available():
            raise ProviderException("HuggingFace API key is not configured.")

        url = f"https://api-inference.huggingface.co/models/{self.model_name}"
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }

        full_prompt = f"System: {system_instruction}\nUser: {prompt}" if system_instruction else prompt
        payload = {
            "inputs": full_prompt,
            "parameters": {
                "temperature": temperature,
                "max_new_tokens": max_tokens or 1024,
                "return_full_text": False,
            },
        }

        start_time = time.time()

        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post(url, headers=headers, json=payload)
                response.raise_for_status()
                data = response.json()

            latency_ms = (time.time() - start_time) * 1000
            if isinstance(data, list) and len(data) > 0:
                generated_text = data[0].get("generated_text", "")
            elif isinstance(data, dict):
                generated_text = data.get("generated_text", "")
            else:
                generated_text = str(data)

            return ProviderResponse(
                content=generated_text,
                raw_response=data,
                provider_name=self.name,
                model_name=self.model_name,
                tokens_used=len(generated_text.split()),
                latency_ms=latency_ms,
            )
        except httpx.TimeoutException as e:
            raise ProviderTimeoutException(f"HuggingFace API call timed out: {str(e)}")
        except Exception as e:
            raise ProviderException(f"HuggingFace API call failed: {str(e)}")

    async def stream(
        self,
        prompt: str,
        system_instruction: Optional[str] = None,
        temperature: float = 0.2,
    ) -> AsyncGenerator[str, None]:
        res = await self.generate(prompt, system_instruction, json_output=False, temperature=temperature)
        yield res.content
