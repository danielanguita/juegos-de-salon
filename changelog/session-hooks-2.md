level: patch

- **Two more hooks catch slips while the file is open**: `css-edited.mjs` shows the design lint's hits right after a stylesheet is edited, and `stop-tests.mjs` runs the unit tests a branch's changes touch when a turn ends (each state once) and keeps the turn going while one fails. Nothing changes for players.
