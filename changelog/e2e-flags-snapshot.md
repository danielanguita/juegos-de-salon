level: patch

- **Launching a feature from /labs/ no longer turns open PRs red** (D-578): the end-to-end tests read a snapshot of the flags kept in the repository, refreshed by the processes round; and adding a test no longer fails the README check.
