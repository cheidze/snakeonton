# 📋 Complete Environment Variables Guide

## 🎯 Frontend (Vercel) - Environment Variables

Add these in **Vercel Dashboard** → Settings → Environment Variables:

### Required Variables:

```bash
# Treasury Wallet Address (Your testnet wallet)
VITE_TON_TREASURY_ADDRESS=EQC9q38UghP0eT3E9RwXBdjAThZ-CmTou3WckAgFQlX_w3OR

# Network Mode (testnet or mainnet)
VITE_TON_NETWORK=testnet

# Backend URL (Optional for testnet, Required for mainnet)
VITE_BACKEND_URL=https://your-backend-url.railway.app
```

### How to Add in Vercel:

1. Go to https://vercel.com/dashboard
2. Click on your project
3. Click "Settings" tab
4. Click "Environment Variables" in left menu
5. Click "New Variable" button
6. Add each variable:

| Variable Name | Value | Environment |
|--------------|-------|-------------|
| `VITE_TON_TREASURY_ADDRESS` | `EQC9q38UghP0eT3E9RwXBdjAThZ-CmTou3WckAgFQlX_w3OR` | Production |
| `VITE_TON_NETWORK` | `testnet` | Production |
| `VITE_BACKEND_URL` | `https://your-backend-url.railway.app` | Production (optional) |

7. Click "Save" after each one
8. Redeploy your app

---

## 🔧 Backend (Railway/Heroku) - Environment Variables

If you deploy backend later, add these:

```bash
# Telegram Bot Token
TELEGRAM_BOT_TOKEN=8750454558:AAEgpWVYzT9wiGJTOPZejWJg7sf39ifjri8

# Frontend Web App URL
WEB_APP_URL=https://snakeonton.vercel.app

# Treasury Wallet Address
TON_TREASURY_ADDRESS=EQC9q38UghP0eT3E9RwXBdjAThZ-CmTou3WckAgFQlX_w3OR

# Network Mode
TON_NETWORK=testnet

# Server Port
PORT=3000

# TON API Key (Optional, for production)
TON_API_KEY=your_toncenter_api_key_here
```

---

## 📁 Local .env Files

### Frontend `.env` (remisnakeonton/.env):

```bash
VITE_TON_TREASURY_ADDRESS=EQC9q38UghP0eT3E9RwXBdjAThZ-CmTou3WckAgFQlX_w3OR
VITE_TON_NETWORK=testnet
VITE_BACKEND_URL=http://localhost:3000
```

### Backend `.env` (backend/.env):

```bash
TELEGRAM_BOT_TOKEN=8750454558:AAEgpWVYzT9wiGJTOPZejWJg7sf39ifjri8
WEB_APP_URL=https://snakeonton.vercel.app
TON_TREASURY_ADDRESS=EQC9q38UghP0eT3E9RwXBdjAThZ-CmTou3WckAgFQlX_w3OR
TON_NETWORK=testnet
PORT=3000
```

---

## ✅ Quick Checklist for Current Setup

Since your app is already deployed on Vercel and working:

### Must Add to Vercel (REQUIRED):
- [x] `VITE_TON_TREASURY_ADDRESS` = `EQC9q38UghP0eT3E9RwXBdjAThZ-CmTou3WckAgFQlX_w3OR`
- [x] `VITE_TON_NETWORK` = `testnet`

### Optional (for future):
- [ ] `VITE_BACKEND_URL` = (add when you deploy backend)

---

## 🔍 What Each Variable Does:

### Frontend Variables:

**`VITE_TON_TREASURY_ADDRESS`**
- Your wallet address that receives payments
- Currently set to your testnet wallet
- Format: Starts with "EQ" for testnet

**`VITE_TON_NETWORK`**
- Tells the app which network to use
- `testnet` = testing mode (free TON)
- `mainnet` = real money mode

**`VITE_BACKEND_URL`**
- URL of your backend server
- Optional for testnet (auto-approves transactions)
- Required for mainnet (verifies transactions)

### Backend Variables:

**`TELEGRAM_BOT_TOKEN`**
- Your bot's authentication token
- From @BotFather
- Keep this secret!

**`WEB_APP_URL`**
- Where your frontend is hosted
- Currently: https://snakeonton.vercel.app

**`TON_TREASURY_ADDRESS`**
- Same as frontend, but for backend verification

**`TON_NETWORK`**
- Must match frontend (both testnet or both mainnet)

**`PORT`**
- Server port number
- Default: 3000

---

## 🚀 Step-by-Step: Add to Vercel NOW

### Method 1: Vercel Dashboard (Recommended)

1. **Open Vercel:**
   - Go to https://vercel.com/dashboard
   - Sign in if needed

2. **Select Project:**
   - Click on "Snake.io TON" or your project name

3. **Go to Settings:**
   - Click "Settings" tab at the top
   - Click "Environment Variables" in left sidebar

4. **Add First Variable:**
   - Click "New Variable"
   - Name: `VITE_TON_TREASURY_ADDRESS`
   - Value: `EQC9q38UghP0eT3E9RwXBdjAThZ-CmTou3WckAgFQlX_w3OR`
   - Environment: Check "Production"
   - Click "Save"

5. **Add Second Variable:**
   - Click "New Variable" again
   - Name: `VITE_TON_NETWORK`
   - Value: `testnet`
   - Environment: Check "Production"
   - Click "Save"

6. **Redeploy:**
   - Go back to "Deployments" tab
   - Find latest deployment
   - Click three dots (⋮) → "Redeploy"
   - Click "Redeploy" button

### Method 2: Vercel CLI

```bash
cd remisnakeonton

# Link to your Vercel project
vercel link

# Add environment variables
vercel env add VITE_TON_TREASURY_ADDRESS EQC9q38UghP0eT3E9RwXBdjAThZ-CmTou3WckAgFQlX_w3OR
vercel env add VITE_TON_NETWORK testnet

# Deploy to production
vercel deploy --prod
```

---

## ⚠️ Important Notes:

1. **After adding variables, MUST redeploy!**
   - Changes don't apply automatically
   - Click "Redeploy" in Vercel dashboard

2. **Testnet vs Mainnet:**
   - Currently using `testnet` (correct for testing)
   - When ready for production, change to `mainnet` AND update treasury address

3. **Keep secrets secret:**
   - Never share `TELEGRAM_BOT_TOKEN`
   - Don't commit `.env` files to Git

4. **Variable names are case-sensitive:**
   - Must be exactly: `VITE_TON_TREASURY_ADDRESS`
   - Not: `vite_ton_treasury_address` (won't work!)

---

## 🇬🇪 ქართულად:

### რა უნდა დაამატო Vercel-ში:

1. **მიდი:** https://vercel.com/dashboard
2. **აირჩიე შენი პროექტი**
3. **Settings → Environment Variables**
4. **დაამატე 2 ცვლადი:**

| სახელი | მნიშვნელობა |
|--------|-------------|
| `VITE_TON_TREASURY_ADDRESS` | `EQC9q38UghP0eT3E9RwXBdjAThZ-CmTou3WckAgFQlX_w3OR` |
| `VITE_TON_NETWORK` | `testnet` |

5. **გააკეთე Redeploy**

ეს არის ყველაფერი! მეტი არაფერი სჭირდება ახლა.

---

## 📞 After Adding Variables:

### Test Immediately:

1. Wait 2-3 minutes after redeploy
2. Open Telegram bot
3. Press F12 (open console)
4. Try to buy a skin
5. Check console shows:
   ```
   ✅ [PaymentService] Testnet mode - auto-approving transaction
   ```

### If Still Not Working:

Check in Vercel:
- Are variables added correctly?
- Did you select "Production" environment?
- Did you redeploy after adding?

Check console:
- What error message appears?
- Send me the exact error!

---

## 🎯 Summary - JUST THESE TWO:

For now, you ONLY need these 2 variables in Vercel:

```bash
VITE_TON_TREASURY_ADDRESS=EQC9q38UghP0eT3E9RwXBdjAThZ-CmTou3WckAgFQlX_w3OR
VITE_TON_NETWORK=testnet
```

That's it! Nothing else needed for testnet payments to work! 🚀

**წარმატება!** Now go add these to Vercel and test! 🐍💎
