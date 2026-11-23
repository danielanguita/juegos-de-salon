---
name: launch-game
description: Launching a lab game to every player, or preparing that launch: taking it out of the lab behind its flag, its splash, scheduling the hour, checking it live, and the cleanup after. Use when the owner says "lancemos X", "prepara el lanzamiento de X", "programa X para el …", or asks why a launched game is missing somewhere (Rankings, a cover, La Bodega, La Copa, the home page).
---

# Launching a game

The playbook is `docs/LAUNCH.md` (every step, and the past misses that made it); this is the order to walk it
in, with the commands. `tools/agents/launch-check.mjs` checks every place a launched game shows: run it,
don't rely on reading. Nothing launches without the owner's word and hour (Pacific, D-561).

## 0. Where it stands (2 minutes)

```
node tools/agents/launch-check.mjs <id> [<id>…]          # what the repo has; ✗ says what is missing and where
gh pr list --search "<name>" --state all -L 10            # the preparation and splash PRs, if any
curl -s https://juegos-de-salon-default-rtdb.firebaseio.com/flags/<flag>.json
```

Say to the owner, in one message, which of the four moments are done (preparation, splash, launch, cleanup),
and what is missing. A merged PR is not a done step: the check is.

## 1. Preparation PR (LAUNCH.md §1)

Read `docs/LAUNCH.md` §1, `docs/ADD-GAME.md` and the `game-change` skill. Copy a precedent of the same kind:
a La Copa game like Croc! (`3f60e2d8` Sudoku), a manifest game like Tembleque (`public/wobbles/`). Its cover is
the house's: «<icon> Empezar», Instrucciones and Entrar, **its ranking under them** (naming the level if it has
levels), the result's table naming the same level. Then:

```
python3 -m http.server 8765 -d public &                  # in your worktree
node tools/agents/launch-check.mjs <id> --screens         # green, or it is not ready
```

Agents: usability, player, documentation (`docs/MERGING.md`). Merge green.

## 2. Splash PR (LAUNCH.md §2)

The campaign in `CAMPAIGNS` with `requires: [<flags>]`, items naming `game: '<id>'`, its clips and its folder;
`tools/e2e/splash/margins.mjs` green. The owner looks at it with `?splash=<id>` before launch.

## 3. The launch (LAUNCH.md §3)

1. Ask the owner, with one-tap options: the hour (Pacific, also UTC), the splash's end (`until`, an exact
   moment), which campaign it turns off, and whether any lab flag launches with it.
2. The launch-day PR: `nuevoDesde` = the launch day, `unoAlDia.desde` ≥ it (Pacific days), and the README and
   `docs/games/<id>.md` say «launched <date>, <hour> Pacific». Record it in the D-529 uses line of `docs/AGENTS.md`.
   `launch-check.mjs <ids> --screens` green again on that branch.
3. The two cloud tasks from `tools/jobs/prompts/launch.md` (launch at the hour, alarm 10 minutes later). The
   **owner** creates them with `/schedule`, or a cloud session the owner opened: a session you start and
   instruct is denied `create_trigger`. Ask a day ahead. If they are not on claude.ai/code → Routines 30
   minutes before the hour, dispatch it yourself at the hour, in the background:
   ```
   gh workflow run launch.yml --repo ellokojavi/juegos-de-salon -f flags="<flags>" -f splash="<campaign>" \
     -f turn_off="<old campaign>" -f not_before="<ISO UTC>" -f until="<ISO UTC>" -f first=true
   ```
   (`launch.mjs` writes nothing before `not_before`, so an early run is harmless).

## 4. Checked live, before telling the owner

```
node tools/agents/launch-check.mjs <ids> --live
```

Then by eye at phone width (LAUNCH.md §3's list): the splash as a new visitor (a real browser hides it from
automation: `navigator.webdriver`), the home card with ✨ Nuevo, the cover with its ranking, a game to the
result, `/records/`, La Copa's create screen and 🎲 as a new visitor, `/labs/` with a lab key (or
`--screens`, which moves the card on the page). Tell the owner only what you saw, with what was not seen.

## 5. Cleanup PR, a few days later (LAUNCH.md §4)

Remove `lanza` and the `FLAGS` row, the game joins `POZO_FIJO`, its `/labs/` card's HTML moves for good to
✨ Mejoras lanzadas, the prototype becomes a bridge, the flags snapshot is on *all*.

## When something launched is missing

Run `launch-check.mjs <id> --screens --live` first: it names the place. Fix the game, then add the miss to
LAUNCH.md's table **and** a check to `launch-check.mjs` in the same PR (RULES.md rule 5), so the next launch
cannot repeat it.
