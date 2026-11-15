// Runs every *.test.mjs in the repo in parallel (D-143): one node process each, at most JOBS at a time
// (default: the CPU count). Prints each file's output in a GitHub Actions group, in a stable order, and
// exits 1 if any failed. Serial, the suite took ~72 s; three files are over half of it.
import { execFileSync, spawn } from 'node:child_process';
import { availableParallelism } from 'node:os';

const files = execFileSync('git', ['ls-files', '*.test.mjs'], { encoding: 'utf8' }).split('\n').filter(Boolean);
const jobs = Number(process.env.JOBS) || availableParallelism();
const ci = !!process.env.GITHUB_ACTIONS;
const results = new Array(files.length);

function run(i) {
  return new Promise((done) => {
    const start = Date.now();
    const child = spawn(process.execPath, [files[i]], { stdio: ['ignore', 'pipe', 'pipe'] });
    let out = '';
    child.stdout.on('data', (d) => { out += d; });
    child.stderr.on('data', (d) => { out += d; });
    child.on('close', (code) => { results[i] = { code, out, ms: Date.now() - start }; done(); });
  });
}

let next = 0;
await Promise.all(Array.from({ length: Math.min(jobs, files.length) }, async () => {
  while (next < files.length) await run(next++);
}));

let failed = 0;
files.forEach((f, i) => {
  const { code, out, ms } = results[i];
  if (ci) console.log(`::group::${f} (${(ms / 1000).toFixed(1)} s)`);
  else if (code === 0) return;
  process.stdout.write(out);
  if (ci) console.log('::endgroup::');
  if (code !== 0) { failed++; console.log(ci ? `::error file=${f}::${f} failed` : `FAILED ${f}`); }
});
console.log(`${files.length - failed}/${files.length} test files passed, ${jobs} at a time`);
process.exit(failed ? 1 : 0);
