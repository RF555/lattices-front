import { RouterProvider } from 'react-router';
import { QueryProvider } from './providers/QueryProvider';
import { AuthProvider } from './providers/AuthProvider';
import { ErrorBoundary } from '@components/ErrorBoundary';
import { ToastContainer } from '@components/Toast/ToastContainer';
import { ReloadPrompt } from '@components/ReloadPrompt';
import { ColdStartBanner } from '@components/ColdStartBanner';
import { useDirection } from '@hooks/useDirection';
import { router } from './routes';

export function App() {
  useDirection();

  return (
    <ErrorBoundary>
      <QueryProvider>
        <AuthProvider>
          <ColdStartBanner />
          <RouterProvider router={router} />
          <ToastContainer />
          <ReloadPrompt />
        </AuthProvider>
      </QueryProvider>
    </ErrorBoundary>
  );
}
