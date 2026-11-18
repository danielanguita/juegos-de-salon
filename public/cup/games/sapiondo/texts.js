/**
 * Sapiondo in La Copa: es, en, pt texts merged into cup/rules.js (C-3).
 */
const ES = {
  juego: {
    nombre: 'Sapiondo',
    habilidad: 'reflejos',
    como: [
      'Toca Izquierda, Avanzar o Derecha para cruzar los carriles sin retroceder.',
      'Usa el botón Dash sobre Avanzar para saltar dos carriles por encima de un auto.',
      'Agarra frutas y pasa cerca de los autos para recargar tu Dash y sumar más puntos.',
    ],
    puntaje: '15 puntos por carril, +200 al llegar a la laguna, más frutas, pases cerca y bono de tiempo.',
    desempate: 'Si empatas, gana quien llegó más lejos; si siguen empatados, gana quien tardó menos o hizo más pases cerca.',
  },
  ui: {
    spLema: 'Cruza la autopista sin mirar atrás.',
    spDist: 'Carril {row}/{total}',
    spDashReady: 'DASH LISTO',
    spDashWait: '{s}s',
    spSector1: 'Avenida',
    spSector2: 'Costanera',
    spSector3: 'Autopista nocturna',
    spCloseCall: '¡CERCA! +{pts}',
    spPaused: 'En pausa',
    spResume: 'Toca para seguir',
    spWin: '🏆 ¡Cruzaste la laguna!',
    spCrash: '💥 ¡Te pilló el tránsito!',
    spContinue: 'Continuar',
    spBdDist: '🐸 Llegaste al carril {n} de {total}.',
    spBdBonus: ['', '🍓 1 fruta o pase cerca.', '🍓 {n} frutas y pases cerca.'],
    spBdTime: '⏱️ Bono de tiempo: +{n} pts.',
  },
};

const EN = {
  juego: {
    nombre: 'Sapiondo',
    habilidad: 'reflexes',
    como: [
      'Tap Left, Forward, or Right to cross lanes with no turning back.',
      'Use the Dash button above Forward to leap two lanes over a car.',
      'Snatch fruit and graze bumpers to recharge your Dash and boost your score.',
    ],
    puntaje: '15 points per lane, +200 at the pond, plus fruit, close calls, and a time bonus.',
    desempate: 'If you tie, whoever reached further wins; if still tied, faster time or more close calls wins.',
  },
  ui: {
    spLema: 'Cross the highway with no turning back.',
    spDist: 'Lane {row}/{total}',
    spDashReady: 'DASH READY',
    spDashWait: '{s}s',
    spSector1: 'Suburb Ave',
    spSector2: 'City Highway',
    spSector3: 'Night Expressway',
    spCloseCall: 'CLOSE CALL! +{pts}',
    spPaused: 'Paused',
    spResume: 'Tap to continue',
    spWin: '🏆 You reached the pond!',
    spCrash: '💥 Flattened by traffic!',
    spContinue: 'Continue',
    spBdDist: '🐸 Reached lane {n} of {total}.',
    spBdBonus: ['', '🍓 1 fruit or near miss.', '🍓 {n} fruit and near misses.'],
    spBdTime: '⏱️ Time bonus: +{n} pts.',
  },
};

const PT = {
  juego: {
    nombre: 'Sapiondo',
    habilidad: 'reflexos',
    como: [
      'Toque em Esquerda, Avançar ou Direita para cruzar as faixas sem voltar.',
      'Use o botão Dash acima de Avançar para saltar duas faixas sobre um carro.',
      'Pegue frutas e passe raspando nos carros para recarregar o Dash e pontuar mais.',
    ],
    puntaje: '15 pontos por faixa, +200 ao chegar à lagoa, além de frutas, por um triz e bônus de tempo.',
    desempate: 'Se empatar, ganha quem foi mais longe; se continuar igual, menor tempo ou mais por um triz.',
  },
  ui: {
    spLema: 'Atravesse a rodovia sem olhar para trás.',
    spDist: 'Faixa {row}/{total}',
    spDashReady: 'DASH PRONTO',
    spDashWait: '{s}s',
    spSector1: 'Avenida',
    spSector2: 'Via Expressa',
    spSector3: 'Rodovia Noturna',
    spCloseCall: 'POR UM TRIZ! +{pts}',
    spPaused: 'Pausado',
    spResume: 'Toque para continuar',
    spWin: '🏆 Chegou à lagoa!',
    spCrash: '💥 Pego pelo trânsito!',
    spContinue: 'Continuar',
    spBdDist: '🐸 Chegou à faixa {n} de {total}.',
    spBdBonus: ['', '🍓 1 fruta ou por um triz.', '🍓 {n} frutas e por um triz.'],
    spBdTime: '⏱️ Bônus de tempo: +{n} pts.',
  },
};

export default { es: ES, en: EN, pt: PT };
