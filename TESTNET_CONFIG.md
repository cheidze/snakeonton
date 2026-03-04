# TON Testnet Configuration

## Your Testnet Wallets

### Primary Testnet Wallet (Has Balance) ✅
**Address:** `0QC9q38UghP0eT3E9RwXBdjAThZ-CmTou3WckAgFQlX_w3OR`
**Raw Format:** `EQC9q38UghP0eT3E9RwXBdjAThZ-CmTou3WckAgFQlX_w3OR`
**Balance:** Has TON (for testing purchases)

### Secondary Testnet Wallet (Empty)
**Address:** `0QB9Js8V8HJd8BRLsbbf24sFkRmOXqWLZ_CcRr9jHBdd3C0X`
**Raw Format:** `EQB9Js8V8HJd8BRLsbbf24sFkRmOXqWLZ_CcRr9jHBdd3C0X`
**Balance:** 0 TON (for testing withdrawals)

---

## Updated Configuration Files

### Frontend (.env)
```bash
# Use testnet treasury address
VITE_TON_TREASURY_ADDRESS=EQC9q38UghP0eT3E9RwXBdjAThZ-CmTou3WckAgFQlX_w3OR

# Backend URL (update after deployment)
VITE_BACKEND_URL=http://localhost:3000

# Testnet mode
VITE_TON_NETWORK=testnet
```

### Backend (.env)
```bash
TELEGRAM_BOT_TOKEN=your_bot_token_here
WEB_APP_URL=https://your-deployed-url.com

# Treasury wallet (testnet)
TON_TREASURY_ADDRESS=EQC9q38UghP0eT3E9RwXBdjAThZ-CmTou3WckAgFQlX_w3OR

# Network setting
TON_NETWORK=testnet
```

---

## Testing Flows

### 1. Test Purchase Flow
1. Open game in Telegram bot
2. Connect your testnet wallet (TonKeeper testnet mode)
3. Go to Shop
4. Select a skin with TON price (e.g., Neon Blue - 0.1 TON)
5. Click "Buy with TON"
6. Confirm transaction in wallet
7. **Expected Result:**
   - Transaction sent to: `EQC9q38UghP0eT3E9RwXBdjAThZ-CmTou3WckAgFQlX_w3OR`
   - Skin unlocks immediately
   - Transaction recorded in UI

### 2. Test Withdrawal Flow
1. Play games to accumulate gold (need 100,000+ gold)
2. Go to Shop → Withdraw tab
3. Connect empty testnet wallet: `0QB9Js8V8HJd8BRLsbbf24sFkRmOXqWLZ_CcRr9jHBdd3C0X`
4. Click "Confirm Withdraw"
5. **Expected Result:**
   - Backend receives withdrawal request
   - Queued for processing
   - Success message shown

---

## Verify Transactions

### Check Treasury Balance
Use TON testnet explorer:
- **URL:** https://testnet.tonscan.org/address/EQC9q38UghP0eT3E9RwXBdjAThZ-CmTou3WckAgFQlX_w3OR
- Should see incoming payments from purchases

### Check Transaction Details
After making a purchase, verify:
1. Transaction hash appears in console
2. Check on explorer: `https://testnet.tonscan.org/tx/{TX_HASH}`
3. Confirm:
   - Sender = Your wallet
   - Recipient = Treasury address
   - Amount = Correct TON amount

---

## Backend Transaction Verification (Testnet)

Update backend to use testnet API:

```javascript
// In backend/index.js - /api/verify-transaction endpoint

// Use testnet API endpoint
const TON_API_BASE = 'https://testnet.toncenter.com/api/v2';

async function verifyTransaction(txHash) {
    const response = await fetch(
        `${TON_API_BASE}/getTransaction?hash=${txHash}&api_key=${process.env.TON_API_KEY || ''}`
    );
    
    // Verify transaction details...
}
```

---

## Get Free Testnet TON

If you need more testnet TON:

1. **Telegram Faucet:** https://t.me/testgiver_ton_bot
2. **Web Faucet:** https://faucet.ton.org/testnet

Request small amounts for testing:
- 1 TON = enough for ~10 skin purchases
- Use for both wallets during testing

---

## Switching to Mainnet (Production)

When ready for production:

1. **Replace treasury address** in `constants.ts`:
```typescript
export const TREASURY_ADDRESS = "YOUR_MAINNET_WALLET_HERE";
```

2. **Update environment variables**:
```bash
VITE_TON_TREASURY_ADDRESS=YOUR_MAINNET_WALLET
VITE_TON_NETWORK=mainnet
```

3. **Update backend**:
```bash
TON_TREASURY_ADDRESS=YOUR_MAINNET_WALLET
TON_NETWORK=mainnet
```

4. **Test everything again on mainnet** with small amounts first!

---

## Current Status

✅ Game is running in Telegram bot
✅ App is added to bot menu
✅ Testnet wallets configured
✅ Treasury address updated in code
⏳ Ready to test transactions

**Next Step:** Test a purchase with your primary wallet!
