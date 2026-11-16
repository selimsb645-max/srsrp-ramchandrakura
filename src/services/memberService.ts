/**
 * সদস্য-পোর্টালের নিজস্ব কাজ: আরএসভিপি, উপস্থিতি, ছবি, পাসওয়ার্ড আর ডিরেক্টরি।
 *
 * এখানে আলাদা কোনো Firestore কালেকশন নেই — RSVP ও উপস্থিতি সদস্যের নিজের
 * `users/{uid}` ডকুমেন্টেই `rsvps` / `attendance` ম্যাপ হিসেবে থাকে। firestore.rules
 * অনুযায়ী সদস্য নিজের প্রোফাইলে role/status/published/memberCode ছাড়া অন্য ফিল্ড
 * লিখতে পারে, আর কমিটি (admin) অন্য সদস্যের ডকুমেন্টও লিখতে পারে। তাই নতুন নিয়ম
 * ছাড়াই দুটোই নিরাপদে চলে, আর কে কোন কর্মসূচিতে এসেছে তা কমিটি দেখতে পায়।
 */
import {
  EmailAuthProvider,
  reauthenticateWithCredential,
  updatePassword,
} from 'firebase/auth';
import { collection, deleteField, doc, getDocs, limit, query, serverTimestamp, updateDoc, where } from 'firebase/firestore';
import { requireAuth, requireDb } from '@/lib/firebase';
import { COLLECTIONS } from './collections';
import type { ListResult } from './publicData';
import type { AttendanceStamp, RsvpStatus, UserProfile } from '@/types';

/** নিজের আরএসভিপি সংরক্ষণ (বা বদল)। `eventId` Firestore আইডি, তাই ডট-পাথে নিরাপদ। */
export async function setMyRsvp(uid: string, eventId: string, status: RsvpStatus): Promise<void> {
  const firestore = requireDb();
  await updateDoc(doc(firestore, COLLECTIONS.users, uid), {
    [`rsvps.${eventId}`]: status,
    updatedAt: serverTimestamp(),
  });
}

/** আরএসভিপি তুলে নেওয়া। */
export async function clearMyRsvp(uid: string, eventId: string): Promise<void> {
  const firestore = requireDb();
  await updateDoc(doc(firestore, COLLECTIONS.users, uid), {
    [`rsvps.${eventId}`]: deleteField(),
    updatedAt: serverTimestamp(),
  });
}

/** নিজে উপস্থিতি নিশ্চিত করা (কর্মসূচির সময়ের জানালার ভেতরে)। */
export async function checkInToEvent(uid: string, eventId: string): Promise<void> {
  const firestore = requireDb();
  const stamp: AttendanceStamp = { at: new Date().toISOString(), method: 'self' };
  await updateDoc(doc(firestore, COLLECTIONS.users, uid), {
    [`attendance.${eventId}`]: stamp,
    updatedAt: serverTimestamp(),
  });
}

/** কমিটির পক্ষ থেকে উপস্থিতি লিখে দেওয়া (বা তুলে নেওয়া)। */
export async function setAttendance(
  targetUid: string,
  eventId: string,
  present: boolean,
  actorUid: string,
): Promise<void> {
  const firestore = requireDb();
  if (!present) {
    await updateDoc(doc(firestore, COLLECTIONS.users, targetUid), {
      [`attendance.${eventId}`]: deleteField(),
      updatedAt: serverTimestamp(),
    });
    return;
  }
  const stamp: AttendanceStamp = { at: new Date().toISOString(), method: 'admin', by: actorUid };
  await updateDoc(doc(firestore, COLLECTIONS.users, targetUid), {
    [`attendance.${eventId}`]: stamp,
    updatedAt: serverTimestamp(),
  });
}

/** নিজের ছবি বদলানো (আপলোড হওয়া URL সেভ করা হয়)। */
export async function updateOwnPhoto(uid: string, photoUrl: string): Promise<void> {
  const firestore = requireDb();
  await updateDoc(doc(firestore, COLLECTIONS.users, uid), { photoUrl, updatedAt: serverTimestamp() });
}

/** পাসওয়ার্ড বদলানো — Firebase নিরাপত্তার জন্য আগে বর্তমান পাসওয়ার্ড দিয়ে পুনরায় লগইন দরকার। */
export async function changeMyPassword(currentPassword: string, newPassword: string): Promise<void> {
  const auth = requireAuth();
  const user = auth.currentUser;
  if (!user?.email) throw new Error('NO_EMAIL');
  if (newPassword.length < 6) throw new Error('WEAK_PASSWORD');
  const credential = EmailAuthProvider.credential(user.email, currentPassword);
  await reauthenticateWithCredential(user, credential);
  await updatePassword(user, newPassword);
}

/**
 * সদস্য ডিরেক্টরি — শুধু প্রকাশিত (published) সদস্য অ্যাকাউন্ট, কোনো ফোন/ইমেইল নয়।
 * where('published') আর orderBy একসাথে দিলে composite index লাগে, তাই সাজানো হয়
 * ব্রাউজারে (প্রজেক্টে কোনো composite index নেই)।
 */
export async function listDirectoryMembers(): Promise<ListResult<UserProfile>> {
  try {
    const firestore = requireDb();
    const snapshot = await getDocs(
      query(
        collection(firestore, COLLECTIONS.users),
        where('published', '==', true),
        where('role', '==', 'member'),
        limit(500),
      ),
    );
    const data = snapshot.docs
      .map((docSnap) => {
        const raw = docSnap.data() as UserProfile;
        return {
          id: docSnap.id,
          uid: docSnap.id,
          nameBn: raw.nameBn ?? '',
          nameEn: raw.nameEn,
          memberCode: raw.memberCode,
          ward: raw.ward,
          village: raw.village,
          school: raw.school,
          className: raw.className,
          photoUrl: raw.photoUrl,
          role: raw.role,
          status: raw.status,
        } as UserProfile;
      })
      .filter((member) => member.role === 'member' && member.status === 'active')
      .sort((a, b) => (a.memberCode ?? '').localeCompare(b.memberCode ?? '', 'bn') || a.nameBn.localeCompare(b.nameBn, 'bn'));
    return { data, configured: true, error: null };
  } catch (error) {
    return { data: [], configured: true, error: (error as Error).message };
  }
}
