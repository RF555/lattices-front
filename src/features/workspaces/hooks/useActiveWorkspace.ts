import { useEffect } from 'react';
import { useWorkspaces } from './useWorkspaces';
import { useWorkspaceUiStore } from '../stores/workspaceUiStore';
import type { Workspace } from '../types/workspace';

interface ActiveWorkspaceResult {
  activeWorkspace: Workspace | null;
  setActiveWorkspace: (id: string | null) => void;
  isAllWorkspaces: boolean;
  workspaces: Workspace[];
  isLoading: boolean;
}

export function useActiveWorkspace(): ActiveWorkspaceResult {
  const { data: workspaces = [], isLoading } = useWorkspaces();
  const activeWorkspaceId = useWorkspaceUiStore((s) => s.activeWorkspaceId);
  const hasExplicitSelection = useWorkspaceUiStore((s) => s._hasExplicitSelection);
  const setActiveWorkspace = useWorkspaceUiStore((s) => s.setActiveWorkspace);

  // Auto-select first workspace only if user hasn't explicitly selected anything yet
  useEffect(() => {
    if (isLoading || workspaces.length === 0 || hasExplicitSelection) return;

    setActiveWorkspace(workspaces[0].id);
  }, [workspaces, isLoading, hasExplicitSelection, setActiveWorkspace]);

  // null + explicit selection = "All Workspaces" mode
  const isAllWorkspaces = activeWorkspaceId === null && hasExplicitSelection;

  const activeWorkspace = isAllWorkspaces
    ? null
    : (workspaces.find((w) => w.id === activeWorkspaceId) ?? null);

  return {
    activeWorkspace,
    setActiveWorkspace,
    isAllWorkspaces,
    workspaces,
    isLoading,
  };
}
