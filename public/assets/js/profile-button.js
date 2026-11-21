/**
 * The home page's top bar with the profile (lab flag profile, lab: #seccion-profile): 🏅 becomes a pill
 * with the player's flag and name, as a ranking row shows them, and opens /profile/; the sound button
 * leaves the bar (it is in the profile's ⚙️ and in every game). Without a player, «👤 Entrar» opens the
 * same page, which invites to sign in. The streak is not repeated here: Uno al día's card shows it.
 * What it shows is the phone's own: no read waits for the network.
 */
import { leerYo } from './jugador.js';
import { bandera } from './records.js';

/** The button's name, as the profile page's title (profile/texts.js `pageTitle`). */
export const LABEL = { es: 'Tu perfil', en: 'Your profile', pt: 'Seu perfil' };
/** What the pill says with no player on this phone. */
export const GUEST = { es: 'Entrar', en: 'Sign in', pt: 'Entrar' };

export function profileButton({ lang = 'es', doc = document } = {}) {
  const b = doc.getElementById('btn-rankings');
  if (!b) return;
  const yo = leerYo();
  b.href = 'profile/';
  b.hidden = false;
  b.classList.add('pf-home');
  for (const k of ['title', 'aria-label']) b.setAttribute(k, LABEL[lang] || LABEL.es);
  const flag = doc.createElement('span');
  flag.className = 'pf-home-flag';
  flag.setAttribute('aria-hidden', 'true');
  flag.textContent = yo?.n ? bandera(yo.co) || '👤' : '👤';
  const name = doc.createElement('span');
  name.className = 'pf-home-name';
  name.textContent = yo?.n || GUEST[lang] || GUEST.es;
  b.replaceChildren(flag, name);
  doc.getElementById('sound-slot')?.remove();
}
