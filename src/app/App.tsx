import { RouterProvider } from 'react-router';
import { QueryProvider } from './providers/QueryProvider';
import { AuthProvider } from './providers/AuthProvider';
import { ErrorBoundary } from '@components/ErrorBoundary';
import { ToastContainer } from '@components/Toast/ToastContainer';
import { ColdStartBanner } from '@components/ColdStartBanner';
import { router } from './routes';

export function App() {
  return (
    <ErrorBoundary>
      <QueryProvider>
        <AuthProvider>
          <ColdStartBanner />
          <RouterProvider router={router} />
          <ToastContainer />
        </AuthProvider>
      </QueryProvider>
    </ErrorBoundary>
  );
}
