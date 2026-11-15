#!/usr/bin/env node
/**
 * Bootstrap / repair helper — run LOCALLY, never deploy it.
 *
 * Because the security rules only let a super_admin change roles, the very first
 * super_admin has to be created outside the browser. This script uses the Firebase
 * Admin SDK with a service-account key that must live on your own machine:
 *
 *   1) npm i -D firebase-admin
 *   2) Firebase Console → Project settings → Service accounts → Generate new private key
 *      Save it as ./serviceAccountKey.json  (already git-ignored — never commit or share it)
 *   3) set G=./serviceAccountKey.json   (PowerShell: $env:G="./serviceAccountKey.json")
 *      node scripts/grant-role.mjs someone@example.com super_admin
 *
 * Accepted roles: super_admin | admin | editor | member
 * Optional 4th argument: --activate  (also sets status to "active")
 */
import { readFileSync } from 'node:fs';

const [, , target, role, flag] = process.argv;
const allowed = ['super_admin', 'admin', 'editor', 'member'];

if (!target || !allowed.includes(role)) {
  console.error('Usage: node scripts/grant-role.mjs <email|uid> <role> [--activate]');
  console.error('Roles:', allowed.join(' | '));
  process.exit(1);
}

const keyPath = process.env.G || './serviceAccountKey.json';
let serviceAccount;
try {
  serviceAccount = JSON.parse(readFileSync(keyPath, 'utf8'));
} catch {
  console.error(`Service account key not found at ${keyPath}.`);
  console.error('Download it from Firebase Console → Project settings → Service accounts.');
  process.exit(1);
}

let admin;
try {
  admin = await import('firebase-admin/app');
} catch {
  console.error('firebase-admin is not installed. Run: npm i -D firebase-admin');
  process.exit(1);
}
const { initializeApp, cert } = admin;
const { getFirestore } = await import('firebase-admin/firestore');
const { getAuth } = await import('firebase-admin/auth');

const app = initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore(app);
const auth = getAuth(app);

let uid = target;
if (target.includes('@')) {
  const user = await auth.getUserByEmail(target).catch(() => null);
  if (!user) {
    console.error(`No Firebase Auth user with email ${target}. The person must register first.`);
    process.exit(1);
  }
  uid = user.uid;
}

const patch = { role, updatedAt: new Date().toISOString() };
if (flag === '--activate') patch.status = 'active';

await db.collection('users').doc(uid).set(patch, { merge: true });

// Optional custom claim, handy for later server-side work.
await auth.setCustomUserClaims(uid, { admin: role === 'super_admin' || role === 'admin' });

await db.collection('auditLogs').add({
  actorUid: 'system-script',
  actorRole: 'super_admin',
  action: 'user.role_changed',
  targetType: 'user',
  targetId: uid,
  detail: `bootstrap → ${role}${flag === '--activate' ? ' (activated)' : ''}`,
  createdAt: new Date().toISOString(),
});

console.log(`✔ users/${uid} → role=${role}${flag === '--activate' ? ', status=active' : ''}`);
