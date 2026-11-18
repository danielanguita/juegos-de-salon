// Croc! in every offered language (D-199): each screen in paths.mjs, in each one, against
// Spanish. Usage: node tools/e2e/croc/languages.mjs <output-folder>
import { checkLanguages } from '../languages-common.mjs';
import { LOCALES } from '../../../public/labs/croc/rules.js';

await checkLanguages('croc', { dicts: [LOCALES], port: 9468 });
