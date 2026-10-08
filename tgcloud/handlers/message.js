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
  if (command === '/plain') return startGame(message.from.id, 5, false);
  if (command === '/risk') return startGame(message.from.id, 5, false, 'cashout');
  if (command === '/stats') return showStats(message.from.id);
  return api.sendMessage({ chat_id: message.from.id,
    text: '💣 Мины\nОткрой все безопасные клетки на поле 5×5. Число показывает мины в соседних клетках.\n'
      + 'Первое открытие безопасно. Можно играть с флажками или без них: в варианте без флажков просто открывай клетки.\n'
      + 'В варианте с 🚩 переключай режим, чтобы ставить или снимать флажки.\n'
      + '💎 Режим «Забрать»: одна клетка = 10 очков, можно закончить раунд кнопкой «Забрать». Мина обнулит очки раунда.\n'
      + '🙂 5 мин · 😎 8 мин · 🔥 12 мин\n\nВыбери сложность (💎 — режим «Забрать»):',
    reply_markup: { inline_keyboard: levelButtons() } });
}
