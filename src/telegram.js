import fetch from 'node-fetch';

const telegramBotToken = '7369898185:AAE_S9UeSn3fyK5FtqEZiLdgCdvXTghlT14';
const telegramChannelId = '-1002204931455';

export const sendTelegramMessage = async (message) => {
    const telegramUrl = `https://api.telegram.org/bot${telegramBotToken}/sendMessage`;
    const chatId = telegramChannelId;

    try {
        const response = await fetch(telegramUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                chat_id: chatId,
                text: message,
                parse_mode: 'HTML' 
            })
        });

        if (!response.ok) {
            throw new Error(`Ошибка при отправке сообщения в Telegram: ${response.statusText}`);
        }
    } catch (error) {
        console.error('Ошибка при отправке сообщения в Telegram:', error);
    }
};