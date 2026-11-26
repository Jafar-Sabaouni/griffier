# Passage Marking & Batch Fact-Check Flow

Sequence for journalist-marked passages: instant local queuing via right-click, followed by one batch verification request (`POST /api/interviews/{id}/claims/check`).

```mermaid
sequenceDiagram
    actor Journalist
    participant UI as Left Transcript Pane
    participant API as FastAPI Backend
    participant LLM as PydanticAI
    participant Search as Tavily REST
    participant Repo as InMemoryRepository

    loop While reading or listening
        Journalist->>UI: Select text → Right-click → Mark to fact-check
        UI->>UI: Queue pending highlight locally (no network call)
    end

    Journalist->>UI: Click "Check marked passages (N)"
    UI->>API: POST /api/interviews/:id/claims/check (batch quotes + offsets)
    API->>Repo: Persist journalist claims immediately (origin = journalist)

    API->>LLM: Generate search queries for marked quotes (with context)
    LLM-->>API: Search queries

    API->>Search: Concurrent queries (asyncio.gather, return_exceptions=True)
    Search-->>API: Real ExternalSource[] (numbered snippets + URLs)

    alt Verification succeeds
        API->>LLM: Verify marked claims against numbered snippets
        LLM-->>API: Verdicts, grounded explanations & source_ids
        API->>API: Attach real Tavily URLs by source_ids
    else Enrichment or search fails
        API->>API: Keep saved claims (verdict = unverified) + add warning
    end

    API->>Repo: Update saved claims with enrichment
    API-->>UI: 201 Created (enriched Marked claims + warnings)
    UI-->>Journalist: Highlights stay in transcript + new Marked cards appear in Right Pane
```
