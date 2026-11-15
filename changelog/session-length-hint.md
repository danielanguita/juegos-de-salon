level: patch

- **Long-session hint**: at 250 turns, and every 150 after, Claude Code shows the owner a one-line 📏 note with the session's size, since long sessions take half the tokens (`tools/agents/session-length.mjs`, docs/COSTS.md). It only informs.
