level: patch

- A PR that launches a game (its launch day moves while it is behind its flag) now runs `launch-check.mjs --screens` on GitHub, in the `launch` job of `end-to-end`, and cannot merge on a ✗ (D-606): the next launch cannot go out with a place missing.
