import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Spinner } from '@/components/ui/Spinner';
import { BackendNotice } from './BackendNotice';
import type { Role } from '@/types';

function Loading() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center text-brand-800">
      <Spinner />
    </div>
  );
}

function ConfigMissing() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16">
      <BackendNotice />
    </div>
  );
}

/** Any signed-in account (approved or not). */
export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, loading, configured } = useAuth();
  const location = useLocation();

  if (!configured) return <ConfigMissing />;
  if (loading) return <Loading />;
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  return <>{children}</>;
}

/** Approved members and staff only — pending / suspended accounts are sent to /pending. */
export function ApprovedMemberRoute({ children }: { children: ReactNode }) {
  const { user, status, loading, configured } = useAuth();
  const location = useLocation();

  if (!configured) return <ConfigMissing />;
  if (loading) return <Loading />;
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  if (status !== 'active') return <Navigate to="/pending" replace />;
  return <>{children}</>;
}

/** Staff roles (super_admin, admin, editor). Extra roles can be required per route. */
export function StaffRoute({ children, roles }: { children: ReactNode; roles?: Role[] }) {
  const { user, loading, configured, isStaff, role, isAdmin } = useAuth();
  const location = useLocation();

  if (!configured) return <ConfigMissing />;
  if (loading) return <Loading />;
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  if (!isStaff) return <Navigate to="/portal" replace />;
  if (roles && !roles.includes(role)) return <Navigate to={isAdmin ? '/admin' : '/portal'} replace />;
  return <>{children}</>;
}

/** Signs a pending or suspended member to the right screen. */
export function PendingOnlyRoute({ children }: { children: ReactNode }) {
  const { user, status, loading, configured } = useAuth();

  if (!configured) return <ConfigMissing />;
  if (loading) return <Loading />;
  if (!user) return <Navigate to="/login" replace />;
  if (status === 'active') return <Navigate to="/portal" replace />;
  return <>{children}</>;
}
