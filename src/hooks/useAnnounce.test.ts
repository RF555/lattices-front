/**
 * Tests for useAnnounce Hook
 *
 * Tests accessibility announcement hook for screen readers.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAnnounce } from './useAnnounce';

describe('useAnnounce', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should create announcer element on mount', () => {
    renderHook(() => useAnnounce());

    const announcer = document.querySelector('[aria-live]');
    expect(announcer).not.toBeNull();
    expect(announcer?.getAttribute('aria-live')).toBe('polite');
    expect(announcer?.getAttribute('aria-atomic')).toBe('true');
  });

  it('should hide announcer visually but keep it accessible', () => {
    renderHook(() => useAnnounce());

    const announcer = document.querySelector('[aria-live]') as HTMLElement;
    expect(announcer).not.toBeNull();
    expect(announcer.className).toContain('absolute');
    expect(announcer.className).toContain('overflow-hidden');
    // Browser normalizes rect() to include px units
    expect(announcer.style.clip).toMatch(/rect\(0(px)?, 0(px)?, 0(px)?, 0(px)?\)/);
  });

  it('should announce messages', () => {
    const { result } = renderHook(() => useAnnounce());

    act(() => {
      result.current('Test announcement');
    });

    // Clear happens immediately
    const announcer = document.querySelector('[aria-live]');
    expect(announcer?.textContent).toBe('');

    // Message appears after timeout
    act(() => {
      vi.advanceTimersByTime(50);
    });

    expect(announcer?.textContent).toBe('Test announcement');
  });

  it('should announce multiple messages sequentially', () => {
    const { result } = renderHook(() => useAnnounce());

    // First message
    act(() => {
      result.current('First message');
      vi.advanceTimersByTime(50);
    });

    const announcer = document.querySelector('[aria-live]');
    expect(announcer?.textContent).toBe('First message');

    // Second message
    act(() => {
      result.current('Second message');
      vi.advanceTimersByTime(50);
    });

    expect(announcer?.textContent).toBe('Second message');
  });

  it('should remove announcer on unmount', () => {
    const { unmount } = renderHook(() => useAnnounce());

    expect(document.querySelector('[aria-live]')).not.toBeNull();

    unmount();

    expect(document.querySelector('[aria-live]')).toBeNull();
  });

  it('should handle rapid announcements', () => {
    const { result } = renderHook(() => useAnnounce());

    act(() => {
      result.current('Message 1');
      result.current('Message 2');
      result.current('Message 3');
      vi.advanceTimersByTime(50);
    });

    // Last message should win
    const announcer = document.querySelector('[aria-live]');
    expect(announcer?.textContent).toBe('Message 3');
  });

  it('should handle empty messages', () => {
    const { result } = renderHook(() => useAnnounce());

    act(() => {
      result.current('');
      vi.advanceTimersByTime(50);
    });

    const announcer = document.querySelector('[aria-live]');
    expect(announcer?.textContent).toBe('');
  });
});
