/**
 * The "💬 they commented on your result" notification (D-564): a pure function, like schedule.mjs.
 * A player with La Copa's notifications on gets one when someone else comments on their row of the
 * table (D-562), grouped, with who but never what (the lock screen does not show the text, nor a
 * result in it), and it opens the cup's table.
 *
 * Rules:
 * - Only comments by others, not hidden by the player, written after they turned notifications on
 *   and in the last WINDOW; each comment once (key `charla:<day>:<author>` in pushEnviados, so an
 *   edit does not notify again).
 * - Never at night for the recipient (the same FROM_HOUR–TO_HOUR as the cup's), and at most one every
 *   GAP per cup and phone: what comes meanwhile goes together in the next one.
 * - They do not count toward the cup's CAP of notifications a day (schedule.mjs): those are the
 *   cup's own reminders, and a comment must not use up the deadline's.
 * - Behind the flag `cup-talk-push`: with it on for everyone, every phone with the cup's
 *   notifications gets them unless it turned "Comments" off (`charla: false`); before that, only a
 *   phone that turned it on (`charla: true`, which only the lab sees).
 */
import { conCierre, terminada } from '../../public/cup/engine.js';
import { LOCALES } from '../../public/cup/rules.js';
import { VALORES } from '../../public/assets/js/parametros.js';
import { SITE, FROM_HOUR, TO_HOUR, localHour, listOf } from './schedule.mjs';

const MIN = 60 * 1000;
/** At most one comment notification per cup and phone in this time. */
export const GAP = 30 * MIN;
/** Older comments are not notified any more. */
export const WINDOW = 24 * 60 * MIN;
export const KEY = 'charla:';

const fmt = (s, v = {}) => String(s).replace(/\{(\w+)\}/g, (_, k) => (v[k] !== undefined ? v[k] : `{${k}}`));

/** Whether a phone gets comment notifications, by its choice and the flag's state. */
export const wantsTalk = (pref, flagAll) => (flagAll ? pref?.charla !== false : pref?.charla === true);

/**
 * @param {object} talk    cupTalk/<code>: { <day>: { <target>: { <author>: { c, at } } } }
 * @param {object} hidden  cupTalkHidden/<code>: { <day>: { <target>: { <author>: true } } }
 * @param {boolean} flagAll  flags/cup-talk-push is 'all'
 * Same shape as cupNotifications: { subId, pid, code, kind, keys, notification }.
 */
export function talkNotifications({ code, cup, talk = {}, hidden = {}, wants = {}, subs = {}, sent = {}, now, flagAll = false }) {
  if (!cup?.meta) return [];
  const L = conCierre(cup);
  if (terminada(L.meta, now)) return [];
  const out = [];
  for (const [pid, bySub] of Object.entries(wants || {})) {
    if (!L.players?.[pid] || L.players[pid].out) continue;
    // Comments on this player's row, by others, not hidden, recent
    const fresh = [];
    for (const [d, rows] of Object.entries(talk || {})) {
      for (const [author, x] of Object.entries(rows?.[pid] || {})) {
        if (author === pid || !x?.c || hidden?.[d]?.[pid]?.[author]) continue;
        const at = Number(x.at) || 0;
        if (now - at > WINDOW) continue;
        fresh.push({ d, author, at });
      }
    }
    if (!fresh.length) continue;
    for (const [subId, pref] of Object.entries(bySub || {})) {
      const sub = subs[subId];
      if (!sub || !wantsTalk(pref, flagAll)) continue;
      const h = localHour(now, sub.tz);
      if (h < FROM_HOUR || h >= TO_HOUR) continue;
      const mine = sent?.[subId] || {};
      const last = Math.max(0, ...Object.entries(mine).filter(([k]) => k.startsWith(KEY)).map(([, t]) => Number(t) || 0));
      if (now - last < GAP) continue;
      const due = fresh.filter(x => x.at > (pref.at || 0) && !mine[`${KEY}${x.d}:${x.author}`]).sort((a, b) => a.at - b.at);
      if (!due.length) continue;
      const lang = LOCALES[sub.lang] ? sub.lang : 'es';
      const T = LOCALES[lang];
      const names = [...new Set(due.map(x => L.players?.[x.author]?.name).filter(Boolean))];
      const body = due.length === 1 ? fmt(T.avMsgTalk, { name: names[0] || '?' })
        : names.length === 1 ? fmt(T.avMsgTalkSome, { n: due.length, name: names[0] })
        : fmt(T.avMsgTalkMany, { n: due.length, names: listOf(names, lang) });
      out.push({
        subId, pid, code, kind: 'charla', keys: due.map(x => `${KEY}${x.d}:${x.author}`),
        notification: {
          title: `🏆 ${fmt(T.shareHead, { copa: L.meta.name })}`,
          body,
          url: `${SITE}cup/?${L.meta.alias || code}&notif=${VALORES.notif.charla}`,
          tag: `copa-${code}-charla`,
        },
      });
    }
  }
  return out;
}
