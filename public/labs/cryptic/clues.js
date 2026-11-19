/**
 * Cryptic: the clue banks, one per language (data only, C-2). Every clue is our own.
 *
 * A clue reads two ways: a definition of the answer, at one end, and a wordplay that builds it.
 *   c  the clue as the player reads it, without the length (the game adds "(4)")
 *   a  the answer, in capitals, accents as written (the check ignores them, Ñ stays Ñ)
 *   k  the kind of wordplay, a key of KINDS in rules.js
 *   d  the definition, word for word as it appears in `c` (the second hint marks it)
 *   x  how it is solved, shown on the result
 *
 * A clue does not translate: another language gets its own bank, written on its own. Spanish only for
 * now; a player in English or Portuguese reads the Spanish clue with a notice that says so.
 * engine.test.mjs checks every clue (the definition is inside it, the anagrams and hidden words add up).
 */

const ES = [
  { c: 'Amor que da la vuelta en la ciudad eterna', a: 'ROMA', k: 'reversal', d: 'la ciudad eterna', x: 'AMOR al revés es ROMA, la ciudad eterna.' },
  { c: 'Felino que se esconde en el valle ondulado', a: 'LEÓN', k: 'hidden', d: 'Felino', x: 'Escondido en «valLE ONdulado»: LEÓN.' },
  { c: 'Ramo revuelto: lo que sientes por tu pareja', a: 'AMOR', k: 'anagram', d: 'lo que sientes por tu pareja', x: 'Las letras de RAMO revueltas forman AMOR.' },
  { c: 'Asiento del parque que guarda tus ahorros', a: 'BANCO', k: 'definitions', d: 'Asiento del parque', x: 'BANCO es un asiento del parque y también donde se guarda el dinero.' },
  { c: 'Océano, infusión y una ese: día de mala suerte', a: 'MARTES', k: 'charade', d: 'día de mala suerte', x: 'MAR + TÉ + S = MARTES, el día de mala suerte.' },
  { c: 'Astro y cubo de juego: militar', a: 'SOLDADO', k: 'charade', d: 'militar', x: 'SOL + DADO = SOLDADO.' },
  { c: 'Rostro y verdura: lento con su casa a cuestas', a: 'CARACOL', k: 'charade', d: 'lento con su casa a cuestas', x: 'CARA + COL = CARACOL.' },
  { c: 'Da vueltas el astro: flor que lo sigue', a: 'GIRASOL', k: 'charade', d: 'flor que lo sigue', x: 'GIRA + SOL = GIRASOL, la flor que sigue al sol.' },
  { c: 'Rata que vuelve para amarrar', a: 'ATAR', k: 'reversal', d: 'amarrar', x: 'RATA al revés es ATAR, amarrar.' },
  { c: 'Saco devuelto: aves de corral', a: 'OCAS', k: 'reversal', d: 'aves de corral', x: 'SACO al revés es OCAS.' },
  { c: 'Fruta tropical que el alemán gozó en secreto', a: 'MANGO', k: 'hidden', d: 'Fruta tropical', x: 'Escondido en «aleMÁN GOzó»: MANGO.' },
  { c: 'Personaje pequeño oculto en lo que Rubén anotó', a: 'ENANO', k: 'hidden', d: 'Personaje pequeño', x: 'Oculto en «RubÉN ANOtó»: ENANO.' },
  { c: 'Monja alocada: se come con pan', a: 'JAMÓN', k: 'anagram', d: 'se come con pan', x: 'Las letras de MONJA alocadas forman JAMÓN.' },
  { c: 'Manila revuelta: bestia', a: 'ANIMAL', k: 'anagram', d: 'bestia', x: 'Las letras de MANILA revueltas forman ANIMAL.' },
  { c: 'Flor descabezada: la que hiberna en el bosque', a: 'OSA', k: 'deletion', d: 'la que hiberna en el bosque', x: 'ROSA sin su cabeza (la R) es OSA.' },
  { c: 'Pera sin principio: tiempo pasado', a: 'ERA', k: 'deletion', d: 'tiempo pasado', x: 'PERA sin su primera letra es ERA.' },
  { c: 'Se oye un saludo: rompe en la playa', a: 'OLA', k: 'homophone', d: 'rompe en la playa', x: 'OLA, que rompe en la playa, suena igual que HOLA, un saludo.' },
  { c: 'Hermoso, aunque suena a pelo', a: 'BELLO', k: 'homophone', d: 'Hermoso', x: 'BELLO (hermoso) suena igual que VELLO (pelo).' },
  { c: 'Animal del altiplano que también arde', a: 'LLAMA', k: 'definitions', d: 'Animal del altiplano', x: 'LLAMA es el animal andino y también el fuego.' },
  { c: 'Felino que se juega con cruces y círculos', a: 'GATO', k: 'definitions', d: 'Felino', x: 'GATO es el felino y también el juego de cruces y círculos.' },
  { c: 'Base del pie y piso del edificio', a: 'PLANTA', k: 'definitions', d: 'Base del pie', x: 'PLANTA del pie y PLANTA de un edificio.' },
  { c: 'Fila de espera y rabo del perro', a: 'COLA', k: 'definitions', d: 'Fila de espera', x: 'COLA es la fila y también el rabo.' },
  { c: 'Herramienta que corta montañas', a: 'SIERRA', k: 'definitions', d: 'Herramienta que corta', x: 'SIERRA es la herramienta y la cordillera.' },
  { c: 'Nota musical dentro del hogar: prenda con botones', a: 'CAMISA', k: 'container', d: 'prenda con botones', x: 'MI (la nota) dentro de CASA: CA·MI·SA.' },
  { c: 'Cinco romano y un viaje sin vuelta: existencia', a: 'VIDA', k: 'charade', d: 'existencia', x: 'V (cinco en romano) + IDA = VIDA.' },
  { c: 'Al principio, Laura, Úrsula y Zoe: lo que da el sol', a: 'LUZ', k: 'selector', d: 'lo que da el sol', x: 'Las primeras letras de Laura, Úrsula y Zoe: LUZ.' },
  { c: 'Salta mal: libro de mapas', a: 'ATLAS', k: 'anagram', d: 'libro de mapas', x: 'Las letras de SALTA desordenadas forman ATLAS.' },
  { c: 'Seria confundida: signo del zodiaco', a: 'ARIES', k: 'anagram', d: 'signo del zodiaco', x: 'Las letras de SERIA confundidas forman ARIES.' },
  { c: 'Bebe una infusión: va en la ensalada', a: 'TOMATE', k: 'charade', d: 'va en la ensalada', x: 'TOMA + TÉ = TOMATE.' },
  { c: 'Pan que se regala: oso blanco y negro', a: 'PANDA', k: 'charade', d: 'oso blanco y negro', x: 'PAN + DA (regala) = PANDA.' },
  // The owner's clue (2026-11-19)
  { c: 'Dos personas se miran de frente en inglés, todos los días de la semana', a: 'SIETE', k: 'homophone', d: 'todos los días de la semana', x: 'Dos personas que se miran de frente SE VEN, que en inglés suena a SEVEN: SIETE, todos los días de la semana.' },
];

/** Spanish only for now (the owner, 2026-11-19): the mechanics first, the other banks once it works. */
export const CLUES = { es: ES };
