// The player's profile at /profile/ (lab flag profile): with the flag off the page is Rankings; without a player it
// invites to sign in, shows this phone's badges and the rankings; with one, its card, then 🎖️ badges (earned, locked
// with progress, secret), 🏅 its places in each game it played (a tap opens the game's table) and ⚙️ its settings;
// on the home page 🏅 becomes a pill with the player's flag and name, and the language one flag with a ▾. At 320 and 390 px nothing scrolls sideways and
// every tappable thing is 44 px or more (U-10). Prints ✗ if anything fails.
import { output } from '../output.mjs';
import { launch, sleep } from '../cdp.mjs';

const OUT = output('/tmp/profile-page');
const SITE = process.env.SITE || 'http://localhost:8765';
let failures = 0;
const ok = (cond, msg) => { console.log(`${cond ? '✓' : '✗'} ${msg}`); if (!cond) failures++; };
const full = async (b, name, W) => { const h = await b.evaluate('document.documentElement.scrollHeight'); await b.resize(W, h); await b.shot(name); await b.resize(W, W === 320 ? 640 : 844); };
const small = b => b.evaluate(`[...document.querySelectorAll('main button, main a.btn, main .topbar .back, main details.panel > summary')].filter(x => {
  if (!x.offsetHeight || x.closest('[hidden]')) return false;
  const r = x.getBoundingClientRect(), c = getComputedStyle(x), p = getComputedStyle(x, '::before');
  let h = r.height, w = r.width;
  if (p.content !== 'none' && p.position === 'absolute') {
    h = Math.max(h, r.height - parseFloat(c.borderTopWidth) - parseFloat(c.borderBottomWidth) - parseFloat(p.top) - parseFloat(p.bottom));
    w = Math.max(w, r.width - parseFloat(c.borderLeftWidth) - parseFloat(c.borderRightWidth) - parseFloat(p.left) - parseFloat(p.right));
  }
  return h < 43.5 || w < 43.5;
}).map(x => x.className || x.tagName).join(', ')`);

// The flag off: the page is Rankings
{
  const b = await launch({ dir: `${OUT}/off`, out: OUT, clock: true });
  b.flags({ profile: 'off' });
  await b.go(`${SITE}/profile/?test`, 2500);
  ok(/\/records\/\?test(#|$)/.test(await b.evaluate('location.href')), 'flag off: /profile/ goes to Rankings');
  b.close();
}

for (const W of [320, 390]) {
  const b = await launch({ dir: `${OUT}/p${W}`, out: OUT, width: W, height: W === 320 ? 640 : 844, clock: true });
  b.flags({ profile: 'all' });
  const ev = e => b.evaluate(e);
  // A guest (a clean phone, so the script can run again)
  await b.go(`${SITE}/profile/?test`, 1500);
  await ev('localStorage.clear()');
  await b.go(`${SITE}/profile/?test`, 3000);
  ok(await ev(`!!document.querySelector('#pf-page .rk-invita[open] #rk-entrar')`), `${W}: a guest is invited to sign in, the form open`);
  ok(await ev(`document.querySelectorAll('#pf-page .pf-group .pf-badge').length`) >= 5, `${W}: a guest sees the badges this phone can earn`);
  ok(await ev(`document.querySelectorAll('#pf-page .rk-ranking, #pf-page .rk-lista').length`) >= 2, `${W}: a guest sees the rankings, as on /records/`);
  ok(await ev(`document.documentElement.scrollWidth <= ${W}`), `${W}: guest, no sideways scroll`);
  const s0 = await small(b);
  ok(!s0, `${W}: guest, every tappable thing is 44 px or more${s0 ? ` (${s0})` : ''}`);
  await full(b, `guest-${W}`, W);
  // A player: two rivals, then the player with games, a 14-day streak and four early mornings
  await ev(`(async () => {
    const { jugador } = await import('/assets/js/jugador.js');
    const J = await jugador();
    for (const [n, s] of [['Cata', 95], ['Fran', 70]]) { await J.crear(n, '1111'); for (const g of ['reinas', 'tango']) await J.anotar({ juego: g, s, ms: 50000 }); J.salir(); }
    await J.crear('Javi', '1234');
    for (const [g, k] of Object.entries({ reinas: 6, conexiones: 4, tango: 3, zip: 2, donde: 1, desenredo: 1, pintaminas: 2, agentes: 1 }))
      for (let i = 0; i < k; i++) await J.anotar({ juego: g, s: 60 + i * 5 + (g === 'reinas' ? 40 : 0), ms: 42000 + i * 1000 });
    const dias = {}, t = new Date();
    for (let i = 0; i < 14; i++) { const d = new Date(t.getFullYear(), t.getMonth(), t.getDate() - i); dias[d.toLocaleDateString('en-CA')] = { j: 'reinas', s: 80, ms: 40000, at: d.getTime(), n: 1 }; }
    localStorage.setItem('juegos-de-salon:uno-al-dia', JSON.stringify({ dias }));
    const h = {}; for (let i = 1; i <= 4; i++) h['2026-11-0' + i] = { e: 3 };
    localStorage.setItem('juegos-de-salon:play-hours', JSON.stringify(h));
  })()`);
  await b.go(`${SITE}/profile/?test`, 4000);
  ok(await ev(`document.querySelector('.pf-player')?.textContent.includes('Javi')`), `${W}: the card names the player`);
  ok(await ev(`document.querySelector('.pf-avatar')?.textContent`) === 'J', `${W}: the card shows the player's initial`);
  ok(/14/.test(await ev(`document.querySelector('.pf-stat b')?.textContent`)), `${W}: the card shows the 14-day streak`);
  ok(await ev(`!!document.querySelector('[data-badge="streak-10"]:not(.pf-badge--locked)')`), `${W}: 🔥 10 in a row is earned`);
  ok(/14 \/ 30/.test(await ev(`document.querySelector('[data-badge="streak-30"]')?.textContent`)), `${W}: 🔥 30 in a row shows its progress, 14 / 30`);
  ok(/4 \/ 7/.test(await ev(`document.querySelector('[data-badge="early-bird"]')?.textContent`)), `${W}: 🌅 the early bird counts the mornings, 4 / 7`);
  ok(await ev(`!!document.querySelector('[data-badge="number-one"]:not(.pf-badge--locked) .pf-new')`), `${W}: 🥇 number 1 is earned and new`);
  ok(await ev(`[...document.querySelectorAll('[data-badge="night-owl"] .pf-name')].map(x => x.textContent).join()`) !== 'Noctámbulo', `${W}: a secret badge keeps its name until earned`);
  ok(await ev(`document.documentElement.scrollWidth <= ${W}`), `${W}: badges, no sideways scroll`);
  await full(b, `badges-${W}`, W);
  await ev(`document.querySelector('[data-tab=rankings]').click()`); await sleep(2500);
  ok(await ev(`document.querySelectorAll('.pf-game').length`) === 8, `${W}: 🏅 lists the eight games the player played`);
  ok(await ev(`document.querySelector('.pf-game[data-game="reinas"] .pf-game-place')?.textContent.startsWith('1')`), `${W}: 🏅 Reinas shows the player's first place`);
  ok(await ev(`document.querySelectorAll('.pf-game:not([hidden])').length`) === 6, `${W}: 🏅 six games show, the rest behind «Ver más»`);
  await ev(`document.querySelector('.pf-game[data-game="tango"]').click()`); await sleep(1500);
  ok(await ev(`!!document.querySelector('.pf-game[data-game="tango"] + .pf-game-table .rk-fila.yo')`), `${W}: a tap on Tango opens its table with the player's row`);
  ok(await ev(`document.documentElement.scrollWidth <= ${W}`), `${W}: rankings, no sideways scroll`);
  const s1 = await small(b);
  ok(!s1, `${W}: rankings, every tappable thing is 44 px or more${s1 ? ` (${s1})` : ''}`);
  await full(b, `rankings-${W}`, W);
  await ev(`document.querySelector('[data-tab=settings]').click()`); await sleep(800);
  ok(await ev(`!!document.querySelector('.pf-settings .lang-toggle') && !!document.querySelector('.pf-settings .sound-toggle') && !!document.querySelector('#rk-cambiar-pin')`), `${W}: ⚙️ has the language, the sound and the PIN change`);
  ok(await ev(`!document.querySelector('#pf-page .offline-ready')`), `${W}: ⚙️ has no offline ☁️: it stays on the home page`);
  ok(await ev(`document.documentElement.scrollWidth <= ${W}`), `${W}: settings, no sideways scroll`);
  const s2 = await small(b);
  ok(!s2, `${W}: settings, every tappable thing is 44 px or more${s2 ? ` (${s2})` : ''}`);
  await full(b, `settings-${W}`, W);
  // The home page's top bar
  await b.go(`${SITE}/?test`, 3000);
  ok(await ev(`(() => { const a = document.getElementById('btn-rankings'); return a.classList.contains('pf-home') && a.getAttribute('href') === 'profile/' && a.querySelector('.pf-home-name')?.textContent === 'Javi' && !!a.querySelector('.pf-home-flag')?.textContent && !a.textContent.includes('🔥'); })()`), `${W}: on the home page 🏅 is a pill with the player's flag and name, no streak (Uno al día's card has it), to /profile/`);
  ok(await ev(`!!document.querySelector('#offline-ready-slot')`), `${W}: offline mode's ☁️ stays on the home page`);
  ok(await ev(`(() => { const a = document.getElementById('btn-rankings'), t = document.querySelector('.portada-barra .tools'); return a.getBoundingClientRect().right <= t.getBoundingClientRect().right + 1 && a.scrollWidth <= a.clientWidth + 1; })()`), `${W}: the name pill fits the bar`);
  ok(await ev(`!document.getElementById('sound-slot')`), `${W}: the sound button left the home page's bar`);
  ok(await ev(`(() => { const l = document.querySelector('#lang-slot .pf-lang'); return !!l && !document.querySelector('#lang-slot > .lang-toggle') && l.querySelector('.icon-btn').textContent.includes('▾'); })()`), `${W}: the home page's language is one flag with a ▾`);
  await b.shot(`home-${W}`);
  await ev(`document.querySelector('.pf-lang .icon-btn').click()`); await sleep(300);
  ok(await ev(`(() => { const p = document.querySelector('.pf-lang .lang-pop'); if (!p || p.hidden) return false; const r = p.getBoundingClientRect(); return p.querySelectorAll('button').length === 3 && r.left >= 0 && r.right <= ${W}; })()`), `${W}: its ▾ opens the three languages, inside the screen`);
  await b.shot(`home-lang-${W}`);
  ok(await ev(`document.documentElement.scrollWidth <= ${W}`), `${W}: home, no sideways scroll`);
  b.close();
}
console.log(failures ? `✗ profile page: ${failures} failure(s)` : '✓ profile page');
process.exit(failures ? 1 : 0);
