// session-length.mjs: counts turns like costs.mjs, shows the note once per threshold, never fails.
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { writeFileSync, mkdtempSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { measure, threshold, note, FIRST, EVERY } from './session-length.mjs';

const turn = c => JSON.stringify({ type: 'assistant', message: { usage: { input_tokens: 1, cache_read_input_tokens: c, cache_creation_input_tokens: 0 } } });
const text = n => [JSON.stringify({ type: 'user', message: { content: 'hi' } }), ...Array.from({ length: n }, (_, i) => turn(1000 * (i + 1))), 'not json'].join('\n');
assert.deepEqual(measure(text(3)), { turns: 3, ctx: 3001 });
assert.equal(threshold(FIRST - 1), 0);
assert.equal(threshold(FIRST), FIRST);
assert.equal(threshold(FIRST + EVERY - 1), FIRST);
assert.equal(threshold(FIRST + EVERY), FIRST + EVERY);
assert.match(note({ turns: 260, ctx: 310000 }), /260 turns, ~310k tokens/);

const dir = mkdtempSync(join(tmpdir(), 'session-length-')), script = new URL('./session-length.mjs', import.meta.url).pathname;
const run = (n, id) => { const p = join(dir, `${id}-${n}.jsonl`); writeFileSync(p, text(n)); return execFileSync(process.execPath, [script], { input: JSON.stringify({ session_id: id, transcript_path: p }), encoding: 'utf8' }); };
const id = `test-${process.pid}-${Date.now()}`;
assert.equal(run(10, id), '', 'quiet below the first threshold');
assert.match(JSON.parse(run(FIRST, id)).systemMessage, /📏/, 'speaks at the first');
assert.equal(run(FIRST + 5, id), '', 'once per threshold');
assert.match(JSON.parse(run(FIRST + EVERY, id)).systemMessage, /📏/, 'and again at the next');
assert.equal(execFileSync(process.execPath, [script], { input: 'garbage', encoding: 'utf8' }), '', 'bad input: silent, exit 0');
console.log('✓ session-length: counts turns, one note per threshold, never in the way');
