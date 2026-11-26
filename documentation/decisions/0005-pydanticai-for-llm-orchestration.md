# 0005: Use PydanticAI for the LLM Layer

- **Status:** Accepted
- **Date:** 2026-11-26

## Decision

Griffier uses **PydanticAI** inside the `IntelligenceAnalyzer` adapter for claim extraction, fact-check explanations, and source-grounded summaries. Model selection is configured through four environment variables so any compatible provider or custom endpoint can be swapped without code changes:

```env
LLM_PROVIDER=anthropic
LLM_MODEL=deepseek-flash
LLM_BASE_URL=https://api.deepseek.com/anthropic
LLM_API_KEY=
```

## Why

Griffier needs reliable structured outputs (claims linked to transcript passages, verification explanations, and search queries) without locking the backend to a single LLM vendor or hosted endpoint. The choice for PydanticAI with explicit provider/base-URL configuration came from four reasons:

- **Model- and endpoint-agnostic:** Separating `LLM_PROVIDER` (API protocol such as `anthropic`, `openai`, or `google`), `LLM_MODEL`, optional `LLM_BASE_URL`, and `LLM_API_KEY` lets Griffier target hosted APIs, Anthropic/OpenAI-compatible providers (such as DeepSeek or OpenRouter), or local models purely through `.env`.
- **Validated structured outputs:** Output schemas are standard Pydantic models; if an LLM returns malformed data or fails validation, PydanticAI feeds the error back and retries automatically.
- **Typed tool injection:** External capabilities such as `SourceSearcher` can be injected cleanly into agent tools with full static type checking.
- **Built-in offline testing:** `TestModel` and `FunctionModel` allow deterministic tests of prompts, schemas, and tool wiring without making live LLM calls.

## Alternatives Considered

- **Direct provider SDK + Pydantic:** Fewer dependencies, but ties the adapter to one vendor's SDK and requires writing custom retry loops and mock harnesses.
- **LangGraph:** Strong for long-running stateful agent graphs with checkpointing, which adds unnecessary complexity for Griffier's request-response analysis workflow.
- **OpenAI Agents SDK:** Lightweight for handoffs, but less clean as a neutral abstraction across non-OpenAI providers.

## Trade-offs

- **Additional library dependency:** Mitigated by keeping PydanticAI confined behind the `IntelligenceAnalyzer` protocol ([0004](./0004-provider-agnostic-protocol-boundaries.md)), so even the LLM framework itself can be replaced independently of FastAPI routes.
- **Does not cover dedicated STT APIs:** Audio transcription stays on AssemblyAI `STT-3.7` behind `Transcriber` ([0001](./0001-speech-to-text-assemblyai-stt-3-7.md)); PydanticAI handles text intelligence downstream.
