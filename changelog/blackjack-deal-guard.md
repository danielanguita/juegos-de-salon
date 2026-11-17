level: patch

- **Blackjack (lab)**: Guard `dispatch` against double-taps during the felt's round-clear fade and active deal animations, and ensure `animateTransition` always clears `dealReveal` on exit so the table cannot get stuck with no cards.
