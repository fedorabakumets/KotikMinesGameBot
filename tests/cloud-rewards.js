/**
 * @fileoverview Проверка однократного сохранения очков и защиты от гонки забора с ходом.
 */
import { db } from 'sdk';
import { eq } from 'sdk/db';
import { players } from '../schema.js';
import { getPlayer, saveGame } from '../lib/storage.js';
import { newGame, move } from '../lib/engine.js';
import { cashOut } from '../lib/rewards.js';
import { startGame, play } from '../lib/gameplay.js';
let passed = 0;

/**
 * Проверяет результат сохранения раунда.
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
 * Выполняет проверки на временном игроке без реальных сообщений.
 * @returns {Promise<object>} Число успешных проверок.
 */
export default async function verifyRewards() {
  const userId = -Date.now();
  try {
    await startGame(userId, 5, false, 'cashout');
    let player = await getPlayer(userId);
    const query = { id: 'тест', from: { id: userId }, message: { message_id: player.messageId } };
    await play({ ...query, data: `take:${player.game.id}` });
    check((await getPlayer(userId)).version === player.version, 'Пустой раунд нельзя забрать');
    await play({ ...query, data: `cell:${player.game.id}:24` });
    player = await getPlayer(userId);
    check(player.game.opened.length === 1 && player.points === 0, 'Очки не зачисляются до забора');
    await play({ ...query, data: `take:${player.game.id}` });
    player = await getPlayer(userId);
    check(player.game.status === 'cashed' && player.points === 10 && player.cashouts === 1, 'Кнопка сохраняет очки и завершает раунд');
    await play({ ...query, data: `take:${player.game.id}` });
    check((await getPlayer(userId)).points === 10, 'Повторный забор не начисляет очки');
    player = await saveGame(player, { ...newGame(5, false, 'cashout'), mines: [0, 1, 2, 3, 4] });
    player = await saveGame(player, move(player.game, 24));
    player = await saveGame(player, move(player.game, 0));
    check(player.points === 10 && player.losses === 1 && player.cashouts === 1, 'Мина теряет очки раунда, сохраняя прежний результат');
    player = await saveGame(player, { ...newGame(5, false, 'cashout'), mines: [0, 1, 2, 3, 4] });
    player = await saveGame(player, move(player.game, 24));
    const [take, hit] = await Promise.all([saveGame(player, cashOut(player.game)), saveGame(player, move(player.game, 0))]);
    check(Boolean(take) !== Boolean(hit), 'Гонка забора с миной принимает только одно действие');
    player = await getPlayer(userId);
    check(player.points === (take ? 20 : 10) && player.losses === (hit ? 2 : 1), 'Гонка не дублирует очки и поражение');
    const initialPoints = player.points;
    player = await saveGame(player, { ...newGame(5, false, 'cashout'), mines: [0, 1, 2, 3, 4] });
    let complete = player.game;
    for (let cell = 5; cell < 25; cell++) complete = move(complete, cell);
    player = await saveGame(player, complete);
    check(player.points === initialPoints + 200 && player.wins === 1, 'Полное открытие автоматически сохраняет очки');
    player = await saveGame(player, player.game);
    check(player.points === initialPoints + 200, 'Повторное сохранение победы не начисляет очки');
    return { passed };
  } finally {
    await db.delete(players).where(eq(players.userId, userId)).run();
  }
}
