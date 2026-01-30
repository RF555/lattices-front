import { Navigate, Outlet, useLocation } from 'react-router';
import { useIsAuthenticated, useAuthLoading } from '@features/auth/stores/authStore';

export function ProtectedRoute() {
  const isAuthenticated = useIsAuthenticated();
  const isLoading = useAuthLoading();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth/login" state={{ from: location }} replace />;
  }

  return <Outlet />;
}
