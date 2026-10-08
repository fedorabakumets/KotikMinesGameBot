/**
 * @fileoverview Личные команды запуска игры «Мины» и просмотра статистики.
 */
import { showStats } from '../lib/gameplay.js';
import { showSelection } from '../lib/navigation.js';

/**
 * Обрабатывает личные команды игрока.
 * @param {object} message - Входящее сообщение Telegram.
 * @returns {Promise<object|void>} Ответ бота.
 */
export default async function handleMessage(message) {
  if (message.chat?.type !== 'private' || message.from?.id !== message.chat.id) return;
  const command = (message.text || '').split(/\s/)[0].split('@')[0].toLowerCase();
  if (command === '/game') return showSelection(message.from.id, 'classic');
  if (command === '/plain') return showSelection(message.from.id, 'plain');
  if (command === '/risk') return showSelection(message.from.id, 'risk');
  if (command === '/stats') return showStats(message.from.id);
  return showSelection(message.from.id);
}
