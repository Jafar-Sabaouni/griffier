# Identity & Research (`ui-design-core`)

Use this reference before designing a new product UI, landing page, or brand theme. Geometry alone produces technically sound but generic pages: neutral grays, a centered header, a row of cards. This step gives the design a point of view.

---

## 1. Gather Context

Start from what the project already says about itself, then widen out:

1. **The project itself**: README, existing copy, product name, logo, current styles, and who the users are.
2. **The category**: what typical sites and apps in this domain look like. Use web search if available; otherwise rely on domain knowledge and say so in the brief.
3. **The physical world**: the materials, environments, tools, and documents people in this field actually handle.

Ask the user only when the product's positioning cannot be inferred from the above.

---

## 2. Audit Category Clichés

List at least three patterns the category overuses, so the design can avoid them deliberately.

| Common cliché | Why it reads as generic |
| :--- | :--- |
| Hero headline above three equal feature cards | Every SaaS template ships it |
| Stock gradient blobs, glassmorphism, floating 3D shapes | Decoration with no tie to the product |
| Neutral gray UI with a single blue accent | The framework default |
| Centered everything, identical section rhythm | No hierarchy, no focal point |
| Vague hero copy ("The future of X", "Supercharge your workflow") | Says nothing about this product |

Add the domain-specific ones you find (e.g. stethoscope icons in health, padlocks in security, handshake photos in B2B).

---

## 3. Borrow From Physical Context

Translate real-world materials into design decisions:

| Domain character | Palette | Surfaces & texture | Spacing & type |
| :--- | :--- | :--- | :--- |
| Craft, food, physical goods | Organic, warm hues; low-chroma neutrals | Tactile contrast, paper or material tones | Editorial spacing, expressive serif headings |
| Technical control plane, infra, data | Functional dark surfaces; signal-color accent | Dense readouts, flat layered panels | Tight spacing, mono or grotesk, tabular numbers |
| Finance, legal, public records | Ink-on-paper neutrals; restrained accent | Document-like surfaces, ruled tables | Clear hierarchy, high legibility, generous measure |
| Consumer, social, playful | Saturated accent, brighter canvas | Larger radii, bold surface steps | Larger type, looser rhythm |

These are starting points, not rules. The brief must say what in *this* domain drove each choice.

---

## 4. Commit to an Aesthetic Direction

Pick **one** direction early and shape layout, density, and type around it. Examples:

- **Tactile / editorial**: material tones, large type, asymmetric layouts, generous whitespace.
- **Dense / data-heavy**: compact controls (`control-sm`), small radii, many readouts per screen, dark functional surfaces.
- **Quiet / minimal**: few surfaces, low chroma, one strong accent, large negative space.

Mixing directions produces the generic middle. If two feel right, choose the one closer to how users actually work.

---

## 5. Write the Design Brief

Produce this before writing UI code and keep it with the work (in the response, or in the project's design doc if one exists):

```md
## Design Brief: <product>
- Positioning: <who it is for, what it does, in one sentence>
- Clichés avoided: <3+ category patterns this design will not use>
- Physical context: <materials / environments borrowed, and what each maps to>
- Direction: <tactile | dense | minimal | other>, because <reason>
- Palette: canvas hue + chroma, surface step, accent (see color-system.md)
- Typography: body / heading / optional accent font, and why (see typography.md)
- Hero focal point: <the one centerpiece> (see layout-and-hero.md)
- Voice: <3 adjectives + one example headline in that voice>
```

Every later decision should trace back to a line in the brief.
