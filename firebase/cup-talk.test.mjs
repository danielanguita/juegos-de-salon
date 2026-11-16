// Reactions and comments in a cup (D-562): who can write cupTalk/<code>/<day>/<target>/<author>.
// Runs the real rules in tools/firebase/rules-sim.mjs.
import assert from 'node:assert/strict';
import { createDb } from '../tools/firebase/rules-sim.mjs';

const T0 = 1_800_000_000_000;
const CODE = 'ABCDE';
const [ANA, BEA, CAR] = ['aaaaaa', 'bbbbbb', 'cccccc'];
const UID = { [ANA]: 'uana', [BEA]: 'ubea', [CAR]: 'ucar' };
const ok = (r, msg, db) => assert.equal(r, true, `${msg} (${db?.why?.join(', ')})`);
const no = (r, msg) => assert.equal(r, false, msg);
const res = { s: 5, ms: 1000, t: 'x', at: T0 };
const ts = { '.sv': 'timestamp' };

const db = createDb(undefined, {
  torneos: { [CODE]: {
    meta: { admin: CAR, end: T0 + 5 * 86400000 },
    players: { [ANA]: { name: 'Ana', at: T0 }, [BEA]: { name: 'Bea', at: T0 }, [CAR]: { name: 'Car', at: T0 } },
    results: { 1: { [ANA]: res, [BEA]: res } },
  } },
  torneoSeats: { [CODE]: Object.fromEntries(Object.entries(UID).map(([p, u]) => [p, { [u]: 'h' }])) },
});
const path = (d, target, author) => `cupTalk/${CODE}/${d}/${target}/${author}`;
const as = (who, changes, now = T0 + 1000) => db.update(changes, { uid: UID[who] ?? who, now });

ok(as(ANA, { [path(1, BEA, ANA)]: { e: 'fire', at: ts } }), 'a player who played reacts to another result of that day', db);
ok(as(ANA, { [`${path(1, BEA, ANA)}/e`]: 'clap', [`${path(1, BEA, ANA)}/at`]: ts }), 'the reaction can be changed', db);
ok(as(ANA, { [`${path(1, BEA, ANA)}/c`]: 'Bien jugado', [`${path(1, BEA, ANA)}/at`]: ts }), 'and a comment added', db);
no(as(ANA, { [`${path(1, BEA, ANA)}/c`]: 'Otra cosa' }), 'a comment cannot be edited');
ok(as(ANA, { [path(1, ANA, ANA)]: { c: 'Hoy me fue pésimo', at: ts } }), 'a player comments on their own result', db);

no(as(CAR, { [path(1, ANA, CAR)]: { e: 'fire', at: ts } }), 'not before playing that day');
no(as(ANA, { [path(1, CAR, ANA)]: { e: 'fire', at: ts } }), 'not on a result that does not exist');
no(as(BEA, { [path(1, BEA, ANA)]: { e: 'fire', at: ts } }), 'nobody writes as another player');
no(as('stranger', { [path(1, BEA, ANA)]: { e: 'fire', at: ts } }), 'a phone not seated writes nothing');
no(as(BEA, { [path(1, ANA, BEA)]: { e: 'poop', at: ts } }), 'only the listed reactions');
no(as(BEA, { [path(1, ANA, BEA)]: { c: 'x'.repeat(121), at: ts } }), 'a comment has at most 120 characters');
no(as(BEA, { [path(1, ANA, BEA)]: { at: ts } }), 'a reaction or a comment, not nothing');
no(as(BEA, { [path(1, ANA, BEA)]: { e: 'fire', at: ts, x: 1 } }), 'nothing else is saved');
no(as(BEA, { [path(1, ANA, BEA)]: { e: 'fire', at: T0 - 3600000 } }), 'the time is the server time');

// Hiding: only the target, only a comment, in cupTalkHidden where the author cannot write
const hide = (d, target, author) => `cupTalkHidden/${CODE}/${d}/${target}/${author}`;
no(as(BEA, { [hide(1, BEA, CAR)]: true }), 'nothing to hide where there is no comment');
no(as(CAR, { [hide(1, BEA, ANA)]: true }), 'another player cannot hide a comment');
no(as(ANA, { [hide(1, BEA, ANA)]: true }), 'the author cannot hide it either');
ok(as(BEA, { [hide(1, BEA, ANA)]: true }), 'the target hides a comment on their row', db);
no(as(ANA, { [hide(1, BEA, ANA)]: null }), 'the author cannot unhide it');
ok(as(BEA, { [hide(1, BEA, ANA)]: null }), 'the target can show it again', db);
ok(as(ANA, { [`${path(1, BEA, ANA)}/c`]: null, [`${path(1, BEA, ANA)}/at`]: ts }), 'the author deletes their comment', db);
ok(as(ANA, { [path(1, ANA, ANA)]: null }), 'and everything they said', db);

// Once the cup is over, nothing more
no(as(BEA, { [path(1, ANA, BEA)]: { e: 'fire', at: ts } }, T0 + 6 * 86400000), 'not after the cup ends');

// The admin deletes it all with the cup
no(as(BEA, { [`cupTalk/${CODE}`]: null }), 'a player cannot delete the whole talk');
ok(as(ANA, { [path(1, BEA, ANA)]: { c: 'Revancha', at: ts } }), 'a new comment', db);
ok(as(BEA, { [hide(1, BEA, ANA)]: true }), 'hidden', db);
ok(as(CAR, { [`cupTalk/${CODE}`]: null, [`cupTalkHidden/${CODE}`]: null }), 'the admin deletes it with the cup', db);

console.log('✓ cup-talk rules');
