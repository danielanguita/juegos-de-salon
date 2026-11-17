// Sapiondo in every offered language (D-199): each screen in paths.mjs, in each one, against
// Spanish. Usage: node tools/e2e/sapiondo/languages.mjs <output-folder>
import { checkLanguages } from '../languages-common.mjs';
import { LOCALES } from '../../../public/labs/sapiondo/rules.js';

await checkLanguages('sapiondo', { dicts: [LOCALES], port: 9468 });
