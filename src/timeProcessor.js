import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const timeZoneOffset = 39600; // Сдвиг в секундах

// Функция для обработки времени и идентификаторов, сохраняет в processedTimeData.json
export const processTimeData = (currentData) => {
    const currentTimeInUTC = Math.floor(Date.now() / 1000); // Текущее время в UTC
    const currentTime = currentTimeInUTC + timeZoneOffset; // Корректируем текущее время
    const timeOutData = [];
    
    currentData.time.forEach((timeString, index) => {
        const timeParts = timeString.split(' ');
        const datePart = timeParts[0].split('.'); // Часть с датой
        const timePart = timeParts[1]; // Часть с временем

        // Создаем строку формата "YYYY-MM-DDTHH:mm:ssZ"
        const isoString = `${datePart[2]}-${datePart[1]}-${datePart[0]}T${timePart}Z`;
        const timeDate = new Date(isoString); // Преобразуем в формат ISO
        
        // Проверяем на корректность даты
        if (isNaN(timeDate.getTime())) {
            console.error(`Invalid date: ${isoString}`);
            return; // Если дата неверна, выходим из цикла
        }

        const timeInSeconds = Math.floor(timeDate.getTime() / 1000); // Время в секундах
        if (timeInSeconds < currentTime - 10800) {
            return; // Больше 3 часов
        } else if (timeInSeconds >= currentTime - 10800 && timeInSeconds < currentTime - 300) {
            // Добавляем в массив объект с идентификатором машины и временем
            timeOutData.push({
                id: currentData.idMo[index], // Получаем ID из соответствующего индекса
                time: timeInSeconds // Время в секундах
            });
        }
    });

    // Сохраняем данные о времени и идентификаторах в файл
    fs.writeFileSync(path.join(__dirname, 'processedTimeData.json'), JSON.stringify(timeOutData, null, 2));
    console.log('Данные о времени и идентификаторах успешно сохранены в файл processedTimeData.json');
};