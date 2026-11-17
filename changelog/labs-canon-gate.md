level: patch

- **Lab games come in with their canons** (D-579): a new game in the lab, ours or a contributor's, passes the whole canons checklist before it merges. `public/labs/canons.test.mjs` checks its `game.json`, a measured cover, its result exits, its result in the rankings, the cover dialogs, the panel signals, its spec and its e2e scripts; `docs/ADD-GAME.md` ("The entry gate") names the test or reviewer for every other line. The generator now makes a game that passes all of it. The games already in the lab owe what `docs/labs-canon-debt.json` lists, and that list only shrinks.
