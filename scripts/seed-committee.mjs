import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const raw = process.env.FIREBASE_SA_JSON;
if (!raw) {
  console.error("Missing FIREBASE_SA_JSON secret");
  process.exit(1);
}

initializeApp({ credential: cert(JSON.parse(raw)) });
const db = getFirestore();

// Role mapping
const RM = {
  "সভাপতি": "president",
  "সহ-সভাপতি": "vice_president",
  "সাধারণ সম্পাদক": "general_secretary",
  "যুগ্ম সাধারণ সম্পাদক": "joint_secretary",
  "সাংগঠনিক সম্পাদক": "organizing_secretary",
  "অর্থ বিষয়ক সম্পাদক": "treasurer",
  "দপ্তর সম্পাদক": "office_secretary",
  "উপ দপ্তর সম্পাদক": "office_secretary",
  "প্রচার সম্পাদক": "publicity_secretary",
  "উপ প্রচার সম্পাদক": "publicity_secretary",
  "সদস্য": "member"
};

// Full list from the three page images
const mems = [
  ["মোঃ নাঈম সরকার", "সভাপতি", 1],
  ["মোঃ মমিনুল ইসলাম", "সহ-সভাপতি", 2],
  ["মোঃ আলমগীর কবির", "সহ-সভাপতি", 3],
  ["মোঃ হোসাইন আলী", "সহ-সভাপতি", 4],
  ["মোঃ খোরশেদ আলম", "সহ-সভাপতি", 5],
  ["মোঃ সোহেল রানা", "সহ-সভাপতি", 6],
  
  ["মোঃ জাহিদ হাসান", "সাধারণ সম্পাদক", 7],
  ["রেদোয়ান ইসলাম সিফাত", "যুগ্ম সাধারণ সম্পাদক", 8],
  ["সোহেল রানা", "যুগ্ম সাধারণ সম্পাদক", 9],
  ["মোঃ রাসেল মিয়া", "যুগ্ম সাধারণ সম্পাদক", 10],
  ["মোঃ আশিক মিয়া", "যুগ্ম সাধারণ সম্পাদক", 11],
  
  ["মোঃ সেলিম", "সাংগঠনিক সম্পাদক", 12],
  ["মেহেদী হাসান", "সাংগঠনিক সম্পাদক", 13],
  ["মোহাম্মদ সুজন", "সাংগঠনিক সম্পাদক", 14],
  
  ["মারুফ হাসান", "অর্থ বিষয়ক সম্পাদক", 15],
  ["ইজয় চিরান", "দপ্তর সম্পাদক", 16],
  ["আবু সুফিয়ান", "উপ দপ্তর সম্পাদক", 17],
  ["শাহিন মিয়া", "প্রচার সম্পাদক", 18],
  ["আজিজুল ইসলাম", "উপ প্রচার সম্পাদক", 19],
  ["মোঃ সাজ্জাদ হোসাইন", "আইন বিষয়ক সম্পাদক", 20],
  ["ফাহাদ হাসান", "তথ্য প্রযুক্তি ও গবেষণা বিষয়ক সম্পাদক", 21],
  ["মোঃ নাজমুল ইসলাম", "উপ তথ্য প্রযুক্তি ও গবেষণা বিষয়ক সম্পাদক", 22],
  ["মোঃ লিমন মিয়া", "গ্রন্থনা ও প্রকাশনা সম্পাদক", 23],
  ["মোঃ মাসুদ রানা", "ক্রীড়া সম্পাদক", 24],
  ["শাকিল আহম্মেদ", "সাংস্কৃতিক সম্পাদক", 25],
  ["সেলিম মিয়া", "মুক্তিযুদ্ধ বিষয়ক সম্পাদক", 26],
  
  ["রিয়াজ আলী", "ধর্ম বিষয়ক সম্পাদক", 27],
  ["মোঃ রিফাত", "বিজ্ঞান চারু ও কারুকলা সম্পাদক", 28],
  ["রিপন মিয়া", "পরিবেশ ও স্বাস্থ্য বিষয়ক সম্পাদক", 29],
  ["ইমরান", "ছাত্র বিষয়ক সম্পাদক", 30],
  ["শরিফুল ইসলাম শরিফ", "সদস্য", 31],
  ["সামিদুল ইসলাম", "সদস্য", 32],
  ["সাইফুল ইসলাম", "সদস্য", 33],
  ["মোঃ হামিদুল ইসলাম", "সদস্য", 34]
];

async function run() {
  const col = db.collection('committees');
  
  // কিছুই মুছি না। আগে থেকে যা আছে তার নাম+পদ নিয়ে রাখি, যাতে দ্বিতীয়বার চালালে ডুপ্লিকেট না হয়।
  const snap = await col.get();
  const have = new Set(snap.docs.map(d => `${d.data().nameBn}|${d.data().roleTitleBn}`));
  console.log(`Existing rows kept: ${snap.size}`);
  
  const now = new Date().toISOString();
  let count = 0;
  
  let skipped = 0;
  for (const [name, title, order] of mems) {
    if (have.has(`${name}|${title}`)) { skipped++; continue; }
    await col.add({
      nameBn: name,
      role: RM[title] || "member",
      roleTitleBn: title,
      order: order,
      published: false,
      verification: "pending",  // মানুষ সই করা কাগজের সঙ্গে মিলিয়ে verified করবে
      termBn: "৬ মাস (১৮-১১-২০২৬ থেকে)",
      createdAt: now,
      updatedAt: now,
      createdBy: "seed-from-approval-letter-2026-11-18"
    });
    count++;
  }
  
  console.log(`Seeded ${count} new, skipped ${skipped} duplicates. All are published=false / verification=pending.`);
}

run().catch(console.error);
