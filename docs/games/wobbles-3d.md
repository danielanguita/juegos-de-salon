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

## Excepciones a los cánones

All with the same root: a prototype kept whole, as the owner asked (listed in `game.json`'s `canonExceptions`).

- **C-2**: no `style.css`, `rules.js`, `engine.js`, `engine.test.mjs`; its own HUD carries the ‹ instead of an `a.back` header.
- **C-3**: texts in the page's own `TEXTS` table (es/en/pt), not `LOCALES`.
- **C-6**: a round lasts a minute or two and is not resumed: no `session.js`.
- **C-7**: no sharing through `compartir.js`, no `trackStart`/`trackFinish` (only the visit).
- **C-19**: its own game-over card, not the exits from `fin.js`.
