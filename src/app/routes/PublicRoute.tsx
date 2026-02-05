import { Navigate, Outlet, useLocation } from 'react-router';
import { useIsAuthenticated } from '@features/auth/stores/authStore';

export function PublicRoute() {
  const isAuthenticated = useIsAuthenticated();
  const location = useLocation();
  const from =
    (location.state as { from?: { pathname?: string } } | null)?.from?.pathname ?? '/app';

  if (isAuthenticated) {
    return <Navigate to={from} replace />;
  }

  return <Outlet />;
}
