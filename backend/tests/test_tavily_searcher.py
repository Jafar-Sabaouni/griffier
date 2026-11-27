import json

import httpx
import pytest

from griffier.adapters.search.tavily import TavilySearcher
from griffier.domain.errors import UpstreamProviderError
from griffier.domain.models import ExternalSource
from griffier.domain.protocols import SourceSearcher


async def test_searcher_satisfies_protocol_and_returns_deduplicated_sources() -> None:
    # Arrange
    captured_body: dict[str, object] = {}

    def handler(request: httpx.Request) -> httpx.Response:
        nonlocal captured_body
        assert request.method == "POST"
        assert request.url.path == "/search"
        assert request.headers["Authorization"] == "Bearer tvly-test-key"
        captured_body = json.loads(request.content.decode("utf-8"))
        return httpx.Response(
            200,
            json={
                "query": "inflatie CBS 2025",
                "results": [
                    {
                        "title": "  CBS Inflatiecijfers  ",
                        "url": "https://www.cbs.nl/inflatie-2025/",
                        "content": "  De inflatie daalde met 2 procent.  ",
                        "published_date": "2026-01-15",
                    },
                    {
                        "title": "Duplicate Without Trailing Slash",
                        "url": "https://www.cbs.nl/inflatie-2025",
                        "content": "Duplicate entry.",
                        "published_date": "2026-01-15",
                    },
                    {
                        "title": "",
                        "url": "https://nos.nl/artikel/123",
                        "content": "NOS bericht over inflatie.",
                        "published_date": "   ",
                    },
                    {
                        "title": "Missing URL",
                        "url": "   ",
                        "content": "Should be ignored.",
                    },
                ],
            },
        )

    async with httpx.AsyncClient(transport=httpx.MockTransport(handler)) as client:
        searcher: SourceSearcher = TavilySearcher(api_key="tvly-test-key", client=client)

        # Act
        sources = await searcher.search("inflatie CBS 2025", max_results=3)

    # Assert
    assert captured_body["query"] == "inflatie CBS 2025"
    assert captured_body["max_results"] == 3
    assert captured_body["search_depth"] == "basic"
    assert captured_body["topic"] == "general"
    assert captured_body["include_answer"] is False
    assert sources == [
        ExternalSource(
            title="CBS Inflatiecijfers",
            url="https://www.cbs.nl/inflatie-2025/",
            snippet="De inflatie daalde met 2 procent.",
            published_date="2026-01-15",
        ),
        ExternalSource(
            title="https://nos.nl/artikel/123",
            url="https://nos.nl/artikel/123",
            snippet="NOS bericht over inflatie.",
            published_date=None,
        ),
    ]


async def test_searcher_handles_empty_results_and_blank_query() -> None:
    # Arrange
    call_count = 0

    def handler(request: httpx.Request) -> httpx.Response:
        nonlocal call_count
        call_count += 1
        return httpx.Response(200, json={"results": []})

    async with httpx.AsyncClient(transport=httpx.MockTransport(handler)) as client:
        searcher = TavilySearcher(api_key="tvly-test-key", client=client)

        # Act
        blank_results = await searcher.search("   ")
        zero_results = await searcher.search("valid query", max_results=0)
        empty_results = await searcher.search("obscure topic")

    # Assert
    assert blank_results == []
    assert zero_results == []
    assert empty_results == []
    assert call_count == 1


async def test_searcher_raises_upstream_error_on_http_failure() -> None:
    # Arrange
    def handler(request: httpx.Request) -> httpx.Response:
        return httpx.Response(429, json={"detail": {"error": "Rate limit exceeded"}})

    async with httpx.AsyncClient(transport=httpx.MockTransport(handler)) as client:
        searcher = TavilySearcher(api_key="tvly-test-key", client=client)

        # Act & Assert
        with pytest.raises(UpstreamProviderError) as exc:
            await searcher.search("inflation")
        assert exc.value.provider == "Tavily"


async def test_searcher_raises_upstream_error_on_timeout() -> None:
    # Arrange
    def handler(request: httpx.Request) -> httpx.Response:
        raise httpx.ReadTimeout("Timed out")

    async with httpx.AsyncClient(transport=httpx.MockTransport(handler)) as client:
        searcher = TavilySearcher(api_key="tvly-test-key", client=client)

        # Act & Assert
        with pytest.raises(UpstreamProviderError, match="timed out"):
            await searcher.search("inflation")


async def test_searcher_raises_upstream_error_on_network_error() -> None:
    # Arrange
    def handler(request: httpx.Request) -> httpx.Response:
        raise httpx.ConnectError("DNS lookup failed")

    async with httpx.AsyncClient(transport=httpx.MockTransport(handler)) as client:
        searcher = TavilySearcher(api_key="tvly-test-key", client=client)

        # Act & Assert
        with pytest.raises(UpstreamProviderError, match="Network error"):
            await searcher.search("inflation")


async def test_searcher_raises_upstream_error_on_invalid_payload() -> None:
    # Arrange
    def handler(request: httpx.Request) -> httpx.Response:
        return httpx.Response(200, json={"results": "not-a-list"})

    async with httpx.AsyncClient(transport=httpx.MockTransport(handler)) as client:
        searcher = TavilySearcher(api_key="tvly-test-key", client=client)

        # Act & Assert
        with pytest.raises(UpstreamProviderError, match="Invalid response payload"):
            await searcher.search("inflation")


async def test_searcher_raises_upstream_error_when_api_key_missing() -> None:
    # Arrange
    searcher = TavilySearcher(api_key="   ")

    # Act & Assert
    with pytest.raises(UpstreamProviderError, match="TAVILY_API_KEY"):
        await searcher.search("inflation")


def test_searcher_rejects_non_positive_timeout() -> None:
    # Act & Assert
    with pytest.raises(ValueError):
        TavilySearcher(api_key="tvly-test-key", timeout_seconds=0)
