
const TelegramBot = require('node-telegram-bot-api');
require('dotenv').config();

const token = process.env.BOT_TOKEN;

if (!token) {
  console.log('Помилка: не знайдено BOT_TOKEN у файлі .env');
  process.exit(1);
}

const bot = new TelegramBot(token, { polling: true });

bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;

  bot.sendMessage(chatId, '💜 Ласкаво просимо до GiftStarsin!', {
    reply_markup: {
      inline_keyboard: [
        [
          {
            text: '🎮 Відкрити GiftStarsin',
            web_app: {
              url: 'https://ТУТ-ТВОЯ-АДРЕСА-САЙТУ.vercel.app'
            }
          }
        ]
      ]
    }
  });
});

console.log('GiftStarsin Bot запущено! 💜');
