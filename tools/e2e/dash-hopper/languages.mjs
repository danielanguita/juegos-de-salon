// Dash Hopper in every offered language (D-199): each screen in paths.mjs, in each one, against
// Spanish. Usage: node tools/e2e/dash-hopper/languages.mjs <output-folder>
import { checkLanguages } from '../languages-common.mjs';
import { LOCALES } from '../../../public/labs/dash-hopper/rules.js';

await checkLanguages('dash-hopper', { dicts: [LOCALES], port: 9468 });
