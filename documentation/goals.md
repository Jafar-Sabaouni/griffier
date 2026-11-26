# Griffier — Project Goals

Core product, user experience, and engineering goals for the Griffier prototype, derived from [project.md](../project.md).

## 1. Product Goals

- **Frictionless audio capture:** A journalist can either start recording directly in the browser or upload an audio file from a minimal landing screen. Stopping a recording or selecting a file immediately starts transcription and analysis without extra confirmation clicks.
- **Readable, audio-synced transcript:** The left pane displays the transcribed interview with speaker attribution and timestamps, backed by a bottom audio playbar. As audio plays, the currently spoken segment highlights and stays in view; clicking a segment seeks directly to that moment.
- **Speaker clarity:** Speakers are identified automatically by `STT-3.7`, and the journalist can rename any speaker inline (updating all segments and attributed claims across the workspace).
- **Journalist-in-the-loop fact-checking:** Alongside AI-suggested claims, the journalist can highlight passages in the transcript, right-click to mark them as "to fact-check" (with a mobile-friendly fallback), and trigger a batch verification check whenever ready.
- **Real, verifiable intelligence:** The right pane presents real, clickable external sources for the topics discussed and a structured fact-check list with short explanations. Every displayed URL comes strictly from retrieved search results — never invented by a model.

## 2. Visual & UX Goals

- **Calm editorial monochrome aesthetic:** Crisp white, deep black, and subtle neutral grays keep attention on the interview text and sources rather than decorative UI chrome.
- **Themeable by construction:** All colors, surfaces, radii, spacing, and typography live in relational CSS tokens so switching or extending themes (e.g., dark mode or newsroom branding) requires changing only token values, not component code.
- **Responsive layout:** Split-screen on desktop and clean stacked/tabbed usability at mobile widths.

## 3. Engineering & Craftsmanship Goals

- **Zero vendor lock-in:** Speech-to-text (`Transcriber`), LLM analysis (`IntelligenceAnalyzer`), web search (`SourceSearcher`), and storage (`InterviewRepository`) sit behind Python `Protocol` boundaries so providers can be swapped without touching routes, services, or frontend code.
- **Clean, strict typing across the stack:** Strict Python (`pyright`, Pydantic v2, `ruff`) and strict TypeScript (zero `any`, `as const` discriminator guards).
- **Deterministic offline testing:** Full unit and integration test suites run offline using fake protocol adapters, `httpx.MockTransport`, and PydanticAI `TestModel`/`FunctionModel` — never hitting live paid APIs.
- **Intentional prototype scope:** Production concerns (authentication, persistent database, live streaming STT, background job queues, rate limiting) are deliberately deferred and documented in [prototype-scope.md](./decisions/prototype-scope.md) rather than rushed.
- **Defensible documentation:** Every significant technical choice is recorded in [decisions/](./decisions/README.md) and kept in sync as the project evolves.
