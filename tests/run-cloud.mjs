/**
 * @fileoverview Запуск облачных проверок с подменой Telegram API и удалением временных данных.
 */
import fs from 'node:fs';
import { runFunction } from '../node_modules/@tgcloud/cli/src/api/endpoints.js';

/**
 * Собирает исходники модулей для пробного запуска.
 * @param {string} directory - Каталог исходников.
 * @param {string} prefix - Префикс имени модуля.
 * @returns {object} Исходники модулей.
 */
function readModules(directory, prefix = '') {
  const sources = {};
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const full = `${directory}/${entry.name}`, name = `${prefix}${entry.name}`;
    if (entry.isDirectory()) Object.assign(sources, readModules(full, `${name}/`));
    else if (entry.name.endsWith('.js')) sources[name.slice(0, -3)] = fs.readFileSync(full, 'utf8');
  }
  return sources;
}
const sources = readModules('tgcloud');
sources['handlers/message'] = fs.readFileSync('tests/cloud-scenario.js', 'utf8');
sources['lib/mock-api'] = fs.readFileSync('tests/mock-api.js', 'utf8');
sources['lib/gameplay'] = sources['lib/gameplay'].replace("import { api } from 'sdk';", "import { api } from './mock-api.js';");
const token = process.env.TGCLOUD_TOKEN;
if (!token) throw new Error('Установите TGCLOUD_TOKEN для проверки.');
try {
  for (const scenario of ['cloud-scenario.js', 'cloud-rewards.js']) {
    sources['handlers/message'] = fs.readFileSync(`tests/${scenario}`, 'utf8');
    const result = await runFunction(token, 'handlers/message', sources, {}, {});
    for (const line of result.log || []) console.log(line.m);
    console.log(JSON.stringify(result.result));
  }
} catch (error) {
  console.error(error.description || error.message);
  process.exitCode = 1;
}
