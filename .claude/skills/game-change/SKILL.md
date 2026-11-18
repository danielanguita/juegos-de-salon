---
name: game-change
description: Building a new game or changing an existing one (anything under a game's folder in public/, the shared game shell in public/assets/js, a cover, a result screen, a room, a mode). Use before writing the code: it says which canons (C-n) apply to the change so only those are read, and the checks to run when done.
---

# Changing a game

The canons are the rule; this only routes you to the ones your change needs (D-213: one place each).
The index is `docs/CANONS.md` (one line per canon, then the checklist); each canon is `docs/canons/C-n.md`.

1. **Read the game's spec** `docs/games/<folder>.md`: its exceptions to the canons win.
2. **Read only the canons your change touches:**

| You are changing… | Read |
|---|---|
| texts, instructions, a new string | C-3, then the `player-text` skill |
| buttons, cover, layout, any CSS | C-8, C-1, then the `css-change` skill |
| a player's mistake, a verdict, a notice | C-8b |
| passing the phone, hidden info | C-9, C-10 |
| rooms, Firebase, sharing, the watchdog | C-7, C-14, C-15 |
| modes or resuming | C-5, C-6 |
| the result screen | C-19 |
| the home page, its order, the dice | C-17 |
| a URL, a parameter, a name, a folder | C-18, C-20 |
| something for all games | C-21 (`ALL_GAMES`, never only `GAMES`) |
| sound | C-4 |
| the panel or a signal | C-16, and the `owner-tools` skill |
| a new game | `docs/ADD-GAME.md`, then every canon in the checklist |

3. **Behind the lab** (D-395): new things on a player page go behind `flag('<id>')` and are listed in `/labs/`.
4. **When done:** walk the checklist at the end of `docs/CANONS.md` for the lines your change touched; run the
   game's engine tests and only the e2e script of the screen you changed (`tools/e2e/<game>/…`, D-428);
   look at the screen with `node tools/e2e/look.mjs <game> <screen>`; if you changed a game, the PR also
   gets the player agent (`docs/MERGING.md`).
