// The WBR shared by link (/wbr/?id=…): the page draws a frozen snapshot with the panel's own drawing
// (panel/wbr-view.js): its title, the two charts and the three tables, with no broken value and no
// sideways scroll at 900, 390 and 320 px; a link the owner stopped sharing says so. The snapshot is made
// here from trend() over made-up days and drawn through the page's test hook (window.__wbr), as the
// panel's script seeds the panel. Prints ✗ if something fails.
import { output } from '../output.mjs';
import { launch, sleep } from '../cdp.mjs';
import { trend, highlights, closedWeek, currentWeek } from '../../../public/panel/wbr.js';
const OUT = output('/tmp/wbr-shared');
const SITE = process.env.SITE || 'http://localhost:8765';
let failures = 0;
const ok = (cond, msg) => { console.log(`${cond ? '✓' : '✗'} ${msg}`); if (!cond) failures++; };

const now = Date.parse('2026-11-20T20:00:00Z'), w = closedWeek(now), a = currentWeek(now);
const days = {}, ids = ['tango', 'zip', 'dudo', 'ahorcado', 'generala', 'toque-y-fama'];
for (let d = w.from - 40; d <= a.to; d++) {
  const b = (days[d] = { local: {}, fin: {}, activos: {} });
  ids.forEach((g, i) => { const v = Math.round((8 - i) * (1 + (d % 5) / 4)); b.local[g] = { solo: { 1: v } }; b.fin[g] = { solo: v }; });
  for (let j = 0; j < 20 + (d % 7); j++) b.activos[`b${j}`.padEnd(10, 'x')] = 2;
}
const t = trend({ days }, w, { actual: a });
// As the panel stores it: through JSON, so the page reads what Firebase would give back
const snap = JSON.parse(JSON.stringify({ v: 1, titulo: '📋 WBR · Nov 8 – Nov 14, 2026', nota: 'The closed week against the four before.', at: now, t, destacados: highlights(t) }));
const BROKEN = /\bundefined\b|\bNaN\b|\bInfinity\b|\[object \w+\]/;

for (const width of [900, 390, 320]) {
  const b = await launch({ dir: `${OUT}/p${width}`, out: OUT, width, height: 900 });
  await b.go(`${SITE}/wbr/?test`, 1500);
  await b.evaluate(`window.__wbr.draw(${JSON.stringify(snap)}); 1`);
  await sleep(300);
  const v = JSON.parse(await b.evaluate(`JSON.stringify({
    title: document.title, highlights: document.querySelectorAll('.wbr-destacados li').length, tables: document.querySelectorAll('table.wbr').length, charts: document.querySelectorAll('.wbr-grafico').length,
    shares: [...document.querySelectorAll('table.wbr th')].filter(x => /^Top \\d+ share$/.test(x.textContent)).length,
    text: document.getElementById('vista').innerText, overflow: document.documentElement.scrollWidth - innerWidth })`));
  const bad = v.text.split('\n').find(l => BROKEN.test(l));
  ok(/^WBR · Nov 8 – Nov 14, 2026/.test(v.title), `${width} px: the tab names the week (${v.title})`);
  ok(v.tables === 3 && v.charts === 2 && v.shares === 4, `${width} px: three tables, two charts, four share rows (${v.tables}, ${v.charts}, ${v.shares})`);
  ok(v.highlights === snap.destacados.length && v.highlights > 0, `${width} px: the week's highlights (${v.highlights})`);
  ok(!bad, `${width} px: no broken value${bad ? ` ("${bad.trim().slice(0, 80)}")` : ''}`);
  ok(v.overflow <= 1, `${width} px: fits the width${v.overflow > 1 ? ` (${v.overflow} px too wide)` : ''}`);
  if (b.errors.length) ok(false, `${width} px: no error (${b.errors[0].slice(0, 120)})`);
  await b.shot(`shared-${width}`);
  if (width === 900) {
    await b.evaluate('window.__wbr.gone(); 1');
    ok(/not shared anymore/.test(await b.evaluate(`document.getElementById('vista').innerText`)), 'a link no longer shared says so');
  }
  await b.close();
}
console.log(failures ? `✗ wbr shared: ${failures} check(s) failed` : '✓ wbr shared: the page draws the snapshot');
process.exit(failures ? 1 : 0);
