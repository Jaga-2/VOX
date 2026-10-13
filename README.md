# 🎙️ VOX — Android-First Finance Voice Assistant

> **"Just say it. VOX does the rest."**

VOX is an Android-first, voice-first personal money-management application. Built with vanilla HTML5, CSS3, and modern modular ES6+ JavaScript, backed by Google Firebase Authentication and Cloud Firestore.

---

## 📱 Live MVP Status & Quick Start

The VOX MVP is running and serving on **`http://localhost:3000`**.

### Quick Run
```bash
# Start local server (zero dependencies)
npm start
# or: node server.js
```
Open **`http://localhost:3000`** in your browser (Google Chrome or Microsoft Edge recommended for native Web Speech Recognition API support).

### Quick Demo Access
- Click **"⚡ Instant Demo Access"** on the login screen or tap the **"⚡ Reset Demo Data"** chip on the top bar.
- Pre-loaded with authentic Indian Rupee (INR ₹) data: ₹30,000 salary income, ₹18,450 available balance, ₹125 wallet cash, ₹8,000 upcoming rent in 5 days, budgets, subscriptions, and pending purchase follow-ups.

---

## 🌟 The 4 Core Innovations

VOX goes beyond standard budgeting apps with four core voice-first innovations:

### 1. 🧥 "Can I Afford It?" (`js/affordability.js`)
- **Philosophy**: *Zero Shaming & Strict Factual Decision Support.* VOX never says "Buy it" or "Don't buy it".
- **Spoken Input**: *"Can I afford a rainy jacket for ₹1,200 this month?"*
- **Output**: Returns factual balance before vs. after (₹18,450 ➔ ₹17,250), flags rent of ₹8,000 due in 5 days, calculates emergency fund delay (~9 days), and presents neutral guidance: *"Here are the numbers to help you decide."*

### 2. 🌙 Daily Spending Log (`ui.js`, `notifications.js`)
- **End-of-day financial review**: Summarizes today's spending by category, highlights largest expense, compares with daily average, and prompts:
  > *"Is there anything you spent today that you haven't logged?"*
- Buttons: **"YES, ADD IT"** (opens voice/quick expense input) and **"NO, I'M DONE"** (confirms log).

### 3. 💵 Cash Reconciliation (`js/reconciliation.js`)
- **Solving the forgotten cash problem**: Compares morning recorded cash (e.g. ₹125) with physical cash counted at night.
- **Spoken Input**: *"I have 100 cash in my hand"*
- **Result**: Detects ₹25 difference, dynamically suggests possible micro-cash items (e.g. ₹10 Water Bottle + ₹15 Chai/Snacks), and dynamically updates the balance upon user confirmation.

### 4. 🎧 "Worth-It" Purchase Memory (`js/worthit.js`)
- **30-Day Purchase Follow-Up**: When a purchase is logged with a review reminder (e.g. *"Spent 800 on headphones. Check back in one month"*).
- **Reflection Prompt**: *"You bought Boat Headphones for ₹800 last month. Are you happy with this purchase?"*
- **Options**: 😊 Very happy, 🙂 Happy, 😐 Neutral, 🙁 Not worth it.
- **Personal Spending Wisdom**: Tracks category-level satisfaction rates to curb impulse buying.

---

## 🔒 Voice Parser & Privacy Rule: "Never Guess Silently"

VOX operates on a deterministic financial parser (`js/parser.js`):
1. **Speak**: User speaks naturally (e.g. *"Spent 450 on groceries using PhonePe"*).
2. **Parse**: Extracts entity, amount (450), category (Groceries), payment method (PhonePe/UPI), timestamp.
3. **Confirm**: Displays an interactive Confirmation Card (**Amount**, **Category**, **Payment Method**, **Original Transcript**).
4. **Save**: Writes to Cloud Firestore under `/users/{uid}/transactions` and updates accounts and budgets.
5. **No Guessing**: If amount or details are ambiguous, VOX asks ONE short question rather than silently corrupting user records.

---

## 🗄️ Firebase Architecture & Security

- **Centralized Configuration**: Isolated in `js/firebaseConfig.js`.
- **Services**:
  - Firebase Authentication (Email/Password + Google Sign-In + Instant Demo Session).
  - Cloud Firestore with user UID isolation.
- **Firestore Schema**:
  ```
  /users/{uid}
    ├── profile/
    ├── accounts/
    ├── transactions/
    ├── bills/
    ├── subscriptions/
    ├── budgets/
    ├── goals/
    ├── cashReconciliations/
    ├── worthItItems/
    └── dailyLogs/
  ```
- **Security Rules (`firestore.rules`)**:
  ```javascript
  rules_version = '2';
  service cloud.firestore {
    match /databases/{database}/documents {
      match /users/{userId}/{document=**} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
    }
  }
  ```

---

## 📱 Navigation & Screens

1. **HOME**: Net worth, liquid available balance, daily Safe-to-Spend banner, upcoming bills preview, budget status, recent transactions, VOX insight.
2. **MONEY**: Cash vs digital balance, accounts breakdown (Cash, Bank, UPI, Savings), full transaction history with filter & manual fallback.
3. **VOICE (Elevated Center Orb)**: Large multi-state animated voice orb (Idle, Listening, Processing, Understanding, Saved), live transcript, and speech synthesis responses.
4. **PLAN**: Monthly budgets with 80% and 100% warning badges, recurring bills with "Mark Paid", subscriptions intelligence, savings goal progress.
5. **GROW**: Financial education cards (Emergency Fund, 50/30/20 Rule, Debt Avalanche) and an interactive **Compound Growth Simulator**.

---

## 🧪 Automated Test Suite

A complete test suite is included in `test/run-tests.mjs`.

Run anytime via:
```bash
node test/run-tests.mjs
```

### Test Coverage (32/32 Passed):
- ✅ Deterministic regex parsing for expenses, income, payment methods, and merchants.
- ✅ Cash reconciliation difference calculations and combo suggestions.
- ✅ Factual affordability analysis and neutral guidance verification.
- ✅ Safe-to-spend formula and budget threshold updates.
- ✅ Conversational financial query classification.
- ✅ 30-day worth-it review detection and satisfaction statistics.

---

## 🔮 Future Android-Native Migration Plan

When transitioning this web MVP into a native Android app:
1. **UI Layer**: Jetpack Compose using Material 3 Dark theme and animated Canvas for the glowing Voice Orb.
2. **Voice Engine**: Android `SpeechRecognizer` API with offline speech models (Vosk or on-device Whisper) + Google Cloud Speech fallback.
3. **Background Voice Trigger**: Android Foreground Voice Service / Quick Settings Tile / Assistant App Action (`"Hey VOX"` hotword).
4. **Local Database**: Android Room DB with SQLCipher for zero-trust offline storage, synced via Firebase Android SDK.
5. **SMS / UPI Notification Listener**: Android `NotificationListenerService` to automatically detect incoming UPI debit alerts (PhonePe, GPay, Paytm) and queue them for voice confirmation.
