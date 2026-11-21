// The WBR shared by link: a frozen snapshot of one week that anyone with its id reads, nobody can list,
// and only the owner writes or deletes (the panel's 🔗 Share, the public /wbr/?id=… page).
import assert from 'node:assert/strict';
import { createDb, loadRules } from '../tools/firebase/rules-sim.mjs';

const OWNER = 'TrNylkeOFXNhnTPWAApebKvbI3F2';
const ID = 'AbCdEfGhIjKlMnOpQrSt_-';
const db = createDb(undefined, {});
const w = (changes, uid = OWNER) => db.update(changes, { uid });
const snap = { json: '{"t":1}', from: 20400, to: 20406, at: 1 };

assert.equal(w({ [`wbrShared/${ID}`]: snap }), true, 'the owner shares a week');
assert.equal(w({ [`wbrShared/${ID}`]: snap }, 'someone'), false, 'nobody else');
assert.equal(w({ [`wbrShared/${ID}`]: snap }, null), false, 'not signed out');
assert.equal(w({ [`wbrShared/${ID}`]: null }), true, 'the owner stops sharing it');
assert.equal(w({ [`wbrShared/${ID}`]: { ...snap, json: 7 } }), false, 'the snapshot is a JSON string');
assert.equal(w({ [`wbrShared/${ID}`]: { ...snap, json: 'x'.repeat(300001) } }), false, 'and not a huge one');
assert.equal(w({ [`wbrShared/${ID}`]: { ...snap, who: 'x' } }), false, 'no other fields');
assert.equal(w({ [`wbrShared/${ID}`]: { json: '{}', from: 1, to: 7 } }), false, 'with its time');
assert.equal(w({ 'wbrShared/short': snap }), false, 'ids are 22 random characters, not guessable');
const rules = loadRules().wbrShared;
assert.equal(rules.$id['.read'], true, 'one share is public to read: its link is the key');
assert.notEqual(rules['.read'], true, 'the list is not: nobody finds the others');
console.log('✓ wbrShared rules');
