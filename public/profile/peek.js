/**
 * Another player's profile, at a glance (lab flag `profile`; the owner, 2026-11-22): a tap on a name in a
 * ranking opens a sheet with what matters most about that player: their flag and name, since when they
 * play, their place in the overall ranking when in its top 10, their streak, games and cups won, their
 * three most played games and the achievements anyone can see. Tapping your own name shows how others see you.
 *
 * Only what is already public is read (`jugadores/<jid>`, `unoAlDia/<jid>`, the Cups' podiums and the
 * tables): what this phone alone knows about its player (the hours, the marks, the cups joined) is not
 * there, so the achievements that come from it are left out, never shown as missing.
 *
 * First on the profile page (`peekOnTap`); the game and Cup covers come later.
 */
import { el } from '../assets/js/ui.js';
import { withIcon } from '../assets/js/game-icon.js';
import { getLang, pickLang } from '../assets/js/i18n.js';
import { ALL_GAMES } from '../assets/js/games.js';
import { conBandera } from '../assets/js/ranking.js';
import { jugador, leerYo } from '../assets/js/jugador.js';
import { TODOTERRENO, UAD_PUNTOS, SIEMPRE, medallero } from '../assets/js/records.js';
import { recorrer, fechaLocal } from '../assets/js/uno-al-dia.js';
import { BADGES, earned } from './badges.js';
import { TEXTS } from './texts.js';

/** The achievements that public data can tell: the rest live on the player's own phone. */
export const PUBLIC_BADGES = new Set(['streak-10', 'streak-30', 'streak-100', 'month-full', 'month-podium', 'month-champion',
  'cup-podium', 'cup-champion', 'explorer', 'collector', 'plays-100', 'plays-1000', 'specialist', 'regular', 'weekends',
  'all-rounder', 'one-year']);
const TIER = { gold: 0, silver: 1, bronze: 2 };
/** How many medals the sheet shows before «+N». */
export const SHOWN_BADGES = 8;

const CATALOGUE = ALL_GAMES.filter(g => g.available !== false && !g.labs && !g.oculto);
const gameOf = id => ALL_GAMES.find(g => g.id === id);

/**
 * The player's facts from their public record, pure for node. `perfil` is `jugadores/<jid>`, `hist`
 * `unoAlDia/<jid>` (by day number), `podios` the Cups' podiums, `general` the overall table's top
 * (`[{ jid, puesto }]`), `months` `[{ period, top: [{ jid, puesto }] }]`.
 */
export function peekFacts({ jid, perfil = null, hist = {}, podios = {}, general = [], months = [], today = fechaLocal(), now = Date.now() }) {
  const dias = {};
  for (const n of Object.keys(hist || {})) if (/^\d+$/.test(n)) dias[new Date(Number(n) * 86400000).toISOString().slice(0, 10)] = hist[n];
  const r = recorrer(dias, today, {});
  const ids = new Set(CATALOGUE.map(g => g.id));
  const byGame = Object.entries(perfil?.juegos || {}).map(([id, x]) => ({ id, n: Number(x?.n) || 0 }))
    .filter(x => x.n > 0 && gameOf(x.id)).sort((a, b) => b.n - a.n);
  const mine = medallero(podios || {}).find(x => x.jid === jid);
  const place = (general || []).find(x => x.jid === jid)?.puesto ?? null;
  return {
    today, now,
    n: perfil?.n || '', co: perfil?.co || '',
    since: Number(perfil?.at) || 0,
    streak: r.racha, bestStreak: r.mejor,
    dailyDays: Object.fromEntries(Object.keys(dias).map(d => [d, true])),
    byGame,
    gamesPlayed: byGame.filter(x => ids.has(x.id)).length,
    gamesTotal: CATALOGUE.length,
    plays: byGame.reduce((s, x) => s + x.n, 0),
    medals: { gold: mine?.oro || 0, silver: mine?.plata || 0, bronze: mine?.bronce || 0 },
    allRounder: Number.isInteger(place) && place <= 10 ? place : null,
    months: (months || []).map(m => ({ period: m.period, place: (m.top || []).find(x => x.jid === jid)?.puesto ?? null })),
  };
}

/** The achievements to show: earned, public, the best metal first. */
export function peekBadges(f) {
  return earned(f, {}).list.filter(b => b.got && PUBLIC_BADGES.has(b.id)).sort((a, b) => TIER[a.tier] - TIER[b.tier]);
}

/** Reads a player's public record; each read on its own, one failing leaves the rest. */
async function readFacts(J, jid) {
  const today = fechaLocal();
  const monthsWanted = [];
  for (let m = '2026-10'; m < today.slice(0, 7); m = nextMonth(m)) monthsWanted.push(m);
  const [perfil, hist, podios, general, months] = await Promise.all([
    J.perfil(jid).catch(() => null),
    J.historialDia(jid).catch(() => ({})),
    J.podios().catch(() => ({})),
    J.tabla(TODOTERRENO, SIEMPRE, { top: 10, reciente: 60000 }).then(v => v.top).catch(() => []),
    Promise.all(monthsWanted.map(m => J.tabla(UAD_PUNTOS, `s${m}`, { top: 3, reciente: 60000 }).then(v => ({ period: `s${m}`, top: v.top })).catch(() => null))),
  ]);
  if (!perfil) return null;
  return peekFacts({ jid, perfil, hist, podios, general, months: months.filter(Boolean), today });
}
const nextMonth = m => { const [y, mo] = m.split('-').map(Number); return mo === 12 ? `${y + 1}-01` : `${y}-${String(mo + 1).padStart(2, '0')}`; };

/** Opens the sheet for `jid`; `hint` (`{ n, co }`) is what the tapped row showed, drawn while the rest loads. */
export async function peekPlayer(jid, { hint = {}, lang = getLang(), doc = document, onTap = () => {} } = {}) {
  if (!jid || doc.getElementById('pf-peek')) return null;
  const T = TEXTS[lang] || TEXTS.es;
  const fmt = (s, v = {}) => String(s).replace(/\{(\w+)\}/g, (_, k) => (v[k] !== undefined ? v[k] : `{${k}}`));
  const num = x => new Intl.NumberFormat(lang).format(x);
  const me = leerYo()?.jid === jid;
  const y = doc.defaultView?.scrollY || 0;
  const bodyStyle = doc.body.getAttribute('style');
  let layer = null;
  const close = () => {
    if (!layer) return;
    onTap();
    layer.remove(); layer = null;
    if (bodyStyle === null) doc.body.removeAttribute('style'); else doc.body.setAttribute('style', bodyStyle);
    doc.defaultView?.scrollTo?.(0, y);
    doc.removeEventListener('keydown', onKey);
  };
  const onKey = e => { if (e.key === 'Escape') close(); };
  const who = el('h2', { id: 'pf-peek-name', class: 'pf-peek-name' }, conBandera(hint.co, hint.n || '…'));
  const body = el('div', { class: 'pf-peek-body' }, el('p', { class: 'muted pf-peek-wait' }, T.peekLoading));
  const panel = el('div', { class: 'hoja pf-peek', id: 'pf-peek', role: 'dialog', 'aria-modal': 'true', 'aria-labelledby': 'pf-peek-name' },
    el('div', { class: 'hoja-asa', 'aria-hidden': 'true' }),
    el('div', { class: 'hoja-cabeza' },
      el('div', { class: 'pf-peek-who' }, me ? el('p', { class: 'pf-peek-kicker' }, T.peekYou) : null, who),
      el('button', { type: 'button', class: 'icon-btn', 'aria-label': T.peekClose, title: T.peekClose, onClick: close }, '✕')),
    body,
    el('div', { class: 'btn-row' }, el('button', { type: 'button', class: 'btn btn--yellow pf-peek-ok', onClick: close }, T.peekClose)));
  layer = el('div', { class: 'hoja-capa' }, el('div', { class: 'hoja-fondo', onClick: close }), panel);
  doc.body.append(layer);
  Object.assign(doc.body.style, { position: 'fixed', top: `-${y}px`, left: '0', right: '0', overflow: 'hidden' });
  doc.addEventListener('keydown', onKey);
  panel.querySelector('.pf-peek-ok')?.focus?.({ preventScroll: true });

  let f = null;
  try { f = await readFacts(await jugador(), jid); } catch (_) { f = null; }
  if (!layer) return null;
  if (!f) { body.replaceChildren(el('p', { class: 'muted pf-peek-wait' }, T.peekError)); return panel; }
  who.textContent = conBandera(f.co, f.n);
  const line = [f.since ? fmt(T.since, { month: new Intl.DateTimeFormat(lang, { month: 'long', year: 'numeric' }).format(new Date(f.since)) }) : null,
    f.allRounder ? fmt(T.peekPlace, { place: lang === 'en' ? `#${f.allRounder}` : `${f.allRounder}.º` }) : null].filter(Boolean);
  const stat = (b, s) => el('div', { class: 'pf-stat' }, el('b', {}, b), el('span', {}, s));
  const badges = peekBadges(f);
  const name = b => (T.badges[b.id] || [b.id])[0];
  const fav = f.byGame.slice(0, 3);
  body.replaceChildren(
    line.length ? el('p', { class: 'muted pf-peek-line' }, line.join(' · ')) : null,
    el('div', { class: 'pf-stats pf-peek-stats' },
      stat(`🔥 ${num(f.streak || 0)}`, T.statStreak), stat(num(f.plays || 0), T.statPlays), stat(`🏆 ${num(f.medals.gold)}`, T.statCups)),
    el('section', { class: 'pf-peek-part' },
      el('h3', {}, T.peekGames),
      fav.length
        ? el('ol', { class: 'pf-peek-games' }, fav.map(g => el('li', { 'data-game': g.id },
          el('span', { class: 'pf-peek-game' }, withIcon(gameOf(g.id), pickLang(gameOf(g.id).name, lang))),
          el('small', {}, g.n === 1 ? T.playsOne : fmt(T.plays, { n: num(g.n) })))))
        : el('p', { class: 'muted' }, T.peekNoGames)),
    el('section', { class: 'pf-peek-part' },
      el('h3', {}, badges.length === 1 ? T.peekBadgesOne : badges.length ? fmt(T.peekBadges, { n: badges.length }) : T.peekBadgesNone),
      badges.length
        ? el('ul', { class: 'pf-peek-badges' },
          badges.slice(0, SHOWN_BADGES).map(b => el('li', { class: `pf-badge--${b.tier}`, 'data-badge': b.id },
            el('span', { class: 'pf-medal', 'aria-hidden': 'true' }, b.icon), el('small', {}, name(b)))),
          badges.length > SHOWN_BADGES ? el('li', { class: 'pf-peek-more' }, el('span', { class: 'pf-medal' }, `+${badges.length - SHOWN_BADGES}`)) : null)
        : el('p', { class: 'muted' }, T.peekNoBadges)));
  return panel;
}

/**
 * Makes every ranking row under `root` open its player's sheet: rows come and go as tabs change, so the
 * taps are caught on `root`, and each new row is made a button for the keyboard and screen readers.
 */
export function peekOnTap(root, { onTap = () => {} } = {}) {
  const T = TEXTS[getLang()] || TEXTS.es;
  const ready = () => root.querySelectorAll('.rk-fila[data-jid]:not([data-peek])').forEach(r => {
    if (!/^[a-z0-9]{8}$/.test(r.dataset.jid)) return;
    r.dataset.peek = '1';
    r.setAttribute('role', 'button');
    r.tabIndex = 0;
    r.setAttribute('aria-label', `${r.querySelector('.rk-n')?.textContent || ''} · ${T.peekOpen}`);
  });
  const open = r => {
    onTap();
    peekPlayer(r.dataset.jid, { hint: { n: r.querySelector('.rk-n')?.textContent || '' }, onTap });
  };
  root.addEventListener('click', e => { const r = e.target.closest?.('.rk-fila[data-peek]'); if (r) open(r); });
  root.addEventListener('keydown', e => {
    const r = e.target.closest?.('.rk-fila[data-peek]');
    if (r && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); open(r); }
  });
  ready();
  new MutationObserver(ready).observe(root, { childList: true, subtree: true });
}
