# 🚀 Snake.io TON - Deployment & Testing Checklist

## ⚙️ Pre-Deployment Setup

### 1. Environment Variables

**Backend `.env` file:**
```bash
TELEGRAM_BOT_TOKEN=your_bot_token_here
WEB_APP_URL=https://snakeonton.vercel.app
PORT=3000
# Add these for production:
# TON_API_KEY=your_toncenter_api_key (optional, for rate limiting)
# TREASURY_WALLET_PRIVATE_KEY=secure_key (for automated withdrawals)
```

**Frontend `.env` file:**
```bash
VITE_BACKEND_URL=https://your-backend-url.com
VITE_TON_TREASURY_ADDRESS=EQCJvI7GevbB_iS5HlHntk8x1zD1lH8H_-Rz-L3D3vB2R-7W
```

---

## 📦 Build & Deploy Steps

### Frontend Deployment (Vercel)

```bash
cd remisnakeonton

# 1. Install dependencies
npm install

# 2. Build for production
npm run build

# 3. Test locally (optional)
npm run preview

# 4. Deploy to Vercel
vercel deploy --prod
```

**Vercel Settings:**
- **Build Command:** `npm run build`
- **Output Directory:** `dist`
- **Install Command:** `npm install`

### Backend Deployment (Railway/Heroku)

```bash
cd backend

# 1. Install dependencies
npm install

# 2. Start server
npm start

# Or deploy with Railway CLI:
railway up
```

---

## ✅ Testing Checklist

### 🔗 Wallet Connection Tests

- [ ] **Connect Wallet Button Works**
  - Click "Connect TON Wallet" in main menu
  - TON Connect modal should appear
  - Select wallet (TonKeeper, TonSpace, etc.)
  - Approve connection in wallet app
  
- [ ] **Wallet Address Displays**
  - After connecting, address should show as "UQ...1234" format
  - Address persists after page refresh
  
- [ ] **Disconnect Works**
  - Click disconnect button
  - Wallet disconnects cleanly
  - UI updates to show "not connected" state

### 💰 Purchase Flow Tests

- [ ] **Buy Skin with Gold**
  - Navigate to Shop
  - Select a skin with gold price
  - Click "Buy with Gold"
  - Gold deducted, skin unlocked immediately
  
- [ ] **Buy Skin with TON (TESTNET RECOMMENDED)**
  - Connect TON wallet first
  - Select skin with TON price (e.g., Neon Blue - 0.1 TON)
  - Click "Buy with TON"
  - TON Connect payment modal opens
  - Confirm transaction in wallet
  - Wait for blockchain confirmation (~5-10 seconds)
  - Skin unlocks automatically
  
- [ ] **Transaction Verification**
  - Check backend logs for `/api/verify-transaction` call
  - Verify transaction appears on https://tonscan.org
  - Confirm correct amount sent to treasury address

### 💸 Withdrawal Flow Tests

- [ ] **Minimum Withdrawal Validation**
  - Accumulate at least 100,000 gold (play games)
  - Go to Shop → Withdraw tab
  - If gold < 100,000, error message shows
  - If gold ≥ 100,000, withdraw button enabled
  
- [ ] **Withdraw Request**
  - Connect TON wallet
  - Click "Confirm Withdraw"
  - Transaction sent to backend
  - Success message displays
  - Backend logs withdrawal request

### 📊 Analytics Tests

- [ ] **App Launch Tracking**
  - Open app in Telegram
  - Check console for `[TelegramService] Analytics initialized`
  - Verify `app_launch` event fires
  
- [ ] **Event Tracking**
  - Play a game session
  - Check console logs for tracked events:
    - `game_start`
    - `game_end`
    - `purchase_attempt`
    - `purchase_success` or `purchase_failed`
    - `withdraw_attempt`
    - `withdraw_success` or `withdraw_failed`
  
- [ ] **User Properties**
  - Login with Telegram
  - Verify `username` property set via `setUserProperty()`

### 📄 Compliance Tests

- [ ] **Terms of Use Page**
  - Visit `https://snakeonton.vercel.app/terms.html`
  - Page loads correctly over HTTPS
  - Content is readable and complete
  
- [ ] **Privacy Policy Page**
  - Visit `https://snakeonton.vercel.app/privacy.html`
  - Page loads correctly over HTTPS
  - Content is readable and complete
  
- [ ] **TON Connect Manifest**
  - Visit `https://snakeonton.vercel.app/tonconnect-manifest.json`
  - JSON file loads with all required fields:
    - `url`
    - `name`
    - `iconUrl`
    - `termsOfUseUrl`
    - `privacyPolicyUrl`
    - `description`

---

## 🎮 End-to-End User Journey Test

**Complete this flow as a real user would:**

1. **Discovery**
   - [ ] Open Telegram bot @YourBotName
   - [ ] Click "Play Now" button
   
2. **Onboarding**
   - [ ] Mini App opens automatically
   - [ ] Auto-login via Telegram works
   - [ ] Username appears in game
   
3. **First Game**
   - [ ] Click "Play" from main menu
   - [ ] Game loads and playable
   - [ ] Snake moves smoothly
   - [ ] Collect coins/food works
   - [ ] Death and game over screen appears
   - [ ] Score and gold displayed correctly
   
4. **Shop Experience**
   - [ ] Click "Shop" from main menu
   - [ ] Browse skins tabs (skins, particles, themes)
   - [ ] Preview skins work (click color swatches)
   - [ ] Buy a skin with gold (if enough gold)
   - [ ] Equip purchased skin
   
5. **Wallet Integration**
   - [ ] Click "Connect TON Wallet"
   - [ ] Choose wallet from list
   - [ ] Wallet connects successfully
   - [ ] Address displays in UI
   
6. **Premium Purchase**
   - [ ] Select premium skin (has TON price)
   - [ ] Click "Buy with TON"
   - [ ] Payment modal opens
   - [ ] Confirm in wallet
   - [ ] Skin unlocks after confirmation
   
7. **Progression**
   - [ ] Play multiple games
   - [ ] XP bar fills up
   - [ ] Level up modal appears
   - [ ] Rewards claimed
   
8. **Withdrawal**
   - [ ] Accumulate 100,000+ gold
   - [ ] Go to Withdraw tab
   - [ ] Request withdrawal
   - [ ] Confirmation received

---

## 🛡️ Security Tests

### Backend Verification

- [ ] **Transaction Tampering Prevention**
  - Modify transaction amount in browser DevTools
  - Backend should reject invalid transactions
  - Error message displayed to user

- [ ] **Rate Limiting** (if implemented)
  - Attempt multiple rapid withdrawals
  - System should limit requests
  - Appropriate error shown

### Data Privacy

- [ ] **No Sensitive Data in Client**
  - Check browser localStorage
  - No private keys or sensitive data stored
  - Only public wallet addresses saved

- [ ] **HTTPS Everywhere**
  - All API calls use HTTPS
  - No mixed content warnings
  - SSL certificate valid

---

## 📱 Device/Browser Testing

Test on multiple platforms:

- [ ] **Telegram Desktop** (Windows/Mac/Linux)
- [ ] **Telegram Mobile iOS**
- [ ] **Telegram Mobile Android**
- [ ] **Telegram Web** (browser-based)

**For each platform, verify:**
- App loads correctly
- Touch/mouse controls work
- UI scales properly
- Wallet connection works
- Performance is acceptable

---

## 🐛 Common Issues & Fixes

### Issue: "TON Connect not initialized"
**Fix:** Ensure manifest URL is correct and publicly accessible:
```javascript
const manifestUrl = `${window.location.origin}/tonconnect-manifest.json`;
// Must be HTTPS in production
```

### Issue: "Transaction fails silently"
**Fix:** Check browser console for errors, ensure proper payload encoding:
```typescript
// Correct format:
payload: base64EncodedComment // With text tag prefix
```

### Issue: "Backend not receiving transactions"
**Fix:** Verify backend URL in frontend env:
```bash
VITE_BACKEND_URL=https://your-backend.railway.app
```

### Issue: "Analytics not firing"
**Fix:** Ensure running inside Telegram context:
```typescript
telegramService.isTelegramContext() // Should return true
```

---

## 📈 Post-Deployment Monitoring

### Metrics to Track

1. **User Engagement**
   - Daily Active Users (DAU)
   - Session duration
   - Retention rate (D1, D7, D30)
   
2. **Monetization**
   - Purchase conversion rate
   - Average revenue per user (ARPU)
   - Total TON volume
   
3. **Technical**
   - App load time
   - Transaction success rate
   - Error rate
   - Backend uptime

### Tools

- **Telegram Analytics Dashboard:** Built-in analytics from SDK
- **TON Explorer:** Monitor treasury wallet transactions
- **Backend Logs:** Railway/Heroku logging
- **Error Tracking:** Consider Sentry or similar

---

## 🎯 Final Submission Steps

1. ✅ Complete ALL tests above
2. ✅ Fix any bugs found
3. ✅ Deploy to production (Vercel + Railway)
4. ✅ Test on live Telegram bot
5. ✅ Fill out Telegram Apps Center submission form
6. ✅ Submit for review
7. ⏳ Wait 2-5 business days
8. 🎉 APPROVED - Launch!

---

## 📞 Support Resources

**Documentation:**
- [TON Connect Docs](https://docs.ton.org/develop/dapps/ton-connect/overview)
- [Telegram Mini Apps](https://core.telegram.org/bots/webapps)
- [Telegram Analytics](https://core.telegram.org/bots/webapps#analytics)

**Community:**
- [TON Developers Chat](https://t.me/tondev)
- [Telegram Bot Creators](https://t.me/BotCreators)

**Your App Info:**
- **Frontend:** https://snakeonton.vercel.app
- **Backend:** https://your-backend-url.com
- **Manifest:** https://snakeonton.vercel.app/tonconnect-manifest.json
- **Terms:** https://snakeonton.vercel.app/terms.html
- **Privacy:** https://snakeonton.vercel.app/privacy.html

---

**Good luck! 🚀🐍⛓️**
