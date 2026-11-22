// The profile's texts (lab flag profile): the three languages have the same keys and a name and a line for every badge (C-3).
import assert from 'node:assert/strict';
import { TEXTS } from './texts.js';
import { BADGES } from './badges.js';
import { LABEL } from '../assets/js/profile-button.js';

assert.deepEqual(Object.keys(TEXTS).sort(), ['en', 'es', 'pt']);
const keys = t => Object.keys(t).sort();
for (const [lang, t] of Object.entries(TEXTS)) {
  assert.deepEqual(keys(t), keys(TEXTS.es), `${lang}: the same keys as Spanish`);
  assert.deepEqual(keys(t.badges), BADGES.map(b => b.id).sort(), `${lang}: a text for every badge, and none for a badge that is gone`);
  for (const [id, v] of Object.entries(t.badges)) assert.ok(Array.isArray(v) && v.length === 2 && v.every(s => typeof s === 'string' && s.trim()), `${lang}: ${id} has a name and a line`);
  for (const [k, v] of Object.entries(t)) if (typeof v === 'string') {
    assert.ok(v.trim(), `${lang}.${k}: not empty`);
    const holes = s => (s.match(/\{\w+\}/g) || []).sort().join();
    assert.equal(holes(v), holes(TEXTS.es[k]), `${lang}.${k}: the same {holes} as Spanish`);
  }
  // A badge's name fits under its medal at 320 px: three to a row, about 90 px each
  // Two short lines under the medal at 320 px: 18 characters, no word over 13 (measured with «Se llama obsesión»)
  for (const [id, [name]] of Object.entries(t.badges)) assert.ok(name.length <= 18 && name.split(' ').every(w => w.length <= 13), `${lang}: «${name}» (${id}) is too long for its medal`);
}
// The home page's button carries the page's title, in its own small module (the home page loads no file of /profile/)
for (const [lang, t] of Object.entries(TEXTS)) assert.equal(LABEL[lang], t.pageTitle, `${lang}: the home button's name is the page's title`);
console.log('profile texts: ok');
