// The player's cups for the profile (lab flag profile): name, dates, place and who won, from the cup's own table.
import assert from 'node:assert/strict';
import { escena } from './demo.js';
import { cupLine, loadHistory, cupsOfHash } from './history.js';

const now = Date.now();
const { L, e, meta } = escena('podium', { now });
const end = Math.max(now, meta.end) + 1000;
const line = cupLine(L, e.yo, end);
assert.ok(line, 'a line for a player in the cup');
assert.equal(line.over, true);
assert.equal(line.name, meta.name);
assert.ok(line.start > 0 && line.end >= line.start, 'its dates');
assert.ok(Number.isInteger(line.place) && line.place >= 1 && line.place <= line.of, 'the player\'s place, of how many');
assert.ok(line.champions.length >= 1, 'who won');
assert.equal(cupLine(L, 'nobody', end), null, 'not in the cup: no line');
assert.equal(cupLine(null, e.yo, end), null);
const running = cupLine(L, e.yo, meta.win[1].a + 1000);
assert.equal(running.over, false);
assert.deepEqual(running.champions, [], 'no champion before it ends');

assert.deepEqual(cupsOfHash('#c=ABCDE.p1,FGHIJ.p2'), [{ code: 'ABCDE', p: 'p1' }, { code: 'FGHIJ', p: 'p2' }]);
assert.deepEqual(cupsOfHash(''), []);
const store = { getItem: () => JSON.stringify({ ABCDE: L }) };
const got = await loadHistory([{ code: 'ABCDE', p: e.yo }, { code: 'ZZZZZ', p: 'x' }, { code: 'bad!', p: 'x' }], { test: true, storage: store, now: end });
assert.deepEqual(Object.keys(got), ['ABCDE'], 'the cups it could read');
const fetched = await loadHistory([{ code: 'ABCDE', p: e.yo }], { now: end, fetchFn: async url => ({ ok: /torneos\/ABCDE\.json$/.test(url), json: async () => L }) });
assert.equal(fetched.ABCDE.place, line.place, 'over REST, the same');
console.log('✓ cup history');
