// ☀️ Tango scores the time in La Copa too (D-607), end to end: a 3-day Cup created while `tango-time`
// is on (the e2e flags hold it) with Tango in its week saves `tango:time`; a second player signs up;
// Tango's waiting room says the time scores, the board comes out by time (no mistakes counter, the hint
// at +15 s, the mistakes line says they cost nothing), and a board solved with a mistake on the way
// still scores 100. A cup from before (`tango` bare) keeps 10 a mistake: public/cup/engine.test.mjs.
// Prints ✗ if anything fails.
import { output } from '../output.mjs';
import { launch, sleep } from '../cdp.mjs';
import { mkdirSync } from 'node:fs';

const OUT = output('/tmp/cup-tango-time');
mkdirSync(OUT, { recursive: true });
const b = await launch({ dir: `${OUT}/profile`, out: OUT, clock: true });
const SITE = process.env.SITE || 'http://localhost:8765';
const ok = (cond, msg) => { console.log(`${cond ? '✓' : '✗'} ${msg}`); if (!cond) process.exitCode = 1; };
const ev = expr => b.evaluate(expr);
const click = sel => ev(`(()=>{const x=document.querySelector(${JSON.stringify(sel)});if(!x)return 'missing';if(x.disabled)return 'disabled';x.click();return 'ok'})()`);
const DAY = 24 * 60 * 60 * 1000;

try {
  await b.open(`${SITE}/cup/?test&lang=es`, 1200);
  await ev(`window.confirm=()=>true; navigator.share=async()=>{}; 1`);
  await b.until(`!!document.getElementById('btn-crear')`, 5000);
  await click('#btn-crear');
  await b.until(`document.querySelectorAll('#crear-body input:not(.fecha):not(#crear-link)').length >= 4`, 5000);
  await ev(`(()=>{const i=[...document.querySelectorAll('#crear-body input:not(.fecha):not(#crear-link)')];i[0].value='Copa Tango';i[1].value='Cata';i[2].value='1111';i[3].value='1111';return 1})()`);
  await ev(`(()=>{const o=[...document.querySelectorAll('#crear-body .opcion')];o.find(x=>/^Copa de 3 días/.test(x.textContent)).click();o.find(x=>/^Hoy/.test(x.textContent.trim())).click();return 1})()`);
  await sleep(200);
  const has = await ev(`(()=>{const has=()=>[...document.querySelectorAll('#cal-elegir .event[data-dia]')].some(x=>x.dataset.juego==='tango');
    for(let k=0;k<400&&!has();k++)document.getElementById('btn-azar').click();return has()})()`);
  ok(has, 'the random week can bring Tango');
  ok(!await ev(`!!document.querySelector('#cal-variantes [data-variantes="tango"]')`), 'Tango\'s rule is not the admin\'s choice: no variant row for it');
  await click('#btn-crear-go'); await sleep(900);
  const cal = await ev('__copa.estado.copa.meta.cal');
  ok(/(^|,)tango:time(,|$)/.test(cal), `the cup saves Tango with its new rule (${cal})`);
  const CODE = await ev('__copa.estado.code');

  await ev('sessionStorage.clear(); 1');
  await b.open(`${SITE}/cup/?${CODE}&test&lang=es`, 1200);
  await click('#tab-nuevo'); await sleep(150);
  await ev(`(()=>{const i=[...document.querySelectorAll('#entrar-body input')];i[0].value='Javi';i[1].value='2222';i[2].value='2222';return 1})()`);
  await click('#btn-inscribir'); await b.until(`__copa.estado.pantalla === 'tablero'`, 500, 30);

  const d = cal.split(',').indexOf('tango:time') + 1;
  if (d === 2) {
    await ev(`(async()=>{const E=await import('/cup/engine.js');const m=__copa.estado.copa.meta;__copa.store.adelantar(E.medianoche(m.start,m.tz)+${DAY}+3*3600e3-__copa.store.now());return 1})()`);
    await b.open(`${SITE}/cup/?${CODE}&test&lang=es`, 1200);
  }
  ok(await b.until(`!!document.querySelector('[data-dia="${d}"]')`, 300, 20), `Tango's day (${d}) can be played`);
  await click(`[data-dia="${d}"]`); await sleep(400);
  ok(/Puntúa el tiempo/.test(await ev(`document.querySelector('.screen.active').textContent`)), 'the waiting room\'s How to play says the time scores');
  ok(!await ev(`!!document.getElementById('variante-dia')`), 'and names no variant: it is the game\'s rule, not a version');
  await b.shot('waiting');
  await click('#btn-empezar');
  await b.until(`!document.getElementById('cuenta') || document.getElementById('cuenta').classList.contains('ya')`, 8000, 50); await sleep(1200);
  // The day's board as La Copa makes it (the hook of tournament.mjs, with the day's rule)
  await ev(`(async()=>{const JUEGOS=await (await import('/cup/games/index.js')).loadAll();const E=await import('/cup/engine.js');const m=__copa.estado.copa.meta;
    window.__playing={p:JUEGOS.tango.generar(__copa.estado.code, ${d}, {variante:E.varianteDelDia(m, ${d})})};return 1})()`);
  ok(await ev('window.__playing.p.porTiempo') === true, 'the board comes out by time');
  ok(await ev(`[...document.querySelectorAll('.tango-juego p.muted')].every(x => !/Errores/.test(x.textContent))`), 'no mistakes counter');
  ok(/\+15 s/.test(await ev(`document.getElementById('btn-pista')?.textContent || ''`)), 'the hint adds 15 s, it takes off no points');
  ok(await b.until(`/Equivocarse no resta/.test(document.getElementById('regla-errores')?.textContent || '')`, 200, 20), 'the mistakes line says they cost nothing');
  await b.shot('board');

  // A mistake on the way, then the solution: still 100 (a fast solve), not 90
  const taps = await ev(`(async()=>{const m=await import('/cup/games/tango/engine.js');const p=window.__playing.p;
    const free=p.sol.map((v,i)=>i).filter(i=>p.dadas[i]===undefined);
    const clashes=(pre,i)=>p.sol[i]===m.LUNA&&m.estado(p,[...pre,i]).mal.size>m.estado(p,pre).mal.size;
    let pre=null;
    for(const i of free) if(!pre&&clashes([],i)) pre=[i];
    for(const a of free) if(!pre&&!m.estado(p,[a]).mal.size) for(const i of free) if(!pre&&i!==a&&clashes([a],i)) pre=[a,i];
    pre=pre||[];
    // Another cell tapped after the clash: that is when it counts (D-102)
    const other=free.find(i=>!pre.includes(i));
    if(pre.length) pre.push(other);
    const after=m.estado(p,pre);
    const out=[...pre];
    for(const i of free){const n=(p.sol[i]-after.g[i]+3)%3;for(let k=0;k<n;k++)out.push(i);}
    return JSON.stringify({out,mistakes:m.estado(p,out).errores})})()`).then(JSON.parse);
  for (const i of taps.out) await click(`.tan[data-i="${i}"]`);
  await sleep(600);
  ok(await b.until(`!!document.getElementById('btn-fin')`, 200, 30), 'the board is solved');
  await click('#btn-fin'); await sleep(1200);
  const s = await ev(`(async()=>{const st=__copa.estado.copa;const r=st?.res?.[${d}]||st?.results?.[${d}];return r?Object.values(r).map(x=>x.s).join():''})()`);
  ok(taps.mistakes >= 1, `mistakes left on the way: ${taps.mistakes}`);
  ok(/(^|\D)100(\D|$)/.test(await ev(`document.querySelector('.screen.active').innerText`)) || /100/.test(s), `a fast solve scores 100 even with a mistake (${s || 'see the result screen'})`);
  await b.shot('result');
} finally {
  await b.close();
}
