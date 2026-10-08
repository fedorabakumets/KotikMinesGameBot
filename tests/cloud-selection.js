/**
 * @fileoverview Проверка переходов выбора игры и запуска правильного режима без реальных сообщений.
 */
import { db } from 'sdk';
import { eq } from 'sdk/db';
import { players } from '../schema.js';
import handleCallback from '../handlers/callback_query.js';
import { getPlayer } from '../lib/storage.js';
import { calls } from '../lib/mock-api.js';
let passed = 0;

/**
 * Проверяет переход игрового меню.
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
 * Проверяет меню, возврат и запуск всех трёх режимов на временном игроке.
 * @returns {Promise<object>} Количество успешных проверок.
 */
export default async function verifySelection() {
  const userId = -Date.now();
  const query = { id: 'меню', from: { id: userId }, message: { chat: { id: userId, type: 'private' }, message_id: 77 } };
  try {
    for (const [mode, action] of [['risk', 'risk'], ['classic', 'new'], ['plain', 'plain']]) {
      await handleCallback({ ...query, data: `choose:${mode}` });
      const page = calls.filter(call => call.method === 'editMessageText').at(-1).params;
      const buttons = page.reply_markup.inline_keyboard.flat();
      check(buttons.length === 4 && buttons.slice(0, 3).every(item => item.callback_data.startsWith(`${action}:`)),
        `Выбор ${mode} показывает только его сложности`);
      await handleCallback({ ...query, data: `${action}:8` });
      const player = await getPlayer(userId);
      check(player.game.count === 8 && (player.game.variant === 'cashout') === (mode === 'risk')
        && player.game.flagsEnabled === (mode === 'classic'), `Выбор ${mode} запускает правильную партию`);
    }
    await handleCallback({ ...query, data: 'games' });
    const menu = calls.filter(call => call.method === 'editMessageText').at(-1).params;
    check(menu.reply_markup.inline_keyboard.flat().filter(item => item.callback_data.startsWith('choose:')).length === 3,
      'Возврат показывает три режима игры');
    return { passed };
  } finally {
    await db.delete(players).where(eq(players.userId, userId)).run();
  }
}
