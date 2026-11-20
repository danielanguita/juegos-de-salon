level: patch

- **The owner approves their own 🔴 PRs once** (D-596): after the tick, a push that touches no 🔴 file (a fix for a red check, a text, a doc) keeps the approval and the PR merges on its own; a push that changes a 🔴 file again, or any push to an outside PR, still asks.
