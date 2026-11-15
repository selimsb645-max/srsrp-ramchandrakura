/**
 * Authentication + authorization context.
 *
 * The signed-in user's `users/{uid}` document supplies role and status; the private
 * contact document is loaded separately and only ever for the signed-in member.
 *
 * Authorization is ultimately enforced by firestore.rules. Everything here is UI
 * convenience: `isAdmin` decides which buttons to draw, not who may write.
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { auth, isFirebaseConfigured } from '@/lib/firebase';
import { getMyContact, getUserProfile } from '@/services/userService';
import { registerMember, requestPasswordReset, signInMember, signOutMember, type RegisterInput } from '@/services/authService';
import type { AccountStatus, PrivateContact, Role, UserProfile } from '@/types';

const STAFF_ROLES: Role[] = ['super_admin', 'admin', 'editor'];
const ADMIN_ROLES: Role[] = ['super_admin', 'admin'];

interface AuthState {
  user: User | null;
  profile: UserProfile | null;
  contact: PrivateContact | null;
  role: Role;
  status: AccountStatus | 'unknown';
  isStaff: boolean;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  isApprovedMember: boolean;
  loading: boolean;
  configured: boolean;
  signIn: (email: string, password: string) => Promise<{ status: AccountStatus; role: Role }>;
  register: (input: RegisterInput) => Promise<void>;
  signOutUser: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [contact, setContact] = useState<PrivateContact | null>(null);
  const [loading, setLoading] = useState(isFirebaseConfigured);

  const load = useCallback(async (nextUser: User) => {
    const [nextProfile, nextContact] = await Promise.all([
      getUserProfile(nextUser.uid).catch(() => null),
      getMyContact(nextUser.uid).catch(() => null),
    ]);
    setProfile(nextProfile);
    setContact(nextContact);
  }, []);

  useEffect(() => {
    if (!auth) {
      setLoading(false);
      return;
    }
    const unsubscribe = onAuthStateChanged(auth, async (nextUser) => {
      setUser(nextUser);
      if (nextUser) {
        await load(nextUser);
      } else {
        setProfile(null);
        setContact(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, [load]);

  const signIn = useCallback(async (email: string, password: string) => {
    const signedIn = await signInMember(email, password);
    // Resolve the profile immediately so the caller can route by approval status.
    const nextProfile = await getUserProfile(signedIn.uid).catch(() => null);
    const nextContact = await getMyContact(signedIn.uid).catch(() => null);
    setUser(signedIn);
    setProfile(nextProfile);
    setContact(nextContact);
    return {
      status: nextProfile?.status ?? ('pending' as AccountStatus),
      role: nextProfile?.role ?? ('member' as Role),
    };
  }, []);

  const register = useCallback(async (input: RegisterInput) => {
    const created = await registerMember(input);
    setUser(created);
    await load(created);
  }, [load]);

  const signOutUser = useCallback(async () => {
    await signOutMember();
    setProfile(null);
    setContact(null);
  }, []);

  const resetPassword = useCallback(async (email: string) => {
    await requestPasswordReset(email);
  }, []);

  const refreshProfile = useCallback(async () => {
    if (user) await load(user);
  }, [user, load]);

  const role: Role = profile?.role ?? 'member';
  const status: AccountStatus | 'unknown' = profile?.status ?? (user ? 'pending' : 'unknown');

  const value = useMemo<AuthState>(() => {
    const active = status === 'active';
    return {
      user,
      profile,
      contact,
      role,
      status,
      isStaff: active && STAFF_ROLES.includes(role),
      isAdmin: active && ADMIN_ROLES.includes(role),
      isSuperAdmin: active && role === 'super_admin',
      isApprovedMember: active,
      loading,
      configured: isFirebaseConfigured,
      signIn,
      register,
      signOutUser,
      resetPassword,
      refreshProfile,
    };
  }, [user, profile, contact, role, status, loading, signIn, register, signOutUser, resetPassword, refreshProfile]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
