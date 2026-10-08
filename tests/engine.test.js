/**
 * @fileoverview Проверки безопасности первого хода, соседей, флажков и завершения партии.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { newGame, move, neighbors, LEVELS } from '../tgcloud/lib/engine.js';
import { board } from '../tgcloud/lib/view.js';

/**
 * Возвращает заранее известное поле для проверки исходов игры.
 * @returns {object} Партия с пятью минами в верхней строке.
 */
function fixture() { return { ...newGame(), mines: [0, 1, 2, 3, 4] }; }

test('Первое открытие безопасно на всех клетках и сложностях', () => {
  for (const count of LEVELS) for (let cell = 0; cell < 25; cell++) {
    const game = move(newGame(count), cell, () => 0.42);
    assert.equal(game.mines.length, count);
    assert.equal(new Set(game.mines).size, count);
    assert.ok(!game.mines.includes(cell));
    assert.notEqual(game.status, 'lost');
    assert.ok(game.opened.includes(cell));
  }
});
test('Соседи учитывают края и углы поля', () => {
  assert.deepEqual(neighbors(0), [1, 5, 6]);
  assert.deepEqual(neighbors(24), [18, 19, 23]);
  assert.equal(neighbors(12).length, 8);
});
test('Флажки не открывают поле и ограничены числом мин', () => {
  let game = { ...newGame(), mode: 'flag' };
  for (let cell = 0; cell < 6; cell++) game = move(game, cell);
  assert.equal(game.flags.length, 5);
  assert.deepEqual(game.mines, []);
  game = move(game, 0);
  assert.ok(!game.flags.includes(0));
  assert.deepEqual(game.opened, []);
});
test('Клетка с флажком не открывается и состояние не мутируется', () => {
  const original = { ...fixture(), flags: [10] };
  assert.deepEqual(move(original, 10), original);
  const opened = move(original, 20);
  assert.ok(!opened.opened.includes(10));
  assert.deepEqual(original.opened, []);
});
test('Открытие пустой области приводит к победе', () => {
  const game = move(fixture(), 24);
  assert.equal(game.status, 'won');
  assert.equal(game.opened.length, 20);
  assert.deepEqual(move(game, 0), game);
});
test('Мина завершает игру и повторный ход её не меняет', () => {
  const game = move(fixture(), 0);
  assert.equal(game.status, 'lost');
  assert.equal(game.exploded, 0);
  assert.deepEqual(move(game, 24), game);
});
test('Некорректные клетки и сложность отвергаются', () => {
  const game = fixture();
  for (const cell of [-1, 25, NaN, 0.5]) assert.deepEqual(move(game, cell), game);
  assert.throws(() => newGame(25));
});
test('Игровая клавиатура не раскрывает скрытые мины', () => {
  const hidden = board(fixture());
  assert.ok(hidden.reply_markup.inline_keyboard.slice(0, 5).flat().every(item => item.text === '⬜'));
  assert.ok(hidden.reply_markup.inline_keyboard.flat().every(item => Buffer.byteLength(item.callback_data) <= 64));
  const ended = board(move(fixture(), 0));
  assert.equal(ended.reply_markup.inline_keyboard[0][0].text, '💥');
  assert.equal(ended.reply_markup.inline_keyboard[0][1].text, '💣');
});
test('Вариант без флажков всегда открывает клетку и не предлагает переключение режима', () => {
  const plain = { ...newGame(5, false), mode: 'flag', flags: [12] };
  const game = move(plain, 12, () => 0.42);
  assert.equal(game.flagsEnabled, false);
  assert.equal(game.mode, 'open');
  assert.deepEqual(game.flags, []);
  assert.ok(game.opened.includes(12));
  assert.notEqual(game.status, 'lost');
  assert.ok(!board(game).reply_markup.inline_keyboard.flat().some(item => item.callback_data.startsWith('mode:')));
});
test('Поле содержит компактную навигацию, а прежние партии сохраняют флажки', () => {
  const legacy = fixture();
  delete legacy.flagsEnabled;
  const buttons = board(legacy).reply_markup.inline_keyboard.flat();
  assert.ok(buttons.some(item => item.callback_data.startsWith('mode:')));
  assert.ok(buttons.some(item => item.callback_data === 'games'));
  assert.ok(buttons.some(item => item.callback_data === 'new:5'));
  assert.equal(buttons.length, 28);
});
