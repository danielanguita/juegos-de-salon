// ¡Al toque!'s engine: node public/in-a-flash/engine.test.mjs
import assert from 'node:assert/strict';
import { RUN, newCode, speedAt, gamePoints, score, score100, runOrder } from './engine.js';

const IDS = Array.from({ length: 28 }, (_, i) => `g${i}`);

assert.deepEqual([0, 2, 3, 6, 9].map(speedAt), [1, 1, 1.1, 1.2, 1.3], 'speed goes up 10 % every three games');
assert.equal(gamePoints(3, 9), 39, '★★★ at ×1.3');
assert.equal(gamePoints(0, 5), 0);

const perfect = score(Array(RUN).fill(3));
assert.equal(perfect.points, perfect.max, 'a perfect run scores the max');
assert.equal(score([3, 3, 1, 3]).games.map(g => g.streak).join(), '0,5,0,0', 'a streak starts at the second ★★ in a row and breaks below ★★');
assert.equal(score([]).points, 0);

assert.equal(score100(Array(RUN).fill(3)), 100);
assert.equal(score100(Array(RUN).fill(0)), 0);
assert.ok(score100([0, 3, 3, 3, 3, 3, 3, 3, 3, 3]) > score100([3, 3, 3, 3, 3, 3, 3, 3, 3, 0]), 'a miss at high speed weighs more');

const a = runOrder(IDS, 'K7Q2X'), b = runOrder(IDS, 'K7Q2X'), c = runOrder(IDS, 'ABCDE');
assert.deepEqual(a, b, 'the same seed gives the same run on every phone');
assert.notDeepEqual(a, c, 'another seed, another run');
assert.equal(new Set(a).size, RUN, 'ten different games');
assert.equal(new Set(runOrder(IDS, '')).size, RUN, 'without a seed, still ten different');
// The two clock games never share a run, and the run still has ten
for (let k = 0; k < 300; k++) { const o = runOrder([...IDS, 'quehora', 'hands'], `S${k}`, RUN, [['quehora', 'hands']]);
  assert.ok(!(o.includes('quehora') && o.includes('hands')), `run ${k}: one clock game at most`); assert.equal(o.length, RUN); }
assert.match(newCode(), /^[A-HJ-NP-Z]{5}$/, 'a run code: 5 letters, no I or O');
console.log('✓ microgames engine');

// La Copa (D-331): the day's run is the same for everyone, ten different games, the trial three; the stage's ids are the engine's
{
  const { generateDay, IDS, points, runScore100, dayScore, card } = await import('./engine.js');
  const a = generateDay('K7Q2X', 3), b = generateDay('K7Q2X', 3), c = generateDay('K7Q2X', 3, { sal: 'ensayo', ensayo: true });
  assert.deepEqual(a, b, 'the same day, the same run');
  assert.equal(new Set(a.orden).size, 10, 'ten different games');
  assert.ok(!(a.orden.includes('quehora') && a.orden.includes('hands')), 'never both clock games');
  assert.equal(c.orden.length, 3, 'the trial plays three');
  assert.equal(IDS.length, 29, 'twenty-nine microgames');
  const { readFileSync } = await import('node:fs');
  const stage = readFileSync(new URL('./stage.js', import.meta.url), 'utf8');
  const meta = [...stage.matchAll(/^\s{4}\['([a-z]+)', t\('/gm)].map(m => m[1]);
  assert.deepEqual(meta, IDS, "stage.js META and engine.js IDS list the same games in the same order");
  assert.equal(points({ marks: [3, 3, 3, 3, 3, 3, 3, 3, 3, 3] }), 381, 'a perfect run is 381');
  assert.equal(runScore100({ marks: [3, 3, 3], orden: a.orden }) < 40, true, 'a run left halfway counts the rest as 0');
  assert.equal(dayScore(200, { d100: 77 }), 77, 'Uno al día takes the run\'s own 0–100');
  assert.equal(card({ marks: [3, 2, 1, 0, 3, 3] }), '🟩🟨🟧⬛🟩\n🟩');
}
