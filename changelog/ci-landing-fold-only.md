level: patch

- **Internal**: the check that every game's start button is above the fold now runs, on a PR, only for the games the PR changes (15 s instead of ~4 min per phone width), and every game's own PR checks its cover; a shared change and `main` still check every game (D-588).
