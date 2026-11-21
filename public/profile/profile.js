/**
 * The player's profile (lab flag `profile`, lab: #seccion-profile): one page with the player's card,
 * then three tabs, 🎖️ badges, 🏅 rankings and ⚙️ settings. Without a player it invites to sign in,
 * shows the badges this phone already earned and the rankings as /records/ does. /records/ stays
 * as it is meanwhile (the owner, 2026-11-21: «que coexistan por un tiempo»).
 *
 * What it reads is the player's own (`jugador.js`): their record in `jugadores/<jid>` (since when,
 * how many games of each), their Uno al día history, their cups and La Copa's podiums, and the
 * tables they are in. A badge earned once stays earned on this phone (`earned`'s `seen`), so a
 * first place lost this week keeps its badge.
 */
import { el } from '../assets/js/ui.js';
import { withIcon } from '../assets/js/game-icon.js';
import { getLang, langToggle, pickLang, COMMON } from '../assets/js/i18n.js';
import { SFX, soundToggle } from '../assets/js/sound.js';
import { ALL_GAMES, GAMES, SOLO_TABLES, FIRST_VARIANT_TABLES } from '../assets/js/games.js';
import { bloqueJugador, bloqueRanking, mmss, conBandera } from '../assets/js/ranking.js';
import { jugador, leerYo } from '../assets/js/jugador.js';
import { TODOTERRENO, UAD_PUNTOS, SIEMPRE, semana, medallero } from '../assets/js/records.js';
import { leer as leerDia, recorrer, fechaLocal } from '../assets/js/uno-al-dia.js';
import { readHours } from '../assets/js/play-hours.js';
import { PARTIDAS_KEY } from '../assets/js/transport/stats.js';
import { firebaseConfig } from '../assets/js/firebase-config.js';
import { BADGES, GROUPS, earned } from './badges.js';
import { TEXTS } from './texts.js';

const lang = getLang();
const T = TEXTS[lang] || TEXTS.es;
const RK = (COMMON[lang] || COMMON.es).rk;
const fmt = (s, v = {}) => String(s).replace(/\{(\w+)\}/g, (_, k) => (v[k] !== undefined ? v[k] : `{${k}}`));
const tap = () => SFX.tap();
const num = x => new Intl.NumberFormat(lang).format(x);
const place = p => (Number.isInteger(p) ? (lang === 'en' ? `#${p}` : `${p}.º`) : T.noPlace);
const monthName = ms => new Intl.DateTimeFormat(lang, { month: 'long', year: 'numeric' }).format(new Date(ms));
/** Monthly points began in October 2026 (D-412): the months before have no table. */
const FIRST_POINTS_MONTH = '2026-10';

/** The games a player can earn badges in: launched, not hidden. */
const CATALOGUE = ALL_GAMES.filter(g => g.available !== false && !g.labs && !g.oculto);
const gameOf = id => ALL_GAMES.find(g => g.id === id);
/** The table a game's best lives in: its solo table, its wins for a group game, or its own. */
function tableOf(id) {
  if (SOLO_TABLES[id]) return { t: SOLO_TABLES[id], wins: false };
  if (GAMES.some(g => g.id === id && g.jugadas)) return { t: `${id}_victorias`, wins: true };
  return { t: FIRST_VARIANT_TABLES[id] || id, wins: false };
}

/* ------------------------------------------------------------------ */
/* What this phone knows, and what the server adds                     */
/* ------------------------------------------------------------------ */

const SEEN = jid => `juegos-de-salon:profile-badges:${jid || 'guest'}`;
const readSeen = jid => { try { return JSON.parse(localStorage.getItem(SEEN(jid)) || '{}') || {}; } catch (_) { return {}; } };
const writeSeen = (jid, v) => { try { localStorage.setItem(SEEN(jid), JSON.stringify(v)); } catch (_) { /* not kept */ } };

/** The facts this phone holds without asking anyone (a guest's, and a player's first draw). */
function localFacts() {
  const d = leerDia();
  const hoy = fechaLocal();
  const r = recorrer(d.dias || {}, hoy, { regalos: d.regalos || [] });
  let played = [];
  try { played = JSON.parse(localStorage.getItem('juegos-de-salon:jugados') || '[]'); } catch (_) { played = []; }
  const ids = new Set(CATALOGUE.map(g => g.id));
  return {
    today: hoy, now: Date.now(),
    streak: r.racha, bestStreak: r.mejor,
    dailyDays: Object.fromEntries(Object.keys(d.dias || {}).map(f => [f, true])),
    hours: readHours(),
    plays: Number(localStorage.getItem(PARTIDAS_KEY)) || 0,
    gamesPlayed: Array.isArray(played) ? played.filter(id => ids.has(id)).length : 0,
    gamesTotal: CATALOGUE.length,
  };
}

/** Whether this page talks to the real database (the published site) or to the test one (D-138). */
const realDb = () => !/[?&](test|records=local)\b/.test(location.search) && !/^(localhost|127\.|192\.168\.|10\.|100\.)/.test(location.hostname);

/** How many of `cups` (`[{ code, p }]`) the player created: the cup's admin is their seat. */
async function hostedOf(cups) {
  if (!realDb() || !cups.length) return 0;
  const base = firebaseConfig.databaseURL;
  const admins = await Promise.all(cups.slice(0, 40).map(c => fetch(`${base}/torneos/${c.code}/meta/admin.json`).then(r => (r.ok ? r.json() : null)).catch(() => null)));
  return cups.slice(0, 40).filter((c, i) => admins[i] === c.p).length;
}

/** The player's facts: the phone's, plus their server record. Each read on its own: one failing leaves the rest. */
async function playerFacts(J, yo) {
  const f = localFacts();
  const [perfil, hist, cups, podios] = await Promise.all([
    J.perfil().catch(() => null), J.historialDia().catch(() => ({})), J.copas().catch(() => []), J.podios().catch(() => ({})),
  ]);
  // Uno al día from any phone: the server's days (by number) joined with this phone's (by date)
  const dias = { ...(leerDia().dias || {}) };
  for (const n of Object.keys(hist || {})) if (/^\d+$/.test(n)) dias[new Date(Number(n) * 86400000).toISOString().slice(0, 10)] ||= hist[n];
  const r = recorrer(dias, f.today, { regalos: leerDia().regalos || [] });
  f.streak = r.racha; f.bestStreak = r.mejor;
  f.dailyDays = Object.fromEntries(Object.keys(dias).map(d => [d, true]));
  const juegos = perfil?.juegos || {};
  f.byGame = Object.entries(juegos).map(([id, x]) => ({ id, n: Number(x?.n) || 0 })).filter(x => x.n > 0 && gameOf(x.id)).sort((a, b) => b.n - a.n);
  const ids = new Set(CATALOGUE.map(g => g.id));
  f.gamesPlayed = f.byGame.filter(x => ids.has(x.id)).length;
  f.plays = f.byGame.reduce((s, x) => s + x.n, 0);
  f.since = Number(perfil?.at) || 0;
  f.cups = cups.length;
  f.cupList = cups;
  const mine = medallero(podios).find(x => x.jid === yo.jid);
  f.medals = { gold: mine?.oro || 0, silver: mine?.plata || 0, bronze: mine?.bronce || 0 };
  f.podiums = Object.entries(podios || {}).flatMap(([code, c]) => Object.values(c?.p || {}).filter(x => x.j === yo.jid).map(x => ({ code, name: c.name, end: c.end || 0, l: x.l }))).sort((a, b) => b.end - a.end);
  // Finished months of Uno al día points: the player's place when on the podium
  const months = [];
  for (let m = FIRST_POINTS_MONTH; m < f.today.slice(0, 7); m = nextMonth(m)) months.push(m);
  f.months = (await Promise.all(months.map(async m => {
    try { const v = await J.tabla(UAD_PUNTOS, `s${m}`, { top: 3 }); const i = v.top.findIndex(x => x.jid === yo.jid); return { period: `s${m}`, place: i >= 0 ? v.top[i].puesto : null }; } catch (_) { return null; }
  }))).filter(Boolean);
  f.hosted = await hostedOf(cups).catch(() => 0);
  return f;
}
const nextMonth = m => { const [y, mo] = m.split('-').map(Number); return mo === 12 ? `${y + 1}-01` : `${y}-${String(mo + 1).padStart(2, '0')}`; };

/** Places in the overall ranking and in each game's table, read a few at a time. Adds `firsts` and `allRounder` to `f`. */
async function ranksOf(J, f, onGame) {
  const sem = semana(Date.now());
  const read = async (t, p) => { try { return (await J.tabla(t, p, { top: 10 })).yo || null; } catch (_) { return null; } };
  const [ever, week] = await Promise.all([read(TODOTERRENO, SIEMPRE), read(TODOTERRENO, sem)]);
  f.allRounder = ever?.puesto ?? null;
  f.general = { ever: ever?.puesto ?? null, week: week?.puesto ?? null };
  let firsts = 0;
  const queue = [...(f.byGame || [])];
  const worker = async () => {
    for (let g = queue.shift(); g; g = queue.shift()) {
      const { t, wins } = tableOf(g.id);
      const [e, w] = await Promise.all([read(t, SIEMPRE), read(t, sem)]);
      if (e?.puesto === 1 || w?.puesto === 1) firsts++;
      onGame(g.id, { t, wins, ever: e, week: w });
    }
  };
  await Promise.all([worker(), worker(), worker()]);
  f.firsts = firsts;
  return f;
}

/* ------------------------------------------------------------------ */
/* Drawing                                                             */
/* ------------------------------------------------------------------ */

function badgeEl(b) {
  const [name, desc] = b.secret && !b.got ? [T.secretName, T.secretDesc] : T.badges[b.id] || [b.id, ''];
  return el('div', { class: `pf-badge pf-badge--${b.tier}${b.got ? '' : ' pf-badge--locked'}${b.new ? ' pf-badge--new' : ''}`, 'data-badge': b.id },
    b.new ? el('span', { class: 'pf-new' }, T.isNew) : null,
    el('span', { class: 'pf-medal', 'aria-hidden': 'true' }, b.secret && !b.got ? '?' : b.icon),
    b.got && b.count > 1 ? el('span', { class: 'pf-times' }, `×${b.count}`) : null,
    el('span', { class: 'pf-name' }, name),
    el('span', { class: 'pf-desc' }, b.progress ? `${desc} · ${num(b.progress[0])} / ${num(b.progress[1])}` : desc),
    b.progress ? el('span', { class: 'pf-bar', 'aria-hidden': 'true' }, el('i', { style: `width:${Math.round(100 * b.progress[0] / b.progress[1])}%` })) : null);
}

function badgePanels(list, { only = null } = {}) {
  const title = { daily: T.groupDaily, cup: T.groupCup, games: T.groupGames };
  return GROUPS.map(g => {
    const all = list.filter(b => b.group === g && (!only || only(b)));
    if (!all.length) return null;
    const got = all.filter(b => b.got).length;
    return el('section', { class: 'panel pf-group', 'data-group': g },
      el('p', { class: 'lead pf-group-head' }, el('span', {}, title[g]), el('small', {}, fmt(T.groupOf, { n: got, total: all.length }))),
      el('div', { class: 'pf-grid' }, all.map(badgeEl)));
  });
}

function card(yo, f, list) {
  const got = list.filter(b => b.got).length;
  // The flag and the name are the player, as on every table (the owner, 2026-11-21: no initial in a circle)
  return el('section', { class: 'panel pf-card' },
    el('div', { class: 'pf-who' },
      el('div', {},
        el('p', { class: 'pf-player' }, conBandera(yo.co, yo.n)),
        el('p', { class: 'muted pf-since' }, [f.since ? fmt(T.since, { month: monthName(f.since) }) : null, fmt(T.badgesOf, { n: got, total: BADGES.length })].filter(Boolean).join(' · ')))),
    el('div', { class: 'pf-stats' },
      el('div', { class: 'pf-stat' }, el('b', {}, `🔥 ${num(f.streak || 0)}`), el('span', {}, T.statStreak)),
      el('div', { class: 'pf-stat' }, el('b', {}, num(f.plays || 0)), el('span', {}, T.statPlays)),
      el('div', { class: 'pf-stat' }, el('b', {}, `🏆 ${num(f.medals?.gold || 0)}`), el('span', {}, T.statCups))));
}

/** The 🏅 tab: the overall ranking with the player's places, their games, Uno al día's month and their cups. */
function rankingsTab(J, f) {
  const box = el('div', { class: 'pf-tab' });
  // The overall ranking, with the player's three places on top of its table
  const pos = (v, label) => el('div', { class: 'pf-place' }, el('b', {}, v), el('span', {}, label));
  const places = el('div', { class: 'pf-places' }, pos('…', T.week), pos('…', T.ever), pos('…', T.friends));
  const general = bloqueRanking({ juego: TODOTERRENO, titulo: T.general, hint: RK.allRounderHint, alTocar: tap });
  general.insertBefore(places, general.querySelector('.rk-seg'));
  J.tablaAmigos(TODOTERRENO, SIEMPRE).then(rows => {
    const i = rows.findIndex(x => x.jid === leerYo()?.jid);
    places.children[2].firstChild.textContent = i >= 0 && rows.length > 1 ? place(rows[i].puesto) : T.noPlace;
  }).catch(() => { places.children[2].firstChild.textContent = T.noPlace; });
  // The player's games, most played first: their best, their place ever and this week
  const games = el('section', { class: 'panel pf-games' }, el('p', { class: 'lead rk-titulo' }, T.yourGames));
  const rows = new Map();
  const list = el('div', { class: 'pf-game-list' });
  let open = null;
  const SHOWN = 6;
  if (!f.byGame?.length) games.append(el('p', { class: 'muted rk-centro' }, T.noGames));
  else {
    games.append(el('p', { class: 'muted rk-hint' }, T.yourGamesHint), list);
    f.byGame.forEach((g, i) => {
      const game = gameOf(g.id);
      const { t, wins } = tableOf(g.id);
      const best = el('span', { class: 'pf-game-sub' }, g.n === 1 ? T.playsOne : fmt(T.plays, { n: num(g.n) }));
      const where = el('span', { class: 'pf-game-place' }, '…');
      const slot = el('div', { class: 'pf-game-table' });
      const row = el('button', { type: 'button', class: 'pf-game', 'data-game': g.id, 'aria-expanded': 'false', hidden: i >= SHOWN,
        onClick: () => {
          tap();
          const was = open === g.id;
          if (open) { const o = rows.get(open); o.slot.replaceChildren(); o.row.setAttribute('aria-expanded', 'false'); }
          open = was ? null : g.id;
          if (!was) { slot.replaceChildren(bloqueRanking({ juego: t, titulo: null, hint: wins ? RK.winsHint : null, alTocar: tap })); row.setAttribute('aria-expanded', 'true'); }
        } },
      el('span', { class: 'pf-game-name' }, withIcon(game, pickLang(game.name, lang))), best, where);
      rows.set(g.id, { row, best, where, slot, n: g.n, wins });
      list.append(row, slot);
    });
    if (f.byGame.length > SHOWN) {
      const more = el('button', { type: 'button', class: 'btn btn--ghost btn--sm pf-more', onClick: () => { tap(); list.querySelectorAll('.pf-game[hidden]').forEach(b => { b.hidden = false; }); more.remove(); } }, fmt(T.moreGames, { n: f.byGame.length - SHOWN }));
      games.append(more);
    }
  }
  // Uno al día's month and the player's cups
  const month = bloqueRanking({ juego: UAD_PUNTOS, titulo: fmt(T.dailyMonth, { month: monthName(Date.now()) }), pestanas: ['mes', 'amigosMes'], alTocar: tap });
  const medal = l => ['🥇', '🥈', '🥉'][l - 1] || '🏆';
  const cups = el('section', { class: 'panel pf-cups' }, el('p', { class: 'lead rk-titulo' }, T.yourCups),
    f.podiums?.length
      ? el('div', { class: 'rk-lista' }, f.podiums.slice(0, 8).map(p => el('div', { class: 'rk-fila' },
        el('span', { class: 'rk-puesto' }, medal(p.l)), el('span', { class: 'rk-nombre' }, el('span', { class: 'rk-n' }, p.name || p.code)), el('span', {}), el('span', { class: 'rk-puntos' }, place(p.l)))))
      : el('p', { class: 'muted rk-centro' }, f.cups ? `${f.cups} 🏆` : T.noCups));
  const all = el('a', { class: 'btn btn--ghost', href: '../records/', onClick: tap }, T.allRankings);
  box.append(general, games, month, cups, all);
  return {
    box,
    /** A game's places arrived. */
    game(id, r) {
      const x = rows.get(id);
      if (!x) return;
      const b = r.ever;
      if (b) x.best.textContent = `${fmt(T.best, { score: x.wins ? num(b.s) : `${num(b.s)}${b.ms ? ` · ${mmss(b.ms)}` : ''}` })} · ${x.n === 1 ? T.playsOne : fmt(T.plays, { n: num(x.n) })}`;
      x.where.textContent = b ? place(b.puesto) : T.noPlace;
      if (r.week?.puesto) x.where.append(el('small', {}, fmt(T.placeWeek, { place: place(r.week.puesto) })));
    },
    general(g) {
      places.children[0].firstChild.textContent = place(g.week);
      places.children[1].firstChild.textContent = place(g.ever);
    },
  };
}

/** The ⚙️ tab: the account and the preferences (offline mode's ☁️ stays on the home page; writing to us and privacy are in the footer). */
function settingsTab(yo) {
  const row = (label, hint, control) => el('div', { class: 'toggle-row' }, el('span', { class: 'txt' }, el('b', {}, label), hint ? el('small', {}, hint) : null), control);
  const account = el('section', { class: 'panel pf-settings' }, el('p', { class: 'lead rk-titulo' }, T.account),
    row(T.nameRow, T.nameHint, el('b', { class: 'pf-name-now' }, conBandera(yo.co, yo.n))));
  const prefs = el('section', { class: 'panel pf-settings' }, el('p', { class: 'lead rk-titulo' }, T.prefs),
    row(T.language, null, langToggle()), row(T.sound, null, soundToggle()));
  const notices = el('div', {});
  import('../assets/js/uno-al-dia-avisos.js').then(m => {
    const draw = () => { const b = m.bloque({ lang, alTocar: tap, redibujar: draw }); notices.replaceChildren(...(b ? [b] : [])); };
    draw();
  }).catch(() => {});
  return el('div', { class: 'pf-tab' }, account, bloqueJugador({ alTocar: tap }), prefs, notices);
}

/* ------------------------------------------------------------------ */
/* The page                                                            */
/* ------------------------------------------------------------------ */

const TABS = ['badges', 'rankings', 'settings'];

/** Draws the page in `root` for whoever is on this phone. Returns when the first draw is on screen. */
export async function drawProfile(root, { sub }) {
  const J = await jugador();
  let turn = 0;
  const draw = async () => {
    const mine = ++turn;
    const yo = leerYo();
    sub.textContent = yo ? T.pageSub : T.guestSub;
    if (!yo) return drawGuest(root);
    // First what the phone knows, at once; then the server's facts and places, as they arrive
    const tab = TABS.includes(location.hash.slice(1)) ? location.hash.slice(1) : 'badges';
    let f = { ...localFacts(), byGame: [] };
    const paint = () => {
      const r = earned(f, readSeen(yo.jid));
      writeSeen(yo.jid, r.seen);
      return r.list;
    };
    const badgesBox = el('div', { class: 'pf-tab' });
    const cardSlot = el('div', {});
    const seg = el('div', { class: 'seg pf-tabs', role: 'tablist' }, TABS.map(id => el('button', {
      type: 'button', role: 'tab', 'data-tab': id, onClick: () => { tap(); show(id); },
    }, T[`tab${id[0].toUpperCase()}${id.slice(1)}`])));
    const panes = { badges: badgesBox, rankings: el('div', {}), settings: settingsTab(yo) };
    function show(id) {
      seg.querySelectorAll('button').forEach(b => { const on = b.dataset.tab === id; b.classList.toggle('on', on); b.setAttribute('aria-selected', String(on)); });
      for (const k of TABS) panes[k].hidden = k !== id;
      history.replaceState(null, '', `#${id}`);
    }
    const repaint = list => { cardSlot.replaceChildren(card(yo, f, list)); badgesBox.replaceChildren(...badgePanels(list).filter(Boolean)); };
    repaint(paint());
    root.replaceChildren(cardSlot, seg, panes.badges, panes.rankings, panes.settings);
    show(tab);
    try { f = { ...f, ...(await playerFacts(J, yo)) }; } catch (_) { /* offline: the phone's facts stay */ }
    if (mine !== turn) return;
    repaint(paint());
    const rk = rankingsTab(J, f);
    panes.rankings.replaceChildren(rk.box);
    await ranksOf(J, f, (id, r) => rk.game(id, r)).catch(() => {});
    if (mine !== turn) return;
    if (f.general) rk.general(f.general);
    repaint(paint());
  };
  J.escuchar(() => draw());
  await draw();
  window.__profile = { redraw: draw };
}

function drawGuest(root) {
  const r = earned(localFacts(), readSeen(null));
  writeSeen(null, r.seen);
  // The badges this phone could earn without a name: Uno al día's streaks and hours, and the games played
  const local = new Set(['streak-10', 'streak-30', 'month-full', 'early-bird', 'explorer', 'plays-100', 'night-owl']);
  const list = r.list.filter(b => local.has(b.id) && (b.got || !b.secret));
  root.replaceChildren(
    bloqueJugador({ abierto: true, destacado: true, alTocar: tap }),
    el('section', { class: 'panel pf-group' },
      el('p', { class: 'lead pf-group-head' }, el('span', {}, T.guestBadges), el('small', {}, fmt(T.groupOf, { n: list.filter(b => b.got).length, total: list.length }))),
      el('div', { class: 'pf-grid' }, list.map(badgeEl)),
      el('p', { class: 'muted rk-hint pf-note' }, T.guestBadgesNote)),
    bloqueRanking({ juego: TODOTERRENO, titulo: T.general, hint: RK.allRounderHint, alTocar: tap }),
    bloqueRanking({ juego: UAD_PUNTOS, titulo: fmt(T.dailyMonth, { month: monthName(Date.now()) }), pestanas: ['mes', 'amigosMes'], alTocar: tap }),
    el('a', { class: 'btn btn--ghost', href: '../records/', onClick: tap }, T.allRankings));
}

