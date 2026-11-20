// Pacific-day counters (D-561): `activosPt/<pday>/<id>` and `entradasPt/<pday>` in a UTC day's bucket; `juegosPt/<pday>/<game>/<id>` (D-590).
// Runs the real rules in tools/firebase/rules-sim.mjs.
import assert from 'node:assert/strict';
import { createDb } from '../tools/firebase/rules-sim.mjs';

const db = createDb(undefined, {});
const w = (changes) => db.update(changes, { uid: 'anon', now: 1_800_000_000_000 });
const B = 'stats/prod/days/20773';
assert.equal(w({ [`${B}/activos/abcdefghij`]: 1, [`${B}/activosPt/20772/abcdefghij`]: 1 }), true, `an active browser by Pacific day (${db.why?.join(', ')})`);
assert.equal(w({ [`${B}/activosPt/20772/abcdefghij`]: 2 }), true, 'raised to 2 when it starts something');
assert.equal(w({ [`${B}/activosPt/20772/abcdefghij`]: 1 }), false, 'never lowered');
assert.equal(w({ [`${B}/activosPt/2077/abcdefghij`]: 1 }), false, 'a day number has 5 digits');
assert.equal(w({ [`${B}/entradasPt/20772/cup`]: { '.sv': { increment: 1 } } }), true, `a visit by Pacific day (${db.why?.join(', ')})`);
assert.equal(w({ [`${B}/entradasPt/20772/cup`]: 5 }), false, 'only one at a time');
// Active browsers by game (D-590)
assert.equal(w({ [`${B}/juegosPt/20772/tango/abcdefghij`]: 1 }), true, `a browser that started Tango that Pacific day (${db.why?.join(', ')})`);
assert.equal(w({ [`${B}/juegosPt/20772/tango/abcdefghij`]: 2 }), false, 'only 1');
assert.equal(w({ [`${B}/juegosPt/20772/Tango!/abcdefghij`]: 1 }), false, 'a game is a key');
assert.equal(w({ [`${B}/juegosPt/20772/tango/abc`]: 1 }), false, 'the id has 10 characters');
console.log('firebase/stats-pacific: OK');
