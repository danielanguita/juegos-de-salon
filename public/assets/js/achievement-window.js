/**
 * The window that celebrates a secret achievement (lab flag `profile`, the owner's request 2026-11-22): drawn
 * like Uno al día's month-end window (month-end.js, its comic card, rays and fireworks), with the
 * achievement's round metal medal, no ribbon, that shows «?», shakes and flips to reveal it over diagonal stripes (the owner's pick, look B of three), its own message, how many
 * secret ones the player has, and «Ver mis logros». It opens after the game that earned it (`celebrate`,
 * asked by stats.js' trackFinish) or on the profile, once per achievement and phone.
 * `/profile/?achievement=demo` shows each one with a picker; nothing is recorded.
 */
import { fireworks } from './month-end.js';
import { readFacts, dueSecret, announced, markAnnounced } from './secret-achievements.js';

const ROOT = new URL('../../', import.meta.url);

/** The window's words (C-3); each secret achievement's message by its id. */
export const TEXTS = {
  es: {
    kicker: '🤫 Logro secreto desbloqueado', count: 'Llevas {n} de {total} logros secretos', go: '🎖️ Ver mis logros', later: 'Seguir jugando', close: 'Cerrar',
    // The names are the profile's (profile/texts.js); achievement-window.test.mjs keeps them equal
    names: { 'night-owl': 'Noctámbulo', 'triple-crown': 'Triple corona', 'one-year': 'Un año', fiestas: 'Dieciochero', halloween: 'Noche de brujas', xmas: 'Viejito Pascuero', 'new-year': 'Año nuevo' },
    msg: {
      'night-owl': 'Tres juegos entre medianoche y las 4. Los búhos te saludan; mañana, café doble.',
      'triple-crown': 'Campeón de copa, campeón del mes y número 1 de un juego. Pocos llegan aquí arriba.',
      'one-year': 'Un año jugando con tu nombre. Gracias por quedarte: esta torta es tuya.',
     
      fiestas: 'Jugaste un 18 de septiembre. ¡Viva Chile! Entre empanada y empanada, un juego.',
      halloween: 'Jugaste un 31 de octubre. ¿Dulce o truco? Un juego, claro.',
      xmas: 'Jugaste en Navidad. Entre regalos y pan de pascua, igual sacaste tiempo para un juego. ¡Jo, jo, jo!',
      'new-year': 'Jugaste el 1 de enero. Año nuevo, las mismas ganas de jugar.',
    },
  },
  en: {
    kicker: '🤫 Secret achievement unlocked', count: 'You have {n} of {total} secret achievements', go: '🎖️ See my achievements', later: 'Keep playing', close: 'Close',
    names: { 'night-owl': 'Night owl', 'triple-crown': 'Triple crown', 'one-year': 'One year', fiestas: 'Fiestas Patrias', halloween: 'Halloween', xmas: "Santa's helper", 'new-year': 'New Year' },
    msg: {
      'night-owl': 'Three games between midnight and 4 a.m. The owls salute you; tomorrow, double coffee.',
      'triple-crown': 'Cup champion, month champion and number 1 in a game. Few make it up here.',
      'one-year': 'A year playing with your name. Thanks for staying: this cake is yours.',
     
      fiestas: "You played on September 18. ¡Viva Chile! A game between empanadas.",
      halloween: 'You played on October 31. Trick or treat? A game, of course.',
      xmas: 'You played on Christmas Day. Between presents and cake, you still found time for a game. Ho ho ho!',
      'new-year': 'You played on January 1. New year, same urge to play.',
    },
  },
  pt: {
    kicker: '🤫 Conquista secreta desbloqueada', count: 'Você tem {n} de {total} conquistas secretas', go: '🎖️ Ver minhas conquistas', later: 'Continuar jogando', close: 'Fechar',
    names: { 'night-owl': 'Coruja', 'triple-crown': 'Tríplice coroa', 'one-year': 'Um ano', fiestas: 'Fiestas Patrias', halloween: 'Halloween', xmas: 'Papai Noel', 'new-year': 'Ano Novo' },
    msg: {
      'night-owl': 'Três jogos entre meia-noite e 4h. As corujas te saúdam; amanhã, café duplo.',
      'triple-crown': 'Campeão de copa, campeão do mês e número 1 de um jogo. Poucos chegam aqui em cima.',
      'one-year': 'Um ano jogando com seu nome. Obrigado por ficar: este bolo é seu.',
     
      fiestas: 'Você jogou num 18 de setembro. Viva o Chile! Entre uma empanada e outra, um jogo.',
      halloween: 'Você jogou num 31 de outubro. Doces ou travessuras? Um jogo, claro.',
      xmas: 'Você jogou no Natal. Entre presentes e panetone, ainda achou tempo para um jogo. Ho ho ho!',
      'new-year': 'Você jogou no dia 1º de janeiro. Ano novo, a mesma vontade de jogar.',
    },
  },
};
/** Every secret achievement's metal and emoji (the profile's catalogue, profile/badges.js, says the same). */
export const SECRETS = {
  'night-owl': { tier: 'silver', icon: '🦉' }, 'triple-crown': { tier: 'gold', icon: '💎' }, 'one-year': { tier: 'gold', icon: '🎂' },
  fiestas: { tier: 'bronze', icon: '🪁' }, halloween: { tier: 'bronze', icon: '🎃' }, xmas: { tier: 'bronze', icon: '🎅' }, 'new-year': { tier: 'bronze', icon: '🎆' },
};
const fmt = (s, v) => s.replace(/\{(\w+)\}/g, (m, k) => (k in v ? v[k] : m));
const METAL = { gold: 1, silver: 2, bronze: 3 };

/** The achievement's medal in SVG: the month-end's round metal with its emoji on the face, no ribbon (the owner, 2026-11-22). */
function medal(face) {
  return `<svg class="aw-medalla" viewBox="0 0 120 120" aria-hidden="true">
    <defs><linearGradient id="aw-g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="var(--m1)"/><stop offset=".55" stop-color="var(--m2)"/><stop offset="1" stop-color="var(--m3)"/></linearGradient>
    <clipPath id="aw-c"><circle cx="60" cy="60" r="52"/></clipPath></defs>
    <g class="aw-cara">
      <circle cx="60" cy="60" r="58" fill="var(--m3)"/><circle cx="60" cy="60" r="52" fill="url(#aw-g)"/>
      <circle cx="60" cy="60" r="40" fill="none" stroke="var(--m3)" stroke-width="2" stroke-dasharray="3 4" opacity=".6"/>
      <text class="aw-emoji" x="60" y="77" text-anchor="middle" font-size="50">${face}</text>
      <g clip-path="url(#aw-c)"><rect class="me-brillo" x="30" y="-2" width="22" height="130" fill="#fff" opacity=".45" transform="skewX(-20)"/></g>
      <g class="aw-dorso"><circle cx="60" cy="60" r="58" fill="#2a0a4a"/><circle cx="60" cy="60" r="50" fill="#3d1466" stroke="#ff2e88" stroke-width="3" stroke-dasharray="6 5"/><text x="60" y="80" text-anchor="middle" font-family="Bangers, Impact, sans-serif" font-size="60" fill="#ffd23f">?</text></g>
    </g>
  </svg>`;
}

/**
 * Confetti bursting out of the medal as it turns over (the owner, 2026-11-22: confetti for the reveal, then the
 * fireworks behind): pieces thrown up and out from `x, y`, falling over the card for about two and a half seconds.
 */
function confettiBurst(cv, x, y) {
  if (globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return () => {};
  const ctx = cv.getContext('2d'), dpr = Math.min(globalThis.devicePixelRatio || 1, 2);
  cv.width = innerWidth * dpr; cv.height = innerHeight * dpr;
  ctx.scale(dpr, dpr);
  const cols = ['#ffd23f', '#ff2e88', '#2ee6d6', '#9dff3a', '#8a4dff', '#ff7a1a', '#ffffff'];
  const parts = Array.from({ length: 140 }, () => {
    const a = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI * 1.3, v = 6 + Math.random() * 9;
    return { x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, w: 5 + Math.random() * 6, h: 8 + Math.random() * 8, r: Math.random() * 6, vr: (Math.random() - 0.5) * 0.5, c: cols[Math.random() * cols.length | 0] };
  });
  let stop = false;
  const t0 = performance.now();
  (function frame(t) {
    if (stop || !cv.isConnected) return;
    ctx.clearRect(0, 0, innerWidth, innerHeight);
    const left = 1 - Math.max(0, (t - t0 - 1800) / 800);
    for (const p of parts) {
      p.x += p.vx; p.y += p.vy; p.vy += 0.32; p.vx *= 0.985; p.r += p.vr;
      ctx.save(); ctx.globalAlpha = Math.max(left, 0); ctx.translate(p.x, p.y); ctx.rotate(p.r); ctx.fillStyle = p.c; ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h); ctx.restore();
    }
    if (left > 0) requestAnimationFrame(frame); else ctx.clearRect(0, 0, innerWidth, innerHeight);
  })(t0);
  return () => { stop = true; };
}

/**
 * Opens the window for `badge` (`{ id, tier, icon, name }`). `secret`: `{ n, total }`. Resolves with 'go'
 * or 'close'. `profileHref`: where «Ver mis logros» goes.
 */
export function showAchievement(badge, { lang = 'es', secret = { n: 1, total: 8 }, profileHref = new URL('profile/#badges', ROOT).href, extra = null } = {}) {
  if (document.querySelector('.splash-capa')) return Promise.resolve('close');
  for (const [id, url] of [['month-end-css', new URL('assets/css/month-end.css', ROOT)], ['achievement-css', new URL('assets/css/achievement-window.css', ROOT)]]) {
    if (!document.getElementById(id)) document.head.append(Object.assign(document.createElement('link'), { id, rel: 'stylesheet', href: url.href }));
  }
  const T = TEXTS[lang] || TEXTS.es;
  const layer = document.createElement('div');
  layer.className = `splash-capa me-capa me-p${METAL[badge.tier] || 1} aw-capa`;
  const el = (tag, cls, text) => { const n = document.createElement(tag); n.className = cls; if (text != null) n.textContent = text; return n; };
  const card = el('section', 'me-tarjeta aw-tarjeta');
  card.setAttribute('role', 'dialog');
  card.setAttribute('aria-modal', 'true');
  card.setAttribute('aria-labelledby', 'aw-titulo');
  card.insertAdjacentHTML('beforeend', medal(badge.icon));
  card.append(el('div', 'me-kicker', T.kicker));
  const h = el('h2', 'me-titulo aw-titulo', badge.name);
  h.id = 'aw-titulo';
  card.append(h, el('p', 'me-linea', T.msg[badge.id] || ''));
  const count = el('div', 'aw-cuenta', fmt(T.count, secret));
  const dots = el('div', 'aw-puntos');
  for (let i = 0; i < secret.total; i++) dots.append(el('i', i < secret.n ? (i === secret.n - 1 ? 'on nuevo' : 'on') : ''));
  count.append(dots);
  const go = el('a', 'btn btn--yellow me-jugar', T.go);
  go.href = profileHref;
  const later = el('button', 'me-tabla', T.later);
  later.type = 'button';
  const x = el('button', 'me-x', '✕');
  x.type = 'button';
  x.setAttribute('aria-label', T.close);
  card.append(count, go, later, x);
  layer.append(el('div', 'aw-franjas'), el('canvas', 'me-fuegos'));
  layer.append(card, el('canvas', 'aw-confeti'));
  if (extra) layer.append(extra);
  document.body.append(layer);
  // The medal turns over at 1.55 s: confetti bursts out of it then, and the fireworks follow behind the card
  let stopFire = () => {}, stopConfetti = () => {};
  const t = setTimeout(() => {
    const m = card.querySelector('.aw-medalla')?.getBoundingClientRect();
    if (m) stopConfetti = confettiBurst(layer.querySelector('.aw-confeti'), m.left + m.width / 2, m.top + m.height / 2);
  }, 1550);
  const t2 = setTimeout(() => { stopFire = fireworks(layer.querySelector('.me-fuegos')); }, 2300);
  const prevOverflow = document.body.style.overflow;
  document.body.style.overflow = 'hidden';
  card.tabIndex = -1;
  card.focus({ preventScroll: true });
  return new Promise(res => {
    const close = how => {
      clearTimeout(t); clearTimeout(t2); stopFire(); stopConfetti();
      document.removeEventListener('keydown', onKey);
      layer.classList.add('sale');
      setTimeout(() => { layer.remove(); document.body.style.overflow = prevOverflow; res(how); }, 180);
    };
    const onKey = e => { if (e.key === 'Escape') close('close'); };
    document.addEventListener('keydown', onKey);
    x.addEventListener('click', () => close('close'));
    later.addEventListener('click', () => close('close'));
    go.addEventListener('click', () => res('go'));
  });
}

/**
 * After a game (stats.js' trackFinish, lab flag profile): the first local secret achievement earned and not yet
 * celebrated on this phone opens its window, once. `wait`: a moment for the result screen to draw first.
 */
export async function celebrate({ lang = 'es', wait = 1200, storage = globalThis.localStorage } = {}) {
  const id = dueSecret(readFacts(storage), announced(storage));
  if (!id) return null;
  await new Promise(r => setTimeout(r, wait));
  if (document.querySelector('.splash-capa')) return null;
  markAnnounced(id, storage);
  const T = TEXTS[lang] || TEXTS.es;
  const done = announced(storage);
  showAchievement({ id, ...SECRETS[id], name: T.names[id] }, { lang, secret: { n: Object.keys(SECRETS).filter(k => done[k]).length, total: Object.keys(SECRETS).length } });
  return id;
}
