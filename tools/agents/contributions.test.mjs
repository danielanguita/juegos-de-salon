import assert from 'node:assert/strict';
import { needsLook, marker } from './contributions.mjs';

let fails = 0;
const check = (name, fn) => { try { fn(); console.log(`✓ ${name}`); } catch (e) { fails++; console.error(`✗ ${name}\n  ${e.message}`); } };

check('a PR never reviewed needs a look', () => {
  assert.match(needsLook({ sha: 'abc', comments: [] }), /new/);
  assert.match(needsLook({ sha: 'abc', comments: [{ body: 'hi' }] }), /new/);
});

check('nothing new after the marker: no look, whether reviewing or ready', () => {
  assert.equal(needsLook({ sha: 'abc', comments: [{ body: `ok\n${marker('abc', 'reviewing')}` }] }), null);
  assert.equal(needsLook({ sha: 'abc', comments: [{ body: 'old' }, { body: marker('abc', 'ready') }] }), null);
});

check('a new commit or a new comment after the marker needs a look', () => {
  assert.match(needsLook({ sha: 'def', comments: [{ body: marker('abc', 'ready') }] }), /commits/);
  assert.match(needsLook({ sha: 'abc', comments: [{ body: marker('abc', 'reviewing') }, { body: 'done, please look' }] }), /comment/);
});

check('only the last marker counts', () => {
  const comments = [{ body: marker('aaa', 'reviewing') }, { body: 'fixed' }, { body: marker('bbb', 'reviewing') }];
  assert.equal(needsLook({ sha: 'bbb', comments }), null);
});

if (fails) process.exit(1);
