/**
 * Append-only audit trail for sensitive administrative operations.
 *
 * Rules: only active staff may append, the actor must be the caller, and no one can
 * update or delete an entry — not even a super_admin, so the trail cannot be rewritten
 * from the browser.
 */
import { addDoc, collection, getDocs, limit, orderBy, query } from 'firebase/firestore';
import { db, isFirebaseConfigured, requireAuth, requireDb } from '@/lib/firebase';
import { COLLECTIONS } from './collections';
import type { AuditAction, AuditLog, Role } from '@/types';
import type { ListResult } from './publicData';

export interface AuditInput {
  action: AuditAction | string;
  targetType: AuditLog['targetType'];
  targetId: string;
  detail?: string;
  actorRole: Role;
}

export async function logAudit(input: AuditInput): Promise<void> {
  const firestore = requireDb();
  const auth = requireAuth();
  if (!auth.currentUser) throw new Error('Not signed in');

  await addDoc(collection(firestore, COLLECTIONS.auditLogs), {
    actorUid: auth.currentUser.uid,
    actorRole: input.actorRole,
    action: input.action,
    targetType: input.targetType,
    targetId: input.targetId,
    detail: input.detail ?? '',
    createdAt: new Date().toISOString(),
  });
}

export async function listAuditLogs(max = 100): Promise<ListResult<AuditLog>> {
  if (!isFirebaseConfigured || !db) return { data: [], configured: false, error: null };
  try {
    const snapshot = await getDocs(
      query(collection(db, COLLECTIONS.auditLogs), orderBy('createdAt', 'desc'), limit(max)),
    );
    return {
      data: snapshot.docs.map((docSnap) => ({ ...(docSnap.data() as AuditLog), id: docSnap.id })),
      configured: true,
      error: null,
    };
  } catch (error) {
    return { data: [], configured: true, error: (error as Error).message };
  }
}
