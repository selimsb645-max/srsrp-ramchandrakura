পাসওয়ার্ড রিসেট ইমেইল: শেখ রাসেল জাতীয় শিশু-কিশোর পরিষদ

বর্তমান ডিজাইন (সবুজ থিম)
HTML: brand/email/reset-password-email.html
প্রিভিউ: https://selimsb645-max.github.io/srsrp-ramchandrakura/brand/email/reset-password-email.html

আগের নেভি থিমের ভার্সন (রাখা আছে): brand/email/reset-password-email-navy.html
প্রিভিউ: https://selimsb645-max.github.io/srsrp-ramchandrakura/brand/email/reset-password-email-navy.html

অ্যাসেট: brand/email/wave-green.png, hero-lock.png, globe.png (নেভি ভার্সনের: wave.png, lock.png)

ডাইনামিক ভেরিয়েবল
%LINK% — Firebase-এর আসল পাসওয়ার্ড রিসেট লিংক (প্রতি ইউজারের জন্য আলাদা, mode ও oobCode সহ)
%DISPLAY_NAME% — সদস্যের নাম

কোনো ডেমো বা ফেক URL নেই। বাটনের href এবং বাটনের নিচের লিংক, দুটোই %LINK%।

সবুজ ডিজাইনের গঠন
- সবুজ হেডার (#0B9229) + লোগো, ঢেউয়ের নিচের প্রান্ত (#3CC122 লাইন)
- লক, লাল গোলাকার তীর ও সবুজ চাবির ইলাস্ট্রেশন
- শিরোনাম পাসওয়ার্ড রিসেট করুন
- অভিবাদন, বাংলা নির্দেশনা
- নীল বাটন (#145AE6): পাসওয়ার্ড রিসেট করুন | RESET PASSWORD
- হালকা সবুজ নির্দেশনা প্যানেল (#DCF8D5)
- ফুটার ও নিচে সবুজ স্ট্রিপে গ্লোব আইকনসহ সাইটের ঠিকানা

Gmail মোবাইল ও ডেস্কটপ
৬০০px টেবিল লেআউট, ইনলাইন CSS, কোনো স্ক্রিপ্ট বা বাইরের CSS নেই।
৬২০px-এর নিচে কার্ড ও বাটন ফুল-উইথ, ইংরেজি লেবেল লুকিয়ে শুধু বাংলা লেখা থাকে, ফন্ট ও প্যাডিং ছোট হয়।

Firebase-এ ব্যবহার
Firebase-এর নিজের Template editor-এ পুরো HTML বসানো যায় না (লেআউট Firebase-এর নিজের)।
বাংলা লেখার ভার্সন: brand/email/firebase-console-body.txt
পুরো ডিজাইন পাঠাতে হলে Admin SDK দিয়ে রিসেট লিংক তৈরি করে নিজের সেন্ডার দিয়ে পাঠাতে হবে। পেইড সার্ভিস লাগে না।

যাচাই
- ৮৪০px ও ৩৯০px, দুটোতেই রেন্ডার করে দেখা হয়েছে, অনুভূমিক স্ক্রল নেই।
- ছবিগুলো সংগঠনের নিজের ডোমেইন থেকে HTTPS-এ লোড হয়।
