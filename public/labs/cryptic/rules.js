/**
 * Cryptic: the game's data, no logic (C-2). Texts in LOCALES = { es, en, pt } with the same keys (C-3);
 * the clues are in clues.js, the rules in engine.js. See docs/games/cryptic.md.
 */

export const GAME_ID = 'cryptic';
/** The language of the clues: Spanish only for now (clues.js). */
export const CLUE_LANG = 'es';
export const KIND_KEYS = ['anagram', 'reversal', 'hidden', 'charade', 'container', 'deletion', 'homophone', 'definitions', 'selector'];

const ES = {
  ui: {
    docTitle: 'Críptico 🗝️ · Juegos de Salón', gameChip: '🗝️ Críptico', menu: '‹ Laboratorio',
    title: 'Críptico', lead: 'Pistas directas, indirectas y con truco para encontrar una palabra.',
    howTitle: '🗝️ Cómo se juega',
    modeToday: 'Jugar la pista de hoy', modeTodayHint: 'N.º {n}: una nueva cada día', modeTodayDone: 'Hoy: {stars}. Vuelve mañana por otra.', modeTodayAgain: 'Ver la pista de hoy',
    modePractice: 'Practicar con otras pistas',
    clueNumber: 'Pista n.º {n}', practiceLabel: 'Pista de práctica', inSpanish: '⚠️ Las pistas están en español',
    placeholder: 'Escribe la respuesta', check: 'Comprobar',
    wrong: '❌ «{g}» no es. Prueba otra.', lengthWrong: 'La respuesta tiene {n} letras y escribiste {m}.',
    hintBtn: '💡 Ayuda: cuesta 1 ⭐', hintKind: '🧩 Juego de palabras: {kind}.', hintDef: '🖍️ La definición está subrayada.', hintFirst: '🔤 Empieza con {letter}.',
    giveUp: 'Me rindo', giveUpSure: 'Sí, mostrar la respuesta', streakLost: '💔 Se cortó la racha',
    solvedTitle: '¡Resuelta!', gaveUpTitle: 'La respuesta era {a}',
    tries: '{n} intentos', triesOne: '1 intento', streakMany: '🔥 Racha de {n} días', streakOne: '🔥 Racha de 1 día',
    howSolved: '🧩 Cómo se arma', nextClue: 'La próxima pista sale a medianoche.',
    practiceAgain: 'Otra pista de práctica', practiceNote: 'Pista de práctica: no cuenta para la racha.',
    resumeTitle: '⏯ Tienes una pista a medias', resume: 'Continuar', delete: 'Borrar',
    shareRotulo: '📤 Compartir', shareContext: 'Pista n.º {n}', shareHints: '💡 {n} ayudas', shareHintsOne: '💡 1 ayuda', shareGaveUp: '🏳️ Me rendí',
    // «Propón tu críptico» (propose.js) and the day a player's own clue comes up (the owner, 2026-11-19)
    proposeAsk: '✍️ ¿Se te ocurre uno?', proposeBtn: 'Propón tu críptico', proposeTitle: 'Propón tu críptico', proposeKind: '🗝️ Críptico',
    proposeIntro: 'Si nos gusta, lo publicamos con tu nombre. El día que salga, todos juegan tu pista menos tú, y tu racha sigue.',
    proposeInSpanish: 'Por ahora las pistas son en español: escribe la tuya en español.',
    proposeClue: 'La pista', proposeCluePh: 'Ej.: Una monja alborotada termina en el sándwich',
    proposeAnswer: 'La respuesta', proposeAnswerPh: 'Ej.: JAMÓN',
    proposeHow: 'Cómo se llega a la respuesta (opcional)', proposeHowPh: 'Ej.: las letras de MONJA, revueltas, forman JAMÓN',
    proposeName: 'Tu nombre, como saldrá en la pista', proposeSend: 'Enviar mi críptico', proposeSending: 'Enviando…',
    proposeMissing: 'Escribe la pista y su respuesta.', proposeCancel: 'Cancelar', proposeClose: 'Cerrar',
    proposeThanks: '¡Gracias! Lo vamos a revisar. Si sale publicado, verás tu nombre en la pista.',
    proposeSaved: 'Quedó guardado en tu celular y se envía apenas haya conexión.', proposeError: 'No se pudo enviar. Prueba de nuevo.',
    credit: 'Críptico de {n}', yourDayTitle: 'Hoy es tu críptico', yourDayLine: 'Todos la juegan menos tú, y tu racha sigue.',
    modeTodayYours: 'Ver tu críptico de hoy', modeTodayYoursHint: 'Hoy todos juegan tu pista',
  },
  kinds: {
    anagram: 'anagrama (las letras de una palabra, en otro orden)', reversal: 'al revés (una palabra leída hacia atrás)',
    hidden: 'escondida (la respuesta va dentro de otras palabras)', charade: 'suma (palabras pegadas una tras otra)',
    container: 'dentro de otra (una palabra metida en otra)', deletion: 'le falta una letra (una palabra sin un pedazo)',
    homophone: 'suena igual (dos palabras que se oyen parecido)', definitions: 'dos definiciones (la palabra tiene dos significados)',
    selector: 'iniciales (las primeras letras de varias palabras)',
  },
  como: [
    '🎯 Adivina la palabra: una parte de la pista la define y el resto la arma con un juego de palabras.',
    '🧩 Valen anagramas, palabras al revés o escondidas, sumas y sonidos parecidos.',
    '⭐ Resolverla vale 3 estrellas y cada ayuda cuesta una. Sale una pista nueva cada día.',
  ],
};

const EN = {
  ui: {
    docTitle: 'Cryptic 🗝️ · Parlor Games', gameChip: '🗝️ Cryptic', menu: '‹ Lab',
    title: 'Cryptic', lead: 'Direct, indirect and tricky clues to find a word.',
    howTitle: '🗝️ How to play',
    modeToday: "Play today's clue", modeTodayHint: 'No. {n}: a new one every day', modeTodayDone: 'Today: {stars}. Come back tomorrow for another.', modeTodayAgain: "See today's clue",
    modePractice: 'Practice with other clues',
    clueNumber: 'Clue No. {n}', practiceLabel: 'Practice clue', inSpanish: '⚠️ The clues are in Spanish',
    placeholder: 'Type the answer', check: 'Check',
    wrong: '❌ "{g}" is not it. Try another.', lengthWrong: 'The answer has {n} letters and you typed {m}.',
    hintBtn: '💡 Hint: costs 1 ⭐', hintKind: '🧩 Wordplay: {kind}.', hintDef: '🖍️ The definition is underlined.', hintFirst: '🔤 It starts with {letter}.',
    giveUp: 'I give up', giveUpSure: 'Yes, show the answer', streakLost: '💔 Your streak is broken',
    solvedTitle: 'Solved!', gaveUpTitle: 'The answer was {a}',
    tries: '{n} tries', triesOne: '1 try', streakMany: '🔥 {n}-day streak', streakOne: '🔥 1-day streak',
    howSolved: '🧩 How it works', nextClue: 'The next clue comes out at midnight.',
    practiceAgain: 'Another practice clue', practiceNote: 'Practice clue: it does not count for your streak.',
    resumeTitle: '⏯ You have a clue in progress', resume: 'Continue', delete: 'Delete',
    shareRotulo: '📤 Share', shareContext: 'Clue No. {n}', shareHints: '💡 {n} hints', shareHintsOne: '💡 1 hint', shareGaveUp: '🏳️ I gave up',
    // «Propose your cryptic» (propose.js) and the day a player's own clue comes up (the owner, 2026-11-19)
    proposeAsk: '✍️ Got one of your own?', proposeBtn: 'Propose your clue', proposeTitle: 'Propose your clue', proposeKind: '🗝️ Cryptic',
    proposeIntro: 'If we like it, we publish it with your name. On its day everyone plays your clue but you, and your streak goes on.',
    proposeInSpanish: 'For now the clues are in Spanish: write yours in Spanish.',
    proposeClue: 'The clue', proposeCluePh: 'E.g.: Una monja alborotada termina en el sándwich',
    proposeAnswer: 'The answer', proposeAnswerPh: 'E.g.: JAMÓN',
    proposeHow: 'How to get to the answer (optional)', proposeHowPh: 'E.g.: the letters of MONJA, mixed up, make JAMÓN',
    proposeName: 'Your name, as it will show on the clue', proposeSend: 'Send my clue', proposeSending: 'Sending…',
    proposeMissing: 'Write the clue and its answer.', proposeCancel: 'Cancel', proposeClose: 'Close',
    proposeThanks: 'Thanks! We will look at it. If it is published, you will see your name on the clue.',
    proposeSaved: 'It is saved on your phone and goes out as soon as there is a connection.', proposeError: 'It could not be sent. Try again.',
    credit: 'Clue by {n}', yourDayTitle: 'Today\'s clue is yours', yourDayLine: 'Everyone plays it but you, and your streak goes on.',
    modeTodayYours: 'See your clue of the day', modeTodayYoursHint: 'Today everyone plays your clue',
  },
  kinds: {
    anagram: 'anagram (the letters of a word, in another order)', reversal: 'reversal (a word read backwards)',
    hidden: 'hidden (the answer sits inside other words)', charade: 'charade (words joined one after another)',
    container: 'container (one word put inside another)', deletion: 'deletion (a word missing a piece)',
    homophone: 'sounds like (two words that sound alike)', definitions: 'double definition (the word has two meanings)',
    selector: 'initials (the first letters of several words)',
  },
  como: [
    '🎯 Guess the word: one part of the clue defines it and the rest builds it with wordplay.',
    '🧩 Anagrams, words reversed or hidden, words joined together and sound-alikes all count.',
    '⭐ Solving it is worth 3 stars and each hint costs one. There is a new clue every day.',
  ],
};

const PT = {
  ui: {
    docTitle: 'Críptico 🗝️ · Jogos de Salão', gameChip: '🗝️ Críptico', menu: '‹ Laboratório',
    title: 'Críptico', lead: 'Pistas diretas, indiretas e com truque para encontrar uma palavra.',
    howTitle: '🗝️ Como se joga',
    modeToday: 'Jogar a pista de hoje', modeTodayHint: 'N.º {n}: uma nova a cada dia', modeTodayDone: 'Hoje: {stars}. Volte amanhã para outra.', modeTodayAgain: 'Ver a pista de hoje',
    modePractice: 'Praticar com outras pistas',
    clueNumber: 'Pista n.º {n}', practiceLabel: 'Pista de prática', inSpanish: '⚠️ As pistas estão em espanhol',
    placeholder: 'Escreva a resposta', check: 'Conferir',
    wrong: '❌ «{g}» não é. Tente outra.', lengthWrong: 'A resposta tem {n} letras e você escreveu {m}.',
    hintBtn: '💡 Ajuda: custa 1 ⭐', hintKind: '🧩 Jogo de palavras: {kind}.', hintDef: '🖍️ A definição está sublinhada.', hintFirst: '🔤 Começa com {letter}.',
    giveUp: 'Desisto', giveUpSure: 'Sim, mostrar a resposta', streakLost: '💔 A sequência foi interrompida',
    solvedTitle: 'Resolvida!', gaveUpTitle: 'A resposta era {a}',
    tries: '{n} tentativas', triesOne: '1 tentativa', streakMany: '🔥 Sequência de {n} dias', streakOne: '🔥 Sequência de 1 dia',
    howSolved: '🧩 Como se monta', nextClue: 'A próxima pista sai à meia-noite.',
    practiceAgain: 'Outra pista de prática', practiceNote: 'Pista de prática: não conta para a sequência.',
    resumeTitle: '⏯ Você tem uma pista pela metade', resume: 'Continuar', delete: 'Apagar',
    shareRotulo: '📤 Compartilhar', shareContext: 'Pista n.º {n}', shareHints: '💡 {n} ajudas', shareHintsOne: '💡 1 ajuda', shareGaveUp: '🏳️ Desisti',
    // «Proponha seu críptico» (propose.js) and the day a player's own clue comes up (the owner, 2026-11-19)
    proposeAsk: '✍️ Quer criar um?', proposeBtn: 'Proponha seu críptico', proposeTitle: 'Proponha seu críptico', proposeKind: '🗝️ Críptico',
    proposeIntro: 'Se gostarmos, publicamos com seu nome. No dia dele, todos jogam sua pista menos você, e sua sequência continua.',
    proposeInSpanish: 'Por enquanto as pistas são em espanhol: escreva a sua em espanhol.',
    proposeClue: 'A pista', proposeCluePh: 'Ex.: Una monja alborotada termina en el sándwich',
    proposeAnswer: 'A resposta', proposeAnswerPh: 'Ex.: JAMÓN',
    proposeHow: 'Como se chega à resposta (opcional)', proposeHowPh: 'Ex.: as letras de MONJA, embaralhadas, formam JAMÓN',
    proposeName: 'Seu nome, como vai aparecer na pista', proposeSend: 'Enviar meu críptico', proposeSending: 'Enviando…',
    proposeMissing: 'Escreva a pista e a resposta.', proposeCancel: 'Cancelar', proposeClose: 'Fechar',
    proposeThanks: 'Obrigado! Vamos revisar. Se for publicado, você verá seu nome na pista.',
    proposeSaved: 'Ficou salvo no seu celular e é enviado assim que houver conexão.', proposeError: 'Não deu para enviar. Tente de novo.',
    credit: 'Críptico de {n}', yourDayTitle: 'Hoje é o seu críptico', yourDayLine: 'Todos jogam menos você, e sua sequência continua.',
    modeTodayYours: 'Ver seu críptico de hoje', modeTodayYoursHint: 'Hoje todos jogam sua pista',
  },
  kinds: {
    anagram: 'anagrama (as letras de uma palavra, em outra ordem)', reversal: 'ao contrário (uma palavra lida de trás para frente)',
    hidden: 'escondida (a resposta está dentro de outras palavras)', charade: 'soma (palavras coladas uma após a outra)',
    container: 'dentro de outra (uma palavra posta dentro de outra)', deletion: 'falta uma letra (uma palavra sem um pedaço)',
    homophone: 'soa igual (duas palavras que soam parecido)', definitions: 'duas definições (a palavra tem dois sentidos)',
    selector: 'iniciais (as primeiras letras de várias palavras)',
  },
  como: [
    '🎯 Adivinhe a palavra: uma parte da pista a define e o resto a monta com um jogo de palavras.',
    '🧩 Valem anagramas, palavras ao contrário ou escondidas, somas e sons parecidos.',
    '⭐ Resolver vale 3 estrelas e cada ajuda custa uma. Há uma pista nova a cada dia.',
  ],
};

export const LOCALES = { es: ES, en: EN, pt: PT };
