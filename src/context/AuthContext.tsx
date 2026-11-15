/**
 * Authentication context backed by Firebase Auth.
 *
 * The signed-in user's profile is read from the `members` collection (a document whose
 * `uid` equals the Firebase Auth uid). Admin access requires either:
 *   - profile.role === 'admin', or
 *   - an `admin` custom claim on the ID token (set with the Admin SDK on the server).
 * Firestore rules enforce the same rule server-side; the UI gate is only convenience.
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut as fbSignOut,
  sendPasswordResetEmail,
  type User,
} from 'firebase/auth';
import { collection, getDocs, limit, query, where } from 'firebase/firestore';
import { auth, db, isFirebaseConfigured } from '@/lib/firebase';
import { COLLECTIONS } from '@/services/collections';
import type { Member } from '@/types';

interface AuthState {
  user: User | null;
  profile: Member | null;
  isAdmin: boolean;
  loading: boolean;
  configured: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOutUser: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

async function loadProfile(user: User): Promise<{ profile: Member | null; isAdmin: boolean }> {
  if (!db) return { profile: null, isAdmin: false };

  let profile: Member | null = null;
  try {
    const snapshot = await getDocs(
      query(collection(db, COLLECTIONS.members), where('uid', '==', user.uid), limit(1)),
    );
    if (!snapshot.empty) {
      const docSnap = snapshot.docs[0];
      profile = { ...(docSnap.data() as Member), id: docSnap.id };
    }
  } catch {
    profile = null;
  }

  let claimAdmin = false;
  try {
    const token = await user.getIdTokenResult();
    claimAdmin = token.claims.admin === true;
  } catch {
    claimAdmin = false;
  }

  return { profile, isAdmin: claimAdmin || profile?.role === 'admin' };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Member | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(isFirebaseConfigured);

  useEffect(() => {
    if (!auth) {
      setLoading(false);
      return;
    }
    const unsubscribe = onAuthStateChanged(auth, async (nextUser) => {
      setUser(nextUser);
      if (nextUser) {
        const result = await loadProfile(nextUser);
        setProfile(result.profile);
        setIsAdmin(result.isAdmin);
      } else {
        setProfile(null);
        setIsAdmin(false);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    if (!auth) throw new Error('Firebase is not configured.');
    await signInWithEmailAndPassword(auth, email, password);
  }, []);

  const signOutUser = useCallback(async () => {
    if (!auth) return;
    await fbSignOut(auth);
  }, []);

  const resetPassword = useCallback(async (email: string) => {
    if (!auth) throw new Error('Firebase is not configured.');
    await sendPasswordResetEmail(auth, email);
  }, []);

  const refreshProfile = useCallback(async () => {
    if (!user) return;
    const result = await loadProfile(user);
    setProfile(result.profile);
    setIsAdmin(result.isAdmin);
  }, [user]);

  const value = useMemo<AuthState>(
    () => ({
      user,
      profile,
      isAdmin,
      loading,
      configured: isFirebaseConfigured,
      signIn,
      signOutUser,
      resetPassword,
      refreshProfile,
    }),
    [user, profile, isAdmin, loading, signIn, signOutUser, resetPassword, refreshProfile],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
