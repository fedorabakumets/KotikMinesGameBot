/**
 * @fileoverview Облачная проверка сохранения игры, старых кнопок и однократного учёта статистики.
 */
import { db } from 'sdk';
import { eq } from 'sdk/db';
import { players } from '../schema.js';
import { getPlayer, saveGame } from '../lib/storage.js';
import { newGame, move } from '../lib/engine.js';
import { startGame, play, render } from '../lib/gameplay.js';
import { calls } from '../lib/mock-api.js';
let passed = 0;

/**
 * Проверяет результат и останавливает сценарий при ошибке.
 * @param {boolean} condition - Проверяемое условие.
 * @param {string} message - Название проверки.
 * @returns {void} Отсутствие результата.
 */
function check(condition, message) {
  if (!condition) throw new Error(message);
  passed++;
  console.log('Проверка пройдена:', message);
}

/**
 * Проверяет работу SQLite на временном игроке без отправки сообщений.
 * @returns {Promise<object>} Количество успешных проверок.
 */
export default async function verifyGame() {
  const userId = -Date.now();
  try {
    await startGame(userId, 8);
    let player = await getPlayer(userId);
    check(player.game.count === 8 && player.messageId === 100, 'Партия и сообщение сохраняются');
    const oldId = player.game.id;
    await startGame(userId, 5);
    player = await getPlayer(userId);
    check(player.game.id !== oldId && calls.some(call => call.method === 'deleteMessage'), 'Новая партия заменяет прежнее поле');
    const query = { id: 'тест', from: { id: userId }, message: { message_id: player.messageId } };
    const version = player.version;
    await play({ ...query, data: `cell:${oldId}:0` });
    check((await getPlayer(userId)).version === version, 'Старая партия не принимает ход');
    await play({ ...query, message: { message_id: 999 }, data: `cell:${player.game.id}:0` });
    check((await getPlayer(userId)).version === version, 'Другое сообщение не принимает ход');
    await play({ ...query, data: `cell:${player.game.id}:25` });
    check((await getPlayer(userId)).version === version, 'Неверная клетка не меняет игру');
    await play({ ...query, data: `mode:${player.game.id}` });
    player = await getPlayer(userId);
    check(player.game.mode === 'flag', 'Режим флажков сохраняется');
    const known = { ...newGame(), mines: [0, 1, 2, 3, 4] };
    player = await saveGame(player, known);
    const loser = move(known, 0);
    const staleSnapshot = player;
    const [first, second] = await Promise.all([saveGame(player, loser), saveGame(player, loser)]);
    check(Boolean(first) !== Boolean(second), 'Одновременные ходы принимаются только один раз');
    player = await getPlayer(userId);
    check(player.losses === 1 && player.wins === 0, 'Поражение считается один раз');
    await render(staleSnapshot);
    check(calls.filter(call => call.method === 'editMessageText').at(-1).params.text.includes('Мина!'),
      'Обновление поля использует последнюю сохранённую версию');
    await play({ ...query, data: `cell:${known.id}:0` });
    check((await getPlayer(userId)).losses === 1, 'Кнопки завершённой игры не дублируют статистику');
    player = await saveGame(player, newGame());
    player = await saveGame(player, { ...player.game, mines: [0, 1, 2, 3, 4] });
    player = await saveGame(player, move(player.game, 24));
    check(player.wins === 1 && player.losses === 1, 'Победа учитывается отдельно от поражения');
    const stale = await saveGame({ ...player, version: player.version - 1 }, newGame());
    check(!stale && (await getPlayer(userId)).wins === 1, 'Старая версия не перезаписывает статистику');
    await startGame(userId, 12, false);
    player = await getPlayer(userId);
    check(player.game.flagsEnabled === false && player.game.count === 12, 'Вариант без флажков сохраняется в базе');
    const plainQuery = { ...query, message: { message_id: player.messageId } };
    await play({ ...plainQuery, data: `mode:${player.game.id}` });
    check((await getPlayer(userId)).version === player.version, 'Кнопка режима не включает флажки в упрощённой партии');
    await play({ ...plainQuery, data: `cell:${player.game.id}:12` });
    const opened = await getPlayer(userId);
    check(opened.game.opened.includes(12) && opened.game.flags.length === 0 && opened.game.status !== 'lost',
      'Ход без флажков открывает безопасную клетку');
    return { passed };
  } finally {
    await db.delete(players).where(eq(players.userId, userId)).run();
  }
}
