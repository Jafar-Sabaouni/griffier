# UI Design Brief & Interaction Flows

Visual direction and interaction design for Griffier, following `.agents/skills/ui-design-core/SKILL.md`.

## Aesthetic Direction

- **Editorial Monochrome:** Inspired by print journalism and minimalist writing tools (similar in restraint to ChatGPT's entry screen).
- **Palette:** Pure/off-white canvas, deep ink black for primary text and actions, and subtle neutral gray surface steps to separate panes, cards, and active playback states.
- **Surface contrast over borders:** Use subtle surface tone shifts rather than heavy outlines; keep borders functional (inputs, focus rings, dividers, selection highlights).
- **Zero decorative clutter:** Every element serves reading, listening, marking, or verifying.

## Views & Flows

### 1. Landing View (`/`)

- Centered text-based brand wordmark (`Griffier`) with a brief one-line subtitle.
- Directly underneath, one focused control bar:
  - Primary **Start recording** pill button (black fill, white text).
  - Round **Upload audio** icon button directly beside it (matching control height).
- **While recording:** The control bar transitions cleanly to a live recording state (live audio waveform bars, elapsed timer, **Stop** button). Dragging an audio file anywhere onto the viewport opens a full-viewport drop overlay.
- **On file selection or stop:** Immediately submits to `POST /api/interviews` and transitions to the workspace view showing a 3-column loading skeleton matching the final workspace chrome while transcription and intelligence run.

### 2. Workspace View (`/interviews/:id`)

Three-column desktop layout (`Speakers` sidebar + `Transcript` pane + `Intelligence` pane), stacking cleanly on mobile widths, with aligned panel headers and a shared top breadcrumb bar (`← Griffier / {title}`):

#### Left Sidebar — Speakers
- Lists all detected speakers (supports any number of speakers) with segment counts and a direct edit (pencil) button opening the reusable `RenameSpeakerModal` (`PATCH /api/interviews/{id}/speakers`).
- Renaming a speaker to an existing speaker name prompts a merge confirmation step before submitting.

#### Middle Pane — Transcript & Audio Playbar (Coupled Unit)
The transcript list and bottom audio playbar share one playback state (`currentTimeMs`, `isPlaying`, `seekTo`) and operate as a single synchronized feature:

- **Header:** `Transcript` label and interview date, aligned with sibling island headers. Right-clicking any speaker name in the transcript opens a context menu with **Rename** triggering the same `RenameSpeakerModal`.
- **Transcript list ↔ Playbar sync:** Scrollable list of speaker-attributed `TranscriptSegment` rows with timestamps:
  - **Playbar → Transcript (text-color transition only):** `activeSegmentId` is derived directly from `currentTimeMs` against each segment's `[start_ms, end_ms]`. Inactive transcript text uses a softer dark gray (`--text-transcript-inactive`), and the currently spoken segment shifts to crisp black (`--text-transcript-active`) while scrolling smoothly into view — no heavy background fill. Manual scrolling pauses auto-scroll so the UI never fights the user while reading or highlighting (with a quick re-follow cue).
  - **Transcript → Playbar:** Clicking a segment's timestamp seeks audio playback directly to `start_ms`.
  - **Distinct claim highlights (never confused with playback):**
    - **AI-suggested fact-checks:** Subtle inline highlight (`--mark-ai-bg` + dashed/soft underline `--mark-ai-underline`) inside the anchored segment (falling back to segment-level emphasis if an AI quote is slightly paraphrased).
    - **Journalist-marked passages:** Stronger, unmistakably distinct inline highlight (`--mark-journalist-bg` + solid underline `--mark-journalist-border`) so manual marks stand out immediately from both AI marks and the gray→black active playback text shift.
- **Marking passages:**
  - Selecting text in the transcript and **right-clicking** opens a lightweight context menu with **Mark to fact-check**.
  - On touch/mobile viewports, a subtle selection/segment action provides the same capability.
  - Newly marked passages appear immediately as pending marks (no blocking network call per highlight).
- **Batch verification trigger:** When one or more marked passages are pending, a prominent action button (e.g., **Check marked passages (N)**) runs `POST /api/interviews/{id}/claims/check` in one batch.
- **Bottom Playbar:** Fixed at the bottom of the transcript pane with play/pause button, scrubber timeline, and `current / duration` readout backed by `GET /api/interviews/{id}/audio`, driving and driven by the transcript list above it.

#### Right Pane — Intelligence
- **Interview Summary:** Brief 2–3 sentence overview of the interview at the top of the pane.
- **External Sources:** Clean list of real, clickable sources retrieved by Tavily (title, domain/date, short snippet, external link). Never displays model-invented URLs.
- **Fact-Check List:** Structured list of source-grounded fact-check cards:
  - Origin badge (`AI` vs. `Marked`), speaker name, timestamp, and verdict badge (`Supported`, `Contradicted`, `Needs context`, or `Unverified`).
  - Quoted passage from the transcript.
  - Short AI explanation grounded in the retrieved Tavily snippets (referencing them as `[1]`, `[2]`) followed by the real clickable source links.
  - Dismiss button (`DELETE /api/interviews/{id}/claims/{claim_id}`) removes both the card and its transcript highlight.
  - Clicking a claim scrolls to and seeks/highlights the corresponding passage in the transcript pane.
- **Warnings banner:** If partial source lookups or verification failed during processing, a restrained banner explains what could not be fetched without hiding the transcript or completed claims.
