/**
 * Read helpers for public pages.
 *
 * Rules require queries to be constrained to `published == true`, so each loader adds
 * that where-clause (the matching composite indexes live in firestore.indexes.json).
 * Nothing personal is ever read here: contact details live in `users/{uid}/private/contact`,
 * which these loaders never touch.
 */
import { collection, getDocs, limit, orderBy, query, where, type Firestore } from 'firebase/firestore';
import { db, isFirebaseConfigured } from '@/lib/firebase';
import { COLLECTIONS } from './collections';
import type { Activity, CommitteeMember, EventItem, GalleryItem, Notice, UserProfile } from '@/types';

export interface ListResult<T> {
  data: T[];
  configured: boolean;
  error: string | null;
}

function toDate(value: unknown): Date | null {
  if (!value) return null;
  if (value instanceof Date) return value;
  if (typeof value === 'object' && value !== null && 'toDate' in value) {
    try {
      return (value as { toDate: () => Date }).toDate();
    } catch {
      return null;
    }
  }
  if (typeof value === 'string' || typeof value === 'number') {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }
  return null;
}

function normalize<T extends Record<string, unknown>>(id: string, raw: T) {
  return { ...raw, id, createdAt: toDate(raw.createdAt), updatedAt: toDate(raw.updatedAt) };
}

async function fetchPublished<T extends Record<string, unknown>>(
  firestore: Firestore,
  name: string,
  orderField: string,
  max = 60,
): Promise<T[]> {
  const snapshot = await getDocs(
    query(
      collection(firestore, name),
      where('published', '==', true),
      orderBy(orderField, 'desc'),
      limit(max),
    ),
  );
  return snapshot.docs.map((docSnap) => normalize(docSnap.id, docSnap.data() as T)) as T[];
}

function wrap<T>(loader: () => Promise<T[]>): Promise<ListResult<T>> {
  if (!isFirebaseConfigured || !db) return Promise.resolve({ data: [], configured: false, error: null });
  return loader()
    .then((data): ListResult<T> => ({ data, configured: true, error: null }))
    .catch((error: Error): ListResult<T> => ({ data: [], configured: true, error: error.message }));
}

export function getCommittee(): Promise<ListResult<CommitteeMember>> {
  return wrap(async () => {
    const data = await fetchPublished<CommitteeMember & Record<string, unknown>>(
      db!,
      COLLECTIONS.committees,
      'order',
      100,
    );
    return (data as CommitteeMember[]).sort((a, b) => a.order - b.order);
  });
}

/**
 * Public member directory — published accounts only, name/ward/village only.
 * Reads the `users` collection with the constraint the rules expect.
 */
export function getMembers(): Promise<ListResult<UserProfile>> {
  return wrap(async () => {
    const snapshot = await getDocs(
      query(
        collection(db!, COLLECTIONS.users),
        where('published', '==', true),
        orderBy('nameBn', 'asc'),
        limit(300),
      ),
    );
    return snapshot.docs.map((docSnap) => {
      const raw = docSnap.data() as UserProfile;
      return {
        ...raw,
        id: docSnap.id,
        phone: undefined,
        email: undefined,
      } as unknown as UserProfile;
    });
  });
}

export function getActivities(): Promise<ListResult<Activity>> {
  return wrap(() => fetchPublished<Activity & Record<string, unknown>>(db!, COLLECTIONS.activities, 'date'));
}

export function getEvents(): Promise<ListResult<EventItem>> {
  return wrap(() => fetchPublished<EventItem & Record<string, unknown>>(db!, COLLECTIONS.events, 'startAt'));
}

export function getNotices(): Promise<ListResult<Notice>> {
  return wrap(() => fetchPublished<Notice & Record<string, unknown>>(db!, COLLECTIONS.notices, 'date'));
}

export function getGallery(): Promise<ListResult<GalleryItem>> {
  return wrap(() => fetchPublished<GalleryItem & Record<string, unknown>>(db!, COLLECTIONS.gallery, 'createdAt'));
}
