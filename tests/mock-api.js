/**
 * @fileoverview Замена Telegram API для проверки игры без реальных сообщений.
 */
/** История обращений к тестовому API. */
export const calls = [];
/** Следующий идентификатор сообщения. */
let nextId = 100;

/**
 * Создаёт функцию записи вызова тестового API.
 * @param {string} method - Имя метода Telegram.
 * @returns {Function} Асинхронная имитация метода.
 */
function capture(method) {
  return async params => {
    calls.push({ method, params });
    return method === 'sendMessage' ? { message_id: nextId++ } : true;
  };
}
/** Методы API для игрового интерфейса. */
export const api = {
  /** Имитация отправки сообщения. */
  sendMessage: capture('sendMessage'),
  /** Имитация обновления игрового поля. */
  editMessageText: capture('editMessageText'),
  /** Имитация удаления предыдущего поля. */
  deleteMessage: capture('deleteMessage'),
  /** Имитация ответа на нажатие кнопки. */
  answerCallbackQuery: capture('answerCallbackQuery'),
};
