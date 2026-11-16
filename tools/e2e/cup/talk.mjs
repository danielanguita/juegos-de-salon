// Reactions and comments on each other's results in a cup (D-562, issue #1488), behind the lab flag
// `cup-talk`: localhost holds the lab key. On the player demo's board: react, change and take back
// a reaction, comment on another result and on your own, an offensive comment is stopped, delete
// your comment, hide and show again a comment someone left on your row; three languages, no sideways scroll.
import { output } from '../output.mjs';
import { launch, sleep } from '../cdp.mjs';
import { LOCALES } from '../../../public/cup/rules.js';

const SITE = process.env.SITE || process.env.SITIO || 'http://localhost:8765';
const OUT = output();
const ok = (cond, msg) => { console.log(`${cond ? '✓' : '✗'} ${msg}`); if (!cond) process.exitCode = 1; };
const b = await launch({ dir: `${OUT}/p`, out: OUT });
const ev = x => b.evaluate(x);
const waitFor = async (cond, cap = 40) => { for (let i = 0; i < cap && !await ev(cond); i++) await sleep(250); return ev(cond); };
const row = n => `document.querySelectorAll('#charla .charla-fila')[${n}]`;
const other = `[...document.querySelectorAll('#charla .charla-fila')].find(f=>!f.classList.contains('yo'))`;
const mine = `document.querySelector('#charla .charla-fila.yo')`;
const write = async text => {
  await ev(`(()=>{const i=document.querySelector('.charla-input');i.focus();i.value=${JSON.stringify(text)};i.dispatchEvent(new KeyboardEvent('keydown',{key:'Enter',bubbles:true}));})()`);
  await sleep(400);
};

for (const lang of ['es', 'en', 'pt']) {
  const T = LOCALES[lang];
  await b.go(`${SITE}/cup/?test&demo=player&lang=${lang}`, 2000);
  ok(await waitFor(`!!document.querySelector('#charla .charla-fila')`), `${lang}: the board has the reactions panel`);
  ok(await ev(`document.querySelector('#charla .lead').textContent`) === T.talkTitle, `${lang}: titled «${T.talkTitle}»`);
  ok(!await ev(`document.documentElement.scrollWidth>innerWidth`), `${lang}: no sideways scroll`);
}

// React, change it, take it back
await ev(`${other}.querySelector('[data-e=fire]').click()`);
ok(await waitFor(`${other}.querySelector('[data-e=fire]').classList.contains('on')`), 'a reaction is marked as mine');
ok(await waitFor(`(${other}.querySelector('.charla-cuenta')?.textContent||'').includes('🔥')`), 'and counted on the row');
await ev(`${other}.querySelector('[data-e=clap]').click()`);
ok(await waitFor(`${other}.querySelector('[data-e=clap]').classList.contains('on') && !${other}.querySelector('[data-e=fire]').classList.contains('on')`), 'one reaction each: another one replaces it');
await ev(`${other}.querySelector('[data-e=clap]').click()`);
ok(await waitFor(`!${other}.querySelector('.charla-cuenta')`), 'tapping it again takes it back');

// Comment on another result, then on my own; an offensive one is stopped
await ev(`${other}.querySelector('.charla-comentar').click()`);
ok(await waitFor(`document.activeElement?.classList.contains('charla-input')`), 'Comment opens the field, focused');
await write('¡Qué buen día!');
ok(await waitFor(`(${other}.querySelector('.charla-comentario')?.textContent||'').includes('¡Qué buen día!')`), 'the comment shows on the row');
ok(!await ev(`!!${other}.querySelector('.charla-comentar')`), 'one comment each: no second Comment');
await ev(`${mine}.querySelector('.charla-comentar').click()`);
await write('pura mierda');
ok(await ev(`(document.querySelector('.charla-aviso')?.textContent||'')`) === LOCALES.pt.talkOffensive, 'an offensive comment is stopped, and says why');
await write('Hoy me fue pésimo');
ok(await waitFor(`(${mine}.querySelector('.charla-comentario')?.textContent||'').includes('pésimo')`), 'a player comments on their own result');

// Delete my comment
await ev(`window.confirm=()=>true; ${other}.querySelector('.charla-comentario .charla-accion').click()`);
ok(await waitFor(`!${other}.querySelector('.charla-comentario') && !!${other}.querySelector('.charla-comentar')`), 'the author deletes their comment');

// Someone left a comment on my row: I hide it, then show it again
await ev(`(()=>{const K='juegos-de-salon:copa:prueba';const db=JSON.parse(localStorage.getItem(K));const code=new URLSearchParams(location.search).keys().toArray().find(k=>/^[A-Z]{5}$/.test(k));
  const me=${mine}.dataset.pid, him=${other}.dataset.pid, L=db[code], d=document.querySelector('#charla .chip--hot')?.dataset.dia || Object.keys(L.results).filter(k=>L.results[k][me]).sort((a,b)=>b-a)[0];
  ((L._talk.talk[d]||={})[me]||={})[him]={c:'Suerte la próxima',at:Date.now()};localStorage.setItem(K,JSON.stringify(db));
  new BroadcastChannel(K).postMessage(1);window.dispatchEvent(new StorageEvent('storage',{key:K}));})()`);
await ev(`location.reload()`); await sleep(2500);
ok(await waitFor(`(${mine}?.textContent||'').includes('Suerte la próxima')`), "another player's comment shows on my row");
await ev(`[...${mine}.querySelectorAll('.charla-comentario')].find(p=>p.textContent.includes('Suerte')).querySelector('.charla-accion').click()`);
ok(await waitFor(`!![...${mine}.querySelectorAll('.charla-comentario.oculto')].find(p=>p.textContent.includes('Suerte'))`), 'I hide it: still shown to me, marked hidden');
await ev(`${mine}.scrollIntoView({block:'center'})`);
await b.shot('cup-talk');
await ev(`${mine}.querySelector('.charla-comentario.oculto .charla-accion').click()`);
ok(await waitFor(`!${mine}.querySelector('.charla-comentario.oculto')`), 'and show it again');
await b.close();
