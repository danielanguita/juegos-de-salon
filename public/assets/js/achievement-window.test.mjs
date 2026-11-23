// The secret achievement's window (lab flag profile): its names and metals are the profile's, and after a game
// the first local secret earned and not yet celebrated is the one told, once.
import assert from 'node:assert/strict';
import { TEXTS, SECRETS } from './achievement-window.js';
import { dueSecret, LOCAL_SECRETS } from './secret-achievements.js';
import { BADGES } from './badges.js';
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
// Any other badge the phone can tell alone opens the window right after the game that earned it (the owner, 2026-11-23)
{
  const { dueBadge } = await import('./achievement-window.js');
  const { LOCAL_BADGES, PLAYS_KEY } = await import('./phone-facts.js');
  const { PARTIDAS_KEY } = await import('./transport/stats.js');
  assert.equal(PLAYS_KEY, PARTIDAS_KEY, 'phone-facts counts the games stats.js counts');
  for (const id of LOCAL_BADGES) assert.ok(BADGES.some(b => b.id === id), `${id} is a badge`);
  const list = [{ id: 'night-owl', secret: true, got: true }, { id: 'specialist', got: true }, { id: 'obsession', got: true }, { id: 'plays-100', got: true }, { id: 'explorer', got: false }];
  assert.equal(dueBadge(list, LOCAL_BADGES, {}, {})?.id, 'obsession', 'never a secret one (they have their own), never one only the server can tell');
  assert.equal(dueBadge(list, LOCAL_BADGES, { obsession: 1 }, {})?.id, 'plays-100', 'told once');
  assert.equal(dueBadge(list, LOCAL_BADGES, { obsession: 1 }, { 'plays-100': 1 }), null, 'one the profile already showed as new is not told again');
  for (const lang of ['es', 'en', 'pt']) {
    assert.ok(TEXTS[lang].kickerBadge?.length > 5, `${lang}: its own kicker`);
    for (const b of BADGES.filter(x => !x.secret && LOCAL_BADGES.has(x.id))) assert.deepEqual(TEXTS[lang].badges[b.id], PROFILE[lang].badges[b.id], `${lang} ${b.id}: the profile's name and line`);
  }
}
console.log('✓ achievement window');
