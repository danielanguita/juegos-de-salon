
/* ================================================================== */
/* The texts, in the site's three languages                            */
/* ================================================================== */
/**
 * In the shape of the site's texts files (cup/games/<game>/texts.js), ready to be lifted there, and the
 * same shape as the 2D game's: `juego` is the game's entry in `juegos`; `ui`, the keys its screen reads,
 * all prefixed `b3`. Plural forms are [none, one, many]. A value 'a|b' is a title and its line: the steps
 * of the start card, and each piece's name with what is said when it first comes. A key ending in `Desk`
 * is the same text for a mouse.
 */
const ES = {
  juego: {
    nombre: 'Tembleque', habilidad: 'espacial',
    como: [
      'Arrastra la pieza sobre el disco y suéltala: su sombra muestra dónde cae. Antes de soltarla puedes girarla.',
      'Gira el tablero para mirar la pila por todos lados y reparte el peso: si el disco se inclina demasiado, se vuelca y se acaba.',
      'Tienes 3 vidas: cada pieza que cae al vacío te cuesta una. Cada vez tienes menos tiempo para ubicarlas.',
    ],
    puntaje: 'Cada pieza que se queda vale 1 punto. Si el disco queda nivelado es ¡Perfecto!, y cada uno seguido suma 1, 2, 3… hasta 5 más.',
    puntajeFinal: 'En la final cuentan tus puntos tal cual, hasta un máximo de 100.',
    desempate: 'Si empatas, gana quien tardó menos.',
  },
  ui: {
    b3Lema: 'Apila todo. Que no se caiga nada.',
    b3Step1: 'Mueve y suelta|Arrastra la pieza y suelta. Su sombra muestra dónde cae.',
    b3Step1Desk: 'Mueve y suelta|Mueve el mouse y haz clic. Su sombra muestra dónde cae.',
    b3Step2: 'Gira la pieza|Antes de soltar, deja el dedo quieto: ahora la giras 360° y eliges de qué lado cae.',
    b3Step2Desk: 'Gira la pieza|Mantén el botón apretado y arrastra: la giras 360° y eliges de qué lado cae.',
    b3Step3: 'Gira el tablero|Con dos dedos, o deslizando la rueda de arriba.',
    b3Step3Desk: 'Gira el tablero|Arrastra la rueda de arriba, o usa Q y E.',
    b3Step4: 'Equilibra|Borde y aro alineados: ¡Perfecto! Si se inclina demasiado, se vuelca.',
    b3AutoNote: 'La pieza cae sola después de {n} segundos',
    b3LivesNote: '3 vidas',
    b3Play: '▶ Jugar',
    b3Again: '↻ Otra vez',
    b3New: 'Nueva: {n}',
    b3Perfect: '¡Perfecto!',
    b3Streak: 'Perfecto ×{n}',
    b3Fell: '¡Se cayó!',
    b3LastLife: '¡Se cayó! ¡Última vida!',
    b3Auto: '¡Se soltó sola!',
    b3Tipping: '¡Se vuelca!',
    b3Tipped: '¡Se volcó!',
    b3Over: 'Fin del juego',
    b3Paused: 'En pausa',
    b3Resume: 'Toca para seguir',
    b3HintMove: 'Arrastra para mover · suelta para dejar caer',
    b3HintMoveDesk: 'Mueve el mouse · clic para soltar',
    b3HintBoard: 'Gira el tablero con dos dedos · o con la rueda de arriba',
    b3HintBoardDesk: 'Gira el tablero: arrastra la rueda de arriba · o Q y E',
    b3HintPiece: 'Sin soltar, deja el dedo quieto: ahora giras la pieza',
    b3HintPieceDesk: 'Mantén el botón apretado: ahora giras la pieza',
    b3HintLevel: 'Alinea el borde con el aro: verde es ¡Perfecto!',
    b3Turns: 'gira',
    b3Moves: 'mueve',
    b3BdTipped: '💥 El disco se inclinó demasiado y se volcó.',
    b3BdPieces: ['🧱 Ninguna pieza apilada.', '🧱 1 pieza apilada: +1.', '🧱 {n} piezas apiladas: +{n}.'],
    b3BdPerfects: ['✨ Ningún perfecto.', '✨ 1 perfecto: +{p}.', '✨ {n} perfectos: +{p}.'],
    b3BdStreak: '🔥 Racha perfecta más larga: {n}.',
    b3BdHeight: '📏 Tu pila llegó a {m} m de alto.',
    b3BdTime: '⏱ Tiempo: {t}.',
    b3LivesAria: ['Sin vidas', 'Te queda 1 vida', 'Te quedan {n} vidas'],
    b3Back: 'Volver',
    b3Sound: 'Sonido',
    b3Cubo: 'Cubo|firme y parejo',
    b3Ladrillo: 'Ladrillo|ancho y estable',
    b3Triangulo: 'Triángulo|nada se queda en su punta',
    b3Ele: 'Ele|deja un escalón',
    b3Bola: 'Bola|rueda',
    b3Te: 'Te|una barra con un tope',
    b3Domo: 'Domo|se mece',
    b3Hexagono: 'Hexágono|casi rueda',
    b3Zeta: 'Zeta|hace escalera',
    b3Cruz: 'Cruz|cuatro puntas',
  },
};

const EN = {
  juego: {
    nombre: 'The Wobbles', habilidad: 'spatial',
    como: [
      'Drag the piece over the disc and let go: its shadow shows where it lands. Before letting go you can turn it.',
      'Turn the board to look at the pile from every side and spread the weight: if the disc leans too far, it tips over and the game ends.',
      'You have 3 lives: each piece that falls off costs you one. You get less and less time to place them.',
    ],
    puntaje: 'Each piece that stays is worth 1 point. If the disc ends level it is a Perfect!, and each one in a row adds 1, 2, 3… up to 5 more.',
    puntajeFinal: 'In the final your points count as they are, up to a maximum of 100.',
    desempate: 'If tied, whoever took less time wins.',
  },
  ui: {
    b3Lema: 'Stack it all. Let nothing fall.',
    b3Step1: 'Move and drop|Drag the piece and let go. Its shadow shows where it lands.',
    b3Step1Desk: 'Move and drop|Move the mouse and click. Its shadow shows where it lands.',
    b3Step2: 'Turn the piece|Before letting go, rest your finger: now you turn it 360° and choose which side lands.',
    b3Step2Desk: 'Turn the piece|Hold the button down and drag: you turn it 360° and choose which side lands.',
    b3Step3: 'Turn the board|With two fingers, or by sliding the dial at the top.',
    b3Step3Desk: 'Turn the board|Drag the dial at the top, or use Q and E.',
    b3Step4: 'Balance|Rim and hoop lined up: Perfect! If it leans too far, it tips over.',
    b3AutoNote: 'The piece drops by itself after {n} seconds',
    b3LivesNote: '3 lives',
    b3Play: '▶ Play',
    b3Again: '↻ Play again',
    b3New: 'New: {n}',
    b3Perfect: 'Perfect!',
    b3Streak: 'Perfect ×{n}',
    b3Fell: 'It fell!',
    b3LastLife: 'It fell! Last life!',
    b3Auto: 'It dropped by itself!',
    b3Tipping: 'It is tipping!',
    b3Tipped: 'It tipped over!',
    b3Over: 'Game over',
    b3Paused: 'Paused',
    b3Resume: 'Tap to continue',
    b3HintMove: 'Drag to move · let go to drop',
    b3HintMoveDesk: 'Move the mouse · click to drop',
    b3HintBoard: 'Turn the board with two fingers · or with the dial at the top',
    b3HintBoardDesk: 'Turn the board: drag the dial at the top · or Q and E',
    b3HintPiece: 'Without letting go, rest your finger: now you turn the piece',
    b3HintPieceDesk: 'Hold the button down: now you turn the piece',
    b3HintLevel: 'Line the rim up with the hoop: green is Perfect!',
    b3Turns: 'turn',
    b3Moves: 'move',
    b3BdTipped: '💥 The disc leaned too far and tipped over.',
    b3BdPieces: ['🧱 No pieces stacked.', '🧱 1 piece stacked: +1.', '🧱 {n} pieces stacked: +{n}.'],
    b3BdPerfects: ['✨ No perfects.', '✨ 1 perfect: +{p}.', '✨ {n} perfects: +{p}.'],
    b3BdStreak: '🔥 Longest perfect streak: {n}.',
    b3BdHeight: '📏 Your pile reached {m} m.',
    b3BdTime: '⏱ Time: {t}.',
    b3LivesAria: ['No lives left', '1 life left', '{n} lives left'],
    b3Back: 'Back',
    b3Sound: 'Sound',
    b3Cubo: 'Cube|steady and even',
    b3Ladrillo: 'Brick|wide and stable',
    b3Triangulo: 'Triangle|nothing stays on its tip',
    b3Ele: 'L-piece|leaves a step',
    b3Bola: 'Ball|it rolls',
    b3Te: 'T-piece|a bar with a bump',
    b3Domo: 'Dome|it rocks',
    b3Hexagono: 'Hexagon|it almost rolls',
    b3Zeta: 'Z-piece|makes a staircase',
    b3Cruz: 'Cross|four points',
  },
};

const PT = {
  juego: {
    nombre: 'Tremelique', habilidad: 'espacial',
    como: [
      'Arraste a peça sobre o disco e solte: a sombra mostra onde ela cai. Antes de soltar você pode girá-la.',
      'Gire o tabuleiro para ver a pilha de todos os lados e distribua o peso: se o disco inclinar demais, ele vira e o jogo acaba.',
      'Você tem 3 vidas: cada peça que cai no vazio custa uma. Você tem cada vez menos tempo para posicioná-las.',
    ],
    puntaje: 'Cada peça que fica vale 1 ponto. Se o disco ficar nivelado é Perfeito!, e cada um seguido soma 1, 2, 3… até 5 a mais.',
    puntajeFinal: 'Na final seus pontos contam como estão, até no máximo 100.',
    desempate: 'Se empatar, ganha quem demorou menos.',
  },
  ui: {
    b3Lema: 'Empilhe tudo. Não deixe nada cair.',
    b3Step1: 'Mova e solte|Arraste a peça e solte. A sombra mostra onde ela cai.',
    b3Step1Desk: 'Mova e solte|Mova o mouse e clique. A sombra mostra onde ela cai.',
    b3Step2: 'Gire a peça|Antes de soltar, deixe o dedo parado: agora você a gira 360° e escolhe de que lado ela cai.',
    b3Step2Desk: 'Gire a peça|Segure o botão e arraste: você a gira 360° e escolhe de que lado ela cai.',
    b3Step3: 'Gire o tabuleiro|Com dois dedos, ou deslizando a roda de cima.',
    b3Step3Desk: 'Gire o tabuleiro|Arraste a roda de cima, ou use Q e E.',
    b3Step4: 'Equilibre|Borda e aro alinhados: Perfeito! Se inclinar demais, ele vira.',
    b3AutoNote: 'A peça cai sozinha depois de {n} segundos',
    b3LivesNote: '3 vidas',
    b3Play: '▶ Jogar',
    b3Again: '↻ De novo',
    b3New: 'Nova: {n}',
    b3Perfect: 'Perfeito!',
    b3Streak: 'Perfeito ×{n}',
    b3Fell: 'Caiu!',
    b3LastLife: 'Caiu! Última vida!',
    b3Auto: 'Soltou sozinha!',
    b3Tipping: 'Vai virar!',
    b3Tipped: 'Virou!',
    b3Over: 'Fim de jogo',
    b3Paused: 'Pausado',
    b3Resume: 'Toque para continuar',
    b3HintMove: 'Arraste para mover · solte para deixar cair',
    b3HintMoveDesk: 'Mova o mouse · clique para soltar',
    b3HintBoard: 'Gire o tabuleiro com dois dedos · ou com a roda de cima',
    b3HintBoardDesk: 'Gire o tabuleiro: arraste a roda de cima · ou Q e E',
    b3HintPiece: 'Sem soltar, deixe o dedo parado: agora você gira a peça',
    b3HintPieceDesk: 'Segure o botão: agora você gira a peça',
    b3HintLevel: 'Alinhe a borda com o aro: verde é Perfeito!',
    b3Turns: 'gira',
    b3Moves: 'move',
    b3BdTipped: '💥 O disco inclinou demais e virou.',
    b3BdPieces: ['🧱 Nenhuma peça empilhada.', '🧱 1 peça empilhada: +1.', '🧱 {n} peças empilhadas: +{n}.'],
    b3BdPerfects: ['✨ Nenhum perfeito.', '✨ 1 perfeito: +{p}.', '✨ {n} perfeitos: +{p}.'],
    b3BdStreak: '🔥 Maior sequência perfeita: {n}.',
    b3BdHeight: '📏 Sua pilha chegou a {m} m de altura.',
    b3BdTime: '⏱ Tempo: {t}.',
    b3LivesAria: ['Sem vidas', 'Resta 1 vida', 'Restam {n} vidas'],
    b3Back: 'Voltar',
    b3Sound: 'Som',
    b3Cubo: 'Cubo|firme e certinho',
    b3Ladrillo: 'Tijolo|largo e estável',
    b3Triangulo: 'Triângulo|nada fica na sua ponta',
    b3Ele: 'Ele|deixa um degrau',
    b3Bola: 'Bola|rola',
    b3Te: 'Tê|uma barra com um ressalto',
    b3Domo: 'Cúpula|balança',
    b3Hexagono: 'Hexágono|quase rola',
    b3Zeta: 'Zê|faz uma escada',
    b3Cruz: 'Cruz|quatro pontas',
  },
};
const TEXTS = { es: ES, en: EN, pt: PT };
/** The language: `?lang=en` in the address, else the one the site saved on this phone, else Spanish. */
const LANG = (() => {
  try { const l = (new URLSearchParams(location.search).get('lang') || localStorage.getItem('juegos-de-salon:lang') || 'es').toLowerCase().slice(0, 2); return TEXTS[l] ? l : 'es'; } catch (_) { return 'es'; }
})();
const GAME = TEXTS[LANG].juego, UI = TEXTS[LANG].ui;
/** A text with its {blanks} filled in. */
const fmt = (s, o) => s.replace(/\{(\w+)\}/g, (_, k) => o[k]);
/** The text of a key, for a mouse if there is one and the key has a text for it. */
const FINE = matchMedia('(pointer: fine)').matches;
const ui = (key, o) => { const s = (FINE && UI[key + 'Desk']) || UI[key]; return o ? fmt(s, o) : s; };
/** One of a key's plural forms [none, one, many]. */
const some = (key, n, o) => fmt(UI[key][n === 1 ? 1 : n ? 2 : 0], { n, ...o });
/** A piece's [name, line]. */
const kindText = kind => UI['b3' + kind[0].toUpperCase() + kind.slice(1)].split('|');
/** A number with one decimal, as the language writes it. */
const decimal = v => (LANG === 'en' ? v.toFixed(1) : v.toFixed(1).replace('.', ','));
document.documentElement.lang = LANG; document.title = `⚖️ ${GAME.nombre}`;
