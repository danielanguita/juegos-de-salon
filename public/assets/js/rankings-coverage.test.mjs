// Run: node public/assets/js/rankings-coverage.test.mjs
// Every score a game page records has its tab in Rankings (D-559). ¡Al toque! launched recording to
// its `microgames` table and Rankings never showed it: this reads every game page's avisoPartida()
// calls and checks each table is one Rankings lists (a SUELTOS id or a SOLO_TABLES value).
import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { SUELTOS, SOLO_TABLES, SOLO_LEVELS, ALL_GAMES, FIRST_VARIANT_TABLES } from './games.js';
import { VARIANTES } from '../../cup/engine.js';

// A game whose first variant has its own table (Sudoku) names it as the game's page writes it: `<id>_<first variant>`.
// Rankings and the home page's sheet read it from here; Rankings showed the empty `sudoku` table for a week (2026-11-18)
for (const [id, table] of Object.entries(FIRST_VARIANT_TABLES)) assert.equal(table, `${id}_${VARIANTES[id]?.[0]}`, `FIRST_VARIANT_TABLES.${id} is not its first variant's table`);
const recordsPage = await (await import('node:fs/promises')).readFile(new URL('../../records/index.html', import.meta.url), 'utf8');
assert.ok(/id: FIRST_VARIANT_TABLES\[g\.id\] \|\| g\.id/.test(recordsPage), 'Rankings names a game\'s first table through FIRST_VARIANT_TABLES');

const PUBLIC = new URL('../../', import.meta.url).pathname;
// Not a game page: La Copa records its games' tables (the SUELTOS) and the lab is not in Rankings
const SKIP = new Set(['cup', 'labs', 'assets']);

const gameIdOf = async dir => {
  for (const f of ['game.js', 'rules.js']) {
    const p = join(PUBLIC, dir, f);
    if (!existsSync(p)) continue;
    const m = (await readFile(p, 'utf8')).match(/(?:export\s+)?const\s+GAME_ID\s*=\s*'([^']+)'/);
    if (m) return m[1];
  }
  return null;
};

// A game that ranks each level apart (SOLO_LEVELS, Tembleque) lists `<id>_<level>`, its first level being its SOLO_TABLES table
const levelTables = id => Object.keys(SOLO_LEVELS[id] || {}).map(v => `${id}_${v}`);
for (const id of Object.keys(SOLO_LEVELS)) assert.equal(SOLO_TABLES[id], levelTables(id)[0], `SOLO_TABLES.${id} is not its first level's table (SOLO_LEVELS)`);
const recordsLevels = /SOLO_LEVELS\[g\.id\]/.test(recordsPage);
assert.ok(recordsLevels, 'Rankings gives each level of a SOLO_LEVELS game its tab');
const listed = new Set([...SUELTOS.map(g => g.id), ...Object.values(SOLO_TABLES), ...Object.keys(SOLO_LEVELS).flatMap(levelTables)]);
const found = [];
for (const dir of await readdir(PUBLIC, { withFileTypes: true })) {
  if (!dir.isDirectory() || SKIP.has(dir.name)) continue;
  const file = join(PUBLIC, dir.name, 'game.js');
  if (!existsSync(file)) continue;
  const src = await readFile(file, 'utf8');
  // The call up to its closing `})`, so a template like `rel-${tema}` inside it does not end it
  for (const [call] of src.matchAll(/avisoPartida\(\{[\s\S]*?\}\)/g)) {
    const juego = call.match(/juego:\s*(GAME_ID|'[^']+')/)?.[1];
    assert.ok(juego, `${dir.name}/game.js: avisoPartida() without a readable juego: ${call}`);
    const id = juego === 'GAME_ID' ? await gameIdOf(dir.name) : juego.slice(1, -1);
    assert.ok(id, `${dir.name}: GAME_ID not found`);
    const v = call.match(/variante:\s*(?:'([^']*)'|`([^`]*)`)/);
    if (v?.[2]?.startsWith('rel-')) continue; // Línea Relámpago: one table per theme, its own tab (DECKS)
    // A level read at run time (Tembleque's `variante: resultLevel`): every level of the game must have its tab
    if (!v && /variante:\s*[A-Za-z_]/.test(call)) {
      assert.ok(SOLO_LEVELS[id], `${dir.name}/game.js records to "${id}_<level>" with a level read at run time: list its levels in SOLO_LEVELS in games.js (D-559)`);
      found.push(...levelTables(id));
      continue;
    }
    const tabla = v ? `${id}_${v[1] ?? v[2]}` : id;
    found.push(tabla);
    assert.ok(listed.has(tabla), `${dir.name}/game.js records to "${tabla}", which Rankings does not list: add it to SOLO_TABLES in games.js (D-559)`);
  }
}
assert.ok(found.includes('ahorcado_solo') && found.includes('generala_solo'), `the scan found the known tables: ${found}`);

// ¡Al toque! is a SUELTOS game now (La Copa's screen records its table), so Rankings lists it once
assert.ok(SUELTOS.some(g => g.id === 'microgames') && !SOLO_TABLES.microgames, '¡Al toque! is listed once, as a SUELTOS game');

// Every SOLO_TABLES game exists, so a rename cannot leave a dead tab
for (const id of Object.keys(SOLO_TABLES)) assert.ok(ALL_GAMES.some(g => g.id === id), `SOLO_TABLES: no game "${id}"`);

console.log(`rankings-coverage: ${found.length} recorded tables, all in Rankings`);
