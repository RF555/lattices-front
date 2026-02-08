import { create } from 'zustand';

interface MobileNavState {
  settingsSheetOpen: boolean;
  setSettingsSheetOpen: (open: boolean) => void;
  workspaceSwitcherOpen: boolean;
  setWorkspaceSwitcherOpen: (open: boolean) => void;
}

export const useMobileNavStore = create<MobileNavState>((set) => ({
  settingsSheetOpen: false,
  setSettingsSheetOpen: (open) => {
    set({ settingsSheetOpen: open });
  },
  workspaceSwitcherOpen: false,
  setWorkspaceSwitcherOpen: (open) => {
    set({ workspaceSwitcherOpen: open });
  },
}));
