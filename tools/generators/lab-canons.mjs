/**
 * What a lab game lacks of its canons (D-579), from what it is made of, so public/labs/canons.test.mjs
 * checks the repo's lab games and tools/generators/new-game.test.mjs the generator's game with the
 * same rule. Subjects: manifest, cover-measured, exits, rankings, dialogs, signals, spec, e2e (docs/ADD-GAME.md).
 *   manifest  its game.json, or null       game      all its code (game.js, its modules, inline scripts)
 *   inPaths   it has a cover in tools/e2e/paths.mjs (an `intro`)
 *   hasSpec   docs/games/<folder>.md exists   e2e  the file names in tools/e2e/<folder>/
 */
import { excuses } from './conformance.mjs';

export function labCanonGaps({ manifest: m, game = '', inPaths = false, hasSpec = false, e2e = [] }) {
  const ok = (canon, subject, pass) => pass || (m && excuses(m, canon, subject));
  const out = [];
  if (!m) out.push('manifest');
  if (!ok('C-17', 'cover', inPaths)) out.push('cover-measured');
  if (!ok('C-19', 'fin.js', /\bsalidasFin\(/.test(game))) out.push('exits');
  if (!ok('C-19', 'rankings', /\b(finDePartida|bloqueTabla|avisoPartida|bloqueRanking|bloqueVictorias)\(/.test(game))) out.push('rankings');
  if (!ok('C-8', 'cover-dialogs', /\bcoverWithDialogs\b/.test(game))) out.push('dialogs');
  if (!ok('C-7', 'trackStart', /\btrackStart\(/.test(game) && /\btrackFinish\(/.test(game))) out.push('signals');
  if (!hasSpec) out.push('spec');
  if (!ok('C-12', 'e2e', e2e.includes('languages.mjs') && e2e.some(f => f !== 'languages.mjs' && f.endsWith('.mjs')))) out.push('e2e');
  return out;
}
