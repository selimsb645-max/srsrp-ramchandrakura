/**
 * Membership applications: public create → admin review → account activation.
 *
 * Spark-plan note: activating an account is a Firestore update on the applicant's own
 * `users/{uid}` document, which the applicant has already created at signup. No Cloud
 * Function and no Admin SDK is needed, so this works on the free plan.
 */
import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from 'firebase/firestore';
import { db, isFirebaseConfigured, requireDb } from '@/lib/firebase';
import { COLLECTIONS } from './collections';
import { nextMemberCode } from './userService';
import { logAudit } from './auditService';
import type { MembershipApplication, Role } from '@/types';
import type { ListResult } from './publicData';

export interface ApplicationInput {
  fullName: string;
  phone: string;
  guardianName?: string;
  dateOfBirth?: string;
  school?: string;
  className?: string;
  ward?: string;
  village?: string;
  email?: string;
  motivation?: string;
  facebookUrl?: string;
  nidNumber?: string;
  documents?: { label: string; name: string; key: string; type: string; size: number }[];
  /** present when the applicant already has a login account */
  uid?: string;
}

/** Public form (no account needed). Anonymous submissions land in the admin queue. */
export async function submitApplication(input: ApplicationInput): Promise<void> {
  const firestore = requireDb();
  const payload: Record<string, unknown> = {
    fullName: input.fullName.trim(),
    phone: input.phone.trim(),
    status: 'pending',
    createdAt: serverTimestamp(),
  };
  const optionalKeys: (keyof ApplicationInput)[] = [
    'guardianName',
    'dateOfBirth',
    'school',
    'className',
    'ward',
    'village',
    'email',
    'motivation',
    'facebookUrl',
    'nidNumber',
    'uid',
  ];
  for (const key of optionalKeys) {
    const value = input[key];
    if (value) payload[key] = value;
  }
  if (input.documents && input.documents.length > 0) payload.documents = input.documents;
  await addDoc(collection(firestore, COLLECTIONS.membershipApplications), payload);
}

/** One application, for the printable detail sheet (admin + super_admin only, per rules). */
export async function getApplication(id: string): Promise<MembershipApplication | null> {
  const firestore = requireDb();
  const snapshot = await getDoc(doc(firestore, COLLECTIONS.membershipApplications, id));
  if (!snapshot.exists()) return null;
  return { ...(snapshot.data() as MembershipApplication), id: snapshot.id };
}

export async function listApplications(): Promise<ListResult<MembershipApplication>> {
  if (!isFirebaseConfigured || !db) return { data: [], configured: false, error: null };
  try {
    const snapshot = await getDocs(
      query(collection(db, COLLECTIONS.membershipApplications), orderBy('createdAt', 'desc'), limit(200)),
    );
    return {
      data: snapshot.docs.map((docSnap) => ({ ...(docSnap.data() as MembershipApplication), id: docSnap.id })),
      configured: true,
      error: null,
    };
  } catch (error) {
    return { data: [], configured: true, error: (error as Error).message };
  }
}

/**
 * Approve: application → approved, linked account → active + published.
 * Reject: application → rejected, account stays pending/suspended (never activated).
 */
export async function reviewApplication(
  application: MembershipApplication,
  decision: 'approve' | 'reject',
  actor: { uid: string; role: Role },
  rejectionNote?: string,
): Promise<{ memberCode?: string }> {
  const firestore = requireDb();
  const status = decision === 'approve' ? 'approved' : 'rejected';
  // assigned member number (only when the account had none yet), reported back so the
  // approval mail can print it
  let memberCode: string | undefined;

  await updateDoc(doc(firestore, COLLECTIONS.membershipApplications, application.id), {
    status,
    reviewedBy: actor.uid,
    reviewedAt: serverTimestamp(),
    ...(rejectionNote ? { reviewNote: rejectionNote } : {}),
  });

  if (application.uid) {
    // অনুমোদনের সময় সদস্য নম্বর না থাকলে একটি দিয়ে দেওয়া হয়, যাতে আইডি কার্ড ও
    // সনদ সাথে সাথেই তৈরি করা যায়। নম্বরটি কমিটি পরে বদলাতে পারে।
    if (decision === 'approve') {
      const accountRef = doc(firestore, COLLECTIONS.users, application.uid);
      const accountSnap = await getDoc(accountRef);
      const existing = (accountSnap.data() as { memberCode?: string } | undefined)?.memberCode;
      if (!existing) {
        try {
          memberCode = await nextMemberCode();
        } catch {
          memberCode = undefined;
        }
      }
    }

    await updateDoc(doc(firestore, COLLECTIONS.users, application.uid), {
      status: decision === 'approve' ? 'active' : 'suspended',
      published: decision === 'approve',
      approvedBy: actor.uid,
      approvedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      ...(memberCode ? { memberCode } : {}),
    });
  }

  await logAudit({
    action: decision === 'approve' ? 'membership.approved' : 'membership.rejected',
    targetType: 'membershipApplication',
    targetId: application.id,
    detail: application.fullName,
    actorRole: actor.role,
  });

  return { memberCode };
}
