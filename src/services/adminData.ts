/**
 * Staff-only reads and small staff-only writes. firestore.rules decide who may read
 * or write what — the UI checks are convenience only and must never be the sole
 * protection.
 */
import { collection, deleteDoc, doc, getDocs, limit, orderBy, query, updateDoc, where } from 'firebase/firestore';
import { db, isFirebaseConfigured, requireDb } from '@/lib/firebase';
import { COLLECTIONS } from './collections';
import { logAudit } from './auditService';
import type { Activity, AuditLog, CommitteeMember, ContactMessage, EventItem, GalleryItem, Notice, Role } from '@/types';
import type { ListResult } from './publicData';

/** Firestore Timestamp (or a plain string) → ISO string the date formatter understands. */
function toIsoString(value: unknown): string | null {
  if (!value) return null;
  if (typeof value === 'string') return value;
  const maybe = value as { toDate?: () => Date; seconds?: number };
  if (typeof maybe.toDate === 'function') return maybe.toDate().toISOString();
  if (typeof maybe.seconds === 'number') return new Date(maybe.seconds * 1000).toISOString();
  return null;
}

async function readAll<T>(name: string, orderField: string, max = 200, direction: 'asc' | 'desc' = 'desc'): Promise<ListResult<T>> {
  if (!isFirebaseConfigured || !db) return { data: [], configured: false, error: null };
  try {
    const snapshot = await getDocs(query(collection(db, name), orderBy(orderField, direction), limit(max)));
    const data = snapshot.docs.map((docSnap) => ({ ...(docSnap.data() as T), id: docSnap.id })) as T[];
    return { data, configured: true, error: null };
  } catch (error) {
    return { data: [], configured: true, error: (error as Error).message };
  }
}

export const adminGetNotices = () => readAll<Notice>(COLLECTIONS.notices, 'date');
export const adminGetActivities = () => readAll<Activity>(COLLECTIONS.activities, 'date');
export const adminGetEvents = () => readAll<EventItem>(COLLECTIONS.events, 'startAt');
export const adminGetMessages = async (): Promise<ListResult<ContactMessage>> => {
  const result = await readAll<ContactMessage>(COLLECTIONS.contactMessages, 'createdAt');
  return {
    ...result,
    data: result.data.map((message) => ({
      ...message,
      createdAt: toIsoString(message.createdAt),
    })) as unknown as ContactMessage[],
  };
};
export const adminGetAuditLogs = () => readAll<AuditLog>(COLLECTIONS.auditLogs, 'createdAt');
export const adminGetGallery = () => readAll<GalleryItem>(COLLECTIONS.gallery, 'createdAt');

/** Drafts included — the public loader only sees `published == true`. */
export async function adminGetCommittee(): Promise<ListResult<CommitteeMember>> {
  const result = await readAll<CommitteeMember>(COLLECTIONS.committees, 'order', 200, 'asc');
  return result;
}

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

export async function setMessageHandled(id: string, handled: boolean): Promise<void> {
  const firestore = requireDb();
  await updateDoc(doc(firestore, COLLECTIONS.contactMessages, id), { handled });
}

export async function deleteMessage(id: string, role: Role): Promise<void> {
  const firestore = requireDb();
  await deleteDoc(doc(firestore, COLLECTIONS.contactMessages, id));
  await logAudit({
    action: 'message.deleted',
    targetType: 'setting',
    targetId: id,
    actorRole: role,
    detail: 'যোগাযোগের বার্তা মুছে ফেলা হয়েছে',
  });
}
