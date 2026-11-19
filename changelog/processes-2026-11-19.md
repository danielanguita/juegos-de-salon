level: patch

- Workshop: the push guard now also stops a `git push` when a decision file would fail `document.test.mjs` (a topic not in `topics.json`, a Status not in canonical form, a number twice), with the new `node tools/agents/document.mjs decisions` (CI failure signature seen on #1492 and #1574).
