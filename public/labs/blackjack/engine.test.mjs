import assert from 'node:assert/strict';
import * as E from './engine.js';

const c = (rank, suit = '♠') => ({ rank, suit });

// 1. Hand value evaluation
{
  assert.deepEqual(E.handValue([c('A'), c('K')]), { total: 21, soft: true, isBlackjack: true, isBust: false });
  assert.deepEqual(E.handValue([c('A'), c('K')], { isSplit: true }), { total: 21, soft: true, isBlackjack: false, isBust: false });
  assert.deepEqual(E.handValue([c('A'), c('9'), c('5')]), { total: 15, soft: false, isBlackjack: false, isBust: false });
  assert.deepEqual(E.handValue([c('A'), c('A'), c('9')]), { total: 21, soft: true, isBlackjack: false, isBust: false });
  assert.deepEqual(E.handValue([c('10'), c('8'), c('5')]), { total: 23, soft: false, isBlackjack: false, isBust: true });
}

// 2. Shoe size (2 decks = 104 cards, 6 decks = 312 cards)
{
  assert.equal(E.buildShoe(2).length, 104);
  assert.equal(E.buildShoe(6).length, 312);
}

// 3. Natural Blackjack 3:2 payout
{
  // Deal order (1 player): P1(A), D1(9), P2(K), D2(8) -> Dealer 17, Player BJ 21
  const shoe = [c('A'), c('9'), c('K'), c('8'), c('2'), c('3'), c('4'), c('5')];
  let s = E.newGame(['Ana'], { startingCoins: 100, minBet: 10, maxRounds: 3, shoe, cutIndex: 100 });
  s = E.placeBet(s, 20);
  assert.equal(s.phase, 'roundEnd');
  assert.equal(s.players[0].hands[0].outcome, 'blackjack');
  assert.equal(s.players[0].hands[0].payout, 50); // 20 + 30 (3:2)
  assert.equal(s.players[0].coins, 130);
}

// 4. Double Down & Dealer S17
{
  // Deal order: P1(5), D1(10), P2(6), D2(6), P_double(9) -> Player 20, Dealer 16 -> draws 5 -> 21!
  const shoe = [c('5'), c('10'), c('6'), c('6'), c('9'), c('5'), c('2'), c('2')];
  let s = E.newGame(['Luis'], { startingCoins: 100, minBet: 10, maxRounds: 3, shoe, cutIndex: 100 });
  s = E.placeBet(s, 25);
  assert.equal(s.phase, 'playing');
  assert.equal(E.canDouble(s), true);
  s = E.doubleDown(s);
  assert.equal(s.phase, 'roundEnd');
  assert.equal(s.players[0].hands[0].bet, 50);
  assert.equal(s.players[0].hands[0].outcome, 'lose');
  assert.equal(s.players[0].coins, 50);
}

// 5. Split pair and win both hands
{
  // Deal order: P1(8), D1(10), P2(8), D2(7) -> Dealer stands 17; Split draws 10, 9 -> Player 18 & 17
  const shoe = [c('8', '♠'), c('10'), c('8', '♥'), c('7'), c('10', '♦'), c('9', '♣'), c('2'), c('3')];
  let s = E.newGame(['Mia'], { startingCoins: 100, minBet: 10, maxRounds: 3, shoe, cutIndex: 100 });
  s = E.placeBet(s, 20);
  assert.equal(E.canSplit(s), true);
  s = E.split(s);
  assert.equal(s.players[0].hands.length, 2);
  assert.equal(s.players[0].coins, 60);
  s = E.stand(s); // hand 0 (18)
  s = E.stand(s); // hand 1 (17) -> dealer stands on 17
  assert.equal(s.phase, 'roundEnd');
  assert.equal(s.players[0].hands[0].outcome, 'win');
  assert.equal(s.players[0].hands[1].outcome, 'push');
  assert.equal(s.players[0].coins, 120); // 60 + 40 + 20
}

// 6. Red card end condition: finishes current hand, then ends game
{
  const shoe = [c('10'), c('10'), c('9'), c('7'), c('2'), c('3'), c('4'), c('5')];
  let s = E.newGame(['Ana'], { startingCoins: 100, minBet: 10, maxRounds: 0, shoe, cutIndex: 3 });
  s = E.placeBet(s, 10);
  assert.equal(s.redCardOut, true);
  assert.equal(s.phase, 'playing'); // current hand still finishes!
  s = E.stand(s);
  assert.equal(s.phase, 'roundEnd');
  s = E.nextRound(s);
  assert.equal(s.phase, 'over');
  assert.equal(s.endReason, 'redCard');
}

// 7. Max rounds end condition & multiplayer winner by most coins
{
  // 2 players: P1 gets 20 vs Dealer 17 (wins), P2 gets 15 vs Dealer 17 (loses)
  const shoe = [
    c('10'), c('8'), c('10'),
    c('10'), c('7'), c('7'),
    c('5'), c('2'), c('3'),
  ];
  let s = E.newGame(['Ana', 'Beto'], { startingCoins: 100, minBet: 10, maxRounds: 1, shoe, cutIndex: 100 });
  s = E.placeBet(s, 20); // Ana
  s = E.placeBet(s, 20); // Beto -> deals
  s = E.stand(s); // Ana stands on 20
  s = E.stand(s); // Beto stands on 15 -> Dealer 17
  assert.equal(s.phase, 'roundEnd');
  s = E.nextRound(s);
  assert.equal(s.phase, 'over');
  assert.equal(s.endReason, 'rounds');
  assert.deepEqual(s.winner, { type: 'multi', winners: [0], topCoins: 120 });
}

// 8. Everyone runs out of coins -> endReason 'broke'
{
  const shoe = [c('10'), c('10'), c('6'), c('10'), c('10')]; // P hits -> bust
  let s = E.newGame(['Ana'], { startingCoins: 50, minBet: 10, maxRounds: 5, shoe, cutIndex: 100 });
  s = E.placeBet(s, 50);
  s = E.hit(s); // 26 bust
  assert.equal(s.phase, 'roundEnd');
  assert.equal(s.players[0].coins, 0);
  s = E.nextRound(s);
  assert.equal(s.phase, 'over');
  assert.equal(s.endReason, 'broke');
}

// 9. Everyone leaves table -> endReason 'left'
{
  let s = E.newGame(['Ana', 'Beto'], { startingCoins: 100, minBet: 10, maxRounds: 5 });
  s = E.leaveTable(s, 0);
  assert.equal(s.phase, 'betting');
  s = E.leaveTable(s, 1);
  assert.equal(s.phase, 'over');
  assert.equal(s.endReason, 'left');
}

// 10. Surrender on initial 2 cards returns half the bet
{
  const shoe = [c('10'), c('9'), c('6'), c('7'), c('2'), c('3')];
  let s = E.newGame(['Ana'], { startingCoins: 100, minBet: 10, maxRounds: 3, shoe, cutIndex: 100 });
  s = E.placeBet(s, 20);
  assert.equal(E.canSurrender(s), true);
  s = E.surrender(s);
  assert.equal(s.phase, 'roundEnd');
  assert.equal(s.players[0].hands[0].outcome, 'surrender');
  assert.equal(s.players[0].hands[0].payout, 10);
  assert.equal(s.players[0].coins, 90);
}

// 11. Tiebreaker: handsWon and blackjacks track and break coin ties
{
  // Round 1: Ana BJ (+15 on 10 bet -> 115), Beto win (+15 on 15 bet -> 115) vs Dealer 17 -> Ana has 1 blackjack, Beto 0
  const shoe = [
    c('A'), c('10'), c('10'),
    c('K'), c('9'), c('7'),
    c('2'), c('3'), c('4'),
  ];
  let s = E.newGame(['Ana', 'Beto'], { startingCoins: 100, minBet: 10, maxRounds: 1, shoe, cutIndex: 100 });
  s = E.placeBet(s, 10); // Ana
  s = E.placeBet(s, 15); // Beto
  s = E.stand(s); // Beto stands on 19; Dealer has 17
  s = E.nextRound(s);
  assert.equal(s.phase, 'over');
  assert.equal(s.players[0].coins, 115);
  assert.equal(s.players[1].coins, 115);
  assert.equal(s.players[0].handsWon, 1);
  assert.equal(s.players[0].blackjacks, 1);
  assert.equal(s.players[1].handsWon, 1);
  assert.equal(s.players[1].blackjacks, 0);
  assert.deepEqual(s.winner, { type: 'multi', winners: [0], topCoins: 115 });
}

// 12. Exhausted shoe mid-hand reshuffles deterministically instead of wrapping silently
{
  const initialShoe = [c('10'), c('6'), c('2'), c('10')]; // P1(10), D1(6), P2(2), D2(10) -> exhausts before hit!
  let s = E.newGame(['Ana'], { decks: 1, seed: 42, startingCoins: 100, minBet: 10, maxRounds: 3, shoe: initialShoe, cutIndex: 100 });
  s = E.placeBet(s, 10);
  assert.equal(s.shoePos, 4);
  assert.equal(s.reshuffles, 0);
  s = E.hit(s); // needs 1+ cards beyond initialShoe.length
  assert.equal(s.reshuffles, 1);
  assert.equal(s.redCardOut, true);
  assert.ok(s.shoe.length > 4);
  assert.equal(s.shoePos, 5);
}

// 13. Online sender validation guards turn, host next, and leaving own seat
{
  const order = ['A', 'B'];
  const shoe = [c('10'), c('8'), c('5'), c('10'), c('7'), c('7'), c('2'), c('3')];
  let s = E.newGame(['Ana', 'Beto'], { startingCoins: 100, minBet: 10, maxRounds: 3, shoe, cutIndex: 100 });
  assert.equal(E.canApplyOnlineAction(s, order, { t: 'bj', from: 'B', act: 'bet', amount: 10 }), false);
  assert.equal(E.canApplyOnlineAction(s, order, { t: 'bj', from: 'A', act: 'bet', amount: 10 }), true);
  s = E.placeBet(s, 10);
  s = E.placeBet(s, 10);
  assert.equal(s.phase, 'playing');
  assert.equal(E.canApplyOnlineAction(s, order, { t: 'bj', from: 'B', act: 'stand' }), false);
  assert.equal(E.canApplyOnlineAction(s, order, { t: 'bj', from: 'A', act: 'stand' }), true);
  s = E.stand(s);
  assert.equal(E.canApplyOnlineAction(s, order, { t: 'bj', from: 'B', act: 'stand' }), true);
  s = E.stand(s);
  assert.equal(s.phase, 'roundEnd');
  assert.equal(E.canApplyOnlineAction(s, order, { t: 'bj', from: 'B', act: 'next' }), false);
  assert.equal(E.canApplyOnlineAction(s, order, { t: 'bj', from: 'A', act: 'next' }), true);
  assert.equal(E.canApplyOnlineAction(s, order, { t: 'bj', from: 'B', act: 'leave', playerIndex: 0 }), false);
  assert.equal(E.canApplyOnlineAction(s, order, { t: 'bj', from: 'B', act: 'leave', playerIndex: 1 }), true);
}

console.log('blackjack engine: 13 scenarios green');
