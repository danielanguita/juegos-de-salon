import assert from 'node:assert/strict';
import { states, diff, snapshot, held } from './flags-snapshot.mjs';
import { STATES } from '../../public/assets/js/flags.js';

assert.deepEqual(states({ b: { state: 'all', at: 5 }, a: {} }), { a: { state: 'lab' }, b: { state: 'all' } }, 'only states, sorted, lab by default');
assert.deepEqual(diff({ a: { state: 'lab' } }, { a: { state: 'all' }, b: { state: 'off' } }), [{ id: 'a', from: 'lab', to: 'all' }, { id: 'b', from: '-', to: 'off' }]);
assert.deepEqual(diff({ a: { state: 'all' } }, { a: { state: 'all' } }), []);
for (const [id, v] of Object.entries(snapshot())) assert.ok(STATES.includes(v.state) && Object.keys(v).length === 1, `${id}: one valid state`);
const { FLAGS } = await import('../../public/assets/js/flag-list.js');
for (const [id, v] of Object.entries(held())) assert.ok(FLAGS[id] && STATES.includes(v.state) && Object.keys(v).length === 1, `flags-held.json: ${id} is a flag of FLAGS with one valid state (remove its row with its gate)`);
console.log('✓ flags-snapshot: states, diff and a valid snapshot');
