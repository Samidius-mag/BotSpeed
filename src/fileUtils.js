import fs from 'fs';

// Функция для чтения JSON-файлов
export const readJSONFile = (filePath) => {
    try {
        const rawData = fs.readFileSync(filePath, 'utf8'); // Чтение файла с указанием кодировки
        // Если файл пустой, возвращаем пустой массив
        if (rawData.trim() === '') {
            return [];
        }
        return JSON.parse(rawData); // Парсинг JSON
    } catch (error) {
        console.error(`Ошибка при чтении файла ${filePath}:`, error);
        return []; // Возвращаем пустой массив в случае ошибки
    }
};