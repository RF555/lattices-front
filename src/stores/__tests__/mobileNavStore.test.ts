/**
 * Tests for Mobile Navigation Store
 *
 * Tests Zustand mobile navigation store for managing settings sheet open state.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { useMobileNavStore } from '../mobileNavStore';

describe('mobileNavStore', () => {
  beforeEach(() => {
    // Reset store to initial state before each test
    useMobileNavStore.setState({
      settingsSheetOpen: false,
    });
  });

  describe('Initial State', () => {
    it('should have settingsSheetOpen as false', () => {
      const state = useMobileNavStore.getState();
      expect(state.settingsSheetOpen).toBe(false);
    });
  });

  describe('setSettingsSheetOpen', () => {
    it('should set settingsSheetOpen to true', () => {
      const store = useMobileNavStore.getState();
      store.setSettingsSheetOpen(true);

      const state = useMobileNavStore.getState();
      expect(state.settingsSheetOpen).toBe(true);
    });

    it('should set settingsSheetOpen to false', () => {
      // First set to true
      useMobileNavStore.setState({ settingsSheetOpen: true });

      const store = useMobileNavStore.getState();
      store.setSettingsSheetOpen(false);

      const state = useMobileNavStore.getState();
      expect(state.settingsSheetOpen).toBe(false);
    });

    it('should update state on multiple calls', () => {
      const store = useMobileNavStore.getState();

      store.setSettingsSheetOpen(true);
      expect(useMobileNavStore.getState().settingsSheetOpen).toBe(true);

      store.setSettingsSheetOpen(false);
      expect(useMobileNavStore.getState().settingsSheetOpen).toBe(false);

      store.setSettingsSheetOpen(true);
      expect(useMobileNavStore.getState().settingsSheetOpen).toBe(true);
    });
  });
});
