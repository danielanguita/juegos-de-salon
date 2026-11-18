import assert from 'node:assert/strict';
import { anyReturn, band, verdict, MIN_PLAYERS } from './retention.mjs';

// anyReturn: players (v=2) on a day who play again the next day
const porDia = { 10: new Map([['a', 2], ['b', 2], ['c', 1]]), 11: new Map([['a', 2], ['c', 2]]), 12: new Map() };
assert.deepEqual(anyReturn(porDia, { from: 10, to: 11 }), { pct: 25, players: 3 });   // 1 back of 4 player-days: a@10 (back), b@10, a@11, c@11
assert.deepEqual(anyReturn({}, { from: 1, to: 7 }), { pct: null, players: 0 });

assert.equal(band([1, 2]), null, 'too short for a band');
assert.deepEqual(band([50, 60, 70]), { mean: 60, sd: 8.2, floor: 51.8, deep: 43.7 });

const wk = (pct, players = 40) => ({ pct, players });
const hist = [60, 62, 58, 61, 59, 60, 63, 57].map(p => wk(p));
assert.equal(verdict([...hist, wk(60), wk(59)]).kind, 'within-noise');
assert.equal(verdict([...hist, wk(55), wk(54)]).kind, 'drop', 'two weeks under the floor');
assert.equal(verdict([...hist, wk(60), wk(50)]).kind, 'drop', 'one week under twice the band');
assert.equal(verdict([...hist, wk(60), wk(57.5)]).kind, 'within-noise', 'one week under the floor is not yet a drop');
assert.equal(verdict([...hist, wk(60), wk(40, MIN_PLAYERS - 1)]).kind, 'too-few');
assert.equal(verdict([wk(60), wk(50)]).kind, 'no-history');
console.log('retention: ok');
