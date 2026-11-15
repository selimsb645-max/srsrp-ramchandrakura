/** Firestore collection names in one place, so refactors stay mechanical. */
export const COLLECTIONS = {
  members: 'members',
  committee: 'committee',
  activities: 'activities',
  events: 'events',
  notices: 'notices',
  gallery: 'gallery',
  messages: 'contactMessages',
  joinRequests: 'joinRequests',
  settings: 'settings',
} as const;

export type CollectionName = (typeof COLLECTIONS)[keyof typeof COLLECTIONS];
