// 📅 Today's Uno al día under the result of a game played on its own (lab flag `solo-result-today-card`, #1597):
// Reinas on /queens/, given up to its result. With the flag held off (what players see) there is no line; with it on
// (localhost holds the lab key), one cyan line under «Volver al menú» names today's game and opens it, not on the
// cover, and gone once today's game is on this phone. Spanish at 390 px and English at 320 px. Prints ✗ if anything fails.
import { output } from '../output.mjs';
import { launch, E2E_DAY } from '../cdp.mjs';
import { juegoDel, JUEGOS_DIA, KEY } from '../../../public/assets/js/uno-al-dia.js';
import { ALL_GAMES } from '../../../public/assets/js/games.js';

const OUT = output('/tmp/queens-today-card');
const SITE = process.env.SITE || 'http://localhost:8765';
const FLAG = 'solo-result-today-card';
let failures = 0;
const ok = (cond, msg) => { console.log(`${cond ? '✓' : '✗'} ${msg}`); if (!cond) failures++; };

const today = juegoDel(E2E_DAY);
const j = JUEGOS_DIA.find(x => x.id === today);
const nameOf = lang => { const n = ALL_GAMES.find(g => g.id === today)?.name || j.name; return `${j.emoji} ${n[lang] || n.es}`; };
const LINE = { es: `📅 Uno al día de hoy: ${nameOf('es')}`, en: `📅 Today's One a Day: ${nameOf('en')}` };
const PLAY = { es: '· Jugar', en: '· Play' };

for (const [lang, width] of [['es', 390], ['en', 320]]) {
  const b = await launch({ dir: `${OUT}/p-${lang}`, out: OUT, width, height: 812, clock: true });
  const ev = e => b.evaluate(e);
  const fresh = async () => {
    await b.open(`${SITE}/queens/?test&lang=${lang}`, 2500);
    await ev(`localStorage.clear(); localStorage.setItem('juegos-de-salon:lang', '${lang}'); 1`);
  };
  const toResult = async () => {
    await b.open(`${SITE}/queens/?test&lang=${lang}`, 2500);
    ok(await b.until(`!!document.getElementById('btn-empezar')`, 8000), `${lang}: the cover`);
    await ev(`document.getElementById('btn-empezar').click(); 1`);
    ok(await b.until(`!!document.getElementById('btn-rendirse')`, 9000), `${lang}: the board`);
    await ev(`window.confirm = () => true; document.getElementById('btn-rendirse').click(); 1`);
    ok(await b.until(`!!document.getElementById('btn-fin')`, 5000), `${lang}: given up`);
    await ev(`document.getElementById('btn-fin').click(); 1`);
    ok(await b.until(`window.__copa?.estado.pantalla === 'resultado' && !!document.getElementById('btn-fin-menu')`, 6000), `${lang}: the result with its exits`);
  };
  try {
    // What players see: the flag held off
    await fresh();
    await toResult();
    await new Promise(r => setTimeout(r, 1200));
    ok(!(await ev(`!!document.querySelector('.uad-fin')`)), `${lang}: flag off, no Uno al día line`);

    // The lab: the flag on
    b.flags({ [FLAG]: 'lab' });
    await fresh();
    await b.open(`${SITE}/queens/?test&lang=${lang}`, 2500);
    ok(await b.until(`!!document.getElementById('btn-empezar')`, 8000), `${lang}: the cover`);
    await new Promise(r => setTimeout(r, 1200));
    ok(!(await ev(`!!document.querySelector('.uad-fin')`)), `${lang}: not on the cover`);
    await toResult();
    ok(await b.until(`!!document.querySelector('#fin-salidas .uad-fin')`, 5000), `${lang}: flag on, the line comes under the exits`);
    const r = JSON.parse(await ev(`(()=>{const a=document.querySelector('.uad-fin'),m=document.getElementById('btn-fin-menu'),ir=a.querySelector('.uad-fin-ir'),ra=a.getBoundingClientRect(),rm=m.getBoundingClientRect();
      return JSON.stringify({txt:a.querySelector('.uad-fin-txt').textContent, ir:ir.textContent, href:a.getAttribute('href'), after:ra.top>=rm.bottom, gap:Math.round(ra.top-rm.bottom), h:ra.height, l:ra.left, rr:innerWidth-ra.right,
        color:getComputedStyle(ir).color, btn:a.classList.contains('btn'), yellow:[...document.querySelectorAll('.btn--yellow')].filter(x=>x.offsetParent).length, hscroll:document.documentElement.scrollWidth>innerWidth,
        cut:a.querySelector('.uad-fin-txt').scrollWidth>a.querySelector('.uad-fin-txt').clientWidth})})()`));
    console.log(`  ${lang} ${width}px: «${r.txt} ${r.ir}» ${r.h}px tall, ${r.gap}px under «Volver al menú», margins ${Math.round(r.l)}/${Math.round(r.rr)}px, name cut: ${r.cut}`);
    ok(r.txt === LINE[lang], `${lang}: it names today's game (${r.txt})`);
    ok(r.ir === PLAY[lang], `${lang}: and says ${PLAY[lang]}`);
    ok(new RegExp(`${ALL_GAMES.find(g => g.id === today)?.slug || ''}.*[?&]today`).test(r.href), `${lang}: it opens today's game in Uno al día (${r.href})`);
    ok(r.after && r.gap >= 8, `${lang}: under «Volver al menú», with its gap (${r.gap} px)`);
    // One line at 390 px; at 320 a long name may take a second one, never cut
    ok(r.h >= 44 && r.h < (width >= 390 ? 60 : 80) && !r.cut, `${lang}: ${width >= 390 ? 'one line' : 'at most two lines'}, nothing cut, 44 px or more to tap (${r.h} px)`);
    ok(r.color === 'rgb(46, 230, 214)' && !r.btn, `${lang}: «Jugar» in cyan, not a button (C-19)`);
    ok(r.yellow <= 1, `${lang}: still one yellow button on the result`);
    ok(!r.hscroll, `${lang}: no sideways scroll at ${width} px`);
    ok(Math.abs(r.l - r.rr) <= 1, `${lang}: even margins`);
    await ev(`document.querySelector('.uad-fin').scrollIntoView({block:'center'}); 1`);
    await b.shot(`result-${lang}-${width}`);

    // Today's game played on this phone: no line
    await ev(`localStorage.setItem('${KEY}', JSON.stringify({ dias: { '${E2E_DAY}': { j: '${today}', s: 70, ms: 60000, at: Date.now(), n: 1 } } })); 1`);
    await toResult();
    await new Promise(r => setTimeout(r, 1200));
    ok(!(await ev(`!!document.querySelector('.uad-fin')`)), `${lang}: today's game played, no line`);
  } catch (e) { ok(false, `${lang}: ${e.message}`); }
  await b.close?.();
}
process.exit(failures ? 1 : 0);
