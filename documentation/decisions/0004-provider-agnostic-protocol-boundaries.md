# 0004: Isolate External Providers Behind Protocol Boundaries

- **Status:** Accepted
- **Date:** 2026-11-26

## Decision

Every external dependency in Griffier — speech-to-text (`Transcriber`), LLM analysis (`IntelligenceAnalyzer`), web search (`SourceSearcher`), interview persistence (`InterviewRepository`), and audio blob storage (`AudioStore`) — sits behind a small Python `Protocol` that speaks only Griffier's own domain models. Concrete adapters are wired in a single composition root driven by environment configuration.

## Why

External AI and speech providers evolve quickly in price, accuracy, and language support. The choice for protocol-based boundaries came from three practical reasons:

- **No vendor lock-in:** Replacing AssemblyAI with ElevenLabs, or swapping a search provider, only requires implementing one adapter class and updating configuration. FastAPI routes, domain logic, and the frontend stay untouched.
- **No leaked vendor schemas:** Provider payloads are normalized into Griffier's own models (`Transcript`, `TranscriptSegment`, `Claim`, `ExternalSource`) at the adapter edge, keeping internal code clean and predictable.
- **Fast, offline testing:** Unit and integration tests inject fake protocol implementations directly without monkey-patching HTTP libraries or calling live paid APIs.

## Alternatives Considered

- **Calling provider SDKs directly in routes/services:** Faster for the first hour, but spreads vendor-specific types and error handling across the codebase, making swaps costly.
- **Full enterprise Hexagonal / DDD layering:** Overkill for an ~8-hour prototype; small `Protocol` interfaces and thin adapters capture the decoupling benefit without boilerplate.

## Trade-offs

- **One extra mapping step per provider:** Each adapter translates external responses into Griffier's domain models. That small upfront cost pays back immediately in testability and swapability.
