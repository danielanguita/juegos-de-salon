// The secret achievement's window (lab flag profile): its names and metals are the profile's, and after a game
// the first local secret earned and not yet celebrated is the one told, once.
import assert from 'node:assert/strict';
import { TEXTS, SECRETS } from './achievement-window.js';
import { dueSecret, LOCAL_SECRETS } from './secret-achievements.js';
import { BADGES } from '../../profile/badges.js';
import { TEXTS as PROFILE } from '../../profile/texts.js';

const secret = BADGES.filter(b => b.secret);
assert.deepEqual(Object.keys(SECRETS).sort(), secret.map(b => b.id).sort(), 'the same secret achievements as the profile');
for (const b of secret) assert.deepEqual(SECRETS[b.id], { tier: b.tier, icon: b.icon }, `${b.id}: the profile's metal and emoji`);
for (const lang of ['es', 'en', 'pt']) {
  for (const b of secret) {
    assert.equal(TEXTS[lang].names[b.id], PROFILE[lang].badges[b.id][0], `${lang} ${b.id}: the profile's name`);
    assert.ok(TEXTS[lang].msg[b.id]?.length > 10, `${lang} ${b.id}: its own message`);
  }
  assert.ok(!/chapita/i.test(JSON.stringify(TEXTS[lang])), `${lang}: «logros», never «chapitas» (the owner, 2026-11-22)`);
}
for (const id of Object.keys(LOCAL_SECRETS)) assert.ok(SECRETS[id], `${id}: a secret achievement`);
assert.equal(dueSecret({}, {}), null, 'nothing earned, nothing told');
assert.equal(dueSecret({ marks: { days: { xmas: true } } }, {}), 'xmas');
assert.equal(dueSecret({ marks: { days: { xmas: true } } }, { xmas: 1 }), null, 'told once');
assert.equal(dueSecret({ hours: { '2026-11-02': { n: 3 } }, marks: { days: { halloween: true } } }, { 'night-owl': 1 }), 'halloween');
assert.equal(dueSecret({ marks: { t13: { best: 12 } } }, {}), null);
console.log('✓ achievement window');
