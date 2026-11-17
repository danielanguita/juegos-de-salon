#!/usr/bin/env node
/**
 * The flags the end-to-end tests see (D-578). The site reads `flags/` live from Firebase, and the owner
 * flips a flag to *all* from /labs/ with no PR (D-498); when the tests read it live too, that flip
 * turned every open PR red at once (install-invite on 2026-11-17: five PRs). So `launch()` in cdp.mjs
 * answers the page's request for flags.json with `flags-snapshot.json`, the states as of the last
 * refresh, and a flip reaches the tests only through a PR that refreshes this file, where a test it
 * breaks is fixed once.
 *
 *   node tools/e2e/flags-snapshot.mjs check     # says whether Firebase differs from the snapshot (exit 3 if it does)
 *   node tools/e2e/flags-snapshot.mjs refresh   # rewrites the snapshot from Firebase (then a PR)
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

export const FILE = fileURLToPath(new URL('../e2e/flags-snapshot.json', import.meta.url));
const REMOTE = 'https://juegos-de-salon-default-rtdb.firebaseio.com/flags.json';

/** Only each flag's state, sorted, so the file changes only when a state does. */
export const states = flags => Object.fromEntries(Object.keys(flags || {}).sort().map(id => [id, { state: flags[id]?.state || 'lab' }]));
export const snapshot = () => JSON.parse(readFileSync(FILE, 'utf8'));
/** What changed: [{ id, from, to }]. */
export const diff = (a, b) => [...new Set([...Object.keys(a), ...Object.keys(b)])].sort()
  .filter(id => a[id]?.state !== b[id]?.state).map(id => ({ id, from: a[id]?.state ?? '-', to: b[id]?.state ?? '-' }));

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const cmd = process.argv[2];
  const live = states(await (await fetch(REMOTE)).json());
  const changes = diff(snapshot(), live);
  if (cmd === 'refresh') { writeFileSync(FILE, JSON.stringify(live, null, 2) + '\n'); console.log(changes.length ? changes.map(c => `${c.id}: ${c.from} → ${c.to}`).join('\n') : 'unchanged'); }
  else if (cmd === 'check') { if (!changes.length) console.log('the snapshot matches Firebase'); else { for (const c of changes) console.log(`${c.id}: ${c.from} → ${c.to}`); process.exit(3); } }
  else { console.error('Usage: flags-snapshot.mjs check | refresh'); process.exit(2); }
}
