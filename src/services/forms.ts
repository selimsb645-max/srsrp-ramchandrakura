/** Write helpers used by public forms and the member portal. */
import { addDoc, collection, doc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { requireDb } from '@/lib/firebase';
import { COLLECTIONS } from './collections';
import type { ContactMessage, JoinRequest } from '@/types';

export async function submitContactMessage(input: Omit<ContactMessage, 'id' | 'createdAt' | 'handled'>) {
  const firestore = requireDb();
  await addDoc(collection(firestore, COLLECTIONS.messages), {
    ...input,
    handled: false,
    createdAt: serverTimestamp(),
  });
}

export async function submitJoinRequest(input: Omit<JoinRequest, 'id' | 'createdAt' | 'status'>) {
  const firestore = requireDb();
  await addDoc(collection(firestore, COLLECTIONS.joinRequests), {
    ...input,
    status: 'pending',
    createdAt: serverTimestamp(),
  });
}

export async function updateMyProfile(uid: string, memberDocId: string, patch: Record<string, unknown>) {
  const firestore = requireDb();
  await updateDoc(doc(firestore, COLLECTIONS.members, memberDocId), {
    ...patch,
    uid,
    updatedAt: serverTimestamp(),
  });
}
