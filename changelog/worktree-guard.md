level: patch

- **Sessions can no longer edit the main folder**: the new `worktree-guard.mjs` hook stops an Edit or Write in the repo's main folder, which parallel sessions share, and says how to open a worktree (D-135). Nothing changes for players.
