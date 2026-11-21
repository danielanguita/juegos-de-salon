// Cryptic (lab): plays today's three clues to the score (the owner, 2026-11-20): the easy one with a wrong
// guess, a hint and a reload, the medium one given up, the hard one with the day's last two hints; then a
// practice clue given up. The conformance checks run it in every language (tools/e2e/conformance.mjs).
import { output } from '../output.mjs';
import { launch, sleep } from '../cdp.mjs';

const SITE = process.env.SITE || 'http://localhost:8765';
const OUT = output();
const b = await launch({ port: 0, dir: OUT + '/p', out: OUT });
let failures = 0;
const ok = (cond, msg) => { console.log((cond ? '✓ ' : '✗ ') + msg); if (!cond) failures++; };
const type = async text => {
  await b.evaluate(`(() => { const i = document.getElementById('answer'); i.value = ${JSON.stringify(text)}; i.dispatchEvent(new Event('input')); document.getElementById('btn-check').click(); })(); 1`);
  await sleep(250);
};

await b.go(SITE + '/labs/cryptic/'); await b.evaluate('localStorage.clear(); 1'); await b.go(SITE + '/labs/cryptic/');
await b.shot('cover');
await b.evaluate("document.querySelector('#btn-play').click(); 1"); await sleep(300);
ok(await b.active() === 'screen-play', "today's first clue opens");
ok(/1 .* 3/.test(await b.evaluate("document.getElementById('clue-step').textContent")) && await b.evaluate('window.__cryptic.clue().l') === 'e', 'the day starts with the easy clue, 1 of 3');
ok(/\(\d+(,\d+)*\)$/.test(await b.evaluate("document.getElementById('clue').textContent")), 'the clue ends with its length');
const answer = await b.evaluate('window.__cryptic.answer()');
const n = answer.normalize('NFD').replace(/[̀-ͯ]/g, '').length;
ok(await b.evaluate("document.querySelectorAll('#tiles .tile').length") === n, 'one box per letter');
// One row, always (the owner): the longest answer of the bank fits the card without wrapping or overflowing
{
  const longest = await b.evaluate("(() => { const a = window.__cryptic.bank(); let i = 0; a.forEach((w, k) => { if (w.length > a[i].length) i = k; }); return i; })()");
  const back = await b.evaluate('JSON.stringify(window.__cryptic.state())');
  await b.evaluate(`window.__cryptic.practice(${longest}); 1`); await sleep(200);
  const row = await b.evaluate(`(() => { const t = [...document.querySelectorAll('#tiles .tile')], card = document.querySelector('.clue-card').getBoundingClientRect();
    return { one: new Set(t.map(x => Math.round(x.getBoundingClientRect().top))).size === 1, inside: t.every(x => { const r = x.getBoundingClientRect(); return r.left >= card.left && r.right <= card.right; }),
      fits: t.every(x => x.scrollWidth <= x.clientWidth + 1), n: t.length }; })()`);
  ok(row.one && row.inside && row.fits, `the longest answer (${row.n} letters) stays on one row inside the card`);
  await b.shot('longest');
  await b.go(SITE + '/labs/cryptic/'); await b.evaluate("document.querySelector('#btn-play').click(); 1"); await sleep(300);
}
// The player types straight into the boxes (the owner, 2026-11-19): a real tap on them, real keystrokes
const box = await b.evaluate("(() => { const r = document.querySelector('#tiles .tile').getBoundingClientRect(); return [r.x + r.width / 2, r.y + r.height / 2]; })()");
await b.tap(...box);
ok(await b.evaluate("document.activeElement?.id") === 'answer', 'a tap on the boxes is ready to type');
await b.send('Input.insertText', { text: 'ab1' });
await b.send('Input.insertText', { text: 'c' });
await sleep(100);
ok(await b.evaluate("[...document.querySelectorAll('#tiles .tile')].slice(0, 3).map(t => t.textContent).join('')") === 'ABC', 'letters land in the boxes, one each, other keys are left out');
ok(await b.evaluate("[...document.querySelectorAll('#tiles .tile')].findIndex(t => t.classList.contains('tile--at'))") === (n > 3 ? 3 : -1), 'the cursor moves on to the next box by itself');
await b.shot('typing');
await b.send('Input.insertText', { text: 'x'.repeat(30) });
await sleep(100);
ok(await b.evaluate("document.getElementById('answer').value.length") === n, 'no more letters than boxes');
await b.evaluate("(() => { const i = document.getElementById('answer'); i.value = ''; i.dispatchEvent(new Event('input')); })(); 1");

await type('X'.repeat(n - 1)); // a longer one cannot be typed: the boxes stop it
ok(await b.evaluate("document.getElementById('feedback').classList.contains('notice--warn')"), 'a guess with empty boxes is a warning, not counted');
await type('Z'.repeat(n));
ok(await b.evaluate("document.getElementById('feedback').classList.contains('notice--bad')"), 'a wrong guess says so');
ok(await b.evaluate('window.__cryptic.state().clues[0].guesses.length') === 1, 'only the guess of the right length counts');
ok(/5/.test(await b.evaluate("document.getElementById('btn-hint').textContent")), 'a hint on the easy clue costs 5 points');
await b.evaluate("document.getElementById('btn-hint').click(); 1"); await sleep(150);
ok(await b.evaluate("document.querySelectorAll('#hints li').length") === 1, 'the first hint shows');
ok(/2 de 3/.test(await b.evaluate("document.getElementById('hints-left').textContent")), 'and the day has 2 of its 3 hints left');
await b.shot('play');

// Resume (C-6): a reload in the middle comes back to the same clue with its hint
await b.go(SITE + '/labs/cryptic/');
await b.evaluate("document.querySelector('#btn-play').click(); 1"); await sleep(300);
ok(await b.evaluate('window.__cryptic.state().clues[0].hints') === 1, "today's clue resumes with its hint");

const step = async () => { await b.evaluate("document.getElementById('btn-next').click(); 1"); await sleep(300); };
await type(answer.toLowerCase());
ok(await b.active() === 'screen-step', "the answer shows how it is solved before the next clue");
ok(/\+15/.test(await b.evaluate("document.getElementById('step-title').textContent")), 'easy with one hint: 20 − 5 = +15');
ok(/20.*1.*5/.test(await b.evaluate("document.getElementById('step-line').textContent")), 'and it says why: worth 20, one hint of 5');
await b.shot('step');
await step();
ok(await b.evaluate('window.__cryptic.clue().l') === 'm' && /2 .* 3/.test(await b.evaluate("document.getElementById('clue-step').textContent")), 'then the medium clue, 2 of 3');
await b.evaluate("document.getElementById('btn-give-up').click(); document.getElementById('btn-give-up').click(); 1"); await sleep(300);
ok((await b.evaluate("document.getElementById('step-title').textContent")).includes(await b.evaluate('window.__cryptic.answer()')), 'giving up shows the answer');
ok(/0/.test(await b.evaluate("document.getElementById('step-line').textContent")), 'and that it scores 0');
await step();
ok(await b.evaluate('window.__cryptic.clue().l') === 'h', 'then the hard clue');
ok(/15/.test(await b.evaluate("document.getElementById('btn-hint').textContent")), 'a hint on the hard clue costs 15 points');
await b.evaluate("document.getElementById('btn-hint').click(); 1"); await sleep(150);
await b.evaluate("document.getElementById('btn-hint').click(); 1"); await sleep(150);
ok(!!(await b.evaluate("!!document.querySelector('#clue u.def')")), 'the second hint underlines the definition');
ok(await b.evaluate("document.getElementById('btn-hint').hidden") && /3/.test(await b.evaluate("document.getElementById('hints-left').textContent")), 'the day had 3 hints: none left, and it says so');
await b.shot('hard');
await type(await b.evaluate('window.__cryptic.answer()'));
ok(await b.active() === 'screen-step', 'the last clue shows its answer too');
await step();
ok(await b.active() === 'screen-result', 'then the score');
ok(/^35\b/.test(await b.evaluate("document.getElementById('result-title').textContent")), 'the score: 15 + 0 + (50 − 2 × 15) = 35 of 100');
ok(await b.evaluate("document.querySelectorAll('#result-solutions .solution').length") === 3, 'how each of the three is solved, with its points');
ok(/1/.test(await b.evaluate("document.getElementById('result-line').textContent")), 'the streak starts');
ok(await b.evaluate("!!document.querySelector('#fin-salidas a[href$=\"labs/\"]')"), 'the result goes back to the lab (C-19)');
await b.shot('result');

// Today is done: the cover says so, and the day opens on its result
await b.go(SITE + '/labs/cryptic/');
ok(/35/.test(await b.evaluate("document.getElementById('today-note').textContent")), "the cover shows today's score");
await b.evaluate("document.querySelector('#btn-play').click(); 1"); await sleep(300);
ok(await b.active() === 'screen-result', 'and today opens on its result');


// Practice: a clue from another day, given up
await b.evaluate("document.querySelector('#btn-practice-cover').click(); 1"); await sleep(300);
ok(await b.evaluate('window.__cryptic.state().practice') === true, 'practice opens another clue');
await b.evaluate("document.getElementById('btn-give-up').click(); 1"); await sleep(200);
ok(await b.active() === 'screen-play', 'the first tap on «Me rindo» only asks');
await b.evaluate("document.getElementById('btn-give-up').click(); 1"); await sleep(300);
ok(await b.active() === 'screen-result', 'practice is one clue: giving up reaches the result');
ok((await b.evaluate("document.getElementById('result-title').textContent")).includes(await b.evaluate('window.__cryptic.answer()')), 'giving up shows the answer');
ok(await b.evaluate("document.getElementById('btn-practice').className.includes('btn--yellow')"), 'after practice, another practice clue is the main action');

ok(!b.errors.length, 'no console errors' + (b.errors.length ? ': ' + b.errors[0].slice(0, 160) : ''));
b.close();
process.exit(failures ? 1 : 0);
