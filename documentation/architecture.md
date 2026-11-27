# System Architecture

High-level architecture of **Griffier** across the React frontend, FastAPI backend, and external AI/search providers.


## Frontend Architecture (`frontend/src/`)

Organized by UI primitives, shared hooks/API client, and feature modules:

| Directory | Responsibility |
| --- | --- |
| `styles/` & `index.css` | Semantic CSS custom-property theme tokens (`[data-theme="monochrome-light"]`) mapped into Tailwind v4 `@theme inline`. |
| `components/ui/` | Reusable, token-driven primitives (`Button`, `Input`, `Badge`, `Card`, `Modal`, `ContextMenu`, `Skeleton`, `AudioWaveform`, `DragDropWrapper`). |
| `types/` & `api/` | Strict TypeScript domain contracts (`as const` guards for `ClaimOrigins` / `ClaimVerdicts`) and a 120s-timeout typed HTTP client (`interviews.ts`). |
| `hooks/` | `useInterviewResource` (`useSyncExternalStore` + `AbortSignal` + StrictMode-safe blob URL lifecycle + reload revalidation) and `useAudioLevels` (Web Audio metering). |
| `features/capture/` | Landing view (`CaptureLanding`), `MediaRecorder` hook (`useAudioRecorder`), and 3-column `ProcessingSkeleton`. |
| `features/transcript/` | Synced playback (`useTranscriptPlayback`), `TranscriptPane`, `AudioPlaybar`, highlight resolution (`highlights.ts`, `HighlightedSegmentText`), `useContainerSelection`, `PendingMarksBar`, `SpeakersSidebar`, and `RenameSpeakerModal` (with merge confirmation). |
| `features/intelligence/` | `IntelligencePane`, reusable `ClaimCard`, clickable `SourceItem`, and URL/date formatting helpers (`sourceFormat.ts`). |
| `features/workspace/` | `WorkspaceHeader`, `WorkspaceNotFound`, and `useInterviewMutations` (interview-scoped speaker rename, batch passage check, and concurrent-safe claim dismissal). |
| `pages/` | Thin route entrypoints (`InterviewWorkspacePage`, plus dev-only `PrimitivesPage`). |

## Backend Architecture (`backend/src/griffier/`)

Strict 4-layer architecture where business logic depends only on domain models and `Protocol` interfaces:

| Layer | Responsibility |
| --- | --- |
| `api/` | FastAPI routers (`/api/health`, `/api/interviews/*`), Pydantic request/response schemas, multipart upload validation (MIME + size), and centralized JSON error handlers (`400`/`404`/`413`/`415`/`422`/`502`). |
| `services/` | `InterviewService` orchestrating transcription, claim extraction, concurrent source search, deterministic source-grounding (`source_grounding.py`), batch marked-passage checking, speaker renaming, and claim dismissal. |
| `domain/` | Pure Pydantic domain models (`Interview`, `TranscriptSegment`, `Claim`, `ExternalSource`, `AudioAsset`), typed domain errors, and 5 async `Protocol` contracts (`Transcriber`, `IntelligenceAnalyzer`, `SourceSearcher`, `InterviewRepository`, `AudioStore`). |
| `adapters/` | Interchangeable concrete implementations: `AssemblyAITranscriber` (`assemblyai` SDK), `PydanticAIAnalyzer` (`PromptedOutput` + 4-variable `model_factory.py`), `TavilySearcher` (`tavily-python` SDK), `InMemoryInterviewRepository`, and bounded LRU `InMemoryAudioStore`. |

## Key Design Boundaries

1. **Zero invented URLs:** The LLM never sees or generates raw URLs. `InterviewService` assigns integer IDs (`[1]`, `[2]`) to real Tavily results, the LLM cites only those integers, and `source_grounding.py` deterministically attaches the verified `ExternalSource` objects.
2. **Fail-safe degradation:** Transcription failure aborts interview creation, but partial LLM or Tavily failures preserve the transcript and attach human-readable warnings rendered in the Intelligence panel.
3. **Provider portability:** Swapping STT, LLM, search, or storage only requires a new adapter implementing the matching `Protocol` in `domain/protocols.py` and wiring it in `dependencies.py`.
4. **Prototype boundaries:** Auth, persistent database storage, background job queues, and distributed rate limiting are intentionally out of scope (see [prototype-scope.md](decisions/prototype-scope.md)).

## Related Documentation

- [Backend API Architecture](api/architecture.md) — endpoint contracts, validation rules, and error mapping
- [Sequence Diagrams](diagrams/) — [capture & analysis](diagrams/capture-and-analysis.md) and [passage marking & batch check](diagrams/passage-marking-and-check.md)
- [UI Design Brief](ui/design-brief.md) & [Theme Tokens](ui/theme-tokens.md)
- [Technical Decisions (ADRs)](decisions/README.md) — `0001`–`0009`
