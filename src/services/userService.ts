/**
 * Member account operations. Authorization is enforced by firestore.rules; these
 * helpers only decide what the UI offers, and they never send role/status changes
 * from a member session.
 */
import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore';
import { db, isFirebaseConfigured, requireDb } from '@/lib/firebase';
import { COLLECTIONS } from './collections';
import { logAudit } from './auditService';
import type { AccountStatus, PrivateContact, Role, UserProfile } from '@/types';
import type { ListResult } from './publicData';

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

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  if (!db) return null;
  const snapshot = await getDoc(doc(db, COLLECTIONS.users, uid));
  if (!snapshot.exists()) return null;
  const raw = snapshot.data() as Omit<UserProfile, 'id'>;
  return {
    ...raw,
    id: snapshot.id,
    createdAt: toDate(raw.createdAt),
    updatedAt: toDate(raw.updatedAt),
    approvedAt: toDate(raw.approvedAt),
  };
}

export async function getMyContact(uid: string): Promise<PrivateContact | null> {
  if (!db) return null;
  const snapshot = await getDoc(doc(db, COLLECTIONS.users, uid, 'private', 'contact'));
  if (!snapshot.exists()) return null;
  return snapshot.data() as PrivateContact;
}

/** Fields a member may edit on their own profile (never role, status or memberCode). */
export const MEMBER_EDITABLE_FIELDS = ['nameBn', 'nameEn', 'ward', 'village', 'school', 'className', 'photoUrl'] as const;

export async function updateOwnProfile(uid: string, patch: Record<string, unknown>): Promise<void> {
  const firestore = requireDb();
  const allowed: Record<string, unknown> = {};
  for (const key of MEMBER_EDITABLE_FIELDS) {
    if (key in patch) allowed[key] = patch[key];
  }
  await updateDoc(doc(firestore, COLLECTIONS.users, uid), {
    ...allowed,
    updatedAt: serverTimestamp(),
  });
}

export async function updateOwnContact(uid: string, patch: Pick<PrivateContact, 'phone' | 'guardianName'>): Promise<void> {
  const firestore = requireDb();
  await setDoc(
    doc(firestore, COLLECTIONS.users, uid, 'private', 'contact'),
    { ...patch, updatedAt: serverTimestamp() },
    { merge: true },
  );
}

/** কমিটি সদস্য নম্বর দেয় — সদস্য নিজে এটি বদলাতে পারে না (rules-এ নিষিদ্ধ)। */
export async function setMemberCode(uid: string, memberCode: string): Promise<void> {
  const firestore = requireDb();
  const clean = memberCode.trim().toUpperCase();
  if (clean !== '' && !/^[A-Z0-9-]{4,24}$/.test(clean)) throw new Error('BAD_CODE');
  await updateDoc(doc(firestore, COLLECTIONS.users, uid), {
    memberCode: clean,
    updatedAt: serverTimestamp(),
  });
}

/** পরবর্তী সদস্য নম্বর — একই বছরের সবচেয়ে বড় ক্রমিক থেকে এক বেশি। */
export async function nextMemberCode(): Promise<string> {
  const firestore = requireDb();
  const snapshot = await getDocs(query(collection(firestore, COLLECTIONS.users), limit(500)));
  let max = 0;
  snapshot.docs.forEach((docSnap) => {
    const code = String((docSnap.data() as UserProfile).memberCode ?? '');
    const match = code.match(/-(\d{1,4})$/);
    if (match) max = Math.max(max, Number(match[1]));
  });
  const year = String(new Date().getFullYear()).slice(-2);
  return `SRC-RK-${year}-${String(max + 1).padStart(4, '0')}`;
}

/** Public, anonymised directory: only published member accounts, never contact data. */
export async function listPublicMembers(): Promise<ListResult<UserProfile>> {
  if (!isFirebaseConfigured || !db) return { data: [], configured: false, error: null };
  try {
    // নিয়মে লেখা আছে "প্রকাশিত + role == member"; দুটো শর্তই কোয়েরিতে না দিলে
    // Firestore অনুমতি দেয় না। orderBy বাদ দেওয়া হয়েছে, তাই composite index লাগে না।
    const snapshot = await getDocs(
      query(
        collection(db, COLLECTIONS.users),
        where('published', '==', true),
        where('role', '==', 'member'),
        limit(300),
      ),
    );
    const data = snapshot.docs
      .map((docSnap) => {
        const raw = docSnap.data() as UserProfile;
        return {
          ...raw,
          id: docSnap.id,
          // belt-and-braces: contact fields must never reach this list
          phone: undefined,
          email: undefined,
        } as unknown as UserProfile;
      })
      .filter((member) => member.role === 'member')
      .sort((a, b) => a.nameBn.localeCompare(b.nameBn, 'bn'));
    return { data, configured: true, error: null };
  } catch (error) {
    return { data: [], configured: true, error: (error as Error).message };
  }
}

/** Staff view of every account (admin + super_admin only, enforced by rules). */
export async function listAllUsers(): Promise<ListResult<UserProfile>> {
  if (!isFirebaseConfigured || !db) return { data: [], configured: false, error: null };
  try {
    const snapshot = await getDocs(query(collection(db, COLLECTIONS.users), orderBy('nameBn', 'asc'), limit(500)));
    return {
      data: snapshot.docs.map((docSnap) => {
        const raw = docSnap.data() as UserProfile;
        return { ...raw, id: docSnap.id, createdAt: toDate(raw.createdAt) };
      }),
      configured: true,
      error: null,
    };
  } catch (error) {
    return { data: [], configured: true, error: (error as Error).message };
  }
}

export async function setUserStatus(
  target: UserProfile,
  status: AccountStatus,
  actorRole: Role,
): Promise<void> {
  const firestore = requireDb();
  await updateDoc(doc(firestore, COLLECTIONS.users, target.id), {
    status,
    published: status === 'active' ? true : target.published,
    updatedAt: serverTimestamp(),
  });
  await logAudit({
    action: 'user.status_changed',
    targetType: 'user',
    targetId: target.id,
    detail: `${target.status} → ${status}`,
    actorRole,
  });
}

/** Role changes are for super_admin only; rules reject everyone else. */
export async function setUserRole(target: UserProfile, role: Role, actorRole: Role): Promise<void> {
  const firestore = requireDb();
  await updateDoc(doc(firestore, COLLECTIONS.users, target.id), {
    role,
    updatedAt: serverTimestamp(),
  });
  await logAudit({
    action: 'user.role_changed',
    targetType: 'user',
    targetId: target.id,
    detail: `${target.role} → ${role}`,
    actorRole,
  });
}
