import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { sendTelegramMessage } from './telegram.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Объект для хранения количеств нарушений по автомобилям и зонам
let violationCounts = {};

// Функция для проверки превышения скорости и сохранения результатов
export const checkSpeedLimit = async (geoData, currentData, passportsData) => {
    let violations = [];

    currentData.speeds.forEach((speed, index) => {
        const lat = currentData.lat[index];
        const lon = currentData.lon[index];
        const vehicleId = currentData.idMo[index];
        const time = currentData.time[index];

        // Находим номер регистрации автомобиля по его id
        const vehiclePassport = passportsData.passports.find(passport => passport.idMO === vehicleId);
        const regNumber = vehiclePassport ? vehiclePassport.regNumber : 'Неизвестный номер';
        const model = vehiclePassport.modelOrMarkOrModif;

        geoData.features.forEach((feature) => {
            const zoneName = feature.properties.zoneName;
            const maxSpeed = feature.properties.maxSpeed;

            // Проверка, находится ли точка (lon, lat) внутри полигональной зоны
            if (isPointInPolygon(lon, lat, feature.geometry.coordinates[0])) {
                const speedLimitViolation = speed - maxSpeed; // Разница между текущей скоростью и максимальной

                // Проверка превышения скорости на более чем 20 км/ч
                if (speed > maxSpeed && speedLimitViolation > 20) {
                    violations.push({
                        regNumber: regNumber,
                        speed: speed,
                        model: model,
                        time: time,
                        maxSpeed: maxSpeed,
                        zone: zoneName,
                        coordinates: { lat: lat, lon: lon }
                    });

                    const violationMessage = `
Дата/время нарушения ${time}. 
Автомобиль ${model} номер: ${regNumber},
развил скорость: ${speed} км/ч. 
В зоне: ${zoneName} 
и тем самым превысил ограничение скорости на: ${speedLimitViolation} км/ч.
Координаты нарушителя: 
https://www.google.com/maps/search/${lon}E,${lat}N?sa=X&ved=1t:242&ictx=111`;

                    console.log(violationMessage);

                    // Формируем уникальный ключ для идентификации нарушений по автомобилям и зонам
                    const violationKey = `${regNumber}-${zoneName}`;

                    // Проверка и обновление количества нарушений
                    if (violationCounts[violationKey]) {
                        violationCounts[violationKey]++;
                        // Отправляем сообщение в Telegram только при повторных нарушениях
                        if (violationCounts[violationKey] > 1) {
                             sendTelegramMessage(violationMessage);
                        }
                    } else {
                        violationCounts[violationKey] = 1;
                    }
                }
            }
        });
    });

    // Сохранение данных о нарушениях в файл
    fs.writeFileSync(path.join(__dirname, 'speedlimit.json'), JSON.stringify(violations, null, 2));
};

// Функция для проверки, находится ли точка в пределах полигона
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