// The player's profile at /profile/ (lab flag profile): with the flag off the page is Rankings; without a player it
// invites to sign in, shows this phone's badges and the rankings; with one, its card, then 🎖️ badges (earned, locked
// with progress, secret), 🏅 its places in each game it played (a tap opens the game's table) and ⚙️ its settings;
// on the home page 🏅 becomes a pill with the player's flag and name, and the language one flag with a ▾; every other page's
// top bar (a game's cover, Uno al día, Rankings) ends in the same pill and its cover drops «🏅 <name>»; ⚙️ changes the name and
// the PIN (each with the PIN) and signs out. At 320 and 390 px nothing scrolls sideways and
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
    localStorage.setItem('juegos-de-salon:play-run', JSON.stringify({ g: 'queens', n: 3, best: 10 }));
    localStorage.setItem('juegos-de-salon:logros-anunciados', JSON.stringify({ xmas: 1 }));
    localStorage.setItem('juegos-de-salon:play-marks', JSON.stringify({ days: { xmas: true, halloween: true }, wk: ['2025-01-04', '2025-01-11', '2025-01-18'], mon: ['2025-01-06'], played: ['2025-01-01', '2025-01-02'] }));
  })()`);
  await b.go(`${SITE}/profile/?test`, 4000);
  // 🎃 earned and not yet told: its window opens once, like One a Day's month-end one, with «Ver mis logros» (the owner, 2026-11-22)
  ok(await ev(`(() => { const w = document.querySelector('.aw-capa'); return !!w && w.querySelector('.aw-titulo')?.textContent === 'Noche de brujas' && !w.querySelector('path') && /logros secretos/.test(w.textContent) && !/chapita/i.test(w.textContent) && !!w.querySelector('a.btn'); })()`), `${W}: 🎃 a secret achievement just earned opens its window: a round medal, no ribbon, «Ver mis logros»`);
  ok(await ev(`(() => { const c = document.querySelector('.aw-capa .me-tarjeta')?.getBoundingClientRect(), m = document.querySelector('.aw-medalla')?.getBoundingClientRect(); return !!c && c.left >= 0 && c.right <= ${W} && m.top >= 0 && document.documentElement.scrollWidth <= ${W}; })()`), `${W}: 🎃 its window fits the screen`);
  ok(await ev(`!!document.querySelector('.aw-capa .aw-franjas') && !!document.querySelector('.aw-medalla .aw-dorso')`), `${W}: 🎃 its medal first shows «?» over diagonal stripes, then turns over (look B)`);
  await sleep(2200);
  ok(await ev(`getComputedStyle(document.querySelector('.aw-dorso')).opacity === '0'`), `${W}: 🎃 the medal turned over: the achievement shows`);
  ok(await ev(`(() => { const c = document.querySelector('.aw-capa .aw-confeti'); return !!c && c.width > 0 && getComputedStyle(c).pointerEvents === 'none'; })()`), `${W}: 🎃 confetti bursts out of the medal as it turns over, the fireworks behind`);
  await b.shot(`achievement-${W}`);
  await ev(`document.querySelector('.aw-capa .me-x').click()`); await sleep(400);
  ok(await ev(`!document.querySelector('.aw-capa') && !!JSON.parse(localStorage.getItem('juegos-de-salon:logros-anunciados') || '{}').halloween`), `${W}: 🎃 told once: the phone remembers it`);
  ok(await ev(`document.querySelector('.pf-player')?.textContent.includes('Javi')`), `${W}: the card names the player`);
  ok(await ev(`!document.querySelector('.pf-avatar') && !!document.querySelector('.pf-card .pf-player .rk-flag, .pf-card .pf-player')`), `${W}: the card is the player's flag and name, no initial in a circle`);
  ok(/14/.test(await ev(`document.querySelector('.pf-stat b')?.textContent`)), `${W}: the card shows the 14-day streak`);
  ok(await ev(`!!document.querySelector('[data-badge="streak-10"]:not(.pf-badge--locked)')`), `${W}: 🔥 10 in a row is earned`);
  ok(/14 \/ 30/.test(await ev(`document.querySelector('[data-badge="streak-30"]')?.textContent`)), `${W}: 🔥 30 in a row shows its progress, 14 / 30`);
  ok(/4 \/ 7/.test(await ev(`document.querySelector('[data-badge="early-bird"]')?.textContent`)), `${W}: 🌅 the early bird counts the mornings, 4 / 7`);
  ok(await ev(`document.querySelector('[data-badge="obsession"]')?.classList.contains('pf-badge--silver')`), `${W}: 😬 Se llama obsesión is earned with one game 10 times in a row`);
  ok(await ev(`!document.querySelector('[data-badge="weekends"]')?.classList.contains('pf-badge--locked')`), `${W}: 🛋️ Finde a tope joins Uno al día's weekends and the phone's`);
  ok(/1[67] \/ 100/.test(await ev(`document.querySelector('[data-badge="regular"]')?.textContent`)), `${W}: 🏠 De la casa counts Uno al día's days and the phone's, 16 / 100`);
  ok(/1 \/ 4/.test(await ev(`document.querySelector('[data-badge="mondays"]')?.textContent`)), `${W}: ☕ Odio los lunes counts the Mondays, 1 / 4`);
  ok(/Viejito Pascuero/.test(await ev(`document.querySelector('[data-badge="xmas"]')?.textContent`)), `${W}: 🎅 the secret Christmas badge shows its name once earned`);
  ok(await ev(`!!document.querySelector('[data-badge="new-year"].pf-badge--locked, [data-badge="new-year"]:not(:has(.pf-name))') || !/Año nuevo/.test(document.querySelector('[data-badge="new-year"]')?.textContent || '')`), `${W}: 🎆 New Year stays secret until earned`);
  const spill = await ev(`[...document.querySelectorAll('.pf-badge')].filter(x => { const n = x.querySelector('.pf-name'), r = n.getBoundingClientRect(), c = x.getBoundingClientRect(); return n.scrollWidth > n.clientWidth + 1 || r.left < c.left - 0.5 || r.right > c.right + 0.5; }).map(x => x.dataset.badge).join(', ')`);
  ok(!spill, `${W}: every badge's name fits inside its card${spill ? ` (${spill})` : ''}`);
  ok(await ev(`!!document.querySelector('[data-badge="number-one"]:not(.pf-badge--locked) .pf-new')`), `${W}: 🥇 number 1 is earned and new`);
  ok(await ev(`[...document.querySelectorAll('[data-badge="night-owl"] .pf-name')].map(x => x.textContent).join()`) !== 'Noctámbulo', `${W}: a secret badge keeps its name until earned`);
  ok(await ev(`document.documentElement.scrollWidth <= ${W}`), `${W}: badges, no sideways scroll`);
  await full(b, `badges-${W}`, W);
  // Scrolled, the section bar stays on top and stands apart from the badges under it (the owner, 2026-11-22)
  await ev(`scrollTo(0, 900)`); await sleep(400);
  ok(await ev(`(() => { const t = document.querySelector('.pf-tabs'), r = t.getBoundingClientRect(), c = getComputedStyle(t), a = Number((c.backgroundColor.match(/[\\d.]+(?=\\)$)/) || [1])[0]); return r.top >= 0 && r.top < 20 && (c.backgroundColor.startsWith('rgb(') || a >= 0.9) && parseFloat(c.borderTopWidth) >= 1; })()`), `${W}: scrolled, the section bar stays on top, nearly opaque and edged`);
  await b.shot(`badges-scrolled-${W}`);
  await ev(`scrollTo(0, 0)`);
  await ev(`document.querySelector('[data-tab=rankings]').click()`); await sleep(2500);
  ok(await ev(`document.querySelectorAll('.pf-game').length`) === 8, `${W}: 🏅 lists the eight games the player played`);
  ok(await ev(`document.querySelector('.pf-game[data-game="reinas"] .pf-game-place')?.textContent.startsWith('1')`), `${W}: 🏅 Reinas shows the player's first place`);
  ok(await ev(`[...document.querySelectorAll('.pf-places .pf-place')].slice(0, 2).every(x => /pf-place--/.test(x.className) && x.querySelector('i').textContent && /^(1|2|3)/.test(x.querySelector('b').textContent) === /gold|silver|bronze/.test(x.className))`), `${W}: 🏅 the overall places wear their medal and metal`);
  ok(await ev(`document.querySelectorAll('.pf-game:not([hidden])').length`) === 6, `${W}: 🏅 six games show, the rest behind «Ver más»`);
  await ev(`document.querySelector('.pf-game[data-game="tango"]').click()`); await sleep(1500);
  ok(await ev(`!!document.querySelector('.pf-game[data-game="tango"] + .pf-game-table .rk-fila.yo')`), `${W}: a tap on Tango opens its table with the player's row`);
  ok(await ev(`document.documentElement.scrollWidth <= ${W}`), `${W}: rankings, no sideways scroll`);
  const s1 = await small(b);
  ok(!s1, `${W}: rankings, every tappable thing is 44 px or more${s1 ? ` (${s1})` : ''}`);
  await full(b, `rankings-${W}`, W);
  // A tap on a rival's name opens their profile at a glance (the owner, 2026-11-22)
  ok(await ev(`(() => { const r = [...document.querySelectorAll('.pf-tab .rk-fila[data-peek]')].find(x => x.textContent.includes('Cata')); if (!r) return false; r.scrollIntoView({ block: 'center' }); r.click(); return r.getAttribute('role') === 'button'; })()`), `${W}: 👀 a rival's name in a ranking is a button`);
  await sleep(1500);
  ok(await ev(`(() => { const p = document.getElementById('pf-peek'); return !!p && p.querySelector('.pf-peek-name')?.textContent.includes('Cata') && !p.querySelector('.pf-peek-kicker') && p.querySelectorAll('.pf-peek-stats .pf-stat').length === 3 && [...p.querySelectorAll('.pf-peek-games li')].map(x => x.dataset.game).sort().join() === 'reinas,tango' && /1 partida(?!s)/.test(p.textContent); })()`), `${W}: 👀 their sheet shows their name, three figures and their most played games`);
  ok(await ev(`(() => { const p = document.getElementById('pf-peek').getBoundingClientRect(); return p.left >= 0 && p.right <= ${W} && p.top >= 0 && document.documentElement.scrollWidth <= ${W}; })()`), `${W}: 👀 the sheet fits the screen`);
  const sp = await small(b);
  ok(!sp, `${W}: 👀 the sheet, every tappable thing is 44 px or more${sp ? ` (${sp})` : ''}`);
  await b.shot(`peek-${W}`);
  await ev(`document.querySelector('#pf-peek .hoja-cabeza .icon-btn').click()`); await sleep(300);
  ok(await ev(`!document.getElementById('pf-peek') && !document.body.style.position`), `${W}: 👀 ✕ closes it and frees the page`);
  await ev(`(() => { const r = document.querySelector('.pf-tab .rk-fila.yo[data-peek]'); r.scrollIntoView({ block: 'center' }); r.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true })); })()`); await sleep(1500);
  ok(await ev(`(() => { const p = document.getElementById('pf-peek'); return !!p && /Así te ven los demás/.test(p.querySelector('.pf-peek-kicker')?.textContent || '') && p.querySelector('.pf-peek-name').textContent.includes('Javi') && p.querySelectorAll('.pf-peek-badges li').length > 0; })()`), `${W}: 👀 your own name (Enter works too) shows how others see you, with your achievements`);
  await b.shot(`peek-you-${W}`);
  await ev(`document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))`); await sleep(300);
  ok(await ev(`!document.getElementById('pf-peek')`), `${W}: 👀 Escape closes it`);
  await ev(`document.querySelector('[data-tab=settings]').click()`); await sleep(800);
  ok(await ev(`!!document.querySelector('.pf-settings .lang-toggle') && !!document.querySelector('.pf-settings .sound-toggle') && !!document.querySelector('#pf-account') && !document.querySelector('.pf-tab .rk-yo')`), `${W}: ⚙️ has your account, the language and the sound`);
  ok(await ev(`!document.querySelector('#pf-page .offline-ready')`), `${W}: ⚙️ has no offline ☁️: it stays on the home page`);
  ok(await ev(`document.documentElement.scrollWidth <= ${W}`), `${W}: settings, no sideways scroll`);
  const s2 = await small(b);
  ok(!s2, `${W}: settings, every tappable thing is 44 px or more${s2 ? ` (${s2})` : ''}`);
  await full(b, `settings-${W}`, W);
  // The home page's top bar
  await b.go(`${SITE}/?test`, 3000);
  ok(await ev(`(() => { const a = document.getElementById('btn-rankings'); return a.classList.contains('pf-home') && a.getAttribute('href') === 'profile/' && a.querySelector('.pf-home-name')?.textContent === 'Javi' && !!a.querySelector('.pf-home-flag')?.textContent && a.querySelector('.pf-home-go')?.textContent === '›' && !a.textContent.includes('🔥'); })()`), `${W}: on the home page 🏅 is a pill with the player's flag, name and ›, no streak (Uno al día's card has it), to /profile/`);
  ok(await ev(`!!document.querySelector('#offline-ready-slot')`), `${W}: offline mode's ☁️ stays on the home page`);
  ok(await ev(`(() => { const a = document.getElementById('btn-rankings'), t = document.querySelector('.portada-barra .tools'); return a.getBoundingClientRect().right <= t.getBoundingClientRect().right + 1 && a.scrollWidth <= a.clientWidth + 1; })()`), `${W}: the name pill fits the bar`);
  ok(await ev(`!document.getElementById('sound-slot')`), `${W}: the sound button left the home page's bar`);
  ok(await ev(`(() => { const t = [...document.querySelectorAll('.portada-barra .tools > *')].filter(x => x.offsetParent || x.id === 'share-slot'); const i = id => t.findIndex(x => x.id === id); return i('share-slot') < i('offline-ready-slot') && t[t.length - 1]?.id === 'btn-rankings'; })()`), `${W}: the home page's bar has the covers' order: share, then ☁️, the pill last`);
  ok(await ev(`(() => { const l = document.querySelector('#lang-slot .pf-lang'); return !!l && !document.querySelector('#lang-slot > .lang-toggle') && l.querySelector('.icon-btn').textContent.includes('▾'); })()`), `${W}: the home page's language is one flag with a ▾`);
  await b.shot(`home-${W}`);
  await ev(`document.querySelector('.pf-lang .icon-btn').click()`); await sleep(300);
  ok(await ev(`(() => { const p = document.querySelector('.pf-lang .lang-pop'); if (!p || p.hidden) return false; const r = p.getBoundingClientRect(); return p.querySelectorAll('button').length === 3 && r.left >= 0 && r.right <= ${W}; })()`), `${W}: its ▾ opens the three languages, inside the screen`);
  await b.shot(`home-lang-${W}`);
  ok(await ev(`document.documentElement.scrollWidth <= ${W}`), `${W}: home, no sideways scroll`);
  // Every other page's top bar: a game's cover, Uno al día, Rankings
  for (const page of ['queens', 'today', 'records']) {
    await b.go(`${SITE}/${page}/?test`, 3000);
    ok(await ev(`(() => { const t = document.querySelector('.topbar .tools'), a = t?.querySelector('.pf-home'); if (!a || t.lastElementChild !== a || !/\\/profile\\/$/.test(a.getAttribute('href'))) return false; const r = a.getBoundingClientRect(), tr = document.querySelector('.topbar').getBoundingClientRect(); return r.right <= tr.right + 1 && r.height >= 43.5 && r.width >= 43.5 && Math.abs(r.top - t.getBoundingClientRect().top) < 2; })()`), `${W}: /${page}/ ends its top bar with the profile's pill, on the same row, 44 px or more`);
    ok(await ev(`${W} >= 375 ? document.querySelector('.topbar .pf-home-name')?.textContent === 'Javi' : getComputedStyle(document.querySelector('.topbar .pf-home-icon')).display !== 'none' && getComputedStyle(document.querySelector('.topbar .pf-home-name')).display === 'none'`), `${W}: /${page}/'s pill shows ${W >= 375 ? 'the name' : '👤, no initial'}`);
    ok(await ev(`(() => { const l = document.querySelectorAll('.topbar .lang-btn'); return l.length === 1 && l[0].classList.contains('pf-lang') && !document.querySelector('.topbar .lang-toggle:not(.lang-pop .lang-toggle)'); })()`), `${W}: /${page}/'s language is one flag button`);
    await ev(`document.querySelector('.topbar .pf-lang .icon-btn').click()`); await sleep(300);
    ok(await ev(`(() => { const p = document.querySelector('.topbar .lang-pop'); if (!p || p.hidden) return false; const r = p.getBoundingClientRect(); return r.left >= 0 && r.right <= ${W}; })()`), `${W}: /${page}/'s language opens inside the screen`);
    await ev(`document.body.click()`);
    ok(await ev(`document.documentElement.scrollWidth <= ${W}`), `${W}: /${page}/, no sideways scroll`);
    await b.shot(`${page}-${W}`);
  }
  await b.go(`${SITE}/queens/?test`, 3000);
  // Signed out elsewhere, a page brought back with ‹ (the browser's back-forward cache) says «Entrar» (the owner, 2026-11-22)
  ok(await ev(`(async () => { const k = 'juegos-de-salon:jugador', v = localStorage.getItem(k); localStorage.removeItem(k); dispatchEvent(new PageTransitionEvent('pageshow', { persisted: true })); await new Promise(r => setTimeout(r, 100)); const ok = document.querySelector('.topbar .pf-home-name')?.textContent === 'Entrar' && !document.documentElement.classList.contains('pf-signed'); localStorage.setItem(k, v); dispatchEvent(new PageTransitionEvent('pageshow', { persisted: true })); await new Promise(r => setTimeout(r, 100)); return ok && document.querySelector('.topbar .pf-home-name')?.textContent === 'Javi'; })()`), `${W}: a page brought back after signing out says «Entrar», and the name once signed in again`);
  ok(await ev(`!document.getElementById('btn-cuenta')?.offsetParent && !document.querySelector('main .rk-yo')?.offsetParent`), `${W}: a signed-in player's cover has no «🏅 <name>» button: the PIN is in the profile`);
  // 👤 Your account (D-600): change the name and the PIN with the PIN, then sign out
  await b.go(`${SITE}/profile/?test#settings`, 3000);
  const fill = (id, v) => ev(`(() => { const i = document.getElementById('${id}'); i.value = '${v}'; i.dispatchEvent(new Event('input')); })()`);
  const rows = () => ev(`[...document.querySelectorAll('#pf-account .pf-change')].length`);
  ok(await rows() === 2, `${W}: 👤 the name and the PIN each have «Cambiar»`);
  await ev(`document.querySelectorAll('#pf-account .pf-change')[0].click()`); await sleep(200);
  ok(await ev(`!document.querySelector('#pf-account .pf-form').hidden && document.activeElement?.id === 'pf-new-name'`), `${W}: «Cambiar» opens the name's form`);
  await full(b, `account-name-${W}`, W);
  const s3 = await small(b);
  ok(!s3, `${W}: account, every tappable thing is 44 px or more${s3 ? ` (${s3})` : ''}`);
  await fill('pf-new-name', 'Javiera'); await fill('pf-name-pin', '9999');
  await ev(`document.getElementById('pf-save-name').click()`); await sleep(1500);
  ok(await ev(`document.querySelector('#pf-account .rk-error')?.textContent.length > 0 && document.querySelector('.pf-player').textContent.includes('Javi') && !document.querySelector('.pf-player').textContent.includes('Javiera')`), `${W}: a wrong PIN renames nothing and says so`);
  await sleep(5600);
  await fill('pf-name-pin', '1234');
  await ev(`document.getElementById('pf-save-name').click()`); await sleep(2500);
  ok(await ev(`document.querySelector('.pf-player')?.textContent.includes('Javiera') && /Javiera/.test(document.getElementById('pf-renamed')?.textContent || '')`), `${W}: the PIN renames: the card shows the new name and says so`);
  await sleep(5600);
  await ev(`document.querySelectorAll('#pf-account .pf-change')[1].click()`); await sleep(200);
  await fill('pf-pin-current', '1234'); await fill('pf-pin-new', '4321');
  await ev(`document.getElementById('pf-save-pin').click()`); await sleep(2500);
  ok(await ev(`document.querySelectorAll('#pf-account .pf-form')[1].querySelector('.rk-ok')?.textContent.length > 0`), `${W}: the current PIN changes the PIN`);
  await ev(`document.getElementById('pf-logout').click()`); await sleep(200);
  ok(await ev(`!document.querySelector('.pf-logout-ask').hidden`), `${W}: «Salir de tu cuenta» asks once`);
  await b.shot(`account-logout-${W}`);
  await ev(`document.getElementById('pf-logout-yes').click()`); await sleep(1500);
  ok(await ev(`!localStorage.getItem('juegos-de-salon:jugador') && !document.getElementById('pf-account') && !!document.querySelector('#rk-entrar')`), `${W}: signing out leaves the page as a guest's, which invites to sign in`);
  await sleep(5600);
  await ev(`(async () => { const { jugador } = await import('/assets/js/jugador.js'); window.__r = (await (await jugador()).entrar('Javiera', '4321')).estado; })()`); await sleep(1500);
  ok(await ev(`window.__r === 'dentro'`), `${W}: the new name and the new PIN sign in again`);
  b.close();
}
console.log(failures ? `✗ profile page: ${failures} failure(s)` : '✓ profile page');
process.exit(failures ? 1 : 0);
