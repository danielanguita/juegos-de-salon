# 🎉 Dominó y memoria (`dominorama-memorice`)

An invitation to play 🎲 Dominorama and 👀 Memorice, made ahead of their launch out of the lab (the
owner's request, 2026-11-19: "Solo haz las preparaciones. No lances nada hasta que yo lo indique").

| | |
|---|---|
| Texts | kicker "¡Dos juegos nuevos!" · title "¿Lógica o memoria?" · lead "Dos desafíos para jugar solo. Elige uno."; each card takes its name and tagline from `games.js` and ▶ Jugar; in es, en and pt |
| Layout | two items, one under the other, like `tres-juegos-demo` |
| Items | Dominorama (`dominorama/?play`, clip `assets/splash/dominorama.*`) and Memorice (`memorice/?play`, clip `assets/splash/memory.*`), recorded by the PRs that took each game out of the lab |
| Waits for | `requires: ['dominorama', 'memory']`: unseen until both launch flags are on for the visitor (D-517) |
| On | **off**: not in `ACTIVE`. At launch, switch it on in the panel's 📣 Campaigns |

Checked on the home page with `?splash=dominorama-memorice` at 390 and 320 px in es and en: it fits the
width (no sideways scroll), both ▶ buttons on screen.

## History

- **2026-11-19:** made, kept off until both games launch.
- **2026-11-19 (the owner's review):** each clip inset 8 px from its card with its own corners, and the
  cards 16 px apart, so the two clips do not run together (every list campaign on a phone; the margin check
  M-3 now accepts a row card's clip inset by the same gap above as on the left). Dominorama's clip is the
  board alone, the dominoes turned off camera; Memorice's board is shrunk inside its clip, with room around it (ffmpeg pad, the page's purple); Memorice's card opens
  with "Un clásico de la infancia." (its own text, three lines on a phone).
- **2026-11-19 (Play's gap):** every card in a list as tall as the tallest, its name and text on top and Play at the bottom, so the gap under Play is the same in each (the owner saw Dominorama's and Memorice's differ).
- **2026-11-19 (title):** "¿Lógica o memoria?", a question that makes the player pick, in place of the games' names (the owner).
