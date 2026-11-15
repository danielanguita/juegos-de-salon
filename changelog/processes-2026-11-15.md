level: patch

- Workshop: the push guard now checks the worktree a `cd` moves to before `git push`, not the session folder, so a stale README block or decisions index stops the push again (#1416, #1436).
