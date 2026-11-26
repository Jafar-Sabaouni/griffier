# Color System: Surfaces, Text & Accent (`ui-design-core`)

Colors are derived from a few root values (canvas, surface step, accent) with OKLCH relative color syntax, so any theme, including an extreme user-picked one, keeps its layer steps and readable text. Implementations are in `css-tokens.md` and `tailwind-tokens.md`.

---

## 1. Root Inputs

A theme is defined by these values only. Everything else is computed.

| Input | Meaning | Light default | Dark default |
| :--- | :--- | :--- | :--- |
| `--bg-canvas` | Root page background | `oklch(0.985 0.004 260)` | `oklch(0.13 0.006 260)` |
| `--surface-dir` | Direction each layer moves in lightness | `-1` (darker) | `1` (lighter) |
| `--surface-step` | Lightness change per layer | `0.03` | `0.045` |
| `--accent` | Brand / action color | `oklch(0.55 0.2 260)` | `oklch(0.68 0.17 260)` |

The canvas hue and chroma come from the design brief. Light themes start the canvas no lower than `l = 0.92`; dark themes no higher than `l = 0.22`, so three steps still fit inside `0..1`.

---

## 2. Derived Surfaces

Each surface is the canvas moved `N` steps in `--surface-dir`, keeping the canvas hue and chroma:

$$L_{\text{surface-}N} = L_{\text{canvas}} + N \times \text{dir} \times \text{step}$$

| Token | Layer | Role | Border allowed? |
| :--- | :--- | :--- | :--- |
| `--bg-canvas` | 0 | Root page background | No |
| `--bg-surface-1` | 1 | Cards, sidebars, panels | No (contrasts with canvas) |
| `--bg-surface-2` | 2 | Inset wells, code blocks, inputs | No (contrasts with surface-1) |
| `--bg-surface-3` | 3 | Hover plates, active pills, popovers | No (contrasts with surface-2) |
| `--bg-surface-interactive` | 4 | Pressed states | No |
| `--border-same-bg` | 2.5 | Divider or bound when parent and child share a background | **Only** when parent == child bg |

- Keep `--surface-step ≥ 0.025` so adjacent layers stay distinguishable.
- Never compensate for weak steps with shadows. Shadows are reserved for floating layers (modals, dropdowns, tooltips).
- **Decorative borders are forbidden** between different surfaces. **Functional borders are always kept**: `focus-visible` rings, validation rings, selection rings, and text-input boundaries on matching backgrounds.

---

## 3. Derived Text

Text moves far from the canvas in the same direction, so it stays readable on every surface:

| Token | Offset from canvas `l` | Use |
| :--- | :--- | :--- |
| `--text-primary` | `dir × 0.82` | Body, headings, labels |
| `--text-secondary` | `dir × 0.55` | Supporting text, metadata |
| `--text-muted` | `dir × 0.40` | Placeholders, disabled, non-essential hints |

Contrast floors to check on the **topmost** surface the text sits on (`surface-3` in the worst case): primary ≥ 7:1, secondary ≥ 4.5:1, muted ≥ 3:1 (large or non-essential text only). OKLCH lightness only approximates WCAG contrast; verify extreme themes with a contrast checker.

---

## 4. Accent

| Token | Derivation | Use |
| :--- | :--- | :--- |
| `--accent` | Root input | Primary button, active tab/nav indicator, links, key brand highlight |
| `--accent-hover` | accent `l + dir × 0.05` | Hover / pressed on accent elements |
| `--accent-fg` | black or white, picked from accent `l` (threshold `0.65`) | Text and icons on accent |
| `--accent-subtle` | accent mixed 14% into `--bg-surface-1` | Selected rows, active nav background |
| `--ring-focus` | `var(--accent)` | Focus rings |

Rules:
- **Reserved, not decorative.** Accent marks what is interactive or currently active. No accent section backgrounds, decorative blobs, or accent body text.
- **One primary action per view region.** Secondary actions use `surface-2/3` buttons.
- **Status colors are separate.** Success, warning, and danger get their own tokens and never reuse the accent, so swapping the accent never changes meaning.
- Because `--accent-fg` is computed from the accent's lightness, any accent the user picks keeps readable button text.
