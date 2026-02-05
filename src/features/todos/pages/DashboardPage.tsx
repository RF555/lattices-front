import { useTranslation } from 'react-i18next';
import { TodoTree } from '../components/TodoTree';
import { CreateTodoForm } from '../components/CreateTodoForm';
import { TodoToolbar } from '../components/TodoToolbar';
import { useMemo } from 'react';
import {
  useActiveWorkspaceId,
  useIsAllWorkspaces,
} from '@features/workspaces/stores/workspaceUiStore';
import { useWorkspaces } from '@features/workspaces/hooks/useWorkspaces';
import { useWorkspaceRealtime } from '@features/workspaces/hooks/useWorkspaceRealtime';
import { useAllWorkspacesRealtime } from '@features/workspaces/hooks/useAllWorkspacesRealtime';
import { usePresence } from '@features/workspaces/hooks/usePresence';
import { OnlineIndicator } from '@features/workspaces/components/OnlineIndicator/OnlineIndicator';
import { ConnectionStatus } from '@features/workspaces/components/ConnectionStatus/ConnectionStatus';

export default function DashboardPage() {
  const { t } = useTranslation(['todos', 'workspaces']);
  const activeWorkspaceId = useActiveWorkspaceId();
  const isAllWorkspaces = useIsAllWorkspaces();
  const { data: workspaces = [] } = useWorkspaces();

  // Stable workspace IDs list for multi-workspace realtime
  const allWorkspaceIds = useMemo(() => workspaces.map((w) => w.id), [workspaces]);

  // Subscribe to realtime: single workspace or all workspaces
  useWorkspaceRealtime(isAllWorkspaces ? null : activeWorkspaceId);
  useAllWorkspacesRealtime(allWorkspaceIds, isAllWorkspaces);
  const { onlineUsers, viewingTask } = usePresence(isAllWorkspaces ? null : activeWorkspaceId);

  return (
    <div className="max-w-4xl mx-auto py-4 sm:py-6 px-4">
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
            {isAllWorkspaces ? t('workspaces:allWorkspaces') : t('todos:dashboard.title')}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {isAllWorkspaces
              ? t('workspaces:allWorkspacesDescription')
              : t('todos:dashboard.subtitle')}
          </p>
        </div>
        {!isAllWorkspaces && (
          <div className="flex items-center gap-3">
            <ConnectionStatus />
            <OnlineIndicator onlineUsers={onlineUsers} />
          </div>
        )}
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
