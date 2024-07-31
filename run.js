import { updateData } from './src/index.js';

// Вызываем обновление данных каждые 5 минут
setInterval(updateData, 2 * 60 * 1000);

// Запускаем первый вызов сразу
updateData();