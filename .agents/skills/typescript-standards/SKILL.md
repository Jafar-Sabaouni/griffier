---
name: typescript-standards
description: >-
  Enforces production-ready, maintainable, flat, linear TypeScript (strict mode, zero any) targeting Node.js ESM. Mandates single-focused logic, standard library prioritization, dependency locking, as const discriminator guards, and rigorous build/test discipline. Use whenever writing, reviewing, or refactoring TypeScript code.
---

# TypeScript & Architecture Standards

Guidelines and rules for writing maintainable, production-ready TypeScript code across the repository.

---

## 1. Core Responsibilities

- **Strict TypeScript**: Write production-ready, maintainable, flat, linear TypeScript in strict mode with zero `any`.
- **Target Runtime**: Target **Node.js runtime + ESM**.
- **No Extraneous Comments/Docs**: Do not add comments or documentation unless explicitly requested.
- **First Path Hierarchy**:
  1. Does this feature need to exist? If not, skip it.
  2. Can this be solved using **only** the Node.js standard library? Use it.
  3. **Dependency Lock**: Avoid adding external libraries. Only use existing, highly trusted dependencies or essential external service SDKs.

---

## 2. Communication & Problem Breakdown

- **Be Direct**: Explain complex problems clearly and precisely without fluff, storytelling, unnecessary context, or rhetorical buildup.
- **Break Problems Down**: Separate complex problems into concrete parts and explain each part directly.
- **Explain the Why**: Briefly explain root causes, triggers, and practical consequences.
- **Prioritize Signal**: Lead with important information. Never bury answers under background explanations.
- **No Artificial Narratives**: Avoid turning technical topics into analogies, stories, or extended walkthroughs.
- **Concrete Language**: Use specific technical terms, exact error messages, and reproducible code over abstract explanations.
- **Separate Facts from Suggestions**: Clearly distinguish current behavior, required changes, and recommendations.

---

## 3. Architecture & Code Quality

- **Single-Focused Logic**: Every function, module, and file must have **one clear responsibility and one primary purpose**. Never combine unrelated logic into the same execution path.
- **Flat & Focused**: Use small files and tiny, single-responsibility functions. Keep code easy to understand without tracing unrelated side effects.
- **Split Mixed Concerns**: If a function begins handling multiple responsibilities (e.g. parsing, validation, persistence, response formatting), split them into separate functions coordinated by a thin orchestration layer.
- **Single Source of Truth & No Magic Strings**:
  - Never use raw string literals for statuses, action types, roles, or discriminators.
  - Define central `as const` objects with keys, values, and boolean type guards (`isX(val)`), and derive union types directly from them:
    ```typescript
    export const ActivityStatuses = {
      ACTIVE: "active",
      INACTIVE: "inactive",
      CEASED: "ceased",
    } as const;

    export type ActivityStatus = typeof ActivityStatuses[keyof typeof ActivityStatuses];
    export const isActivityStatus = (val: string): val is ActivityStatus =>
      Object.values(ActivityStatuses).includes(val as ActivityStatus);
    ```
- **No Inline Template / Logic Duplication**:
  - Never re-implement identical UI rows, cards, or primitives across multiple render branches.
  - Never duplicate string truncation (`slice(0, MAX) + "... [truncated]"`), character guards, or collapse/expand state across sibling components. Extract reusable primitives.
- **Composition Over Inheritance**: Compose focused functions rather than deep class hierarchies.
- **Control Flow**: Prefer early exits and guard clauses (`if (cond) return/throw/break;`) to eradicate `else` blocks and deep nesting.
- **Safety & Purity**: Prefer immutability and pure functions. Handle all errors explicitly with zero silent failures.
- **React State & Effects**:
  - Never set state inside a `useEffect`.
  - Derive values synchronously during render or handle updates in event handlers.
  - Reserve `useEffect` strictly for external side effects (DOM APIs, timers, subscriptions, system synchronization) and ensure clean teardowns.
- **Resource Management**: Always clean up `setTimeout`, `setInterval`, stream handles, and event listeners cleanly.

---

## 4. API Workflow & Testing

Develop feature-by-feature. After each implementation:

1. Summarize modifications clearly.
2. Run existing tests **before** modifying them.
3. If tests fail, explain why. If behavior changed intentionally, propose test updates first.
4. Update tests only after approval, ensure they pass, then execute the build.

---

## 5. Build & Repository Safety

- **Always Run Build**: Run `npm run build` after every implementation. If it fails: diagnose, outline a plan, fix, and re-run until fully passing.
- **Definition of Done**: Logic complete + existing tests passing + build fully passing.
- **Repository Safety**: Never execute Git commands that alter commits, branches, history, remotes, working tree, or staged files without explicit user permission.
