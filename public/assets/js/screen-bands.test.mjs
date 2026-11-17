// node public/assets/js/screen-bands.test.mjs
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { screenBand, parseBand, BAND_RULE, WIDTH_BANDS, HEIGHT_BANDS } from './screen-bands.js';

assert.equal(screenBand({ w: 320, h: 548 }), 'w320-h0-v', 'iPhone SE (1st gen)');
assert.equal(screenBand({ w: 360, h: 740 }), 'w360-h640-v', 'Galaxy A');
assert.equal(screenBand({ w: 390, h: 664 }), 'w375-h640-v', 'iPhone 13 in Safari');
assert.equal(screenBand({ w: 412, h: 915 }), 'w400-h800-v', 'Pixel');
assert.equal(screenBand({ w: 430, h: 932 }), 'w430-h800-v', 'iPhone Pro Max');
assert.equal(screenBand({ w: 844, h: 390 }), 'w600-h0-h', 'a phone turned sideways');
assert.equal(screenBand({ w: 1920, h: 950 }), 'w1200-h800-h', 'desktop');
assert.equal(screenBand({ w: 340, h: 600 }).split('-')[0], 'w320', 'the edge belongs to the band below');
assert.equal(screenBand({ w: 341, h: 600 }).split('-')[0], 'w360');
assert.equal(screenBand({}), '', 'unknown size: nothing');
assert.equal(screenBand({ w: 0, h: 500 }), '');

// Every band the code can write passes the Firebase rule, and the rule takes nothing else
for (const w of WIDTH_BANDS) for (const h of HEIGHT_BANDS) for (const o of 'vh') {
  const k = `${w.id}-${h.id}-${o}`;
  assert.ok(BAND_RULE.test(k), k);
  assert.deepEqual(parseBand(k), { w: w.id, h: h.id, o });
}
assert.equal(parseBand('w999-h0-v'), null);
assert.equal(BAND_RULE.test('w999-h0-v'), false);
const rules = readFileSync(new URL('../../../firebase/database.rules.json', import.meta.url), 'utf8');
assert.ok(rules.includes(`$pant.matches(${BAND_RULE.source.replace(/^/, '/').replace(/$/, '/')})`), 'the Firebase rule on pant/ is the same as BAND_RULE');

// Every band says which phones it holds
for (const b of [...WIDTH_BANDS, ...HEIGHT_BANDS]) assert.ok(b.eg && b.label, b.id);
console.log('screen-bands ok');
