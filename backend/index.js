import { Telegraf } from 'telegraf';
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const WEB_APP_URL = process.env.WEB_APP_URL || 'https://example.vercel.app'; // Update this to your deployed URL

if (!BOT_TOKEN) {
    throw new Error('TELEGRAM_BOT_TOKEN is missing in .env');
}

const bot = new Telegraf(BOT_TOKEN);

bot.start((ctx) => {
    // Extract start_param from deep link (e.g. t.me/Bot?start=ref_123)
    const startPayload = ctx.payload;
    let url = WEB_APP_URL;

    // Pass the referral code to the Mini App using tgWebAppStartParam
    if (startPayload) {
        url = `${WEB_APP_URL}?tgWebAppStartParam=${startPayload}`;
    }

    ctx.reply(
        'Welcome to Snake.io TON! 🐍⛓️\n\nPlay the game, climb the leaderboard, earn coins, and withdraw real TON!',
        {
            reply_markup: {
                inline_keyboard: [
                    [{ text: '🎮 PLAY NOW', web_app: { url } }]
                ]
            }
        }
    );
});

bot.launch();
console.log('🤖 Telegram Bot started.');

// Setup express server for future webhooks/API (like Withdraw requests)
const app = express();
app.use(cors());
app.use(express.json());

app.get('/', (req, res) => res.send('Snake TON Backend is running'));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 API Server running on port ${PORT}`);
});

// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
