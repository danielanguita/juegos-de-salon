level: minor

- **Outside PRs get an answer within the hour** (D-568): a new `contributions` agent runs every hour as a Claude Code cloud scheduled task, reviews only the outside PRs that changed since its last look, comments what is missing in the contributor's language, and tells the owner (a bot comment, so GitHub emails it) when a PR waits only for their Yes. It never pushes, approves or merges. A new kind of job, `cloud`, in `jobs.json`, with its prompt in the repository so it can be recreated.
