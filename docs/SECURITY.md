# নিরাপত্তা ও ভূমিকা-ভিত্তিক অ্যাক্সেস (RBAC)

## ১. চারটি ভূমিকা

| কাজ | member | editor | admin | super_admin |
|---|---|---|---|---|
| নিজের প্রোফাইল দেখা/বদলানো | ✔ | ✔ | ✔ | ✔ |
| নিজের ব্যক্তিগত তথ্য (ফোন, ইমেইল) | ✔ | ✔ | ✔ | ✔ |
| প্রকাশিত কমিটি/কার্যক্রম পড়া | ✔ | ✔ | ✔ | ✔ |
| অপ্রকাশিত কনটেন্ট পড়া | ✖ | ✔ | ✔ | ✔ |
| নোটিশ/ইভেন্ট/কার্যক্রম/গ্যালারি প্রকাশ | ✖ | ✔ | ✔ | ✔ |
| সদস্য তালিকা ও ব্যক্তিগত তথ্য দেখা | ✖ | ✖ | ✔ | ✔ |
| সদস্য আবেদন অনুমোদন/বাতিল | ✖ | ✖ | ✔ | ✔ |
| সদস্য স্থগিত/সক্রিয় করা | ✖ | ✖ | ✔ | ✔ |
| ভূমিকা বদলানো (role) | ✖ | ✖ | ✖ | ✔ |
| অডিট লগ পড়া | ✖ | ✖ | ✔ | ✔ |
| অডিট লগ বদলানো/মুছা | ✖ | ✖ | ✖ | ✖ (append-only) |
| কিছু মুছে ফেলা | ✖ | ✖ | কনটেন্ট | ✔ |

## ২. অনুমোদন কোথায় কার্যকর হয়

1. **Firestore Security Rules** (`firestore.rules`) — আসল সুরক্ষা। সার্ভারে চলে,
   ক্লায়েন্ট বাইপাস করতে পারে না। ভূমিকা পড়া হয় `users/{uid}.role` থেকে,
   কখনো ক্লায়েন্টের পাঠানো কোনো ফিল্ড থেকে নয়।
2. **Firebase Auth** — লগইন, সেশন, পাসওয়ার্ড রিসেট। Auth ছাড়া কোনো ডেটা পড়া যায় না।
3. **UI গার্ড** (`ProtectedRoute`, `ApprovedMemberRoute`, `StaffRoute`) — শুধু
   ব্যবহারকারীর অভিজ্ঞতার জন্য; নিরাপত্তার ভরসা নয়।

`firestore.rules`-এর শুরুতে `isActive()` আছে: **status = active** না হলে কোনো staff
ক্ষমতাই কাজ করে না। অর্থাৎ স্থগিত অ্যাডমিনও কিছু করতে পারবে না।

## ৩. ব্যক্তিগত তথ্যের সুরক্ষা

* ফোন, ইমেইল, অভিভাবকের নাম, জন্মতারিখ থাকে `users/{uid}/private/contact`-এ।
  শুধু মালিক ও admin পড়তে পারে।
* পাবলিক সদস্য তালিকা `users` থেকে শুধু `published == true` ডকুমেন্ট পড়ে, এবং
  কোডেও ফোন/ইমেইল মুছে ফেলা হয় (দুই স্তরের সুরক্ষা)।
* শিশু-কিশোরদের তথ্য (`isMinor`) কোথাও প্রকাশ্যে দেখানো হয় না।

## ৪. প্রথম super_admin বানানো

রুলস অনুযায়ী ভূমিকা বদলাতে super_admin লাগে — তাই প্রথমজনকে একবার কনসোল/স্ক্রিপ্ট
থেকে বানাতে হয়:

**উপায় ক — Firebase Console:** Firestore → `users` → নিজের ডকুমেন্ট → `role` ঘরে
`super_admin` লিখুন। (একবারের কাজ, কোনো সিক্রেট লাগে না)

**উপায় খ — লোকাল স্ক্রিপ্ট (Admin SDK):**

```bash
npm i -D firebase-admin
# Firebase Console → Project settings → Service accounts → Generate new private key
# ফাইলটি ./serviceAccountKey.json নামে রাখুন (git-ignored)
node scripts/grant-role.mjs you@example.com super_admin --activate
```

`serviceAccountKey.json` কখনো কমিট করবেন না, কোথাও শেয়ার করবেন না, `VITE_` ভেরিয়েবলে
রাখবেন না। স্ক্রিপ্টটি শুধু আপনার কম্পিউটারে চলে, ওয়েবসাইটে যায় না।

## ৫. অডিট ট্রেইল

সংবেদনশীল কাজ (অনুমোদন, বাতিল, ভূমিকা/অবস্থা পরিবর্তন) প্রতিবার `auditLogs`-এ লেখা হয়:
কে (`actorUid`, `actorRole`), কী (`action`), কার ওপর (`targetType`, `targetId`)।

রুলস: `create` শুধু staff, `actorUid` অবশ্যই নিজের uid হতে হবে; `update`/`delete` sempre false।
তাই অডিট লগ পেছন থেকে বদলানো বা মুছে ফেলা সম্ভব নয় — এমনকি super_admin-ও পারবে না।

## ৬. Spark (ফ্রি) প্ল্যান সীমা

| বৈশিষ্ট্য | Spark | এই প্রজেক্টে |
|---|---|---|
| Firebase Auth (email/password + reset) | ✔ ফ্রি | ব্যবহৃত |
| Cloud Firestore + Rules | ✔ ফ্রি | ব্যবহৃত |
| Cloud Functions | ✖ Blaze লাগে | ব্যবহার করা হয়নি |
| Firebase Storage (ছবি আপলোড) | ✖ Blaze লাগে | ব্যবহার করা হয়নি — ছবি URL দিয়ে যোগ করুন (যেমন Google Drive/Imgur লিংক) |
| Custom claims সেট করা | Admin SDK/স্ক্রিপ্ট | শুধু লোকাল স্ক্রিপ্টে, সার্ভারে নয় |

## ৭. রুলস পরীক্ষা করা (ঐচ্ছিক)

```bash
npm i -g firebase-tools
firebase emulators:start --only auth,firestore
```

`firebase.json`-এ ইমুলেটর কনফিগ আছে। ইমুলেটরে কয়েকটি কেস দেখুন:

1. সাইন না করে `users` পড়া → শুধু published, role=member ডকুমেন্ট।
2. member হয়ে অন্য কারো `users/{uid}/private/contact` পড়া → permission denied।
3. member হয়ে নিজের `role` বদলানো → permission denied।
4. editor হয়ে নোটিশ প্রকাশ → অনুমোদিত; `users` পড়া → denied।
