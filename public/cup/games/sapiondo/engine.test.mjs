import assert from 'node:assert/strict';
import { generateDay, newGame, step, act, score, dayScore, card, FINISH_ROW, STEP } from './engine.js';

// 1. generateDay produces deterministic seeds for identical code + day
const d1 = generateDay('ABCD', 1);
const d2 = generateDay('ABCD', 1);
assert.deepEqual(d1, d2);

const trial = generateDay('ABCD', 1, { sal: 'ensayo', ensayo: true });
assert.notEqual(trial.semilla, d1.semilla);
assert.ok(trial.finishRow < FINISH_ROW, 'trial is shorter than full Cup crossing');

// 2. Identical Cup seed builds identical highway
const a = newGame({ seed: d1.semilla, finishRow: d1.finishRow });
const b = newGame({ seed: d1.semilla, finishRow: d1.finishRow });
assert.deepEqual(a.fruits, b.fruits);

// 3. Clearing the highway yields score & dayScore in [0, 100]
for (const l of a.lanes) l.vehicles = [];
a.frog.row = a.finishRow - 1;
a.frog.fromRow = a.finishRow - 1;
a.frog.toRow = a.finishRow - 1;
a.frog.y = a.finishRow - 1;
a.maxRow = a.finishRow - 1;
act(a, 'up');
for (let i = 0; i < 30; i++) step(a, STEP);
assert.equal(a.mode, 'win');
assert.ok(score(a) > 0);
assert.ok(dayScore(score(a)) > 0 && dayScore(score(a)) <= 100);
assert.match(card({ maxRow: a.maxRow, finishRow: a.finishRow, fruitsTaken: 1, closeCalls: 2, won: true }), /🐸 33\/33/);

console.log('sapiondo cup engine.test.mjs ok');
