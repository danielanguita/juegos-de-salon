level: patch

- **Two agents take load off the daily round**: the feedback agent (`.claude/agents/feedback.md`) handles 🐞 reports end to end (reproduce, fix in its own PR, decide, close, answer the player once), and the ci-health agent (`.claude/agents/ci-health.md`) reads the failure signatures, flaky tests, test levels and the weekly cost numbers and builds one mechanism a week. `processes.mjs check` dispatches them (feedback when reports wait, ci-health once a week); the processes agent reviews what they deliver. Nothing changes for players.
