// The landing-fold stamp the push guard reads (landing-stamp.mjs): which changed files reach a cover,
// and when a touched cover counts as measured.
import test from 'node:test';
import assert from 'node:assert/strict';
import { isCoverFile, touched, unmeasured, landings, coverFiles, WIDTHS } from './landing-stamp.mjs';
import { readFileSync } from 'node:fs';

const LIST = [{ id: 'croc', route: 'labs/croc/' }, { id: 'ahorcado', route: 'hangman/' }, { id: 'copa', route: 'cup/' }];

test('a cover file is what the page loads, not the engine or a test', () => {
  for (const f of ['index.html', 'style.css', 'game.js', 'scene.js', 'rules.js']) assert.ok(isCoverFile(f), f);
  for (const f of ['engine.js', 'engine.test.mjs', 'game.json', 'fuzz.test.mjs']) assert.ok(!isCoverFile(f), f);
});

test('touched: the files directly in a game folder and its visual reference', () => {
  const ids = files => touched(files, LIST).map(l => l.id);
  assert.deepEqual(ids(['public/labs/croc/game.js']), ['croc']);
  assert.deepEqual(ids(['tools/e2e/visual/ref/hangman-intro.png']), ['ahorcado']);
  assert.deepEqual(ids(['public/labs/croc/engine.js', 'public/hangman/decks/es.js', 'public/cup/games/croc/ui.js', 'docs/games/croc.md']), []);
  assert.deepEqual(ids(['public/cup/style.css', 'public/hangman/index.html']), ['ahorcado', 'copa']);
});

test('unmeasured: no stamp, another hash or a width missing', () => {
  const files = ['public/labs/croc/game.js'];
  const hash = () => 'h1';
  assert.equal(unmeasured(files, LIST, {}, hash).length, 1);
  assert.equal(unmeasured(files, LIST, { croc: { hash: 'h0', widths: WIDTHS } }, hash).length, 1);
  assert.equal(unmeasured(files, LIST, { croc: { hash: 'h1', widths: [320] } }, hash).length, 1);
  assert.deepEqual(unmeasured(files, LIST, { croc: { hash: 'h1', widths: [320, 375] } }, hash), []);
});

test('the widths are the ones landing-fold.mjs measures', () => {
  // Read from the source: importing landing-fold.mjs would run it
  const sizes = readFileSync(new URL('./landing-fold.mjs', import.meta.url), 'utf8').match(/SIZES = (\[\[.*\]\]);/)[1];
  assert.deepEqual(WIDTHS, JSON.parse(sizes).map(([w]) => w));
});

test('every landing has a folder with cover files', async () => {
  const list = await landings();
  assert.ok(list.length > 20);
  const empty = list.filter(l => !coverFiles(l.route).length).map(l => l.route);
  assert.deepEqual(empty, []);
});
