/**
 * Tests for Toast Store
 *
 * Tests Zustand store for toast notifications with auto-dismiss functionality.
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { useToastStore, toast } from './toastStore';

describe('toastStore', () => {
  beforeEach(() => {
    // Reset store before each test
    useToastStore.setState({ toasts: [] });
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('Initial State', () => {
    it('should have empty toasts array initially', () => {
      const state = useToastStore.getState();
      expect(state.toasts).toEqual([]);
    });
  });

  describe('addToast', () => {
    it('should add a toast', () => {
      const store = useToastStore.getState();
      store.addToast({ type: 'success', message: 'Test toast' });

      const state = useToastStore.getState();
      expect(state.toasts).toHaveLength(1);
      expect(state.toasts[0].type).toBe('success');
      expect(state.toasts[0].message).toBe('Test toast');
      expect(state.toasts[0].id).toBeDefined();
    });

    it('should generate unique IDs for each toast', () => {
      const store = useToastStore.getState();
      store.addToast({ type: 'success', message: 'Toast 1' });
      store.addToast({ type: 'info', message: 'Toast 2' });

      const state = useToastStore.getState();
      expect(state.toasts).toHaveLength(2);
      expect(state.toasts[0].id).not.toBe(state.toasts[1].id);
    });

    it('should add multiple toasts', () => {
      const store = useToastStore.getState();
      store.addToast({ type: 'success', message: 'Toast 1' });
      store.addToast({ type: 'error', message: 'Toast 2' });
      store.addToast({ type: 'warning', message: 'Toast 3' });

      const state = useToastStore.getState();
      expect(state.toasts).toHaveLength(3);
    });

    it('should auto-dismiss toast after default duration', () => {
      const store = useToastStore.getState();
      store.addToast({ type: 'success', message: 'Auto-dismiss toast' });

      expect(useToastStore.getState().toasts).toHaveLength(1);

      // Fast-forward time by default duration (4000ms)
      vi.advanceTimersByTime(4000);

      expect(useToastStore.getState().toasts).toHaveLength(0);
    });

    it('should auto-dismiss toast after custom duration', () => {
      const store = useToastStore.getState();
      store.addToast({ type: 'success', message: 'Custom duration', duration: 2000 });

      expect(useToastStore.getState().toasts).toHaveLength(1);

      // Fast-forward by 2000ms
      vi.advanceTimersByTime(2000);

      expect(useToastStore.getState().toasts).toHaveLength(0);
    });

    it('should not auto-dismiss when duration is 0', () => {
      const store = useToastStore.getState();
      store.addToast({ type: 'info', message: 'Permanent toast', duration: 0 });

      expect(useToastStore.getState().toasts).toHaveLength(1);

      // Fast-forward a long time
      vi.advanceTimersByTime(10000);

      // Toast should still be there
      expect(useToastStore.getState().toasts).toHaveLength(1);
    });

    it('should auto-dismiss multiple toasts independently', () => {
      const store = useToastStore.getState();
      store.addToast({ type: 'success', message: 'Toast 1', duration: 1000 });
      store.addToast({ type: 'info', message: 'Toast 2', duration: 3000 });

      expect(useToastStore.getState().toasts).toHaveLength(2);

      // After 1000ms, first toast should be dismissed
      vi.advanceTimersByTime(1000);
      expect(useToastStore.getState().toasts).toHaveLength(1);
      expect(useToastStore.getState().toasts[0].message).toBe('Toast 2');

      // After another 2000ms (total 3000ms), second toast should be dismissed
      vi.advanceTimersByTime(2000);
      expect(useToastStore.getState().toasts).toHaveLength(0);
    });
  });

  describe('removeToast', () => {
    it('should remove a toast by ID', () => {
      const store = useToastStore.getState();
      store.addToast({ type: 'success', message: 'Toast to remove' });

      const toastId = useToastStore.getState().toasts[0].id;
      store.removeToast(toastId);

      expect(useToastStore.getState().toasts).toHaveLength(0);
    });

    it('should remove specific toast without affecting others', () => {
      const store = useToastStore.getState();
      store.addToast({ type: 'success', message: 'Toast 1' });
      store.addToast({ type: 'info', message: 'Toast 2' });
      store.addToast({ type: 'warning', message: 'Toast 3' });

      const toasts = useToastStore.getState().toasts;
      const middleToastId = toasts[1].id;

      store.removeToast(middleToastId);

      const remainingToasts = useToastStore.getState().toasts;
      expect(remainingToasts).toHaveLength(2);
      expect(remainingToasts[0].message).toBe('Toast 1');
      expect(remainingToasts[1].message).toBe('Toast 3');
    });

    it('should handle removing non-existent toast gracefully', () => {
      const store = useToastStore.getState();
      store.addToast({ type: 'success', message: 'Toast' });

      store.removeToast('non-existent-id');

      expect(useToastStore.getState().toasts).toHaveLength(1);
    });
  });

  describe('Convenience Functions', () => {
    it('toast.success should add success toast', () => {
      toast.success('Success message');

      const state = useToastStore.getState();
      expect(state.toasts).toHaveLength(1);
      expect(state.toasts[0].type).toBe('success');
      expect(state.toasts[0].message).toBe('Success message');
    });

    it('toast.error should add error toast with extended duration', () => {
      toast.error('Error message');

      const state = useToastStore.getState();
      expect(state.toasts).toHaveLength(1);
      expect(state.toasts[0].type).toBe('error');
      expect(state.toasts[0].message).toBe('Error message');
      expect(state.toasts[0].duration).toBe(6000);
    });

    it('toast.info should add info toast', () => {
      toast.info('Info message');

      const state = useToastStore.getState();
      expect(state.toasts).toHaveLength(1);
      expect(state.toasts[0].type).toBe('info');
      expect(state.toasts[0].message).toBe('Info message');
    });

    it('toast.warning should add warning toast', () => {
      toast.warning('Warning message');

      const state = useToastStore.getState();
      expect(state.toasts).toHaveLength(1);
      expect(state.toasts[0].type).toBe('warning');
      expect(state.toasts[0].message).toBe('Warning message');
    });

    it('should support multiple convenience function calls', () => {
      toast.success('Success');
      toast.error('Error');
      toast.info('Info');
      toast.warning('Warning');

      const state = useToastStore.getState();
      expect(state.toasts).toHaveLength(4);
      expect(state.toasts[0].type).toBe('success');
      expect(state.toasts[1].type).toBe('error');
      expect(state.toasts[2].type).toBe('info');
      expect(state.toasts[3].type).toBe('warning');
    });
  });
});
