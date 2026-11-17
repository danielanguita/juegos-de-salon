# ⚖️ The Wobbles 3D (Tembleque 3D; lab, in Juegos en prueba)

A balance game, the hard one of the pair, after Tembleque (`wobbles`). The owner built it with another AI outside this repo and brought it as a finished
page; it came into the lab **kept whole, as delivered** (the owner's ask), with only the lab's
surroundings added. Making it a game of the house (C-2's files, the shared modules) is later work.

## Resumen

- **Where:** `/labs/wobbles-3d/`, behind the lab's door (D-281, D-395), `noindex`, its card in /labs/'s
  🎲 Juegos en prueba. Not in `games.js` while it is in the lab. Its facts are in `game.json`.
- **For whom:** one player, one phone. In es, en and pt (Tembleque / The Wobbles / Tremelique).

## Reglas

A round disc on a pivot: drag each piece onto it, turn it with a held finger, turn the board with two fingertips. Keep the disc level (the hoop goes green); it capsizes past its limit. Three hearts: each piece lost costs one.

## Modos

Solo. Lab-only parameters: `?seed=N` (a fixed game), `?from=N` (start as hard as after N pieces), `?spin=0` (skip the opening turn).

## Flujo

Cover card (how to play, ▶ Play) → the round (HUD: ‹ back to the lab, lives, score, mute) → its
game-over card with the breakdown and ↻ Again.

## Protocolo de mensajes

None: solo, nothing saved but mute (`balanza-lab:muted`) and two one-time hints (the turn and rotate tips) in `localStorage`.

## Archivos

- `public/labs/wobbles-3d/index.html`: the prototype, markup, CSS and script inline, with the lab's head added
  (door, `noindex`, manifest, icon, `vigia.js`, `instalable.js`) and the site's own fonts (the same files).
- `public/labs/wobbles-3d/game.js`: only the visit signal for the panel (`trackVisit`, D-208).
- `tools/generators/wobbles-3d/`: its sources (`sim.js` physics, `texts.js`, `view.js`, `template.html`); `python3 tools/generators/wobbles-3d/build.py` rewrites the page, byte for byte the same as delivered plus the lab head. Edit the sources, never the page.
- `tools/e2e/wobbles-3d/game.mjs`: opens it in es/en/pt, starts a round, ends it on its card.
- Test hook: `window.__balanza` (the prototype's own).

## Performance

Optimized for phones (the owner's instructions, 2026-11-17): only the view (`view.js`) and one CSS rule
(`build.py`) changed; `sim.js` is untouched (`build.py` still prints only `imul, max, min, sqrt`).

- **No blur per frame**: `glowLine` strokes the path four times, wider and fainter, for every line glow;
  `glowText` draws each glowing text once with a real blur and then copies it; the piece in hand's
  shadow is a filled shape with soft strokes; its halo is drawn once, around its outline (`silhouette`).
  `__balanza.blurs` counts blurs: only the first time a text is shown.
- **At most 2 device pixels per CSS pixel**; `pace` lowers it to 1.5 and then 1 when frames come under
  about 42 a second for two seconds while playing. Lab: `?res=3|2|1` fixes it, `?fps=1` shows a counter.
- **The hearts** move 20 times a second and their canvas is left alone when nothing changed; a heart
  breaking is still drawn every frame. The top bar is written only when it changes.
- **The stars** are 5 fills, not 70. A 120 Hz screen draws every other frame; under a card, 1 in 4.
- **Cards** on a touch screen have no backdrop blur, a darker veil instead.
- Measured in headless Chrome with an emulated GPU, 390×812 at 3×, 5 pieces on the disc and one in hand:
  3 fps before, 60 after; same game with the same seed. Not measured on a real phone yet.
- Not done from the instructions: caching the paint order of what is fixed to the disc, pre-drawn heart
  poses, and cutting the shadow to each face with arithmetic instead of `clip()`.

## Excepciones a los cánones

All with the same root: a prototype kept whole, as the owner asked (listed in `game.json`'s `canonExceptions`).

- **C-2**: no `style.css`, `rules.js`, `engine.js`, `engine.test.mjs`; its own HUD carries the ‹ instead of an `a.back` header.
- **C-3**: texts in the page's own `TEXTS` table (es/en/pt), not `LOCALES`.
- **C-6**: a round lasts a minute or two and is not resumed: no `session.js`.
- **C-7**: no sharing through `compartir.js`, no `trackStart`/`trackFinish` (only the visit).
- **C-19**: its own game-over card, not the exits from `fin.js`.
