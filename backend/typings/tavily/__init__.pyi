from types import TracebackType
from typing import Literal, Self

import httpx

type SearchDepth = Literal["basic", "advanced", "fast", "ultra-fast"]
type SearchTopic = Literal["general", "news", "finance"]

class AsyncTavilyClient:
    def __init__(
        self,
        api_key: str | None = None,
        *,
        api_base_url: str | None = None,
        client: httpx.AsyncClient | None = None,
    ) -> None: ...
    async def __aenter__(self) -> Self: ...
    async def __aexit__(
        self,
        exc_type: type[BaseException] | None,
        exc_val: BaseException | None,
        exc_tb: TracebackType | None,
    ) -> None: ...
    async def close(self) -> None: ...
    async def search(
        self,
        query: str,
        *,
        search_depth: SearchDepth | None = None,
        topic: SearchTopic | None = None,
        max_results: int | None = None,
        include_answer: bool | Literal["basic", "advanced"] | None = None,
        timeout: float = 60,
    ) -> dict[str, object]: ...
