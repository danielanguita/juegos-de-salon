// ⚡ ¡Al toque! end to end at its standalone page /in-a-flash/, La Copa's screen (cup/games/microgames/):
// the waiting room with ⚡ and the name, its line, the credit to WarioWare and the three ways to play each with
// its moving finger; Empezar through the countdown to a run of 10 different microgames (the HUD, a mark per
// game, the first intro wearing its type's gesture); ending the
// run shows the verdict, the points and the 0–100 with each game's stars, and «Continuar» gives La Copa's
// result with the breakdown. The waiting room in en and pt; at
// 320 px no sideways scroll; Rankings has its tab (D-559). Prints ✗ if anything fails.
import { output } from '../output.mjs';
import { launch, sleep } from '../cdp.mjs';
const OUT = output('/tmp/in-a-flash');
const b = await launch({ dir: `${OUT}/p`, out: OUT, width: 375, height: 812, clock: true });
const ev = e => b.evaluate(e);
const SITE = process.env.SITE || 'http://localhost:8765';
let failures = 0;
const ok = (cond, msg) => { console.log(`${cond ? '✓' : '✗'} ${msg}`); if (!cond) failures++; };
const waitFor = async (expr, ms = 8000) => { for (let t = 0; t < ms; t += 100) { if (await ev(expr)) return true; await sleep(100); } return false; };
const noSideScroll = () => ev(`document.documentElement.scrollWidth <= innerWidth`);

// The waiting room
await b.go(`${SITE}/in-a-flash/?test&lang=es`, 1500);
ok(await waitFor(`!!document.getElementById('btn-empezar')`), 'the waiting room has Empezar');
ok(await waitFor(`!!document.querySelector('.mg-titulo .tbolt')`), 'with ⚡ and the name');
ok(/WarioWare/.test(await ev(`document.getElementById('link-warioware')?.textContent || ''`)), 'and the credit to WarioWare');
ok(await ev(`[...document.querySelectorAll('.mg-portada .kind')].filter(k => k.querySelector('.gstage .hand')).length`) === 3, 'the three ways to play, each with its finger doing the gesture');
ok(await noSideScroll(), 'no sideways scroll in the waiting room');
await b.shot('01-lobby');

// The run
await ev(`document.getElementById('btn-empezar').click(); 1`);
ok(await waitFor(`!!window.__microgames && !!__microgames.game && !document.getElementById('hud').hidden`, 10000), 'Empezar starts the run after the countdown, with the HUD');
const order = await ev(`__microgames.order`);
ok(order.length === 10 && new Set(order).size === 10, `ten different microgames (${order.join(', ')})`);
ok(await ev(`document.querySelectorAll('#runbar i').length`) === 10, 'a mark per game in the run');
ok(await ev(`!!document.querySelector('#screen .gest .gstage') && !!document.getElementById('demo').dataset.kind`), 'the first intro shows its type\'s gesture, the stage framed in its color');
await b.shot('02-run');

// Ending the run (the hook, as a phone that plays it out): its summary
await ev(`__alToque.acabar(); 1`);
ok(await waitFor(`!!document.getElementById('btn-fin')`, 5000), 'the run ends on its summary');
ok(/pts/.test(await ev(`document.getElementById('screen')?.textContent || ''`)) && /\/100/.test(await ev(`document.getElementById('screen').textContent`)), 'with the points and the 0–100');
ok(await ev(`document.querySelectorAll('.runsum > span').length`) === 10, 'and each game\'s icon with its stars');
ok(await ev(`JSON.stringify(window.__alToque?.estado().orden || [])`) === JSON.stringify(order), 'the result keeps the run\'s ten games');
await b.shot('03-end');
await ev(`document.getElementById('btn-fin').click(); 1`);
ok(await waitFor(`/Cómo se calculó/.test(document.querySelector('#screen-resultado.active')?.textContent || '') && /⭐/.test(document.querySelector('#screen-resultado.active').textContent)`, 8000), 'Continuar gives La Copa\'s result with the breakdown');
await b.shot('04-result');

// The languages
for (const [lang, name] of [['en', 'In a Flash!'], ['pt', 'Na Hora!']]) {
  await b.go(`${SITE}/in-a-flash/?test&lang=${lang}`, 1500);
  ok(await waitFor(`document.body.textContent.includes(${JSON.stringify(name)})`), `the waiting room in ${lang}: ${name}`);
}

await b.send('Emulation.setDeviceMetricsOverride', { width: 320, height: 640, deviceScaleFactor: 2, mobile: true }); await sleep(300);
ok(await noSideScroll(), 'at 320 px no sideways scroll');

// Rankings lists its table once launched (D-559)
await b.send('Emulation.setDeviceMetricsOverride', { width: 375, height: 812, deviceScaleFactor: 2, mobile: true });
await b.go(`${SITE}/records/?test`, 300);
await ev(`localStorage.setItem('juegos-de-salon:flags', JSON.stringify({ microgames: { state: 'all' } })); 1`);
await b.go(`${SITE}/records/?test`, 1000);
ok(await waitFor(`!!document.querySelector('#rk-juegos button[data-id="microgames"]')`), 'Rankings has its tab, once launched (D-559)');

ok(!b.errors.length, `no errors on the page ${JSON.stringify(b.errors)}`);
b.close();
if (failures) { console.log(`✗ ${failures} failures`); process.exit(1); }
console.log('✓ in-a-flash/page.mjs');
