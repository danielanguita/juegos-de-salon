import assert from 'node:assert/strict';
import { states, diff, snapshot } from './flags-snapshot.mjs';
import { STATES } from '../../public/assets/js/flags.js';

assert.deepEqual(states({ b: { state: 'all', at: 5 }, a: {} }), { a: { state: 'lab' }, b: { state: 'all' } }, 'only states, sorted, lab by default');
assert.deepEqual(diff({ a: { state: 'lab' } }, { a: { state: 'all' }, b: { state: 'off' } }), [{ id: 'a', from: 'lab', to: 'all' }, { id: 'b', from: '-', to: 'off' }]);
assert.deepEqual(diff({ a: { state: 'all' } }, { a: { state: 'all' } }), []);
for (const [id, v] of Object.entries(snapshot())) assert.ok(STATES.includes(v.state) && Object.keys(v).length === 1, `${id}: one valid state`);
console.log('✓ flags-snapshot: states, diff and a valid snapshot');
