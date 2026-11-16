#!/usr/bin/env node
/**
 * The heartbeat's watchdog and its hourly mark (D-565), as administrator.
 *
 *   node tools/push/heartbeat-watch.mjs uad      # notifications.yml, after each hourly Uno al día rebuild: records it
 *   node tools/push/heartbeat-watch.mjs check    # says whether the heartbeat is behind (exit 0 either way)
 *   node tools/push/heartbeat-watch.mjs notify   # round-watch.yml, daily: opens the issue when behind, closes it when caught up
 *
 * Behind (heartbeat.mjs `health`): no round for 30 minutes, no Uno al día rebuild for 3 hours, or
 * yesterday (Pacific) had a gap of more than 15 minutes or fewer than 20 rebuilds.
 */
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { token, read, write } from '../firebase/firebase-admin.mjs';
import { health, pacificDate } from './heartbeat.mjs';

export const TITLE = 'Heartbeat behind';
const BASE = 'stats/prod/push';
const REPO = 'https://github.com/ellokojavi/juegos-de-salon';

export const issueBody = h => [
  'The heartbeat (`notifications.yml`, D-564, D-565), which sends the notifications every 5 minutes and rebuilds Uno al día every hour, fell behind:',
  ...h.problems.map(p => `- ${p}`),
  '',
  'What to check, in order:',
  '1. Actions → Notifications: is a run in progress, and did the last ones end green? A red one says why in its log.',
  '2. GitHub disables scheduled workflows after 60 days without commits: if it says *disabled*, enable it.',
  '3. Run it now (Run workflow): it checks once. The next hourly start takes the relay back.',
  '',
  `The panel's 🔔 block shows the rounds and the longest gap of each day. How it works: [D-565](${REPO}/blob/main/docs/decisions/D-565.md). This issue closes itself once it catches up.`,
].join('\n');

const sh = args => execFileSync('gh', args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const [command] = process.argv.slice(2);
  const t = await token();
  const now = Date.now();
  if (command === 'uad') {
    await write(BASE, 'PATCH', { uadAt: now, [`dias/${pacificDate(now)}/uad`]: { '.sv': { increment: 1 } } }, t);
    console.log('Recorded the Uno al día rebuild.');
  } else if (command === 'check' || command === 'notify') {
    const p = (await read(BASE, t)) || {};
    const h = health({ vuelta: p.vuelta, uadAt: p.uadAt, dias: p.dias, now });
    if (command === 'check') console.log(h.ok ? '✅ The heartbeat is up to date.' : `⚠️ Behind: ${h.problems.join('; ')}.`);
    else {
      const open = JSON.parse(sh(['issue', 'list', '--state', 'open', '--search', `"${TITLE}" in:title`, '--json', 'number,title'])).filter(i => i.title === TITLE);
      if (!h.ok) {
        if (open.length) sh(['issue', 'edit', String(open[0].number), '--body', issueBody(h)]);
        else sh(['issue', 'create', '--title', TITLE, '--body', issueBody(h)]);
        console.log(`Behind: ${h.problems.join('; ')}.`);
      } else {
        for (const i of open) sh(['issue', 'close', String(i.number), '--comment', 'The heartbeat caught up.']);
        console.log('Up to date.');
      }
    }
  } else { console.error('Usage: node tools/push/heartbeat-watch.mjs uad | check | notify'); process.exit(2); }
}
