# ⚡ Vercel Environment Variables - Step by Step

## 🎯 რა უნდა დაამატო (What to Add)

მხოლოდ **2 ცვლადი** სჭირდება ახლა:

```bash
VITE_TON_TREASURY_ADDRESS=EQC9q38UghP0eT3E9RwXBdjAThZ-CmTou3WckAgFQlX_w3OR
VITE_TON_NETWORK=testnet
```

---

## 📝 ნაბიჯ-ნაბიჯ ინსტრუქცია

### ნაბიჯი 1: გახსენი Vercel Dashboard

1. მიდი: https://vercel.com/dashboard
2. შედი შენს ანგარიშში (Sign in)
3. დაინახავ შენ პროექტებს

### ნაბიჯი 2: აირჩიე შენი პროექტი

1. დააკლიკე "Snake.io TON" ან შენს პროექტს
2. გაიხსნება პროექტის გვერდი

### ნაბიჯი 3: გადადი Settings-ში

1. ზემოთ არის ტაბები: Overview, Deployments, Analytics, **Settings**, ...
2. დააკლიკე **"Settings"**-ს

### ნაბიჯი 4: გახსენი Environment Variables

1. მარცხენა მენიუში იპოვე **"Environment Variables"**
2. დააკლიკე მას
3. დაინახავ ცხრილს (ცარიელი იქნება თუ ჯერ არ დაგიმატებია)

### ნაბიჯი 5: დაამატე პირველი ცვლადი

1. დააკლიკე **"New Variable"** ღილაკს
2. შეავსე ველები:

   ```
   Name: VITE_TON_TREASURY_ADDRESS
   Value: EQC9q38UghP0eT3E9RwXBdjAThZ-CmTou3WckAgFQlX_w3OR
   Environment: ✅ Production (მონიშნე)
   ```

3. დააკლიკე **"Save"** ღილაკს

### ნაბიჯი 6: დაამატე მეორე ცვლადი

1. ისევ დააკლიკე **"New Variable"** ღილაკს
2. შეავსე ველები:

   ```
   Name: VITE_TON_NETWORK
   Value: testnet
   Environment: ✅ Production (მონიშნე)
   ```

3. დააკლიკე **"Save"** ღილაკს

### ნაბიჯი 7: გააკეთე Redeploy

**ეს ძალიან მნიშვნელოვანია!** ცვლადები არ ამოქმედდება ხელახლა დეპლოის გარეშე.

1. გადადი **"Deployments"** ტაბზე
2. იპოვე უკანასკნელი დეპლოი (ყველაზე ზემოთ)
3. დააკლიკე **სამ წერტილს (⋮)** მარჯვნივ
4. აირჩიე **"Redeploy"**
5. დააკლიკე **"Redeploy"** ღილაკს (დადასტურება)

### ნაბიჯი 8: დაელოდე

1. დეპლოი დასრულდება 2-3 წუთში
2. სტატუსი შეიცვლება: Building → Ready ✅
3. მზად არის!

---

## ✅ შემოწმება (Test)

### როგორ დავრწმუნდეთ რომ იმუშავა?

1. **გახსენი Telegram:**
   - მოძებნე შენი ბოტი
   - დააჭირე "Play Now"

2. **გახსენი Console (F12):**
   - Desktop: F12 ან Cmd+Option+I (Mac)
   - Mobile: რთულია, გამოიყენე desktop

3. **სცადე ყიდვა:**
   - Shop → აირჩიე სკინი → "Buy with TON"
   - დაადასტურე TonKeeper-ში

4. **ნახე Console ლოგები:**
   ```
   ✅ [PaymentService] Backend URL: ...
   ✅ [PaymentService] Starting payment process: ...
   ✅ [PaymentService] Transaction result: true
   ✅ [PaymentService] Testnet mode - auto-approving transaction
   ```

5. **შედეგი:**
   - სკინი უნდა გაიხსნას მომენტალურად ✅
   - "Equipped" ღილაკი გამოჩნდება ✅

---

## ❌ თუ რამე ვერ იმუშავა

### პრობლემა 1: ცვლადები არ ჩანს

**გადაწყვეტა:**
- დარწმუნდი რომ "Production" მონიშნე
- გადაფორმდეს გვერდი (Refresh)

### პრობლემა 2: Redeploy არ მუშაობს

**გადაწყვეტა:**
- სცადე ხელიდან: Deployments → ⋮ → Redeploy
- ან გააკეთე ახალი დეპლოი: `vercel deploy --prod`

### პრობლემა 3: მაინც ვერ ყიდულობს

**შეამოწმე:**

1. **Console ლოგები:**
   - რას წერს? (მომაწოდე ტექსტი)

2. **TonKeeper რეჟიმი:**
   - Testnet-ზეა? (ზემოთ უნდა ეწეროს "Testnet")

3. **ბალანსი:**
   - გაქვს > 0.15 TON?

4. **Vercel-ში ცვლადები:**
   - სწორად არის ჩაწერილი?
   - Production-ია მონიშნული?

---

## 🎯 სწრაფი ჩექლისტი

- [ ] 1. გავხსენი Vercel Dashboard
- [ ] 2. ავირჩიე პროექტი
- [ ] 3. გადავედი Settings-ში
- [ ] 4. დავამატე `VITE_TON_TREASURY_ADDRESS`
- [ ] 5. დავამატე `VITE_TON_NETWORK`
- [ ] 6. ორივეს მონიშნე "Production"
- [ ] 7. გავაკეთე Redeploy
- [ ] 8. დაველოდე 2-3 წუთს
- [ ] 9. დავტესტე Telegram-ში

---

## 💡 რატომ არის ეს საჭირო?

**ამის გარეშე:**
- კოდი ვერ ხვდება რომელი საფულე უნდა გამოიყენოს
- ტრანზაქცია ვერ სრულდება
- წერს "Transaction failed"

**ამის შემდეგ:**
- კოდი ხედავს testnet რეჟიმია
- ავტომატურად ამტკიცებს ტრანზაქციას
- სკინი იხსნება მომენტალურად ✅

---

## 🔗 სასარგებლო ბმულები

- **Vercel Dashboard:** https://vercel.com/dashboard
- **შენი პროექტი:** https://vercel.com/home (იპოვე შენი პროექტი)
- **Testnet Explorer:** https://testnet.tonscan.org

---

## 🇬🇪 ქართულად რომ ვთქვათ:

**ყველაფერი მარტივია:**

1. მიდი Vercel-ში
2. დაამატე 2 ცვლადი
3. გააკეთე Redeploy
4. სცადე ყიდვა - უნდა იმუშაოს!

**თუ ვერ იმუშავა** - მომწერე კონსოლის ლოგები და მე მივხედავ! 💪

---

## ✨ წარმატება!

ახლა ყველაფერი უნდა მუშაობდეს! 🚀🐍💎

**დამატებითი ინფორმაცია:** [`ENV_VARIABLES_COMPLETE.md`](file:///home/xeiron/Documents/snakeonton/ENV_VARIABLES_COMPLETE.md)
