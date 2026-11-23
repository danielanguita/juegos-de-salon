// Extended offline mode (flag extended-offline, offline-ui.js; the owner, 2026-11-23): with offline mode forced on
// this phone, the home page's dancing emoji gives its place to a still plate «📴 SIN CONEXIÓN» that moves nothing
// (the hero keeps its height, the title stays where it was), a tap on it opens the offline sheet, and a line at the
// bottom says how many games wait to upload; a game's cover has no sticker, only the Candlelight palette. With the
// flag off, the sticker is as before (checked at 390 only). The home page is the owner's: the icon view and the
// profile's pill. At 390 and 320 px; each shot measures margins, overlaps and spacing by itself (D-570).
import { output } from '../output.mjs';
import { rmSync } from 'node:fs';
import { launch, sleep } from '../cdp.mjs';
const OUT = output('/tmp/home-extended-offline');
const SITE = process.env.SITE || 'http://localhost:8765';
let failures = 0;
// Each browser from a clean profile: a forced offline mode and its service worker stay in a profile from one run to the next
for (const d of ['p390', 'p320', 'off']) rmSync(`${OUT}/${d}`, { recursive: true, force: true });
const ok = (cond, msg) => { console.log(`${cond ? '✓' : '✗'} ${msg}`); if (!cond) failures++; };
const HOME = `${SITE}/?test&lang=es`, ZIP = `${SITE}/zip/?test&lang=es`;
const plate = `(() => { const p = document.querySelector('.hero .emoji .offline-plate'); return !!p && p.offsetHeight > 0 && getComputedStyle(p).display !== 'none'; })()`;
const chip = `(() => { const c = document.querySelector('.offline-chip'); return !!c && getComputedStyle(c).display !== 'none'; })()`;
const titleTop = `Math.round(document.querySelector('.hero > h1').getBoundingClientRect().top - document.querySelector('.hero').getBoundingClientRect().top)`;

for (const width of [390, 320]) {
  const b = await launch({ dir: `${OUT}/p${width}`, out: OUT, width, height: width === 390 ? 844 : 640, clock: true });
  const ev = e => b.evaluate(e);
  const waitFor = async (expr, ms = 8000) => { for (let t = 0; t < ms; t += 100) { if (await ev(expr)) return true; await sleep(100); } return false; };
  const flags = state => b.flags({ profile: 'all', 'home-carousels': 'all', 'extended-offline': state });
  // Online first, to measure where the title sits before the mode comes in
  flags('lab');
  await b.open(HOME);
  await ev(`localStorage.clear(); localStorage.setItem('juegos-de-salon:offline-sheet-seen', '1')`);
  await b.open(HOME);
  const before = await ev(titleTop);
  // Zip once online, as a phone that stored it: the forced mode cuts the network, and this server has no service worker's store
  await b.open(ZIP);
  // Offline forced on this phone (the T tab's switch), with two finished games waiting to upload
  await ev(`localStorage.setItem('juegos-de-salon:offline-forced', '1'); localStorage.setItem('juegos-de-salon:jugador:pendientes', JSON.stringify([{ juego: 'zip', s: 1 }, { juego: 'zip', s: 2 }]))`);
  await b.open(ZIP);
  // A game's cover: the palette alone, no sticker
  ok(await waitFor(`document.documentElement.classList.contains('offline-shell') && !!document.querySelector('.intro-hero')?.offsetHeight`) && !(await ev(chip)) && !(await ev(`!!document.querySelector('.offline-plate')`)), `${width}: Zip's cover is in Candlelight with no sticker and no plate`);
  await b.shot(`${width}-3-zip-cover`);
  await b.open(HOME);
  ok(await waitFor(`document.documentElement.classList.contains('offline-shell')`), `${width}: the home page is in offline mode, in Candlelight`);
  ok(await waitFor(plate), `${width}: the plate takes the emoji's place`);
  ok(await ev(`getComputedStyle(document.getElementById('hero-emoji')).visibility === 'hidden' && (l => l.textContent === 'Sin conexión' && getComputedStyle(l).textTransform === 'uppercase')(document.querySelector('.offline-plate-label'))`), `${width}: the dancing emoji is hidden and the plate says SIN CONEXIÓN`);
  ok(!(await ev(chip)), `${width}: no sticker on the title`);
  const after = await ev(titleTop);
  ok(Math.abs(after - before) <= 1, `${width}: nothing moves: the title is ${after} px into the hero, as online (${before} px)`);
  // The title's letters, not its box: .rainbow pads the box 0.2em up with a negative margin (base.css)
  ok(await ev(`(() => { const p = document.querySelector('.offline-plate-label').getBoundingClientRect(), r = document.createRange(); r.selectNodeContents(document.querySelector('.hero > h1')); const t = r.getBoundingClientRect(); return p.bottom <= t.top + 2 && p.left >= 0 && p.right <= innerWidth; })()`), `${width}: the plate covers nothing of the title's letters and fits the screen`);
  ok(await waitFor(`/⏳ 2 partidas esperan señal para subir/.test(document.querySelector('.offline-toast[data-kind="waiting"]')?.textContent || '')`), `${width}: a line at the bottom says the 2 games waiting to upload`);
  await b.shot(`${width}-1-home-plate`);
  if (width === 390) {
    await ev(`document.querySelector('.offline-plate').click()`);
    ok(await waitFor(`!!document.getElementById('hoja-offline')`), `${width}: a tap on the plate opens the offline sheet`);
    await b.shot(`${width}-2-sheet`);
    await ev(`document.getElementById('btn-offline-ok')?.click()`);
  }

  await ev(`localStorage.clear()`);
  const errors = b.errors.filter(e => !/Failed to fetch|offline mode forced|NetworkError|net::/.test(JSON.stringify(e)));
  ok(!errors.length, `${width}: no page errors${errors.length ? `: ${JSON.stringify(errors).slice(0, 300)}` : ''}`);
  b.close();
}
// Flag off: the sticker as before, no plate. A browser of its own: once offline is forced, this phone keeps the
// flags it saw last (the forced mode cuts the network, the service worker included), as a real offline phone does
{
  const b = await launch({ dir: `${OUT}/off`, out: OUT, width: 390, height: 844, clock: true });
  const ev = e => b.evaluate(e);
  b.flags({ profile: 'all', 'home-carousels': 'all', 'extended-offline': 'off' });
  await b.open(HOME);
  await ev(`localStorage.setItem('juegos-de-salon:offline-sheet-seen', '1'); localStorage.setItem('juegos-de-salon:offline-forced', '1')`);
  await b.open(HOME);
  let seen = false;
  for (let t = 0; t < 8000 && !seen; t += 100) { seen = await ev(chip); if (!seen) await sleep(100); }
  ok(seen && !(await ev(`!!document.querySelector('.offline-plate')`)), '390: flag off: the sticker on the title as before, no plate');
  b.close();
}
console.log(failures ? `✗ ${failures} check(s) failed` : '✓ extended offline mode: the plate on the home page, the palette alone elsewhere');
process.exit(failures ? 1 : 0);
