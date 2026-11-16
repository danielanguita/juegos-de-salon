// Reactions and comments on each other's results in a cup (D-562, issue #1488), behind the lab flag
// `cup-talk`: localhost holds the lab key. On the player demo's table: each row ends with a 💬 that
// opens that player's drawer under it; react, change and take back a reaction, comment on another
// result and on your own, an offensive comment is stopped, delete your comment, hide and show again a
// comment someone left on your row; the 💬 counts what a player got; three languages, no sideways scroll.
import { output } from '../output.mjs';
import { launch, sleep } from '../cdp.mjs';
import { LOCALES } from '../../../public/cup/rules.js';

const SITE = process.env.SITE || process.env.SITIO || 'http://localhost:8765';
const OUT = output();
const ok = (cond, msg) => { console.log(`${cond ? '✓' : '✗'} ${msg}`); if (!cond) process.exitCode = 1; };
const b = await launch({ dir: `${OUT}/p`, out: OUT });
const ev = x => b.evaluate(x);
const waitFor = async (cond, cap = 40) => { for (let i = 0; i < cap && !await ev(cond); i++) await sleep(250); return ev(cond); };
const me = `document.querySelector('.tabla .fila.yo .fila-charla').dataset.pid`;
const other = `[...document.querySelectorAll('.tabla .fila:not(.yo) .fila-charla')][0].dataset.pid`;
const button = pid => `document.querySelector('.fila-charla[data-pid="'+${pid}+'"]')`;
const drawer = `document.getElementById('charla')`;
const open = async id => {
  const pid = JSON.stringify(id);
  if (await ev(`${button(pid)}.classList.contains('on')`)) return;
  await ev(`${button(pid)}.click()`);
  await waitFor(`${button(pid)}?.classList.contains('on') && !!${drawer}`);
};
const write = async text => {
  await ev(`(()=>{const i=document.querySelector('.charla-input');i.focus();i.value=${JSON.stringify(text)};i.dispatchEvent(new KeyboardEvent('keydown',{key:'Enter',bubbles:true}));})()`);
  await sleep(400);
};

for (const lang of ['es', 'en', 'pt']) {
  await b.go(`${SITE}/cup/?test&demo=player&lang=${lang}`, 2000);
  ok(await waitFor(`document.querySelectorAll('.tabla .fila .fila-charla').length >= 2`), `${lang}: each row of the table ends with a 💬`);
  ok(!await ev(`!!${drawer}`), `${lang}: closed until tapped`);
  await open(await ev(other));
  ok(await ev(`${drawer}.previousElementSibling.querySelector('.fila-charla')?.classList.contains('on')`), `${lang}: the drawer opens right under its row`);
  ok(!await ev(`document.documentElement.scrollWidth>innerWidth`), `${lang}: no sideways scroll`);
}
const OTHER = await ev(other), ME = await ev(me);

// React, change it, take it back
await open(OTHER);
await ev(`${drawer}.querySelector('[data-e=fire]').click()`);
ok(await waitFor(`${drawer}?.querySelector('[data-e=fire]')?.classList.contains('on')`), 'a reaction is marked as mine');
ok(await waitFor(`(${drawer}.querySelector('.charla-cuenta')?.textContent||'').includes('🔥')`), 'and counted in the drawer');
ok(await waitFor(`${button(JSON.stringify(OTHER))}.querySelector('.fila-charla-n')?.textContent === '1'`), 'and on the row\'s 💬');
await ev(`${drawer}.querySelector('[data-e=clap]').click()`);
ok(await waitFor(`${drawer}.querySelector('[data-e=clap]').classList.contains('on') && !${drawer}.querySelector('[data-e=fire]').classList.contains('on')`), 'one reaction each: another one replaces it');
await ev(`${drawer}.querySelector('[data-e=clap]').click()`);
ok(await waitFor(`!${drawer}.querySelector('.charla-cuenta') && !${button(JSON.stringify(OTHER))}.querySelector('.fila-charla-n')`), 'tapping it again takes it back');

// Comment on another result, then on my own; an offensive one is stopped
await ev(`${drawer}.querySelector('.charla-comentar').click()`);
ok(await waitFor(`document.activeElement?.classList.contains('charla-input')`), 'Comment opens the field, focused');
await write('¡Qué buen día!');
ok(await waitFor(`(${drawer}.querySelector('.charla-comentario')?.textContent||'').includes('¡Qué buen día!')`), 'the comment shows in the drawer');
ok(!await ev(`!!${drawer}.querySelector('.charla-comentar')`), 'one comment each: no second Comment');
await open(ME);
ok(await ev(`document.querySelectorAll('#charla').length === 1 && !${button(JSON.stringify(OTHER))}.classList.contains('on')`), 'one drawer at a time');
await ev(`${drawer}.querySelector('.charla-comentar').click()`);
await write('pura mierda');
ok(await ev(`(document.querySelector('.charla-aviso')?.textContent||'')`) === LOCALES.pt.talkOffensive, 'an offensive comment is stopped, and says why');
await write('Hoy me fue pésimo');
ok(await waitFor(`(${drawer}.querySelector('.charla-comentario')?.textContent||'').includes('pésimo')`), 'a player comments on their own result');

// Delete my comment on the other row
await open(OTHER);
await ev(`window.confirm=()=>true; ${drawer}.querySelector('.charla-comentario .charla-accion').click()`);
ok(await waitFor(`!${drawer}.querySelector('.charla-comentario') && !!${drawer}.querySelector('.charla-comentar')`), 'the author deletes their comment');

// Someone left a comment on my row: I hide it, then show it again
await ev(`(()=>{const K='juegos-de-salon:copa:prueba';const db=JSON.parse(localStorage.getItem(K));const code=new URLSearchParams(location.search).keys().toArray().find(k=>/^[A-Z]{5}$/.test(k));
  const me=${JSON.stringify(ME)}, him=${JSON.stringify(OTHER)}, L=db[code], d=Object.keys(L.results).filter(k=>L.results[k][me]&&L.results[k][him]).sort((a,b)=>b-a)[0];
  ((L._talk.talk[d]||={})[me]||={})[him]={c:'Suerte la próxima',at:Date.now()};localStorage.setItem(K,JSON.stringify(db));})()`);
await ev(`location.reload()`); await sleep(2500);
await waitFor(`!!${button(JSON.stringify(ME))}`);
await open(ME);
ok(await waitFor(`(${drawer}?.textContent||'').includes('Suerte la próxima')`), "another player's comment shows on my row");
await ev(`[...${drawer}.querySelectorAll('.charla-comentario')].find(p=>p.textContent.includes('Suerte')).querySelector('.charla-accion').click()`);
ok(await waitFor(`!![...${drawer}.querySelectorAll('.charla-comentario.oculto')].find(p=>p.textContent.includes('Suerte'))`), 'I hide it: still shown to me, marked hidden');
await ev(`${drawer}.previousElementSibling.scrollIntoView({block:'start'})`);
await b.shot('cup-talk');
await ev(`${drawer}.querySelector('.charla-comentario.oculto .charla-accion').click()`);
ok(await waitFor(`!${drawer}.querySelector('.charla-comentario.oculto')`), 'and show it again');
await b.close();
