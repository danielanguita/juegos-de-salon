/**
 * The lab's hooks around the prototype (D-395). The game itself is the inline script of index.html,
 * the owner's prototype kept whole as delivered (docs/games/wobbles-3d.md); this module only counts the
 * visit for the panel (D-208) and reads its game.json, as every game does.
 */
import { trackVisit } from '../../assets/js/transport/stats.js';

// Its facts, from game.json (node tools/generators/manifests.mjs): the panel names it from there
import manifest from '../../assets/js/manifests/labs/wobbles-3d.js';

window.__labGame = manifest.id;
trackVisit();
