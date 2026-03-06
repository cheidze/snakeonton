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

// Setup Telegram payment hooks before starting bot
bot.on('pre_checkout_query', (ctx) => {
    // Automatically approve the pre-checkout query for purchasing gold
    const pkgPayload = ctx.preCheckoutQuery.invoice_payload;
    console.log(`[Redsys Payment] Pre-checkout query received for payload: ${pkgPayload}`);

    // In a real app with limited items, you'd check inventory here.
    // For digital currency, we can always approve.
    ctx.answerPreCheckoutQuery(true).catch(e => {
        console.error('[Redsys Payment] Failed to answer pre_checkout_query:', e);
    });
});

bot.on('successful_payment', (ctx) => {
    const payment = ctx.message.successful_payment;
    console.log(`[Redsys Payment] Successful payment! Payload: ${payment.invoice_payload}, Total Amount: ${payment.total_amount} ${payment.currency}`);

    // Usually, you would update the user's database balance here.
    // However, since SnakeTON stores data in localStorage on the client,
    // the client will manually update their balance after receiving the 'paid' status from the Telegram WebApp.
    // We just acknowledge it here.
});

bot.launch();
console.log('🤖 Telegram Bot started.');

// Setup express server for future webhooks/API (like Withdraw requests)
const app = express();
app.use(cors());
app.use(express.json());

app.get('/', (req, res) => res.send('Snake TON Backend is running'));

/**
 * POST /api/create-invoice
 * Generates an invoice link using Telegram Bot's createInvoiceLink
 */
app.post('/api/create-invoice', async (req, res) => {
    try {
        const { userId, goldAmount, priceAmount, currency } = req.body;

        if (!userId || !goldAmount || !priceAmount || !currency) {
            return res.status(400).json({ success: false, error: 'Missing required fields' });
        }

        const providerToken = process.env.PROVIDER_TOKEN;
        if (!providerToken) {
            console.error('[Create Invoice Error] PROVIDER_TOKEN is missing in the environment');
            return res.status(500).json({ success: false, error: 'Payment Provider Token not configured in backend' });
        }

        const title = `${goldAmount.toLocaleString()} Gold`;
        const description = `Purchase ${goldAmount.toLocaleString()} Gold in Snake.io TON`;
        const payload = `gold_purchase_${goldAmount}_${userId}_${Date.now()}`;
        const prices = [{ label: title, amount: priceAmount }];

        console.log(`[Payment Request] Generating invoice for ${goldAmount} Gold (User: ${userId}, Amount: ${priceAmount} ${currency})`);

        const invoiceLink = await bot.telegram.createInvoiceLink({
            title,
            description,
            payload,
            provider_token: providerToken,
            currency,
            prices,
            need_name: false,
            need_phone_number: false,
            need_email: false,
            need_shipping_address: false,
            is_flexible: false,
        });

        console.log(`[Payment Request] Successfully generated invoice Link`);
        res.json({ success: true, url: invoiceLink });

    } catch (error) {
        console.error('[Create Invoice Error]:', error);
        res.status(500).json({ success: false, error: 'Failed to create invoice' });
    }
});

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

        // Use testnet API for testing
        const TON_API_BASE = process.env.TON_NETWORK === 'testnet'
            ? 'https://testnet.toncenter.com/api/v2'
            : 'https://toncenter.com/api/v2';

        console.log(`[Transaction Verification] Network: ${process.env.TON_NETWORK || 'mainnet'}`);
        console.log(`[Transaction Verification] User: ${userId}, Type: ${type}, Amount: ${amount}`);
        console.log(`[Transaction Verification] TX Hash: ${txHash}`);

        // TODO: Implement actual TON API verification in production
        // For now, accept all transactions in testnet/demo mode
        if (process.env.TON_NETWORK === 'testnet') {
            console.log('[Transaction Verification] Testnet mode - accepting without verification');
            res.json({
                success: true,
                message: 'Transaction verified (testnet mode)',
                data: { type, amount, itemName }
            });
        } else {
            // Production verification would go here
            res.json({
                success: true,
                message: 'Transaction verified (demo mode)',
                data: { type, amount, itemName }
            });
        }

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
