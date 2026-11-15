level: patch

- **Faster tests, lighter rounds**: the three slowest test files run their independent parts in parallel with the same checks (18 → 10 s, 11 → 2 s, 11 → 7 s); the processes agent's feedback step moved word for word to `docs/FEEDBACK-TRIAGE.md`, read only when there is feedback (36 → 27 KB per round); and a weekly cost check (`tools/agents/costs.mjs`, D-558) that never trades quality for savings.
