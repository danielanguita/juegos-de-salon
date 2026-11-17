// ❌ What a mistake costs, under the play head (lab flag `mistakes-rule`; localhost holds the lab key):
// Reinas says they cost nothing, and so does Tango on its own page with the lab flag tango-time
// (lab: #seccion-tango-time; La Copa keeps 10 a mistake), with its hint at +15 s, in Spanish and English. Prints ✗ if anything fails.
import { output } from '../output.mjs';
import { launch } from '../cdp.mjs';

const OUT = output('/tmp/mistakes-rule');
const SITE = process.env.SITE || 'http://localhost:8765';
let failures = 0;
const ok = (cond, msg) => { console.log(`${cond ? '✓' : '✗'} ${msg}`); if (!cond) failures++; };

const b = await launch({ dir: `${OUT}/p`, out: OUT, width: 375, height: 812 });
const ev = e => b.evaluate(e);
const line = `document.getElementById('regla-errores')?.textContent || ''`;
try {
  for (const [page, lang, want, board] of [
    ['tango', 'es', /Equivocarse no resta/, 'tango'],
    ['queens', 'es', /Equivocarte no resta/, null],
    ['tango', 'en', /Mistakes cost nothing/, 'tango'],
  ]) {
    await b.open(`${SITE}/${page}/?test&lang=${lang}`, 2500);
    ok(await b.until(`!!document.getElementById('btn-empezar')`, 6000), `${page} (${lang}): the waiting room`);
    ok(!(await ev(line)), `${page} (${lang}): no mistakes line before playing`);
    if (board) ok(await b.until(`/45/.test(document.getElementById('como-puntaje')?.textContent || '')`, 4000), `${page} (${lang}): the cover's scoring says the time scores`);
    await ev(`document.getElementById('btn-empezar').click(); 1`);
    ok(await b.until(`!!document.getElementById('regla-errores')`, 9000), `${page} (${lang}): the line comes with the board`);
    ok(want.test(await ev(line)), `${page} (${lang}): it says ${want}`);
    ok(await ev(`document.getElementById('jugar-head').nextElementSibling?.id === 'regla-errores'`), `${page} (${lang}): right under the title`);
    if (board) ok(/\+15 s/.test(await ev(`document.getElementById('btn-pista')?.textContent || ''`)), `${page} (${lang}): the hint adds 15 s`);
    if (board) ok(await ev(`!!document.querySelector('[data-tablero="${board}"]')`), `${page} (${lang}): with the board`);
    await b.shot(`${page}-${lang}`);
  }
} catch (e) { ok(false, e.message); }
await b.close?.();
process.exit(failures ? 1 : 0);
