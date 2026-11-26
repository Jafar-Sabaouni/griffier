---
name: technical-decisions
description: >-
    Standards and workflow for writing Technical Decision Records (ADRs) in `documentation/decisions/`. Use whenever choosing an external provider, model, framework, architecture boundary, data contract, or notable trade-off, or when superseding an existing technical decision.
tier: on-demand
author: JafarS
version: 1.0.0
last_update: 2026-11-26
---

# Technical Decisions Skill

Record every meaningful architecture or technology choice in `documentation/decisions/` as a short, human-readable Markdown file. Each file explains **what was chosen** and **why**, so anyone reading the repo can follow the reasoning in under two minutes.

## When to Write One

Write a decision file when choosing an external model/provider, framework, core abstraction, data contract, or deliberate scope trade-off. Skip trivial refactors or local implementation details.

## Naming & Index

- **Location:** `documentation/decisions/NNNN-<kebab-case-slug>.md` (4-digit sequential ID, e.g., `0001-speech-to-text-assemblyai-stt-3-7.md`).
- **Index:** Add a row to `documentation/decisions/README.md` whenever a decision is added or its status changes.
- **Immutability:** Never delete or renumber an accepted decision. If a choice changes, write a new file and mark the old one `Superseded by NNNN`.
- **Statuses:** `Proposed`, `Accepted`, `Deprecated`, or `Superseded by NNNN`.

## Template

Keep each file short (~20–40 lines of clear prose). Avoid bloated context sections and heavy matrices.

```markdown
# NNNN: <Short Title>

- **Status:** Accepted
- **Date:** YYYY-MM-DD

## Decision

1–3 plain sentences stating what was chosen and where it sits in the architecture.

## Why

Short, human-readable explanation of why this choice fits Griffier's needs
(a brief paragraph or 3–4 focused bullets).

## Alternatives Considered

2–4 brief bullets naming the real alternatives and why they were not selected.

## Trade-offs

1–3 short bullets on what is given up and how the architecture handles it (if applicable).
```

## Writing Rules

1. **One decision per file.**
2. **Use an impersonal tone:** Do not use personal pronouns (`we`, `I`, `our`, `he`, `she`). Write from the project's or decision's perspective (e.g., *"The choice for `STT-3.7` came from..."* or *"Griffier uses..."*).
3. **Write for humans:** Plain, natural language. Lead with the decision and the reasoning — do not pad with background context the reader already knows.
4. **Stay concrete:** Mention real model names, costs, or constraints only where they actually drove the choice.
5. **Keep it short:** If a decision takes more than a minute to read, trim it.
