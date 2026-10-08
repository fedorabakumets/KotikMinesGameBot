/**
 * @fileoverview Личные команды запуска игры «Мины» и просмотра статистики.
 */
import { api } from 'sdk';
import { startGame, showStats } from '../lib/gameplay.js';
import { levelButtons } from '../lib/view.js';

/**
 * Обрабатывает личные команды игрока.
 * @param {object} message - Входящее сообщение Telegram.
 * @returns {Promise<object|void>} Ответ бота.
 */
export default async function handleMessage(message) {
  if (message.chat?.type !== 'private' || message.from?.id !== message.chat.id) return;
  const command = (message.text || '').split(/\s/)[0].split('@')[0].toLowerCase();
  if (command === '/game') return startGame(message.from.id);
  if (command === '/stats') return showStats(message.from.id);
  return api.sendMessage({ chat_id: message.from.id,
    text: '💣 Мины\nОткрой все безопасные клетки на поле 5×5. Число показывает мины в соседних клетках.\n'
      + 'Первое открытие безопасно. Переключай режим, чтобы ставить или снимать флажки.\n'
      + '🙂 5 мин · 😎 8 мин · 🔥 12 мин\n\nВыбери сложность:',
    reply_markup: { inline_keyboard: levelButtons() } });
}
