// A hint for the owner when a session gets long (D-558, docs/COSTS.md): every turn re-reads the whole
// context, so 8 sessions over 300 turns took half the interactive tokens in two weeks. On each prompt
// (UserPromptSubmit hook) it counts the session's turns; at 250, and every 150 after, it shows the owner
// a one-line note. It only informs: it blocks nothing and adds nothing to Claude's context.
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';

export const FIRST = 250, EVERY = 150;

/** Turns and the last turn's context, counted as costs.mjs counts them. */
export function measure(text) {
  let turns = 0, ctx = 0;
  for (const line of text.split('\n')) {
    let e; try { e = JSON.parse(line); } catch { continue; }
    const u = e?.message?.usage; if (e.type !== 'assistant' || !u) continue;
    turns++; ctx = (u.input_tokens || 0) + (u.cache_read_input_tokens || 0) + (u.cache_creation_input_tokens || 0);
  }
  return { turns, ctx };
}

/** The threshold reached (250, 400, 550…), or 0 below the first. */
export const threshold = turns => turns < FIRST ? 0 : FIRST + Math.floor((turns - FIRST) / EVERY) * EVERY;

export const note = ({ turns, ctx }) => `📏 This session is at ${turns} turns, ~${Math.round(ctx / 1000)}k tokens each; every new turn re-reads all of it. `
  + 'If what comes next is a new task, a fresh session costs a fraction (docs/COSTS.md).';

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  try {
    const input = JSON.parse(readFileSync(0, 'utf8') || '{}');
    if (input.transcript_path && existsSync(input.transcript_path)) {
      const m = measure(readFileSync(input.transcript_path, 'utf8'));
      const t = threshold(m.turns);
      const dir = join(tmpdir(), 'claude-session-length'), mark = join(dir, String(input.session_id || 'x').replace(/[^\w-]/g, ''));
      const shown = existsSync(mark) ? Number(readFileSync(mark, 'utf8')) : 0;
      if (t > shown) {
        mkdirSync(dir, { recursive: true }); writeFileSync(mark, String(t));
        console.log(JSON.stringify({ systemMessage: note(m) }));
      }
    }
  } catch { /* a hint never gets in the way */ }
  process.exit(0);
}
