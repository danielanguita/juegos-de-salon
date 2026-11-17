"""Puts the 3D game's page together: python3 build.py

The page's shell (markup, shared CSS) and the sound code come from template.html; the game is
sim.js (physics and rules), texts.js (es/en/pt) and view.js (drawing, sound, input, cards).
Writes public/labs/wobbles-3d/index.html, with the lab's head (door, noindex, manifest, panel
signal) and the site's fonts; from the repo root: python3 tools/generators/wobbles-3d/build.py
"""
import os, re
N=os.path.dirname(os.path.abspath(__file__))+'/'
neon=open(N+'template.html').read()
head=neon[:neon.index("<script>\n")+len("<script>\n")]
assert head.count('<title>⚖️ La Balanza</title>')==1 and head.count('<span>La Balanza</span>')==1
head=head.replace('<title>⚖️ La Balanza</title>','<title>⚖️ Tembleque 3D</title>').replace('<span>La Balanza</span>','<span>Tembleque 3D</span>')
# this game's own touches on the shared look: the lives sit in the middle of the top bar, and the instructions are a short list with icons
css='''  #chip { background: none; padding: 0; width: 106px; height: 28px; }
  /* The three hearts: a canvas of their own over the middle of the top bar, tall enough for the pieces of a broken one to fall */
  #hearts { position: absolute; left: 50%; top: 0; width: 240px; height: 150px; margin-left: -120px; pointer-events: none; }
  #cBody .lema { margin: 0 0 10px; text-align: center; color: var(--ink); font: 400 1.25rem var(--font-display); letter-spacing: 0.04em; }
  #cBody .steps { list-style: none; margin: 0; padding: 0; }
  #cBody .steps li { display: grid; grid-template-columns: 92px 1fr; gap: 10px; align-items: center; margin: 0 0 6px; padding: 4px 8px 4px 6px; border-radius: 14px; background: rgba(0, 0, 0, 0.24); }
  #cBody .steps svg { width: 92px; height: 64px; display: block; overflow: visible; }
  #cBody .steps b { display: flex; align-items: center; gap: 7px; margin-bottom: 2px; color: var(--ink); font: 400 1.1rem var(--font-display); letter-spacing: 0.04em; }
  #cBody .steps .n { display: inline-grid; place-items: center; width: 1.45em; height: 1.45em; border-radius: 50%; background: var(--yellow); color: #3a1200; font-size: 0.95rem; }
  #cBody .steps p { margin: 0; font-size: 0.82rem; line-height: 1.22; }
  #cBody .pie { margin: 8px 0 0; text-align: center; font-size: 0.82rem; line-height: 1.5; }
  /* The pictures move: 1, the piece is carried across and dropped; 2, it turns under a held finger; 3, the board turns under two fingertips; 4, the disc rocks, a second piece levels it, and the hoop goes green */
  .il-move { animation: ilMove 3.4s ease-in-out infinite; } .il-drop { animation: ilDrop 3.4s ease-in infinite; } .il-finger { animation: ilFinger 3.4s linear infinite; }
  @keyframes ilMove { 0% { transform: translateX(-16px); } 50%, 100% { transform: translateX(14px); } }
  @keyframes ilDrop { 0%, 58% { transform: translateY(0); } 76%, 100% { transform: translateY(30px); } }
  @keyframes ilFinger { 0%, 52% { opacity: 1; } 62%, 100% { opacity: 0; } }
  .il-turn { transform-origin: 60px 32px; animation: ilTurn 3.2s ease-in-out infinite; } .il-hold { animation: ilHold 3.2s ease-in-out infinite; }
  @keyframes ilTurn { 0%, 25% { transform: rotate(0deg); } 55% { transform: rotate(38deg); } 85%, 100% { transform: rotate(-30deg); } }
  @keyframes ilHold { 0%, 25% { transform: translateX(0); } 55% { transform: translateX(22px); } 85%, 100% { transform: translateX(-18px); } }
  .il-spin { animation: ilSpin 7s linear infinite; } .il-twist { animation: ilSpin 7s linear infinite; } .il-thumb { animation: ilThumb 3.5s ease-in-out infinite alternate; }
  @keyframes ilThumb { from { transform: translateX(-20px); } to { transform: translateX(20px); } }
  @keyframes ilSpin { to { transform: rotate(-360deg); } }
  .il-rock { transform-origin: 60px 52px; animation: ilRock 4s ease-in-out infinite; } .il-second { animation: ilSecond 4s linear infinite; }
  .il-hoop { animation: ilHoop 4s linear infinite; } .il-ok { animation: ilOk 4s linear infinite; }
  @keyframes ilRock { 0%, 38% { transform: rotate(-9deg); } 56% { transform: rotate(3deg); } 70%, 100% { transform: rotate(0deg); } }
  @keyframes ilSecond { 0%, 38% { opacity: 0; transform: translateY(-14px); } 46%, 100% { opacity: 1; transform: translateY(0); } }
  @keyframes ilHoop { 0%, 68% { stroke: #fff; } 74%, 100% { stroke: #9dff3a; } }
  @keyframes ilOk { 0%, 68% { opacity: 0; } 74%, 100% { opacity: 1; } }
  @media (prefers-reduced-motion: reduce) { #cBody .steps svg * { animation: none !important; } }
'''
assert head.count('</style>')==1 and head.count('<div id="hud">')==1
head=head.replace('<div id="hud">','<canvas id="hearts" aria-hidden="true"></canvas>\n  <div id="hud">')
head=head.replace('</style>',css+'</style>')
sound=neon[neon.index("/* ---------- sound: synthesized"):neon.index("/** What the game says happened")]
sim=open(N+'sim.js').read()+open(N+'texts.js').read(); view=open(N+'view.js').read()
assert view.count('/*__SOUND__*/')==1
out=head+sim+view.replace('/*__SOUND__*/',sound)
out=out.replace('href="fonts/','href="../../assets/fonts/').replace("url('fonts/","url('../../assets/fonts/")
LAB=r'''  <!-- A lab game (D-395): behind the lab's door (D-281) and not indexed. The game below is the owner's
       prototype as delivered, kept whole: see docs/games/wobbles-3d.md -->
  <script src="../../assets/js/labs-puerta.js"></script>
  <meta name="robots" content="noindex, nofollow">
  <link rel="manifest" href="../../manifest.webmanifest">
  <script>
    // The chosen language's manifest, before the browser reads it (D-222)
    (function () {
      try {
        var l = (new URLSearchParams(location.search).get('lang') || localStorage.getItem('juegos-de-salon:lang') || '').toLowerCase();
        var m = document.querySelector('link[rel="manifest"]');
        if (m && /^(en|pt)$/.test(l)) m.href = m.href.replace(/manifest\.webmanifest$/, 'manifest.' + l + '.webmanifest');
      } catch (_) { /* the Spanish one stays */ }
    })();
  </script>
  <link rel="icon" href="../../assets/icon.svg" type="image/svg+xml">
  <script src="../../assets/js/vigia.js"></script>
  <meta name="apple-mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
  <meta name="apple-mobile-web-app-title" content="Juegos de Salón">
  <link rel="apple-touch-icon" href="../../assets/icons/apple-touch-icon.png">
  <script type="module">import '../../assets/js/instalable.js';</script>
  <script type="module">import './game.js';</script>
'''
out=out.replace('<link rel="preload"',LAB+'<link rel="preload"',1)
open(N+'../../../public/labs/wobbles-3d/index.html','w').write(out)
simpart=out[out.index('/* Physics: bodies made of'):out.index('/* The texts, in the site')]
print(len(out),'bytes; Math calls in the simulation:',sorted(set(re.findall(r'Math\.\w+',simpart))))
