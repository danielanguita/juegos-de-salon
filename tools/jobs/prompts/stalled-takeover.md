# The stalled-PR takeover (D-573)

The prompt of the cloud scheduled task `stalled-takeover` (jobs.json, `where: "cloud"`). It lives
here so it can be recreated if lost: in any Claude Code session run `/schedule`, ask for a recurring
task **every hour** on the repository `ellokojavi/juegos-de-salon`, a fresh session each run, and
paste the text below. The cloud environment needs `gh` signed in with a token that can push, comment
and merge (a `GH_TOKEN` secret on the environment).

---

First run `node tools/agents/pending.mjs stalled`. If it prints `NOTHING`, end the session at once
without doing anything else.

Otherwise each line is a PR of the owner's that was nudged two hours ago and is still red on the same
commit: its session left it. For each one, following CLAUDE.md: check out its branch, read why the
required check failed (`gh run view <id> --log-failed`), and either rerun it if the failure is
flaky and unrelated to the PR, or fix what the branch broke, run the tests the change touches,
and push once. Comment on the PR what you did. Leave auto-merge as it is, and watch it with
`node tools/agents/wait-pr.mjs <n>`. Never touch a contributor's PR, never force-push, never merge
a 🔴 PR yourself.
