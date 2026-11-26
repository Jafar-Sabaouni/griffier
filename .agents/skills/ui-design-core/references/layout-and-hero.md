# Page Layout & Hero (`ui-design-core`)

Use this reference when composing full pages, landing pages, and heroes. It turns the design brief (`identity-and-research.md`) into layout.

---

## 1. Hero Focal Point

Design the hero around **one** strong visual centerpiece, chosen from the brief:

| Focal point | Fits |
| :--- | :--- |
| Real product UI (screenshot, live or interactive demo) | Software and tools: show the thing itself |
| Live data readout (a real number, chart, or search box) | Data, infra, and control-plane products |
| Oversized type set in the heading or accent font | Editorial, brand-led, or minimal directions |
| Photography of the physical object or place | Craft, physical goods, venues |
| A single strong illustration or diagram tied to the product | Abstract services that need explaining |

Rules:
- Exactly one focal point; the headline and CTA support it rather than compete with it.
- Prefer asymmetric layouts (text left, focal point right or bleeding off-edge) over a centered stack.
- Headline says what the product does, in the brief's voice. No "The future of X".
- One primary CTA (accent). A secondary action, if any, uses a surface button.
- The hero's controls follow the same `control-*` heights as the rest of the UI.

---

## 2. Section Rhythm

- **Vary the layout between sections.** Alternate between split, full-width, list, and grid compositions; do not repeat the same card grid down the page.
- **Avoid three equal feature cards by default.** Prefer one large feature + smaller supporting ones, a numbered list, or features shown inside the product UI.
- **Section spacing** uses the page-section row in `token-math.md` §2; sections are separated by spacing and surface changes, not divider lines.
- Alternate section surfaces (`canvas` ↔ `surface-1`) at most every other section, and never with accent backgrounds.

---

## 3. Layout Grid

- Content max width: `72rem`–`80rem` for marketing pages; app shells use the full width with a fixed sidebar.
- Horizontal page gutter: `space-4` on mobile, `space-6`–`space-8` on desktop. No horizontal scroll at phone width.
- Use a 12-column grid for marketing layouts, so 7/5 and 8/4 splits are available for asymmetry.
- Dense directions: tighter gutters, more columns of readouts. Editorial directions: wider margins, narrower text columns.

---

## 4. Final Check

Before shipping a page, confirm:
- [ ] The hero has one focal point, and it comes from the brief.
- [ ] None of the clichés listed in the brief appear.
- [ ] Accent appears only on actions, active states, and key highlights.
- [ ] No two consecutive sections share the same layout.
- [ ] All spacing, radii, and control heights come from tokens.
