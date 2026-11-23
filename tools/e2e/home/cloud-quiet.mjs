// The quiet cloud (flag cloud-quiet, offline-ready.js): on the home page's bar the ☁️ shows only while it asks for
// something (storing, files missing) and its slot closes up when it hides; the profile's ⚙️ always has a «Juegos sin
// señal» row with the state, which opens the same sheet. Every state is pretended from the «T» tab's cloud states, which
// go with the flag's own row while it is in the lab (D-592). With the flag off, the bar keeps the cloud in every state
// and ⚙️ has no row (checked at 390 only). The home page is the owner's: the icon view and the profile's pill.
// At 390 and 320 px; each shot measures margins, overlaps and spacing by itself (D-570). Prints ✗ if something fails.
import { output } from '../output.mjs';
import { launch, sleep } from '../cdp.mjs';
const OUT = output('/tmp/home-cloud-quiet');
const SITE = process.env.SITE || 'http://localhost:8765';
let failures = 0;
const ok = (cond, msg) => { console.log(`${cond ? '✓' : '✗'} ${msg}`); if (!cond) failures++; };
const HOME = `${SITE}/?test&lang=es`, PROFILE = `${SITE}/profile/?test&lang=es`;
const cloud = `(() => { const c = document.querySelector('#offline-ready-slot .offline-ready'); return !!c && !c.hidden && c.offsetWidth > 0; })()`;
const cloudIs = state => `${cloud} && document.querySelector('#offline-ready-slot .offline-ready').dataset.state === '${state}'`;
const slotGone = `getComputedStyle(document.getElementById('offline-ready-slot')).display === 'none'`;
const TITLES = { ready: 'Listo para jugar sin señal', missing: 'Faltan algunos juegos', unsupported: 'Este navegador no guarda juegos', loading: 'Preparando los juegos' };

for (const width of [390, 320]) {
  const b = await launch({ dir: `${OUT}/p${width}`, out: OUT, width, height: width === 390 ? 844 : 640, clock: true });
  const ev = e => b.evaluate(e);
  const waitFor = async (expr, ms = 8000) => { for (let t = 0; t < ms; t += 100) { if (await ev(expr)) return true; await sleep(100); } return false; };
  const fold = () => ev(`document.getElementById('tester-ribbon')?.classList.contains('abierto') && document.getElementById('tr-tab').click()`);
  // A state from the T tab: open it, tap the state's button, fold it again
  const pretend = async state => {
    await ev(`document.getElementById('tr-tab').click()`);
    const there = await waitFor(`!!document.querySelector('#tr-offline-ready [data-state="${state}"]')?.offsetHeight`);
    await ev(`document.querySelector('#tr-offline-ready [data-state="${state}"]')?.click()`);
    await fold();
    return there;
  };
  const flags = state => b.flags({ profile: 'all', 'home-carousels': 'all', 'cloud-quiet': state });
  await b.open(HOME);
  await ev(`localStorage.clear(); localStorage.setItem('juegos-de-salon:offline-ready-last', JSON.stringify({ state: 'ready', have: 3, total: 3 }))`);

  // Flag off: the bar keeps the cloud even when ready, as today
  if (width === 390) {
    flags('off');
    await ev(`localStorage.setItem('juegos-de-salon:flags-pinned', JSON.stringify({ 'offline-mode': true }))`);
    await b.open(HOME);
    ok(await waitFor(cloud), `${width}: flag off: the ☁️ is on the bar`);
    ok(await pretend('ready') && await waitFor(cloudIs('ready')), `${width}: flag off: ready, the ☁️ stays on the bar (as today)`);
  }

  // Flag in the lab, its row pinned: the cloud states go with it
  flags('lab');
  await ev(`localStorage.setItem('juegos-de-salon:flags-pinned', JSON.stringify({ 'cloud-quiet': true }))`);
  await b.open(HOME);
  ok(await waitFor(`document.documentElement.classList.contains('cloud-quiet')`), `${width}: flag on: the page knows the cloud is quiet`);
  ok(await waitFor(`!${cloud} && ${slotGone}`), `${width}: last state ready: no ☁️ on the bar from the start, its slot takes no room`);
  await b.shot(`${width}-1-home-ready`);
  await ev(`document.getElementById('tr-tab').click()`);
  ok(await waitFor(`!!document.getElementById('tr-offline-ready')?.offsetHeight && !!document.querySelector('#tr-flags [data-row="cloud-quiet"]')?.offsetHeight`), `${width}: the T tab shows the flag's row and the four cloud states with it`);
  await b.shot(`${width}-2-tester-tab`);
  await fold();

  ok(await pretend('missing') && await waitFor(cloudIs('missing')), `${width}: missing: the amber ☁️ shows on the bar`);
  await b.shot(`${width}-3-home-missing`);
  await ev(`document.querySelector('#offline-ready-slot .offline-ready').click()`);
  ok(await waitFor(`!!document.querySelector('#hoja-offline-ready #btn-offline-retry')`), `${width}: missing: a tap opens the sheet with Reintentar`);
  await b.shot(`${width}-4-home-missing-sheet`);
  await ev(`document.querySelector('#hoja-offline-ready .btn--ghost').click()`);
  ok(await pretend('unsupported') && await waitFor(`!${cloud} && ${slotGone}`), `${width}: unsupported: no ☁️ on the bar`);
  ok(await pretend('loading') && await waitFor(cloudIs('loading')), `${width}: storing: the ☁️ shows with its ring`);
  await b.shot(`${width}-5-home-loading`);
  // The pretend storing takes six seconds: its end, once
  if (width === 390) {
    ok(await waitFor(cloudIs('ready'), 9000), `${width}: storing ends ready: the ☁️ stays a moment with its flash`);
    ok(await waitFor(`!${cloud} && ${slotGone}`, 4000), `${width}: then it leaves the bar`);
  }

  // The profile's ⚙️ row, for a player with an account
  await ev(`(async () => { const { jugador } = await import('/assets/js/jugador.js'); await (await jugador()).crear('Javi', '1234'); })()`);
  const settings = async () => { await b.open(PROFILE); ok(await waitFor(`!!document.querySelector('[data-tab=settings]')`), `${width}: the profile opens with its ⚙️ tab`); await ev(`document.querySelector('[data-tab=settings]')?.click()`); };
  if (width === 390) {
    flags('off');
    await settings();
    ok(await waitFor(`!!document.getElementById('pf-account')?.offsetHeight`) && await ev(`!document.getElementById('or-fila')`), `${width}: flag off: ⚙️ has no cloud row`);
    flags('lab');
  }
  await settings();
  ok(await waitFor(`!!document.getElementById('or-fila')?.offsetHeight`), `${width}: flag on: ⚙️ has «Juegos sin señal»`);
  ok(await ev(`document.getElementById('or-fila').getBoundingClientRect().height >= 44 && document.documentElement.scrollWidth <= ${width}`), `${width}: the row is a 44 px tap target, nothing scrolls sideways`);
  for (const [state, title] of Object.entries(TITLES)) {
    ok(await pretend(state) && await waitFor(`document.getElementById('or-fila').dataset.state === '${state}' && document.getElementById('or-fila-estado').textContent.startsWith('${title}')`), `${width}: ${state}: the row says «${title}…» with its cloud`);
    await ev(`document.getElementById('or-fila').scrollIntoView({ block: 'center' })`);
    await b.shot(`${width}-6-settings-${state}`);
  }
  await ev(`document.getElementById('or-fila').click()`);
  ok(await waitFor(`!!document.getElementById('hoja-offline-ready')`), `${width}: a tap on the row opens the sheet`);
  await b.shot(`${width}-7-settings-sheet`);
  b.close();
}

console.log(failures ? `✗ ${failures} failed` : '✓ quiet cloud: the bar only when it asks, ⚙️ always, every state from the T tab');
process.exit(failures ? 1 : 0);
