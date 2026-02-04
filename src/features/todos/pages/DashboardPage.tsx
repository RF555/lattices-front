import { useTranslation } from 'react-i18next';
import { TodoTree } from '../components/TodoTree';
import { CreateTodoForm } from '../components/CreateTodoForm';
import { TodoToolbar } from '../components/TodoToolbar';
import { useActiveWorkspaceId } from '@features/workspaces/stores/workspaceUiStore';
import { useWorkspaceRealtime } from '@features/workspaces/hooks/useWorkspaceRealtime';
import { usePresence } from '@features/workspaces/hooks/usePresence';
import { OnlineIndicator } from '@features/workspaces/components/OnlineIndicator/OnlineIndicator';
import { ConnectionStatus } from '@features/workspaces/components/ConnectionStatus/ConnectionStatus';

export default function DashboardPage() {
  const { t } = useTranslation('todos');
  const activeWorkspaceId = useActiveWorkspaceId();

  // Subscribe to realtime changes for the active workspace
  useWorkspaceRealtime(activeWorkspaceId);
  const { onlineUsers, viewingTask } = usePresence(activeWorkspaceId);

  return (
    <div className="max-w-4xl mx-auto py-4 sm:py-6 px-4">
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">{t('dashboard.title')}</h1>
          <p className="text-sm text-gray-500 mt-1">
            {t('dashboard.subtitle')}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <ConnectionStatus />
          <OnlineIndicator onlineUsers={onlineUsers} />
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md border border-gray-100 p-3 sm:p-4 mb-3 sm:mb-4">
        <CreateTodoForm />
      </div>

      <div className="bg-white rounded-lg shadow-md border border-gray-100">
        <TodoToolbar />
        <div className="p-3 sm:p-4">
          <TodoTree viewingTask={viewingTask} />
        </div>
      </div>
    </div>
  );
}
