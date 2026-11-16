// Reactions and comments in a cup (D-562): the pure part, talk.js.
import assert from 'node:assert/strict';
import { REACTIONS, MAX_COMMENT, cleanComment, commentProblem, canTalk, talkDay, firstComment, rowTalk, received } from './talk.js';

const now = 1_800_000_000_000;
const H = 3600000;
// Day 1 yesterday, day 2 today, day 3 tomorrow
const L = {
  meta: { days: 3, end: now + 30 * H, win: { 1: { a: now - 30 * H, b: now + 18 * H }, 2: { a: now - 6 * H, b: now + 30 * H }, 3: { a: now + 18 * H, b: now + 30 * H } } },
  results: { 1: { ana: { s: 5 }, bea: { s: 3 } }, 2: { ana: { s: 4 }, bea: { s: 1 } } },
};

assert.equal(cleanComment('  hola \n  mundo  '), 'hola mundo', 'one line, spaces collapsed');
assert.equal(cleanComment('x'.repeat(200)).length, MAX_COMMENT, 'cut at the limit');
assert.equal(commentProblem('   '), 'empty');
assert.equal(commentProblem('pura mierda'), 'offensive');
assert.equal(commentProblem('¡Bien jugado!'), null);

assert.equal(talkDay(L, now), 2, 'today is the day talked about');
assert.equal(talkDay(L, now + 2 * 86400000), null, 'none once the cup is over');
assert.ok(canTalk(L, 2, 'ana', 'bea', now), 'both played today');
assert.ok(canTalk(L, 2, 'ana', 'ana', now), 'on your own result too');
assert.ok(!canTalk(L, 1, 'ana', 'bea', now), 'not on a past day');
assert.ok(!canTalk(L, 2, 'car', 'bea', now), 'not before playing today');
assert.ok(!canTalk(L, 2, 'ana', 'car', now), 'not on a result that does not exist');

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
assert.equal(firstComment(v, 1, 'bea').c, 'Uf', 'the first comment that is not hidden, for the row');
assert.equal(firstComment({ talk: { 1: { bea: { eva: { c: 'Feo', at: 1 } } } }, hidden: v.hidden }, 1, 'bea'), null, 'a hidden one is not shown on the row, not even to its target');

console.log('✓ cup talk');
