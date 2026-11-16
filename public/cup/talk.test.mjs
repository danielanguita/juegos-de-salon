// Reactions and comments in a cup (D-562): the pure part, talk.js.
import assert from 'node:assert/strict';
import { REACTIONS, MAX_COMMENT, cleanComment, commentProblem, canTalk, talkDays, rowTalk, received } from './talk.js';

const now = 1_800_000_000_000;
const L = {
  meta: { days: 3, end: now + 86400000, win: {} },
  results: { 1: { ana: { s: 5 }, bea: { s: 3 } }, 2: { bea: { s: 1 } } },
};

assert.equal(cleanComment('  hola \n  mundo  '), 'hola mundo', 'one line, spaces collapsed');
assert.equal(cleanComment('x'.repeat(200)).length, MAX_COMMENT, 'cut at the limit');
assert.equal(commentProblem('   '), 'empty');
assert.equal(commentProblem('pura mierda'), 'offensive');
assert.equal(commentProblem('¡Bien jugado!'), null);

assert.ok(canTalk(L, 1, 'ana', 'bea', now), 'both played day 1');
assert.ok(canTalk(L, 1, 'ana', 'ana', now), 'on your own result too');
assert.ok(!canTalk(L, 2, 'ana', 'bea', now), 'not before playing that day');
assert.ok(!canTalk(L, 1, 'ana', 'car', now), 'not on a result that does not exist');
assert.ok(!canTalk(L, 1, 'ana', 'bea', now + 2 * 86400000), 'not once the cup is over');
assert.deepEqual(talkDays(L, 'bea', now), [2, 1], 'the days played, newest first');
assert.deepEqual(talkDays(L, 'car', now), []);

const v = {
  talk: { 1: { bea: {
    ana: { e: 'fire', c: 'Bien', at: 2 },
    car: { e: 'fire', at: 3 },
    dan: { e: 'clap', c: 'Uf', at: 1 },
    eva: { e: 'nope', c: 'Feo', at: 4 },
  } } },
  hidden: { 1: { bea: { eva: true } } },
};
const seen = rowTalk(v, 1, 'bea', 'ana');
assert.deepEqual(seen.reactions, [{ key: 'fire', emoji: REACTIONS.fire, n: 2 }, { key: 'clap', emoji: REACTIONS.clap, n: 1 }], 'counted in REACTIONS order, unknown keys out');
assert.deepEqual(seen.comments.map(x => x.c), ['Uf', 'Bien'], 'in the order they came, the hidden one out');
assert.equal(seen.mine.c, 'Bien', 'what I said');
const target = rowTalk(v, 1, 'bea', 'bea');
assert.deepEqual(target.comments.map(x => [x.c, x.h]), [['Uf', false], ['Bien', false], ['Feo', true]], 'the target sees the hidden one, marked');
assert.deepEqual(rowTalk({}, 1, 'bea', 'ana'), { reactions: [], comments: [], mine: null }, 'nothing said');
assert.equal(received(v, 'bea'), 3 + 2, 'three valid reactions and two visible comments');

console.log('✓ cup talk');
