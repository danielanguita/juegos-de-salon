# 🐸 Sapiondo (lab, in Juegos en prueba)

A solo arcade highway crossing built for mobile touch controls and deterministic Cup play.

## Summary

- **Where:** `/labs/sapiondo/`, behind the lab's door (D-281, D-395), `noindex`, listed in `/labs/` under 🎲 Juegos en prueba. Not in `games.js` while in the lab. Id `sapiondo` in stats and `localStorage` (`juegos-de-salon:sapiondo:session`, `juegos-de-salon:sapiondo:best`). Facts live in `game.json`.
- **For whom:** 1 player, seeded tracks (`?seed=<n>`) for repeatable competition. Languages: es, en, pt (C-3).

## Rules

Cross 33 rows across three escalating sectors (Suburb Ave, City Highway, Night Expressway) to reach the pond.

- **Movement:** Board-wide swipes (forward, left, right — no going backward), with edge padding and `touch-action: none` to prevent browser scroll/navigation conflicts, plus keyboard support.
- **Dash (`⚡`):** A long forward swipe (with a live on-canvas distance gauge) leaps 2 lanes forward over traffic (`2.6 s` Normal / `3.2 s` Hard cooldown).
- **Close-Call:** Passing within a narrow bumper margin or dashing directly over a vehicle triggers celebratory UX (particles, sound, popup) and refunds `1.0 s` of Dash cooldown (0 points).
- **Fruits:** Strawberries, Mangoes, and Golden Starfruit spawn on road lanes and award `+1` point each.
- **Scoring:** `+1` per lane progressed + `+1` per fruit taken; ties are broken by faster completion time.

## Modes

Solo (`solo`), with deterministic seeded tracks (`?seed=<n>`) ready for Cup integration.

## Flow

Intro (cover, resume panel, solo mode, 3-step rules, site footer) → Play (2.5D canvas stage, top HUD, board-wide swipe controls + live Dash gauge) → Result (itemized breakdown: lanes, fruits, elapsed time tie-break, total; replay same seed or new seed; share through `compartir.js`; exits from `fin.js`, C-19).

## Message protocol

None: single-player. Active runs are serialized (`serialize` / `hydrate`) into `createSessionStore` (C-6) for resume across reloads.

## Files

- `public/labs/sapiondo/`: `game.json`, `icon.svg`, `index.html`, `style.css`, `rules.js`, `engine.js`, `engine.test.mjs`, `scene.js`, `game.js`.
- `tools/e2e/sapiondo/game.mjs`: end-to-end play script (`window.__sapiondo`).

## Exceptions to the canons

None.
