/**
 * The turn's action is above the fold on a small phone (D-520, D-570): mid-game, once the player has
 * picked or played, the button that confirms it and the feedback it brings must be seen whole without
 * scrolling at 320×568, in every language. landing-fold.mjs checks the covers; this checks the turn.
 *
 *   node tools/e2e/play-fold.mjs [<out folder>] [--only hangman]
 *
 * It was born from a player pass at 320×568: in Hangman «Try the E» and «Buy a letter» sat below the
 * fold (a scroll for every letter), and in Bulls and Cows solo the clues of a guess did. look.mjs
 * reports "buttons off screen" too, but only at the height it is given (844 by default).
 *
 * Each screen names its steps and what must be in view (`must`, CSS selectors, each one whole).
 * A new game screen with a turn action joins SCREENS.
 */
import { mkdirSync } from 'node:fs';
import { launch, sleep } from './cdp.mjs';
import { output } from './output.mjs';
import { LANGS, EN_LABS, LABS_KEY } from '../../public/assets/js/i18n.js';

const SITE = process.env.SITE || process.env.SITIO || 'http://localhost:8765';
const OUT = output('/tmp/e2e/play-fold');
mkdirSync(OUT, { recursive: true });
const [WIDTH, HEIGHT] = [320, 568];

const SCREENS = [
  {
    name: 'hangman letter', route: 'hangman',
    steps: [
      `document.querySelectorAll('.mode')[2].click()`,
      `(()=>{const i=document.querySelector('#setup-form input');i.value='Javi';i.dispatchEvent(new Event('input',{bubbles:true}))})()`,
      `document.querySelector('#setup-actions .btn').click()`,
      `[...document.querySelectorAll('#keyboard button')].find(b=>!b.disabled)?.click()`,
    ],
    must: ['#confirm .btn--yellow', '#confirm .buy'],
  },
  {
    // The rules screen of playing alone: its Start button, not only the rules above it
    name: 'bulls-and-cows solo rules', route: 'bulls-and-cows',
    steps: [`document.querySelectorAll('.mode')[2].click()`],
    must: ['#btn-solo-empezar'],
  },
  {
    name: 'bulls-and-cows solo guess', route: 'bulls-and-cows',
    steps: [
      `document.querySelectorAll('.mode')[2].click()`,
      `document.getElementById('btn-solo-empezar').click()`,
      ...['0123', '4567'].map(n => `(()=>{for(const d of '${n}')[...document.querySelectorAll('.screen.active .keypad button')].find(x=>x.textContent===d)?.click();document.querySelector('.screen.active .keypad .ok')?.click()})()`),
    ],
    // The submit key, and the newest guess with its clues (the first row on a short phone)
    must: ['.screen.active .keypad .ok', '.screen.active .board--solo li:last-child'],
  },
];

const i = process.argv.indexOf('--only');
const only = i < 0 ? [] : process.argv[i + 1].split(',');

const MEASURE = must => `(()=>JSON.stringify(${JSON.stringify(must)}.map(sel => {
  const x = document.querySelector(sel);
  if (!x || !x.getClientRects().length) return { sel, missing: true };
  const r = x.getBoundingClientRect();
  return { sel, top: Math.round(r.top + scrollY), bottom: Math.round(r.bottom + scrollY), fold: innerHeight };
})))()`;

let failures = 0;
const b = await launch({ dir: `${OUT}/profile`, out: OUT, width: WIDTH, height: HEIGHT });
for (const { name, route, steps, must } of SCREENS.filter(s => !only.length || only.includes(s.route))) {
  for (const lang of LANGS) {
    const labs = EN_LABS.includes(lang) ? `localStorage.setItem('${LABS_KEY}', '${lang}');` : '';
    await b.open(`${SITE}/${route}/?test`);
    await b.evaluate(`localStorage.clear(); sessionStorage.clear(); localStorage.setItem('juegos-de-salon:lang', '${lang}'); ${labs} 1`);
    await b.open(`${SITE}/${route}/?test`);
    for (const step of steps) { await b.evaluate(`(()=>{ ${step} ; return 1})()`); await sleep(700); }
    await b.settle(800);
    const tag = `${name} ${WIDTH}×${HEIGHT} ${lang}`;
    const bad = JSON.parse(await b.evaluate(MEASURE(must))).filter(m => m.missing || m.bottom > m.fold);
    if (!bad.length) { console.log(`✓ ${tag}`); continue; }
    failures++;
    for (const m of bad) console.log(`✗ ${tag}: ${m.sel} ${m.missing ? 'not found' : `ends at ${m.bottom} px, ${m.bottom - m.fold} px below the fold`}`);
    await b.shot(`${name.replace(/ /g, '-')}-${lang}`);
  }
}
b.close();
console.log(failures ? `\n✗ ${failures} screen(s) with the turn's action below the fold` : '\n✓ every turn shows its action without scrolling');
process.exit(failures ? 1 : 0);
