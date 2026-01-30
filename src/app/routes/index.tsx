import { createBrowserRouter, Navigate } from 'react-router';
import { MainLayout } from '@components/layout/MainLayout';
import { Spinner } from '@components/ui/Spinner';
import { ProtectedRoute } from './ProtectedRoute';
import { PublicRoute } from './PublicRoute';

import { lazy, Suspense } from 'react';

const LoginPage = lazy(() => import('@features/auth/pages/LoginPage'));
const RegisterPage = lazy(() => import('@features/auth/pages/RegisterPage'));
const DashboardPage = lazy(() => import('@features/todos/pages/DashboardPage'));

const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen">
    <Spinner size="lg" />
  </div>
);

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Navigate to="/app" replace />,
  },
  {
    path: '/auth',
    element: <PublicRoute />,
    children: [
      {
        path: 'login',
        element: (
          <Suspense fallback={<PageLoader />}>
            <LoginPage />
          </Suspense>
        ),
      },
      {
        path: 'register',
        element: (
          <Suspense fallback={<PageLoader />}>
            <RegisterPage />
          </Suspense>
        ),
      },
    ],
  },
  {
    path: '/app',
    element: <ProtectedRoute />,
    children: [
      {
        element: <MainLayout />,
        children: [
          {
            index: true,
            element: (
              <Suspense fallback={<PageLoader />}>
                <DashboardPage />
              </Suspense>
            ),
          },
        ],
      },
    ],
  },
  {
    path: '*',
    element: <Navigate to="/" replace />,
  },
]);
