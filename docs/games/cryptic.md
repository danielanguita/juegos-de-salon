# 🗝️ Cryptic (Críptico; lab, in Juegos en prueba)

Born from `node tools/generators/new-game.mjs cryptic`. The owner's idea (2026-11-19): the mechanics of
a daily cryptic-clue game (one clue a day, type the answer, hints, streak), with our own name (Críptico, the owner's pick), clues and
look. Spanish clues only for now, by the owner's call: the mechanics first, the other banks once it works.

## Resumen

- **Where:** `/labs/cryptic/`, behind the lab's door (D-281, D-395), `noindex`, its card in /labs/'s
  🎲 Juegos en prueba. Not in `games.js` while it is in the lab. Id `cryptic` in the usage signal and in
  `localStorage` (`juegos-de-salon:cryptic:session` for the round in progress,
  `juegos-de-salon:cryptic:days` for each day's result and the streak). Its facts are in `game.json`.
- **For whom:** one player, solo. The screens in es, en and pt; the clues in Spanish (a player in English
  or Portuguese sees «⚠️ The clues are in Spanish»).

## Reglas

- A cryptic clue reads two ways: a **definition** of the answer at one end, and a **wordplay** that builds
  it (anagram, reversal, hidden, charade, container, deletion, homophone, two definitions, initials).
  The clue ends with the answer's length, «(4)».
- The player types the answer as many times as needed. Accents do not matter, Ñ is its own letter.
  A guess of another length is a yellow warning and does not count; a wrong one is red, shakes the clue
  and stays until the next guess (the exception below).
- **The day: three clues** (D-598, the owner, 2026-11-20), the same for everyone on a date, at the
  player's own midnight: an easy one (20 points), a medium one (30) and a hard one (50), in that order, so a
  perfect day is 100. Each clue has its level in `clues.js` (`l`); each level is walked on its own with a
  stride, so every clue of a level comes out once before any repeats (`dayPicks`, `indexOf` in `engine.js`).
  The day is number `days since 2026-11-19 + 1`.
- **Hints:** 3 for the whole day, shared by its three clues; on one clue they come in order (the kind of
  wordplay, the definition underlined, the first letter). A hint costs 5 points on the easy clue, 8 on the
  medium one and 15 on the hard one. «Me rindo» shows the answer and scores 0 for that clue; the day goes on.
- **The streak:** days in a row with the day's three clues played to the end, whatever the score.
- **Practice:** one clue of any level at random (never today's three nor the player's own), with its own 3
  hints, scored out of its worth; it counts for nothing.
- Rankings: none yet (D-212: whether it keeps a score is the owner's call).

## Modos

Solo (`solo`): today's clue (the yellow start button) and practice (the ghost button under it).

## Flujo

Cover (the yellow «Jugar las pistas de hoy», under it the day's number or today's score, then «Practicar
con otras pistas», how to play) → play (the level, «pista 1 de 3» and its worth; the clue, one box per
letter that the player types straight into, the cursor moving on by itself (the owner, 2026-11-19), and
«Comprobar», the hint with its cost, «Me rindo», and the day's hints left) → step (✅ and the points, or 🏳️
and the answer; «Siguiente: 🟡 Media», then «Ver tu puntaje»; «Cómo se arma») → result (the score out of
100, the streak; Share, spoiler-free: each level's colour with ✅, a 💡 per hint or 🏳️; «Otra pista de
práctica», the exit to the lab from `fin.js`, C-19; then «Cómo se arma» for the three, with their points).
Today, once finished, opens on its result. A practice clue goes from play straight to its result.

## Protocolo de mensajes

None: one phone, no room. The round is saved after every move (`createSessionStore`, C-6); each day's
result stays on the phone for the streak.

## Archivos

- `public/labs/cryptic/game.json`: the manifest; `rules.js`: data and LOCALES (the kinds' names too);
  `clues.js`: the clue bank (`{ c, a, k, d, x }`, described at its top); `engine.js`: the pure rules
  (dates, the day's three clues, guesses, hints, points, streak); `engine.test.mjs`: the rules and every clue
  (its definition at one end, anagrams with the same letters, hidden words really hidden, reversals);
  `game.js`: screens and drawing; `style.css`: only its own, on the tokens.
- `tools/e2e/cryptic/game.mjs`: plays today's three clues (the easy one with a wrong guess, a hint and a
  reload; the medium one given up; the hard one with the day's last two hints) to the score, and a practice
  clue given up; `node tools/e2e/conformance.mjs labs/cryptic` checks the canons.
- Hook: `window.__cryptic` (`state()`, `clue()`, `answer()`).

## Writing a clue (the owner, 2026-11-19)

The first bank was too direct, and so was its first rewrite: the owner asked for clues that make the player
think and reach for a hint, while staying solvable. The owner's own clues are the bar.
Every clue in `clues.js` follows these rules:

1. **One natural sentence that tells another story.** No colon or semicolon splitting wordplay from
   definition: the seam is the player's to find («Di que se va, pero exige flores en el camarín»).
2. **Every piece is clued too, never written out**: a synonym (cara for costosa), a note (SOL, RE, LA), a Roman
   number (V), a chemical symbol (NA), a translation (tour for GIRA), as «beso catalán» is PETÓ. The step must be one the player takes: a word in the sense people use it (DADO as «seis caras», never «regalado», the owner). Only anagrams
   and hidden words show their letters, and then the definition carries the difficulty.
3. **A fair but sideways definition** at one end: «donde duermen los barcos» for a port, «tiene cuatro
   esquinas» for a city block, never the dictionary line.
4. **A blended indicator**: «alborotada», «vuelve», «sin que se viera», «le cortan la cabeza» read as part of
   the story, not as an instruction.
5. **One answer only**, and `x` shows every step of the solution. The engine test checks the mechanics it can
   (definition at an end, anagram letters, hidden and reversed words).

## Keeping the answers hidden (D-595)

The repo is public and the browser downloads `clues.js`, so no answer is ever written in plain text where a
player could search for it:

- **In `clues.js`** each clue keeps its level in `l` (e, m, h; not secret) and its answer and explanation sealed in `s` (`sealed.js`). Add one with
  `node tools/generators/cryptic-clues.mjs add < clue.json` (`{ c, a, k, d, x, by? }`, the file in the
  scratchpad, outside the repo); `list` prints the bank opened, in the terminal only.
- **In git and GitHub**: branch, commit, PR, changelog entry and docs say «one more clue» (its kind at most),
  never the answer nor the clue's text. A branch is named `cryptic-clue-<n>` or similar.
- **A player's proposal** becomes an issue without the clue or the answer (`feedback.mjs proposal <issue>`).
- `engine.test.mjs` fails on a plain clue line in `clues.js` and on a bank answer in capitals in the
  pending changelog, this game's folder, its e2e scripts and its docs. It is a veil, not a lock: someone set
  on it can decode the answers, and those added before D-595 stay in git history.

## The owner's clue (the owner, 2026-11-20)

When the owner proposes a clue in a session (the clue, its pieces and the answer), the session does not add
it straight away. In order:

1. **Evaluate it** against «Writing a clue» above: the wordplay gives exactly the answer and nothing else,
   every piece is clued and right (a verb in the person and tense the clue says), the definition sits at one
   end and is fair, the sentence reads as one story with no full stop or colon at the seam, it is not too
   easy, the answer is not already in the bank (`cryptic-clues.mjs list`), and its trick does not repeat
   the last few clues'.
2. **Comment**: what works and what does not, briefly and with the reason.
3. **Propose improvements** if there are any: one or two versions that keep the owner's idea and answer.
   None when it is already good; say so.
4. **Wait for the owner's choice**, then write it in the game: `cryptic-clues.mjs add`, sealed, its `k`,
   its level `l` (easy, medium or hard, D-598), `d` and `x`, in a 🟢 lab PR with auto-merge whose branch, commits and text never name the answer
   (D-595).

## A player's clue (the owner, 2026-11-19)

Part of the game, not a flag: at the end of every clue, «✍️ ¿Se te ocurre uno? Propón tu críptico» opens
the feedback form (`propose.js`) with the kind «🗝️ Críptico» already picked: the clue, the answer, how one
gets there (optional), the name to sign it with (the registered player's by default, editable) and the
optional email. It goes to `feedback/` with `tipo: 'criptico'`, so it reaches the panel's 💬 Feedback and
becomes a `feedback:cryptic-clue` issue that holds neither the clue nor its answer (D-595); the feedback
agent reads it with `feedback.mjs proposal`, judges it and gives the owner a one-tap choice
(`docs/FEEDBACK-TRIAGE.md`). An approved clue joins `clues.js`, sealed, with
`by: { n, j }`: the name, and the player id when the author had one.

- **Their clue's day.** Everyone plays the same clues on a day, so when the author's clue is among them the
  author gets the next clue of its level instead, and the result says «Hoy salió tu críptico» (D-598).
  Practice never draws a player's own clues. Everyone else sees «Críptico de <name>» under its solution. The
  author is known by their player id, so on a phone where they did not sign in they get it like anyone else.
- In English and Portuguese the form asks for the clue in Spanish, as long as the clues are only in Spanish.

## Excepciones a los cánones

- **C-8b:** a wrong guess is the normal move (as in El Ahorcado, D-56): it does not open a notice to close.
  It is signalled by colour, a shake, a sound and a line that stays until the next guess.
- **C-3:** the clues are in Spanish only for now (the owner, 2026-11-19); the screens are in the three languages.
