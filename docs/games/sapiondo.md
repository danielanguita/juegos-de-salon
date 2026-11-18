# 🐸 Sapiondo (lab, in Juegos en prueba)

A solo arcade highway crossing built for mobile touch controls and deterministic Cup play.

## Summary

- **Where:** `/labs/sapiondo/`, behind the lab's door (D-281, D-395), `noindex`, listed in `/labs/` under 🎲 Juegos en prueba. Not in `games.js` while in the lab. Id `sapiondo` in stats and `localStorage` (`juegos-de-salon:sapiondo:session`, `juegos-de-salon:sapiondo:best`). Facts live in `game.json`.
- **For whom:** 1 player, seeded tracks (`?seed=<n>`) for repeatable competition. Languages: es, en, pt (C-3).

## Rules

Cross 33 rows across three escalating sectors (Suburb Ave, City Highway, Night Expressway) to reach the pond.

- **Movement:** Forward (`▲`), Left (`◀`), Right (`▶`) only — no going backward.
- **Dash (`⚡`):** Leaps 2 lanes forward over traffic (3.2 s cooldown), triggered from the dedicated Dash button above Forward (or `Space`/`Shift` on keyboard).
- **Close-Call:** Passing within a narrow bumper margin or dashing directly over a vehicle awards bonus points (`35 × combo`) and refunds `1.0 s` of Dash cooldown.
- **Fruits:** Strawberries (`+40`), Mangoes (`+80`), and Golden Starfruit (`+150`) spawn on road lanes and scale with combo (`x1..x3`).
- **Scoring:** Distance (`15` per lane + `200` on finish) + Fruit/Close-Call bonuses + Time bonus (`round((42 - elapsed) * 12)` on finish).

## Modes

Solo (`solo`), with deterministic seeded tracks (`?seed=<n>`) ready for Cup integration.

## Flow

Intro (cover, resume panel, solo mode, 3-step rules, site footer) → Play (2.5D canvas stage, top HUD, 3 bottom overlay buttons + Dash pill) → Result (itemized breakdown: distance, bonus, time bonus, total; replay same seed or new seed; share through `compartir.js`; exits from `fin.js`, C-19).

## Message protocol

None: single-player. Active runs are serialized (`serialize` / `hydrate`) into `createSessionStore` (C-6) for resume across reloads.

## Files

- `public/labs/sapiondo/`: `game.json`, `icon.svg`, `index.html`, `style.css`, `rules.js`, `engine.js`, `engine.test.mjs`, `scene.js`, `game.js`.
- `tools/e2e/sapiondo/game.mjs`: end-to-end play script (`window.__sapiondo`).

## Exceptions to the canons

None.
