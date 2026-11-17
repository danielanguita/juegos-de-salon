// El globo de agregar a inicio (D-232): qué pasos le tocan a cada celular, la ✕ que lo apaga para
// siempre y la puerta del laboratorio.
// Uso: node public/assets/js/instalar.test.mjs
import assert from 'node:assert/strict';
import { pasosDe, descartado, descartar, INSTALAR_NO_KEY } from './instalar.js';

const UA = {
  iphone: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.1 Mobile/15E148 Safari/604.1',
  iphoneChrome: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/129.0 Mobile/15E148 Safari/604.1',
  iphoneFirefox: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) FxiOS/130.0 Mobile/15E148 Safari/605.1.15',
  iphoneWhatsApp: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 WhatsApp/2.24',
  ipad: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Safari/605.1.15',
  android: 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0 Mobile Safari/537.36',
  samsung: 'Mozilla/5.0 (Linux; Android 14; SM-S921B) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/25.0 Chrome/121.0 Mobile Safari/537.36',
  androidInstagram: 'Mozilla/5.0 (Linux; Android 14; Pixel 8 Build/AP2A; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/129.0 Mobile Safari/537.36 Instagram 350.0',
  androidWebView: 'Mozilla/5.0 (Linux; Android 14; Pixel 8 Build/AP2A; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/129.0 Mobile Safari/537.36',
  mac: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0 Safari/537.36',
};
const con = (ua, { touch = 5, standalone = false, displayStandalone = false } = {}) => pasosDe({
  nav: { userAgent: ua, maxTouchPoints: touch, standalone },
  win: { matchMedia: q => ({ matches: displayStandalone && /standalone/.test(q) }) },
});

assert.equal(con(UA.iphone), 'ios-safari');
assert.equal(con(UA.ipad), 'ios-safari', 'el iPad se presenta como Mac, con pantalla táctil');
assert.equal(con(UA.iphoneChrome), 'ios-chrome');
assert.equal(con(UA.iphoneFirefox), null, 'Firefox y Edge en iPhone: sin pasos propios, no sale');
assert.equal(con(UA.iphoneWhatsApp), 'otra-app-ios');
assert.equal(con(UA.android), 'android');
assert.equal(con(UA.samsung), 'samsung');
assert.equal(con(UA.androidInstagram), 'otra-app-android');
assert.equal(con(UA.androidWebView), 'otra-app-android', 'un WebView de Android (; wv) no puede instalar');
assert.equal(con(UA.mac, { touch: 0 }), null, 'en el computador no sale');
assert.equal(con(UA.iphone, { standalone: true }), null, 'la app ya instalada del iPhone no lo ve');
assert.equal(con(UA.android, { displayStandalone: true }), null, 'la app ya instalada de Android no lo ve');

const almacen = () => { const m = new Map(); return { getItem: k => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: k => m.delete(k) }; };

// La ✕: una vez, para siempre en ese navegador; el laboratorio lo puede volver a mostrar
const s = almacen();
assert.equal(descartado(s), false);
descartar(true, s);
assert.equal(descartado(s), true);
assert.equal(s.getItem(INSTALAR_NO_KEY), '1');
descartar(false, s);
assert.equal(descartado(s), false);
const roto = { getItem() { throw new Error('sin almacenamiento'); }, setItem() { throw new Error('x'); }, removeItem() { throw new Error('x'); } };
assert.equal(descartado(roto), false);
assert.doesNotThrow(() => descartar(true, roto));

console.log('instalar: los pasos de cada celular y la ✕ para siempre');

// The new invitation (flag install-invite): the ✕ snoozes 14 days, then 60; the after-game one, once a week
{
  const { pospuesto, posponer, puedeInvitarTras, iosNuevo, TRAS_KEY } = await import('./instalar.js');
  const DIA = 864e5, t0 = Date.UTC(2026, 10, 17);
  const m = almacen();
  assert.equal(pospuesto(t0, m), false);
  assert.equal(posponer(t0, m), 14, 'the first ✕ waits 14 days');
  assert.equal(pospuesto(t0 + 13 * DIA, m), true);
  assert.equal(pospuesto(t0 + 15 * DIA, m), false, 'and it comes back');
  assert.equal(posponer(t0 + 15 * DIA, m), 60, 'the second ✕ waits 60');
  assert.equal(posponer(t0 + 80 * DIA, m), 60, 'and every one after it');
  assert.equal(pospuesto(t0, roto), false);
  assert.doesNotThrow(() => posponer(t0, roto));

  const n = almacen();
  assert.equal(puedeInvitarTras({ now: t0, storage: n, pasos: null }), false, 'a computer is not invited');
  assert.equal(puedeInvitarTras({ now: t0, storage: n, pasos: 'ios-safari' }), true);
  n.setItem(TRAS_KEY, String(t0 - 3 * DIA));
  assert.equal(puedeInvitarTras({ now: t0, storage: n, pasos: 'ios-safari' }), false, 'not twice in a week');
  n.setItem(TRAS_KEY, String(t0 - 8 * DIA));
  assert.equal(puedeInvitarTras({ now: t0, storage: n, pasos: 'ios-safari' }), true);
  posponer(t0, n);
  assert.equal(puedeInvitarTras({ now: t0, storage: n, pasos: 'ios-safari' }), false, 'not while snoozed');
  descartar(true, n);
  assert.equal(puedeInvitarTras({ now: t0 + 400 * DIA, storage: n, pasos: 'ios-safari' }), false, 'never once installed');

  assert.equal(iosNuevo(UA.iphone), false, 'iOS 18: Share in the middle of the bar');
  assert.equal(iosNuevo(UA.iphone.replace('18_1', '26_1')), true, 'iOS 26: inside ⋯ at the right');
  console.log('install-invite: snooze 14 → 60 days, after-game once a week');
}
