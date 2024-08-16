import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { sendTelegramMessage } from './telegram.js';
import { readJSONFile } from './fileUtils.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const parkingZonePolygon = [
    [
        [142.111396, 49.157317],
        [142.112561, 49.156755],
        [142.111357, 49.155744],
        [142.110222, 49.156236],
        [142.111396, 49.157317],
    ],
];

export const writeJSONFile = (filePath, data) => {
    try {
        const jsonData = JSON.stringify(data, null, 2); // Сериализация данных в JSON
        fs.writeFileSync(filePath, jsonData, 'utf8'); // Запись в файл с указанием кодировки
    } catch (error) {
        console.error(`Ошибка при записи в файл ${filePath}:`, error);
    }
};

// Файл для хранения техники на стоянке
const parkingFilePath = path.join(__dirname, 'stoyanka.json');

// Функция для проверки нахождения техники в зоне стоянки
export const checkVehicleZone = async (currentData, passportsData) => {
    let parkedVehicles = readJSONFile(parkingFilePath) || [];

    currentData.lat.forEach((lat, index) => {
        const lon = currentData.lon[index];
        const vehicleId = currentData.idMo[index];
        //const regNumber = timeData[index].regNumber; // Предполагаем, что номер регистрации передается во время обработки
        const time = currentData.time[index]; // Получаем текущий час

        // Находим номер регистрации автомобиля по его id
        const vehiclePassport = passportsData.passports.find(passport => passport.idMO === vehicleId);
        const regNumber = vehiclePassport ? vehiclePassport.regNumber : 'Неизвестный номер';

        // Проверка, находится ли техника в пределах полигона
        if (isPointInPolygon(lon, lat, parkingZonePolygon[0])) {
            // Если находятся с 20:00 до 8:00, добавляем в файл
            //if (currentTime >= 8 || currentTime < 20) {
                if (!parkedVehicles.some(v => v.regNumber === regNumber)) {
                    parkedVehicles.push({
                        regNumber: regNumber,
                        time: time,
                        zoneName: 'Parking Zone',
                    });
                    fs.writeFileSync(parkingFilePath, JSON.stringify(parkedVehicles, null, 2));
                }
            }
      //  } else {
            // Проверка, если покинули зону
      //      const parkedVehicle = parkedVehicles.find(v => v.regNumber === regNumber);
      //      if (parkedVehicle) {
                // Удаляем из списка и отправляем сообщение
      //          parkedVehicles.splice(parkedVehicles.indexOf(parkedVehicle), 1);
      //          fs.writeFileSync(parkingFilePath, JSON.stringify(parkedVehicles, null, 2));
      //          sendTelegramMessage(`Автомобиль ${regNumber} покинул зону стоянки в ${time}`);
      //      }
      //  }
    });
};

// Проверяем, находится ли точка в пределах полигона
const isPointInPolygon = (lon, lat, polygon) => {
    let inside = false;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
        const xi = polygon[i][0], yi = polygon[i][1];
        const xj = polygon[j][0], yj = polygon[j][1];

        const intersect = ((yi > lat) !== (yj > lat)) && (lon < (xj - xi) * (lat - yi) / (yj - yi) + xi);
        if (intersect) inside = !inside;
    }
    return inside;
};