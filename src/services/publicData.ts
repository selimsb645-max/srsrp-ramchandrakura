/**
 * Read helpers for public pages.
 *
 * Design note: public lists are fetched with a single orderBy and filtered in memory
 * for `published !== false`. That keeps the site working without composite indexes.
 * When the registers grow, add `where('published','==',true)` plus the matching
 * composite index in firestore.indexes.json.
 */
import { collection, getDocs, limit, orderBy, query, type Firestore } from 'firebase/firestore';
import { db, isFirebaseConfigured } from '@/lib/firebase';
import { COLLECTIONS } from './collections';
import type { Activity, CommitteeMember, EventItem, GalleryItem, Member, Notice } from '@/types';

export interface ListResult<T> {
  data: T[];
  configured: boolean;
  error: string | null;
}

function isPublic(record: { published?: boolean }): boolean {
  return record.published !== false;
}

function toDate(value: unknown): Date | null {
  if (!value) return null;
  if (value instanceof Date) return value;
  if (typeof value === 'object' && value !== null && 'toDate' in value) {
    try {
      // Firestore Timestamp
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
  return {
    ...raw,
    id,
    createdAt: toDate(raw.createdAt),
    updatedAt: toDate(raw.updatedAt),
  };
}

async function fetchList<T extends Record<string, unknown>>(
  firestore: Firestore,
  name: string,
  orderField: string,
  max = 60,
): Promise<T[]> {
  const snapshot = await getDocs(query(collection(firestore, name), orderBy(orderField, 'desc'), limit(max)));
  return snapshot.docs
    .map((doc) => normalize(doc.id, doc.data() as T))
    .filter((record) => isPublic(record as { published?: boolean })) as T[];
}

export async function getCommittee(): Promise<ListResult<CommitteeMember>> {
  if (!isFirebaseConfigured || !db) return { data: [], configured: false, error: null };
  try {
    const data = await fetchList<CommitteeMember & Record<string, unknown>>(db, COLLECTIONS.committee, 'order', 100);
    data.sort((a, b) => a.order - b.order);
    return { data: data as CommitteeMember[], configured: true, error: null };
  } catch (error) {
    return { data: [], configured: true, error: (error as Error).message };
  }
}

export async function getMembers(): Promise<ListResult<Member>> {
  if (!isFirebaseConfigured || !db) return { data: [], configured: false, error: null };
  try {
    const data = await fetchList<Member & Record<string, unknown>>(db, COLLECTIONS.members, 'nameBn', 200);
    // Public member view: never expose contact data or minors' details.
    const safe = data.map((member) => ({
      ...member,
      phone: undefined,
      email: undefined,
      guardianName: undefined,
      dateOfBirth: member.isMinor ? undefined : member.dateOfBirth,
    }));
    return { data: safe as Member[], configured: true, error: null };
  } catch (error) {
    return { data: [], configured: true, error: (error as Error).message };
  }
}

export async function getActivities(): Promise<ListResult<Activity>> {
  if (!isFirebaseConfigured || !db) return { data: [], configured: false, error: null };
  try {
    return { data: await fetchList<Activity & Record<string, unknown>>(db, COLLECTIONS.activities, 'date'), configured: true, error: null } as ListResult<Activity>;
  } catch (error) {
    return { data: [], configured: true, error: (error as Error).message };
  }
}

export async function getEvents(): Promise<ListResult<EventItem>> {
  if (!isFirebaseConfigured || !db) return { data: [], configured: false, error: null };
  try {
    return { data: await fetchList<EventItem & Record<string, unknown>>(db, COLLECTIONS.events, 'startAt'), configured: true, error: null } as ListResult<EventItem>;
  } catch (error) {
    return { data: [], configured: true, error: (error as Error).message };
  }
}

export async function getNotices(): Promise<ListResult<Notice>> {
  if (!isFirebaseConfigured || !db) return { data: [], configured: false, error: null };
  try {
    return { data: await fetchList<Notice & Record<string, unknown>>(db, COLLECTIONS.notices, 'date'), configured: true, error: null } as ListResult<Notice>;
  } catch (error) {
    return { data: [], configured: true, error: (error as Error).message };
  }
}

export async function getGallery(): Promise<ListResult<GalleryItem>> {
  if (!isFirebaseConfigured || !db) return { data: [], configured: false, error: null };
  try {
    return { data: await fetchList<GalleryItem & Record<string, unknown>>(db, COLLECTIONS.gallery, 'createdAt'), configured: true, error: null } as ListResult<GalleryItem>;
  } catch (error) {
    return { data: [], configured: true, error: (error as Error).message };
  }
}
