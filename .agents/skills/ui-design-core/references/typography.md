# Typography (`ui-design-core`)

Fonts are split by function, and the type scale snaps to the same 4px grid as spacing so text and controls line up.

---

## 1. Font Roles

| Token | Role | Used for | Never used for |
| :--- | :--- | :--- | :--- |
| `--font-body` | Readable UI | Body text, controls, labels, tables, navigation | — |
| `--font-heading` | Structure | Page and section headings, hero title | Controls, body paragraphs |
| `--font-accent` | Brand lettering (optional) | Logo-derived highlights: one hero word, a pull quote, a section marker | Body, controls, anything longer than a line |
| `--font-mono` | Data / code | Code, IDs, aligned numeric readouts | Prose |

- Add `--font-accent` only when the brand has custom lettering (usually in its logo) worth carrying onto the page. Otherwise leave it unset.
- At most two families plus the optional accent. `--font-heading` may equal `--font-body` for dense or minimal directions.
- Components reference role tokens, never family names.

---

## 2. Choosing a Pairing

Pick from the design brief, not from habit:

- **Contrast in structure, harmony in proportion.** Serif heading + grotesk body, or a grotesk heading + humanist body with similar x-heights. Two similar sans-serifs read as a mistake.
- **Match the direction**: editorial or tactile → expressive serif or display headings; dense or data-heavy → neutral grotesk body + mono for readouts; minimal → one family in two weights.
- **Do not default to the framework font** (Inter, system-ui) unless the brief explains why it fits.
- Body font needs tabular figures if the UI shows numbers in columns.

---

## 3. Type Scale (4px-snapped)

| Token | Size | Line height | Use |
| :--- | :--- | :--- | :--- |
| `text-xs` | `12px` | `16px` | Captions, badges |
| `text-sm` | `14px` | `20px` | Dense UI, `control-sm` labels |
| `text-base` | `16px` | `24px` | Body, `control-md/lg` labels |
| `text-lg` | `18px` | `28px` | Lead paragraphs |
| `text-xl` | `20px` | `28px` | Card titles |
| `text-2xl` | `24px` | `32px` | Section headings |
| `text-3xl` | `30px` | `36px` | Page headings |
| `text-4xl` | `36px` | `40px` | Small hero |
| `text-5xl` | `48px` | `52px` | Hero |
| `text-6xl` | `60px` | `64px` | Display hero |

- Every line height is a multiple of 4px, which is what keeps `control-*` heights derivable (see `token-math.md` §4).
- Headings above `text-3xl`: tighten letter-spacing (`-0.01em` to `-0.03em`) and keep line height near 1.1.
- Body measure: 60–75 characters (`max-width: 65ch`).
- Hierarchy comes from size, weight, and the text color tokens (`--text-primary/secondary/muted`), not from extra colors.
