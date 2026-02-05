import { Navigate, Outlet, useLocation } from 'react-router';
import { useIsAuthenticated, useAuthLoading, useIsExplicitLogout } from '@features/auth/stores/authStore';

export function ProtectedRoute() {
  const isAuthenticated = useIsAuthenticated();
  const isLoading = useAuthLoading();
  const isExplicitLogout = useIsExplicitLogout();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    if (isExplicitLogout) {
      return <Navigate to="/auth/login" replace />;
    }
    return <Navigate to="/auth/login" state={{ from: location }} replace />;
  }

  return <Outlet />;
}
