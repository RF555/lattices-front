import { createBrowserRouter, Navigate } from 'react-router';
import { MainLayout } from '@components/layout/MainLayout';
import { Spinner } from '@components/ui/Spinner';
import { ProtectedRoute } from './ProtectedRoute';
import { PublicRoute } from './PublicRoute';

import { lazy, Suspense } from 'react';

const LoginPage = lazy(() => import('@features/auth/pages/LoginPage'));
const RegisterPage = lazy(() => import('@features/auth/pages/RegisterPage'));
const DashboardPage = lazy(() => import('@features/todos/pages/DashboardPage'));
const WorkspaceSettingsPage = lazy(
  () => import('@features/workspaces/pages/WorkspaceSettingsPage')
);
const MembersPage = lazy(() => import('@features/workspaces/pages/MembersPage'));
const ActivityPage = lazy(() => import('@features/workspaces/pages/ActivityPage'));
const GroupsPage = lazy(() => import('@features/workspaces/pages/GroupsPage'));
const GroupDetailPage = lazy(() => import('@features/workspaces/pages/GroupDetailPage'));
const AcceptInvitationPage = lazy(
  () => import('@features/workspaces/pages/AcceptInvitationPage')
);
const NotificationPreferencesPage = lazy(
  () => import('@features/notifications/pages/NotificationPreferencesPage')
);

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
    path: '/invite',
    element: (
      <Suspense fallback={<PageLoader />}>
        <AcceptInvitationPage />
      </Suspense>
    ),
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
          {
            path: 'workspaces/:id/settings',
            element: (
              <Suspense fallback={<PageLoader />}>
                <WorkspaceSettingsPage />
              </Suspense>
            ),
          },
          {
            path: 'workspaces/:id/members',
            element: (
              <Suspense fallback={<PageLoader />}>
                <MembersPage />
              </Suspense>
            ),
          },
          {
            path: 'workspaces/:id/activity',
            element: (
              <Suspense fallback={<PageLoader />}>
                <ActivityPage />
              </Suspense>
            ),
          },
          {
            path: 'workspaces/:id/groups',
            element: (
              <Suspense fallback={<PageLoader />}>
                <GroupsPage />
              </Suspense>
            ),
          },
          {
            path: 'workspaces/:id/groups/:groupId',
            element: (
              <Suspense fallback={<PageLoader />}>
                <GroupDetailPage />
              </Suspense>
            ),
          },
          {
            path: 'settings/notifications',
            element: (
              <Suspense fallback={<PageLoader />}>
                <NotificationPreferencesPage />
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
