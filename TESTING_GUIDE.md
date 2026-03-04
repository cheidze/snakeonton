# 🧪 Testnet Testing Guide - Snake.io TON

## ✅ Configuration Complete

Your testnet wallets have been integrated into the code:

### Treasury Address (Receiving Payments)
```typescript
// Updated in constants.ts
TREASURY_ADDRESS = "EQC9q38UghP0eT3E9RwXBdjAThZ-CmTou3WckAgFQlX_w3OR"
```

### Your Wallets
- **Wallet 1 (With Balance):** `0QC9q38UghP0eT3E9RwXBdjAThZ-CmTou3WckAgFQlX_w3OR` ✅
- **Wallet 2 (Empty, for withdrawals):** `0QB9Js8V8HJd8BRLsbbf24sFkRmOXqWLZ_CcRr9jHBdd3C0X`

---

## 🚀 Step-by-Step Testing Instructions

### Step 1: Start Backend Server

```bash
cd backend

# Create .env if not exists
cat > .env << EOF
TELEGRAM_BOT_TOKEN=your_actual_bot_token
WEB_APP_URL=http://localhost:5173
TON_NETWORK=testnet
EOF

# Install and start
npm install
npm start
```

Expected output:
```
🤖 Telegram Bot started.
[Transaction Verification] Network: testnet
🚀 API Server running on port 3000
```

### Step 2: Update Frontend .env

```bash
cd remisnakeonton

# Create .env if not exists
cat > .env << EOF
VITE_BACKEND_URL=http://localhost:3000
VITE_TON_TREASURY_ADDRESS=EQC9q38UghP0eT3E9RwXBdjAThZ-CmTou3WckAgFQlX_w3OR
VITE_TON_NETWORK=testnet
EOF
```

### Step 3: Start Frontend

```bash
npm install
npm run dev
```

This will give you a local URL like: `http://localhost:5173`

### Step 4: Update Bot Menu Button

1. Open @BotFather in Telegram
2. Send `/setmenubutton`
3. Select your bot
4. Enter URL: `http://localhost:5173` (for local testing)
5. Done!

**Note:** For production, use Vercel URL instead of localhost.

### Step 5: Test Purchase Flow

1. **Open Telegram bot**
   - Find your bot
   - Click menu button or "Play Now"

2. **Connect Wallet**
   - Click "Connect TON Wallet" in main menu
   - TonKeeper should open (make sure it's in TESTNET mode!)
   - Approve connection
   - You should see your wallet address displayed

3. **Navigate to Shop**
   - Click "Shop" button
   - Browse to "skins" tab

4. **Purchase Skin with TON**
   - Find a skin with TON price (e.g., Neon Blue - 0.1 TON)
   - Click "Buy with TON" button
   - TON Connect modal opens
   - Review transaction details:
     - **To:** EQC9q38UghP0eT3E9RwXBdjAThZ-CmTou3WckAgFQlX_w3OR
     - **Amount:** 0.1 TON (or whatever the price is)
   - Confirm in wallet
   - Wait ~5-10 seconds for confirmation

5. **Verify Success**
   - ✅ Skin should unlock immediately
   - ✅ "Equipped" button appears on skin
   - ✅ Transaction recorded in UI
   - ✅ Console shows: `[PaymentService] Process payment success`

6. **Check Blockchain**
   - Copy transaction hash from console
   - Visit: https://testnet.tonscan.org/tx/{TX_HASH}
   - Verify transaction details match

### Step 6: Test Withdrawal Flow

1. **Accumulate Gold**
   - Play several games
   - Need at least 100,000 gold for withdrawal

2. **Connect Empty Wallet**
   - Switch to Wallet 2 in TonKeeper: `0QB9Js8V8HJd8BRLsbbf24sFkRmOXqWLZ_CcRr9jHBdd3C0X`
   - Or use different wallet app

3. **Request Withdrawal**
   - Go to Shop → Withdraw tab
   - Should show:
     - Your Balance: 100,000+ 💰
     - Estimated TON: 10+ TON
     - Connected Wallet: Your empty wallet address
   - Click "CONFIRM WITHDRAW"
   - Backend logs should show withdrawal request

4. **Verify**
   - ✅ Success message appears
   - ✅ Transaction recorded
   - ✅ Backend receives request

---

## 🔍 Debugging Tips

### Console Logs to Watch For

**Frontend (Browser Console):**
```
[TonService] TonConnectUI initialized
[TelegramService] Analytics initialized
[PaymentService] Process payment success
[PaymentService] Verify transaction success
```

**Backend (Terminal):**
```
[Transaction Verification] Network: testnet
[Transaction Verification] User: demo_user, Type: buy_skin, Amount: 0.1
[Transaction Verification] TX Hash: ...
[Transaction Verification] Testnet mode - accepting without verification
```

### Common Issues & Solutions

#### Issue 1: "Wallet not connected" error
**Solution:** Make sure TonKeeper is in TESTNET mode, not mainnet!

#### Issue 2: Transaction fails
**Solution:** 
- Check you have enough balance
- Verify treasury address is correct
- Check backend is running on port 3000

#### Issue 3: Skin doesn't unlock after payment
**Solution:**
- Check browser console for errors
- Verify backend received verification request
- Check transaction on testnet explorer

#### Issue 4: Can't connect to backend
**Solution:**
```bash
# Check backend is running
curl http://localhost:3000/
# Should return: "Snake TON Backend is running"
```

---

## 📊 Expected Results

### After Purchase Test:

**Treasury Wallet Balance:**
- Before: X TON
- After: X + 0.1 TON (for Neon Blue skin)

**Game State:**
- ✅ Skin unlocked
- ✅ Skin equipped
- ✅ Transaction in history
- ✅ Gold balance unchanged (paid with TON)

**Blockchain Record:**
```
Transaction Details:
- From: Your wallet address
- To: EQC9q38UghP0eT3E9RwXBdjAThZ-CmTou3WckAgFQlX_w3OR
- Amount: 0.1 TON
- Status: Success
- Comment: "Buy Skin: Neon Blue"
```

### After Withdrawal Test:

**Game State:**
- ✅ Gold deducted (100,000+)
- ✅ Withdrawal recorded
- ✅ Success message shown

**Backend Logs:**
```
[Withdraw Request] User: demo_user, Address: 0QB9..., Gold: 100000
```

---

## 🎯 Production Checklist

Once testnet testing is successful:

### 1. Get Mainnet Wallet
- Download TonKeeper (mainnet version)
- Backup seed phrase securely!
- Get your mainnet address (starts with EQ...)

### 2. Update Code
```typescript
// constants.ts
export const TREASURY_ADDRESS = "YOUR_MAINNET_ADDRESS_HERE";
```

### 3. Update Environment
```bash
# Frontend .env
VITE_TON_TREASURY_ADDRESS=YOUR_MAINNET_ADDRESS
VITE_TON_NETWORK=mainnet

# Backend .env
TON_TREASURY_ADDRESS=YOUR_MAINNET_ADDRESS
TON_NETWORK=mainnet
```

### 4. Deploy
```bash
# Frontend to Vercel
vercel deploy --prod

# Backend to Railway
railway up
```

### 5. Test with Small Amount
- Buy cheapest skin first (0.1 TON)
- Verify everything works
- Then test withdrawal

---

## 📞 Support Resources

**Testnet Explorers:**
- Transactions: https://testnet.tonscan.org
- Addresses: https://testnet.tonscan.org/address

**Get Test TON:**
- Telegram: https://t.me/testgiver_ton_bot
- Web: https://faucet.ton.org/testnet

**Documentation:**
- TON Connect: https://docs.ton.org/develop/dapps/ton-connect
- Your configs: See [`TESTNET_CONFIG.md`](file:///home/xeiron/Documents/snakeonton/TESTNET_CONFIG.md)

---

## ✅ Current Status Summary

✅ Code updated with testnet treasury address  
✅ Backend configured for testnet mode  
✅ Both wallets documented and ready  
✅ Game already running in Telegram bot  
✅ App already added to bot menu  

**Next Action:** Start backend and test a purchase! 🚀

---

**გიმარჯოს! (Good luck!) 🐍⛓️💎**
