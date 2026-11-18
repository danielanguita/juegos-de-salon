// The judge's harness (learning piece 1, step 1.3). The model is called by hand from a session, never
// from a job (D-532): `prompt` prints the rubric and the cases for it; the session saves the model's
// JSON answer and `score` prints the agreement with the owner's labels.
//   node tools/generators/clues/judge.mjs prompt > /tmp/judge-input.md
//   node tools/generators/clues/judge.mjs score <answer.json>
import { readFileSync } from 'node:fs';

const here = f => new URL(f, import.meta.url);
const FILES = { es: 'clues.js', en: 'clues-en.js', pt: 'clues-pt.js' };

/** The labelled cases with their full entries: [{ id, label, entry }]. */
export async function cases() {
  const c = JSON.parse(readFileSync(here('./cases.json'), 'utf8'));
  const decks = {};
  for (const [l, f] of Object.entries(FILES)) decks[l] = (await import(`../../../public/cup/games/agents/${f}`)).PISTAS;
  const out = c.labelled.map(x => ({ id: `${x.lang}:${x.pista}`, label: x.label, entry: decks[x.lang].find(y => y.pista === x.pista), lang: x.lang }));
  c.bad.forEach((x, i) => out.push({ id: `bad${i + 1}:${x.entry.pista}`, label: 'bad', entry: x.entry, lang: x.lang }));
  return out;
}

/** Agreement of the judge's grades with the labels: { agree, total, rate, misses }. */
export function score(labelled, answer) {
  const byId = Object.fromEntries(answer.map(a => [a.id, a]));
  const misses = labelled.filter(c => byId[c.id]?.grade !== c.label).map(c => ({ id: c.id, label: c.label, judge: byId[c.id]?.grade ?? '(none)', why: byId[c.id]?.why || '' }));
  const total = labelled.length, agree = total - misses.length;
  return { agree, total, rate: Math.round((agree / total) * 100), misses };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const all = await cases();
  if (process.argv[2] === 'prompt') {
    console.log(readFileSync(here('./judge-rubric.md'), 'utf8'));
    console.log('\n## The clues\n');
    for (const c of all) console.log(`- id \`${c.id}\` (${c.lang}): **${c.entry.pista}** · si: ${c.entry.si.join(', ')} · casi: ${c.entry.casi.join(', ')}`);
  } else if (process.argv[2] === 'score') {
    const s = score(all, JSON.parse(readFileSync(process.argv[3], 'utf8')));
    console.log(`Agreement: ${s.agree}/${s.total} (${s.rate}%) — step 1.3 passes at 90%`);
    for (const m of s.misses) console.log(`  ${m.id}: owner ${m.label}, judge ${m.judge} — ${m.why}`);
  } else console.log('Usage: judge.mjs prompt | score <answer.json>');
}
