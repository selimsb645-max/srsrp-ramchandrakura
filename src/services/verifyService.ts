/**
 * Public membership verification — the page behind the QR printed on the ID card.
 *
 * Reads nothing personal beyond what the public directory already shows: no phone, no
 * email, no birth date. Firestore's rules let anyone read a user document only when it is
 * `published == true` and `role == 'member'`, so the query carries both conditions along
 * with the member number; equality-only queries use the automatic indexes and need no
 * composite index.
 */
import { collection, getDocs, limit, query, where } from 'firebase/firestore';
import { db, isFirebaseConfigured } from '@/lib/firebase';
import { COLLECTIONS } from './collections';

export interface VerifiedMember {
  name: string;
  memberCode: string;
  ward: string;
  village: string;
  designation: string;
  status: string;
  joinedAt: Date | null;
}

export type VerifyOutcome =
  | { state: 'found'; member: VerifiedMember }
  | { state: 'inactive'; member: VerifiedMember }
  | { state: 'not_found' }
  | { state: 'not_configured' }
  | { state: 'error' };

/** Member numbers are printed in capitals; accept whatever casing the visitor types. */
export function normaliseMemberCode(raw: string): string {
  return raw.trim().toUpperCase().replace(/\s+/g, '');
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

export async function verifyMemberCode(rawCode: string): Promise<VerifyOutcome> {
  const code = normaliseMemberCode(rawCode);
  if (!code) return { state: 'not_found' };
  if (!isFirebaseConfigured || !db) return { state: 'not_configured' };

  try {
    const snap = await getDocs(
      query(
        collection(db, COLLECTIONS.users),
        where('published', '==', true),
        where('role', '==', 'member'),
        where('memberCode', '==', code),
        limit(1),
      ),
    );
    if (snap.empty) return { state: 'not_found' };

    const data = snap.docs[0].data() as Record<string, unknown>;
    const member: VerifiedMember = {
      name: String(data.nameBn ?? data.nameEn ?? ''),
      memberCode: String(data.memberCode ?? code),
      ward: String(data.ward ?? ''),
      village: String(data.village ?? ''),
      designation: String(data.designationBn ?? ''),
      status: String(data.status ?? ''),
      joinedAt: toDate(data.approvedAt ?? data.createdAt),
    };
    return member.status === 'active' ? { state: 'found', member } : { state: 'inactive', member };
  } catch {
    return { state: 'error' };
  }
}
