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
  // Harder since the owner's ask (2026-11-19): a sentence that tells another story, no colon between the halves,
  // the definition fair but sideways, the indicator blended in (docs/games/cryptic.md, "Writing a clue")
  { c: 'Un amor que vuelve atrás, en la ciudad de las siete colinas', a: 'ROMA', k: 'reversal', d: 'la ciudad de las siete colinas', x: 'AMOR leído hacia atrás es ROMA, la ciudad de las siete colinas.' },
  { c: 'El rey de la selva duerme en el valle ondulado', a: 'LEÓN', k: 'hidden', d: 'El rey de la selva', x: 'Duerme dentro de «valLE ONdulado»: LEÓN, el rey de la selva.' },
  { c: 'Los novios lo sienten aunque el ramo se deshaga', a: 'AMOR', k: 'anagram', d: 'Los novios lo sienten', x: 'Las letras de RAMO, deshecho, forman AMOR: lo que sienten los novios.' },
  { c: 'Donde se sientan los jubilados a cobrar', a: 'BANCO', k: 'definitions', d: 'Donde se sientan los jubilados', x: 'BANCO: donde se sientan los jubilados en la plaza, y donde van a cobrar la pensión.' },
  { c: 'Si el mar toma té con ese, ni te cases ni te embarques', a: 'MARTES', k: 'charade', d: 'ni te cases ni te embarques', x: 'MAR + TÉ + S = MARTES, el día en que ni te casas ni te embarcas.' },
  { c: 'Recluta una estrella y lo que se lanza en el parchís', a: 'SOLDADO', k: 'charade', d: 'Recluta', x: 'SOL (una estrella) + DADO (lo que se lanza en el parchís) = SOLDADO, un recluta.' },
  { c: 'Lleva la casa a cuestas con la cara de un repollo', a: 'CARACOL', k: 'charade', d: 'Lleva la casa a cuestas', x: 'CARA + COL (un repollo) = CARACOL, que lleva la casa a cuestas.' },
  { c: 'Gira la estrella ante quien la sigue con la cara amarilla', a: 'GIRASOL', k: 'charade', d: 'quien la sigue con la cara amarilla', x: 'GIRA + SOL (la estrella) = GIRASOL, que sigue al sol con su cara amarilla.' },
  { c: 'Hace un nudo cuando la rata regresa', a: 'ATAR', k: 'reversal', d: 'Hace un nudo', x: 'RATA de regreso, al revés, es ATAR: hacer un nudo.' },
  { c: 'Devuelvo el saco a las que graznan en la granja', a: 'OCAS', k: 'reversal', d: 'las que graznan en la granja', x: 'SACO devuelto, al revés, es OCAS, las que graznan en la granja.' },
  { c: 'Lo que el alemán gozó por dentro tiene hueso y pulpa amarilla', a: 'MANGO', k: 'hidden', d: 'tiene hueso y pulpa amarilla', x: 'Por dentro de «aleMÁN GOzó»: MANGO, con hueso y pulpa amarilla.' },
  { c: 'Rubén anotó, a escondidas, uno de los siete de Blancanieves', a: 'ENANO', k: 'hidden', d: 'uno de los siete de Blancanieves', x: 'A escondidas en «RubÉN ANOtó»: ENANO, uno de los siete de Blancanieves.' },
  { c: 'Una monja loca se cura colgada en la despensa', a: 'JAMÓN', k: 'anagram', d: 'se cura colgada en la despensa', x: 'Las letras de MONJA, locas, forman JAMÓN, que se cura colgado.' },
  { c: 'Desordenada, Manila se vuelve una fiera', a: 'ANIMAL', k: 'anagram', d: 'una fiera', x: 'Las letras de MANILA desordenadas forman ANIMAL: una fiera.' },
  { c: 'Decapitan una rosa y aparece la mamá del oso', a: 'OSA', k: 'deletion', d: 'la mamá del oso', x: 'ROSA sin su cabeza (la R) es OSA, la mamá del oso.' },
  { c: 'La pera, sin cabeza, marca una época', a: 'ERA', k: 'deletion', d: 'marca una época', x: 'PERA sin su primera letra es ERA: una época.' },
  { c: 'Saluda sin hache y rompe en la orilla', a: 'OLA', k: 'deletion', d: 'rompe en la orilla', x: 'HOLA sin la H es OLA, que rompe en la orilla.' },
  { c: 'Suena a pelo en la pierna, pero es guapo', a: 'BELLO', k: 'homophone', d: 'es guapo', x: 'BELLO (guapo) suena igual que VELLO, el pelo de la pierna.' },
  { c: 'Escupe en el altiplano y quema en la chimenea', a: 'LLAMA', k: 'definitions', d: 'Escupe en el altiplano', x: 'LLAMA: el animal del altiplano que escupe, y el fuego de la chimenea.' },
  { c: 'Maúlla en el tejado y se gana con tres en raya', a: 'GATO', k: 'definitions', d: 'Maúlla en el tejado', x: 'GATO: el que maúlla en el tejado, y el juego de cruces y círculos.' },
  { c: 'Se riega en el balcón y se apoya en cada paso', a: 'PLANTA', k: 'definitions', d: 'Se riega en el balcón', x: 'PLANTA: la del balcón, que se riega, y la del pie, que se apoya al caminar.' },
  { c: 'La hacen en el banco y la mueve el perro contento', a: 'COLA', k: 'definitions', d: 'La hacen en el banco', x: 'COLA: la fila que se hace en el banco, y la que mueve el perro.' },
  { c: 'Corta la madera y también el horizonte', a: 'SIERRA', k: 'definitions', d: 'Corta la madera', x: 'SIERRA: la herramienta que corta madera, y las montañas que cortan el horizonte.' },
  { c: 'Mi nota se queda en casa, y la abotonas cada mañana', a: 'CAMISA', k: 'container', d: 'la abotonas cada mañana', x: 'MI (la nota) se queda dentro de CASA: CA·MI·SA, la que abotonas cada mañana.' },
  { c: 'El cinco del César y un pasaje sin regreso: solo se vive una', a: 'VIDA', k: 'charade', d: 'solo se vive una', x: 'V (cinco en números romanos) + IDA (un pasaje sin regreso) = VIDA: solo se vive una.' },
  { c: 'Laura, Úrsula y Zoe encabezan lo que se corta en un apagón', a: 'LUZ', k: 'selector', d: 'lo que se corta en un apagón', x: 'Las cabezas de Laura, Úrsula y Zoe: LUZ, lo que se corta en un apagón.' },
  { c: 'Salta loco con el mundo entero a cuestas', a: 'ATLAS', k: 'anagram', d: 'con el mundo entero a cuestas', x: 'Las letras de SALTA, locas, forman ATLAS, el titán con el mundo a cuestas (y el libro de mapas).' },
  { c: 'Seria pero confundida, embiste como un carnero', a: 'ARIES', k: 'anagram', d: 'embiste como un carnero', x: 'Las letras de SERIA confundidas forman ARIES, el signo del carnero.' },
  { c: 'Toma té y termina picado en la ensalada chilena', a: 'TOMATE', k: 'charade', d: 'termina picado en la ensalada chilena', x: 'TOMA + TÉ = TOMATE, que va picado en la ensalada chilena.' },
  { c: 'Si el pan se da, sale un oso que come bambú', a: 'PANDA', k: 'charade', d: 'un oso que come bambú', x: 'PAN + DA = PANDA, el oso que come bambú.' },
  // The owner's clue (2026-11-19)
  { c: 'Dos ingleses se miran de frente, de lunes a domingo', a: 'SIETE', k: 'homophone', d: 'de lunes a domingo', x: 'Dos que se miran de frente SE VEN, y dicho por ingleses suena a SEVEN: SIETE, los días de lunes a domingo.' },
  // The owner's clue (2026-11-19), with A inside PETÓ instead of an anagram
  { c: 'Un beso catalán abraza al primer amor y sigue al norte: va a pie', a: 'PEATÓN', k: 'container', d: 'va a pie', x: 'Beso en catalán es PETÓ; abraza la A, la primera letra de amor (PE·A·TÓ), y le sigue la N del norte: PEATÓN, el que va a pie.' },
];

/** Spanish only for now (the owner, 2026-11-19): the mechanics first, the other banks once it works. */
export const CLUES = { es: ES };
