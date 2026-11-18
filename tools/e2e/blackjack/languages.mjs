// Blackjack in every offered language (D-199): each screen in paths.mjs, in each one, against
// Spanish. Usage: node tools/e2e/blackjack/languages.mjs <output-folder>
import { checkLanguages } from '../languages-common.mjs';
import { LOCALES } from '../../../public/labs/blackjack/rules.js';

await checkLanguages('blackjack', { dicts: [LOCALES], port: 9471 });
