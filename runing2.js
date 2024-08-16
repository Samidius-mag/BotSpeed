import { updateData } from './src/index.js';
import { exec } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

// Получаем текущий путь к файлу
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Определение пути к скриптам
const scriptPath = path.join(__dirname, './src/parkingZone.js');
const checkParkingStatusScriptPath = path.join(__dirname, './src/checkParkingStatus.js');

function runScript(scriptPath) {
    exec(`node ${scriptPath}`, (error, stdout, stderr) => {
        if (error) {
            console.error(`Ошибка при выполнении скрипта ${scriptPath}: ${error}`);
            return;
        }
        if (stderr) {
            console.error(`Ошибка: ${stderr}`);
        }
        console.log(`${stdout}`);
    });
}

// Запуск parkingZone скрипта сразу и затем каждые 3 минуты
runScript(scriptPath);
setInterval(() => runScript(scriptPath), 2 * 60 * 1000);

// Запуск checkParkingStatus скрипта сразу и затем каждую минуту
runScript(checkParkingStatusScriptPath);
//setInterval(() => runScript(checkParkingStatusScriptPath), 1 * 60 * 1000);

// Запуск updateData сразу и затем каждую минуту
updateData();
setInterval(updateData, 1 * 60 * 1000);