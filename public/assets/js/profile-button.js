/**
 * The home page's top bar with the profile (lab flag profile, lab: #seccion-profile): 🏅 becomes the
 * player's initial and their Uno al día streak, and opens /profile/; the sound button leaves the bar
 * (it is in the profile's ⚙️ and in every game). Without a player, a 👤 opens the same page, which
 * invites to sign in. What it shows is the phone's own: no read waits for the network.
 */
import { leerYo } from './jugador.js';
import { estado } from './uno-al-dia.js';

/** The button's name, as the profile page's title (profile/texts.js `pageTitle`). */
export const LABEL = { es: 'Tu perfil', en: 'Your profile', pt: 'Seu perfil' };

export function profileButton({ lang = 'es', doc = document } = {}) {
  const b = doc.getElementById('btn-rankings');
  if (!b) return;
  const yo = leerYo();
  let streak = 0;
  try { streak = estado().racha || 0; } catch (_) { streak = 0; }
  b.href = 'profile/';
  b.hidden = false;
  b.classList.add('pf-home');
  for (const k of ['title', 'aria-label']) b.setAttribute(k, LABEL[lang] || LABEL.es);
  const face = doc.createElement('span');
  face.className = 'pf-home-face';
  face.textContent = yo?.n ? yo.n.trim().charAt(0).toUpperCase() : '👤';
  b.replaceChildren(face);
  if (streak > 0) { const s = doc.createElement('b'); s.className = 'pf-home-streak'; s.textContent = `🔥${streak}`; b.append(s); }
  doc.getElementById('sound-slot')?.remove();
}
