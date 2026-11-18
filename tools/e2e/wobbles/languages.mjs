// Tembleque in every offered language (D-199): its cover in paths.mjs, in each one, against Spanish.
// Each level's texts live in its own page (the prototypes kept whole); game.mjs plays both to their result in es/en/pt.
// Usage: node tools/e2e/wobbles/languages.mjs <output-folder>
import { checkLanguages } from '../languages-common.mjs';
import { LOCALES } from '../../../public/labs/wobbles/rules.js';

await checkLanguages('labs/wobbles', { dicts: [LOCALES], port: 9493 });
