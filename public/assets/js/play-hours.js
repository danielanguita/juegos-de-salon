/**
 * The hours this phone finishes games at, early and at night, for the profile's badges (lab flag
 * `profile`: 🌅 early bird, 🦉 night owl). On the phone only, never sent: `{ 'YYYY-MM-DD': { e, n } }`,
 * how many games ended between 04:00 and 06:59 (`e`) and between 00:00 and 03:59 (`n`) of each local
 * day, the last 60 days with any. `stats.js`' `trackFinish` notes every finished game (C-21).
 */
export const HOURS_KEY = 'juegos-de-salon:play-hours';
const KEEP = 60;

/** The log with one more game finished at `ms`, by the phone's clock. Pure. */
export function addHour(log = {}, ms = Date.now()) {
  const d = new Date(ms), h = d.getHours();
  const kind = h < 4 ? 'n' : h < 7 ? 'e' : null;
  if (!kind) return log;
  const day = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const out = { ...log, [day]: { ...(log[day] || {}), [kind]: (Number(log[day]?.[kind]) || 0) + 1 } };
  return Object.fromEntries(Object.keys(out).sort().slice(-KEEP).map(k => [k, out[k]]));
}

/** What this phone logged, or {}. */
export function readHours(storage = globalThis.localStorage) {
  try { const v = JSON.parse(storage?.getItem(HOURS_KEY) || '{}'); return v && typeof v === 'object' ? v : {}; } catch (_) { return {}; }
}

/** Notes one finished game now. Never throws. */
export function noteHour(storage = globalThis.localStorage, ms = Date.now()) {
  try {
    const before = readHours(storage), after = addHour(before, ms);
    if (after !== before) storage?.setItem(HOURS_KEY, JSON.stringify(after));
  } catch (_) { /* no storage: nothing noted */ }
}
