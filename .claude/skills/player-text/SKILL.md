---
name: player-text
description: Writing or changing any text a player reads (instructions, buttons, notices, results, share messages, emails to players) in Spanish, English and Portuguese. Use before writing the text: it names the usability rules that apply and the lint that checks them.
---

# Writing for the player

The rules are in `docs/USABILIDAD.md` (U-n); read only these sections, in order:

1. **Always:** U-1 (full sentences, understood at first read), U-8 and **U-18** (instructions: the goal
   first with a verb, at most 3 points, nothing the drawing shows, scoring in one sentence), and the
   "Textos" section.
2. **Buttons and screens:** "Pantallas y botones". **Timers and notices:** "Interacciones".
   **Anything shared** (WhatsApp, result image): "Compartir" and `compartir.js` (C-7).
3. **Words already decided** are in `docs/usability-glossary.json` and in "Resuelto con el dueño": use them, do not re-argue.

Then:
- Write the text in **es, en and pt** with the same keys (C-3): the parity test fails otherwise. Spanish is
  informal Chilean "tú" but for everyone (C-1, D-324).
- Run `node tools/agents/usability-lint.mjs` and fix every hit in the three languages, or allowlist it in
  `docs/usability-allowlist.json` with its reason (D-520).
- A clumsy text you meet on the way: improve it in all three languages in the same PR (the owner asked).
- A text for the player never says "minijuego"/"minigame" (C-21).
