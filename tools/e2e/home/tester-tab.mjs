// The tester tab «T» in two views (D-592), on the home page: opened, «Testing now» shows only the rows the
// tester pinned with 📌 and any row out of its normal state, plus the screen's control; «Experiments · N»
// opens the second view with every row, its 📌 and its switch. A pin shows or hides a row and never turns it
// off; a flag turned off stays in the first view, marked, even unpinned. At 390 and 320 px, in Spanish and
// English; each shot measures margins, overlaps and spacing by itself (D-570). Prints ✗ if something fails.
import { output } from '../output.mjs';
import { launch, sleep } from '../cdp.mjs';
const OUT = output('/tmp/home-tester-tab');
const SITE = process.env.SITE || 'http://localhost:8765';
let failures = 0;
const ok = (cond, msg) => { console.log(`${cond ? '✓' : '✗'} ${msg}`); if (!cond) failures++; };

for (const width of [390, 320]) {
  const b = await launch({ dir: `${OUT}/p${width}`, out: OUT, width, height: width === 390 ? 844 : 640, clock: true });
  const ev = e => b.evaluate(e);
  const waitFor = async (expr, ms = 8000) => { for (let t = 0; t < ms; t += 100) { if (await ev(expr)) return true; await sleep(100); } return false; };
  const shown = `JSON.stringify([...document.querySelectorAll('#tr-panel .toggle-row')].filter(x => x.offsetHeight).map(x => x.dataset.row))`;
  const open = async () => { await ev(`document.getElementById('tr-tab').click()`); return waitFor(`document.querySelectorAll('#tr-flags .toggle-row').length > 0 && !!document.querySelector('#tr-panel').offsetHeight`); };

  // Two lab flags asked by the home page, and nothing pinned or off yet: the first view holds no row
  b.flags({ 'copa-espera': 'lab', 'copa-jugar': 'lab' });
  await b.go(`${SITE}/?test&lang=es`);
  await ev(`localStorage.removeItem('juegos-de-salon:flags-pinned'); localStorage.removeItem('juegos-de-salon:flags-off')`);
  await b.go(`${SITE}/?test&lang=es`);
  ok(await waitFor(`!!document.getElementById('tr-tab')`), `${width}: the tab shows`);
  ok(await open(), `${width}: opened, its list is drawn`);
  const rows = await ev(`document.querySelectorAll('#tr-flags .toggle-row').length`);
  ok(JSON.parse(await ev(shown)).length === 0 && await ev(`document.getElementById('tr-empty').offsetHeight > 0`), `${width}: nothing pinned: the first view shows no row, only the line that says how to pick`);
  ok(await ev(`document.getElementById('tr-all').textContent.includes('Experimentos · ${rows}')`), `${width}: the way to every experiment counts them (${rows})`);
  ok(await ev(`!!document.getElementById('tr-labs').offsetHeight`), `${width}: Labs is still a tap away`);
  await b.shot(`${width}-1-empty`);

  // Second view: every row, each with its 📌 and its switch, wider panel
  await ev(`document.getElementById('tr-all').click()`); await sleep(300);
  ok(JSON.parse(await ev(shown)).length === rows, `${width}: the second view lists every row`);
  ok(await ev(`[...document.querySelectorAll('#tr-flags .toggle-row')].every(r => r.querySelector('.tr-pin').offsetHeight && r.querySelector('.switch').offsetHeight)`), `${width}: each row has its 📌 and its switch`);
  ok(await ev(`!document.getElementById('tr-labs').offsetHeight && !!document.getElementById('tr-back').offsetHeight`), `${width}: the second view has the way back instead of Labs`);
  ok(await ev(`document.querySelector('#tr-panel').scrollWidth <= document.querySelector('#tr-panel').clientWidth + 1 && document.querySelector('#tr-panel').getBoundingClientRect().left >= 0`), `${width}: nothing in it spills sideways`);
  ok(await ev(`document.querySelector('[data-pin="copa-jugar"]').getBoundingClientRect().height >= 36`), `${width}: the 📌 is a real tap target`);
  await ev(`document.querySelector('[data-pin="copa-jugar"]').click()`); await sleep(300);
  ok(await ev(`document.querySelector('[data-pin="copa-jugar"]').getAttribute('aria-pressed') === 'true' && JSON.parse(localStorage.getItem('juegos-de-salon:flags-pinned'))['copa-jugar'] === true`), `${width}: the 📌 pins it, on this phone`);
  ok(await ev(`document.querySelector('[data-flag="copa-jugar"]').getAttribute('aria-checked') === 'true'`), `${width}: pinning leaves its switch as it was`);
  await b.shot(`${width}-2-experiments`);

  // Back: only the pinned row
  await ev(`document.getElementById('tr-back').click()`); await sleep(300);
  ok(await ev(shown) === JSON.stringify(['copa-jugar']) && await ev(`!document.getElementById('tr-empty').offsetHeight`), `${width}: back on the first view, only the pinned row`);
  await b.shot(`${width}-3-pinned`);

  // Folded and opened again: the first view, the pin kept across a reload
  await b.go(`${SITE}/?test&lang=es`);
  ok(await open() && await ev(shown) === JSON.stringify(['copa-jugar']), `${width}: after a reload the pin is still there`);

  // An unpinned flag turned off is never hidden: the first view shows it, marked
  await ev(`document.getElementById('tr-all').click()`); await sleep(200);
  await ev(`document.querySelector('[data-flag="copa-espera"]').click()`); await sleep(2500);
  ok(await open(), `${width}: the page reloaded with the flag off`);
  ok(JSON.parse(await ev(shown)).includes('copa-espera') && await ev(`!!document.querySelector('[data-row="copa-espera"] .tr-mark').offsetHeight`), `${width}: the flag turned off shows in the first view, marked, though not pinned`);
  await b.shot(`${width}-4-off`);
  await ev(`document.getElementById('tr-all').click()`); await sleep(200);
  await ev(`document.querySelector('[data-flag="copa-espera"]').click()`); await sleep(2500);
  ok(await open() && await ev(shown) === JSON.stringify(['copa-jugar']), `${width}: switched back on, it hides again`);

  // English
  await b.go(`${SITE}/?test&lang=en`);
  ok(await open() && await ev(`document.querySelector('#tr-flags > small').textContent === 'Testing now' && document.getElementById('tr-all').textContent.startsWith('Experiments ·')`), `${width} en: the views speak English`);
  ok(!b.errors.length, `${width}: no errors on the page${b.errors.length ? ` (${b.errors.join(' | ')})` : ''}`);
  b.close();
}
console.log(failures ? `✗ ${failures} failed` : '✓ the tester tab in two views');
process.exit(failures ? 1 : 0);
