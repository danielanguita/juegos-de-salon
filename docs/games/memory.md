# 👀 Memorice (La Copa game, launching 2026-11-19 19:00 Pacific; the lab prototype stays until the cleanup)

> First built as «Ojo de lince» in `/labs/eagle-eye/`; renamed before it merged at the owner's request:
> «Memorice» is what this kind of game is called in Chile. The folder and id became `memory`. «¡Ojo de
> lince!» stays as one of the cheers after a clear.

An endless memory game for one player, in pixel art. The owner asked (in Spanish) for "an incremental
memory game: pictures, ideally pixel art, all covered first; some are revealed and you have to find
where they ended up. Incremental until you lose, with a couple of lives. And quick." It is our own
idea and our own drawings: no credit to an original.

The owner then tuned it on a standalone copy (a claude.ai artifact built from these same files):
one question per board, the prompt under a centred board, more time on the 3×3 and after a clear,
and then **no turns** (the first prototype rotated, mirrored and swapped the covered board; that was
dropped), a board that grows faster up to 6×6, trios on the big boards, a time limit to answer, and
mixed groups and asks after the first standard rounds.

## Resumen

- **Where:** ready to leave the lab (D-517's way, see «Out of the lab» below): its page **`/memorice/`**, La Copa and
  Uno al día, hidden until `flags/memory` is on; launched by the `launch` workflow (D-529) at 19:00 Pacific on 2026-11-19, Uno al día from 2026-11-20. Until then it is
  played in the lab, `https://juegosdesalon.cl/labs/memory/` (each person's key, D-281, D-284), on the same engine.
  Id `memory` in the usage signal and the ranking; the lab's best is `juegos-de-salon:memory-best`.
- **For whom:** one player. Spanish, English and Portuguese (C-3), chosen on the cover with the usual
  flags; the lab card is in Spanish like the rest of `/labs/`.
- **Status:** prepared for production, waiting for the owner's 🚀. What would prove it: players who play more
  than one game in a visit.

## Reglas

The heading (name, best), the lives and the round on top; the board in the middle of the screen; under
it a bar for the time left and the prompt.

1. **Look.** The tiles flip and show the round's pictures; some repeat. The bar (lime to yellow) runs
   out the time to look. In every round "⏩ Tapar ya", beside the prompt, covers them at once and goes on
   to the next step, so a good player reaches the hard rounds sooner (the owner's request).
2. **Covered.** They flip back.
3. **Find.** "¿Dónde está? [picture]", "Encuentra los dos:" or "Encuentra los tres:" asks for one
   picture; every copy of it must be tapped before the bar (pink to cyan) runs out. A right tile opens
   with a green ring. A wrong tile opens (another picture, or empty) and shakes, or the time runs out
   ("⏰ ¡Se acabó el tiempo!"): the copies not found open with a yellow ring, one ❤️ less, and the same
   level again on another board. All copies found clears the round: "¡Bien!", the pictures stay open
   1.5 s, one point and the next level.

**The levels** (`level(n)` and `makeRound` in the engine, endless):

- **The intro**, the same groups for everyone, with the pictures and places of that game's seed (`INTRO`): 1. 3×3, two pictures, find one ("✌️ ¡Ronda de
  pares!" announces level 2); 2. 3×3, two pairs, find one pair; 3. 4×4, three pictures; 4. 4×4, two
  pairs and one picture, find a pair.
- **Then mixed:** the board grows fast (4×4 to level 5, 5×5 to 8, then 6×6, never bigger); the tiles
  with a picture are 2 + the level, up to half the board (18 on the 6×6); the groups are drawn at
  random, singles and pairs, and trios from the 5×5; what is asked is drawn too: a single, a pair or a
  trio, whatever the board holds.
- **Time to look** (`lookMs`, the owner's request): 4.5 s in levels 1 and 2, 4 s in level 3 and down
  evenly to 2 s at level 20, then to 1.5 s at level 25, and 50 ms less each level after that down to 0.8 s (level 39), so that
  sooner or later nobody can keep up. **Time to answer:** 4.5 s per copy at first; every level after
  the intro is 3.5 % shorter, down to 2.5 s per copy.

**Lives:** 3. Five rounds cleared in a row without a miss give a lost one back. With no lives left the
game ends.

**Seed:** playing alone is a new game every time, a random seed (the owner's request); `?seed=` plays
that seed's game, and the shared result links to it. Memorice is in no La Copa or Uno al día yet: one
that adds it passes everyone the same seed. A miss replays the level with the try number in the seed, so the board is
new. `?test` runs every wait four times faster (the end-to-end script).

**The clock** (U-20): every wait of a round runs on a clock in `game.js` that stops with the screen hidden
or the comment card open, and the bar stops with it; the result's time counts only time played.

## Modos

Solo (`solo`), endless: no levels to pick. In La Copa and Uno al día every phone plays the day's boards (the cup's seed); the trial is 1 life and 3 rounds.

## Flujo

The title with a 👀 that blinks and the tagline («Mira, recuerda y encuentra.»); under them, once there
is one, this phone's best shown like a result, a yellow pill «🏆 Tu récord · 7 rondas» (the owner
asked for it up top, not under the steps); the language flags and a small 3×3 board that plays by
itself (the pictures show, cover, and the one asked opens with a green ring; still with reduced
motion). Then "👀 Jugar" and the three short steps (after the button, U-39).

"Fin del juego", the rounds cleared, a new best or the previous best (`juegos-de-salon:memory-best`
in `localStorage`), the pictures found, the level reached and the time; share (the solo result image),
"Jugar de nuevo", back to the lab and, after a line, the comment form.

## Protocolo de mensajes

None: one player, no room. In La Copa the state is saved after each round with `ctx.guardar` (the cup's `cuenta.js`); a reload ends the game with the rounds it had.

## Archivos

| File | What |
|---|---|
| `public/cup/games/memory/engine.js` | The rules, no DOM: the levels, a round, a tap, a game; La Copa's `generateDay`, `score`, `card`, `dayScore` (moved from the lab; `labs/memory/engine.js` re-exports it) |
| `public/cup/games/memory/sprites.js` (re-exported by `labs/memory/sprites.js`) | The 45 pictures the owner picked from a board of 100 candidates (2026-11-05): Chilean favourites (flag, piscola, empanada, completo, moai, copihue…), pop and retro, food, symbols and 12 of the first set; 12×12 pixels drawn with letters, turned into SVG. No real people or logos |
| `public/labs/memory/rules.js` | The texts, es / en / pt |
| `public/labs/memory/game.js` | The lab prototype's screens and animations |
| `public/cup/games/memory/ui.js`, `texts.js`, `style.css` | La Copa's screen, its texts in es/en/pt and its stylesheet (classes `mm-`) |
| `public/cup/games/memory/engine.test.mjs` | La Copa's interface: the day's seed, the trial, the score, the card, Uno al día's curve and the texts' parity |
| `public/labs/memory/engine.test.mjs` | The intro, every level up to 80, rounds 1–40, a game, the pictures and the texts' parity |
| `tools/e2e/memory/lab.mjs` | End to end, the lab prototype |
| `tools/e2e/memory/page.mjs` | End to end, the page `/memorice/` (`window.__memory`) |

## Excepciones a los cánones

- The lab prototype has no ranking (D-212); the La Copa game ranks in the table `memory`.
- **Design tokens** (D-533): the stylesheet uses the shared tokens and text steps; its own colours are the tokens at its top and the diamond's 2 px corner is allowlisted (`docs/DESIGN.md` §4). A tile's cover is `.face-cover`, since `.cover` is a shared class; it keeps the 24 px padding and the fade it had from that class, so the diamond keeps its size.
- `window.__memory` exposes the state (the round's answer) for the end-to-end script.
- **The 6×6 tiles are under 44 px at 320 px wide** (C-8): 37 px at 320×568 and 43 px at 320×640; from
  360 px wide they measure 48 px or more. Everyone plays the same board with the same heading on every
  phone, so neither the layout nor the difficulty changes with the screen.

## Out of the lab (2026-11-19, D-517's way)

Memorice gets ready to leave the lab as Sudoku did (2026-11-19, the owner: "only the preparations, launch nothing until I say so"):

- **A La Copa game** in `public/cup/games/memory/`: the lab's `engine.js` and `sprites.js` moved there, plus La Copa's
  interface (`generateDay`: the seed `código:día`, 3 lives, the trial 1 life and 3 rounds; `score`: the rounds cleared,
  no cap; `card`: 🟩/🟥 per round; `dayScore`: Uno al día's 0–100, `100 × (1 − e^(−rounds/12))`); `ui.js`, the screen
  (the cover's demo board, the 👀 title, the game with its own clock that stops with the page hidden); `texts.js`;
  `style.css`. The tiebreak (`d`) is the pictures found.
- **Its page `/memorice/`** (the player's name, C-20), generated by `og.mjs cards`, with the bridges
  `/minijuegos/memory/` and `/minigames/memorice/` and its link card `assets/og/memory.jpg`.
- **Launched by a flag** (`lanza: 'memory'`, D-517): hidden from the home page, the search, the filters, /records/ and
  new cups until `flags/memory` is *all*. In the pool `copa: { pozo: 19 }`; Uno al día `orden: 24` with
  `desde` and `nuevoDesde` `'2026-11-20'`, the day after its launch (2026-11-19 19:00 Pacific, `launch` workflow, D-529).
- The /labs/ card points to the page, with the prototype under it. The splash media for its campaign are in
  `public/assets/splash/memory*` (the campaign itself is another session's).
- Left for after the launch: the cleanup PR (drop
  `lanza`, the flag's row, the prototype, and move the card to La Bodega).
