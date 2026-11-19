// The Visual references workflow (.github/workflows/visual-refs.yml) commits the runner's reference
// PNGs to a PR's branch. What keeps it safe and narrow, so a later edit cannot loosen it unseen:
// never on a fork's PR (no pull_request_target, the same-repo guard), the token kept out of the
// branch's code, only the references the PR itself changes, and no loop on its own commit.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const yml = readFileSync(new URL('../../.github/workflows/visual-refs.yml', import.meta.url), 'utf8');
const code = yml.split('\n').filter(l => !/^\s*#/.test(l)).join('\n');

test('it never runs with write access on a fork', () => {
  assert.doesNotMatch(code, /pull_request_target/);
  assert.match(code, /if: github\.event_name == 'workflow_dispatch' \|\| github\.event\.pull_request\.head\.repo\.full_name == github\.repository/);
});

test('the token is not left in .git/config while the branch code runs', () => {
  assert.match(code, /persist-credentials: false/);
});

test('on a PR it remakes only the references the PR changes, and skips its own commit', () => {
  assert.match(code, /paths:\s*\n\s*- 'tools\/e2e\/visual\/ref\/\*\.png'/);
  assert.match(code, /git diff --name-only --diff-filter=AM "\$BASE"\.\.\.HEAD -- 'tools\/e2e\/visual\/ref\/\*-intro\.png'/);
  assert.match(code, /--update --part "\$p"/);
  const subject = code.match(/git commit -qm "([^"(]+)/)[1].trim();
  assert.match(code, new RegExp(`grep -q '\\^${subject}'`), 'the skip matches the commit it makes');
});

test('its push starts the checks again (MERGE_QUEUE_TOKEN, D-586)', () => {
  assert.match(code, /QUEUE_TOKEN: \$\{\{ secrets\.MERGE_QUEUE_TOKEN \}\}/);
  assert.match(code, /x-access-token:\$\{QUEUE_TOKEN:-\$TOKEN\}/);
});
