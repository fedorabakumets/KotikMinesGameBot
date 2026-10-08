/**
 * @fileoverview Сохранённые партии и личная статистика игры «Мины».
 */
import { table, integer, json } from 'sdk/db';
/** Текущая партия и статистика каждого игрока. */
export const players = table('mines_players', {
  /** Идентификатор игрока Telegram. */
  userId: integer('user_id').primaryKey(),
  /** Состояние текущей партии или отсутствие партии. */
  game: json('game').notNull().default({}),
  /** Версия записи для защиты одновременных ходов. */
  version: integer('version').notNull().default(0),
  /** Сообщение с действующим полем. */
  messageId: integer('message_id').notNull().default(0),
  /** Количество побед. */
  wins: integer('wins').notNull().default(0),
  /** Количество поражений. */
  losses: integer('losses').notNull().default(0),
  /** Сумма сохранённых очков режима «Забрать». */
  points: integer('points').notNull().default(0),
  /** Количество раундов, завершённых кнопкой «Забрать». */
  cashouts: integer('cashouts').notNull().default(0),
});
