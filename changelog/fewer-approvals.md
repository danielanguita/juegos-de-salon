level: patch

- **Fewer approval prompts for the owner**: the read-only checks every session runs before a merge (lanes, preview, design and usability lint, pending, costs, jobs status, the unit-test runner, waiting for a PR) are pre-approved in `.claude/settings.json`. Nothing that writes, pushes or merges was added. Nothing changes for players.
