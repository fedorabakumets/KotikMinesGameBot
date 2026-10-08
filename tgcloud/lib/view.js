/**
 * @fileoverview Текст и кнопки игрового поля без раскрытия скрытых мин.
 */
import { SIZE, nearbyMines } from './engine.js';
import { roundPoints } from './rewards.js';
/** Обозначения количества соседних мин. */
const NUMBERS = ['▫️', '1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣'];

/**
 * Создаёт кнопку Telegram.
 * @param {string} text - Подпись кнопки.
 * @param {string} data - Действие кнопки.
 * @returns {object} Кнопка с данными действия.
 */
export function button(text, data) { return { text, callback_data: data }; }

/**
 * Создаёт компактную навигацию к выбору игры.
 * @returns {Array} Строки кнопок сложности.
 */
export function levelButtons() {
  return [[button('🎮 Выбрать игру', 'games')]];
}

/**
 * Формирует безопасное представление партии для Telegram.
 * @param {object} game - Состояние игры.
 * @returns {object} Текст и клавиатура поля.
 */
export function board(game) {
  const finished = game.status !== 'playing';
  const rows = Array.from({ length: SIZE }, (_, y) => Array.from({ length: SIZE }, (_, x) => {
    const cell = y * SIZE + x;
    let label = '⬜';
    if (finished && game.mines.includes(cell)) label = game.exploded === cell ? '💥' : '💣';
    else if (game.opened.includes(cell)) label = game.variant === 'cashout' ? '💎' : NUMBERS[nearbyMines(game, cell)];
    else if (game.flags.includes(cell)) label = '🚩';
    return button(label, `cell:${game.id}:${cell}`);
  }));
  const title = game.status === 'cashed' ? `💰 Забрано ${roundPoints(game)} очков!`
    : game.status === 'won' ? '🏆 Победа! Все безопасные клетки открыты.'
    : game.status === 'lost' ? '💥 Мина! Попробуй ещё раз.' : '💣 Мины — открой все безопасные клетки';
  const progress = `Поле 5×5 · Мин: ${game.count} · Открыто: ${game.opened.length}/${25 - game.count}`;
  if (!finished && game.variant === 'cashout') rows.push([button(`💰 Забрать: ${roundPoints(game)} очков`, `take:${game.id}`)]);
  if (!finished && game.flagsEnabled !== false) rows.push([button(game.mode === 'open' ? '🚩 Ставить флажки' : '👆 Открывать клетки', `mode:${game.id}`)]);
  const action = game.variant === 'cashout' ? 'risk' : game.flagsEnabled === false ? 'plain' : 'new';
  rows.push([button('🔄 Ещё раз', `${action}:${game.count}`), button('🎮 Выбор игры', 'games')]);
  const help = game.variant === 'cashout' ? `\n💎 Режим «Забрать» · Очки раунда: ${roundPoints(game)}\n`
    + (finished ? 'Раунд завершён.' : 'Клетка = 10 очков. Мина обнулит раунд. Можно забрать после первого хода.')
    : game.flagsEnabled === false ? '\nБез флажков: нажимай клетки, чтобы открывать их.'
    : finished ? '' : `\nРежим: ${game.mode === 'open' ? 'открытие' : 'флажки'} · Флажки: ${game.flags.length}/${game.count}`;
  return { text: `${title}\n${progress}${help}`, reply_markup: { inline_keyboard: rows } };
}
