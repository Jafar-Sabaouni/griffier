from typing import Literal

import httpx
from pydantic import BaseModel, Field, ValidationError
from tavily import AsyncTavilyClient

from griffier.domain.errors import UpstreamProviderError
from griffier.domain.models import ExternalSource

type SearchDepth = Literal["basic", "advanced", "fast", "ultra-fast"]
type SearchTopic = Literal["general", "news", "finance"]

PROVIDER_NAME = "Tavily"
DEFAULT_TIMEOUT_SECONDS = 20.0
DEFAULT_SEARCH_DEPTH: SearchDepth = "basic"
DEFAULT_TOPIC: SearchTopic = "general"


class _TavilyResult(BaseModel):
    title: str = ""
    url: str = ""
    content: str = ""
    published_date: str | None = None


class _TavilySearchResponse(BaseModel):
    results: list[_TavilyResult] = Field(default_factory=list[_TavilyResult])


def _canonical_url_key(url: str) -> str:
    return url.strip().rstrip("/")


class TavilySearcher:
    def __init__(
        self,
        api_key: str,
        *,
        base_url: str | None = None,
        timeout_seconds: float = DEFAULT_TIMEOUT_SECONDS,
        search_depth: SearchDepth = DEFAULT_SEARCH_DEPTH,
        topic: SearchTopic = DEFAULT_TOPIC,
        client: httpx.AsyncClient | None = None,
    ) -> None:
        if timeout_seconds <= 0:
            raise ValueError("timeout_seconds must be positive.")

        self._api_key = api_key.strip()
        self._base_url = base_url.strip().rstrip("/") if base_url and base_url.strip() else None
        self._timeout_seconds = timeout_seconds
        self._search_depth: SearchDepth = search_depth
        self._topic: SearchTopic = topic
        self._http_client = client

    async def search(self, query: str, max_results: int = 5) -> list[ExternalSource]:
        cleaned_query = query.strip()
        if not cleaned_query or max_results <= 0:
            return []
        if not self._api_key:
            raise UpstreamProviderError(PROVIDER_NAME, "TAVILY_API_KEY is not configured.")

        try:
            async with AsyncTavilyClient(
                api_key=self._api_key,
                api_base_url=self._base_url,
                client=self._http_client,
            ) as sdk_client:
                raw_response: object = await sdk_client.search(
                    query=cleaned_query,
                    max_results=max_results,
                    search_depth=self._search_depth,
                    topic=self._topic,
                    include_answer=False,
                    timeout=self._timeout_seconds,
                )
        except (httpx.TimeoutException, TimeoutError) as exc:
            raise UpstreamProviderError(PROVIDER_NAME, "Request timed out.") from exc
        except httpx.HTTPStatusError as exc:
            raise UpstreamProviderError(
                PROVIDER_NAME,
                f"HTTP {exc.response.status_code} response from Tavily.",
            ) from exc
        except httpx.HTTPError as exc:
            raise UpstreamProviderError(PROVIDER_NAME, f"Network error: {exc}") from exc
        except Exception as exc:
            detail = str(exc).strip() or type(exc).__name__
            raise UpstreamProviderError(PROVIDER_NAME, detail) from exc

        try:
            parsed = _TavilySearchResponse.model_validate(raw_response)
        except ValidationError as exc:
            raise UpstreamProviderError(PROVIDER_NAME, "Invalid response payload.") from exc

        return self._normalize_sources(parsed.results)

    @staticmethod
    def _normalize_sources(results: list[_TavilyResult]) -> list[ExternalSource]:
        sources: list[ExternalSource] = []
        seen_urls: set[str] = set()

        for item in results:
            url = item.url.strip()
            if not url:
                continue
            key = _canonical_url_key(url)
            if key in seen_urls:
                continue
            seen_urls.add(key)

            title = item.title.strip() or url
            snippet = item.content.strip()
            published_date = (
                item.published_date.strip()
                if item.published_date and item.published_date.strip()
                else None
            )
            sources.append(
                ExternalSource(
                    title=title,
                    url=url,
                    snippet=snippet,
                    published_date=published_date,
                )
            )

        return sources
