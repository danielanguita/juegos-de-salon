#!/usr/bin/env node
/**
 * Renames a rankings player (D-513), for an offensive name that slipped past the sign-up list or
 * was there before it. The rules require every table row to carry the player's name
 * (`records/<t>/<p>/<jid>.n === jugadores/<jid>/n`), so it changes the name, its search key and
 * every row of that player, in one write. The player keeps their scores and their PIN, and signs
 * in with the new name; their phone picks it up the next time it signs in. The month's season
 * view (`uadTemporada`) takes the new name on the next hourly rebuild.
 *
 *   node tools/firebase/rename-player.mjs <jid | current name>                 # lists the matches, touching nothing
 *   node tools/firebase/rename-player.mjs <jid> "New name"                     # shows what it would write
 *   node tools/firebase/rename-player.mjs <jid> "New name" --write             # writes it (as administrator)
 *   node tools/firebase/rename-player.mjs --pending [--apply]                    # the players who renamed themselves (D-600)
 *
 * `--pending` is the hourly job's (tools/jobs/uad-hourly.sh): a player who changes their name in the
 * profile writes the name and its key, and a mark in `jugadorRenombres/<jid>`; this carries the new
 * name to every row of theirs that still has another one, then clears the mark.
 *
 * With no new name given it suggests "Jugador <4 letters of the jid>". Needs the key at
 * ~/.config/juegos-de-salon/firebase-admin.json. Firebase paths keep their Spanish names (D-316).
 */
import { firebaseConfig } from '../../public/assets/js/firebase-config.js';
import { claveNombre, limpiarNombre, esJid } from '../../public/assets/js/records.js';
import { token, read, write, fail } from './firebase-admin.mjs';

/** The writes that rename `jid` from `viejo` to `nuevo`, given the paths of its rows. Pure, for node. */
export function cambiosRenombre(jid, viejo, nuevo, filas) {
  const c = {
    [`jugadores/${jid}/n`]: nuevo,
    [`jugadorNombres/${claveNombre(nuevo)}/${jid}`]: true,
  };
  if (claveNombre(viejo) !== claveNombre(nuevo)) c[`jugadorNombres/${claveNombre(viejo)}/${jid}`] = null;
  for (const f of filas) c[`${f}/n`] = nuevo;
  return c;
}

/**
 * The writes that finish the self-renames (D-600): each row read (`{ path, jid, n }`) whose name is not
 * its player's current one gets it, and each mark whose player kept the name read at the start (`antes`
 * against `despues`) is cleared; a player renamed again meanwhile keeps the mark for the next hour. Pure.
 */
export function cambiosPendientes(filas, antes, despues) {
  const c = {};
  for (const { path, jid, n } of filas) if (n != null && typeof antes[jid] === 'string' && n !== antes[jid]) c[`${path}/n`] = antes[jid];
  for (const jid of Object.keys(antes)) if (antes[jid] === despues[jid] || despues[jid] == null) c[`jugadorRenombres/${jid}`] = null;
  return c;
}

/** Runs `fn` over `xs`, `n` at a time. */
async function enParalelo(xs, n, fn) {
  let i = 0;
  await Promise.all(Array.from({ length: Math.min(n, xs.length) }, async () => { while (i < xs.length) await fn(xs[i++]); }));
}

async function pendientes(t, aplicar) {
  const jids = Object.keys((await read('jugadorRenombres', t)) || {}).filter(esJid);
  if (!jids.length) { console.log('No self-renames waiting.'); return; }
  const leerNombres = async () => Object.fromEntries(await Promise.all(jids.map(async j => [j, await read(`jugadores/${j}/n`, t)])));
  const antes = await leerNombres();
  const rutas = [];
  for (const tb of await hijos('records', t)) for (const p of await hijos(`records/${tb}`, t)) for (const jid of jids) rutas.push({ path: `records/${tb}/${p}/${jid}`, jid });
  const filas = [];
  await enParalelo(rutas, 16, async r => { filas.push({ ...r, n: await read(`${r.path}/n`, t) }); });
  const c = cambiosPendientes(filas, antes, await leerNombres());
  const n = Object.keys(c).filter(k => k.startsWith('records/')).length;
  console.log(`${jids.length} self-rename(s): ${n} table row(s) to carry the new name.`);
  if (!aplicar) { console.log('Dry run: add --apply to write it.'); return; }
  await write('', 'PATCH', c, t);
  console.log('✓ self-renames carried');
}

/** Keys of a node without its contents (REST `shallow`). */
async function hijos(path, t) {
  const res = await fetch(`${firebaseConfig.databaseURL}/${path}.json?shallow=true&access_token=${encodeURIComponent(t)}`);
  if (!res.ok) fail(`Could not list ${path}/ (HTTP ${res.status})`);
  return Object.keys((await res.json()) || {});
}

async function main() {
  const [quien, nombre, ...resto] = process.argv.slice(2);
  if (!quien) fail('Usage: node tools/firebase/rename-player.mjs <jid | current name> ["New name"] [--write]');
  const t = await token();
  if (quien === '--pending') return pendientes(t, nombre === '--apply');

  if (!esJid(quien)) {
    const jids = Object.keys((await read(`jugadorNombres/${claveNombre(quien)}`, t)) || {});
    if (!jids.length) fail(`No player is named "${quien}".`);
    for (const j of jids) console.log(`${j}  ${await read(`jugadores/${j}/n`, t)}`);
    console.log('\nRun it again with the jid and the new name.');
    return;
  }
  const jid = quien;
  const viejo = await read(`jugadores/${jid}/n`, t);
  if (viejo == null) fail(`There is no player ${jid}.`);
  const nuevo = limpiarNombre(nombre && nombre !== '--write' ? nombre : `Jugador ${jid.slice(0, 4).toUpperCase()}`);

  const filas = [];
  for (const tb of await hijos('records', t)) {
    for (const p of await hijos(`records/${tb}`, t)) {
      if ((await read(`records/${tb}/${p}/${jid}/n`, t)) != null) filas.push(`records/${tb}/${p}/${jid}`);
    }
  }
  const c = cambiosRenombre(jid, viejo, nuevo, filas);
  console.log(`${jid}: "${viejo}" → "${nuevo}", ${filas.length} table rows.`);
  if (![nombre, ...resto].includes('--write')) { console.log('Dry run: add --write to write it.'); return; }
  await write('', 'PATCH', c, t);
  console.log('✓ renamed');
}

if (import.meta.url === `file://${process.argv[1]}`) await main();
