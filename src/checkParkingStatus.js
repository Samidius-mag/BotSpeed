import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import fetch from 'node-fetch';  // Добавляем этот импорт для отправки запросов

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Путь к файлам stoyanka.json и stoyanka_duplicate.json
const filePath = path.join(__dirname, 'stoyanka.json');
const duplicateFilePath = path.join(__dirname, 'stoyanka_duplicate.json');

// Объект для хранения информации о том, какие уведомления уже были отправлены
const sentNotifications = new Set();

// Токен бота и ID канала
const telegramBotToken = '7185016757:AAH0ch30uH_OHDVNtv-6PkSqeZU-oqnr7DU';
const telegramChannelId = '-1002175902962';

// Функция для отправки сообщения в телеграмм канал
async function sendTelegramNotification(message) {
  const url = `https://api.telegram.org/bot${telegramBotToken}/sendMessage`;
  const params = {
    chat_id: telegramChannelId,
    text: message,
  };

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(params)
    });

    if (!response.ok) {
      throw new Error(`Ошибка при отправке уведомления: ${response.statusText}`);
    }

    const data = await response.json();
    if (!data.ok) {
      throw new Error(`Ошибка при отправке уведомления: ${data.description}`);
    }

    console.log('Уведомление успешно отправлено в телеграмм канал.');
  } catch (err) {
    console.error(err);
  }
}

// Функция для загрузки JSON-данных из файла
function loadJson(filePath) {
  return new Promise((resolve, reject) => {
    fs.readFile(filePath, 'utf8', (err, data) => {
      if (err) {
        reject(`Ошибка при чтении файла ${filePath}: ${err}`);
      } else {
        resolve(JSON.parse(data));
      }
    });
  });
}

// Функция для сохранения JSON-данных в файл
function saveJson(filePath, data) {
  return new Promise((resolve, reject) => {
    fs.writeFile(filePath, JSON.stringify(data), 'utf8', err => {
      if (err) {
        reject(`Ошибка при записи в файл ${filePath}: ${err}`);
      } else {
        resolve();
      }
    });
  });
}

// Функция для проверки времени и уведомления о покидании зоны
async function checkParkingStatus() {
  try {
    // Загружаем данные из обоих файлов
    const currentVehicles = await loadJson(filePath);
    let previousVehicles = [];
    
    try {
      previousVehicles = await loadJson(duplicateFilePath);
    } catch (err) {
      console.log('Предварительный файл отсутствует или поврежден, будет создан новый.');
    }

    // Создание словаря для более быстрого сравнения и объединение данных
    const vehicleMap = new Map();
    
    // Добавляем уже имеющиеся данные
    previousVehicles.forEach(vehicle => vehicleMap.set(vehicle.regNumber, vehicle));
    
    // Добавляем новые данные
    currentVehicles.forEach(vehicle => vehicleMap.set(vehicle.regNumber, vehicle));
    
    // Объединенные данные
    const allVehicles = Array.from(vehicleMap.values());

    // Определяем временные границы
    const currentTime = new Date();
    const currentHour = currentTime.getHours();
    const currentMinutes = currentTime.getMinutes();
    const isNightTime = (currentHour >= 17 || currentHour < 8);

    // Проверяем удаление техники
    if (isNightTime) {
      previousVehicles.forEach(async vehicle => {
        const currentVehicle = currentVehicles.find(v => v.regNumber === vehicle.regNumber);
        if (!currentVehicle) {
          // Проверяем, было ли уже отправлено уведомление для данного транспортного средства
          if (!sentNotifications.has(vehicle.regNumber)) {
            const message = `${vehicle.modelOrMarkOrModif} ${vehicle.regNumber} покинул(а) зону стоянки.`;
            console.log(message);
            await sendTelegramNotification(message);  // Отправляем уведомление в телеграмм канал
            sentNotifications.add(vehicle.regNumber);
          }
        }
      });
    }
    
    // Сохраняем объединенное состояние в дублирующий файл
    await saveJson(duplicateFilePath, allVehicles);

  } catch (err) {
    console.error(err);
  }
}

// Запускаем проверку каждые 1 минуту
setInterval(checkParkingStatus, 1 * 60 * 1000);

// Запуск проверки сразу при старте
checkParkingStatus();