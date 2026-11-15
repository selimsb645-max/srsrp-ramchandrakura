/**
 * Firebase bootstrap.
 *
 * Only *web* config values from the Firebase console belong here. They identify the
 * project to the browser and are not secrets; Firestore Security Rules are what
 * actually protect the data (see firestore.rules).
 *
 * A Firebase **Admin SDK** private key / service-account JSON must NEVER be placed in
 * frontend code or in a VITE_* variable: anything prefixed with VITE_ is shipped to
 * every visitor's browser.
 */
import { initializeApp, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

export const missingFirebaseKeys = Object.entries(firebaseConfig)
  .filter(([, value]) => !value)
  .map(([key]) => key);

/** False until .env is filled in — the UI degrades gracefully instead of crashing. */
export const isFirebaseConfigured = missingFirebaseKeys.length === 0;

let app: FirebaseApp | null = null;

if (isFirebaseConfigured) {
  app = initializeApp(firebaseConfig);
} else if (import.meta.env.DEV) {
  // eslint-disable-next-line no-console
  console.warn('[firebase] Missing config keys:', missingFirebaseKeys.join(', '), '— see .env.example');
}

export const auth: Auth | null = app ? getAuth(app) : null;
export const db: Firestore | null = app ? getFirestore(app) : null;

export class BackendNotConfiguredError extends Error {
  constructor() {
    super('Firebase is not configured. Add your project keys to .env (see .env.example).');
    this.name = 'BackendNotConfiguredError';
  }
}

export function requireDb(): Firestore {
  if (!db) throw new BackendNotConfiguredError();
  return db;
}

export function requireAuth(): Auth {
  if (!auth) throw new BackendNotConfiguredError();
  return auth;
}
