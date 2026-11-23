#!/usr/bin/env node
/**
 * Is a game ready to launch, and did it launch whole? (docs/LAUNCH.md, the `launch-game` skill)
 *
 * Every launch until Croc! and Tembleque (2026-11-22) was checked by reading a list, and each one missed a
 * different place a game must reach: ✨ Nuevo, a Rankings tab, La Copa's dice, La Bodega, Tembleque's cover
 * without its ranking. This walks every place a launched game shows, in three passes:
 *
 *   node tools/agents/launch-check.mjs <id> [<id>…]            # the repo: entries, tables, pools, cards, docs (seconds)
 *   node tools/agents/launch-check.mjs <id>… --screens         # + the real screens on SITE (default localhost:8765), flags pinned to all
 *   node tools/agents/launch-check.mjs <id>… --live            # + the live site and Firebase, after the launch
 *
 * Run the first two in the preparation PR and again before scheduling (both must be green), and --live after
 * the launch hour. Exit 1 if anything is ✗; ⚠ is said but does not fail. `<id>` is the game's id in
 * `ALL_GAMES` (croc, wobbles, memory…), whose launch flag is its `lanza`.
 */
import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('../../', import.meta.url));
const read = p => readFileSync(ROOT + p, 'utf8');
const args = process.argv.slice(2);
const ids = args.filter(a => !a.startsWith('--'));
const SCREENS = args.includes('--screens'), LIVE = args.includes('--live');
const SITE = process.env.SITE || 'http://localhost:8765';
const PROD = 'https://juegosdesalon.cl';
const DB = 'https://juegos-de-salon-default-rtdb.firebaseio.com';
if (!ids.length) { console.error('Usage: node tools/agents/launch-check.mjs <id> [<id>…] [--screens] [--live]'); process.exit(2); }

let failures = 0, warnings = 0;
const ok = (cond, msg, why = '') => { console.log(`  ${cond ? '✓' : '✗'} ${msg}${!cond && why ? `  →  ${why}` : ''}`); if (!cond) failures++; return cond; };
const warn = (cond, msg, why = '') => { console.log(`  ${cond ? '✓' : '⚠'} ${msg}${!cond && why ? `  →  ${why}` : ''}`); if (!cond) warnings++; return cond; };

const G = await import(ROOT + 'public/assets/js/games.js');
const { FLAGS } = await import(ROOT + 'public/assets/js/flag-list.js');
const { CAMPAIGNS } = await import(ROOT + 'public/assets/js/splash.js');
const { POZO, VARIANTES } = await import(ROOT + 'public/cup/engine.js');
const { JUEGOS_DIA } = await import(ROOT + 'public/assets/js/uno-al-dia.js');
const labs = read('public/labs/index.html');
const cupLoaders = read('public/cup/games/index.js'), cupDemo = read('public/cup/demo.js');
const paths = read('tools/e2e/paths.mjs'), readme = read('README.md');

/** The page a game opens at, from the site's root. */
const pageOf = g => (g.path || `${g.slug || g.id}/`).replace(/^\//, '');
/** The table its cover, the home page's sheet and the profile read first (home-carousels.js `rankingOf`). */
const tableOf = g => G.SOLO_TABLES[g.id] || G.FIRST_VARIANT_TABLES[g.id] || g.id;
const games = [];

for (const id of ids) {
  const g = G.ALL_GAMES.find(x => x.id === id);
  console.log(`\n${g ? `${g.emoji || ''} ${g.name?.es || id}` : id} (${id})`);
  if (!ok(!!g, 'it is in ALL_GAMES (games.js, C-21)', 'add its entry: a manifest game through catalogEntry, a La Copa game in SUELTOS')) continue;
  const flagId = g.lanza;
  games.push({ g, flagId });
  const suelto = !!G.SUELTOS.find(s => s.id === id);

  console.log(' The entry (LAUNCH.md §1)');
  ok(!!flagId && !!FLAGS[flagId], `launched by a flag with its row in FLAGS: lanza '${flagId}'`, 'lanza: \'<flag>\' in games.js and a row in public/assets/js/flag-list.js');
  ok(/^\d{4}-\d{2}-\d{2}$/.test(g.nuevoDesde || ''), `✨ Nuevo from its launch day: nuevoDesde ${g.nuevoDesde}`, 'nuevoDesde: the launch day (D-333, D-556)');
  ok(Number(g.diasNuevo) > 0, `diasNuevo ${g.diasNuevo}`);
  for (const l of ['es', 'en', 'pt']) ok((g.keywords?.[l] || []).length >= 3, `search keywords in ${l}: ${(g.keywords?.[l] || []).length}`, 'three or more (search.test.mjs, D-404)');
  ok(!!(g.icon || g.emoji), `its one icon: ${g.icon || g.emoji}`, 'DESIGN.md rule 9');
  ok((g.tipos || []).length > 0 && !!g.players && !!g.duration, `type, players and duration for the home card and filters: ${(g.tipos || []).join('/')}, ${g.players}, ${g.duration}`);

  console.log(' Rankings (D-559)');
  ok(suelto || !!G.SOLO_TABLES[id], `its table is known: ${tableOf(g)}`, 'a manifest game played alone goes in SOLO_TABLES');
  if (G.SOLO_LEVELS[id]) ok(Object.keys(G.SOLO_LEVELS[id]).every(l => !!G.SOLO_LEVELS[id][l].es), `one Rankings tab per level: ${Object.keys(G.SOLO_LEVELS[id]).join(', ')}`);
  // The cover shows the table it records (every solo game; Tembleque launched without it, 2026-11-22)
  const coverCode = suelto ? '' : (existsSync(ROOT + `public/${pageOf(g)}game.js`) ? read(`public/${pageOf(g)}game.js`) : '');
  // A hint only: a cover can draw it with bloqueRanking or bloqueTabla, and the result uses bloqueTabla too; --screens decides
  warn(suelto || (coverCode.match(/bloque(Ranking|Tabla)\(/g) || []).length >= 2, 'its cover seems to draw its ranking under Entrar (--screens checks it)', `public/${pageOf(g)}game.js: the level's table on the cover, as Sudoku's and Croc!'s (cup/game.js)`);

  console.log(' La Copa and Uno al día');
  if (g.copa) {
    ok(POZO.includes(id), `in La Copa's pool (POZO, pozo ${g.copa.pozo})`);
    ok(new RegExp(`\\b${id}:\\s*\\(`).test(cupLoaders), 'its loader in public/cup/games/index.js');
    ok(cupDemo.includes(id), 'its demo scores in public/cup/demo.js (ADD-GAME §3)');
    if (VARIANTES[id]) console.log(`  · variants ${VARIANTES[id].join(', ')}: the first is the default a cup day and Uno al día play`);
  } else console.log('  · not a La Copa game (no `copa` in its entry): say so in its spec');
  if (g.unoAlDia) {
    const day = JUEGOS_DIA.find(j => j.id === id);
    ok(!!day, `in Uno al día's deck from ${g.unoAlDia.desde}`);
    ok(!g.nuevoDesde || g.unoAlDia.desde >= g.nuevoDesde, `Uno al día starts no earlier than ✨ Nuevo (${g.unoAlDia.desde} ≥ ${g.nuevoDesde})`, 'it deals by date, never by flag: move desde with the launch (LAUNCH.md §3)');
  } else console.log('  · not in Uno al día (no `unoAlDia`): say so in its spec');

  console.log(' The lab, the splash, the cards and the docs');
  const card = `id="seccion-${flagId}"`;
  ok(labs.includes(card), `its /labs/ card is #seccion-${flagId}, so it moves to La Bodega when the flag is all (launched.js, D-534)`, 'the card\'s id must be seccion-<flag>');
  const camp = Object.entries(CAMPAIGNS).find(([, c]) => (c.items || []).some(i => i.game === id));
  ok(!!camp, `a splash campaign names it: ${camp?.[0] || '—'}`, 'LAUNCH.md §2: an item with game: \'<id>\'');
  if (camp) ok((camp[1].requires || []).includes(flagId), `the campaign waits for its flag (requires: ${(camp[1].requires || []).join(', ')})`);
  ok(existsSync(ROOT + `public/assets/og/${id}.jpg`), `its link card public/assets/og/${id}.jpg`, 'node tools/release/og.mjs cards');
  ok(existsSync(ROOT + `docs/games/${id}.md`), `its spec docs/games/${id}.md (C-13)`);
  ok(existsSync(ROOT + `tools/e2e/${id}`) && paths.includes(id), `its e2e folder tools/e2e/${id}/ and its screens in paths.mjs (C-12)`);
  ok(readme.includes(g.name?.es || id), 'the README has it');
}

/* ---------------- The real screens, flags pinned to all ---------------- */
if (SCREENS && games.length) {
  const { launch, sleep } = await import(ROOT + 'tools/e2e/cdp.mjs');
  const { output } = await import(ROOT + 'tools/e2e/output.mjs');
  // Never `argv[2]`: here it is a game id, and output() would make a folder of it in the worktree
  const OUT = output('/tmp/launch-check', []);
  // The clock on the launch day: ✨ Nuevo and the new games' row follow it (D-589: never the real date)
  const day = games.map(x => x.g.nuevoDesde).filter(Boolean).sort().pop();
  const b = await launch({ dir: `${OUT}/p`, out: OUT, width: 390, height: 844, clock: day || true });
  const ev = e => b.evaluate(e);
  const until = async (expr, ms = 6000) => { for (let t = 0; t < ms; t += 150) { if (await ev(expr).catch(() => false)) return true; await sleep(150); } return false; };
  b.flags(Object.fromEntries(games.map(x => [x.flagId, 'all'])));
  console.log(`\nThe screens on ${SITE}, on ${day}, with ${games.map(x => x.flagId).join(', ')} on all`);

  await b.go(`${SITE}/?test`, 2500);
  for (const { g } of games) {
    ok(await until(`!!document.querySelector('.game-card[data-id="${g.id}"]')`, 12000), `${g.id}: its card on the home page`);
    ok(await ev(`/Nuevo/i.test(document.querySelector('.game-card[data-id="${g.id}"]')?.textContent || '')`), `${g.id}: with ✨ Nuevo`);
  }
  // The icon view's sheet, the home page the lab holds (home-carousels, home-carousels-sheet)
  b.flags({ 'home-carousels': 'all', 'home-carousels-sheet': 'all' });
  for (const { g } of games) {
    await b.go(`${SITE}/?test&game=${g.slug || g.id}`, 2500);
    ok(await until(`document.querySelector('#game-sheet-ranking .rk-ranking')?.dataset.tabla === ${JSON.stringify(tableOf(g))}`), `${g.id}: the icon view's sheet shows its ranking (${tableOf(g)})`);
  }
  b.flags({ 'home-carousels': 'off', 'home-carousels-sheet': 'off' });
  for (const { g } of games) {
    await b.go(`${SITE}/${pageOf(g)}?test`, 2500);
    ok(await until(`!!document.querySelector('.rk-ranking')`), `${g.id}: its cover shows its ranking`);
    // Its icon (an emoji, or the game's drawing as an <img>) and the house's word, as every cover (Tembleque said «¡A jugar!»)
    const start = await ev(`(b => b ? (b.querySelector('img, svg') ? '[icon] ' : '') + b.textContent.trim() : '')(document.querySelector('#btn-empezar, #btn-play'))`);
    ok(/^\S+\s/.test(start) && !/[¡!]/.test(start), `${g.id}: its cover's start button has its icon and the house's word: «${start}»`);
    await b.shot(`cover-${g.id}`);
  }
  await b.go(`${SITE}/records/?test`, 3000);
  for (const { g } of games) ok(await until(`!!document.querySelector('#rk-juegos button[data-id="${tableOf(g)}"]')`), `${g.id}: its tab in Rankings (/records/)`);
  await b.go(`${SITE}/labs/?test`, 2500);
  const moved = await ev(`import('/labs/launched.js').then(m => m.move(document, ${JSON.stringify(Object.fromEntries(games.map(x => [x.flagId, { state: 'all', at: Date.now() }])))})).then(() => ${JSON.stringify(games.map(x => x.flagId))}.filter(f => !!document.querySelector('#bodega-mejoras #seccion-' + f)))`);
  for (const { flagId } of games) ok(moved.includes(flagId), `${flagId}: its /labs/ card moves to La Bodega`);
  const errors = [...(b.errors || [])];
  ok(!errors.length, 'no page errors', errors.slice(0, 3).join(' | '));
  b.close();
}

/* ---------------- The live site, after the launch ---------------- */
if (LIVE && games.length) {
  console.log(`\nLive: ${PROD} and Firebase`);
  const get = async p => { try { const r = await fetch(`${DB}/${p}.json`); return r.ok ? await r.json() : null; } catch { return null; } };
  for (const { g, flagId } of games) {
    const f = await get(`flags/${flagId}`);
    ok(f?.state === 'all', `flags/${flagId} is all (${f?.at ? new Date(f.at).toISOString() : 'no at'})`);
    for (const u of [pageOf(g), `assets/og/${g.id}.jpg`]) {
      const s = await fetch(`${PROD}/${u}`).then(r => r.status, () => 0);
      ok(s === 200, `${PROD}/${u} answers ${s}`);
    }
    ok(!new RegExp(`${(g.name?.en || g.id).replace(/[!?]/g, '\\$&')}[^\\n]{0,80}not launched`, 'i').test(readme), `${g.id}: the README no longer says «not launched»`, 'README and docs/games/<id>.md: launched, with the date');
    const snap = JSON.parse(read('tools/e2e/flags-snapshot.json'));
    warn((snap.flags || snap)[flagId]?.state === 'all', `${flagId}: the e2e flags snapshot has it on all`, 'the processes round refreshes it (flags-snapshot.mjs refresh, D-578)');
  }
  // The launch's campaign: of those naming these games, one that is on, else the one switched last (an older game's is off by now)
  const splash = await get('splash') || {};
  const named = Object.entries(CAMPAIGNS).filter(([, c]) => (c.items || []).some(i => games.some(x => x.g.id === i.game))).map(([id]) => id);
  const camp = named.sort((a, b) => (splash[b]?.on === true) - (splash[a]?.on === true) || (splash[b]?.at || 0) - (splash[a]?.at || 0))[0];
  if (camp) warn(splash[camp]?.on === true, `the launch's splash, ${camp}, is on until ${splash[camp]?.until || '—'}`, 'on at the launch; off once its `until` passed is fine');
  console.log('  · still by eye: the splash on a phone, La Copa\'s create screen as a new visitor, /labs/ with a lab key (LAUNCH.md §3)');
}

console.log(`\n${failures ? `✗ ${failures} to fix` : '✓ ready'}${warnings ? `, ⚠ ${warnings} to look at` : ''}`);
process.exit(failures ? 1 : 0);
