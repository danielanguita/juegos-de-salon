// A day's result may bring its own tiebreak `d` (Aletazo's dead centers):
// torneos/<code>/results/<day>/<pid> takes it as a number from 0 to 1000, and still nothing else.
// Runs the real rules in tools/firebase/rules-sim.mjs.
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
const send = r => { const db = fresh(); return [db.update({ [`torneos/${CODE}/results/1/${ANA}`]: { s: 48, ms: 42887, t: 'x', at: ts, ...r } }, { uid: 'uana', now: T0 }), db]; };

const [plain, db0] = send({});
assert.equal(plain, true, `a result without d is still saved (${db0.why?.join(', ')})`);
const [withD, db1] = send({ d: 11 });
assert.equal(withD, true, `a result with its tiebreak d is saved (${db1.why?.join(', ')})`);
assert.equal(send({ d: 0 })[0], true, 'd may be 0');
assert.equal(send({ d: -1 })[0], false, 'd is never negative');
assert.equal(send({ d: 1001 })[0], false, 'd has a ceiling');
assert.equal(send({ d: '11' })[0], false, 'd is a number');
assert.equal(send({ x: 1 })[0], false, 'nothing else is saved');
console.log('cup-tiebreak: ok');
