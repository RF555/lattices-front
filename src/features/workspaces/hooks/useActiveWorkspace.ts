import { useEffect } from 'react';
import { useWorkspaces } from './useWorkspaces';
import { useWorkspaceUiStore } from '../stores/workspaceUiStore';
import type { Workspace } from '../types/workspace';

interface ActiveWorkspaceResult {
  activeWorkspace: Workspace | null;
  setActiveWorkspace: (id: string) => void;
  workspaces: Workspace[];
  isLoading: boolean;
}

export function useActiveWorkspace(): ActiveWorkspaceResult {
  const { data: workspaces = [], isLoading } = useWorkspaces();
  const activeWorkspaceId = useWorkspaceUiStore((s) => s.activeWorkspaceId);
  const setActiveWorkspace = useWorkspaceUiStore((s) => s.setActiveWorkspace);

  // Auto-select first workspace if none is selected or the selected one no longer exists
  useEffect(() => {
    if (isLoading || workspaces.length === 0) return;

    const exists = workspaces.some((w) => w.id === activeWorkspaceId);
    if (!activeWorkspaceId || !exists) {
      setActiveWorkspace(workspaces[0].id);
    }
  }, [workspaces, activeWorkspaceId, isLoading, setActiveWorkspace]);

  const activeWorkspace =
    workspaces.find((w) => w.id === activeWorkspaceId) || null;

  return {
    activeWorkspace,
    setActiveWorkspace,
    workspaces,
    isLoading,
  };
}
