/**
 * Authentication operations (Firebase Auth) + the account documents created on signup.
 * Every function fails with a readable error when Firebase is not configured yet.
 */
import {
  createUserWithEmailAndPassword,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  type User,
} from 'firebase/auth';
import { doc, serverTimestamp, setDoc } from 'firebase/firestore';
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
 * নিজের `sendPasswordResetEmail`-এ ফিরে যায়, তাই রিসেট ফ্লো কখনো ভাঙে না।
 */
const RESET_ENDPOINT = 'https://solas-5609a435.base44.app/functions/sendResetEmail';

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

  const auth = requireAuth();
  await sendPasswordResetEmail(auth, target);
}
