# Griffier

Split-screen web app for journalists. Record an interview in the browser or upload an audio file; it is transcribed automatically.

- **Left, Transcript**: the transcribed interview. The journalist can mark passages as "to fact-check", next to the claims the AI suggests.
- **Right, Intelligence**: real external sources for the topics discussed, and a structured fact-check list of claims that need verification, each with a short explanation.

The full brief is in `project.md` (Dutch).

## Stack

- **Backend:** Python (`uv`), FastAPI, PydanticAI (configured via `LLM_PROVIDER`, `LLM_MODEL`, `LLM_BASE_URL`, `LLM_API_KEY`), AssemblyAI `STT-3.7` (batch), Tavily REST (`httpx`), in-memory storage. Every external dependency sits behind a Python `Protocol` boundary (`Transcriber`, `IntelligenceAnalyzer`, `SourceSearcher`, `InterviewRepository`).
- **Frontend:** Vite + React + TypeScript (strict) + React Router.

## Technical Decisions & Documentation

Read the relevant docs before implementing or changing architecture, endpoints, or providers:

- **API architecture:** `documentation/api/architecture.md` — 4-layer FastAPI structure (`api/`, `domain/`, `services/`, `adapters/`), REST endpoints, processing flows, validation, and error handling.
- **Prototype scope:** `documentation/decisions/prototype-scope.md` — production features intentionally deferred (auth, persistent DB, live streaming/job queues, rate limiting/observability). Do not add them unless explicitly requested.
- **Technical decisions:** `documentation/decisions/` (indexed in `documentation/decisions/README.md`). Follow `.agents/skills/technical-decisions/SKILL.md` whenever recording or superseding a decision:

  - `0001` Speech-to-text: AssemblyAI `STT-3.7` (batch, speaker diarization + speaker identification)
  - `0002` Persistence: In-memory storage for the prototype (`InterviewRepository`)
  - `0003` Backend API: FastAPI
  - `0004` Decoupling: Provider-agnostic Python `Protocol` boundaries
  - `0005` LLM layer: PydanticAI with explicit 4-variable `.env` configuration
  - `0006` External sources: Tavily REST API via `httpx` behind `SourceSearcher`
  - `0007` Frontend: React, TypeScript, Vite, and React Router
  - `0008` Processing flow: Single-request audio upload/recording → transcript + intelligence (with loading skeleton)

## Commands

Run the checks for every part the change touches. All must pass before committing.

Backend:

```bash
uv run ruff check . && uv run ruff format --check .
uv run pyright
uv run pytest
uv run pytest path/to/test_file.py   # single file
```

Frontend:

```bash
npm run lint
npm test -- --run
npm test -- --run path/to/file.test.tsx   # single file
npm run build
npm run dev                               # check UI changes in the running app, including mobile width
```

## Rules

- Never commit to `main`. All work goes through stacked PRs.
- Never merge PRs. The user reviews and merges.
- One task at a time. Anything found outside the task becomes a new backlog task, not extra changes on the current branch.
- Tests never call live speech-to-text, LLM or search APIs. Use PydanticAI `TestModel`/`FunctionModel` and fake `Transcriber`/`SourceSearcher` implementations.
- External sources shown in the Intelligence panel must be real, retrieved results. Never let a model invent URLs or citations.
- API keys come from environment variables. Never commit them.
- Follow accepted decisions in `documentation/decisions/`; supersede the decision file (using the `technical-decisions` skill) before changing an accepted provider or architecture boundary.
- Keep `documentation/` up to date as the project evolves: when a task adds or changes endpoints, data contracts, architecture, setup, or introduces a notable technical trade-off, update the relevant file in `documentation/` (or add a new decision record) as part of the same task.
- Before committing or moving a task to `In review`, have a separate read-only reviewer subagent review the changes and return `APPROVE` (see `.agents/skills/workflow/SKILL.md`).

## Architecture Principles

1. **Structured directory architecture** — Organize the codebase into logical directories based on responsibilities and features. Keep related files together and avoid overcrowded directories.
2. **Reusable abstractions over duplicated code** — Identify repeated functionality and build reusable systems that manage shared behaviour, especially when working with multiple providers or interchangeable implementations.
3. **Separation of concerns** — Keep different responsibilities separated. Avoid mixing business logic, infrastructure, data access, and presentation.
4. **Single responsibility principle** — Every module, class, and function should have one clear primary responsibility.
5. **Modularity and encapsulation** — Build independent modules with clear boundaries. Expose only what other modules need and hide internal implementation details.
6. **Consistent interfaces and contracts** — Similar implementations should follow consistent interfaces so they can be used interchangeably without changing the systems that consume them.
7. **Avoid unnecessary complexity** — Prefer simple, readable solutions. Do not introduce unnecessary abstractions, design patterns, layers, or premature optimizations.
8. **Maintainability and extensibility** — Structure the application so new functionality can be introduced without requiring extensive changes to existing, unrelated functionality.

## Skills

Detailed, task-specific instructions live in `.agents/skills/`. Read a skill's `SKILL.md` before doing the work it covers.

| Skill                     | Use when                                                                                                     |
| ------------------------- | ------------------------------------------------------------------------------------------------------------ |
| `workflow`                | Picking up or handing off a task, moving board cards, branches, commits, stacked PRs                         |
| `technical-decisions`     | Recording or superseding architecture, model, provider, or trade-off decisions in `documentation/decisions/` |
| `fastapi`                 | Building, structuring, or reviewing FastAPI routes, dependencies, and schemas                                |
| `python-type-safety`      | Writing or reviewing typed Python (`Protocol`s, generics, `pyright` compliance)                              |
| `async-python-patterns`   | Writing async Python I/O, concurrent tasks, and HTTP client integrations                                     |
| `python-testing-patterns` | Writing `pytest` unit/integration tests, async tests, fixtures, and protocol fakes                           |
| `typescript-standards`    | Writing, reviewing or refactoring TypeScript                                                                 |
| `react-architecture`      | Building, reviewing or refactoring React components and hooks                                                |
| `ui-design-core`          | Designing UI, theming, tokens, spacing, typography                                                           |

## Commits and branches

- Branches: `<type>/p<phase>-<description>`, e.g. `feat/p1-audio-upload`. Types: `feat`, `bugs`, `refactor`, `chore`.
- Commits: `<type>(<task ref>): <summary>`, e.g. `feat(p1): add transcription pipeline`.
- The full workflow is in `.agents/skills/workflow/SKILL.md`.
