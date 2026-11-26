# UI Migration & Refactoring Guide (`ui-design-core`)

Use this operational guide when auditing, refactoring, or modernizing existing UI components, legacy stylesheets, or templates to adhere to the `ui-design-core` principles.

---

## 1. Audit & Discovery Queries

Search the target scope using `search_code` to locate design system violations:

| Violation Category | Search Patterns to Target | Underlying Problem |
| :--- | :--- | :--- |
| **Illegal Decorative Borders** | `border-gray-`, `border-slate-`, `border-zinc-`, `border border-`, `border: 1px solid` | Borders placed between contrasting surfaces. |
| **Arbitrary Magic Dimensions** | `h-[13px]`, `h-[38px]`, `p-[11px]`, `13px`, `19px`, `35px` | Violates the base-4 proportional scale. |
| **Mismatched Nested Radii** | `rounded-xl` inside `rounded-xl`, or child with larger radius than parent | Breaks concentric geometry ($R_{\text{inner}} = \max(0, R_{\text{outer}} - P_{\text{inset}})$). |
| **Uncoordinated Controls** | Sibling inputs and buttons with disparate heights (`h-9` next to `h-10`) | Inconsistent hit targets and visual rhythm. |
| **Raw Palette Colors** | `bg-zinc-`, `text-gray-`, `bg-blue-`, `#[0-9a-fA-F]{3,6}`, `rgb(`, `hsl(` in components | Bypasses derived surfaces and text; breaks when the theme changes. |
| **Accent Misuse** | `bg-accent` / `--accent` on sections, cards, or decoration; accent reused for errors or success | Accent stops signalling actions and active states. |
| **Raw Font Families** | `font-family:` with a family name, `font-['` in components | Bypasses font role tokens (`typography.md`). |

---

## 2. Step-by-Step Remediation Playbook

### Phase 1: Strip Illegal Decorative Borders

Follow this decision tree for every detected border:

```
Element has a border?
  ├── Is it a functional state indicator (focus ring, input active outline, error state)?
  │     └── YES ➔ PRESERVE IT (Ensure it uses --ring-focus or validation token).
  │
  ├── Does child element have a DIFFERENT background color than its parent?
  │     └── YES ➔ STRIP THE BORDER COMPLETELY.
  │              Surface contrast alone provides visual hierarchy.
  │
  └── Does child element share the EXACT SAME background color as its parent?
        ├── Option A (Preferred): Elevate child surface (e.g. shift from surface-1 to surface-2) and strip border.
        └── Option B: If boundary is required on same surface, use single --border-same-bg token.
```

### Phase 2: Recalculate Concentric Radii

For every nested surface (cards inside cards, input inside container, modal header/body):
1. Identify the parent container's outer radius ($R_{\text{outer}}$).
2. Measure the inner padding or inset gap ($P_{\text{inset}}$).
3. Compute the inner radius:
   $$R_{\text{inner}} = \max(0,\; R_{\text{outer}} - P_{\text{inset}})$$

**Quick Conversion Chart**:
- Parent `radius-xl` ($16\text{px}$) + `p-2` ($8\text{px}$ pad) $\rightarrow$ Child must be `radius-md` ($8\text{px}$).
- Parent `radius-2xl` ($24\text{px}$) + `p-3` ($12\text{px}$ pad) $\rightarrow$ Child must be `radius-lg` ($12\text{px}$).
- Parent `radius-lg` ($12\text{px}$) + `p-2` ($8\text{px}$ pad) $\rightarrow$ Child must be `radius-xs` ($4\text{px}$).
- If $(R_{\text{outer}} - P_{\text{inset}}) \le 0$, child radius is `0` (sharp).

### Phase 3: Coordinated Control Alignment

In input groups, segmented toolbars, and search bars:
1. Replace bespoke heights with standard control tokens:
   - Small: `--control-sm` / `h-control-sm` ($32\text{px}$)
   - Medium: `--control-md` / `h-control-md` ($40\text{px}$)
   - Large: `--control-lg` / `h-control-lg` ($48\text{px}$)
2. Eliminate duplicate internal borders between adjacent controls (use a unified wrapper surface instead).
3. For compound controls, derive inner height and radius from the outer control (`token-math.md` §4).

### Phase 4: Replace Raw Colors & Fonts

1. Map every raw background to the surface layer it plays (`canvas`, `surface-1..3`, `surface-interactive`); map text colors to `fg-primary/secondary/muted`.
2. Keep accent only on the primary action, active/selected states, focus, and key brand highlights. Move everything else to surfaces. Give status colors their own tokens.
3. Replace font-family literals with `--font-body` / `--font-heading` / `--font-accent`.
4. Switch the theme (light, dark, and one extreme canvas or accent) and check that layers and text still read (`color-system.md` §3).

---

## 3. Concrete Migration Diff Recipes

### Example 1: Nested Card Modernization

#### Before (Legacy Borders & Mismatched Radii)
```html
<div class="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
  <h3 class="text-white">Account Details</h3>
  <div class="bg-zinc-800 border border-zinc-700 rounded-xl p-3 mt-3">
    <p class="text-zinc-300">Inner details</p>
  </div>
</div>
```

#### After (Borderless Contrast & Concentric Radii)
```html
<div class="bg-surface-1 rounded-xl p-2">
  <h3 class="text-fg-primary px-2 pt-2">Account Details</h3>
  <div class="bg-surface-2 rounded-md p-3 mt-2">
    <p class="text-fg-secondary">Inner details</p>
  </div>
</div>
```

---

### Example 2: Compound Search Input & Action Button

#### Before (Mismatched Heights & Competing Borders)
```html
<div class="flex items-center gap-2">
  <input class="h-9 px-3 border border-zinc-300 rounded text-sm" placeholder="Search..." />
  <button class="h-10 px-4 border border-zinc-300 bg-white rounded font-medium">Search</button>
</div>
```

#### After (Shared Height Token & Inset Surface)
```html
<div class="flex items-center gap-2">
  <input class="h-control-md px-3 bg-surface-2 rounded-md text-fg-primary placeholder:text-fg-muted focus:outline-none focus:ring-2 focus:ring-ring-focus" placeholder="Search..." />
  <button class="h-control-md px-4 bg-surface-3 hover:bg-surface-interactive text-fg-primary rounded-md font-medium">Search</button>
</div>
```
