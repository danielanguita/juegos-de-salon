# The contributions round (D-568)

The prompt of the cloud scheduled task `contributions` (jobs.json, `where: "cloud"`). It lives
here so it can be recreated if lost: in any Claude Code session run `/schedule`, ask for a
recurring task **every hour** on the repository `ellokojavi/juegos-de-salon`, model Sonnet, a fresh
session each run, and paste the text below. The cloud environment needs `gh` signed in with a
token that can read PRs, comment and run workflows (a `GH_TOKEN` secret on the environment).

---

Act as the contributions agent: follow `.claude/agents/contributions.md` exactly. First run
`node tools/agents/contributions.mjs check`; if it prints `nothing to do`, end the session at once
without doing anything else. Do not create branches, commits or PRs.
