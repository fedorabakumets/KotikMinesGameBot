/**
 * @fileoverview Сохранение партий с защитой от повторных и одновременных ходов.
 */
import { db } from 'sdk';
import { eq, and } from 'sdk/db';
import { players } from '../schema.js';

/**
 * Загружает игрока, создавая пустую запись при первом обращении.
 * @param {number} userId - Идентификатор игрока.
 * @returns {Promise<object>} Текущая запись игрока.
 */
export async function getPlayer(userId) {
  await db.insert(players).values({ userId }).onConflictDoNothing({ target: players.userId }).run();
  return db.select().from(players).where(eq(players.userId, userId)).get();
}

/**
 * Сохраняет ход только для ожидаемой версии и однократно учитывает результат.
 * @param {object} player - Прочитанная запись игрока.
 * @param {object} game - Новое состояние игры.
 * @param {number} messageId - Сообщение текущего поля.
 * @returns {Promise<object|undefined>} Обновлённая запись или конфликт версий.
 */
export async function saveGame(player, game, messageId = player.messageId) {
  const finished = player.game.id === game.id && player.game.status === 'playing' && game.status !== 'playing';
  const rows = await db.update(players).set({ game, messageId, version: player.version + 1,
    wins: player.wins + (finished && game.status === 'won' ? 1 : 0),
    losses: player.losses + (finished && game.status === 'lost' ? 1 : 0) })
    .where(and(eq(players.userId, player.userId), eq(players.version, player.version))).returning().run();
  return rows[0];
}
