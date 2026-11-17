level: patch

- **Rule (D-576)**: a button that waits on an animation takes one tap only, and its game's e2e script proves it with a double tap (`tools/e2e/double-tap.mjs`). Blackjack's script now double-taps «Apostar» and «Siguiente ronda»; the check fails on the code before #1543.
