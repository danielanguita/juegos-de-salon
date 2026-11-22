// Run: node tools/firebase/rename-player.test.mjs
// Renaming a rankings player (D-513): the name, its search key and every row, in one write.
import assert from 'node:assert/strict';
import { cambiosRenombre, cambiosPendientes } from './rename-player.mjs';

const c = cambiosRenombre('abcd1234', 'Puta Madre', 'Jugador ABCD', ['records/partidas/siempre/abcd1234', 'records/reinas/s2026-44/abcd1234']);
assert.deepEqual(c, {
  'jugadores/abcd1234/n': 'Jugador ABCD',
  'jugadorNombres/jugador-abcd/abcd1234': true,
  'jugadorNombres/puta-madre/abcd1234': null,
  'records/partidas/siempre/abcd1234/n': 'Jugador ABCD',
  'records/reinas/s2026-44/abcd1234/n': 'Jugador ABCD',
});
// Same key (only capitals change): the index entry stays
assert.equal(Object.keys(cambiosRenombre('abcd1234', 'CATA', 'Cata', [])).length, 2);
// The players who renamed themselves (D-600): their rows take the new name, the marks are cleared
assert.deepEqual(cambiosPendientes([
  { path: 'records/reinas/siempre/aaaa1111', jid: 'aaaa1111', n: 'Ana' },
  { path: 'records/reinas/s2026-47/aaaa1111', jid: 'aaaa1111', n: 'Anita' },
  { path: 'records/tango/siempre/aaaa1111', jid: 'aaaa1111', n: null },
  { path: 'records/reinas/siempre/bbbb2222', jid: 'bbbb2222', n: 'Beto' },
], { aaaa1111: 'Anita', bbbb2222: 'Roberto' }, { aaaa1111: 'Anita', bbbb2222: 'Robert' }), {
  'records/reinas/siempre/aaaa1111/n': 'Anita',
  'records/reinas/siempre/bbbb2222/n': 'Roberto',
  'jugadorRenombres/aaaa1111': null,
}, 'a row with another name takes the new one; a player renamed again meanwhile keeps the mark');
console.log('✓ rename-player');
