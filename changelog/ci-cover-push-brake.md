level: patch

- **Workshop: a push that changes a game's cover waits for its fold check.** `push-guard.mjs` stops the
  push until `node tools/e2e/landing-fold.mjs --only <game>` passed in that worktree on the cover as it is
  (~15 s a width); a passing run leaves a stamp in the worktree's git folder (`tools/e2e/landing-stamp.mjs`).
  PRs #1624 and #1629 took five pushes each, finding the cover's fold in CI.
