import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { STORAGE_KEYS } from '@/constants';

/** Sentinel value: null activeWorkspaceId means "All Workspaces" when explicitly selected. */
export const ALL_WORKSPACES_ID = null;

interface WorkspaceUiState {
  activeWorkspaceId: string | null;
  /** Tracks whether the user has ever explicitly selected a workspace (or "all"). */
  _hasExplicitSelection: boolean;
  sidebarOpen: boolean;
}

interface WorkspaceUiActions {
  setActiveWorkspace: (id: string | null) => void;
  toggleSidebar: () => void;
  clearWorkspace: () => void;
}

type WorkspaceUiStore = WorkspaceUiState & WorkspaceUiActions;

const initialState: WorkspaceUiState = {
  activeWorkspaceId: null,
  _hasExplicitSelection: false,
  sidebarOpen: false,
};

export const useWorkspaceUiStore = create<WorkspaceUiStore>()(
  persist(
    (set) => ({
      ...initialState,

      setActiveWorkspace: (id) => set({ activeWorkspaceId: id, _hasExplicitSelection: true }),

      toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),

      clearWorkspace: () =>
        set({ activeWorkspaceId: null, _hasExplicitSelection: false, sidebarOpen: false }),
    }),
    {
      name: STORAGE_KEYS.WORKSPACE_UI,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        activeWorkspaceId: state.activeWorkspaceId,
        _hasExplicitSelection: state._hasExplicitSelection,
      }),
    },
  ),
);

// Selector hooks
export const useActiveWorkspaceId = () => useWorkspaceUiStore((state) => state.activeWorkspaceId);
export const useSidebarOpen = () => useWorkspaceUiStore((state) => state.sidebarOpen);
export const useIsAllWorkspaces = () =>
  useWorkspaceUiStore((state) => state.activeWorkspaceId === null && state._hasExplicitSelection);
