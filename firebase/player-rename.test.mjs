// A player renames themselves (D-600): the name, its search key and the mark for the hourly job, from a
// seated phone that proved the PIN in the last minute. Runs the real rules in tools/firebase/rules-sim.mjs,
// and the same change against the test store (jugador-local.js), which mirrors them.
import assert from 'node:assert/strict';
import { createDb } from '../tools/firebase/rules-sim.mjs';
import { crearAlmacenLocal } from '../public/assets/js/jugador-local.js';
import { crearJugador } from '../public/assets/js/jugador.js';

const H = c => c.repeat(64);
const PIN = H('a'), WRONG = H('b');
const T0 = 1_800_000_000_000;
const ok = (r, msg, db) => assert.equal(r, true, `${msg} (${db?.why?.join(', ')})`);
const no = (r, msg) => assert.equal(r, false, msg);

{
  const jid = 'abcd1234';
  const db = createDb(undefined, {
    jugadores: { [jid]: { n: 'Ana', at: T0 } },
    jugadorNombres: { ana: { [jid]: true } },
    jugadorKeys: { [jid]: PIN },
    jugadorSeats: { [jid]: { u1: PIN } },
  });
  const attempt = (uid, h, now) => db.update({ [`jugadorIntentos/${jid}`]: { h, u: uid, at: { '.sv': 'timestamp' } } }, { uid, now });
  const rename = (uid, now, extra = {}) => db.update({
    [`jugadores/${jid}/n`]: 'Anita', [`jugadorNombres/anita/${jid}`]: true, [`jugadorNombres/ana/${jid}`]: null,
    [`jugadorRenombres/${jid}`]: { '.sv': 'timestamp' }, ...extra,
  }, { uid, now });

  no(rename('u1', T0 + 1000), 'a seated phone does not rename without the PIN');
  ok(attempt('u1', WRONG, T0 + 1000), 'an attempt with a wrong PIN', db);
  no(rename('u1', T0 + 1100), 'a wrong PIN renames nothing');
  ok(attempt('u2', PIN, T0 + 7000), 'a phone that is not seated proves the PIN', db);
  no(rename('u2', T0 + 7100), 'a phone that is not seated renames nothing');
  ok(attempt('u1', PIN, T0 + 13000), 'an attempt with the PIN', db);
  no(rename('u1', T0 + 13000 + 61000), 'an attempt older than a minute renames nothing');
  ok(attempt('u1', PIN, T0 + 80000), 'a fresh attempt with the PIN', db);
  no(db.update({ [`jugadores/${jid}/n`]: '' }, { uid: 'u1', now: T0 + 80100 }), 'the name is never empty');
  no(db.update({ [`jugadores/${jid}/n`]: 'x'.repeat(21) }, { uid: 'u1', now: T0 + 80100 }), 'the name is 20 characters at most');
  no(db.update({ [`jugadorNombres/ana/zzzz9999`]: null }, { uid: 'u1', now: T0 + 80100 }), "nobody deletes another player's search key");
  ok(rename('u1', T0 + 80100), 'the PIN renames: the name, its key and the mark, in one write', db);
  assert.equal(db.get(`jugadores/${jid}/n`), 'Anita');
  assert.deepEqual(db.get('jugadorNombres'), { anita: { [jid]: true } });
  no(db.update({ [`jugadorRenombres/${jid}`]: T0 }, { uid: 'u9', now: T0 + 90000 }), 'only a seated phone marks a rename');
}

// The test store says the same, through jugador.js
{
  const mem = new Map();
  const storage = { getItem: k => (mem.has(k) ? mem.get(k) : null), setItem: (k, v) => mem.set(k, String(v)), removeItem: k => mem.delete(k) };
  let t = T0;
  const now = () => t;
  const almacen = crearAlmacenLocal({ storage, now });
  const J = crearJugador({ almacen, storage, now, esperar: async ms => { t += ms; } });
  const yo = await J.crear('Ana', '1234');
  t += 6000;
  await assert.rejects(J.renombrar('9999', 'Anita'), e => e.code === 'pin-actual', 'a wrong PIN is refused');
  t += 6000;
  const otro = await J.renombrar('1234', '  Anita ');
  assert.equal(otro.n, 'Anita', 'the phone keeps the new name');
  assert.equal(await almacen.get(`jugadores/${yo.jid}/n`), 'Anita', 'the server has it');
  assert.equal(await almacen.get(`jugadorNombres/ana/${yo.jid}`), null, 'the old key is gone');
  assert.equal(typeof await almacen.get(`jugadorRenombres/${yo.jid}`), 'number', 'the hourly job is told');
  J.salir();
  t += 6000;
  assert.equal((await J.entrar('Anita', '1234')).estado, 'dentro', 'signing in uses the new name');
  t += 6000;
  assert.equal((await J.entrar('Ana', '1234')).estado, 'nuevo', 'the old name no longer finds the player');
  await assert.rejects(J.renombrar('1234', '   '), e => e.code === 'nombre', 'an empty name is refused');
}
console.log('✓ player rename');
