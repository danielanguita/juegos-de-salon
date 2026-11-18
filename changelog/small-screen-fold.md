level: patch

- **Small phones (320×568): the turn fits on screen.** In Hangman, after picking a letter, «Try the E» and «Buy a letter» now sit side by side above the fold (the drawing, the lives and the word tighten; keys stay 44 px). In Bulls and Cows solo and La Copa's number game, the keypad tightens, the hint steps aside from the second guess and the newest guess goes first, so its clues show without scrolling. 390 px is unchanged.
- New check `tools/e2e/play-fold.mjs` (D-520): mid-turn, the confirm button and the latest feedback must be above the fold at 320×568 in every language.
