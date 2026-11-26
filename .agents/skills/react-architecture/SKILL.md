---
name: react-architecture
description: "Enforces clean React component composition, semantic variant APIs, strict hook and state discipline (zero derived-state useEffects), and dependency-aware component refactoring with persistent audit tracking. Mount when building, reviewing, or refactoring React/Next.js components and hooks."
tags: [react, typescript, hooks, state-management, component-api, refactoring, frontend]
allowedTools:
  - read_file
  - write_file
  - apply_patch
  - find_files
  - search_code
  - manage_command
  - create_workdoc
  - update_workdoc
tier: on-demand
---

# React Architecture (`react-architecture`)

## Objectives & Core Guidelines

### 1. Component Composition & Semantic Prop APIs
- **Composition Over Boolean Prop Explosion**: Never accumulate conflicting boolean props (`<Button isPrimary isOutline isSmall isCompact />`). Use explicit semantic union variants (`variant: "primary" | "secondary" | "ghost"`, `size: "sm" | "md" | "lg"`).
- **Compound Component Contracts**: Build multi-part controls (`Select`, `Tabs`, `InputGroup`, `Dialog`) as compound components sharing a scoped internal Context so parent-child sizing, disabled states, and accessibility attributes (`aria-*`, `id`) coordinate automatically.
- **Preserve Public Contracts**: When refactoring existing components, preserve public prop interfaces unless unifying a broken/inconsistent pattern across all call sites.

### 2. State & Hook Discipline (Zero Derived-State Effects)
- **Calculate During Render**: NEVER use `useEffect` + `useState` to compute values that can be derived synchronously from existing props or state during render.
- **Events Over Effects**: Handle user-triggered actions directly inside event handlers (`onClick`, `onSubmit`, `onChange`), not by setting a flag and reacting to it inside a `useEffect`.
- **Effects are Strictly for External Synchronization**: Reserve `useEffect` exclusively for synchronizing React with non-React systems (DOM observers, WebSockets, timers, third-party imperative libraries) and always return a deterministic cleanup function.
- **Scoped Contexts**: Do not dump high-frequency changing state and static configuration into a single monolithic Context. Split contexts by update frequency or pass children via composition to avoid subtree re-renders.
- **Intentional Memoization**: Do not blindly wrap every function or value in `useCallback`/`useMemo`. Apply them only when passing references to memoized subtrees, stabilizing effect dependencies, or caching genuinely expensive $O(N)$ calculations.

### 3. Strict TypeScript & Accessibility
- **Zero `any` or Unsafe Casts**: Extend native HTML element attributes (`React.ComponentPropsWithoutRef<"button">`) and forward refs (`ref` prop in React 19 or `forwardRef` in React 18).
- **Semantic HTML First**: Use native `<button>`, `<input>`, `<dialog>`, and `<nav>` elements with proper keyboard navigation (`Enter`, `Space`, `Escape`, Arrow keys) and preserved `focus-visible` states.

---

## Operational Workflow

### Phase 1: Dependency-Aware Discovery & Inventory
Before modifying shared UI primitives or hooks:
1. Use `search_code` and `find_files` to trace every consumer of the target component or hook across the repository.
2. Read `references/hooks-and-composition-patterns.md` via `read_file` to align with canonical patterns.
3. For multi-component refactors, initialize a persistent audit tracker using `create_workdoc` (or write `.orbicus/audits/react-component-inventory.md`) based on `references/component-audit-tracker-template.md`.
   - Every relevant component must be tracked with an explicit status: `not-audited` | `audited` | `needs-changes` | `refactored` | `verified` | `blocked` | `intentionally-unchanged`.

### Phase 2: Refactor Foundations Before Consumers
Execute changes in small, buildable batches ordered by dependency depth:
1. **Batch 1 — Shared Primitives & Compound Contracts**: Refactor base controls (`Button`, `Input`, `Surface`, `Select`, `Modal`) and shared custom hooks.
2. **Batch 2 — Call-Site & Consumer Migration**: Inspect both modified and unmodified dependent components. Update prop usage, remove redundant local wrapper styles, and eliminate duplicated state logic.
3. **Batch 3 — Anti-Pattern Sweep**: Use `search_code` to hunt down:
   - `useEffect` blocks calling `setState` synchronously from props.
   - Uncleaned `addEventListener`, `setInterval`, or `AbortController` instances.
   - Duplicated local components that bypass shared primitives.

### Phase 3: Verification & Inventory Sign-Off
After each batch:
1. Run typechecking (`tsc --noEmit`), linting, and unit/component tests via `manage_command`.
2. Update the component inventory statuses via `update_workdoc` or `apply_patch`.
3. Never mark a refactor complete until every affected consumer is in the `verified` or documented `intentionally-unchanged` state.
