# Prototype Scope & Deferred Decisions

Griffier is built as an prototype to validate the core journalistic workflow: turning an interview into a speaker-attributed transcript paired with real external sources and a structured fact-check list.

Several production concerns are intentionally left out of the prototype. These are high-impact architectural decisions that deserve careful design once the core product direction is validated rather than rushed defaults.

## 1. Authentication & Authorization

- **Why deferred:** The prototype runs locally as a single-user workspace to validate the transcript and intelligence experience without adding login flows, session management, or role modeling.
- **What production requires:** Newsroom authentication (SSO/OIDC), per-journalist or editorial-team access control, and scoped API authorization on every interview endpoint.

## 2. Persistent Storage & Data Retention

- **Why deferred:** As documented in [0002](./0002-in-memory-storage-for-prototype.md), choosing a database engine, schema migrations, blob storage for audio files, and retention rules depends on future multi-user and editorial workflow requirements.
- **What production requires:** A relational database behind `InterviewRepository`, object storage for raw audio recordings, and explicit retention/deletion lifecycles.

## 3. Live Streaming & Background Job Processing

- **Why deferred:** As documented in [0001](./0001-speech-to-text-assemblyai-stt-3-7.md) and [0008](./0008-single-request-audio-processing.md), batch transcription on upload/stop in a single request keeps the UX frictionless and avoids WebSocket state and job-queue infrastructure for short demo clips.
- **What production requires:** Streaming transcription (`STT-3.7-Realtime`) for live interview capture, plus a background worker queue with progress streaming (SSE/WebSockets) to handle hour-long recordings reliably without HTTP timeouts.

## 4. Rate Limiting, Cost Controls & Observability

- **Why deferred:** Local single-user execution does not face abusive traffic or multi-tenant API spend, so basic input validation and structured error responses are sufficient for the prototype.
- **What production requires:** Per-user upload and request rate limits, spend/token caps across STT, LLM, and search APIs, and structured logging/tracing across provider calls.
