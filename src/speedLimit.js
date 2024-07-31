import fs from 'fs';
import path from 'path';
import { sendTelegramMessage } from './telegram.js';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
// Функция для проверки превышения скорости и сохранения результатов
export const checkSpeedLimit = async (geoData, currentData, passportsData) => {
    let violations = [];

    currentData.speeds.forEach((speed, index) => {
        const lat = currentData.lat[index];
        const lon = currentData.lon[index];
        const vehicleId = currentData.idMo[index];

        // Находим номер регистрации автомобиля по его id
        const vehiclePassport = passportsData.passports.find(passport => passport.idMO === vehicleId);
        const regNumber = vehiclePassport ? vehiclePassport.regNumber : 'Неизвестный номер';

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
                        maxSpeed: maxSpeed,
                        zone: zoneName,
                        coordinates: { lat: lat, lon: lon }
                    });

                    const violationMessage = `Нарушение! Автомобиль с номером: ${regNumber}, скорость: ${speed} км/ч, зона: ${zoneName}, превышение на: ${speedLimitViolation} км/ч`;
                    console.log(violationMessage);
                    // Отправляем сообщение в Telegram
                    sendTelegramMessage(violationMessage); // Добавил await, чтобы дождаться выполнения
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