// The lab's index: one link per card being tried, La Bodega left out.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { entries, GROUPS } from './index-nav.js';

// A tiny DOM stand-in, enough for entries()
const card = (id, title, hidden = false, icon = null) => ({ id, hidden, querySelector: s => (s === ':scope > h2' && title ? { textContent: ` ${title} `, querySelector: q => (q === ':scope > img' && icon ? { getAttribute: () => icon } : null) } : null) });
const group = (id, title, cards) => ({ id, querySelector: () => ({ textContent: title }), querySelectorAll: () => cards });
const groups = {
  activos: group('activos', '🎲 Juegos en prueba', [card('seccion-a', '🦎 A'), card('seccion-b', 'B', true), card('seccion-blackjack', 'Blackjack', false, 'blackjack/icon.svg')]),
  mejoras: group('mejoras', '✨ Mejoras en prueba', [card('seccion-offline', '📴 Modo sin conexión'), card('seccion-x', null)]),
  bodega: group('bodega', '📦 La Bodega', [card('seccion-old', 'Old')]),
};
const doc = { getElementById: id => groups[id] || null };
assert.deepEqual(entries(doc), [
  { group: 'activos', title: '🎲 Juegos en prueba', items: [{ id: 'seccion-a', label: '🦎 A', icon: null }, { id: 'seccion-blackjack', label: 'Blackjack', icon: 'blackjack/icon.svg' }] },
  { group: 'mejoras', title: '✨ Mejoras en prueba', items: [{ id: 'seccion-offline', label: '📴 Modo sin conexión', icon: null }] },
]);
assert.ok(!GROUPS.includes('bodega'));
// The page has the slot and draws it after the cards move to La Bodega
const html = readFileSync(new URL('./index.html', import.meta.url), 'utf8');
assert.match(html, /<nav[^>]+id="indice"/);
assert.match(html, /moved\.then\(\(\) => import\('\.\/index-nav\.js'\)\)/);
// Every card in the lab, game or feature, opens its title with its emoji or the game's drawing (the owner,
// 2026-11-17), so its pill in the index carries it too (docs/AGENTS.md, the lab)
const bare = [...html.matchAll(/<section class="panel seccion[^"]*" id="([^"]+)"[^>]*>\s*<h2>([\s\S]*?)<\/h2>/g)]
  .filter(([, , t]) => !/^\s*(<img\b|[^\x00-\x7F\p{L}])/u.test(t)).map(([, id, t]) => `${id}: «${t.trim().slice(0, 40)}»`);
assert.deepEqual(bare, [], 'a /labs/ card whose title does not open with its emoji or the game\'s drawing');
console.log('✓ labs index: one link per card being tried, each card titled with its emoji or drawing, carried by its pill, La Bodega left out');
