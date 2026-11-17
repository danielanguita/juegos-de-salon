level: patch

- **Uno al día, straight to the result (lab)**: Shinobi and Aletazo no longer show their own end screen with a «Ver resultado» button in Uno al día; the run ends and the day's result opens, with the breakdown folded in it. Aletazo keeps its fall and verdict on screen for a moment. Games whose end shows the solution (Palabra, Sudoku, Desenredar…) keep theirs. Behind flag `uad-skip-end`.
- **Tests**: `cup/talk.mjs` no longer expects the tester controls of the comments balloon once `cup-talk-hint` is launched (D-567 drops them); it failed on every PR since the launch.
