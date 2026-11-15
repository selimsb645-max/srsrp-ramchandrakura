/**
 * Staff-only reads. firestore.rules decide who may read what — the UI checks are
 * convenience only and must never be the sole protection.
 */
import { collection, getDocs, limit, orderBy, query, where } from 'firebase/firestore';
import { db, isFirebaseConfigured } from '@/lib/firebase';
import { COLLECTIONS } from './collections';
import type { Activity, AuditLog, ContactMessage, EventItem, Notice } from '@/types';
import type { ListResult } from './publicData';

async function readAll<T>(name: string, orderField: string, max = 200): Promise<ListResult<T>> {
  if (!isFirebaseConfigured || !db) return { data: [], configured: false, error: null };
  try {
    const snapshot = await getDocs(query(collection(db, name), orderBy(orderField, 'desc'), limit(max)));
    const data = snapshot.docs.map((docSnap) => ({ ...(docSnap.data() as T), id: docSnap.id })) as T[];
    return { data, configured: true, error: null };
  } catch (error) {
    return { data: [], configured: true, error: (error as Error).message };
  }
}

export const adminGetNotices = () => readAll<Notice>(COLLECTIONS.notices, 'date');
export const adminGetActivities = () => readAll<Activity>(COLLECTIONS.activities, 'date');
export const adminGetEvents = () => readAll<EventItem>(COLLECTIONS.events, 'startAt');
export const adminGetMessages = () => readAll<ContactMessage>(COLLECTIONS.contactMessages, 'createdAt');
export const adminGetAuditLogs = () => readAll<AuditLog>(COLLECTIONS.auditLogs, 'createdAt');

/** Unhandled contact messages only (admin inbox). */
export async function adminGetOpenMessages(): Promise<ListResult<ContactMessage>> {
  if (!isFirebaseConfigured || !db) return { data: [], configured: false, error: null };
  try {
    const snapshot = await getDocs(
      query(
        collection(db, COLLECTIONS.contactMessages),
        where('handled', '==', false),
        orderBy('createdAt', 'desc'),
        limit(100),
      ),
    );
    return {
      data: snapshot.docs.map((docSnap) => ({ ...(docSnap.data() as ContactMessage), id: docSnap.id })),
      configured: true,
      error: null,
    };
  } catch (error) {
    return { data: [], configured: true, error: (error as Error).message };
  }
}
