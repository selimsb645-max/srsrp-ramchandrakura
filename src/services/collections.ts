/** Firestore collection names in one place, so refactors stay mechanical. */
export const COLLECTIONS = {
  /** users/{uid} + users/{uid}/private/contact */
  users: 'users',
  membershipApplications: 'membershipApplications',
  committees: 'committees',
  notices: 'notices',
  events: 'events',
  activities: 'activities',
  gallery: 'gallery',
  contactMessages: 'contactMessages',
  auditLogs: 'auditLogs',
} as const;

export type CollectionName = (typeof COLLECTIONS)[keyof typeof COLLECTIONS];

/** Collections that existed in the first phase and were renamed in phase 2. */
export const LEGACY_COLLECTIONS: Record<string, string> = {
  members: COLLECTIONS.users,
  committee: COLLECTIONS.committees,
  joinRequests: COLLECTIONS.membershipApplications,
};
