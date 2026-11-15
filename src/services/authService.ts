/**
 * Authentication operations (Firebase Auth) + the account documents created on signup.
 * Every function fails with a readable error when Firebase is not configured yet.
 */
import {
  createUserWithEmailAndPassword,
  sendEmailVerification,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  type User,
} from 'firebase/auth';
import { addDoc, collection, doc, serverTimestamp, setDoc } from 'firebase/firestore';
import { requireAuth, requireDb } from '@/lib/firebase';
import { COLLECTIONS } from './collections';
import type { AccountStatus, Role } from '@/types';

export interface RegisterInput {
  nameBn: string;
  email: string;
  password: string;
  phone: string;
  guardianName?: string;
  dateOfBirth?: string;
  school?: string;
  className?: string;
  ward?: string;
  village?: string;
  motivation?: string;
}

/**
 * Signup always creates a `pending` member account:
 *  - users/{uid}                     role "member", status "pending", not published
 *  - users/{uid}/private/contact     phone / guardian / date of birth (owner + staff only)
 *  - membershipApplications/{id}     the admin approval queue
 *
 * The client can never create an account with a staff role or an active status —
 * firestore.rules rejects that outright.
 */
export async function registerMember(input: RegisterInput): Promise<User> {
  const auth = requireAuth();
  const db = requireDb();

  const credential = await createUserWithEmailAndPassword(auth, input.email.trim(), input.password);
  const { user } = credential;

  await updateProfile(user, { displayName: input.nameBn });

  const profile: Record<string, unknown> = {
    uid: user.uid,
    nameBn: input.nameBn,
    role: 'member' satisfies Role,
    status: 'pending' satisfies AccountStatus,
    published: false,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
  if (input.ward) profile.ward = input.ward;
  if (input.village) profile.village = input.village;
  if (input.school) profile.school = input.school;
  if (input.className) profile.className = input.className;

  await setDoc(doc(db, COLLECTIONS.users, user.uid), profile);

  await setDoc(doc(db, COLLECTIONS.users, user.uid, 'private', 'contact'), {
    phone: input.phone,
    email: input.email.trim(),
    guardianName: input.guardianName ?? '',
    dateOfBirth: input.dateOfBirth ?? '',
    updatedAt: serverTimestamp(),
  });

  await setDoc(doc(db, COLLECTIONS.membershipApplications, user.uid), {
    uid: user.uid,
    fullName: input.nameBn,
    guardianName: input.guardianName ?? '',
    dateOfBirth: input.dateOfBirth ?? '',
    school: input.school ?? '',
    className: input.className ?? '',
    ward: input.ward ?? '',
    village: input.village ?? '',
    phone: input.phone,
    email: input.email.trim(),
    motivation: input.motivation ?? '',
    status: 'pending',
    createdAt: serverTimestamp(),
  });

  // Optional e-mail verification. It never grants access by itself; approval does.
  try {
    await sendEmailVerification(user);
  } catch {
    /* rate limited or SMTP not configured — approval is what matters */
  }

  return user;
}

export async function signInMember(email: string, password: string): Promise<User> {
  const auth = requireAuth();
  const credential = await signInWithEmailAndPassword(auth, email.trim(), password);
  return credential.user;
}

export async function signOutMember(): Promise<void> {
  const auth = requireAuth();
  await signOut(auth);
}

/**
 * Password reset email.
 *
 * আগে আমাদের নিজের ডিজাইন করা ইমেইল পাঠানোর চেষ্টা করে (Base44 ফাংশন, যা Firebase
 * Admin দিয়ে আসল রিসেট লিংক তৈরি করে)। ফাংশনটি না পেলে বা ব্যর্থ হলে Firebase-এর
 * Firebase-এর ডিফল্ট মেইল আর পাঠানো হয় না, কারণ ওতে সংগঠনের নাম বসানো যায় না।
 *
 * বিনামূল্যের পথ: `sendResetEmail` না পারলে (যেমন প্ল্যাটফর্মের ইন্টিগ্রেশন
 * ক্রেডিট শেষ) রিকোয়েস্টটা Firestore-এর `resetRequests`-এ জমা হয়, আর
 * GitHub Actions-এর `reset-mailer` জব কয়েক মিনিটের মধ্যে আসল Firebase লিংক
 * বানিয়ে সংগঠনের Gmail থেকে মেইলটা পাঠায়। কোনো পেইড সার্ভিস লাগে না।
 */
const RESET_ENDPOINT = 'https://solas-5609a435.base44.app/functions/sendResetEmail';
const RESET_QUEUE = 'resetRequests';

/**
 * রিসেট রিকোয়েস্ট কিউতে জমা দেয়; সফল হলে true।
 * ইমেইল ঠিকানাটাই কলাম, তাই সার্ভারে থাকা worker সহজে খুঁজে পায়।
 */
async function queueResetRequest(email: string): Promise<boolean> {
  try {
    const database = requireDb();
    await addDoc(collection(database, RESET_QUEUE), {
      email: email.trim().toLowerCase(),
      status: 'pending',
      createdAt: serverTimestamp(),
      source: 'website',
    });
    return true;
  } catch {
    return false;
  }
}

export async function requestPasswordReset(email: string): Promise<void> {
  const target = email.trim();
  let branded = false;

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 12000);
    try {
      const response = await fetch(RESET_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: target }),
        signal: controller.signal,
      });
      if (response.ok) {
        const data = (await response.json().catch(() => null)) as { ok?: boolean } | null;
        branded = data?.ok === true;
      }
    } finally {
      clearTimeout(timer);
    }
  } catch {
    branded = false;
  }

  if (branded) return;
  if (await queueResetRequest(target)) return;

  // Firebase-এর নিজের ডিফল্ট মেইল আর কখনো পাঠানো হবে না: ওতে "NextAI Vision"
  // লেখা যায় না। দুটো পথই না পারলে সৎভাবে এরর দেখাই।
  throw new Error('RESET_UNAVAILABLE');
}
