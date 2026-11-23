// Which commit a PR's push tests from (D-392): the last one before it that passed, or the whole PR.
import assert from 'node:assert/strict';
import { lastPassed, filesToTest, meetJobs, COMPARE_LIMIT, HEAD_MARK } from './since-passed.mjs';

const commits = ['a', 'b', 'c', 'd'];
const marks = new Set(['b']);
const passed = sha => marks.has(sha);

assert.equal(lastPassed(commits, 'd', passed), 'b', 'the newest earlier commit that passed');
assert.equal(lastPassed(commits, 'b', passed), null, 'its own mark does not count: a rerun tests it whole');
marks.add('c');
assert.equal(lastPassed(commits, 'd', passed), 'c', 'the newest wins over an older one');
assert.equal(lastPassed(commits, 'x', passed), null, 'a head not in the PR (a force push): the whole PR');
assert.equal(lastPassed(['a'], 'a', passed), null, 'a first push: the whole PR');

const prFiles = ['public/index.html', 'docs/x.md', 'changelog/x.md'];
assert.deepEqual(filesToTest({ since: 'c', compared: ['changelog/x.md'], prFiles }), { files: ['changelog/x.md'], since: 'c' }, 'only what changed since');
assert.deepEqual(filesToTest({ since: 'c', compared: [], prFiles }), { files: [], since: 'c' }, 'nothing changed (a rerun of a passed push): nothing to test');
assert.deepEqual(filesToTest({ since: null, compared: null, prFiles }), { files: prFiles, since: null });
assert.deepEqual(filesToTest({ since: 'c', compared: null, prFiles }).since, null, 'the compare failed: the whole PR');
assert.deepEqual(filesToTest({ since: 'c', compared: Array(COMPARE_LIMIT).fill('f'), prFiles }).files, prFiles, 'a compare at GitHub\'s limit may be cut: the whole PR');
// A merge of main (D-610): files only main changed are main's to test; the PR tests its own files again, against the new main
const own = ['public/profile/profile.js', 'tools/e2e/profile/page.mjs'];
assert.deepEqual(filesToTest({ since: 'c', compared: ['public/profile/profile.js'], prFiles: own }), { files: ['public/profile/profile.js'], since: 'c' }, 'a push of the PR\'s own: only it');
// D-612: with what it brought, so the run meets them; `since` is kept, so a met run leaves no tree mark (D-308)
assert.deepEqual(filesToTest({ since: 'c', compared: ['public/assets/js/duels-ui.js', 'public/index.html'], prFiles: own }),
  { files: own, since: 'c', brought: ['public/assets/js/duels-ui.js', 'public/index.html'] }, 'a merge of main: the PR\'s own files, met with main\'s');
assert.deepEqual(filesToTest({ since: 'c', compared: ['public/index.html', 'public/profile/profile.js'], prFiles: own }),
  { files: own, since: 'c', brought: ['public/index.html', 'public/profile/profile.js'] }, 'a merge of main with a fix: the PR\'s own files, met with all the push brought');

// meetJobs (D-612): a fake graph, file → jobs
const reach = { 'p.js': ['profile.mjs', 'smoke.mjs', 'land.mjs:320@profile'], 'pf.mjs': ['pf.mjs'], 'home.js': ['smoke.mjs', 'home.mjs', 'land.mjs:320@home'], 'duel.js': ['duel.mjs'], 'core.js': ['profile.mjs', 'smoke.mjs', 'home.mjs', 'duel.mjs', 'land.mjs:320', 'pf.mjs'] };
const choose = files => [...new Set(files.flatMap(f => reach[f.split('#')[0]] || []))];
const sorted = xs => [...xs].sort();
assert.deepEqual(sorted(meetJobs(['p.js', 'pf.mjs'], ['duel.js'], choose)), [], 'main reached nothing the PR reaches: nothing runs again');
assert.deepEqual(sorted(meetJobs(['p.js', 'pf.mjs'], ['home.js'], choose)), ['land.mjs:320@profile', 'smoke.mjs'], 'what both reach, with the PR\'s narrowing of a shared job');
assert.deepEqual(sorted(meetJobs(['p.js', 'pf.mjs'], ['core.js'], choose)), sorted(choose(['p.js', 'pf.mjs'])), 'main changed what everything loads: the PR\'s whole scope, as D-610');
assert.deepEqual(sorted(meetJobs(['p.js', 'pf.mjs'], ['duel.js', 'pf.mjs'], choose)), ['pf.mjs'], 'the push changed a PR file too (a fix, a conflict resolved): its jobs run whole');
assert.deepEqual(sorted(meetJobs(['p.js#uses=a', 'pf.mjs'], ['p.js', 'home.js'], choose)), sorted(['profile.mjs', 'smoke.mjs', 'land.mjs:320@profile']), 'a narrowed PR file the push changed counts as the PR\'s');
// Never more than the PR's own scope plus what the push changed in the PR's files
for (const brought of [['duel.js'], ['home.js'], ['core.js'], ['core.js', 'p.js'], ['home.js', 'duel.js']]) {
  const met = meetJobs(['p.js', 'pf.mjs'], brought, choose).map(j => j.split('@')[0]);
  const bound = new Set(choose(['p.js', 'pf.mjs']).map(j => j.split('@')[0]));
  assert.ok(met.every(j => bound.has(j)), `${brought}: within the PR's scope`);
}
assert.equal(HEAD_MARK('abc'), 'e2e-head-abc');

console.log('since-passed: a push tests what changed since its PR last passed, green');
