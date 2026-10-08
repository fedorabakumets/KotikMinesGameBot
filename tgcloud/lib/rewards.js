/**
 * @fileoverview Очки режима «Забрать» и досрочное завершение раунда.
 */

/**
 * Рассчитывает очки открытых клеток в режиме «Забрать».
 * @param {object} game - Текущая партия.
 * @returns {number} Очки раунда, обнулённые при попадании на мину.
 */
export function roundPoints(game) {
  return game.variant === 'cashout' && game.status !== 'lost' ? game.opened.length * 10 : 0;
}

/**
 * Завершает раунд с сохранением очков после хотя бы одного безопасного хода.
 * @param {object} game - Текущая партия.
 * @returns {object} Состояние после забора очков или исходная партия.
 */
export function cashOut(game) {
  if (game.variant !== 'cashout' || game.status !== 'playing' || !game.opened.length) return game;
  return { ...game, status: 'cashed' };
}
