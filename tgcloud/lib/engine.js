/**
 * @fileoverview Правила сапёра: безопасный первый ход, флажки и открытие пустых областей.
 */
/** Сторона квадратного поля. */
export const SIZE = 5;
/** Количество мин для трёх уровней сложности. */
export const LEVELS = [5, 8, 12];

/**
 * Создаёт новую партию без размещения мин до первого открытия.
 * @param {number} count - Количество мин.
 * @param {boolean} flagsEnabled - Возможность ставить флажки в партии.
 * @returns {object} Начальное состояние партии.
 */
export function newGame(count = 5, flagsEnabled = true) {
  if (!LEVELS.includes(count)) throw new Error('Неизвестная сложность');
  return { id: `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 9)}`,
    count, flagsEnabled, mines: [], opened: [], flags: [], mode: 'open', status: 'playing', exploded: -1 };
}

/**
 * Возвращает соседние клетки без перехода через края поля.
 * @param {number} cell - Индекс клетки.
 * @returns {Array<number>} Индексы соседей.
 */
export function neighbors(cell) {
  const result = [], x = cell % SIZE, y = Math.floor(cell / SIZE);
  for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
    const nx = x + dx, ny = y + dy;
    if ((dx || dy) && nx >= 0 && nx < SIZE && ny >= 0 && ny < SIZE) result.push(ny * SIZE + nx);
  }
  return result;
}

/**
 * Считает мины вокруг клетки.
 * @param {object} game - Состояние партии.
 * @param {number} cell - Индекс клетки.
 * @returns {number} Число соседних мин.
 */
export function nearbyMines(game, cell) { return neighbors(cell).filter(index => game.mines.includes(index)).length; }

/**
 * Выполняет ход без изменения переданного состояния.
 * @param {object} original - Предыдущее состояние.
 * @param {number} cell - Индекс нажатой клетки.
 * @param {Function} random - Источник случайности для размещения мин.
 * @returns {object} Новое состояние партии.
 */
export function move(original, cell, random = Math.random) {
  const game = JSON.parse(JSON.stringify(original));
  if (game.flagsEnabled === false) { game.mode = 'open'; game.flags = []; }
  if (game.status !== 'playing' || !Number.isInteger(cell) || cell < 0 || cell >= SIZE * SIZE) return game;
  if (game.opened.includes(cell)) return game;
  if (game.mode === 'flag') {
    if (game.flags.includes(cell)) game.flags = game.flags.filter(index => index !== cell);
    else if (game.flags.length < game.count) game.flags.push(cell);
    return game;
  }
  if (game.flags.includes(cell)) return game;
  if (!game.mines.length) {
    const pool = Array.from({ length: SIZE * SIZE }, (_, index) => index).filter(index => index !== cell);
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    game.mines = pool.slice(0, game.count);
  }
  if (game.mines.includes(cell)) { game.status = 'lost'; game.exploded = cell; return game; }
  const queue = [cell], opened = new Set(game.opened);
  while (queue.length) {
    const next = queue.pop();
    if (opened.has(next) || game.flags.includes(next) || game.mines.includes(next)) continue;
    opened.add(next);
    if (nearbyMines(game, next) === 0) queue.push(...neighbors(next));
  }
  game.opened = [...opened];
  if (game.opened.length === SIZE * SIZE - game.count) game.status = 'won';
  return game;
}
