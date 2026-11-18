// D-582: each agent names its model and effort; inheriting the session's would spend the owner's
// quota the same way on every job.
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';

const dir = new URL('../../.claude/agents/', import.meta.url);
const MODELS = ['opus', 'sonnet', 'haiku'], EFFORTS = ['low', 'medium', 'high', 'xhigh', 'max'];
const files = readdirSync(dir).filter(f => f.endsWith('.md'));
assert.ok(files.length >= 9, 'the agents are read');
for (const f of files) {
  const front = readFileSync(new URL(f, dir), 'utf8').split('---')[1] || '';
  const model = /^model:\s*(\S+)/m.exec(front)?.[1], effort = /^effort:\s*(\S+)/m.exec(front)?.[1];
  assert.ok(MODELS.includes(model), `${f}: model must be one of ${MODELS} (D-582), not ${model}`);
  assert.ok(EFFORTS.includes(effort), `${f}: effort must be one of ${EFFORTS} (D-582), not ${effort}`);
}
console.log('agents-models: ok');
