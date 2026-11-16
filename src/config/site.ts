/**
 * Central site configuration.
 *
 * ⚠️ PLACEHOLDER POLICY
 * Anything wrapped in «…» is an unverified placeholder. Replace it with verified
 * information before the site is published. Nothing here may be invented.
 */

export const site = {
  organization: {
    nameBn: 'শেখ রাসেল জাতীয় শিশু-কিশোর পরিষদ',
    nameEn: 'Sheikh Russel Jatiya Shishu-Kishore Parishad',
    shortBn: 'শেখ রাসেল পরিষদ',
    branchBn: '৫নং রামচন্দ্রকুড়া ইউনিয়ন শাখা',
    branchEn: 'Ramchandrakura Union Branch (No. 5)',
    parentBn: 'নালিতাবাড়ী উপজেলা, শেরপুর, ময়মনসিংহ',
    parentEn: 'Nalitabari Upazila, Sherpur, Mymensingh',
    foundedBn: 'প্রতিষ্ঠা: ২০ ফেব্রুয়ারি ১৯৮৯',
    foundedEn: 'Founded: 20 February 1989',
    /** Lines taken verbatim from the branch's official letterhead (press release). */
    taglineBn: 'মহান মুক্তিযুদ্ধের চেতনায় গড়ে উঠুক আগামী প্রজন্ম',
    taglineEn: 'May the next generation grow in the spirit of the Liberation War',
    approvedByBn: 'বঙ্গবন্ধু মেমোরিয়াল ট্রাস্ট কর্তৃক অনুমোদিত',
    approvedByEn: 'Approved by Bangabandhu Memorial Trust',
    natureBn: 'সামাজিক, সাংস্কৃতিক ও ক্রীড়া সংগঠন',
    natureEn: 'A social, cultural and sports organisation',
  },
  /** Replace every «…» before launch. */
  contact: {
    addressBn: '«ঠিকানা যাচাই বাকি — ইউনিয়ন পরিষদ এলাকা, রামচন্দ্রকুড়া, নালিতাবাড়ী, শেরপুর»',
    addressEn: '«Address pending verification — Ramchandrakura, Nalitabari, Sherpur»',
    phone: '«ফোন নম্বর যাচাই বাকি»',
    email: '«ইমেইল যাচাই বাকি»',
    officeHoursBn: '«অফিস সময় যাচাই বাকি»',
  },
  links: {
    /** The branch's own page — every "follow us" link points here. */
    branchFacebook: 'https://www.facebook.com/profile.php?id=61595768916356',
    /** National council page, kept for the parent-body references. */
    officialFacebook: 'https://www.facebook.com/sheikhrusseljskparishad',
  },
  brand: {
    // BASE_URL keeps the logo working under GitHub Pages' /<repo>/ path
    // Official emblem of this branch (৫নং রামচন্দ্রকুড়া ইউনিয়ন শাখা)
    logo: `${import.meta.env.BASE_URL}brand/logo-union.png`,
    logoAltBn: 'শেখ রাসেল জাতীয় শিশু-কিশোর পরিষদ — অফিসিয়াল লোগো',
    logoAltEn: 'Sheikh Russel Jatiya Shishu-Kishore Parishad — official logo',
  },
  /**
   * সদস্যপদ ও আইডি কার্ডের নিয়মাবলি।
   * কার্ডের মেয়াদ শেষের তারিখ = ইস্যুর তারিখ + cardTermYears।
   * কমিটি আলাদা তারিখ দিলে (users/{uid}.cardExpiresAt) সেটাই দেখানো হয়।
   */
  membership: {
    /** কার্ড কত বছরের জন্য বৈধ — কমিটি অন্য মেয়াদ বললে শুধু এই সংখ্যা বদলাতে হবে। */
    cardTermYears: 2,
  },
  /** Feature flags keep unfinished phases switched off instead of faking data. */
  features: {
    memberRegistration: true,
    eventRegistration: false,
    galleryUpload: false,
  },
} as const;

export type NavKey =
  | 'home'
  | 'about'
  | 'committee'
  | 'members'
  | 'activities'
  | 'events'
  | 'notices'
  | 'gallery'
  | 'contact';

export const publicNav: { key: NavKey; to: string }[] = [
  { key: 'home', to: '/' },
  { key: 'about', to: '/about' },
  { key: 'committee', to: '/committee' },
  { key: 'members', to: '/members' },
  { key: 'activities', to: '/activities' },
  { key: 'events', to: '/events' },
  { key: 'notices', to: '/notices' },
  { key: 'gallery', to: '/gallery' },
  { key: 'contact', to: '/contact' },
];
