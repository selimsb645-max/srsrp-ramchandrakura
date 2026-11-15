/**
 * Shared domain types.
 * These mirror the Firestore collections described in README.md / docs/SCHEMA.md.
 * Every document also carries createdAt / updatedAt timestamps and a `published`
 * flag where public visibility matters.
 */

export type Locale = 'bn' | 'en';

export type Visibility = 'public' | 'members' | 'admin';

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

export type MemberStatus = 'active' | 'inactive' | 'pending';

/** A registered member of the union branch. */
export interface Member extends Timestamped {
  memberCode?: string;
  nameBn: string;
  nameEn?: string;
  guardianName?: string;
  dateOfBirth?: string;
  school?: string;
  className?: string;
  ward?: string;
  village?: string;
  phone?: string;
  email?: string;
  photoUrl?: string;
  status: MemberStatus;
  /** linked Firebase Auth uid, set by an admin when the account is approved */
  uid?: string;
  role: 'member' | 'admin';
  /** minors: never expose personal data publicly */
  isMinor?: boolean;
  published: boolean;
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
}

export interface GalleryItem extends Timestamped {
  titleBn: string;
  titleEn?: string;
  imageUrl: string;
  albumBn?: string;
  takenAt?: string;
  credit?: string;
  published: boolean;
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

export interface JoinRequest {
  id: string;
  nameBn: string;
  guardianName?: string;
  dateOfBirth?: string;
  school?: string;
  className?: string;
  ward?: string;
  village?: string;
  phone: string;
  email?: string;
  motivation?: string;
  createdAt?: Date | null;
  status: 'pending' | 'approved' | 'rejected';
}

export interface PublicStats {
  members: number;
  activities: number;
  events: number;
  notices: number;
}
