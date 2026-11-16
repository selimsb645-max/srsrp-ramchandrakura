/**
 * Authentication operations (Firebase Auth) + the account documents created on signup.
 * Every function fails with a readable error when Firebase is not configured yet.
 */
import {
  createUserWithEmailAndPassword,
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
  facebookUrl?: string;
  nidNumber?: string;
  documents?: { label: string; name: string; key: string; type: string; size: number }[];
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
    facebookUrl: input.facebookUrl ?? '',
    nidNumber: input.nidNumber ?? '',
    documents: input.documents ?? [],
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
    facebookUrl: input.facebookUrl ?? '',
    nidNumber: input.nidNumber ?? '',
    documents: input.documents ?? [],
    status: 'pending',
    createdAt: serverTimestamp(),
  });

  // Receipt mail, sent by the organisation's own mailer (Cloudflare Worker + Gmail SMTP).
  // Firebase's built-in verification mail is deliberately NOT used: its template cannot be
  // changed and it goes out as "NextAI Vision", which confused members. The worker mints the
  // real Firebase verification link and wraps it in the green branded template, so the member
  // gets one honest mail: "your application arrived, the committee will review it".
  try {
    await fetch(`${RESET_WORKER}/signup`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email: input.email.trim().toLowerCase(), name: input.nameBn }),
    });
  } catch {
    /* the application is already saved; the receipt mail is a courtesy, never a blocker */
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
 * Password reset email — সবুজ ডিজাইন, আসল Firebase লিংক।
 *
 * তিনটি ধাপ, ক্রমে চেষ্টা করা হয়:
 *  ১. Base44 ফাংশন `sendResetEmail` — সংগঠনের ডিজাইনেই সাথে সাথে মেইল যায়।
 *     প্ল্যাটফর্মের ইন্টিগ্রেশন ক্রেডিট শেষ থাকলে এটি ৪০২ দেয়।
 *  ২. Cloudflare Worker — কোনো সার্ভার-সাইড আইডি ছাড়াই সাথে সাথে একই মেইল পাঠায়।
 *  ৩. Firestore `resetRequests` কিউ — GitHub Actions কয়েক মিনিটের মধ্যে পাঠায়।
 *
 * Firebase-এর নিজের ডিফল্ট মেইল আর কখনো পাঠানো হয় না: ওতে "NextAI Vision"
 * লেখা বদলানো যায় না, তাই সদস্যরা ভুল নাম দেখত।
 */
const RESET_ENDPOINT = 'https://solas-5609a435.base44.app/functions/sendResetEmail';
const RESET_WORKER = 'https://srsrp-reset-mailer.selimsb645.workers.dev';
const RESET_QUEUE = 'resetRequests';

async function postJson(url: string, payload: unknown, timeoutMs: number): Promise<{ ok?: boolean; code?: string } | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
    const data = (await response.json().catch(() => null)) as { ok?: boolean; code?: string } | null;
    if (!response.ok) return data ?? null;
    return data;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * রিসেট রিকোয়েস্ট কিউতে জমা দেয়; সফল হলে true।
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

  // ১. Base44 ফাংশন (ক্রেডিট থাকলে সবচেয়ে দ্রুত)
  const viaFunction = await postJson(RESET_ENDPOINT, { email: target }, 12000);
  if (viaFunction?.ok === true) return;

  // ২. Cloudflare Worker (তাৎক্ষণিক, প্ল্যাটফর্ম ক্রেডিট লাগে না)
  const viaWorker = await postJson(RESET_WORKER, { email: target }, 25000);
  if (viaWorker?.ok === true) return;
  // Firebase নিজেই একই ইমেইলে বারবার রিসেট আটকে দেয় — তখন সৎভাবে জানাই
  if (viaWorker?.code === 'LIMIT') throw new Error('RESET_LIMIT');

  // ৩. কিউ — GitHub Actions কয়েক মিনিটের মধ্যে পাঠাবে
  if (await queueResetRequest(target)) return;

  throw new Error('RESET_UNAVAILABLE');
}
