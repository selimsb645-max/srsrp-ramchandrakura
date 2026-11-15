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
    officialFacebook: 'https://www.facebook.com/sheikhrusseljskparishad',
    branchFacebook: '',
  },
  brand: {
    logo: '/brand/logo-official.jpg',
    logoAltBn: 'শেখ রাসেল জাতীয় শিশু-কিশোর পরিষদ — অফিসিয়াল লোগো',
    logoAltEn: 'Sheikh Russel Jatiya Shishu-Kishore Parishad — official logo',
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
