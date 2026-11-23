// Root files guard (pattern stray-root-file): sessions committed scratch files at the repo root
// (p.mjs in 98f2f5b, wobbles-cover-new.png in 2831f20) and only the documentation round found them.
// Every tracked file at the root must be on this list; a new one belongs in a folder (D-192), or,
// if it really belongs at the root, is added here in the same PR.
import { execFileSync } from 'node:child_process';

const ALLOWED = new Set([
  '.gitattributes', '.gitignore', 'CHANGELOG.md', 'CLAUDE.md', 'CONTRIBUTING.md', 'LICENSE', 'README.md',
]);

const root = execFileSync('git', ['ls-files', '-z'], { encoding: 'utf8', maxBuffer: 1 << 28 })
  .split('\0').filter((p) => p && !p.includes('/'));
const stray = root.filter((p) => !ALLOWED.has(p));
if (stray.length) {
  console.error(`✗ files at the repo root that belong in a folder (D-192): ${stray.join(', ')}\n` +
    '  Move or delete them; if one truly belongs at the root, add it to ALLOWED in tools/agents/root-files.test.mjs.');
  process.exit(1);
}
console.log(`✓ root files: ${root.length}, all expected`);
