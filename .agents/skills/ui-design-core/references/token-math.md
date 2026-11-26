# Relational Token Math (`ui-design-core`)

Spacing, radius, and control sizes are all multiples of one base unit, so they stay related when any value changes. Colors live in `color-system.md`.

---

## 1. Proportional Base-4 Spacing & Radius Scale
Every spacing and radius token is a multiple of the base unit ($\text{u} = 4\text{px} = 0.25\text{rem}$). This guarantees that $N \times \text{token}_a = \text{token}_b$.

| Token | Value (px) | Value (rem) | Additive / Multiplicative Relation | Matching Radius Token |
| :--- | :--- | :--- | :--- | :--- |
| `space-1` | `4px` | `0.25rem` | $1\text{u}$ (Base unit) | `radius-xs` (`4px`) |
| `space-1.5` | `6px` | `0.375rem` | $1.5\text{u}$ | `radius-sm` (`6px`) |
| `space-2` | `8px` | `0.5rem` | $2 \times \text{space-1}$ | `radius-md` (`8px`) |
| `space-3` | `12px` | `0.75rem` | $\text{space-1} + \text{space-2}$ | `radius-lg` (`12px`) |
| `space-4` | `16px` | `1.0rem` | $2 \times \text{space-2}$ | `radius-xl` (`16px`) |
| `space-6` | `24px` | `1.5rem` | $\text{space-2} + \text{space-4}$ | `radius-2xl` (`24px`) |
| `space-8` | `32px` | `2.0rem` | $2 \times \text{space-4}$ | `radius-3xl` (`32px`) |
| `space-10` | `40px` | `2.5rem` | $\text{space-2} + \text{space-8}$ | — |
| `space-12` | `48px` | `3.0rem` | $2 \times \text{space-6}$ | — |
| `space-16` | `64px` | `4.0rem` | $2 \times \text{space-8}$ | — |

Never use values off this scale (`13px`, `19px`, `h-[38px]`).

---

## 2. Layered Spacing

When surfaces stack (page → section → card → inner well → item), spacing steps down so every layer reads as belonging to its parent:

1. **Child padding ≤ parent padding.** Each nesting level uses the same or a smaller padding token.
2. **Sibling gap ≤ container padding.** Items inside a container sit closer to each other than to the container edge (proximity).
3. **Between-group gap > within-group gap.** Separate groups by at least one scale step more than the items inside them.

| Layer | Padding | Gap between children |
| :--- | :--- | :--- |
| Page section | `space-16` / `space-12` (vertical), `space-6` (horizontal) | `space-8` |
| Sidebar / panel | `space-4` | `space-3` |
| Card | `space-4` or `space-2` (see radii) | `space-3` / `space-2` |
| Inner well | `space-3` | `space-2` |
| List item / chip | `space-2` / `space-1.5` | `space-1` |

For dense directions, shift every row down one step; for editorial directions, shift up one step. Keep the relations, not the exact values.

---

## 3. Concentric Nested Radii
Formula: $R_{\text{inner}} = \max(0,\; R_{\text{outer}} - P_{\text{inset}})$

| Outer Container Radius ($R_{\text{outer}}$) | Container Padding ($P_{\text{inset}}$) | Required Inner Child Radius ($R_{\text{inner}}$) |
| :--- | :--- | :--- |
| `radius-2xl` (`24px`) | `space-3` (`12px`) | `radius-lg` (`12px`) |
| `radius-2xl` (`24px`) | `space-2` (`8px`) | `radius-xl` (`16px`) |
| `radius-xl` (`16px`) | `space-2` (`8px`) | `radius-md` (`8px`) |
| `radius-xl` (`16px`) | `space-3` (`12px`) | `radius-xs` (`4px`) |
| `radius-lg` (`12px`) | `space-1.5` (`6px`) | `radius-sm` (`6px`) |
| `radius-lg` (`12px`) | `space-2` (`8px`) | `radius-xs` (`4px`) |
| `radius-md` (`8px`) | `space-1` (`4px`) | `radius-xs` (`4px`) |

- If $(R_{\text{outer}} - P_{\text{inset}}) \le 0$, the child is sharp (`0`).
- Avoid full rounding (`9999px`) on multi-line containers; reserve `radius-full` for single-line badges, avatars, and pill buttons. A pill parent's effective radius is half its height.
- When the radius is themeable, derive it with `calc()` (see `css-tokens.md` §2 and `tailwind-tokens.md` §3) instead of picking from this table, so extreme radius values still nest.

---

## 4. Coordinated Control Sizing

Sibling controls (input, button, select, segmented toggle) share one height token:

$$\text{Control Height} = \text{Line Height} + (2 \times \text{Vertical Padding})$$

| Token | Height | Font / line height | Vertical padding | Radius |
| :--- | :--- | :--- | :--- | :--- |
| `control-sm` | `32px` | `14px / 20px` | `6px` (`space-1.5`) | `radius-sm` |
| `control-md` | `40px` | `16px / 24px` | `8px` (`space-2`) | `radius-md` |
| `control-lg` | `48px` | `16px / 24px` | `12px` (`space-3`) | `radius-lg` |

Set the height explicitly and let padding be horizontal only; the vertical padding column is what makes the height derivable.

### Compound Controls (a control inside a control)

For an input with a button inside it, a search bar with a submit chip, or a segmented toggle inside a track:

$$H_{\text{inner}} = H_{\text{outer}} - 2 \times P_{\text{inset}} \qquad R_{\text{inner}} = \max(0,\; R_{\text{outer}} - P_{\text{inset}})$$

| Outer | Inset | Inner height | Inner radius |
| :--- | :--- | :--- | :--- |
| `control-md` (40px), `radius-md` | `space-1` (4px) | 32px = `control-sm` | `radius-xs` (4px) |
| `control-lg` (48px), `radius-lg` | `space-1` (4px) | 40px = `control-md` | `radius-md` (8px) |
| `control-lg` (48px), `radius-full` | `space-1` (4px) | 40px = `control-md` | `radius-full` |

The compound's **outer** height matches standalone siblings, so a compound search bar lines up with a plain button next to it. Separate the inner parts with surface contrast, never internal borders.
