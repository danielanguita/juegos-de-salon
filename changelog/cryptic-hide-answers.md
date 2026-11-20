level: patch

- **Críptico (lab)**: the answers no longer show in the public repo (D-595). `clues.js` keeps each answer and explanation sealed (`sealed.js`, added with `tools/generators/cryptic-clues.mjs`); a clue a player proposes becomes an issue without the clue or its answer (`feedback.mjs proposal <issue>` reads it); and `engine.test.mjs` fails when an answer shows in the pending changelog, the game's files or its docs. The example clue on the proposal form left the bank, since the form gives its answer.
