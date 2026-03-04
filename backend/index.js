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

/**
 * POST /api/verify-transaction
 * Verifies a TON blockchain transaction and processes purchases/withdrawals
 */
app.post('/api/verify-transaction', async (req, res) => {
    try {
        const { txHash, userId, type, amount, itemName } = req.body;
        
        if (!txHash || !userId || !type) {
            return res.status(400).json({ 
                success: false, 
                error: 'Missing required fields' 
            });
        }

        // TODO: Implement TON API verification
        // Use https://toncenter.com/api/v2/getTransaction?hash=${txHash}
        // Verify:
        // 1. Transaction exists on-chain
        // 2. Sender matches user wallet
        // 3. Amount matches expected
        // 4. Recipient is TREASURY_ADDRESS
        
        console.log(`[Transaction Verification] User: ${userId}, Type: ${type}, Amount: ${amount}`);
        
        // For now, accept all transactions (REMOVE IN PRODUCTION)
        res.json({ 
            success: true, 
            message: 'Transaction verified (demo mode)',
            data: { type, amount, itemName }
        });
        
    } catch (error) {
        console.error('Transaction verification error:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Verification failed' 
        });
    }
});

/**
 * POST /api/process-withdraw
 * Processes withdrawal request from game gold to TON
 */
app.post('/api/process-withdraw', async (req, res) => {
    try {
        const { userId, tonAddress, goldAmount } = req.body;
        
        if (!userId || !tonAddress || !goldAmount) {
            return res.status(400).json({ 
                success: false, 
                error: 'Missing required fields' 
            });
        }

        // TODO: Implement actual TON transfer from treasury wallet
        // This requires:
        // 1. Backend wallet with TON balance
        // 2. Smart contract for automated payouts
        // 3. Database tracking of withdrawals
        
        console.log(`[Withdraw Request] User: ${userId}, Address: ${tonAddress}, Gold: ${goldAmount}`);
        
        res.json({ 
            success: true, 
            message: 'Withdrawal queued for processing',
            estimatedTime: '24-48 hours'
        });
        
    } catch (error) {
        console.error('Withdraw error:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Withdrawal failed' 
        });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 API Server running on port ${PORT}`);
});

// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
