import { Navigate, useLocation } from 'react-router-dom';
import type { ReactNode } from 'react';
import { useAuth } from '@/lib/auth';
import { LoadingState } from '@/components/ui';

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <LoadingState message="Loading your workspace..." />;
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}

export function RoleRoute({ children, roles }: { children: ReactNode; roles: string[] }) {
  const { profile, loading } = useAuth();

  if (loading) {
    return <LoadingState message="Checking permissions..." />;
  }

  if (!profile || !roles.includes(profile.role)) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-20 text-center">
        <h2 className="text-xl font-semibold text-navy-800">Not available</h2>
        <p className="text-sm text-navy-500">
          You don't have permission to access this page.
        </p>
      </div>
    );
  }

  return <>{children}</>;
}
