level: patch

- **Costs, measured**: the landing-fold check runs as two jobs, one per phone width, with the same checks (a full end-to-end run ~8.5 → ~7 min); `tools/agents/costs.mjs` now also reports end to end, every workflow's minutes and Claude's tokens from this machine's sessions; `docs/COSTS.md` explains the numbers and the levers (D-558).
