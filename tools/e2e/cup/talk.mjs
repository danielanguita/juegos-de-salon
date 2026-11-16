// Comments on each other's results in a cup (D-562, issue #1488), behind the lab flag `cup-talk`:
// localhost holds the lab key. On the player demo's table, once the player played today (only today
// is talked about): a 💬 under each player's points opens a text field under the row, without moving
// the page; the comment (emojis in the text) shows stacked on that player's row for everyone, in the
// order they came; one per player and row, so the 💬 goes; an offensive one is stopped; the author
// edits theirs (the field opens filled) and deletes it; the row's player hides one and shows it again. Three languages, no sideways scroll.
import { output } from '../output.mjs';
import { launch, sleep } from '../cdp.mjs';
import { LOCALES } from '../../../public/cup/rules.js';

const SITE = process.env.SITE || process.env.SITIO || 'http://localhost:8765';
const OUT = output();
const ok = (cond, msg) => { console.log(`${cond ? '✓' : '✗'} ${msg}`); if (!cond) process.exitCode = 1; };
const b = await launch({ dir: `${OUT}/p`, out: OUT });
const ev = x => b.evaluate(x);
const waitFor = async (cond, cap = 40) => { for (let i = 0; i < cap && !await ev(cond); i++) await sleep(250); return ev(cond); };
const row = pid => `document.querySelector('.tabla .fila[data-pid="${pid}"]')`;
const comments = pid => `[...${row(pid)}.querySelectorAll('.fila-comentario')].map(p=>p.textContent)`;
const KEY = 'juegos-de-salon:copa:prueba';
const edit = fn => ev(`(()=>{const db=JSON.parse(localStorage.getItem('${KEY}'));const code=new URLSearchParams(location.search).keys().toArray().find(k=>/^[A-Z]{5}$/.test(k));
  const L=db[code], now=Date.now()+(Number(localStorage.getItem('${KEY}:reloj'))||0);
  const d=Object.keys(L.meta.win).map(Number).filter(k=>L.meta.win[k].a<=now).sort((a,b)=>b-a)[0];
  const me=Object.keys(L._seats).find(p=>!Object.keys(L._seats[p])[0].startsWith('otro-'));
  const out=(${fn})(L,d,me,now);localStorage.setItem('${KEY}',JSON.stringify(db));return out;})()`);
// The demo's player has not played today: their result of today goes in, as if they had
const playToday = async () => {
  const me = await edit(`(L,d,me,now)=>{(L.results[d]||={})[me]={s:50,ms:60000,t:'x',r:'50/100',at:now};return me;}`);
  await ev('location.reload()'); await sleep(2500);
  return me;
};
const write = async text => {
  await ev(`(()=>{const i=document.querySelector('.charla-input');i.focus();i.value=${JSON.stringify(text)};i.dispatchEvent(new KeyboardEvent('keydown',{key:'Enter',bubbles:true}));})()`);
  await sleep(500);
};

let ME, OTHER;
for (const lang of ['es', 'en', 'pt']) {
  await b.go(`${SITE}/cup/?test&demo=player&lang=${lang}`, 2000);
  ME = await playToday();
  OTHER = await ev(`document.querySelector('.tabla .fila:not(.yo) .fila-charla')?.dataset.pid`);
  ok(!!OTHER && await ev(`!!${row(ME)}.querySelector('.fila-charla')`), `${lang}: a 💬 under the points, your own row too`);
  ok(!await ev(`!!document.getElementById('charla')`), `${lang}: no field until tapped`);
  await ev(`${row(OTHER)}.scrollIntoView({block:'center'})`);
  const y0 = await ev('scrollY');
  await ev(`${row(OTHER)}.querySelector('.fila-charla').click()`);
  ok(await waitFor(`document.getElementById('charla')?.previousElementSibling===${row(OTHER)}`), `${lang}: the field opens right under the row`);
  ok(Math.abs(await ev('scrollY') - y0) < 2, `${lang}: without moving the page`);
  ok(await ev(`document.getElementById('charla').querySelectorAll('input').length===1 && !document.getElementById('charla').querySelector('.chip,[data-e]')`), `${lang}: only a text field, no reactions, no day`);
  ok(!await ev(`document.documentElement.scrollWidth>innerWidth`), `${lang}: no sideways scroll`);
}

// Comment with an emoji in the text; it shows on the row, and the 💬 goes
await write('🔥 ¡Qué buen día!');
ok(await waitFor(`${comments(OTHER)}.some(t=>t.includes('🔥 ¡Qué buen día!'))`), 'the comment shows on the player\'s row, emoji included');
ok(!await ev(`!!document.getElementById('charla')`) && !await ev(`!!${row(OTHER)}.querySelector('.fila-charla')`), 'the field closes; one comment each, so the 💬 goes');

// Two more, from other players, later: stacked in the order they came
await edit(`(L,d,me,now)=>{const t=((L._talk||={}).talk||={});const r=((t[d]||={})[${JSON.stringify(OTHER)}]||={});
  const others=Object.keys(L.players).filter(p=>p!==me&&p!==${JSON.stringify(OTHER)});r[others[0]]={c:'Uf',at:now+1000};r[others[1]]={c:'Ganaste',at:now+2000};
  ((t[d]||={})[me]||={})[others[0]]={c:'Suerte la próxima',at:now+3000};}`);
await ev('location.reload()'); await sleep(2500);
const list = await ev(comments(OTHER));
ok(list.length === 3 && list[0].includes('Qué buen día') && list[1].includes('Uf') && list[2].includes('Ganaste'), `the comments stack in the order they came (${list.join(' | ')})`);

// An offensive one is stopped; my own row
await ev(`${row(ME)}.querySelector('.fila-charla').click()`);
await waitFor(`!!document.querySelector('.charla-input')`);
await write('pura mierda');
ok(await ev(`document.querySelector('.charla-aviso')?.textContent`) === LOCALES.pt.talkOffensive, 'an offensive comment is stopped, and says why');
await write('Hoy me fue pésimo 😩');
ok(await waitFor(`${comments(ME)}.some(t=>t.includes('pésimo'))`), 'a player comments on their own result');

// Hide one on my row, show it again; delete mine
await ev(`[...${row(ME)}.querySelectorAll('.fila-comentario')].find(p=>p.textContent.includes('Suerte')).querySelector('.charla-accion').click()`);
ok(await waitFor(`!![...${row(ME)}.querySelectorAll('.fila-comentario.oculto')].find(p=>p.textContent.includes('Suerte'))`), 'I hide a comment on my row: still shown to me, faded');
await ev(`${row(ME)}.scrollIntoView({block:'start'})`);
await b.shot('cup-talk');
await ev(`${row(ME)}.querySelector('.fila-comentario.oculto .charla-accion').click()`);
ok(await waitFor(`!${row(ME)}.querySelector('.fila-comentario.oculto')`), 'and show it again');
// Edit mine: the same field under the row, already filled
await ev(`[...${row(OTHER)}.querySelectorAll('.fila-comentario')].find(p=>p.textContent.includes('Qué buen día')).querySelector('.charla-editar').click()`);
ok(await waitFor(`document.querySelector('.charla-input')?.value==='🔥 ¡Qué buen día!' && document.getElementById('charla').previousElementSibling===${row(OTHER)}`), 'Edit opens the field under the row with my comment');
await write('🔥🔥 ¡Qué buen día, crack!');
ok(await waitFor(`${comments(OTHER)}.some(t=>t.includes('crack')) && !${comments(OTHER)}.some(t=>t.includes('día!'))`), 'the edited comment replaces it, in its place');
await ev(`window.confirm=()=>true; [...${row(OTHER)}.querySelectorAll('.fila-comentario')].find(p=>p.textContent.includes('crack')).querySelector('.charla-accion:not(.charla-editar)').click()`);
ok(await waitFor(`!${comments(OTHER)}.some(t=>t.includes('crack')) && !!${row(OTHER)}.querySelector('.fila-charla')`), 'the author deletes theirs, and the 💬 comes back');
await b.close();
