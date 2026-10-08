/**
 * @fileoverview Проверки одиночного открытия, потери очков и кнопки «Забрать».
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { newGame, move } from '../tgcloud/lib/engine.js';
import { cashOut, roundPoints } from '../tgcloud/lib/rewards.js';
import { board } from '../tgcloud/lib/view.js';

/**
 * Создаёт раунд с известными минами.
 * @returns {object} Партия режима забора очков.
 */
function fixture() { return { ...newGame(5, false, 'cashout'), mines: [0, 1, 2, 3, 4] }; }

test('Режим забора открывает только нажатую клетку без числовых подсказок', () => {
  const game = move(fixture(), 24);
  assert.deepEqual(game.opened, [24]);
  assert.equal(roundPoints(game), 10);
  assert.equal(board(game).reply_markup.inline_keyboard[4][4].text, '💎');
  assert.ok(board(game).reply_markup.inline_keyboard.flat().some(item => item.callback_data === `take:${game.id}`));
});
test('Забрать можно после хода, повтор не добавляет очки', () => {
  const empty = fixture();
  assert.equal(cashOut(empty), empty);
  const game = move(empty, 24);
  const cashed = cashOut(game);
  assert.equal(cashed.status, 'cashed');
  assert.equal(game.status, 'playing');
  assert.equal(roundPoints(cashed), 10);
  assert.equal(cashOut(cashed), cashed);
  assert.deepEqual(move(cashed, 0), cashed);
});
test('Повторное открытие не увеличивает очки, мина обнуляет раунд', () => {
  const game = move(fixture(), 24);
  assert.equal(roundPoints(move(game, 24)), 10);
  const lost = move(game, 0);
  assert.equal(lost.status, 'lost');
  assert.equal(roundPoints(lost), 0);
  assert.equal(cashOut(lost), lost);
});
test('Забор недоступен в сапёре, а полное открытие завершает риск-раунд победой', () => {
  const classic = newGame();
  assert.equal(cashOut(classic), classic);
  let game = fixture();
  for (let cell = 5; cell < 25; cell++) game = move(game, cell);
  assert.equal(game.status, 'won');
  assert.equal(roundPoints(game), 200);
});
