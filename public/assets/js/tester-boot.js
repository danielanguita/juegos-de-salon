/**
 * Puts the tester ribbon on every screen: vigia.js adds this module to every page but the panel.
 * With a lab key it shows the ribbon in the page's language; tester-ribbon.js hides it while a game
 * is being played. Launched 2026-11-02, its flag gate removed. lab: #seccion-tester-ribbon
 * Being on every page, it also carries what every page's top bar gets while in the lab.
 */
import { labAccess } from './lab-access.js';
import { flag } from './flags.js';

// The profile's pill and the compact language on every page's top bar (profile-button.js). lab: #seccion-profile
flag('profile').then(on => on && import('./profile-button.js').then(m => m.profileEverywhere())).catch(() => {});

if (await labAccess().catch(() => false)) {
  const { testerRibbon } = await import('./tester-ribbon.js');
  const lang = (document.documentElement.lang || 'es').slice(0, 2);
  testerRibbon({ lang });
}
