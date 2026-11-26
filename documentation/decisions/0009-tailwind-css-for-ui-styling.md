# 0009: Use Tailwind CSS for UI Styling

- **Status:** Accepted
- **Date:** 2026-11-26

## Decision

Griffier uses **Tailwind CSS** paired with the semantic CSS custom-property tokens in `frontend/src/styles/tokens.css` (`@theme` mapping). Components consume semantic Tailwind utilities (`bg-surface-canvas`, `text-transcript-active`, `rounded-md`) rather than raw Tailwind color palettes (`zinc-800`, `gray-500`) or arbitrary pixel values.

## Why

Tailwind CSS is a deliberate developer choice driven by speed, familiarity, and theming flexibility:

- **Fast iteration:** Composing layouts, spacing, responsive split-screen breakpoints, and focus/hover states directly in JSX eliminates stylesheet boilerplate on an ~8-hour prototype.
- **First-class theming:** Binding Tailwind's `@theme` tokens to CSS custom properties (`[data-theme="monochrome-light"]`, dark mode, or custom palettes) allows switching the entire app's theme by changing root variables without editing components.
- **Consistent editorial UI:** Works naturally alongside `ui-design-core` rules and small reusable primitives (`Button`, `Badge`, `Card`, `Skeleton`, `SplitPane`) without imposing a third-party widget library's look.

## Alternatives Considered

- **Vanilla CSS / CSS Modules:** Full control with zero extra tooling, but slower for responsive layouts and interactive states during a tight prototype timeline.
- **Pre-styled UI libraries (MUI, Ant Design, Chakra):** Ship heavy visual defaults that fight Griffier's minimal monochrome editorial design brief.

## Trade-offs

- **Risk of raw utility drift:** Utility classes can bypass the design system if raw palette classes (`gray-600`, `bg-[#111]`) sneak into components. Mitigated by enforcing semantic theme tokens (`documentation/ui/theme-tokens.md`) and extracting repeated patterns into `frontend/src/components/ui/`.
