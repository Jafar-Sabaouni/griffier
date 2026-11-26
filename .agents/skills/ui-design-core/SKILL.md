---
name: ui-design-core
description: "Designs distinctive, research-grounded interfaces and landing pages on a relational token system (spacing, nested radii, derived surfaces, accent, typography) for CSS and Tailwind. Mount this skill whenever designing new UI or pages, building or changing a theme, or refactoring and auditing tokens, spacing, radii, or surface hierarchies."
tags: [design-system, css, tailwind, tokens, ui, theming, typography, landing-page, contrast, geometry]
allowedTools:
  - read_file
  - write_file
  - apply_patch
  - find_files
  - search_code
tier: on-demand
author: JafarS  
version: 1.4.0
last_update: 2026-10-25
---

# UI Design Core (`ui-design-core`)

Two halves: **identity** keeps the design from being generic, **theme math** keeps it from breaking when token values change (including extreme user-picked themes). Every rule below is detailed in a reference file; read the ones your task needs.

## Core Rules

### Identity
1. **Research before code.** Audit category clichés, borrow from the domain's physical context, commit to one aesthetic direction, and write a design brief first. → `references/identity-and-research.md`
2. **Hero around one focal point.** Never default to a centered title over three equal cards. → `references/layout-and-hero.md`

### Theme Math
3. **Relational spacing.** Base-4 scale; child padding ≤ parent padding; sibling gap ≤ container padding. → `references/token-math.md`
4. **Concentric radii.** $R_{\text{inner}} = \max(0,\; R_{\text{outer}} - P_{\text{inset}})$. → `references/token-math.md`
5. **Matching control sizes.** Siblings share `control-sm/md/lg` heights; compound controls step their inner parts down by the inset. → `references/token-math.md`
6. **Surface contrast over borders.** Decorative borders only when child and parent share the exact same background token. Functional borders (focus, validation, selection, text inputs on matching backgrounds) are always kept. Shadows only for floating layers. → `references/color-system.md`
7. **Derived color.** Surfaces and text are computed from the canvas, so contrast holds when the theme changes. → `references/color-system.md`
8. **Accent is reserved** for primary actions, active/selected states, focus, and key brand highlights. Never decorative fills. → `references/color-system.md`
9. **Typography by role.** Body font (UI and controls), heading font (structure), optional accent font (brand lettering only). → `references/typography.md`

### Token Layers
Primitives (raw scales, ramps) → semantic tokens (surfaces, text, accent, radii, fonts) → component recipes. Components never use raw values or palette utilities (`zinc-800`, `#fff`, `13px`).

## Workflow

| Task | Read |
| :--- | :--- |
| New product UI, landing page, or brand theme | Steps 1 → 4 |
| Token or theme changes only | Steps 2 → 3 |
| Audit, migrate, or refactor existing code | Steps 2 → 3, then `references/refactoring-guide.md` |

1. **Identity.** Read `references/identity-and-research.md` and produce the design brief before writing UI code.
2. **Theme math.** Read `references/token-math.md`, `references/color-system.md`, and `references/typography.md`.
3. **Stack.** Read the implementation reference for the project:
   - Tailwind CSS (v3 / v4): `references/tailwind-tokens.md`
   - Vanilla CSS / CSS Modules: `references/css-tokens.md`
4. **Layout.** For pages and heroes, read `references/layout-and-hero.md`.

Before finishing, check the result against every Core Rule above.
