import { Navigate, Outlet, useLocation } from 'react-router';
import { useIsAuthenticated } from '@features/auth/stores/authStore';

export function PublicRoute() {
  const isAuthenticated = useIsAuthenticated();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/app';

  if (isAuthenticated) {
    return <Navigate to={from} replace />;
  }

  return <Outlet />;
}
