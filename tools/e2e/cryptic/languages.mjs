// Cryptic in every offered language (D-199): each screen in paths.mjs, in each one, against
// Spanish. Usage: node tools/e2e/cryptic/languages.mjs <output-folder>. Born from tools/generators/new-game.mjs.
import { checkLanguages } from '../languages-common.mjs';
import { LOCALES, CLUE_LANG } from '../../../public/labs/cryptic/rules.js';
import { CLUES } from '../../../public/labs/cryptic/clues.js';

// The clues and how they are solved are in Spanish in every language (content, not interface: «⚠️ The clues are in Spanish»)
const allowed = CLUES[CLUE_LANG].flatMap(c => [c.c, c.x]);
await checkLanguages('cryptic', { dicts: [LOCALES], allowed });
