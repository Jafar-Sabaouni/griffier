# UI Theme & Token System

Griffier uses **Tailwind CSS** ([0009](../decisions/0009-tailwind-css-for-ui-styling.md)) backed by a relational CSS custom-property token system (`frontend/src/styles/tokens.css`) aligned with `.agents/skills/ui-design-core/SKILL.md`. Components consume only semantic tokens mapped through Tailwind's `@theme` block — never raw hex codes, raw Tailwind palette utilities (`zinc-800`, `gray-500`), or ad-hoc pixel values.

## Default Theme: Monochrome Light

Black, white, and neutral grays keep the interface calm and legible, while isolating every color behind semantic tokens so switching themes (such as dark mode or custom brand colors) requires only changing `:root` / `[data-theme="..."]` variables.

```css
:root,
[data-theme="monochrome-light"] {
  /* Surfaces (derived steps from canvas) */
  --surface-canvas: #ffffff;
  --surface-subtle: #f7f7f7;
  --surface-raised: #efefef;
  --surface-hover: #eaeaea;
  --surface-inverse: #111111;  /* Primary black buttons & tooltips */

  /* Text */
  --text-primary: #111111;
  --text-secondary: #525252;
  --text-muted: #737373;
  --text-inverse: #ffffff;
  --text-transcript-inactive: #737373; /* Spoken text when not currently playing */
  --text-transcript-active: #111111;   /* Spoken text while currently playing */

  /* Functional borders & focus */
  --border-subtle: #e5e5e5;
  --border-strong: #d4d4d4;
  --focus-ring: #111111;

  /* Accent & distinct fact-check marks (separate from playback text color) */
  --accent-primary: #111111;
  --accent-primary-hover: #262626;
  --mark-ai-bg: #f0f0f0;
  --mark-ai-underline: #a3a3a3;
  --mark-journalist-bg: #dedede;
  --mark-journalist-border: #111111;
  --status-danger: #991b1b;
  --status-danger-bg: #fef2f2;

  /* Base-4 spacing scale */
  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-6: 24px;
  --space-8: 32px;

  /* Concentric base-4 radii (R_inner = max(0, R_outer - P_inset)) */
  --radius-xs: 4px;
  --radius-sm: 6px;
  --radius-md: 8px;
  --radius-lg: 12px;
  --radius-xl: 16px;
  --radius-2xl: 24px;
  --radius-pill: 9999px;

  /* Matching control heights */
  --control-sm: 32px;
  --control-md: 40px;
  --control-lg: 48px;

  /* Typography roles */
  --font-body: "Inter", system-ui, -apple-system, sans-serif;
  --font-heading: "Inter", system-ui, -apple-system, sans-serif;
  --font-mono: ui-monospace, SFMono-Regular, Menlo, monospace;

  /* Floating layers only */
  --shadow-floating: 0 8px 24px rgba(17, 17, 17, 0.08), 0 2px 6px rgba(17, 17, 17, 0.04);
}
```

## Theme Switching

Because all components reference semantic variables (`--surface-*`, `--text-*`, `--accent-*`, `--mark-*`), adding a dark theme or custom newsroom palette only requires adding a `[data-theme="monochrome-dark"]` (or custom) block overriding the surface/text/border tokens — with zero component edits.

## Token Discipline Rules

1. **No raw values in components:** Components never hardcode `#111`, `rgb(...)`, or arbitrary pixel spacings.
2. **Concentric radii:** Nested elements step radius down by their parent's padding (`R_inner = max(0, R_outer - P_inset)`).
3. **Sibling height parity:** Adjacent controls (such as **Start recording** and the round **Upload** button) share the same `--control-lg` height.
4. **Surface contrast over borders:** Prefer `--surface-subtle` / `--surface-raised` / `--surface-hover` contrast; use `--border-subtle` only for structural dividers, inputs, and floating menus.
