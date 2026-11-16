/**
 * Domain types — mirror the Firestore collections in `src/services/collections.ts`.
 *
 * Privacy model (enforced in firestore.rules, not only in the UI):
 *  - `users/{uid}`             public-safe profile: name, ward, village, role, status
 *  - `users/{uid}/private/contact`  phone, email, guardian, date of birth — owner + staff only
 *  - every other collection holds organizational content, never personal data of minors
 */

export type Locale = 'bn' | 'en';

/** The four roles requested for the branch's role-based access architecture. */
export type Role = 'super_admin' | 'admin' | 'editor' | 'member';

/** Membership lifecycle. Only `active` members may open the member dashboard. */
export type AccountStatus = 'pending' | 'active' | 'suspended';

export interface Timestamped {
  id: string;
  createdAt?: Date | null;
  updatedAt?: Date | null;
}

export type CommitteeRole =
  | 'president'
  | 'vice_president'
  | 'general_secretary'
  | 'joint_secretary'
  | 'organizing_secretary'
  | 'treasurer'
  | 'office_secretary'
  | 'publicity_secretary'
  | 'member';

/** A committee position (current or previous term). */
export interface CommitteeMember extends Timestamped {
  nameBn: string;
  nameEn?: string;
  role: CommitteeRole;
  roleTitleBn?: string;
  roleTitleEn?: string;
  photoUrl?: string;
  phone?: string;
  email?: string;
  order: number;
  termBn?: string;
  published: boolean;
  /** true until a human verifies the record against a signed committee list */
  verification: 'pending' | 'verified';
}

/** Event RSVP. Stored inside the member's own `users/{uid}` document. */
export type RsvpStatus = 'going' | 'not_going';

/** Attendance stamp for one event, also inside `users/{uid}`. */
export interface AttendanceStamp {
  at: string;
  /** self = member checked in from the portal, admin = recorded by the committee */
  method: 'self' | 'admin';
  by?: string;
}

/** `users/{uid}` — document id equals the Firebase Auth uid. */
export interface UserProfile extends Timestamped {
  uid: string;
  nameBn: string;
  nameEn?: string;
  memberCode?: string;
  ward?: string;
  village?: string;
  school?: string;
  className?: string;
  photoUrl?: string;
  /** সাংগঠনিক পদবি (যেমন সদস্য, সাংগঠনিক সম্পাদক) — কমিটি নির্ধারণ করে, কার্ডে ছাপা হয় */
  designationBn?: string;
  /** যোগদানের তারিখ; না থাকলে approvedAt ধরা হয় */
  joinedAt?: Date | null;
  /** কার্ড ইস্যুর তারিখ; না থাকলে যোগদানের তারিখ */
  cardIssuedAt?: Date | null;
  /** কার্ডের মেয়াদ শেষের তারিখ; না থাকলে ইস্যু + site.membership.cardTermYears */
  cardExpiresAt?: Date | null;
  role: Role;
  status: AccountStatus;
  /** publishes the public-safe directory entry (never contact details) */
  published: boolean;
  approvedBy?: string;
  approvedAt?: Date | null;
  /** eventId → the member's own answer */
  rsvps?: Record<string, RsvpStatus>;
  /** eventId → attendance stamp; absence means the member did not attend */
  attendance?: Record<string, AttendanceStamp>;
  createdAt?: Date | null;
  updatedAt?: Date | null;
}

/** `users/{uid}/private/contact` — never readable by other members. */
export interface PrivateContact {
  phone?: string;
  email?: string;
  guardianName?: string;
  dateOfBirth?: string;
}

export type ApplicationStatus = 'pending' | 'approved' | 'rejected';

/** `membershipApplications/{id}` — anyone may create, only admins may read. */
export interface MembershipApplication extends Timestamped {
  uid?: string;
  fullName: string;
  guardianName?: string;
  dateOfBirth?: string;
  school?: string;
  className?: string;
  ward?: string;
  village?: string;
  phone: string;
  email?: string;
  motivation?: string;
  facebookUrl?: string;
  nidNumber?: string;
  documents?: { label: string; name: string; key: string; type: string; size: number }[];
  status: ApplicationStatus;
  reviewedBy?: string;
  reviewedAt?: Date | null;
}

export type ActivityCategory =
  | 'education'
  | 'sports'
  | 'culture'
  | 'health'
  | 'social'
  | 'environment'
  | 'other';

export interface Activity extends Timestamped {
  titleBn: string;
  titleEn?: string;
  summaryBn: string;
  summaryEn?: string;
  bodyBn?: string;
  bodyEn?: string;
  category: ActivityCategory;
  date: string;
  locationBn?: string;
  coverImageUrl?: string;
  galleryIds?: string[];
  published: boolean;
  createdBy?: string;
}

export interface EventItem extends Timestamped {
  titleBn: string;
  titleEn?: string;
  descriptionBn?: string;
  descriptionEn?: string;
  startAt: string;
  endAt?: string;
  venueBn?: string;
  venueEn?: string;
  registrationOpen: boolean;
  published: boolean;
  createdBy?: string;
}

export type NoticePriority = 'normal' | 'important' | 'urgent';

export interface Notice extends Timestamped {
  titleBn: string;
  titleEn?: string;
  bodyBn: string;
  bodyEn?: string;
  date: string;
  priority: NoticePriority;
  attachmentUrl?: string;
  published: boolean;
  createdBy?: string;
}

export interface GalleryItem extends Timestamped {
  titleBn: string;
  titleEn?: string;
  imageUrl: string;
  albumBn?: string;
  takenAt?: string;
  credit?: string;
  published: boolean;
  createdBy?: string;
}

export interface ContactMessage {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  subject: string;
  message: string;
  createdAt?: Date | null;
  handled: boolean;
}

export type AuditAction =
  | 'user.approved'
  | 'user.rejected'
  | 'user.status_changed'
  | 'user.role_changed'
  | 'membership.approved'
  | 'membership.rejected'
  | 'content.published'
  | 'content.unpublished'
  | 'content.deleted';

/** `auditLogs/{id}` — append-only trail of sensitive administrative operations. */
export interface AuditLog extends Timestamped {
  actorUid: string;
  actorRole: Role;
  action: AuditAction | string;
  targetType: 'user' | 'membershipApplication' | 'notice' | 'event' | 'activity' | 'gallery' | 'committee' | 'setting';
  targetId: string;
  detail?: string;
}

export interface PublicStats {
  members: number;
  activities: number;
  events: number;
  notices: number;
}
