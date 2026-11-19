// 👀 Memorice, ready to leave the lab (D-517's way), end to end at its standalone page /memorice/: the waiting
// room with the 👀 title and the demo board playing by itself; Empezar through the countdown to the first 3×3
// board; the pictures show and «⏩ Tapar ya» covers them; the asked picture found clears the round; a wrong
// tile costs a life; the lives run out and «Continuar» gives the result with its breakdown and share card.
// The languages: the waiting room in en and pt. At 320 px nothing scrolls sideways. Prints ✗ if anything fails.
import { output } from '../output.mjs';
import { launch, sleep } from '../cdp.mjs';
const OUT = output('/tmp/memory-page');
const b = await launch({ dir: `${OUT}/p`, out: OUT, width: 390, height: 844 });
const ev = e => b.evaluate(e);
const SITE = process.env.SITE || 'http://localhost:8765';
let failures = 0;
const ok = (cond, msg) => { console.log(`${cond ? '✓' : '✗'} ${msg}`); if (!cond) failures++; };
const waitFor = async (expr, ms = 8000) => { for (let t = 0; t < ms; t += 100) { if (await ev(expr)) return true; await sleep(100); } return false; };
const noSideScroll = () => ev(`document.documentElement.scrollWidth <= innerWidth`);
const P = `window.__memory`;
const asking = `!!${P}?.S.answer`;
const at320 = async fn => { await b.send('Emulation.setDeviceMetricsOverride', { width: 320, height: 640, deviceScaleFactor: 2, mobile: true }); await sleep(300); await fn(); await b.send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 2, mobile: true }); };

// Until its launch (flags/memory), the page sends a visitor home: the phone's copy of the flags says it is out
await b.go(`${SITE}/memorice/?test`, 800);
await ev(`localStorage.setItem('juegos-de-salon:flags', JSON.stringify({ ...JSON.parse(localStorage.getItem('juegos-de-salon:flags') || '{}'), memory: { state: 'all' } })); 1`);

// The waiting room
await b.go(`${SITE}/memorice/?test&lang=es`, 1500);
ok(await waitFor(`!!document.getElementById('btn-empezar')`), 'the waiting room has Empezar');
ok(await waitFor(`!!document.querySelector('.mm-cabeza .mm-logo') && document.querySelectorAll('.mm-portada .mm-tile').length === 9`), 'with the 👀 title and the 3×3 demo board');
ok(await waitFor(`document.querySelectorAll('.mm-portada .mm-tile.ok').length > 0`, 9000), 'the demo plays by itself: the one asked opens with a green ring');
ok(await noSideScroll(), 'no sideways scroll in the waiting room');
await b.shot('01-lobby');
await at320(async () => { ok(await noSideScroll(), 'no sideways scroll in the waiting room at 320 px'); await b.shot('01-lobby-320'); });

// The game: round 1, the pictures shown and covered early, the right tile clears it
await ev(`document.getElementById('btn-empezar').click(); 1`);
ok(await waitFor(`!!document.getElementById('mm-board') && !document.getElementById('cuenta') && !!${P}`, 9000), 'Empezar opens the board after the countdown');
ok(await ev(`document.querySelectorAll('#mm-board .mm-tile').length === 9 && document.querySelectorAll('#mm-vidas span').length === 3`), 'a 3×3 board and 3 lives');
ok(await waitFor(`!!document.getElementById('btn-tapar') && document.querySelectorAll('#mm-board .mm-tile.open').length === 2`, 3000), 'two pictures show, with «Tapar ya»');
await b.shot('02-look');
await ev(`document.getElementById('btn-tapar')?.click(); 1`);
ok(await waitFor(asking, 3000), 'Tapar ya (or the time) covers them and asks');
// The clock stopped for the shots: under ?test the time to answer is a second
await ev(`${P}.congelar(true); 1`);
ok(await ev(`document.querySelectorAll('#mm-board .mm-tile.open').length === 0 && !!document.querySelector('#mm-aviso .mm-pic-icon')`), 'all covered, the picture asked under the board');
await b.shot('03-ask');
await at320(async () => { ok(await noSideScroll(), 'no sideways scroll in the game at 320 px'); await b.shot('03-ask-320'); });
await ev(`${P}.congelar(false); ${P}.round.ask.cells.forEach(c => document.querySelector('#mm-board .mm-tile[data-i="' + c + '"]').click()); 1`);
ok(await waitFor(`/Ronda 2/.test(document.getElementById('mm-ronda').textContent)`, 6000), 'found: round 2');
ok(await ev(`${P}.estado().score === 1`), 'one round cleared');

// A wrong tile costs a life; three of them end the game
for (let k = 0; k < 3; k++) {
  ok(await waitFor(asking, 9000), `asks again (${k + 1})`);
  await ev(`(() => { const r = ${P}.round; const i = r.board.findIndex((v, j) => !r.ask.cells.includes(j)); document.querySelector('#mm-board .mm-tile[data-i="' + i + '"]').click(); })(); 1`);
  ok(await waitFor(`document.querySelectorAll('#mm-vidas .lost').length === ${k + 1}`, 4000), `a wrong tile: ${2 - k} lives left`);
}
ok(await waitFor(`!!document.getElementById('btn-fin')`, 6000), 'no lives left: the end, with Continuar');
ok(!!(await ev(`document.getElementById('mm-veredicto')?.textContent`)), 'and a verdict');
await b.shot('04-end');
await ev(`document.getElementById('btn-fin').click(); 1`);
ok(await waitFor(`/^1/.test(document.querySelector('#screen-resultado.active .score-big')?.textContent || '')`, 5000), 'the result: 1 point');
ok(/1 ronda superada/.test(await ev(`document.getElementById('explicacion')?.textContent || document.getElementById('resultado-body').textContent`)), 'the breakdown counts the round');
ok(/🟩🟥🟥🟥/u.test(await ev(`document.querySelector('#screen-resultado pre.tarjeta')?.textContent || ''`)), 'the share card has a square per round');
ok(await noSideScroll(), 'no sideways scroll in the result');
await b.shot('05-result');
await at320(async () => { ok(await noSideScroll(), 'no sideways scroll in the result at 320 px'); await b.shot('05-result-320'); });

// The languages
for (const [lang, start, line] of [['en', /Start/, /Look, remember/], ['pt', /Começar/, /Olhe, lembre/]]) {
  await b.go(`${SITE}/memorice/?test&lang=${lang}`, 1500);
  ok(await waitFor(`!!document.getElementById('btn-empezar')`), `${lang}: the waiting room`);
  ok(start.test(await ev(`document.getElementById('btn-empezar').textContent`)), `${lang}: Empezar in ${lang}`);
  ok(line.test(await ev(`document.querySelector('.mm-lema')?.textContent || ''`)), `${lang}: its line in ${lang}`);
  await at320(async () => ok(await noSideScroll(), `${lang}: no sideways scroll at 320 px`));
}

ok(!b.errors.length, `no errors on the page ${JSON.stringify(b.errors)}`);
b.close();
if (failures) { console.log(`✗ ${failures} failures`); process.exit(1); }
console.log('✓ memory/page.mjs');
