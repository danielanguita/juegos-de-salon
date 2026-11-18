import assert from 'node:assert/strict';
import { summarize, rows, AGENT_BRANCH } from './factory.mjs';
import { htmlDelInforme } from './weekly-html.mjs';

const pr = (h, extra = {}) => ({ createdAt: '2026-11-10T00:00:00Z', mergedAt: new Date(Date.parse('2026-11-10T00:00:00Z') + h * 36e5).toISOString(), headRefName: 'x', labels: [], title: 't', ...extra });
const f = summarize({
  prs: [pr(1), pr(3), pr(10, { labels: [{ name: 'needs-owner' }] }), pr(2, { headRefName: 'documentation-2026-11-10' }), pr(1, { title: 'Revert "x"' })],
  runs: [{ conclusion: 'failure' }, { conclusion: 'success' }, { conclusion: 'failure' }],
  decisions: [{ createdAt: '2026-11-10T00:00:00Z', closedAt: '2026-11-11T00:00:00Z' }, { createdAt: '2026-11-10T00:00:00Z', closedAt: null }],
});
assert.equal(f.merged, 5);
assert.equal(f.hoursOpen, 2);
assert.equal(f.redMerged, 1);
assert.equal(f.redHoursOpen, 10);
assert.equal(f.redRunsPerPr, 0.4);
assert.deepEqual([f.decisionsOpened, f.decisionsAnswered, f.decisionHours], [2, 1, 24]);
assert.equal(f.agentPrs, 1);
assert.equal(f.reverts, 1);
assert.equal(rows(f).length, 5, 'five metrics, no more (piece 2)');
assert.equal(summarize({ prs: [], runs: [], decisions: [] }).hoursOpen, null);
assert.ok(AGENT_BRANCH.test('usability-2026-11-17') && !AGENT_BRANCH.test('blackjack-felt'));
console.log('factory: ok');
