import test from 'node:test';
import assert from 'node:assert/strict';
import { score } from './judge.mjs';

test('score counts agreement and lists the misses', () => {
  const labelled = [{ id: 'a', label: 'good' }, { id: 'b', label: 'bad' }];
  const r = score(labelled, [{ id: 'a', grade: 'good' }, { id: 'b', grade: 'so-so', why: 'x' }]);
  assert.equal(r.agree, 1);
  assert.equal(r.total, 2);
  assert.equal(r.misses.length, 1);
});
