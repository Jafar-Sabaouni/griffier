# Tailwind CSS Tokens (`ui-design-core`)

Use this reference when configuring or applying design tokens with Tailwind CSS (v4 `@theme` or v3 `tailwind.config.ts`). Rules and rationale live in `token-math.md`, `color-system.md`, and `typography.md`; this file is the implementation.

---

## 1. Tailwind v4 (`app/globals.css`)

Color tokens are derived at runtime, so they come from `css-tokens.md` §1b (copy it into `tokens.css`). Geometry and fonts live in `@theme`, which is their single source in Tailwind projects. Do not also define them in `tokens.css`.

```css
@import "tailwindcss";
@import "./tokens.css"; /* css-tokens.md §1b: root inputs + derived colors */

@theme {
  /* Proportional Base-4 Radii (aligned to spacing scale: 1 unit = 0.25rem = 4px) */
  --radius-xs: 0.25rem;   /* 4px  = p-1   */
  --radius-sm: 0.375rem;  /* 6px  = p-1.5 */
  --radius-md: 0.5rem;    /* 8px  = p-2   */
  --radius-lg: 0.75rem;   /* 12px = p-3   */
  --radius-xl: 1rem;      /* 16px = p-4   */
  --radius-2xl: 1.5rem;   /* 24px = p-6   */
  --radius-3xl: 2rem;     /* 32px = p-8   */

  /* Coordinated Control Heights */
  --spacing-control-sm: 2rem;    /* 32px (h-8)  */
  --spacing-control-md: 2.5rem;  /* 40px (h-10) */
  --spacing-control-lg: 3rem;    /* 48px (h-12) */

  /* Font Roles (families come from the design brief) */
  --font-body: "<Body Family>", system-ui, sans-serif;
  --font-heading: "<Heading Family>", var(--font-body);
  /* --font-accent: "<Brand Lettering>", var(--font-heading); */

  /* Snap the two hero sizes to the 4px grid (Tailwind defaults use line-height 1) */
  --text-5xl--line-height: 3.25rem;
  --text-6xl--line-height: 4rem;
}

/* inline: utilities reference the runtime variables, so theme switches apply */
@theme inline {
  /* Semantic Contrast Surfaces */
  --color-canvas: var(--bg-canvas);
  --color-surface-1: var(--bg-surface-1);
  --color-surface-2: var(--bg-surface-2);
  --color-surface-3: var(--bg-surface-3);
  --color-surface-interactive: var(--bg-surface-interactive);

  /* Semantic Text Hierarchy */
  --color-fg-primary: var(--text-primary);
  --color-fg-secondary: var(--text-secondary);
  --color-fg-muted: var(--text-muted);

  /* Accent (reserved for actions, active states, key highlights) */
  --color-accent: var(--accent);
  --color-accent-hover: var(--accent-hover);
  --color-accent-fg: var(--accent-fg);
  --color-accent-subtle: var(--accent-subtle);

  /* Status (never reuses accent) */
  --color-success: var(--success);
  --color-warning: var(--warning);
  --color-danger: var(--danger);

  /* Same-Background-Only Border Token & Focus */
  --color-border-same-surface: var(--border-same-bg);
  --color-ring-focus: var(--ring-focus);
}
```

---

## 2. Tailwind v3 (`tailwind.config.ts` Counterpart)

Import `tokens.css` (css-tokens.md §1b) from the global stylesheet, then map:

```typescript
import type { Config } from "tailwindcss";

export default {
  theme: {
    extend: {
      borderRadius: {
        xs: "0.25rem",   // 4px  (matches p-1)
        sm: "0.375rem",  // 6px  (matches p-1.5)
        md: "0.5rem",    // 8px  (matches p-2)
        lg: "0.75rem",   // 12px (matches p-3)
        xl: "1rem",      // 16px (matches p-4)
        "2xl": "1.5rem", // 24px (matches p-6)
        "3xl": "2rem",   // 32px (matches p-8)
      },
      colors: {
        canvas: "var(--bg-canvas)",
        surface: {
          1: "var(--bg-surface-1)",
          2: "var(--bg-surface-2)",
          3: "var(--bg-surface-3)",
          interactive: "var(--bg-surface-interactive)",
        },
        fg: {
          primary: "var(--text-primary)",
          secondary: "var(--text-secondary)",
          muted: "var(--text-muted)",
        },
        accent: {
          DEFAULT: "var(--accent)",
          hover: "var(--accent-hover)",
          fg: "var(--accent-fg)",
          subtle: "var(--accent-subtle)",
        },
        success: "var(--success)",
        warning: "var(--warning)",
        danger: "var(--danger)",
        "border-same-surface": "var(--border-same-bg)",
        "ring-focus": "var(--ring-focus)",
      },
      fontFamily: {
        body: ["<Body Family>", "system-ui", "sans-serif"],
        heading: ["<Heading Family>", "system-ui", "sans-serif"],
      },
      height: {
        "control-sm": "2rem",   // 32px
        "control-md": "2.5rem", // 40px
        "control-lg": "3rem",   // 48px
      },
    },
  },
} satisfies Config;
```

---

## 3. Derived Nested Radii (Themeable)

Hand-picked `rounded-*` classes only stay concentric while the radius scale is fixed. When the radius is themeable, let the parent publish its radius and inset and let children derive theirs:

```css
/* v4: globals.css */
@utility nest-card {
  --nest-r: var(--radius-xl);
  --nest-p: calc(var(--spacing) * 2);
  border-radius: var(--nest-r);
  padding: var(--nest-p);
}

@utility rounded-nested {
  border-radius: max(0px, calc(var(--nest-r) - var(--nest-p)));
}
```

```html
<div class="nest-card bg-surface-1">
  <div class="rounded-nested bg-surface-2 p-3">Content</div>
</div>
```

In v3, write the same two classes inside `@layer components` using `var(--radius-xl)` and `0.5rem`. One nesting level per element: a child that is itself a container gets its own `nest-*` recipe.

---

## 4. Tailwind Anti-Patterns vs. Canonical Patterns

### Rule A: Surface Contrast vs. Decorative Borders

```html
<!-- ❌ BAD: Different backgrounds + decorative border + mismatched radii -->
<div class="bg-zinc-900 p-4 rounded-xl border border-zinc-800">
  <div class="bg-zinc-800 p-3 rounded-xl border border-zinc-700">
    Content
  </div>
</div>

<!-- ✅ GOOD: Contrast-only separation + concentric radii (16px outer - 8px pad = 8px inner) -->
<div class="bg-surface-1 p-2 rounded-xl">
  <div class="bg-surface-2 p-3 rounded-md">
    Content
  </div>
</div>
```

### Rule B: Coordinated Control Sizing

```html
<!-- ❌ BAD: Sibling controls with mismatched heights and double borders -->
<div class="flex gap-2">
  <input class="h-9 px-3 border border-zinc-300 rounded" />
  <button class="h-10 px-4 border border-zinc-300 rounded">Submit</button>
</div>

<!-- ✅ GOOD: Unified height tokens, borderless contrast, accent only on the primary action -->
<div class="flex gap-2">
  <input class="h-control-md px-3 bg-surface-2 rounded-md outline-none focus-visible:ring-2 focus-visible:ring-ring-focus" />
  <button class="h-control-md px-4 bg-accent hover:bg-accent-hover text-accent-fg font-medium rounded-md">
    Submit
  </button>
</div>
```

### Rule C: Compound Control (button inside input)

```html
<!-- control-md (40px) outer, 4px inset → 32px inner button, 8px - 4px = 4px inner radius -->
<div class="flex items-center gap-1 h-control-md p-1 ps-3 bg-surface-2 rounded-md focus-within:ring-2 focus-within:ring-ring-focus">
  <input class="flex-1 min-w-0 bg-transparent outline-none text-fg-primary placeholder:text-fg-muted" placeholder="Search..." />
  <button class="h-control-sm px-3 bg-accent hover:bg-accent-hover text-accent-fg rounded-xs">Search</button>
</div>
```

### Rule D: Accent Is Reserved

```html
<!-- ❌ BAD: Accent as decoration -->
<section class="bg-accent text-accent-fg">…</section>

<!-- ✅ GOOD: Accent marks the active item; the rest uses surfaces -->
<nav class="flex gap-1 p-1 bg-surface-1 rounded-lg">
  <a class="px-3 py-1.5 rounded-md bg-accent-subtle text-fg-primary" aria-current="page">Overview</a>
  <a class="px-3 py-1.5 rounded-md text-fg-secondary hover:bg-surface-2">Settings</a>
</nav>
```
