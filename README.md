# Griffier

Split-screen editorial web app for journalists. Record an interview directly in the browser or upload an audio file; Griffier transcribes it automatically with speaker attribution, highlights verifiable factual claims, retrieves real external sources, and lets the journalist mark additional passages for batch fact-checking.

## Features

- **Audio capture & upload:** Browser microphone recording with live waveform metering (`MediaRecorder`) and full-viewport drag-and-drop or file picker upload (`.mp3`, `.wav`, `.m4a`, `.mp4`, `.webm`, `.ogg`).
- **Synced transcript & audio playbar:** Clickable segment timestamps seek directly to `start_ms`; the active segment transitions smoothly from gray to crisp black and auto-scrolls into view (pausing when you scroll manually, with a **Follow playback** cue).
- **Multi-speaker management:** Dedicated **Speakers** sidebar with segment counts and edit buttons, plus right-click renaming on transcript speaker names via a reusable modal (with merge confirmation when renaming to an existing speaker).
- **Passage marking & batch fact-checking:** Select any passage in the transcript and right-click (**Mark to fact-check**) — or use the touch/mobile selection action — to queue pending highlights locally, then verify the entire batch in one request (`POST /api/interviews/{id}/claims/check`).
- **Source-grounded Intelligence panel:** Displays the interview summary, restrained partial-failure warnings, real clickable external sources retrieved via Tavily (never model-invented URLs), and fact-check cards with origin badges (`AI` / `Marked`), verdict badges (`Supported`, `Contradicted`, `Needs context`, `Unverified`), `[1]`/`[2]` citations, claim dismissal, and bidirectional cross-pane focus.

## Architecture

- **Backend (`backend/`):** Python 3.12+ (`uv`), FastAPI, PydanticAI (`PromptedOutput` over configurable `anthropic` / `openai` / `google` providers), AssemblyAI `STT-3.7`, Tavily (`tavily-python`), and in-memory storage with a bounded LRU audio cache. External providers sit behind Python `Protocol` boundaries (`Transcriber`, `IntelligenceAnalyzer`, `SourceSearcher`, `InterviewRepository`, `AudioStore`).
- **Frontend (`frontend/`):** React 19, TypeScript (strict, zero `any`), Vite, React Router 7, Tailwind CSS v4 bound to semantic CSS theme tokens (`[data-theme="monochrome-light"]`).

## Prerequisites

- **Python 3.12+** and [`uv`](https://docs.astral.sh/uv/)
- **Node.js 20+** and `npm`
- API keys for:
  - [AssemblyAI](https://www.assemblyai.com/) (`ASSEMBLYAI_API_KEY`)
  - An LLM provider compatible with PydanticAI (`LLM_PROVIDER`, `LLM_MODEL`, `LLM_BASE_URL`, `LLM_API_KEY`)
  - [Tavily](https://tavily.com/) (`TAVILY_API_KEY`)

## Environment Setup

Copy the example environment file and fill in your API keys:

```bash
cp backend/.env.example backend/.env
```

`backend/.env`:

```env
# Speech-to-text (AssemblyAI STT-3.7)
ASSEMBLYAI_API_KEY=

# LLM layer (PydanticAI)
LLM_PROVIDER=anthropic
LLM_MODEL=deepseek-flash
LLM_BASE_URL=https://api.deepseek.com/anthropic
LLM_API_KEY=

# External source search (Tavily)
TAVILY_API_KEY=

# CORS allowed origins (JSON array)
CORS_ORIGINS=["http://localhost:5173"]
```

`LLM_PROVIDER` accepts `anthropic`, `openai`, or `google` (leave `LLM_BASE_URL` empty when using default provider endpoints). Never commit `backend/.env`.

## Running Locally

### 1. Backend (FastAPI on `http://127.0.0.1:8000`)

```bash
cd backend
uv sync
uv run uvicorn griffier.main:app --reload
```

Verify health: `GET http://127.0.0.1:8000/api/health`

### 2. Frontend (Vite on `http://localhost:5173`)

```bash
cd frontend
npm install
npm run dev
```

Vite automatically proxies `/api/*` requests to `http://127.0.0.1:8000`.

## Quality Checks & Tests

All tests run completely offline (no live STT, LLM, or search API calls).

### Backend

```bash
cd backend
uv run ruff check .
uv run ruff format --check .
uv run pyright
uv run pytest
```

### Frontend

```bash
cd frontend
npm run lint
npm run build
```

Automated tests cover the backend pipeline, API routes, and provider adapters; frontend UI tests are intentionally deferred for prototype scope (see [prototype-scope.md](documentation/decisions/prototype-scope.md)).

## Documentation

- [Project Goals](documentation/goals.md) — product, UX, and engineering goals
- [API Architecture](documentation/api/architecture.md) — 4-layer backend structure, REST endpoints, and error handling
- [Sequence Diagrams](documentation/diagrams/) — [capture & analysis](documentation/diagrams/capture-and-analysis.md) and [passage marking & batch check](documentation/diagrams/passage-marking-and-check.md)
- [UI Design & Theme](documentation/ui/) — [design brief](documentation/ui/design-brief.md) and [semantic theme tokens](documentation/ui/theme-tokens.md)
- [Technical Decisions (ADRs)](documentation/decisions/README.md) — architecture & provider decisions (`0001`–`0009`) and [prototype scope](documentation/decisions/prototype-scope.md)
