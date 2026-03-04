# ⚡ Quick Start - Deploy in 15 Minutes

## 🎯 Prerequisites
- Node.js installed (v16+)
- Vercel account (free)
- Railway/Heroku account (free)
- Telegram Bot Token from @BotFather

---

## Step 1: Update Treasury Address (2 min)

Edit `/remisnakeonton/services/constants.ts`:

```typescript
// Line 5 - Replace with YOUR TON wallet address
export const TREASURY_ADDRESS = "YOUR_TON_WALLET_HERE";
```

**Get your TON address:**
1. Open TonKeeper app
2. Copy your address (starts with `EQ...`)
3. Paste it in the code above

---

## Step 2: Deploy Frontend to Vercel (5 min)

```bash
# Navigate to frontend
cd remisnakeonton

# Install dependencies
npm install

# Build
npm run build

# Deploy to Vercel
vercel deploy --prod
```

**Copy the URL** you get (e.g., `https://snakeonton.vercel.app`)

---

## Step 3: Deploy Backend to Railway (5 min)

```bash
# Navigate to backend
cd backend

# Install dependencies
npm install

# Create .env file
cat > .env << EOF
TELEGRAM_BOT_TOKEN=YOUR_BOT_TOKEN
WEB_APP_URL=https://your-vercel-url.app
PORT=3000
EOF

# Deploy to Railway (install Railway CLI first)
railway init
railway up
```

**Copy the backend URL** (e.g., `https://snake-backend.railway.app`)

---

## Step 4: Update Environment Variables (2 min)

### Frontend `.env`:
```bash
cd remisnakeonton
cat > .env << EOF
VITE_BACKEND_URL=https://your-backend.railway.app
VITE_TON_TREASURY_ADDRESS=YOUR_TON_WALLET_ADDRESS
EOF
```

Then redeploy:
```bash
vercel deploy --prod
```

---

## Step 5: Configure Telegram Bot (1 min)

1. Open Telegram, find @BotFather
2. Send: `/setmenubutton`
3. Select your bot
4. Send the URL: `https://snakeonton.vercel.app`
5. Done!

---

## ✅ Test It!

Open your bot in Telegram and click "Play Now"!

### Quick Tests:
- [ ] Game loads
- [ ] Can connect TON wallet
- [ ] Shop opens
- [ ] Terms page loads: `https://snakeonton.vercel.app/terms.html`
- [ ] Privacy page loads: `https://snakeonton.vercel.app/privacy.html`
- [ ] Manifest accessible: `https://snakeonton.vercel.app/tonconnect-manifest.json`

---

## 🚀 Submit to Telegram Apps Center

Go to: https://telegram.org/appcenter/submit

Fill in:
- **Name:** Snake.io TON
- **URL:** https://snakeonton.vercel.app
- **Terms:** https://snakeonton.vercel.app/terms.html
- **Privacy:** https://snakeonton.vercel.app/privacy.html

Check all compliance boxes and submit!

---

## 📞 Problems?

**Frontend issues:** Check Vercel dashboard logs
**Backend issues:** Check Railway dashboard logs
**TON Connect issues:** Verify manifest is accessible

---

## 🎉 Done!

Your app is live and ready for Telegram submission! 

Next: Wait 2-5 business days for approval 🍀
