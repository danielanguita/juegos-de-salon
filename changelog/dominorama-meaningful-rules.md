level: patch

- **🎲 Dominorama: every `>` and `<` rule can fail** (issue #1656): the board builder no longer shows a rule that holds whatever the player does (`>-1`, `>0` on a board with no blank, `<13` on two cells), which read like a bug. It checks each threshold against the board's own dominoes at every step that sets or reshapes a rule, and the engine test checks every zone of every test board.
