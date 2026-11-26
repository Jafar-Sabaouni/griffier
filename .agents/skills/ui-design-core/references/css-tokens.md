# Vanilla CSS & CSS Modules Tokens (`ui-design-core`)

Use this reference when building or styling components using plain CSS, CSS Modules, or CSS-in-JS without Tailwind. Rules and rationale live in `token-math.md`, `color-system.md`, and `typography.md`; this file is the implementation.

---

## 1. Token Foundation (`tokens.css`)

Copy or import into the root stylesheet (e.g. `globals.css` or `tokens.css`). Tailwind projects import only §1b (see `tailwind-tokens.md`).

### 1a. Geometry

```css
:root {
  /* Proportional Base-4 Spacing Scale (1 unit = 4px = 0.25rem) */
  --space-0-5: 0.125rem; /* 2px  */
  --space-1:   0.25rem;  /* 4px  */
  --space-1-5: 0.375rem; /* 6px  */
  --space-2:   0.5rem;   /* 8px  */
  --space-3:   0.75rem;  /* 12px */
  --space-4:   1rem;     /* 16px */
  --space-5:   1.25rem;  /* 20px */
  --space-6:   1.5rem;   /* 24px */
  --space-8:   2rem;     /* 32px */
  --space-10:  2.5rem;   /* 40px */
  --space-12:  3rem;     /* 48px */
  --space-16:  4rem;     /* 64px */

  /* Relational Concentric Radii (Coupled to spacing units) */
  --radius-xs:  0.25rem;  /* 4px  - matches space-1   */
  --radius-sm:  0.375rem; /* 6px  - matches space-1-5 */
  --radius-md:  0.5rem;   /* 8px  - matches space-2   */
  --radius-lg:  0.75rem;  /* 12px - matches space-3   */
  --radius-xl:  1rem;     /* 16px - matches space-4   */
  --radius-2xl: 1.5rem;   /* 24px - matches space-6   */
  --radius-3xl: 2rem;     /* 32px - matches space-8   */
  --radius-full: 9999px;  /* strictly for avatars, badges, and pill tags */

  /* Coordinated Control Sizing */
  --control-sm: 2rem;    /* 32px */
  --control-md: 2.5rem;  /* 40px */
  --control-lg: 3rem;    /* 48px */
}
```

### 1b. Color (derived from root inputs)

Only the root inputs change per theme. Derived tokens are declared on `:root, [data-theme]` so a theme set on a subtree recomputes them there too.

```css
/* Root inputs: Light Theme Default */
:root {
  --bg-canvas:    oklch(0.985 0.004 260);
  --surface-dir:  -1;
  --surface-step: 0.03;
  --accent:       oklch(0.55 0.2 260);

  --success: oklch(0.6 0.15 150);
  --warning: oklch(0.75 0.15 75);
  --danger:  oklch(0.58 0.2 25);
}

/* Root inputs: Dark Theme (system preference, unless light is forced) */
@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) {
    --bg-canvas:    oklch(0.13 0.006 260);
    --surface-dir:  1;
    --surface-step: 0.045;
    --accent:       oklch(0.68 0.17 260);
  }
}

/* Root inputs: Dark Theme (forced) */
[data-theme="dark"] {
  --bg-canvas:    oklch(0.13 0.006 260);
  --surface-dir:  1;
  --surface-step: 0.045;
  --accent:       oklch(0.68 0.17 260);
}

/* Derived tokens: never override these per theme */
:root, [data-theme] {
  /* Surfaces: canvas moved N steps in --surface-dir */
  --bg-surface-1:           oklch(from var(--bg-canvas) clamp(0, calc(l + 1 * var(--surface-dir) * var(--surface-step)), 1) c h);
  --bg-surface-2:           oklch(from var(--bg-canvas) clamp(0, calc(l + 2 * var(--surface-dir) * var(--surface-step)), 1) c h);
  --bg-surface-3:           oklch(from var(--bg-canvas) clamp(0, calc(l + 3 * var(--surface-dir) * var(--surface-step)), 1) c h);
  --bg-surface-interactive: oklch(from var(--bg-canvas) clamp(0, calc(l + 4 * var(--surface-dir) * var(--surface-step)), 1) c h);
  --border-same-bg:         oklch(from var(--bg-canvas) clamp(0, calc(l + 2.5 * var(--surface-dir) * var(--surface-step)), 1) c h);

  /* Text: far from canvas in the same direction */
  --text-primary:   oklch(from var(--bg-canvas) clamp(0, calc(l + var(--surface-dir) * 0.82), 1) c h);
  --text-secondary: oklch(from var(--bg-canvas) clamp(0, calc(l + var(--surface-dir) * 0.55), 1) c h);
  --text-muted:     oklch(from var(--bg-canvas) clamp(0, calc(l + var(--surface-dir) * 0.40), 1) c h);

  /* Accent */
  --accent-hover:  oklch(from var(--accent) clamp(0, calc(l + var(--surface-dir) * 0.05), 1) c h);
  --accent-fg:     oklch(from var(--accent) clamp(0, calc((0.65 - l) * 1000), 1) 0 0); /* white on dark accents, black on light */
  --accent-subtle: color-mix(in oklch, var(--accent) 14%, var(--bg-surface-1));

  /* Functional Focus State */
  --ring-focus: var(--accent);
}
```

Relative color syntax needs Chrome 119+, Safari 18+, or Firefox 128+. If older browsers matter, add static fallback values above the derived block inside `@supports not (color: oklch(from red l c h))`.

### 1c. Typography

```css
:root {
  /* Font roles: families come from the design brief (typography.md §2) */
  --font-body:    "<Body Family>", system-ui, sans-serif;
  --font-heading: "<Heading Family>", var(--font-body);
  /* --font-accent: "<Brand Lettering>", var(--font-heading);  only if the brand has custom lettering */
  --font-mono:    ui-monospace, "SF Mono", Menlo, monospace;

  /* 4px-snapped scale: size / line height */
  --text-xs:   0.75rem;  --leading-xs:   1rem;
  --text-sm:   0.875rem; --leading-sm:   1.25rem;
  --text-base: 1rem;     --leading-base: 1.5rem;
  --text-lg:   1.125rem; --leading-lg:   1.75rem;
  --text-xl:   1.25rem;  --leading-xl:   1.75rem;
  --text-2xl:  1.5rem;   --leading-2xl:  2rem;
  --text-3xl:  1.875rem; --leading-3xl:  2.25rem;
  --text-4xl:  2.25rem;  --leading-4xl:  2.5rem;
  --text-5xl:  3rem;     --leading-5xl:  3.25rem;
  --text-6xl:  3.75rem;  --leading-6xl:  4rem;
}

body { font-family: var(--font-body); font-size: var(--text-base); line-height: var(--leading-base); }
h1, h2, h3 { font-family: var(--font-heading); }
```

---

## 2. Dynamic Concentric Containers in Pure CSS

Avoid hardcoding mismatched inner radii. Derive inner radius mathematically:

```css
/* Outer Card Container */
.surface-card {
  --card-radius: var(--radius-xl); /* 16px */
  --card-padding: var(--space-2);  /* 8px */

  background-color: var(--bg-surface-1);
  padding: var(--card-padding);
  border-radius: var(--card-radius);
  /* NOTE: NO decorative border when on --bg-canvas */
}

/* Inner Nested Container */
.surface-card-inner {
  background-color: var(--bg-surface-2);
  /* Concentric formula: max(0, R_outer - P_inset) */
  border-radius: max(0px, calc(var(--card-radius) - var(--card-padding))); /* 16px - 8px = 8px */
  padding: var(--space-3);
  /* NOTE: NO border between surface-1 and surface-2 */
}
```

---

## 3. Utility Classes (Non-Tailwind Projects)

```css
/* Surfaces */
.bg-canvas    { background-color: var(--bg-canvas); }
.bg-surface-1 { background-color: var(--bg-surface-1); }
.bg-surface-2 { background-color: var(--bg-surface-2); }
.bg-surface-3 { background-color: var(--bg-surface-3); }

/* Text */
.text-primary   { color: var(--text-primary); }
.text-secondary { color: var(--text-secondary); }
.text-muted     { color: var(--text-muted); }

/* Control Heights */
.control-sm { height: var(--control-sm); }
.control-md { height: var(--control-md); }
.control-lg { height: var(--control-lg); }

/* Border strictly when child shares identical background with parent */
.border-same-surface {
  border: 1px solid var(--border-same-bg);
}

/* Functional Focus Ring */
.focus-ring:focus-visible {
  outline: 2px solid var(--ring-focus);
  outline-offset: 2px;
}
```

---

## 4. Pure CSS Component Recipes

### Coordinated Input & Button Group
```css
.input-control {
  height: var(--control-md); /* 40px */
  padding: 0 var(--space-3);
  background-color: var(--bg-surface-2);
  color: var(--text-primary);
  border: none;
  border-radius: var(--radius-md);
}

.input-control:focus-visible {
  outline: 2px solid var(--ring-focus);
  outline-offset: 1px;
}

.button-control {
  height: var(--control-md); /* 40px */
  padding: 0 var(--space-4);
  background-color: var(--bg-surface-3);
  color: var(--text-primary);
  font-weight: 500;
  border: none;
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: background-color 150ms ease;
}

.button-control:hover {
  background-color: var(--bg-surface-interactive);
}

/* Primary action: the one accent element in this region */
.button-control.is-primary {
  background-color: var(--accent);
  color: var(--accent-fg);
}

.button-control.is-primary:hover {
  background-color: var(--accent-hover);
}
```

### Compound Search Bar (button inside input)
```css
.compound-control {
  --cc-height: var(--control-md);  /* 40px, matches standalone siblings */
  --cc-radius: var(--radius-md);   /* 8px */
  --cc-inset:  var(--space-1);     /* 4px */

  display: flex;
  align-items: center;
  gap: var(--cc-inset);
  height: var(--cc-height);
  padding: var(--cc-inset);
  padding-inline-start: var(--space-3);
  background-color: var(--bg-surface-2);
  border-radius: var(--cc-radius);
}

.compound-control:focus-within {
  outline: 2px solid var(--ring-focus);
  outline-offset: 1px;
}

.compound-control > input {
  flex: 1;
  min-width: 0;
  background: transparent;
  border: none;
  outline: none;
  color: var(--text-primary);
}

.compound-control > button {
  height: calc(var(--cc-height) - 2 * var(--cc-inset));                 /* 32px */
  border-radius: max(0px, calc(var(--cc-radius) - var(--cc-inset)));   /* 4px  */
  padding: 0 var(--space-3);
  border: none;
  background-color: var(--accent);
  color: var(--accent-fg);
}
```
