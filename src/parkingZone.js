import fs from 'fs';
import axios from 'axios'; // добавляем axios

const zonesFilePath = './src/geo.json'; // здесь вы должны указать путь к вашему файлу с зонами
const currentLocFilePath = './src/currentLoc.json'; // ваш файл с текущими координатами
const passportFilePath = './src/passport.json'; // файл с паспортами устройств
const outputFilePath = './src/stoyanka.json'; // файл для сохранения данных

const telegramBotToken = '6313272133:AAFrgEoF308LVQVuLNbsT0q_FL4HuEbRFT4';
const telegramChatId = '-1002217986744';

// Переменная для хранения message_id
let messageId = null;

function isPointInPolygon(point, polygon) {
    const [lon, lat] = point;
    let inside = false;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
        const [lon1, lat1] = polygon[i];
        const [lon2, lat2] = polygon[j];
        const intersect = ((lat1 > lat) !== (lat2 > lat)) &&
            (lon < (lon2 - lon1) * (lat - lat1) / (lat2 - lat1) + lon1);
        if (intersect) inside = !inside;
    }
    return inside;
}

// Функция для отправки сообщения в телеграмм
async function sendTelegramMessage(message) {
    const url = `https://api.telegram.org/bot${telegramBotToken}/sendMessage`;
    try {
        const response = await axios.post(url, {
            chat_id: telegramChatId,
            text: message,
        });
        console.log('Сообщение успешно отправлено в телеграмм.');
        return response.data.message_id;
    } catch (error) {
        console.error('Ошибка при отправке сообщения в телеграмм:', error);
    }
}

// Функция для редактирования сообщения в телеграмм
async function editTelegramMessage(message, messageId) {
    const url = `https://api.telegram.org/bot${telegramBotToken}/editMessageText`;
    try {
        await axios.post(url, {
            chat_id: telegramChatId,
            message_id: messageId,
            text: message,
        });
        console.log('Сообщение успешно отредактировано в телеграмм.');
    } catch (error) {
        console.error('Ошибка при редактировании сообщения в телеграмм:', error);
    }
}

fs.readFile(zonesFilePath, 'utf8', (err, zoneData) => {
    if (err) {
        console.error('Ошибка при чтении файла с зонами:', err);
        return;
    }

    const jsonZoneData = JSON.parse(zoneData);
    const targetZoneName = 'гараж ВГК Легковой';
    let targetZoneCoordinates = null;

    jsonZoneData.features.forEach(feature => {
        if (feature.properties.zoneName === targetZoneName) {
            targetZoneCoordinates = feature.geometry.coordinates[0]; // предположим, что у вас есть доступ к первому полигону
        }
    });

    if (!targetZoneCoordinates) {
        console.log('Зона не найдена');
        return;
    }

    fs.readFile(currentLocFilePath, 'utf8', (err, locData) => {
        if (err) {
            console.error('Ошибка при чтении файла с текущими координатами:', err);
            return;
        }

        const jsonLocData = JSON.parse(locData);
        const { lat, lon, idMo, time } = jsonLocData;

        fs.readFile(passportFilePath, 'utf8', (err, passportData) => {
            if (err) {
                console.error('Ошибка при чтении файла с паспортами:', err);
                return;
            }

            const jsonPassportData = JSON.parse(passportData);
            const passportsMap = {};
            const passportsMap1 = {};
            jsonPassportData.passports.forEach(passport => {
                passportsMap[passport.idMO] = passport.regNumber;
                passportsMap1[passport.idMO] = passport.modelOrMarkOrModif;
            });

            const carsInZone = [];
            let telegramMessage = 'Автомобили в зоне "гараж ВГК Легковой":\n';

            time.forEach((time, index) => {
                const longitude = lon[index];
                const latitude = lat[index];
                const id = idMo[index];
                const point = [longitude, latitude];

                if (isPointInPolygon(point, targetZoneCoordinates)) {
                    const regNumber = passportsMap[id] || 'Неизвестен';
                    const modelOrMarkOrModif = passportsMap1[id] || 'Неизвестен';
                    console.log(`${modelOrMarkOrModif} (Рег. номер: ${regNumber}) находится в гараже "${targetZoneName}" c ${time}.`);

                    carsInZone.push({
                        modelOrMarkOrModif: modelOrMarkOrModif,
                        regNumber: regNumber,
                        zoneName: targetZoneName,
                        time: time
                    });

                    telegramMessage += `${modelOrMarkOrModif}, номер: ${regNumber}, Время: ${time}\n`;
                }
            });

            // Сохранение данных в файл stoyanka.json
            fs.writeFile(outputFilePath, JSON.stringify(carsInZone, null, 2), 'utf8', (err) => {
                if (err) {
                    console.error('Ошибка при записи данных в файл stoyanka.json:', err);
                } else {
                    console.log('Данные успешно сохранены в файл stoyanka.json');
                }
            });

            // Отправка или редактирование сообщения в телеграмм канал
            if (carsInZone.length > 0) {
                if (messageId) {
                    editTelegramMessage(telegramMessage, messageId);
                } else {
                    sendTelegramMessage(telegramMessage).then(id => {
                        messageId = id;
                    });
                }
            }
        });
    });
});