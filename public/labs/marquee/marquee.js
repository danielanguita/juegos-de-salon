// The news strip (lab: #seccion-marquee): built inside the real home page by the lab demo. It reads the
// campaigns' own texts (CAMPAIGNS in splash.js, three languages), so a headline is the splash it opens.
// Pure where it can be (`headlines`), so node tests it without a DOM.

/** The treatments, in the order the demo offers them. `kind`: a ticker runs; a rotator shows one at a time. */
export const TREATMENTS = [
  { id: 'a', kind: 'cinta', name: 'A · Cinta de vidrio', note: 'El vidrio de los filtros, de borde a borde. Las novedades corren sin parar; con el dedo encima se detienen.' },
  { id: 'b', kind: 'giro', name: 'B · Titular que sube', note: 'Una novedad a la vez, con su etiqueta en amarillo. Sube la siguiente cada 4,5 s y una línea cian cuenta el tiempo.' },
  { id: 'c', kind: 'cinta', name: 'C · Arcoíris', note: 'La cinta con el arcoíris del título y letras Bangers. La más festiva y la que más se ve.' },
  { id: 'd', kind: 'giro', name: 'D · Píldora en vivo', note: 'Sin franja: una píldora de vidrio centrada, con un punto rosa que late. La novedad aparece y se desvanece.' },
  { id: 'e', kind: 'cinta', name: 'E · Marquesina de teatro', note: 'Un letrero oscuro con ampolletas que corren arriba y abajo y letras amarillas que brillan: el «salón».' },
  { id: 'f', kind: 'giro', name: 'F · Historias', note: 'Como las historias de Instagram: un segmento por novedad, el emoji en un anillo arcoíris.' },
];

/** The campaigns the strip announces, in order. Their emoji when the campaign has none of its own. */
export const NEWS = ['sudoku-ya', 'aletazo-ya', 'microgames-launch', 'shinobi-babel', 'dominorama-memorice', 'brindis-apoyo'];
const EMOJI = { 'shinobi-babel': '🥷' };

/** The step of a rotator, and the ticker's speed in px per second. */
export const STEP_MS = 4500;
export const SPEED = 50;

const pick = (o, lang) => (o == null ? '' : typeof o === 'string' ? o : o[lang] ?? o.en ?? o.es ?? '');

/** One headline per campaign that exists: its id, emoji, drawn icon, kicker and title (one line). */
export function headlines(campaigns, lang = 'es', ids = NEWS) {
  return ids.filter(id => campaigns[id]).map(id => {
    const c = campaigns[id];
    const l = !c.langs || c.langs.includes(lang) ? lang : 'en';
    return {
      id,
      emoji: c.emoji || EMOJI[id] || '🎉',
      icon: c.icon || '',
      kicker: pick(c.kicker, l),
      title: pick(c.title, l).replace(/\s*\n\s*/g, ' '),
    };
  });
}

const esc = s => String(s).replace(/[&<>"]/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch]));

/**
 * Builds the strip as the first thing in `doc`'s body. `root` is the site's root URL (for a drawn icon),
 * `onPick(id)` opens a campaign. Returns { pause(on), destroy() }.
 */
export function mount(doc, { treatment = 'a', news, root, onPick }) {
  const t = TREATMENTS.find(x => x.id === treatment) || TREATMENTS[0];
  const strip = doc.createElement('div');
  strip.className = `mq mq--${t.id}`;
  strip.setAttribute('role', 'region');
  strip.setAttribute('aria-label', 'Novedades');
  const emoji = n => `<span class="mq-emoji" aria-hidden="true">${n.icon ? `<img src="${esc(new URL(n.icon, root))}" alt="" width="18" height="18">` : esc(n.emoji)}</span>`;
  let timer = null;
  let paused = false;
  let resume = () => {};

  if (t.kind === 'cinta') {
    const sep = t.id === 'c' ? '★' : '✦';
    const row = news.map(n => `<button type="button" class="mq-item" data-id="${n.id}">${emoji(n)}<span>${esc(n.title)}</span></button><span class="mq-sep" aria-hidden="true">${sep}</span>`).join('');
    strip.innerHTML = `<div class="mq-cinta"><div class="mq-pista">${row}${row.replace(/<button /g, '<button tabindex="-1" aria-hidden="true" ')}</div></div>`;
  } else {
    const inner = n => t.id === 'b'
      ? `${n.kicker ? `<span class="mq-kicker">${esc(n.kicker)}</span>` : ''}${emoji(n)}<span class="mq-titulo"><span class="mq-texto">${esc(n.title)}</span></span><span class="mq-ir" aria-hidden="true">›</span>`
      : t.id === 'd'
        ? `<span class="mq-pildora"><span class="mq-punto" aria-hidden="true"></span>${emoji(n)}<span class="mq-titulo"><span class="mq-texto">${esc(n.title)}</span></span></span>`
        : `<span class="mq-anillo">${emoji(n)}</span>${n.kicker ? `<span class="mq-kicker">${esc(n.kicker)}</span>` : ''}<span class="mq-titulo"><span class="mq-texto">${esc(n.title)}</span></span><span class="mq-ir" aria-hidden="true">›</span>`;
    const segs = t.id === 'f' ? `<div class="mq-segmentos" aria-hidden="true">${news.map(() => '<span class="mq-seg"></span>').join('')}</div>` : '';
    strip.innerHTML = `<div class="mq-giro">${segs}${news.map(n => `<button type="button" class="mq-item" data-id="${n.id}">${inner(n)}</button>`).join('')}</div>`;
  }
  doc.body.prepend(strip);
  strip.style.setProperty('--mq-paso', `${STEP_MS}ms`);

  if (t.kind === 'cinta') {
    // The duration from the row's real width, so every treatment runs at the same speed
    const pista = strip.querySelector('.mq-pista');
    strip.style.setProperty('--mq-dur', `${Math.max(10, pista.scrollWidth / 2 / SPEED).toFixed(1)}s`);
    // A finger on the row stops it, so the tap lands on the headline under it
    strip.addEventListener('pointerdown', () => strip.classList.add('pausa'));
    for (const ev of ['pointerup', 'pointercancel', 'pointerleave']) strip.addEventListener(ev, () => { if (!paused) strip.classList.remove('pausa'); });
  } else {
    const items = [...strip.querySelectorAll('.mq-item')];
    const segs = [...strip.querySelectorAll('.mq-seg')];
    let i = -1;
    const show = next => {
      const prev = items[i];
      if (prev) { prev.classList.remove('on'); prev.classList.add('sale'); setTimeout(() => prev.classList.remove('sale'), 400); }
      i = next % items.length;
      items[i].classList.remove('sale');
      items[i].classList.add('on');
      segs.forEach((s, k) => { s.classList.toggle('hecho', k < i); s.classList.remove('ahora'); });
      if (segs[i]) { void segs[i].offsetWidth; segs[i].classList.add('ahora'); }
      // A headline longer than its room slides to show its end during its step, instead of ending in «…»
      const room = items[i].querySelector('.mq-titulo');
      room.classList.remove('largo');
      const over = room.scrollWidth - room.clientWidth;
      if (over > 2) { room.style.setProperty('--mq-sobra', `${-over}px`); void room.offsetWidth; room.classList.add('largo'); }
      if (t.id === 'b') {
        strip.querySelector('.mq-tiempo')?.remove();
        const bar = doc.createElement('span');
        bar.className = 'mq-tiempo';
        strip.append(bar);
      }
    };
    show(0);
    const tick = () => { if (!paused) show(i + 1); };
    timer = setInterval(tick, STEP_MS);
    // Back from a splash: that headline was read, so the next one comes in and the step starts again
    resume = () => { clearInterval(timer); show(i + 1); timer = setInterval(tick, STEP_MS); };
  }

  strip.addEventListener('click', e => {
    const b = e.target.closest('.mq-item');
    if (b) onPick?.(b.dataset.id);
  });

  return {
    // While a splash is open the strip waits
    pause(on) {
      paused = on;
      strip.classList.toggle('pausa', on);
      if (!on) resume();
    },
    destroy() { clearInterval(timer); strip.remove(); },
  };
}
