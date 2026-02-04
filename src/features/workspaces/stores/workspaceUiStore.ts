import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface WorkspaceUiState {
  activeWorkspaceId: string | null;
  sidebarOpen: boolean;
}

interface WorkspaceUiActions {
  setActiveWorkspace: (id: string) => void;
  toggleSidebar: () => void;
  clearWorkspace: () => void;
}

type WorkspaceUiStore = WorkspaceUiState & WorkspaceUiActions;

const initialState: WorkspaceUiState = {
  activeWorkspaceId: null,
  sidebarOpen: false,
};

export const useWorkspaceUiStore = create<WorkspaceUiStore>()(
  persist(
    (set) => ({
      ...initialState,

      setActiveWorkspace: (id) => set({ activeWorkspaceId: id }),

      toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),

      clearWorkspace: () => set({ activeWorkspaceId: null, sidebarOpen: false }),
    }),
    {
      name: 'workspace-ui-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        activeWorkspaceId: state.activeWorkspaceId,
      }),
    }
  )
);

// Selector hooks
export const useActiveWorkspaceId = () =>
  useWorkspaceUiStore((state) => state.activeWorkspaceId);
export const useSidebarOpen = () =>
  useWorkspaceUiStore((state) => state.sidebarOpen);
