// A player's public profile has nothing to hide (lab flag profile, D-605, replacing D-602 and D-604's switch):
// the old fields that hid or showed the activity, `jugadores/<jid>/oculto` and `abierto`, are refused by the rules,
// and the test store (jugador-local.js) refuses them as well. Runs the real rules in tools/firebase/rules-sim.mjs.
import assert from 'node:assert/strict';
import { createDb } from '../tools/firebase/rules-sim.mjs';
import { crearAlmacenLocal } from '../public/assets/js/jugador-local.js';
import { crearJugador } from '../public/assets/js/jugador.js';

const T0 = 1_800_000_000_000;
{
  const jid = 'abcd1234';
  const db = createDb(undefined, {
    jugadores: { [jid]: { n: 'Ana', at: T0 } },
    jugadorSeats: { [jid]: { u1: 'x'.repeat(64) } },
  });
  for (const k of ['oculto', 'abierto']) assert.equal(db.update({ [`jugadores/${jid}/${k}`]: true }, { uid: 'u1', now: T0 + 1000 }), false, `${k} is gone from the rules`);
}
{
  const mem = new Map();
  const storage = { getItem: k => (mem.has(k) ? mem.get(k) : null), setItem: (k, v) => mem.set(k, String(v)), removeItem: k => mem.delete(k) };
  let t = T0;
  const now = () => t;
  const almacen = crearAlmacenLocal({ storage, now });
  const J = crearJugador({ almacen, storage, now, esperar: async ms => { t += ms; } });
  const yo = await J.crear('Ana', '1234');
  assert.equal(J.mostrarActividad, undefined, 'no switch to call');
  await assert.rejects(almacen.update({ [`jugadores/${yo.jid}/oculto`]: true }), 'the test store refuses it, as the rules do');
}
console.log('✓ public profile');
