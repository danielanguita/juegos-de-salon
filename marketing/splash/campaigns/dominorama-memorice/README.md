# 🎉 Dominó y memoria (`dominorama-memorice`)

An invitation to play 🎲 Dominorama and 👀 Memorice, made ahead of their launch out of the lab (the
owner's request, 2026-11-19: "Solo haz las preparaciones. No lances nada hasta que yo lo indique").

| | |
|---|---|
| Texts | kicker "¡Dos juegos nuevos!" · title "Dominó y memoria" · lead "Dos desafíos para jugar solo. Elige uno."; each card takes its name and tagline from `games.js` and ▶ Jugar; in es, en and pt |
| Layout | two items, one under the other, like `tres-juegos-demo` |
| Items | Dominorama (`dominorama/?play`, clip `assets/splash/dominorama.*`) and Memorice (`memorice/?play`, clip `assets/splash/memory.*`), recorded by the PRs that took each game out of the lab |
| Waits for | `requires: ['dominorama', 'memory']`: unseen until both launch flags are on for the visitor (D-517) |
| On | **off**: not in `ACTIVE`. At launch, switch it on in the panel's 📣 Campaigns |

Checked on the home page with `?splash=dominorama-memorice` at 390 and 320 px in es and en: it fits the
width (no sideways scroll), both ▶ buttons on screen.

## History

- **2026-11-19:** made, kept off until both games launch.
