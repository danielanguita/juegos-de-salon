level: patch

- End-to-end groups (D-585): a new game's test jobs are timed from their siblings instead of a flat 90 s each, and the group target is 400 s, so a PR that adds a game no longer turns `groups.test.mjs` red. Nothing a player sees changes.
