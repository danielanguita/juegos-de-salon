// Which games a change launches: only the launch-day PR, never the preparation or the cleanup (launching.mjs)
import assert from 'node:assert/strict';
import { launching } from './launching.mjs';

const lab = { id: 'croc', lanza: 'croc', nuevoDesde: '2026-12-01' };
assert.deepEqual(launching([lab], [{ ...lab, nuevoDesde: '2026-11-22' }]), ['croc'], 'the launch day moves: it launches');
assert.deepEqual(launching([], [lab]), [], 'the preparation PR adds the game in the lab: not a launch');
assert.deepEqual(launching([{ id: 'croc' }], [lab]), [], 'a game that had no flag gets one: not a launch');
assert.deepEqual(launching([lab], [{ id: 'croc', nuevoDesde: '2026-12-01' }]), [], 'the cleanup PR drops lanza: not a launch');
assert.deepEqual(launching([lab], [lab]), [], 'nothing changed');
assert.deepEqual(launching([lab, { id: 'x', lanza: 'x' }], [{ ...lab, nuevoDesde: '2026-11-22' }, { id: 'x', lanza: 'x', nuevoDesde: '2026-11-22' }]), ['croc', 'x'], 'two at once, one setting its day for the first time');
console.log('✓ launching: only the launch-day PR counts as a launch');
