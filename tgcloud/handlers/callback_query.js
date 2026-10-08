/**
 * @fileoverview Кнопки выбора сложности, открытия клеток и установки флажков.
 */
import { api } from 'sdk';
import { startGame, play, showStats } from '../lib/gameplay.js';
import { LEVELS } from '../lib/engine.js';
import { showSelection } from '../lib/navigation.js';

/**
 * Обрабатывает кнопки только для владельца личного игрового поля.
 * @param {object} query - Нажатие inline-кнопки.
 * @returns {Promise<void>} Завершение обработки кнопки.
 */
export default async function handleCallback(query) {
  if (query.message?.chat?.type !== 'private' || query.message.chat.id !== query.from?.id) {
    await api.answerCallbackQuery({ callback_query_id: query.id, text: 'Играй в личном чате с ботом.' });
    return;
  }
  const [action, value] = (query.data || '').split(':');
  if (['cell', 'mode', 'take'].includes(action)) return play(query);
  await api.answerCallbackQuery({ callback_query_id: query.id });
  if (action === 'games') return showSelection(query.from.id, undefined, query.message.message_id);
  if (action === 'choose') return showSelection(query.from.id, value, query.message.message_id);
  if (action === 'new' && LEVELS.includes(Number(value))) await startGame(query.from.id, Number(value));
  else if (action === 'plain' && LEVELS.includes(Number(value))) await startGame(query.from.id, Number(value), false);
  else if (action === 'risk' && LEVELS.includes(Number(value))) await startGame(query.from.id, Number(value), false, 'cashout');
  else if (action === 'stats') await showStats(query.from.id);
}
