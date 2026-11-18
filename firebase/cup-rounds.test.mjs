// A final by places (D-587) keeps each round in its result: torneos/<code>/results/<day>/<pid>/rs is
// "score/ms" per round, separated by spaces, and nothing else. Runs the real rules in tools/firebase/rules-sim.mjs.
import assert from 'node:assert/strict';
import { createDb } from '../tools/firebase/rules-sim.mjs';

const T0 = 1_800_000_000_000;
const CODE = 'ABCDE';
const ANA = 'aaaaaa';
const ts = { '.sv': 'timestamp' };
const fresh = () => createDb(undefined, {
  torneos: { [CODE]: {
    meta: { admin: ANA, end: T0 + 5 * 86400000, win: { 1: { a: T0 - 1000, b: T0 + 86400000 } } },
    players: { [ANA]: { name: 'Ana', at: T0 - 5000 } },
  } },
  torneoSeats: { [CODE]: { [ANA]: { uana: 'h' } } },
});
const send = r => { const db = fresh(); return [db.update({ [`torneos/${CODE}/results/1/${ANA}`]: { s: 84, ms: 502287, t: 'x', at: ts, ...r } }, { uid: 'uana', now: T0 }), db]; };

const [plain, db0] = send({});
assert.equal(plain, true, `a result without rounds is still saved (${db0.why?.join(', ')})`);
const [withRs, db1] = send({ rs: '100/42310 100/61000 89/90000 29/120000 100/30000' });
assert.equal(withRs, true, `a result with its rounds is saved (${db1.why?.join(', ')})`);
assert.equal(send({ rs: '100/1' })[0], true, 'one round');
assert.equal(send({ rs: '' })[0], false, 'never empty');
assert.equal(send({ rs: '100/-1' })[0], false, 'no negative time');
assert.equal(send({ rs: '100/1  50/2' })[0], false, 'one space between rounds');
assert.equal(send({ rs: 5 })[0], false, 'a string');
assert.equal(send({ rs: Array(17).fill('1/1').join(' ') })[0], false, 'at most 16 rounds');
console.log('cup-rounds: ok');
