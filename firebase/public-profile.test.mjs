// Whether a player hides their activity from their public profile (lab flag profile, D-602, D-604):
// `jugadores/<jid>/oculto`, true or gone (shown, the default), written only from one of the player's seated phones.
// Runs the real rules in tools/firebase/rules-sim.mjs, and the same change against the test store (jugador-local.js).
import assert from 'node:assert/strict';
import { createDb } from '../tools/firebase/rules-sim.mjs';
import { crearAlmacenLocal } from '../public/assets/js/jugador-local.js';
import { crearJugador } from '../public/assets/js/jugador.js';

const T0 = 1_800_000_000_000;
const ok = (r, msg, db) => assert.equal(r, true, `${msg} (${db?.why?.join(', ')})`);
const no = (r, msg) => assert.equal(r, false, msg);

{
  const jid = 'abcd1234';
  const db = createDb(undefined, {
    jugadores: { [jid]: { n: 'Ana', at: T0 } },
    jugadorSeats: { [jid]: { u1: 'x'.repeat(64) } },
  });
  const set = (uid, v) => db.update({ [`jugadores/${jid}/oculto`]: v }, { uid, now: T0 + 1000 });
  no(set('u2', true), "another phone does not hide someone's activity");
  no(set('u1', false), 'false is never stored: shown is gone');
  no(set('u1', 'yes'), 'only true');
  ok(set('u1', true), 'the seated phone hides its activity', db);
  assert.equal(db.get(`jugadores/${jid}/oculto`), true);
  no(set('u2', null), "another phone does not show someone's activity");
  ok(set('u1', null), 'the seated phone shows it again', db);
  assert.equal(db.get(`jugadores/${jid}/oculto`), null);
  no(db.update({ [`jugadores/${jid}/abierto`]: true }, { uid: 'u1', now: T0 + 1000 }), 'the old field is gone from the rules');
}

{
  const mem = new Map();
  const storage = { getItem: k => (mem.has(k) ? mem.get(k) : null), setItem: (k, v) => mem.set(k, String(v)), removeItem: k => mem.delete(k) };
  let t = T0;
  const now = () => t;
  const almacen = crearAlmacenLocal({ storage, now });
  const J = crearJugador({ almacen, storage, now, esperar: async ms => { t += ms; } });
  const yo = await J.crear('Ana', '1234');
  assert.equal(await almacen.get(`jugadores/${yo.jid}/oculto`), null, 'shown unless the player hides it');
  await J.mostrarActividad(false);
  assert.equal(await almacen.get(`jugadores/${yo.jid}/oculto`), true, 'the test store keeps it, as the rules do');
  await J.mostrarActividad(true);
  assert.equal(await almacen.get(`jugadores/${yo.jid}/oculto`), null, 'shown again is gone');
  J.salir();
  assert.equal(await J.mostrarActividad(false), false, 'without a player nothing is written');
}
console.log('✓ public profile');
