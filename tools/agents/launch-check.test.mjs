// launch-check.mjs (docs/LAUNCH.md): its static pass names what a launched game lacks, and fails a game that
// is not there. The screens and live passes need a browser and the network: the launch-game skill runs them.
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const script = fileURLToPath(new URL('./launch-check.mjs', import.meta.url));
const run = (...a) => spawnSync(process.execPath, [script, ...a], { encoding: 'utf8' });

const none = run();
assert.equal(none.status, 2, 'without an id it says how to use it');
const missing = run('no-such-game');
assert.equal(missing.status, 1, 'a game not in ALL_GAMES fails');
assert.match(missing.stdout, /✗ it is in ALL_GAMES/);
// Croc!, launched whole on 2026-11-22: every static line green, each surface named
const croc = run('croc');
assert.equal(croc.status, 0, croc.stdout);
for (const surface of [/lanza 'croc'/, /nuevoDesde/, /search keywords in pt/, /its table is known: croc/, /POZO/, /Uno al día's deck/, /#seccion-croc/, /splash campaign names it/, /og\/croc\.jpg/, /docs\/games\/croc\.md/])
  assert.match(croc.stdout, surface);
console.log('✓ launch-check: the static pass names every surface and fails a missing game');
