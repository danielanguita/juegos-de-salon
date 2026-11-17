# ⚖️ The Wobbles (Tembleque; lab, in Juegos en prueba)

A balance game, the easy one of the pair. The owner built it with another AI outside this repo and brought it as a finished
page; it came into the lab **kept whole, as delivered** (the owner's ask), with only the lab's
surroundings added. Making it a game of the house (C-2's files, the shared modules) is later work.

## Resumen

- **Where:** `/labs/wobbles/`, behind the lab's door (D-281, D-395), `noindex`, its card in /labs/'s
  🎲 Juegos en prueba. Not in `games.js` while it is in the lab. Its facts are in `game.json`.
- **For whom:** one player, one phone. In es, en and pt (Tembleque / The Wobbles / Tremelique).

## Reglas

The claw carries each piece across on its own; tap to drop it on the plank. Keep the plank level: when the level's bubble reaches the end of the red, it tips over and the round ends. Three lives: each piece that falls in the water costs one. Pieces come faster and faster. Score: pieces placed plus balanced turns (Perfect!).

## Modos

Solo. Lab-only parameters: `?seed=N` (a fixed game), `?from=N` (start as hard as after N pieces).

## Flujo

Cover card (how to play, ▶ Play) → the round (HUD: ‹ back to the lab, lives, score, mute) → its
game-over card with the breakdown and ↻ Again.

## Protocolo de mensajes

None: solo, nothing saved but mute (`balanza-lab:muted`) in `localStorage`.

## Archivos

- `public/labs/wobbles/index.html`: the prototype, markup, CSS and script inline, with the lab's head added
  (door, `noindex`, manifest, icon, `vigia.js`, `instalable.js`) and the site's own fonts (the same files).
- `public/labs/wobbles/game.js`: only the visit signal for the panel (`trackVisit`, D-208).
- The 2D game came only as its finished page: edit `index.html` itself.
- `tools/e2e/wobbles/game.mjs`: opens it in es/en/pt, starts a round, ends it on its card.
- Test hook: `window.__balanza` (the prototype's own).

## Performance

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

## Excepciones a los cánones

All with the same root: a prototype kept whole, as the owner asked (listed in `game.json`'s `canonExceptions`).

- **C-2**: no `style.css`, `rules.js`, `engine.js`, `engine.test.mjs`; its own HUD carries the ‹ instead of an `a.back` header.
- **C-3**: texts in the page's own `TEXTS` table (es/en/pt), not `LOCALES`.
- **C-6**: a round lasts a minute or two and is not resumed: no `session.js`.
- **C-7**: no sharing through `compartir.js`, no `trackStart`/`trackFinish` (only the visit).
- **C-19**: its own game-over card, not the exits from `fin.js`.
