/**
 * @fileoverview Текст и кнопки игрового поля без раскрытия скрытых мин.
 */
import { SIZE, LEVELS, nearbyMines } from './engine.js';
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
 * Создаёт клавиатуру выбора новой партии.
 * @returns {Array} Строки кнопок сложности.
 */
export function levelButtons() {
  return [LEVELS.map((count, index) => button(['🙂 Легко', '😎 Средне', '🔥 Сложно'][index], `new:${count}`))];
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
    else if (game.opened.includes(cell)) label = NUMBERS[nearbyMines(game, cell)];
    else if (game.flags.includes(cell)) label = '🚩';
    return button(label, `cell:${game.id}:${cell}`);
  }));
  const title = game.status === 'won' ? '🏆 Победа! Все безопасные клетки открыты.'
    : game.status === 'lost' ? '💥 Мина! Попробуй ещё раз.' : '💣 Мины — открой все безопасные клетки';
  const progress = `Поле 5×5 · Мин: ${game.count} · Открыто: ${game.opened.length}/${25 - game.count}`;
  if (!finished) rows.push([button(game.mode === 'open' ? '🚩 Ставить флажки' : '👆 Открывать клетки', `mode:${game.id}`)]);
  rows.push(...levelButtons(), [button('📊 Статистика', 'stats')]);
  const help = finished ? '' : `\nРежим: ${game.mode === 'open' ? 'открытие' : 'флажки'} · Флажки: ${game.flags.length}/${game.count}`;
  return { text: `${title}\n${progress}${help}`, reply_markup: { inline_keyboard: rows } };
}
