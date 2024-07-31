import fs from 'fs';

// Функция для чтения JSON-файлов
export const readJSONFile = (filePath) => {
    const rawData = fs.readFileSync(filePath);
    return JSON.parse(rawData);
};