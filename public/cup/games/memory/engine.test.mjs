// 👀 Memorice in La Copa: the day's seed, the trial, the score, the card, Uno al día's curve and the texts
// (node public/cup/games/memory/engine.test.mjs). The rules themselves are tested in labs/memory/engine.test.mjs.
import assert from 'node:assert/strict';
import { generateDay, score, card, dayScore, verdictOf, newGame, currentRound, LIVES, LIVES_TRIAL, TRIAL_ROUNDS } from './engine.js';
import TEXTOS from './texts.js';

// The day: the same seed on every phone, another for the trial, with fewer lives and a cap of rounds
const d = generateDay('ABCD', 2);
assert.deepEqual(generateDay('ABCD', 2), d, 'the same code and day, the same game');
assert.notEqual(generateDay('ABCD', 3).semilla, d.semilla, 'another day, another game');
assert.equal(d.vidas, LIVES);
assert.equal(d.tope, undefined, 'a real day has no cap');
const t = generateDay('ABCD', 2, { sal: 'ensayo', ensayo: true });
assert.notEqual(t.semilla, d.semilla, 'the trial plays other boards');
assert.deepEqual([t.vidas, t.tope], [LIVES_TRIAL, TRIAL_ROUNDS]);
assert.deepEqual(currentRound(newGame(d.semilla)).board, currentRound(newGame(generateDay('ABCD', 2).semilla)).board, 'the same first board');

// The score: the rounds cleared, never negative; the card: one square per round
assert.equal(score({ score: 7 }), 7);
assert.equal(score({ score: -3 }), 0);
assert.equal(score(null), 0);
assert.equal(card({ score: 2, rounds: [true, false, true] }), '🟩🟥🟩');
assert.equal(card({ score: 0 }), '👀');
assert.equal(card({ score: 12, rounds: Array(25).fill(true) }).split('\n').length, 2, 'the last 20, ten to a line');

// Uno al día's 0–100: rises with the rounds and never reaches past 100
assert.deepEqual([0, 5, 10, 20, 60].map(dayScore), [0, 34, 57, 81, 99]);
for (let s = 1; s < 80; s++) assert.ok(dayScore(s) >= dayScore(s - 1) && dayScore(s) <= 100);
assert.deepEqual([0, 3, 6, 10, 15].map(verdictOf), [0, 1, 2, 3, 4]);

// The texts: the same keys, the same {placeholders} and the same list lengths in every language
const keys = o => Object.entries(o).flatMap(([k, v]) => (v && typeof v === 'object' && !Array.isArray(v) ? keys(v).map(x => `${k}.${x}`) : [k])).sort();
const holes = s => [...JSON.stringify(s).matchAll(/\{(\w+)\}/g)].map(m => m[1]).sort().join();
for (const lang of ['en', 'pt']) {
  assert.deepEqual(keys(TEXTOS[lang]), keys(TEXTOS.es), `${lang}: the same keys as es`);
  for (const part of ['juego', 'ui']) {
    for (const [k, v] of Object.entries(TEXTOS.es[part])) {
      assert.equal(holes(TEXTOS[lang][part][k]), holes(v), `${lang}.${part}.${k}: the same {placeholders}`);
      if (Array.isArray(v)) assert.equal(TEXTOS[lang][part][k].length, v.length, `${lang}.${part}.${k}: as many lines`);
    }
  }
}
for (const [lang, L] of Object.entries(TEXTOS)) assert.equal(L.ui.mmVerdicts.length, 5, `${lang}: a verdict for each verdictOf`);
console.log('✓ memorice in La Copa');
