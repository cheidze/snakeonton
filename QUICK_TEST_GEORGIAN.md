# 🎯 სწრაფი გზამკვლევი - Testnet ჩართვა

## ✅ რა გაკეთდა

შენი მონაცემები უკვე კოდშია ჩაშენებული:

### საფულეები:
1. **ძირითადი საფულე (აქვს ბალანსი):** 
   ```
   0QC9q38UghP0eT3E9RwXBdjAThZ-CmTou3WckAgFQlX_w3OR
   ```
   - ამ საფულეზე მიდის გადახდები
   - აქ არის TON საყიდლებისთვის

2. **ცარიელი საფულე (გატანისთვის):**
   ```
   0QB9Js8V8HJd8BRLsbbf24sFkRmOXqWLZ_CcRr9jHBdd3C0X
   ```
   - ამ საფულეზე მოდის ხურდა
   - ცარიელია ტესტირებისთვის

---

## 🚀 როგორ დავტესტოთ (5 ნაბიჯი)

### ნაბიჯი 1: Backend-ის გაშვება

```bash
cd backend
npm install
npm start
```

უნდა დაინახო:
```
🤖 Telegram Bot started.
🚀 API Server running on port 3000
```

### ნაბიჯი 2: Frontend-ის გაშვება

```bash
cd remisnakeonton
npm install
npm run dev
```

მიიღებ URL-ს: `http://localhost:5173`

### ნაბიჯი 3: ბოტში შესვლა

1. გახსენი Telegram
2. მოძებნე შენი ბოტი
3. დააჭირე "Play Now" ღილაკს

### ნაბიჯი 4: საფულის მიერთება

1. დააჭირე "Connect TON Wallet"
2. აირჩიე TonKeeper (TESTNET რეჟიმში!)
3. დაადასტურე მიერთება
4. უნდა გამოჩნდეს შენი საფულის მისამართი

### ნაბიჯი 5: ყიდვის ტესტირება

1. **შედი Shop-ში**
2. **აირჩიე სკინი** (მაგ: Neon Blue - 0.1 TON)
3. **დააჭირე "Buy with TON"**
4. **დაადასტურე ტრანზაქცია** საფულეში
5. **დაელოდე 5-10 წამს**

### ✅ წარმატების ნიშნები:

- სკინი გაიხსნა ✅
- ღილაკი იცვალა "Equipped"-ად ✅
- Console-ში წერს: `[PaymentService] Process payment success` ✅

---

## 🔍 როგორ შევამოწმოთ ტრანზაქცია

1. ** скоპირე TX Hash** console-დან
2. **გახსენი:** https://testnet.tonscan.org/tx/{TX_HASH}
3. **შეამოწმე:**
   - ვისაც უგზავნი = შენი საფულე
   - თანხა = სწორია
   - სტატუსი = Success

---

## 💰 ხურდის გატანა (Withdrawal)

1. **აათამაშე რამდენჯერმე** რომ დააგროვო 100,000+ gold
2. **შედი Shop → Withdraw**
3. **მიუერთე ცარიელი საფულე:** `0QB9Js8V8HJd8BRLsbbf24sFkRmOXqWLZ_CcRr9jHBdd3C0X`
4. **დააჭირე "CONFIRM WITHDRAW"**
5. **მიიღებ შეტყობინებას:** "Withdraw requested successfully!"

---

## 🐛 პრობლემების მოგვარება

### "Wallet not connected"
**გადაწყვეტა:** დარწმუნდი რომ TonKeeper არის TESTNET რეჟიმში, არა mainnet!

### ტრანზაქცია ვერ ხერხდება
**გადაწყვეტა:**
- გაქვს საკმარისი ბალანსი?
- Backend ჩართულია პორტ 3000-ზე?
- Treasury address სწორია?

### სკინი არ იხსნება
**გადაწყვეტა:**
- შეამოწმე browser console (F12)
- Backend-მა მიიღო თხოვნა?
- ტრანზაქცია გავიდა blockchain-ზე?

---

## 📊 რა უნდა მოხდეს

### ყიდვის შემდეგ:

**შენი საფულე:**
- Before: 5 TON
- After: 4.9 TON (-0.1 TON for skin)

**Treasury საფულე:**
- Before: 1 TON  
- After: 1.1 TON (+0.1 TON from purchase)

**თამაში:**
- ✅ სკინი unlocked
- ✅ სკინი equipped
- ✅ ტრანზაქცია ჩაიწერა

**Blockchain:**
```
From: შენი საფულე
To: EQC9q38UghP0eT3E9RwXBdjAThZ-CmTou3WckAgFQlX_w3OR
Amount: 0.1 TON
Status: Success ✅
```

---

## ⚡ სწრაფი ბმულები

**Testnet Explorer:**
- ტრანზაქციები: https://testnet.tonscan.org
- საფულეები: https://testnet.tonscan.org/address/EQC9q38UghP0eT3E9RwXBdjAThZ-CmTou3WckAgFQlX_w3OR

**უფასო Testnet TON:**
- Telegram: https://t.me/testgiver_ton_bot
- ვებგვერდი: https://faucet.ton.org/testnet

---

## 🎯 შემდეგი ნაბიჯები

1. ✅ დატესტე ყიდვა testnet-ზე
2. ✅ დატესტე გატანა testnet-ზე
3. ✅ ყველაფერი მუშაობს?
4. ⏳ ჩაანაცვლე mainnet საფულით
5. ⏳ განაახლე .env ფაილები
6. ⏳ განათავსე Vercel/Railway-ზე
7. ⏳ გაგზავნე Telegram Apps Center-ში

---

## 🇬🇪 ქართულად რომ ვთქვათ:

**კოდი მზად არის!** შენი საფულის მისამართები უკვე ჩაშენებულია.

**რაც დარჩა:**
1. ჩართე backend (`npm start`)
2. ჩართე frontend (`npm run dev`)
3. გახსენი ბოტი Telegram-ში
4. სცადე ყიდვა 0.1 TON-ით

**თუ მუშაობს** - მერე გადადი mainnet-ზე და გაგზავნე განაცხადი!

**წარმატება! 🚀🐍**
