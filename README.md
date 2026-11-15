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

## ২. Firebase সেটআপ (একবারের কাজ, Spark/ফ্রি প্ল্যানেই যথেষ্ট)

1. [Firebase Console](https://console.firebase.google.com) → **Add project**।
2. **Build → Authentication → Sign-in method → Email/Password** চালু করুন।
3. **Build → Firestore Database → Create database** (Production mode)।
4. **Project settings → Your apps → Web app** যোগ করে কনফিগ কপি করুন → `.env`:

```env
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
```

5. **Authentication → Settings → Authorized domains**-এ আপনার সাইটের ডোমেইন
   (যেমন `selimsb645-max.github.io`) যোগ করুন, নাহলে লগইন কাজ করবে না।
6. সিকিউরিটি রুলস প্রকাশ করুন:

```bash
npm i -g firebase-tools
firebase login
firebase use --add
firebase deploy --only firestore:rules,firestore:indexes
```

> ⚠️ Firebase Admin SDK-এর service-account JSON বা প্রাইভেট কী কখনো ফ্রন্টএন্ডে বা
> `VITE_` ভেরিয়েবলে রাখবেন না — `VITE_` দিয়ে শুরু হওয়া সব ভেরিয়েবল ব্রাউজারে যায়।
> `.env` git-এ কমিট হয় না। শুধু `scripts/grant-role.mjs` (লোকাল, git-ignored) Admin SDK ব্যবহার করে।

### ২.১ ফ্রি (Spark) প্ল্যানে কী কী চলে

| বৈশিষ্ট্য | Spark | এই প্রজেক্ট |
|---|---|---|
| Auth (email/password, reset, persistence) | ✔ | ব্যবহৃত |
| Cloud Firestore + Security Rules | ✔ | ব্যবহৃত |
| Cloud Functions / Storage upload | ✖ (Blaze) | ব্যবহার করা হয়নি |
| ছবি | — | URL দিয়ে যোগ (Drive/Imgur লিংক) |

## ৩. ভূমিকা ও অ্যাডমিন

| ভূমিকা | ক্ষমতা |
|---|---|
| `member` | নিজের প্রোফাইল ও যোগাযোগ তথ্য |
| `editor` | নোটিশ, ইভেন্ট, কার্যক্রম, গ্যালারি প্রকাশ/সম্পাদনা |
| `admin` | + সদস্য তালিকা, আবেদন অনুমোদন, বার্তা, অডিট লগ |
| `super_admin` | + ভূমিকা পরিবর্তন, ডিলিট, সেটিংস |

আসল অনুমোদন হয় `firestore.rules`-এ (সার্ভার-সাইড)। UI গার্ড শুধু সুবিধার জন্য।

প্রথম super_admin বানানো: Firebase Console → Firestore → `users` → নিজের ডকুমেন্ট →
`role: "super_admin"` (এবং `status: "active"`), অথবা `node scripts/grant-role.mjs you@example.com super_admin --activate`।
বিস্তারিত: [`docs/SECURITY.md`](docs/SECURITY.md)

### ২.২ নিবন্ধন → অনুমোদন প্রবাহ

1. সদস্য `/register`-এ অ্যাকাউন্ট খোলেন → `users/{uid}` (status `pending`),
   `users/{uid}/private/contact`, আর `membershipApplications`-এ আবেদন তৈরি হয়।
2. admin `/admin/applications`-এ অনুমোদন দেন → অ্যাকাউন্ট `active` + `published` হয়,
   `auditLogs`-এ এন্ট্রি যায়।
3. অনুমোদিত হলে `/portal` খোলে; না হলে `/pending` স্ক্রিন দেখায়।

## ৪. ডেটা মডেল

বিস্তারিত: [`docs/SCHEMA.md`](docs/SCHEMA.md)

| কালেকশন | কাজ | পাবলিক রিড |
|---|---|---|
| `users` | অ্যাকাউন্ট (role, status) | শুধু `published`, ফোন/ইমেইল ছাড়া |
| `users/{uid}/private/contact` | ফোন, ইমেইল, অভিভাবক | না (মালিক + admin) |
| `membershipApplications` | সদস্য আবেদন | না (create পাবলিক) |
| `committees` | কমিটি | শুধু `published` |
| `notices` | নোটিশ | শুধু `published` |
| `events` | কর্মসূচি | শুধু `published` |
| `activities` | কার্যক্রম | শুধু `published` |
| `gallery` | ছবি | শুধু `published` |
| `contactMessages` | যোগাযোগ বার্তা | না (create পাবলিক) |
| `auditLogs` | অডিট ট্রেইল | না, append-only |

> Phase 1-এর নাম বদলেছে: `members` → `users`, `committee` → `committees`,
> `joinRequests` → `membershipApplications`।

## ৫. প্লেসহোল্ডার নীতি (গুরুত্বপূর্ণ)

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

## ৬. GitHub + ডেপ্লয়

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

## ৭. পরবর্তী ধাপ

Phase 2-তে যা হয়ে গেছে: Firebase Auth (নিবন্ধন, লগইন, লগআউট, পাসওয়ার্ড রিসেট, সেশন
persistence), Firestore-এর ৯টি কালেকশন, রোল-ভিত্তিক রুলস, অনুমোদন প্রবাহ, অডিট লগ,
সদস্য প্রোফাইল সম্পাদনা, অ্যাডমিন প্যানেলের সদস্য/আবেদন/অডিট স্ক্রিন।

বাকি কাজ:

1. **অ্যাডমিন CRUD ফর্ম** — নোটিশ/ইভেন্ট/কার্যক্রম এখনো Firestore Console থেকে যোগ করতে হয়
   (`createdBy` ফিল্ডে নিজের uid দিতে হবে, নাহলে রুলস আটকাবে)।
2. **ছবি** — Storage লাগলে Blaze দরকার; Spark-এ থাকতে হলে বাইরের URL ব্যবহার করুন।
3. সদস্যদের ইভেন্ট রেজিস্ট্রেশন ও উপস্থিতি।
4. নোটিশ/প্রতিবেদনের PDF এক্সপোর্ট।
5. ইমেইল ভেরিফিকেশন বাধ্যতামূলক করা (এখন শুধু শুভেচ্ছামূলক)।

---

## ৮. লাইসেন্স ও মালিকানা

কোড: সংগঠনের নিজস্ব ব্যবহারের জন্য। কোনো paid API, paid theme বা paid third-party
সার্ভিস ব্যবহার করা হয়নি — শুধু Firebase free tier (Spark) ও Google Fonts।
