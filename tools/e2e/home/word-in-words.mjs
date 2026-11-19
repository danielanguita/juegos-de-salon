// Toque y Fama: Palabra under the home page's 🔤 Palabras filter (lab flag word-in-words, the owner 2026-11-19):
// its own card only with that filter on, opening /word/; with no filter, another type or a search, the one
// Toque y Fama card as always (#767); the count does not include it; with the flag off, never. Prints ✗ if something fails.
import { output } from '../output.mjs';
import { launch, sleep } from '../cdp.mjs';
const OUT = output('/tmp/home-word-in-words');
const b = await launch({ dir: `${OUT}/p`, out: OUT, width: 390, height: 844, clock: true });
const ev = e => b.evaluate(e);
const SITE = process.env.SITE || 'http://localhost:8765';
let failures = 0;
const ok = (cond, msg) => { console.log(`${cond ? '✓' : '✗'} ${msg}`); if (!cond) failures++; };
const waitFor = async (expr, ms = 8000) => { for (let t = 0; t < ms; t += 100) { if (await ev(expr)) return true; await sleep(100); } return false; };
const shown = `(() => { const c = document.querySelector('.game-card[data-id="letras"]'); return !!c && !!c.offsetParent; })()`;
const ready = `!!document.querySelector('.game-card[data-id="toque-y-fama"]')`;

b.flags({ 'word-in-words': 'all' });
await b.go(`${SITE}/?test`); await waitFor(ready); await sleep(500);
ok(!(await ev(shown)), 'with no filter, no Palabra card: one Toque y Fama (#767)');
ok(await ev(`!!document.querySelector('.game-card[data-id="toque-y-fama"]').offsetParent`), 'Toque y Fama is on the list');

await b.go(`${SITE}/?test&type=words`); await waitFor(ready);
ok(await waitFor(shown), 'under 🔤 Palabras, its own card');
ok(await ev(`/(^|\\/)word\\/$/.test(document.querySelector('.game-card[data-id="letras"]').getAttribute('href'))`), 'it opens /word/');
ok(await ev(`document.querySelector('.game-card[data-id="letras"] h2').textContent.includes('Toque y Fama: Palabra')`), 'with its name');
ok(await ev(`document.documentElement.scrollWidth <= 390`), 'no sideways scroll');
const total = await ev(`document.getElementById('filtros-cuenta').textContent`);
await b.shot('words');

await b.go(`${SITE}/?test&type=logic`); await waitFor(ready); await sleep(500);
ok(!(await ev(shown)), 'under 🧩 Lógica, not there');
ok(await ev(`document.getElementById('filtros-cuenta').textContent.match(/\\d+/g)?.at(-1)`) === total.match(/\d+/g)?.at(-1), 'the total in the count does not include it');

b.flags({ 'word-in-words': 'off' });
await b.go(`${SITE}/?test&type=words`); await waitFor(ready); await sleep(800);
ok(!(await ev(shown)), 'with the flag off, not even under 🔤 Palabras');

ok(!b.errors.length, 'no console errors' + (b.errors.length ? ': ' + b.errors[0].slice(0, 160) : ''));
b.close();
process.exit(failures ? 1 : 0);
