# Backend API Architecture

Architecture and HTTP contract for Griffier's FastAPI backend, aligned with [decisions 0001–0008](../decisions/README.md) and the [prototype scope](../decisions/prototype-scope.md).

## Module Structure

```text
backend/src/griffier/
├── api/            # Thin FastAPI routers, HTTP schemas, exception handlers
├── domain/         # Pure Pydantic models (Interview, Segment, Claim, Source) + Protocols
├── services/       # Use-case orchestration talking exclusively to Protocols
├── adapters/       # Concrete providers (AssemblyAI, PydanticAI, Tavily, InMemoryRepository)
├── config.py       # Typed environment settings (pydantic-settings)
└── dependencies.py # Single composition root wiring adapters via FastAPI Depends
```

- **`api/`** handles HTTP concerns only: multipart upload validation, status codes, dependency injection, and mapping domain errors to JSON responses.
- **`domain/`** defines Griffier's own data models and `Protocol` interfaces (`Transcriber`, `IntelligenceAnalyzer`, `SourceSearcher`, `InterviewRepository`) with zero external provider imports.
- **`services/`** coordinates end-to-end flows (`process_audio`, `mark_passage`) against protocols so business logic stays independent of vendors and HTTP.
- **`adapters/`** translates vendor payloads into Griffier domain models at the edge, ensuring no vendor-specific types leak inward.
- **`dependencies.py`** wires concrete adapters from `config.py` in one place, allowing providers to be swapped or faked cleanly.

## Processing Flows

### 1. Audio Ingestion (`POST /api/interviews`)

Both uploaded audio files and stopped browser recordings go through one endpoint ([0008](../decisions/0008-single-request-audio-processing.md)):

```text
Audio upload
  → AssemblyAITranscriber (STT-3.7: diarization + speaker ID + timestamps)
  → PydanticAIAnalyzer (topics, verifiable claims, search queries, short explanations)
  → TavilySearcher (concurrent httpx searches via asyncio.gather for real URLs/snippets)
  → PydanticAIAnalyzer (optional source-grounded summary referencing snippets by ID)
  → InMemoryInterviewRepository (store & return complete Interview)
```

Every URL returned to the client comes directly from `SourceSearcher` results; the LLM never constructs or copies URLs ([0006](../decisions/0006-tavily-for-external-source-search.md)).

### 2. Manual Passage Marking (`POST /api/interviews/{id}/claims`)

When a journalist marks a transcript passage as "to fact-check", the service generates a short explanation and search query for that quote, retrieves real sources via `SourceSearcher`, appends the claim (`origin="journalist"`), and returns the enriched claim with its sources.

## Endpoints

| Method & Path | Purpose | Status Codes |
| :--- | :--- | :--- |
| `GET /api/health` | Liveness check | `200` |
| `POST /api/interviews` | Upload audio file or stopped recording; returns transcript, claims, and external sources | `201`, `400`, `413`, `415`, `502` |
| `GET /api/interviews/{id}` | Retrieve an existing interview by ID | `200`, `404` |
| `POST /api/interviews/{id}/claims` | Mark a transcript passage for fact-checking and retrieve supporting sources | `201`, `404`, `422`, `502` |
| `DELETE /api/interviews/{id}/claims/{claim_id}` | Remove or dismiss a claim | `204`, `404` |

## Validation & Error Handling

- **Edge upload guards:** Reject empty uploads (`400`), unsupported audio MIME types (`415`), and oversized files (`413`) before calling external APIs.
- **Consistent error responses:** Domain and upstream exceptions are caught by centralized FastAPI exception handlers and returned as structured JSON (`404` for unknown IDs, `502` for upstream STT/LLM/search failures) without exposing raw stack traces or vendor payloads.

## Testing Strategy

- Integration tests exercise the full HTTP layer using FastAPI's `TestClient` / `httpx.AsyncClient` with `app.dependency_overrides` injecting fake `Transcriber`, `SourceSearcher`, and `InterviewRepository` implementations.
- LLM orchestration tests use PydanticAI's `TestModel` and `FunctionModel`.
- Automated tests never call live external APIs.
