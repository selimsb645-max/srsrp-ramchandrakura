import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Spinner } from '@/components/ui/Spinner';
import { BackendNotice } from './BackendNotice';

function Loading() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center text-brand-800">
      <Spinner />
    </div>
  );
}

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, loading, configured } = useAuth();
  const location = useLocation();

  if (!configured) return <div className="mx-auto max-w-3xl px-4 py-16"><BackendNotice /></div>;
  if (loading) return <Loading />;
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  return <>{children}</>;
}

export function AdminRoute({ children }: { children: ReactNode }) {
  const { user, isAdmin, loading, configured } = useAuth();
  const location = useLocation();

  if (!configured) return <div className="mx-auto max-w-3xl px-4 py-16"><BackendNotice /></div>;
  if (loading) return <Loading />;
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  if (!isAdmin) return <Navigate to="/portal" replace />;
  return <>{children}</>;
}
