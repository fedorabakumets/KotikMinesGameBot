/**
 * @fileoverview Отправка и переключение экранов выбора игры в одном сообщении.
 */
import { api } from 'sdk';
import { gamesMenu, difficultyMenu } from './selection.js';

/**
 * Показывает выбор режима или сложности, обновляя сообщение меню при нажатии.
 * @param {number} userId - Получатель меню.
 * @param {string} mode - Необязательный выбранный режим.
 * @param {number} messageId - Необязательное сообщение для обновления.
 * @returns {Promise<object|boolean>} Результат Telegram API.
 */
export async function showSelection(userId, mode, messageId) {
  const page = mode ? difficultyMenu(mode) : gamesMenu();
  if (!messageId) return api.sendMessage({ chat_id: userId, ...page });
  try {
    return await api.editMessageText({ chat_id: userId, message_id: messageId, ...page });
  } catch (error) {
    if (String(error.description || error.message).includes('message is not modified')) return true;
    throw error;
  }
}
