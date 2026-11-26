# 0008: Process Audio and Intelligence in a Single Request

- **Status:** Accepted
- **Date:** 2026-11-26

## Decision

Uploading an audio file or stopping a browser recording triggers a single backend request (`POST /api/interviews`) that runs transcription (`STT-3.7`), claim/topic extraction (`PydanticAI`), and external source retrieval (`Tavily`) end-to-end, returning the complete interview payload. While processing runs, the frontend displays a loading skeleton/loader. Manually marking a passage afterward still triggers a dedicated endpoint for that claim.

## Why

The journalist workflow should require zero extra steps after providing audio:

- **Frictionless UX:** Uploading a file or stopping a recording immediately produces both the transcript and the intelligence panel without asking the user to click a second "Analyze" button.
- **Simpler client and server state:** One request-response lifecycle avoids coordinating partial interview states, polling jobs, or race conditions between the left and right panes in a prototype.
- **Clear feedback:** A loading skeleton or progress loader communicates that transcription and fact-checking are underway without complicating the API contract.

## Alternatives Considered

- **Two-stage requests (transcript first, intelligence second):** Shows the transcript earlier while the right pane loads, but adds client-side state orchestration and partial-failure handling that is unnecessary for short prototype interviews.

- **Background job queue + polling/SSE:** Better suited for hour-long recordings at scale, but adds significant infrastructure and state complexity for an ~8-hour prototype.

## Trade-offs

- **Longer single request duration:** Combining STT, LLM analysis, and web search can take 10–30 seconds on longer clips. Acceptable for a prototype with short demo recordings; HTTP client timeouts must be configured generously, and the pipeline can later be split into background jobs or SSE if long-form interviews require it.
