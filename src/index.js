import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { sendTelegramMessage } from './telegram.js';
import { readJSONFile } from './fileUtils.js';
import { checkSpeedLimit } from './speedLimit.js';
import { processTimeData } from './timeProcessor.js';

const url = 'https://atp.ttwcome.ru/atp/api/v2';
const params = {
    token: '0E9DC7EE2995',
    command: 'getCurrentState',
    format: 'json',
    idMo: [7266, 7275, 7267, 7277, 7276, 7296, 7304, 7261, 7307, 7313, 7314, 7320, 7264, 7263, 7265, 7271, 7290, 7298, 7301, 7302,
        7303, 7305, 7306, 7299, 7315, 7317, 7319, 7318, 7316, 7321, 7279, 7282, 7286, 7292, 7293, 7283, 7322, 7324, 7329, 7325, 7328,
        7330, 7331, 7326, 7323, 7312, 7308, 7309, 7311, 7310, 7268, 7270, 7288, 7284, 7272, 7273, 7278, 7280, 7281, 7285, 7287, 7291,
        7300, 7297, 7295, 7097, 7260, 7262, 7269, 7274, 7289, 7860, 7636, 7641, 7642, 7467, 7456, 7457, 7459, 7452, 7451, 7460, 7462,
        7463, 7465, 7466, 7468, 7449, 7450, 7486, 7455, 7472, 7474, 7475, 7477, 7491, 7480, 7479, 7471, 7482, 7488, 7498, 7496, 7495,
        7493, 7458, 7494, 7497, 7492, 7481, 7473, 7470, 7464, 7448, 7461, 7483, 7453, 7485, 7478, 7490, 7476, 7487, 7469, 7454, 7484,
        7489]
};

// Получаем путь к текущему файлу и директории
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Основная функция для обновления данных
export const updateData = async () => {
    try {
        // Преобразуем параметры в строку запроса
        const queryString = new URLSearchParams(params).toString();

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: queryString
        });

        if (!response.ok) {
            throw new Error('Сетевой ответ был не в порядке: ' + response.statusText);
        }

        const data = await response.json();
        const speeds = data.list.map(item => item.speed);
        const lat = data.list.map(item => item.lat);
        const lon = data.list.map(item => item.lon);
        const idMo = data.list.map(item => item.idMo);
        const time = data.list.map(item => item.time); // Считываем время

        // Объект для сохранения
        const outputData = {
            speeds: speeds,
            lat: lat,
            lon: lon,
            idMo: idMo,
            time: time // Добавляем время в объект
        };

        // Сохранение данных в файл currentLoc.json
        fs.writeFileSync(path.join(__dirname, 'currentLoc.json'), JSON.stringify(outputData, null, 2));
        console.log('Данные успешно обновлены и сохранены в файл currentLoc.json');

        // Проверяем ограничения скорости
        const geoFilePath = path.join(__dirname, 'geo.json');
        const passportFilePath = path.join(__dirname, 'passport.json');

        const geoData = readJSONFile(geoFilePath);
        const passportsData = readJSONFile(passportFilePath);
        
        await checkSpeedLimit(geoData, outputData, passportsData);
        processTimeData(outputData); // Вызываем функцию для обработки временных данных

    } catch (error) {
        console.error('Произошла ошибка:', error);
    }
};