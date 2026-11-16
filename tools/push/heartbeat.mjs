/**
 * The heartbeat's measure (D-565). notifications.yml is a relay that checks every 5 minutes (D-564);
 * each round notes here how long it has been since the one before, by Pacific day (D-561), in
 * `stats/prod/push/dias/<YYYY-MM-DD>` = `{ vueltas, maxHueco, uad }`: how many rounds, the longest
 * gap in minutes (a notification is at most that late, night quiet aside) and how many hourly Uno al
 * día rebuilds ran. The panel shows it and heartbeat-watch.mjs raises an issue when it falls behind.
 */
const MIN = 60e3;
export const KEEP_DAYS = 60;
/** A gap above this is a missed beat (the relay checks every 5 minutes; a hand-off takes about 1). */
export const LATE_MIN = 15;
/** Without a round for this long, the heartbeat stopped. */
export const STOPPED_MIN = 30;

export const pacificDate = t => new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Los_Angeles' }).format(t);

/** The changes a round writes: `prev` the last round's time, `today` that day's record so far. */
export function beat({ prev, today = {}, now, base = 'stats/prod/push' }) {
  const day = pacificDate(now);
  const gap = prev ? Math.round((now - prev) / MIN) : 0;
  const changes = {
    [`${base}/dias/${day}/vueltas`]: { '.sv': { increment: 1 } },
  };
  // The first round of a day measures its gap from the last of the day before, which counts
  if (gap > (Number(today.maxHueco) || 0)) changes[`${base}/dias/${day}/maxHueco`] = gap;
  return { changes, gap };
}

/** The days older than KEEP_DAYS, to delete. */
export const oldDays = (dias = {}, now) => {
  const limit = pacificDate(now - KEEP_DAYS * 24 * 60 * MIN);
  return Object.keys(dias || {}).filter(d => d < limit);
};

/** Whether the heartbeat is behind: stopped now, or yesterday had a missed beat or no hourly rebuild. */
export function health({ vuelta, uadAt, dias = {}, now }) {
  const problems = [];
  if (!vuelta || now - vuelta > STOPPED_MIN * MIN) problems.push(`no round for ${vuelta ? Math.round((now - vuelta) / MIN) : '∞'} minutes`);
  if (!uadAt || now - uadAt > 3 * 60 * MIN) problems.push(`no Uno al día rebuild for ${uadAt ? Math.round((now - uadAt) / MIN) : '∞'} minutes`);
  const y = pacificDate(now - 24 * 60 * MIN);
  const d = dias?.[y];
  if (!d) problems.push(`no rounds recorded on ${y}`);
  else {
    if ((Number(d.maxHueco) || 0) > LATE_MIN) problems.push(`on ${y} the longest gap between rounds was ${d.maxHueco} minutes (more than ${LATE_MIN})`);
    if ((Number(d.uad) || 0) < 20) problems.push(`on ${y} Uno al día was rebuilt ${Number(d.uad) || 0} times (of 24)`);
  }
  return { ok: !problems.length, problems };
}
