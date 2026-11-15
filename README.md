# শেখ রাসেল জাতীয় শিশু-কিশোর পরিষদ — ৫নং রামচন্দ্রকুড়া ইউনিয়ন শাখা

ওয়েবসাইট: পাবলিক সাইট + সদস্য পোর্টাল + অ্যাডমিন ড্যাশবোর্ড
Stack: **React 18 + TypeScript + Vite + Tailwind CSS + Firebase (Auth + Cloud Firestore)**
ভাষা: বাংলা প্রথম, ইংরেজি ঐচ্ছিক (টগল) — সব টেক্সট `src/i18n/dictionary.ts`-এ।

---

## ১. দ্রুত শুরু

```bash
npm install
cp .env.example .env      # Firebase কনফিগ বসান
npm run dev               # http://localhost:5173
npm run build             # প্রোডাকশন বিল্ড
npm run typecheck         # টাইপ চেক
```

`.env` না থাকলেও সাইট চলবে: সব জায়গায় সৎভাবে “ব্যাকএন্ড সংযোগ বাকি” মেসেজ দেখাবে,
কোনো ভুয়া ডেটা দেখাবে না।

---

## ২. Firebase সেটআপ (একবারের কাজ)

1. [Firebase Console](https://console.firebase.google.com) → **Add project**।
2. **Build → Authentication → Sign-in method → Email/Password** চালু করুন।
3. **Build → Firestore Database → Create database** (Production mode, অঞ্চল: `asia-south1` বা নিকটবর্তী)।
4. **Project settings → Your apps → Web app** যোগ করে `firebaseConfig` কপি করুন এবং
   `.env`-এ বসান:

```env
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
```

5. সিকিউরিটি রুলস প্রকাশ করুন (Firebase CLI):

```bash
npm i -g firebase-tools
firebase login
firebase use --add            # আপনার প্রজেক্ট বাছুন
firebase deploy --only firestore:rules,firestore:indexes
```

> ⚠️ **কখনোই** Firebase Admin SDK-এর service-account JSON বা প্রাইভেট কী ফ্রন্টএন্ডে
> রাখবেন না। `VITE_` দিয়ে শুরু হওয়া সব ভেরিয়েবল ব্রাউজারে প্রকাশ্যে যায়।
> `.env` ফাইল git-এ কমিট হয় না (`.gitignore`-এ আছে)।

---

## ৩. অ্যাডমিন কীভাবে বানাবেন

অ্যাডমিন অনুমতি দুইভাবে দেওয়া যায়:

**ক) Firestore দিয়ে (সহজ):** `members/{uid}` ডকুমেন্টে `role: "admin"` বসান,
যেখানে `{uid}` হলো Firebase Auth ইউজারের UID।

**খ) Custom claim দিয়ে (আরও নিরাপদ, বড় টিমে):** Admin SDK/স্ক্রিপ্ট দিয়ে:

```js
admin.auth().setCustomUserClaims(uid, { admin: true });
```

দুটোই `firestore.rules`-এর `isAdmin()` ফাংশনে যাচাই হয়। UI-এর গার্ড শুধু সুবিধার জন্য;
আসল সুরক্ষা রুলসে।

---

## ৪. ডেটা মডেল

বিস্তারিত: [`docs/SCHEMA.md`](docs/SCHEMA.md)

| কালেকশন | কাজ | পাবলিক রিড |
|---|---|---|
| `committee` | কমিটির পদবি | শুধু `published: true` |
| `members` | সদস্য (ফোন/ইমেইল `private` সাবকালেকশনে) | শুধু `published: true` |
| `activities` | কার্যক্রম | শুধু `published: true` |
| `events` | কর্মসূচি | শুধু `published: true` |
| `notices` | নোটিশ | শুধু `published: true` |
| `gallery` | ছবি | শুধু `published: true` |
| `contactMessages` | যোগাযোগ ফর্ম (পাবলিক তৈরি, অ্যাডমিন পড়ে) | না |
| `joinRequests` | সদস্য আবেদন (পাবলিক তৈরি, অ্যাডমিন পড়ে) | না |

---

## ৫. ফোল্ডার স্ট্রাকচার

```
src/
├── components/
│   ├── layout/        Header, Footer, PublicLayout, PortalLayout
│   ├── shared/        Logo, LanguageToggle, ProtectedRoute, StatGrid, BackendNotice
│   └── ui/            Button, Field, Badge, PageHero, EmptyState, Placeholder …
├── config/site.ts     সংগঠনের নাম, ঠিকানা (প্লেসহোল্ডার), নেভিগেশন, ফিচার ফ্ল্যাগ
├── context/AuthContext.tsx
├── hooks/useAsyncList.ts
├── i18n/              dictionary.ts (bn/en) + provider
├── lib/               firebase.ts, utils.ts
├── pages/
│   ├── public/        Home, About, Committee, Members, Activities, Events, Notices, Gallery, Contact
│   ├── auth/          Login, ForgotPassword
│   ├── member/        Dashboard, Profile
│   └── admin/         AdminScreens.tsx (overview + 6 ম্যানেজমেন্ট স্ক্রিন)
├── services/          publicData, adminData, forms, collections
└── types/             ডোমেইন টাইপ
```

---

## ৬. রুট

| রুট | বিষয় |
|---|---|
| `/` `/about` `/committee` `/members` `/activities` `/events` `/notices` `/gallery` `/contact` | পাবলিক |
| `/login` `/forgot-password` | অথ |
| `/portal` `/portal/profile` | সদস্য পোর্টাল (লগইন লাগে) |
| `/admin` + `/admin/members` `/admin/committee` `/admin/activities` `/admin/notices` `/admin/messages` `/admin/requests` | অ্যাডমিন |

---

## ৭. প্লেসহোল্ডার নীতি (গুরুত্বপূর্ণ)

কোনো সদস্যের নাম, পদবি, নোটিশ, ছবি, ফোন নম্বর বা ইভেন্ট বানানো হয়নি।

- `src/config/site.ts`-এ `«…»` চিহ্নিত সব লেখা **যাচাই বাকি**।
- খালি কালেকশনে UI নিজেই “এখনো যুক্ত করা হয়নি” দেখায়।
- কমিটির পদবি `verification: "pending" | "verified"` ফিল্ডে চিহ্নিত।
- যোগাযোগ ও ঠিকানার তথ্য `${...}` হিসেবে দেখানো হয়, বানানো নয়।

নতুন তথ্য যোগ করার আগে যাচাই করুন; তারপর Firestore Console/অ্যাডমিন থেকে যোগ করুন।

লোগো: `/public/brand/logo-official.jpg` — সংগঠনের অফিসিয়াল ফেসবুক পেজ
(facebook.com/sheikhrusseljskparishad) থেকে নেওয়া প্রোফাইল ছবি। উচ্চ-রেজোলিউশন
আসল ফাইল পেলে একই নামে রিপ্লেস করলেই সাইটে বদলে যাবে।

---

## ৮. GitHub + ডেপ্লয়

```bash
git init
git add .
git commit -m "feat: initial website structure"
git branch -M main
git remote add origin https://github.com/<user>/<repo>.git
git push -u origin main
```

GitHub → **Settings → Pages → Source: GitHub Actions**।
`.github/workflows/deploy.yml` স্বয়ংক্রিয়ভাবে বিল্ড ও ডেপ্লয় করবে।

Firebase কনফিগ GitHub Secrets-এ যোগ করুন (একই নামে): `VITE_FIREBASE_API_KEY`,
`VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_PROJECT_ID`, `VITE_FIREBASE_STORAGE_BUCKET`,
`VITE_FIREBASE_MESSAGING_SENDER_ID`, `VITE_FIREBASE_APP_ID`।

ব্রাঞ্চ স্ট্র্যাটেজি: `main` = প্রোডাকশন, `dev` = কাজ, ফিচার ব্রাঞ্চ → PR → `main`।

---

## ৯. পরবর্তী ধাপ (Phase 2)

1. অ্যাডমিন CRUD ফর্ম (এখন read-only), ছবি আপলোড (Firebase Storage)।
2. সদস্য অনুমোদনের ওয়ার্কফ্লো: `joinRequests` → `members` + Auth ইউজার তৈরি
   (শুধু Cloud Function/Admin SDK দিয়ে সম্ভব, ক্লায়েন্ট থেকে নয়)।
3. সদস্যদের জন্য ইভেন্ট রেজিস্ট্রেশন ও উপস্থিতি।
4. নোটিশ/মাসিক রিপোর্ট PDF এক্সপোর্ট।
5. Firestore query-তে `where('published','==',true)` যোগ করে ব্যান্ডউইথ কমানো
   (ইনডেক্স `firestore.indexes.json`-এ প্রস্তুত)।

---

## ১০. লাইসেন্স ও মালিকানা

কোড: সংগঠনের নিজস্ব ব্যবহারের জন্য। কোনো paid API, paid theme বা paid third-party
সার্ভিস ব্যবহার করা হয়নি — শুধু Firebase free tier (Spark) ও Google Fonts।
