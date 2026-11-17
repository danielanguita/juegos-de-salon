# ⚖️ The Wobbles (Tembleque; lab, in Juegos en prueba)

A balance game with two levels: **easy, in 2D** and **hard, in 3D**. The owner built both with another AI
outside this repo and brought them as finished pages; they came into the lab **kept whole, as delivered**
(the owner's ask), each a page of its own behind one cover (the owner, 2026-11-17: one game, not two).
Making them a game of the house (an engine, the shared modules) is later work.

## Resumen

- **Where:** `/labs/wobbles/` (the cover), `/labs/wobbles/easy/` and `/labs/wobbles/hard/` (the levels),
  behind the lab's door (D-281, D-395), `noindex`, its card in /labs/'s 🎲 Juegos en prueba. Not in
  `games.js` while it is in the lab. Its facts are in `game.json`.
- **For whom:** one player, one phone. In es, en and pt (Tembleque / The Wobbles / Tremelique).

## Reglas

- **Easy (2D):** the claw carries each piece across on its own; tap to drop it on the plank. Keep the plank
  level: when the level's bubble reaches the end of the red, it tips over and the round ends. Three
  lives: each piece that falls in the water costs one. Pieces come faster and faster. Score: pieces
  placed plus balanced turns (Perfect!).
- **Hard (3D):** a round disc on a pivot: drag each piece onto it, turn it with a held finger, turn the
  board with two fingertips. Keep the disc level (the hoop goes green); it capsizes past its limit.
  Three hearts: each piece lost costs one.

## Modos

Solo, at two levels. Lab-only parameters on a level: `?seed=N` (a fixed game), `?from=N` (start as hard
as after N pieces); on the hard one also `?spin=0` (skip the opening turn).

## Flujo

The level lever is Sudoku's, which is Pintaminas' hard-mode switch, copied as is (the owner: "exactly the
same"): down and green is easy, up and red is hard, with its wave, flash, sparks and the cover turning
red. The picture above it is the level it shows, moving (2D: the claw and the rocking plank; 3D: the
tipping disc and a hovering piece); it starts on easy, as in Sudoku.


Cover (a moving picture of the level, the level lever, ¡A jugar!, how to play, the site footer with 💬) → a level: its card (how to play, ▶ Play) →
the round (its HUD: ‹ back to the cover, lives, score, mute) → its game-over card with ↻ Again.

## Protocolo de mensajes

None: solo, nothing saved but mute (`balanza-lab:muted`) and, on the hard level, two one-time hints.

## Archivos

- `public/labs/wobbles/`: the cover (C-2's `index.html`, `rules.js` with its texts, `style.css`, `game.js`
  with the visit signal, `trackVisit`, D-208, and `game.json`).
- `public/labs/wobbles/easy/index.html`: the 2D prototype, markup, CSS and script inline, with the lab's
  head added and the site's own fonts. It came only as its finished page: edit it itself.
- `public/labs/wobbles/hard/index.html`: the 3D prototype, built from `tools/generators/wobbles-hard/`
  (`sim.js` physics, `texts.js`, `view.js`, `template.html`) by `python3 tools/generators/wobbles-hard/build.py`.
  Edit the sources, never the page.
- `tools/e2e/wobbles/game.mjs`: the cover's two levels, then each level in es/en/pt to its game-over card.
- Test hook: `window.__balanza` on each level (the prototype's own), `window.__wobbles` on the cover.

## Performance

### Easy (2D)

Optimized for phones (the owner's instructions, 2026-11-17): only the view changed, never the physics.

- **No blur per frame.** Everything that glows the same way every time (pieces, the plank in its three
  colors, the claw's carriage, the pivot and the level's dots, the texts) is drawn once with its glow into
  a sprite and then stamped; what changes shape every frame (the fuse, the red and green halos, the
  arrows, the rock's edge) glows with wide faint strokes, no blur. `__balanza.blurs` counts the blurs
  drawn outside a sprite: 0 while playing.
- **The still night** (moon, hills, water) is painted into its own canvas, again only when the camera's
  zoom moves more than 0.004; the stars that twinkle and the water's streaks go on top.
- **At most 2 device pixels per CSS pixel**, and adaptive quality: under 48 fps for 1.5 s lowers the
  sharpness (1 → 0.75 → 0.5); with no 15 % gain two seconds later it is undone and not tried again.
- **The cards** have no backdrop blur (a darker veil), and under a card the scene is drawn 4 times a second.
- Lab parameters: `?dpr=3` (no cap),
  `?quality=0.5` (fixed sharpness).
- Measured in headless Chrome with an emulated GPU, 390×812 at 3×: the whole page went from 11 to
  60 fps with a 13-piece pile; same results with the same seed. Not measured on a real phone yet.
- Not done from the instructions: the welded pile as one image, and an opaque canvas painting the
  page's sky itself (the page already reached 60 fps on the emulated GPU without them).


### Hard (3D)

Optimized for phones (the owner's instructions, 2026-11-17): only the view (`view.js`) and one CSS rule
(`build.py`) changed; `sim.js` is untouched (`build.py` still prints only `imul, max, min, sqrt`).

- **No blur per frame**: `glowLine` strokes the path four times, wider and fainter, for every line glow;
  `glowText` draws each glowing text once with a real blur and then copies it; the piece in hand's
  shadow is a filled shape with soft strokes; its halo is drawn once, around its outline (`silhouette`).
  `__balanza.blurs` counts blurs: only the first time a text is shown.
- **At most 2 device pixels per CSS pixel**; `pace` lowers it to 1.5 and then 1 when frames come under
  about 42 a second for two seconds while playing. Lab: `?res=3|2|1` fixes it.
- **The hearts** move 20 times a second and their canvas is left alone when nothing changed; a heart
  breaking is still drawn every frame. The top bar is written only when it changes.
- **The stars** are 5 fills, not 70. A 120 Hz screen draws every other frame; under a card, 1 in 4.
- **Cards** on a touch screen have no backdrop blur, a darker veil instead.
- Measured in headless Chrome with an emulated GPU, 390×812 at 3×, 5 pieces on the disc and one in hand:
  3 fps before, 60 after; same game with the same seed. Not measured on a real phone yet.
- Not done from the instructions: caching the paint order of what is fixed to the disc, pre-drawn heart
  poses, and cutting the shadow to each face with arithmetic instead of `clip()`.


## Excepciones a los cánones

All with the same root: the two levels are prototypes kept whole, as the owner asked (listed in
`game.json`'s `canonExceptions`). The cover follows the canons.

- **C-2**: no `engine.js` or `engine.test.mjs`: the physics lives in each level's page.
- **C-6**: a round lasts a minute or two and is not resumed: no `session.js`.
- **C-7**: no sharing through `compartir.js`, no `trackStart`/`trackFinish` (only the cover's visit).
- **C-19**: each level's own game-over card, not the exits from `fin.js`.
