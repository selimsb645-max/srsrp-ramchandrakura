/**
 * Read helpers for public pages.
 *
 * Rules require queries to be constrained to `published == true`, so each loader adds
 * that where-clause. Ordering is done in the browser on purpose: a where-clause plus an
 * orderBy on another field needs a composite index, and when that index is missing the
 * query fails and the page silently looks empty. Single-field equality queries use the
 * automatic index, so they work on a fresh project without any console step.
 * Nothing personal is ever read here: contact details live in `users/{uid}/private/contact`,
 * which these loaders never touch.
 */
import { collection, getDocs, limit, query, where, type Firestore } from 'firebase/firestore';
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

/** Newest first, comparing ISO date strings / Firestore timestamps without an index. */
function byFieldDesc(field: string) {
  return (a: Record<string, unknown>, b: Record<string, unknown>): number => {
    const left = toDate(a[field])?.getTime() ?? 0;
    const right = toDate(b[field])?.getTime() ?? 0;
    return right - left;
  };
}

async function fetchPublished<T extends Record<string, unknown>>(
  firestore: Firestore,
  name: string,
  orderField: string,
  max = 60,
): Promise<T[]> {
  const snapshot = await getDocs(
    query(collection(firestore, name), where('published', '==', true), limit(max)),
  );
  const rows = snapshot.docs.map((docSnap) => normalize(docSnap.id, docSnap.data() as T)) as T[];
  return rows.sort(byFieldDesc(orderField));
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
    return (data as CommitteeMember[])
      .filter((member) => member.verification === 'verified')
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  });
}

/**
 * Public member directory — published accounts only, name/ward/village only.
 * Reads the `users` collection with the constraint the rules expect.
 */
export function getMembers(): Promise<ListResult<UserProfile>> {
  return wrap(async () => {
    const snapshot = await getDocs(
      query(collection(db!, COLLECTIONS.users), where('published', '==', true), limit(300)),
    );
    return snapshot.docs
      .map((docSnap) => {
        const raw = docSnap.data() as UserProfile;
        return {
          ...raw,
          id: docSnap.id,
          phone: undefined,
          email: undefined,
        } as unknown as UserProfile;
      })
      .sort((a, b) => String(a.nameBn ?? '').localeCompare(String(b.nameBn ?? ''), 'bn'));
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
