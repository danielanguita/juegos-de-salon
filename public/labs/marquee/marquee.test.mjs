// The news strip's headlines (lab: #seccion-marquee) are the campaigns' own texts: every campaign it
// announces exists, and has a one-line title in each of the three languages.
import assert from 'node:assert/strict';
import { CAMPAIGNS } from '../../assets/js/splash.js';
import { NEWS, TREATMENTS, headlines } from './marquee.js';

for (const id of NEWS) assert.ok(CAMPAIGNS[id], `marquee.js announces '${id}', which is not a campaign of splash.js`);
for (const lang of ['es', 'en', 'pt']) {
  const h = headlines(CAMPAIGNS, lang);
  assert.equal(h.length, NEWS.length, `${lang}: one headline per campaign`);
  for (const n of h) {
    assert.ok(n.title && !n.title.includes('\n'), `${n.id} (${lang}): a one-line title`);
    assert.ok(n.emoji, `${n.id} (${lang}): an emoji`);
  }
}
assert.deepEqual(headlines({ x: { title: { es: 'Hola\n¡ya!' } } }, 'es', ['x', 'gone']), [{ id: 'x', emoji: '🎉', icon: '', kicker: '', title: 'Hola ¡ya!' }]);
assert.equal(new Set(TREATMENTS.map(t => t.id)).size, TREATMENTS.length, 'one id per treatment');
console.log(`✓ news strip: ${NEWS.length} headlines in three languages, ${TREATMENTS.length} treatments`);
