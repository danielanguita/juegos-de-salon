---
name: css-change
description: Writing or changing CSS, a stylesheet, spacing, colours, text sizes, or adding a control a game does not have yet. Use before writing the CSS: it routes to the design system's tokens and components and the lint that gates them.
---

# Changing styles

The design system is `docs/DESIGN.md` (D-533) and its tokens live in `public/assets/css/base.css`. Read:

1. **§1 Tokens** (distances `--s-*`, corners `--r-*`, edges `--edge-*`, text sizes `--fs-*`, colours) and
   **§2 Components**: if a component exists in `base.css`, use it; never copy it into a game.
2. **§3 Rules** before a layout change (spacing between blocks, margins, nothing covering the next block, D-570).
3. **§4 Escapes** only if a game needs a thematic colour: it is declared once at the top of its stylesheet
   and listed there.

Then:
- `node tools/agents/design-lint.mjs <file.css>` while you work; `--gate` must be clean before pushing
  (push-guard stops the push otherwise). A justified exception goes to `docs/design-allowlist.json` with its reason.
- A new token, scale step or shared class is reviewed by the usability agent (it owns the system).
- Measure the screen: `node tools/e2e/look.mjs <game> <screen> --width 320` (no horizontal scroll,
  44 px buttons, spacing, margins), and covers above the fold (`node tools/e2e/landing-fold.mjs`).
