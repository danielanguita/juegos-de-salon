level: patch

- `launch-check.mjs` no longer gives false ✗: the cover's ranking in the static pass is a hint (a cover may draw it with `bloqueTabla`; `--screens` decides), the home card gets 12 s to appear when several games are checked together, and `--live` judges the launch's own splash (one that is on, else the one switched last), not an older game's campaign that is rightly off.
