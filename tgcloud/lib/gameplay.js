/**
 * @fileoverview Создание партий, выполнение ходов и обновление сообщения с полем.
 */
import { api } from 'sdk';
import { newGame, move, LEVELS } from './engine.js';
import { getPlayer, saveGame } from './storage.js';
import { board, levelButtons } from './view.js';

/**
 * Обновляет поле по последней сохранённой версии даже при одновременных ходах.
 * @param {object} player - Сохранённая партия игрока.
 * @returns {Promise<void>} Завершение обновления поля.
 */
export async function render(player) {
  for (let attempt = 0; attempt < 3; attempt++) {
    const current = await getPlayer(player.userId);
    if (!current.messageId) return;
    try {
      await api.editMessageText({ chat_id: current.userId, message_id: current.messageId, ...board(current.game) });
    } catch (error) {
      if (!String(error.description || error.message).includes('message is not modified')) throw error;
    }
    if ((await getPlayer(player.userId)).version === current.version) return;
  }
}

/**
 * Начинает отдельную партию и удаляет предыдущее игровое поле.
 * @param {number} userId - Идентификатор игрока.
 * @param {number} count - Количество мин.
 * @returns {Promise<void>} Завершение создания партии.
 */
export async function startGame(userId, count = 5) {
  if (!LEVELS.includes(count)) return;
  const previous = await getPlayer(userId);
  const reserved = await saveGame(previous, newGame(count), 0);
  if (!reserved) return;
  const message = await api.sendMessage({ chat_id: userId, ...board(reserved.game) });
  const saved = await saveGame(reserved, reserved.game, message.message_id);
  if (!saved) {
    await api.editMessageText({ chat_id: userId, message_id: message.message_id,
      text: 'Уже открыта другая партия. Начни новую через /game.', reply_markup: { inline_keyboard: [] } });
    return;
  }
  if (previous.messageId) {
    try { await api.deleteMessage({ chat_id: userId, message_id: previous.messageId }); }
    catch (error) { console.warn('Не удалось удалить прежнее поле', error.code || error.message); }
  }
}

/**
 * Выполняет действие только на актуальном личном поле.
 * @param {object} query - Нажатие кнопки Telegram.
 * @returns {Promise<void>} Завершение действия и ответа на нажатие.
 */
export async function play(query) {
  const [action, id, rawCell] = (query.data || '').split(':');
  const player = await getPlayer(query.from.id);
  if (player.messageId !== query.message.message_id || player.game.id !== id) {
    await api.answerCallbackQuery({ callback_query_id: query.id, text: 'Это старое поле. Открой /game.' });
    return;
  }
  if (player.game.status !== 'playing') {
    await api.answerCallbackQuery({ callback_query_id: query.id, text: 'Партия завершена. Выбери сложность для новой.' });
    return;
  }
  if (action === 'cell' && (!/^\d+$/.test(rawCell || '') || Number(rawCell) >= 25)) {
    await api.answerCallbackQuery({ callback_query_id: query.id, text: 'Неизвестная клетка.' });
    return;
  }
  const game = action === 'mode' ? { ...player.game, mode: player.game.mode === 'open' ? 'flag' : 'open' }
    : move(player.game, Number(rawCell));
  const saved = await saveGame(player, game);
  await api.answerCallbackQuery({ callback_query_id: query.id, text: saved ? undefined : 'Ход уже обработан. Нажми ещё раз.' });
  if (saved) await render(saved);
}

/**
 * Показывает статистику завершённых партий.
 * @param {number} userId - Идентификатор игрока.
 * @returns {Promise<object>} Сообщение со статистикой.
 */
export async function showStats(userId) {
  const player = await getPlayer(userId);
  return api.sendMessage({ chat_id: userId,
    text: `📊 Твоя статистика\n🏆 Победы: ${player.wins}\n💥 Поражения: ${player.losses}\nНезавершённые партии не учитываются.`,
    reply_markup: { inline_keyboard: levelButtons() } });
}
