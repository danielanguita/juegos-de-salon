level: patch

- **A contributor's PR from a fork no longer shows a red `lane` check** for a permission they cannot fix: the job's token is read-only there, so it prints the lane, writes nothing and ends green; `owner-approval` stays missing, so the PR still waits for the owner (19 red runs on three fork PRs in two days).
