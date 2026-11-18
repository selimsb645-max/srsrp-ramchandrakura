import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// ৫নং রামচন্দ্রকুড়া ইউনিয়ন শাখা — ১৮-১১-২০২৬ অনুমোদিত কমিটি।
// তালিকাটা মালিক নিজে দিয়েছেন, তাই এটা যাচাইকৃত (verified) এবং প্রকাশিত (published)।
const raw = process.env.FIREBASE_SA_JSON;
if (!raw) {
  console.error('Missing FIREBASE_SA_JSON');
  process.exit(1);
}

initializeApp({ credential: cert(JSON.parse(raw)) });
const db = getFirestore();

const OWNER_UID = process.env.OWNER_UID || 'r9hT5qFAF4OZr33X1GVnU7j9PK92';
const TERM = '৬ মাস · অনুমোদন ১৮-১১-২০২৬';

/** [নাম, পদবি (বাংলা), role type] — ক্রম মালিকের দেওয়া তালিকা অনুযায়ী। */
const PEOPLE = [
  ['মো: নাঈম সরকার', 'সভাপতি', 'president'],
  ['মো: মমিনুল ইসলাম', 'সহ-সভাপতি', 'vice_president'],
  ['মো: আলমগীর কবির', 'সহ-সভাপতি', 'vice_president'],
  ['মো: হোসাইন আলী', 'সহ-সভাপতি', 'vice_president'],
  ['মো: খোরশেদ আলম', 'সহ-সভাপতি', 'vice_president'],
  ['মো: সোহেল রানা', 'সহ-সভাপতি', 'vice_president'],
  ['মো: জাহিদ হাসান', 'সাধারণ সম্পাদক', 'general_secretary'],
  ['রেডোয়ান ইসলাম সিফাত', 'যুগ্ম সাধারণ সম্পাদক', 'joint_secretary'],
  ['সোহেল রানা', 'যুগ্ম সাধারণ সম্পাদক', 'joint_secretary'],
  ['মো: রাসেল মিয়া', 'যুগ্ম সাধারণ সম্পাদক', 'joint_secretary'],
  ['মো: আশিক মিয়া', 'যুগ্ম সাধারণ সম্পাদক', 'joint_secretary'],
  ['মো: সেলিম', 'সাংগঠনিক সম্পাদক', 'organizing_secretary'],
  ['মেহেদী হাসান', 'সাংগঠনিক সম্পাদক', 'organizing_secretary'],
  ['মোহাম্মদ সুজন', 'সাংগঠনিক সম্পাদক', 'organizing_secretary'],
  ['মারুফ হাসান', 'অর্থ বিষয়ক সম্পাদক', 'treasurer'],
  ['ইজয় চিরান', 'দপ্তর সম্পাদক', 'office_secretary'],
  ['আবু সুফিয়ান', 'উপ দপ্তর সম্পাদক', 'office_secretary'],
  ['শাহিন মিয়া', 'প্রচার সম্পাদক', 'publicity_secretary'],
  ['আজিজুল ইসলাম', 'উপ প্রচার সম্পাদক', 'publicity_secretary'],
  ['মো: সাজ্জাদ হোসাইন', 'আইন বিষয়ক সম্পাদক', 'secretary'],
  ['ফাহাদ হাসান', 'তথ্য প্রযুক্তি ও গবেষণা বিষয়ক সম্পাদক', 'secretary'],
  ['মো: নাজমুল ইসলাম', 'উপ তথ্য প্রযুক্তি ও গবেষণা বিষয়ক সম্পাদক', 'secretary'],
  ['মো: লিমন মিয়া', 'গ্রন্থনা ও প্রকাশনা সম্পাদক', 'secretary'],
  ['মো: মাসুদ রানা', 'ক্রীড়া সম্পাদক', 'secretary'],
  ['শাকিল আহাম্মেদ', 'সাংস্কৃতিক সম্পাদক', 'secretary'],
  ['সেলিম মিয়া', 'মুক্তিযুদ্ধ বিষয়ক সম্পাদক', 'secretary'],
  ['রিয়াজ আলী', 'ধর্ম বিষয়ক সম্পাদক', 'secretary'],
  ['মো: রিফাত', 'বিজ্ঞান চারু ও কারুকলা সম্পাদক', 'secretary'],
  ['রিপন মিয়া', 'পরিবেশ ও স্বাস্থ্য বিষয়ক সম্পাদক', 'secretary'],
  ['ইমরান', 'ছাত্র বিষয়ক সম্পাদক', 'secretary'],
  ['শরিফুল ইসলাম শরিফ', 'সদস্য', 'member'],
  ['সামিদুল ইসলাম', 'সদস্য', 'member'],
  ['সাইফুল ইসলাম', 'সদস্য', 'member'],
  ['মো: হামিদুল ইসলাম', 'সদস্য', 'member'],
];

async function run() {
  const col = db.collection('committees');
  const snap = await col.get();
  const existing = new Map();
  snap.docs.forEach((doc) => {
    const data = doc.data();
    existing.set(`${data.nameBn}|${data.roleTitleBn}`, doc.id);
  });
  console.log(`existing rows: ${snap.size}`);

  const now = new Date().toISOString();
  let created = 0;
  let updated = 0;

  for (let i = 0; i < PEOPLE.length; i += 1) {
    const [nameBn, roleTitleBn, role] = PEOPLE[i];
    const payload = {
      nameBn,
      role,
      roleTitleBn,
      order: i + 1,
      termBn: TERM,
      published: true,
      verification: 'verified',
      updatedAt: now,
    };
    const key = `${nameBn}|${roleTitleBn}`;
    const id = existing.get(key);
    if (id) {
      await col.doc(id).set(payload, { merge: true });
      updated += 1;
    } else {
      await col.add({ ...payload, createdAt: now, createdBy: OWNER_UID });
      created += 1;
    }
  }

  const after = await col.get();
  const verified = after.docs.filter((d) => d.data().verification === 'verified' && d.data().published === true).length;
  console.log(`created ${created}, updated ${updated}, total ${after.size}, verified+published ${verified}`);
}

run().catch((error) => {
  console.error('seed failed:', error.message);
  process.exit(1);
});
