level: patch

- **Two hooks so sessions stop forgetting steps**: `push-guard.mjs` now also stops a `git push` from a branch that brings changes without its changelog entry (D-300), and the new `pr-created.mjs` reminds the session, right after `gh pr create`, to check the lane, tick it when the owner asked for the work, turn on auto-merge and watch the PR. `docs/SESSIONS.md` lists the pre-approved checks and these hooks. Nothing changes for players.
