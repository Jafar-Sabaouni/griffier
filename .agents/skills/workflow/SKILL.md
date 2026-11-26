---
name: workflow
description: >-
    development workflow. Use when picking up, working on, continuing or handing off a task, when moving cards or task files on the project board, when creating branches, commits or stacked PRs, or when changing a task that is already in review. Covers single-task execution, the two project board backends (GitHub Projects board and local folder board), phase-prefixed branch naming (feat/p1-*, chore/p1-*, bugs/p1-*), stacked PRs and cascading rebases.
tier: on-demand
author: JafarS 
version: 1.0.0
last_update: 2026-11-26
---

# Griffier Workflow Skill

This skill is split into parts. Read this file first, then the board file for the active board, then `references/stacked-prs.md` when creating branches or PRs.

| File | Covers |
| --- | --- |
| `references/boards/local-board.md` | Local board: one markdown file per task, folders as columns |
| `references/boards/github-board.md` | GitHub Projects board: issues as cards, status changed with `gh` |
| `references/stacked-prs.md` | Branches, stacking, cascading rebases, opening PRs, merging |

---

## 1. Active Board

**Active board: `local`** (`references/boards/local-board.md`)

Only one board is active at a time. Switch by changing the line above to `github` (`references/boards/github-board.md`) once the Griffier repo and project board exist. Never track the same task on both boards.

---

## 2. Core Execution Rules

1. **Strictly One Task at a Time**: Never start or interleave work for another task before the current task is completed, committed, and in review.
2. **Never Commit to `main`**: All code enters through stacked pull requests.
3. **Synchronize Board Status**: Update the task's status on the active board at every phase of the task.
4. **User Merges the Stacks**: The agent must **never** merge pull requests or stacks (`gh pr merge` / `git merge`). Pull request review, approval, and merging is strictly executed by the USER.
5. **Stay in Scope**: Anything found along the way that is outside the task becomes a new task in the backlog, not extra changes on the current branch.

---

## 3. The Task Loop

Every board follows the same columns:

```
Backlog  →  Ready  →  In progress  →  In review  →  Done
```

1. **Pick** a task from `Ready` (lowest number first, unless the user names one). Skip a task whose dependencies are still in `Backlog` or `Ready`.
2. **Start**: move it to `In progress` on the active board.
3. **Branch**: create the branch, stacked on its parent if it depends on unmerged work (`references/stacked-prs.md`).
4. **Implement & verify**: do the work and run the verification checks in section 5.
5. **Independent agent review**: spawn a separate reviewer subagent to audit the changes (section 5.1). Fix any blocking findings and re-verify before proceeding.
6. **Commit and hand off**: commit, log verification + review summary in the task notes, then move the task to `In review` as the board file describes.
7. **Done**: only the user moves a task to `Done` (or tells the agent to).

The board file says how each step is done on that board.

---

## 4. Branch & Task Naming Standards

All branches must include the phase prefix (`p1`, `p2`, etc.) or `p-unscheduled`:
* Features: `feat/p<phase>-<description>` (e.g. `feat/p1-audio-upload`)
* Bug fixes: `bugs/p<phase>-<description>` (e.g. `bugs/p1-quote-anchor-offset`)
* Refactoring: `refactor/p<phase>-<description>` (e.g. `refactor/p1-transcriber-protocol`)
* Chores/Setup: `chore/p<phase>-<description>` (e.g. `chore/p1-project-scaffolding`)
* Unscheduled tasks: `feat/p-unscheduled-<description>` (or `chore/p-unscheduled-<description>`)

Commit messages: `<type>(<task ref>): <summary>`, where the task ref comes from the active board (`T-012` on the local board, `p1` plus `#12` in the body on the GitHub board).

### 4.1 Unscheduled Tasks (`P-Unscheduled` / `p-unscheduled`)
* **Definition**: Tasks, features, or speculative requirements that have not yet been placed into a planned delivery phase.
* **On the board**: Titled with suffix `P-Unscheduled` (e.g. `Speaker Diarization P-Unscheduled`) and kept in `Backlog`.
* **Promotion to Active Phase**: When an unscheduled item is approved, rename `P-Unscheduled` to the target phase (e.g. `P2`) and create its branch under the phase prefix before moving it to `In progress`.

---

## 5. Quality Verification

Run the checks for every part of the stack the task touches. All must pass before committing, and again on the top branch after any rebase.

* Backend (Python, `uv`):
  ```bash
  uv run ruff check . && uv run ruff format --check .
  uv run pyright
  uv run pytest
  ```
* Frontend (Vite + React + TypeScript):
  ```bash
  npm run lint
  npm test -- --run
  npm run build
  ```
* Tests must never call live STT/LLM/search APIs: use PydanticAI `TestModel`/`FunctionModel` and fake `Transcriber`/`SourceSearcher` implementations.
* UI changes: check them in the running app (`npm run dev`), including mobile width.

Tick acceptance items only when they are met. Anything not met is written down in the task, never ticked.

### 5.1 Independent Agent Review (Required Before Hand-Off)

Before committing or moving a task to `In review`, invoke a **separate, read-only reviewer subagent** (fresh context — never self-review) with the task file and the list of changed files/diff.

The reviewer must check:
1. **Acceptance & scope:** Every ticked acceptance item is met; no unrelated out-of-scope edits.
2. **Architecture & rules:** Compliance with `AGENTS.md` (especially the 8 Architecture Principles, protocol boundaries, no leaked vendor types, no live API calls in tests, no hardcoded secrets).
3. **Technical decisions:** Alignment with accepted files in `documentation/decisions/`.
4. **Stack standards:** Adherence to the relevant skills (`fastapi`, `python-type-safety`, `async-python-patterns`, `python-testing-patterns`, `typescript-standards`, `react-architecture`, `ui-design-core`).
5. **Correctness & tests:** Edge cases, error handling, and meaningful offline test coverage.

The reviewer responds with either **`APPROVE`** or **`CHANGES_REQUESTED`** (with specific file/line findings split into *blocking* vs. *minor*).

* If `CHANGES_REQUESTED`: resolve all blocking findings, re-run the section 5 verification commands, and message the same reviewer subagent to re-check until it returns `APPROVE` (escalate to the user if unresolved after 2 rounds).
* Record the reviewer's verdict and any changes made in the task's `Notes` section before committing.

---

## 6. Reporting

At the end of a session, give the user a short list: each task touched, its column now, its branch, its PR (if any), and anything blocked or open.
