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
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from 'firebase/firestore';
import { db, isFirebaseConfigured, requireDb } from '@/lib/firebase';
import { COLLECTIONS } from './collections';
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
    'uid',
  ];
  for (const key of optionalKeys) {
    const value = input[key];
    if (value) payload[key] = value;
  }
  await addDoc(collection(firestore, COLLECTIONS.membershipApplications), payload);
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
): Promise<void> {
  const firestore = requireDb();
  const status = decision === 'approve' ? 'approved' : 'rejected';

  await updateDoc(doc(firestore, COLLECTIONS.membershipApplications, application.id), {
    status,
    reviewedBy: actor.uid,
    reviewedAt: serverTimestamp(),
    ...(rejectionNote ? { reviewNote: rejectionNote } : {}),
  });

  if (application.uid) {
    await updateDoc(doc(firestore, COLLECTIONS.users, application.uid), {
      status: decision === 'approve' ? 'active' : 'suspended',
      published: decision === 'approve',
      approvedBy: actor.uid,
      approvedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  }

  await logAudit({
    action: decision === 'approve' ? 'membership.approved' : 'membership.rejected',
    targetType: 'membershipApplication',
    targetId: application.id,
    detail: application.fullName,
    actorRole: actor.role,
  });
}
