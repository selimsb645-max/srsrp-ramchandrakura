/**
 * Organizational content writes — notices, activities, events, committee, gallery.
 *
 * firestore.rules are the enforcement layer:
 *   create  : staff, and `createdBy` must equal the caller's uid
 *   update  : staff, and `createdBy` can never be rewritten
 *   delete  : admin / super_admin
 * Every helper stamps `createdBy` on create and never touches it again, and the
 * publish / delete actions leave a line in the append-only audit trail.
 */
import { addDoc, collection, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { requireAuth, requireDb } from '@/lib/firebase';
import { COLLECTIONS } from './collections';
import { logAudit } from './auditService';
import type { AuditLog, Role } from '@/types';

export type ContentKind = 'notices' | 'activities' | 'events' | 'committees' | 'gallery';
export type FormValues = Record<string, string | boolean | number>;

const KIND_LABEL: Record<ContentKind, string> = {
  notices: 'নোটিশ',
  activities: 'কার্যক্রম',
  events: 'কর্মসূচি',
  committees: 'কমিটি সদস্য',
  gallery: 'গ্যালারি ছবি',
};

function targetType(kind: ContentKind): AuditLog['targetType'] {
  switch (kind) {
    case 'notices':
      return 'notice';
    case 'activities':
      return 'activity';
    case 'events':
      return 'event';
    case 'gallery':
      return 'gallery';
    default:
      return 'committee';
  }
}

function nowIso(): string {
  return new Date().toISOString();
}

/** Empty strings are dropped so optional fields stay absent instead of blank. */
function clean(values: FormValues): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [key, raw] of Object.entries(values)) {
    if (key === 'id' || key === 'createdBy' || key === 'createdAt' || key === 'updatedAt') continue;
    if (typeof raw === 'string') {
      const trimmed = raw.trim();
      if (trimmed !== '') out[key] = trimmed;
      continue;
    }
    out[key] = raw;
  }
  return out;
}

export async function createContent(kind: ContentKind, values: FormValues): Promise<string> {
  const firestore = requireDb();
  const auth = requireAuth();
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error('সাইন ইন নেই।');

  const ref = await addDoc(collection(firestore, COLLECTIONS[kind]), {
    ...clean(values),
    published: values.published === true,
    createdBy: uid,
    createdAt: nowIso(),
    updatedAt: nowIso(),
  });
  return ref.id;
}

export async function updateContent(kind: ContentKind, id: string, values: FormValues): Promise<void> {
  const firestore = requireDb();
  await updateDoc(doc(firestore, COLLECTIONS[kind], id), {
    ...clean(values),
    published: values.published === true,
    updatedAt: nowIso(),
  });
}

export async function saveContent(kind: ContentKind, values: FormValues, id?: string | null): Promise<void> {
  if (id) return updateContent(kind, id, values);
  await createContent(kind, values);
}

export async function setContentPublished(
  kind: ContentKind,
  id: string,
  published: boolean,
  role: Role,
): Promise<void> {
  const firestore = requireDb();
  await updateDoc(doc(firestore, COLLECTIONS[kind], id), { published, updatedAt: nowIso() });
  await logAudit({
    action: published ? 'content.published' : 'content.unpublished',
    targetType: targetType(kind),
    targetId: id,
    actorRole: role,
    detail: `${KIND_LABEL[kind]} ${published ? 'প্রকাশ করা হয়েছে' : 'খসড়া করা হয়েছে'}`,
  });
}

export async function deleteContent(kind: ContentKind, id: string, role: Role): Promise<void> {
  const firestore = requireDb();
  await deleteDoc(doc(firestore, COLLECTIONS[kind], id));
  await logAudit({
    action: 'content.deleted',
    targetType: targetType(kind),
    targetId: id,
    actorRole: role,
    detail: `${KIND_LABEL[kind]} মুছে ফেলা হয়েছে`,
  });
}
