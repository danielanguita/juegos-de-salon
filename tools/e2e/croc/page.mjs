// 🐸 Croc!, out of the lab (D-517's way), end to end at its standalone page /croc/, La Copa's screen
// (cup/games/croc/): with its flag on for this visitor, the waiting room with the frog by
// the name, the demo (the real game playing itself) and the traffic lever on normal; the lever up turns heavy
// traffic on (the red-violet page) and back down; Empezar through the countdown to the road, the crossing to the
// pond through the hook, «Continuar» to La Copa's result with its breakdown; heavy traffic plays heavy traffic.
// The waiting room in en and pt; at 320 px nothing scrolls sideways; Rankings has its tab (D-559). It never
// depends on today's date (D-589). Prints ✗ if anything fails.
import { output } from '../output.mjs';
import { launch, sleep } from '../cdp.mjs';
const OUT = output('/tmp/croc-page');
const b = await launch({ dir: `${OUT}/p`, out: OUT, width: 390, height: 844, clock: true });
const ev = e => b.evaluate(e);
const SITE = process.env.SITE || 'http://localhost:8765';
let failures = 0;
const ok = (cond, msg) => { console.log(`${cond ? '✓' : '✗'} ${msg}`); if (!cond) failures++; };
const waitFor = async (expr, ms = 8000) => { for (let t = 0; t < ms; t += 100) { if (await ev(expr)) return true; await sleep(100); } return false; };
const noSideScroll = () => ev(`document.documentElement.scrollWidth <= innerWidth`);
const narrow = async () => { await b.send('Emulation.setDeviceMetricsOverride', { width: 320, height: 640, deviceScaleFactor: 2, mobile: true }); await sleep(300); };
const wide = () => b.send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 2, mobile: true });
const setFlag = state => ev(`localStorage.setItem('juegos-de-salon:flags', JSON.stringify({ ...JSON.parse(localStorage.getItem('juegos-de-salon:flags') || '{}'), croc: { state: '${state}' } })); 1`);
const P = `window.__croc`;
// The road cleared and the canal still under one boat as wide as the road: the frog walks across (the lab's game.mjs way)
const CLEAR = `(() => { for (const l of ${P}.g.lanes) { if (l.kind === 'water') { l.speed = 0; l.vehicles = [{ id: 'e2e-boat', type: 'boat', len: 99, color: 'boatA', x: -40, grazed: false }]; } else l.vehicles = []; } return 1; })()`;

// Until its launch the page opens only once flags/croc is on for this visitor (the shared LANZA path in
// cup/game.js, Sudoku's): the flag pinned to all
await b.go(`${SITE}/croc/?test`, 800);
await setFlag('all');
await b.go(`${SITE}/croc/?test&lang=es`, 1500);
ok(await waitFor(`!!document.getElementById('btn-empezar')`), 'with flags/croc on, the waiting room has Empezar');
ok(await waitFor(`!!document.querySelector('.sp-titulo .sp-logo') && /Croc!/.test(document.querySelector('.sp-titulo').textContent)`), 'with the frog by the name');
ok(await waitFor(`!!document.querySelector('.sp-portada canvas.sp-demo') && document.querySelector('.sp-demo').width > 0`), 'and the demo, the real game playing itself');
ok(await ev(`document.getElementById('btn-level')?.getAttribute('aria-checked') === 'false' && /Modo fácil/.test(document.getElementById('btn-level').textContent)`), 'the lever starts on easy mode');
ok(await noSideScroll(), 'no sideways scroll in the waiting room');
await b.shot('01-lobby');
await narrow();
ok(await noSideScroll(), 'nor at 320 px');
await b.shot('01-lobby-320');
await wide();

// The lever: up is heavy traffic and the red-violet page; down again, normal
await ev(`document.getElementById('btn-level').click(); 1`);
ok(await waitFor(`document.getElementById('btn-level')?.getAttribute('aria-checked') === 'true' && /Modo difícil/.test(document.getElementById('btn-level').textContent)`), 'the lever up says hard mode');
ok(await waitFor(`document.body.classList.contains('sp-hard')`), 'and turns the page red-violet');
await sleep(700);
await b.shot('02-lobby-hard');
await ev(`document.getElementById('btn-level').click(); 1`);
ok(await waitFor(`document.getElementById('btn-level')?.getAttribute('aria-checked') === 'false' && !document.body.classList.contains('sp-hard')`), 'down again, normal traffic and the usual page');

// The crossing
await ev(`document.getElementById('btn-empezar').click(); 1`);
ok(await waitFor(`!!${P} && !document.getElementById('cuenta')`, 9000), 'Empezar opens the road after the countdown');
ok(await ev(`${P}.g.difficulty === 'normal' && ${P}.g.mode === 'ready' && ${P}.g.finishRow === 33`), 'normal traffic, 33 lanes, the frog waiting for its first swipe');
ok(/Carril 0\/33/.test(await ev(`document.querySelector('.sp-pill')?.textContent || ''`)), 'the HUD says lane 0 of 33');
ok(await noSideScroll(), 'no sideways scroll on the road');
await b.shot('03-game');
await ev(CLEAR);
for (let i = 0; i < 90 && !(await ev(`!!document.getElementById('btn-fin')`)); i++) {
  await ev(`${P}.act('up'); 1`);
  await sleep(125);
}
ok(await waitFor(`!!document.getElementById('btn-fin')`, 3000), 'the frog reaches the pond');
ok(await ev(`${P}.estado().won && ${P}.estado().score === 43`), `33 lanes + 10 at the pond = 43 points (${await ev(`${P}.estado().score`)})`);
await ev(`document.getElementById('btn-fin').click(); 1`);
ok(await waitFor(`!!document.querySelector('#screen-resultado.active .score-big')`, 5000), 'Continuar gives the result');
ok(/carril 33 de 33/.test(await ev(`document.querySelector('#screen-resultado.active')?.textContent || ''`)), 'with its breakdown');
ok(/🐸 33\/33/.test(await ev(`document.querySelector('#screen-resultado pre.tarjeta')?.textContent || ''`)), 'and its share card');
ok(await noSideScroll(), 'no sideways scroll in the result');
await b.shot('04-result');

// Heavy traffic plays heavy traffic
await b.go(`${SITE}/croc/?test&lang=es&seed=HARD`, 1500);
await waitFor(`!!document.getElementById('btn-level')`);
await ev(`document.getElementById('btn-level').click(); 1`);
await waitFor(`document.getElementById('btn-level')?.getAttribute('aria-checked') === 'true'`);
await ev(`document.getElementById('btn-empezar').click(); 1`);
ok(await waitFor(`!!${P} && !document.getElementById('cuenta')`, 9000) && await ev(`${P}.g.difficulty === 'hard'`), 'the lever up plays heavy traffic');
ok(await ev(`document.body.classList.contains('sp-hard')`), 'on the red-violet page');
await b.shot('05-game-hard');
// Back on normal for the rest (the lever's choice is kept on this phone)
await b.go(`${SITE}/croc/?test&lang=es`, 1500);
await waitFor(`!!document.getElementById('btn-level')`);
await ev(`document.getElementById('btn-level').getAttribute('aria-checked') === 'true' && document.getElementById('btn-level').click(); 1`);

// The languages
for (const [lang, start, lever] of [['en', /Start/, /Easy mode/], ['pt', /Começar/, /Modo fácil/]]) {
  await b.go(`${SITE}/croc/?test&lang=${lang}`, 1500);
  ok(await waitFor(`!!document.getElementById('btn-empezar')`), `${lang}: the waiting room`);
  ok(start.test(await ev(`document.getElementById('btn-empezar').textContent`)), `${lang}: Empezar in ${lang}`);
  ok(await waitFor(`${lever}.test(document.getElementById('btn-level')?.textContent || '')`), `${lang}: the lever in ${lang}`);
  await narrow();
  ok(await noSideScroll(), `${lang}: no sideways scroll at 320 px`);
  await b.shot(`06-lobby-${lang}-320`);
  await wide();
}

// Rankings lists its table once launched (D-559)
await b.go(`${SITE}/records/?test`, 300);
await setFlag('all');
await b.go(`${SITE}/records/?test`, 1000);
ok(await waitFor(`!!document.querySelector('#rk-juegos button[data-id="croc"]')`), 'Rankings has its tab, once launched (D-559)');
ok(await ev(`!!document.querySelector('#rk-juegos button[data-id="croc_hard"]')`), 'and heavy traffic its own (a variant ranks apart, D-331)');
if (failures) console.log(await ev(`[...document.querySelectorAll('#rk-juegos button')].map(x => x.dataset.id).join(',')`));

ok(!b.errors.length, `no errors on the page ${JSON.stringify(b.errors)}`);
b.close();
if (failures) { console.log(`✗ ${failures} failures`); process.exit(1); }
console.log('✓ croc/page.mjs');
