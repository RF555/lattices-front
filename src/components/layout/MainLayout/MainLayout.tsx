import { Outlet } from 'react-router';
import { Grid3X3 } from 'lucide-react';
import { useAuthStore } from '@features/auth/stores/authStore';
import { Button } from '@components/ui/Button';

export function MainLayout() {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <h1 className="flex items-center gap-2 text-xl font-bold tracking-tight text-gray-900">
            <Grid3X3 className="w-5 h-5 text-primary" />
            Lattices
          </h1>
          <div className="flex items-center gap-4">
            {user && (
              <span className="text-sm text-gray-600">
                {user.name || user.email}
              </span>
            )}
            <Button variant="ghost" size="sm" onClick={() => logout()}>
              Sign Out
            </Button>
          </div>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>
    </div>
  );
}
