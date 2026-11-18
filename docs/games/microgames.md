# ⚡ ¡Al toque! (/in-a-flash/, La Copa and Uno al día)

Microgames in the style of WarioWare (Nintendo): one quick order, 3 to 5 seconds to do it, and the next
one comes right after. The owner designed it game by game with Claude on a claude.ai artifact (a review
page with ✅ / ❌ per game), kept 28 of about 40 (¡Encesta! and ¡Patea! left later), tuned each one, added ¡Pinball! later (2026-11-13), and asked for runs of 10 different games
in a row in the lab. «¡Al toque!» means "right away" (the owner first called it «¡Al tiro!», Chilean for the same).

## Resumen

- **Where:** `https://juegosdesalon.cl/in-a-flash/` (the lab's `/labs/microgames/` and `/microgames/` are bridges there), hidden until `flags/microgames` is on (D-517's way; launched at 21:00 Pacific on 2026-11-14 by the `launch` workflow, D-529, with the splash `microgames-launch` first and Sudoku's turned off).
  Since 2026-11-15 it is La Copa's screen (D-456's way, as Aletazo and Sudoku): `public/cup/games/microgames/`, a `SUELTOS` entry in games.js with `copa: { pozo: 18 }` and `unoAlDia: { orden: 23, desde: '2026-11-16' }`; `/in-a-flash/` is the standalone page og.mjs generates from `cup/suelto/`. Id `microgames` in the usage signal and the rankings (named «¡Al toque!» by `LAB_NAMES`).
- **For whom:** one player, on a phone held upright.
- **Language:** Spanish, English and Portuguese (C-3), with the toggle on the cover. The Spanish is written
  where each text is used, inside `t('…')`; `tr.js` has its English and Portuguese keyed by that
  Spanish, and `tr.test.mjs` fails on a `t()` with no translation or with different `{x}`.
- **Status:** active project. What would prove it: players who start a second run.

## Reglas

- **A game:** 0 to 3 stars, judged by the microgame. Its points are 10 per star times the speed it was
  played at (×1.0 the first three, ×1.1, ×1.2, ×1.3 the last): a ★★★ at the end is worth 39.
- **Streak:** each game with ★★ or more right after another one adds +5 (🔥). It shows as it happens: an orange «🔥 Racha de n · +5» under the game's stars, and a flame ring on its marks at the top.
- **After each game in a run:** its stars fill in one by one, golden and shining, with what it gave («+33 pts · ⚡ ×1,1»; the breakdown calls it «⚡ Bono de velocidad») so the speed's part is visible as it grows.
- **A run:** the sum, shown in the HUD as it goes; a perfect run is 381.
- **The end shows the run's summary (each game's stars and points) and the breakdown above Otra corrida** (the owner's call, over C-19's usual order): the stars × 10, what the speed added, the streaks (count × 5) and the total, so the player sees where the points came from.
- **Uno al día and La Copa** compare `score100`: the stars weighed by speed, 0 to 100 as every other game
  on the platform (D-412), without the streak so a miss costs the same wherever it falls. A tie goes to
  the faster run (its seconds are in the `trackFinish` detail).

## The two clock games

¡Qué hora es! (pick the time a clock shows, out of three) and ¡A la hora! (set both hands to a digital time)
never share a run: `runOrder`'s `apart` groups keep at most one of them. ¡A la hora! never asks for 12 nor
for :00, where both hands start, so both always have to move.

## Shared runs, the run of the day and pauses

A run is La Copa's day: `generateDay(code, day)` (engine.js) gives the seed `<code>:<day>` and the ten games
(`runOrder`, with ¿Qué hora es? and ¡A la hora! never together), so a cup, Uno al día and the standalone
page's shared code play the same run on every phone: the same ten games in the same order, and each dealt
from its own stream (`stream(seed, '<n>:<id>')`). Only the in-game motion that depends on the frame rate
(a fly's jitter, a gust) can differ; what is judged does not.

**Score:** the points (stars × 10 × speed, plus streaks, engine.js `score`) are the cup's score, with no cap.
Uno al día and the Gran Final take the run's own 0–100 (`runScore100`, sent as `d100` by `result`; a game
not played counts 0), read by `dayScore` and by final/ui.js. Tie: less time.

**Pause:** when the page is hidden the game stops and shows **Seguir**; a game not finished yet starts again,
dealt the same, and one already scored goes on to the next. **Reload:** the marks are saved after each game
(`ctx.guardar`); a page reloaded mid-run ends the run with what it had, as Aletazo (no retry by reloading).

## The 29 microgames, by type

| Type | Games |
|---|---|
| 👆 Toca (18) | ¡Qué color!, ¡Cuenta!, ¡Calcula!, ¡Completa!, ¡Qué hora es!, ¡Su sombra!, ¡Más! (3 rounds), ¡Diferente!, ¡Cuál falta!, ¡Dónde quedó!, ¡Repite!, ¡Espera… ya!, ¡Para! (a radar), ¡Toca rápido! (a hand pump and a balloon), ¡Aplasta! (9 flies), ¡Revienta!, ¡No toques! (whack-a-mole), ¡Pinball! (three balls) |
| ✊ Arrastra (6) | ¡Ordena! (big on top), ¡A la hora! (set both hands to a digital time, 10 s), ¡Conecta! (four in a row), ¡Atrapa!, ¡Rebota! (pixel aliens), ¡Equilibra! (stacked blocks) |
| 💨 Desliza (5) | ¡Corta! (any direction), ¡Rueda! (a steel ball on a track), ¡Dibuja!, ¡Sigue! (a rat), ¡Limpia! |

Each game gives 0 to 3 stars, mostly by time or accuracy; the rules of each are in its comment in
`stage.js`.

## ¡Pinball!

The owner's idea (2026-11-13): «a mini pinball where 3 balls drop and you keep them alive», about 5 seconds,
some 3 to 5 taps, visually appealing; the gameplay first. A neon table on a canvas (cyan walls with their
corners cut, three pink bumpers that light up and spark, two yellow flippers over a red-glowing drain).
Tapping the left or right half swings that flipper (both at once with two fingers; ← → or Z M on a keyboard);
it drops back on its own after 0.35 s, so every save is a new tap and holding it up does not cradle the balls.
A flipper fires again only once it is back down at rest (the owner, 2026-11-14): a tap while it is up or
falling does nothing, and it shows dimmer until it is ready, so mashing does not keep it raised.

- **The bumpers move** (the owner, 2026-11-14): two (three until the owner tried two), drawn anew each game in the upper half, clear of the
  walls and of each other by more than a ball. A bumper kicks a ball hard once, at two thirds of the speed when it sends it
  down toward the flippers; after that it only bounces it back softer, so no ball stays up there all game.
- **Big, fast balls** (the owner, 2026-11-14): 2.6 % of the table's width, at least 8 px, with gravity H × 1.35, a top speed of H × 2.6 and a bumper's first kick of at least H × 0.85. Slower rounds (gravity × 1.0, then × 1.09) felt dull and were dropped.
- **A big table** (the owner, 2026-11-14): the stage's full width and up to 1.6 times as tall as wide, centred up and down in the stage (at the bottom it sat too low), with rounded corners and a soft cyan glow. Smaller ones (1.4 tall; 86 % wide and 1.3 tall) felt cramped and were dropped.
- **Smooth at 60 fps** (the owner saw it drop frames, 2026-11-14): a canvas blur (`shadowBlur`) on every neon tube each frame took the table to ~11 fps on a phone, and since a frame's step is capped at 33 ms the whole game ran in slow motion. The glass and the still neon (outline, lane arrows, bumpers at rest) are drawn once, with their real glow, into two layers; each frame only copies them, and what moves (flippers, a lit bumper, balls, sparkles) fakes the glow with stacked strokes and soft halos.
- **The flippers** (the owner asked for nicer ones, 2026-11-14): a tapered paddle, wide and round at its pivot and
  narrow at the tip, filled with a yellow-to-pink gradient, edged in neon and capped with a white pivot.
- **Neon sparkles** on every strike: a few tiny glowing dots in the colour of what the ball hit (cyan wall, yellow flipper, pink bumper), at most one burst per ball every 90 ms.
- **The neon** (the owner, 2026-11-14): every line is a neon tube, a faint halo, a glowing body and a white-hot core added on top of each other, that hums with a slight flicker; the bumpers have a pink ring and a yellow one inside and fill white-pink when hit; two violet lane arrows; the glass is a violet night darker at the edges with a magenta grid going away and faint twinkling stars. Nothing flickers with reduced motion.
- **The balls come in turns** (the owner, 2026-11-14): the first waits 0.65 s, see-through like the others,
  so you see the table first, then drops straight onto a flipper, so you react from the start. The other two wait on the table from the start,
  see-through, where they will drop (the upper half, clear of the bumpers), each with a ring that fills up and a
  last quick blink; they fall from there about 1.1 and 2.1 s in, not from the roof, so you see them coming and
  they do not all arrive together.
- **Its intro is the table** (the owner, 2026-11-14): instead of the plain card, the intro draws the table (the neon
  outline, two bumpers, a ball and both flippers) with each half tinted and marked «TOCA», and a thumb pressing each side
  in turn while its flipper swings up; it stays 1.6 s longer than other intros (`command`'s `ms`), so the player knows
  where to put their fingers before the clock starts.
- **One finger on each side** (the owner, 2026-11-14): until a side is first tapped, a 👆 pulses under its flipper with
  «TOCA», and the side being pressed glows; the intro says «un dedo a cada lado: cada uno mueve su paleta».
- **Smooth motion** (the owner saw it choppy, 2026-11-14): the physics runs in steps of about 3 ms however long a frame
  takes (up to 50 ms, so a slow phone does not play it in slow motion), each ball leaves a continuous tapering streak of
  every step's position instead of six dots, and its halo and body are sprites drawn once.
- **A ball counts once a flipper has hit it** (a green ring, and its dot in the corner turns green): each ball
  hit and still on the table after 7 s (longer since 2026-11-14) is a ★; all three down ends it at once with none. Without a tap it
  scores 0, and holding a side down too. A ball wedged between a guide and a flipper's base gets a nudge after
  0.3 s. Gravity grows with the run's `sp`.
- **All three saved: ¡JACKPOT!** (the owner asked for something silly): the table stops, the three balls line
  up, grow googly eyes, a grin and crooked party hats and do a kick line while the bumpers flash every color
  and «¡JACKPOT!» pulses, for about 1.7 s before the stars.

In tests `window.__pinball` exposes the table (balls, flippers, saved). A bot that taps when a ball reaches its
flipper saves 1 to 3 (about 2.4) with 4 to 8 taps; the first ball reaches a flipper at about 0.5 s and the
others at 2 to 6.2 s (one in eight did not get down in time).

## ¡Rebota!

A paddle at the bottom, a ball and three pixel aliens to hit (our own 8-bit drawings); where the ball meets the
paddle sets its angle, like Pong. The owner's tuning (2026-11-14):

- **Neon**: a court with a cyan neon frame over a violet night with a faint grid; the paddle a cyan neon tube, the
  ball a warm white-yellow glow with a short trail, the aliens glowing in their own colour, and every burst (an
  alien hit, a small cyan one on each paddle hit) of glowing pixels.
- **A shorter court**: 84 % of the stage's height, so the ball, at the same speed, goes up and comes back more
  often in the same 9 s; the roof is the court's top edge. It sits high in the stage (6 % from the top, 10 % from
  the bottom).
- **All three hit: ¡FIESTA MARCIANA!** (the owner asked for a silly surprise): the three aliens come back, bigger,
  line up with crooked party hats in their colour and dance a kick line under a flickering neon sign for about
  1.9 s, then the stars. Nothing dances with reduced motion.

## Usability rules of the microgames

- **¡Rueda!:** lifting the finger pauses the ball (the clock keeps going); putting it back on the ball goes on.
- **¡Conecta!:** a tap on a column drops the disc there; dragging still works.
- **¡Corta!:** a swipe too short says «¡De lado a lado!» instead of doing nothing.
- **¡Cuenta!:** the things wobble half as much, so they can be counted in time.
- **Out of time** always says «¡Se acabó el tiempo!» (C-8b), never only «¡Fallaste!».
- **¡Toca rápido!:** the hose is tied to the balloon's knot as read from the page, every frame.
- **¡Aplasta!:** the flies under the swatter's head at the tap are the ones squashed.

## Modos

One: 🧍 solo, on one phone. No rooms, no rival.

## Flujo

1. **Cover** (La Copa's card): the three ways to play (Toca turquoise, Arrastra orange, Desliza purple), each
   with a finger doing its gesture; in the waiting room, ⚡ and the name, its line and the credit to WarioWare.
2. **The run:** the day's 10 microgames. Each starts with its intro card (the gesture of its type, the
   stage framed in the type's color, the name and a hint). Every three games the run speeds up by 10 %.
   The HUD shows `n / 10`, the stars so far and a mark per game.
3. **The end:** the verdict, the points, the stars and the 0–100, each game's icon with its stars and
   points (🔥 on a streak), and the button to La Copa's result (C-19 there). Sound and confetti on a good run.

## Protocolo de mensajes

None of its own: La Copa's (the cup's results), the usage signal and the rankings (`microgames`, D-212).

## Archivos

All in `public/cup/games/microgames/`:

| File | What |
|---|---|
| `engine.js` | The pure rules: the day (`generateDay`), the run's order, the speed, the points, the 0–100 and the card |
| `engine.test.mjs` | Its tests (and that stage.js's 29 match `IDS`) |
| `stage.js` | The stage markup, the 29 microgames (`GAMES`), their names (`META`), the three types and `playRun` |
| `ui.js` | La Copa's interface: `cover`, `title`, `mount`, `result`, `breakdown` (mapped in `cup/games/index.js`) |
| `texts.js` | Its texts for La Copa in es/en/pt, merged in `cup/rules.js` |
| `tr.js` / `tr.test.mjs` | The microgames' words in English and Portuguese keyed by the Spanish, and their test |
| `style.css` | The stage and every microgame's look |
| `tools/e2e/in-a-flash/page.mjs` | End to end |

## Excepciones a los cánones

- **C-2 (files):** `rules.js` holds the translations keyed by the Spanish, not a `LOCALES = { es, en, pt }`
  by key: the short texts spread over 29 microgames read better where they are used.
- **C-6 (memory):** a run is short (about a minute and a half) and is not resumed: reloaded, it ends with the games played.
- **Characters:** every mascot is our own drawing (the muscle sponge in ¡Limpia!, the curly-haired
  tycoon in ¡Atrapa!, the dancing rat and moles). None copies a real person or a brand.

## Its styles and the design system

`style.css` came whole from the review artifact and was moved onto base.css's scales (D-533): spaces,
corners and text sizes on the steps, buttons from base.css (`btn btn--yellow` / `btn--ghost`). The
colours and glyph sizes base.css has no token for are the sheet's own tokens, `--mg-<hex>` (with its
`-rgb` channels) and `--mg-fs-<size>` for the glyphs and big numbers over 2 rem, declared at the top in
`.alt-stage` (DESIGN.md §4). Giving them real names, or merging the near ones into base.css's, is still pending.

## For the end-to-end test

`window.__alToque`: `S` (the marks, `fin`), `estado()` and `acabar()` (ends the run now). `window.__microgames`
(stage.js): `game`, `order`, `idx`, `total`, `active` and `ids`.
- **¡A la hora!:** the hand pointing nearest the finger turns (near the middle, the short one); the long one snaps to 5 minutes, the short one must be within half an hour of its place. Never 12:00, where both hands start.
- **Testing:** testers (lab key) get the single-game picker in the T tab again: the 29 games by icon, framed in their type's color, one tap plays one on its own as a try-out (nothing saved, nothing sent to the cup; `ui.js`). The tester panel scrolls on short screens. The page's own ranking left with its page: La Copa's page gives the rankings.
- **¡No toques!** shows a mole (an inline SVG, there is no mole emoji) where the hammer was. While a game is on the stage locks touch scrolling (`.demo.playing`), the stage is never taller than the screen, and each game scrolls it into view.
- **Ranking (D-212):** the `microgames` table, its tab on `/records/` as a `SUELTOS` game (D-559; no longer in `SOLO_TABLES`), checked by `tools/e2e/in-a-flash/page.mjs`.
