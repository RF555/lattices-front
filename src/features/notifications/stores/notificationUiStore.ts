import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface NotificationUiState {
  /** Whether the notification panel dropdown is open */
  panelOpen: boolean;
  /** Whether to show a toast when a new notification arrives via Realtime */
  showToastOnNew: boolean;
  /** Current filter in the panel: 'all' or 'unread' */
  panelFilter: 'all' | 'unread';
}

interface NotificationUiActions {
  setPanelOpen: (open: boolean) => void;
  togglePanel: () => void;
  setShowToastOnNew: (show: boolean) => void;
  setPanelFilter: (filter: 'all' | 'unread') => void;
}

type NotificationUiStore = NotificationUiState & NotificationUiActions;

export const useNotificationUiStore = create<NotificationUiStore>()(
  persist(
    (set) => ({
      panelOpen: false,
      showToastOnNew: true,
      panelFilter: 'all',

      setPanelOpen: (open) => set({ panelOpen: open }),
      togglePanel: () => set((state) => ({ panelOpen: !state.panelOpen })),
      setShowToastOnNew: (show) => set({ showToastOnNew: show }),
      setPanelFilter: (filter) => set({ panelFilter: filter }),
    }),
    {
      name: 'notification-ui-storage',
      storage: createJSONStorage(() => localStorage),
      // Only persist toast preference, not ephemeral panel state
      partialize: (state) => ({
        showToastOnNew: state.showToastOnNew,
      }),
    }
  )
);

// Selector hooks
export const usePanelOpen = () => useNotificationUiStore((state) => state.panelOpen);
export const useShowToastOnNew = () =>
  useNotificationUiStore((state) => state.showToastOnNew);
export const usePanelFilter = () =>
  useNotificationUiStore((state) => state.panelFilter);
