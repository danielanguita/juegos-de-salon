/**
 * The profile's welcome (lab flag `profile`; the owner, 2026-11-22): a small bubble rises from the top bar's
 * profile pill and says the player's things now live there. It stays, on every page with the pill, until the
 * player closes it or opens the profile; then it never comes back. The profile page itself greets the first
 * visit with its own card (profile.js `introCard`).
 *
 * `?profile-intro=demo` forgets both, to show them again.
 */
import { el } from './ui.js';
import { getLang } from './i18n.js';

export const BUBBLE_KEY = 'juegos-de-salon:profile-bubble';
export const INTRO_KEY = 'juegos-de-salon:profile-intro';

export const TEXTS = {
  es: { title: '🎖️ Tu perfil vive aquí', text: 'Tus logros, tus rankings y tus ajustes, en un solo lugar.', close: 'Cerrar' },
  en: { title: '🎖️ Your profile lives here', text: 'Your badges, your rankings and your settings, all in one place.', close: 'Close' },
  pt: { title: '🎖️ Seu perfil mora aqui', text: 'Suas conquistas, seus rankings e seus ajustes, em um só lugar.', close: 'Fechar' },
};

const ROOT = new URL('../../', import.meta.url);
const get = k => { try { return localStorage.getItem(k); } catch (_) { return '1'; } };
export const mark = k => { try { localStorage.setItem(k, String(Date.now())); } catch (_) { /* not kept */ } };

/** `?profile-intro=demo`: the bubble and the profile's card show again, as on a first visit. */
export function demoReset(loc = globalThis.location) {
  if (!/[?&]profile-intro=demo\b/.test(loc?.search || '')) return false;
  try { localStorage.removeItem(BUBBLE_KEY); localStorage.removeItem(INTRO_KEY); } catch (_) { /* nothing kept */ }
  return true;
}

/**
 * Shows the bubble under `pill` (an `a.pf-home`), once nothing else covers the page (a splash, a sheet).
 * Returns a function that removes it.
 */
export function pillBubble(pill, { doc = document, lang = getLang(), tries = 6 } = {}) {
  if (!pill || get(BUBBLE_KEY) || doc.getElementById('pf-bubble')) return () => {};
  const busy = () => doc.querySelector('.splash-capa, .hoja-capa, .globo-instalar, #pf-bubble');
  if (busy()) {
    if (tries > 0) setTimeout(() => pillBubble(pill, { doc, lang, tries: tries - 1 }), 2500);
    return () => {};
  }
  if (!doc.getElementById('pf-bubble-css')) doc.head.append(el('link', { rel: 'stylesheet', id: 'pf-bubble-css', href: new URL('assets/css/profile-hint.css', ROOT).href }));
  const T = TEXTS[lang] || TEXTS.es;
  let box = null;
  const place = () => {
    if (!box || !pill.isConnected) return;
    const r = pill.getBoundingClientRect(), w = doc.documentElement.clientWidth;
    const right = Math.max(8, w - r.right);
    box.style.top = `${r.bottom + (doc.defaultView?.scrollY || 0) + 12}px`;
    box.style.right = `${right}px`;
    // The tail points at the pill's middle, whatever the pill's width
    box.style.setProperty('--tail', `${Math.max(16, w - right - (r.left + r.width / 2) - 8)}px`);
  };
  const close = () => {
    if (!box) return;
    mark(BUBBLE_KEY);
    const b = box; box = null;
    b.classList.add('fuera');
    setTimeout(() => b.remove(), 250);
    doc.defaultView?.removeEventListener('resize', place);
  };
  box = el('div', { class: 'pf-bubble', id: 'pf-bubble', role: 'status' },
    el('a', { class: 'pf-bubble-txt', href: pill.href, onClick: () => mark(BUBBLE_KEY) }, el('b', {}, T.title), el('span', {}, T.text)),
    el('button', { type: 'button', class: 'pf-bubble-x', 'aria-label': T.close, title: T.close, onClick: close }, '✕'));
  doc.body.append(box);
  place();
  doc.defaultView?.addEventListener('resize', place);
  pill.addEventListener('click', () => mark(BUBBLE_KEY), { once: true });
  return close;
}
