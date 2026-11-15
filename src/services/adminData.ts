/**
 * Admin-only reads. Firestore Security Rules (firestore.rules) decide who may read
 * unpublished records and personal data — the UI must never rely on its own checks.
 */
import { collection, getDocs, limit, orderBy, query } from 'firebase/firestore';
import { db, isFirebaseConfigured } from '@/lib/firebase';
import { COLLECTIONS } from './collections';
import type { Activity, ContactMessage, JoinRequest, Member, Notice } from '@/types';
import type { ListResult } from './publicData';

async function readAll<T>(name: string, orderField: string, max = 200): Promise<ListResult<T>> {
  if (!isFirebaseConfigured || !db) return { data: [], configured: false, error: null };
  try {
    const snapshot = await getDocs(query(collection(db, name), orderBy(orderField, 'desc'), limit(max)));
    const data = snapshot.docs.map((doc) => ({ ...(doc.data() as T), id: doc.id })) as T[];
    return { data, configured: true, error: null };
  } catch (error) {
    return { data: [], configured: true, error: (error as Error).message };
  }
}

export const adminGetMembers = () => readAll<Member>(COLLECTIONS.members, 'nameBn');
export const adminGetNotices = () => readAll<Notice>(COLLECTIONS.notices, 'date');
export const adminGetActivities = () => readAll<Activity>(COLLECTIONS.activities, 'date');
export const adminGetMessages = () => readAll<ContactMessage>(COLLECTIONS.messages, 'createdAt');
export const adminGetRequests = () => readAll<JoinRequest>(COLLECTIONS.joinRequests, 'createdAt');
