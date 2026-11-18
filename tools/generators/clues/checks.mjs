// The mechanical checks of Agentes' clues (learning piece 1, step 1.2; rubric M1 to M3 in
// docs/learning/01-content-pipeline.md). A clue is a deck entry { pista, si, casi }; a board is what
// engine.js `generar` returns. The judge (step 1.3) and the generator (1.4) build on these.
//   node tools/generators/clues/checks.mjs            every deck: M1 and M2 per clue, M3 over 300 boards
//   node tools/generators/clues/checks.mjs --boards 1000
import { generar } from '../../../public/cup/games/agents/engine.js';

const WORD = /^[A-ZÁÉÍÓÚÜÑÇÃÕÂÊÔÀ]+$/;

/** M1 (deck shape) and M2 (the clue is not its own answer): `[{ id, msg }]`, empty when it passes. */
export function checkClue(x) {
  const out = [];
  const m1 = msg => out.push({ id: 'M1', msg }), m2 = msg => out.push({ id: 'M2', msg });
  for (const w of [x.pista, ...x.si, ...x.casi]) {
    if (!WORD.test(w)) m1(`${w} is not one word in capitals`);
    else if (w.length > 15) m1(`${w} has more than 15 letters`);
  }
  if (x.si.length < 9 || x.si.length > 10) m1(`${x.si.length} si words (9 or 10)`);
  if (x.casi.length !== 3) m1(`${x.casi.length} casi words (3)`);
  const all = [...x.si, ...x.casi];
  if (new Set(all).size !== all.length) m1('a word is repeated');
  if (all.includes(x.pista)) m2(`${x.pista} is among its own words`);
  for (const w of x.si) if (w !== x.pista && w.includes(x.pista)) m2(`${w} contains the clue ${x.pista}`);
  return out;
}

/** M3: a clue with as many of its temptations on the board as it has agents (the count cannot pick the group). */
export function boardM3(t) {
  return t.pistas.flatMap((p, i) => {
    const tempting = t.cartas.filter(c => c.tipo !== 'agente' && c.tienta === i).length;
    return tempting >= p.n ? [{ id: 'M3', msg: `${p.pista}: ${tempting} temptations for ${p.n} agents` }] : [];
  });
}

/** Share of `n` generated boards that break M3, per language. */
export function m3Rate(lang, n = 300) {
  let bad = 0;
  for (let i = 0; i < n; i++) if (boardM3(generar(`m3:${i}`, { lang })).length) bad++;
  return { bad, n };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const n = Number(process.argv[process.argv.indexOf('--boards') + 1]) || 300;
  let failed = 0;
  for (const lang of ['es', 'en', 'pt']) {
    const file = { es: 'clues.js', en: 'clues-en.js', pt: 'clues-pt.js' }[lang];
    const { PISTAS } = await import(`../../../public/cup/games/agents/${file}`);
    const hits = PISTAS.flatMap(x => checkClue(x).map(h => `${x.pista} ${h.id}: ${h.msg}`));
    failed += hits.length;
    const { bad } = m3Rate(lang, n);
    console.log(`${lang}: ${PISTAS.length} clues, ${hits.length} M1/M2 hit(s); M3 on ${bad} of ${n} boards (${Math.round(100 * bad / n)}%)`);
    for (const h of hits) console.log(`  ${h}`);
  }
  process.exit(failed ? 1 : 0);
}
