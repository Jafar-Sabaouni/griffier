from enum import StrEnum

from pydantic_ai.models import Model
from pydantic_ai.models.anthropic import AnthropicModel
from pydantic_ai.models.google import GoogleModel
from pydantic_ai.models.openai import OpenAIChatModel
from pydantic_ai.providers.anthropic import AnthropicProvider
from pydantic_ai.providers.google import GoogleProvider
from pydantic_ai.providers.openai import OpenAIProvider

from griffier.config import Settings
from griffier.domain.errors import UpstreamProviderError

PROVIDER_NAME = "LLM"


class LLMProviderName(StrEnum):
    ANTHROPIC = "anthropic"
    OPENAI = "openai"
    GOOGLE = "google"


def build_llm_model(
    *,
    provider: str,
    model_name: str,
    api_key: str,
    base_url: str | None = None,
) -> Model:
    cleaned_provider = provider.strip().lower()
    cleaned_model = model_name.strip()
    cleaned_key = api_key.strip()
    cleaned_base_url = base_url.strip() if base_url and base_url.strip() else None

    if not cleaned_model:
        raise UpstreamProviderError(PROVIDER_NAME, "LLM_MODEL is not configured.")
    if not cleaned_key:
        raise UpstreamProviderError(PROVIDER_NAME, "LLM_API_KEY is not configured.")

    try:
        provider_enum = LLMProviderName(cleaned_provider)
    except ValueError as exc:
        supported = ", ".join(item.value for item in LLMProviderName)
        raise UpstreamProviderError(
            PROVIDER_NAME,
            f"Unsupported LLM_PROVIDER '{provider}'. Expected one of: {supported}.",
        ) from exc

    match provider_enum:
        case LLMProviderName.ANTHROPIC:
            return AnthropicModel(
                cleaned_model,
                provider=AnthropicProvider(api_key=cleaned_key, base_url=cleaned_base_url),
            )
        case LLMProviderName.OPENAI:
            return OpenAIChatModel(
                cleaned_model,
                provider=OpenAIProvider(api_key=cleaned_key, base_url=cleaned_base_url),
            )
        case LLMProviderName.GOOGLE:
            return GoogleModel(
                cleaned_model,
                provider=GoogleProvider(api_key=cleaned_key, base_url=cleaned_base_url),
            )


def build_llm_model_from_settings(settings: Settings) -> Model:
    return build_llm_model(
        provider=settings.llm_provider,
        model_name=settings.llm_model,
        api_key=settings.llm_api_key,
        base_url=settings.llm_base_url,
    )
