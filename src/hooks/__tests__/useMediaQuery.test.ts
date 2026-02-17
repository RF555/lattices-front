import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@/test/test-utils';
import { useMediaQuery } from '../useMediaQuery';

describe('useMediaQuery', () => {
  const originalMatchMedia = window.matchMedia;

  let mediaQueryListeners: ((event: MediaQueryListEvent) => void)[] = [];
  let currentMatches = false;

  const mockMatchMedia = (matches: boolean): typeof window.matchMedia => {
    currentMatches = matches;
    return vi.fn((query: string) => ({
      matches: currentMatches,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn((event: string, handler: (e: MediaQueryListEvent) => void) => {
        if (event === 'change') {
          mediaQueryListeners.push(handler);
        }
      }),
      removeEventListener: vi.fn((event: string, handler: (e: MediaQueryListEvent) => void) => {
        if (event === 'change') {
          mediaQueryListeners = mediaQueryListeners.filter((l) => l !== handler);
        }
      }),
      dispatchEvent: vi.fn(),
    })) as unknown as typeof window.matchMedia;
  };

  beforeEach(() => {
    mediaQueryListeners = [];
    currentMatches = false;
  });

  afterEach(() => {
    window.matchMedia = originalMatchMedia;
    mediaQueryListeners = [];
  });

  it('should return false when query does not match', () => {
    window.matchMedia = mockMatchMedia(false);

    const { result } = renderHook(() => useMediaQuery('(max-width: 639px)'));
    expect(result.current).toBe(false);
  });

  it('should return true when query matches', () => {
    window.matchMedia = mockMatchMedia(true);

    const { result } = renderHook(() => useMediaQuery('(max-width: 639px)'));
    expect(result.current).toBe(true);
  });

  it('should update when media query status changes', () => {
    window.matchMedia = mockMatchMedia(false);

    const { result } = renderHook(() => useMediaQuery('(max-width: 639px)'));
    expect(result.current).toBe(false);

    act(() => {
      currentMatches = true;
      mediaQueryListeners.forEach((listener) => {
        listener({
          matches: true,
          media: '(max-width: 639px)',
        } as MediaQueryListEvent);
      });
    });

    expect(result.current).toBe(true);
  });

  it('should clean up event listener on unmount', () => {
    const removeEventListenerSpy = vi.fn();
    const addEventListenerSpy = vi.fn();

    window.matchMedia = vi.fn(() => ({
      matches: false,
      media: '',
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: addEventListenerSpy,
      removeEventListener: removeEventListenerSpy,
      dispatchEvent: vi.fn(),
    })) as unknown as typeof window.matchMedia;

    const { unmount } = renderHook(() => useMediaQuery('(max-width: 639px)'));

    expect(addEventListenerSpy).toHaveBeenCalledWith('change', expect.any(Function));

    unmount();

    expect(removeEventListenerSpy).toHaveBeenCalledWith('change', expect.any(Function));
  });

  it('should pass the correct query string to matchMedia', () => {
    const matchMediaSpy = mockMatchMedia(false);
    window.matchMedia = matchMediaSpy;

    renderHook(() => useMediaQuery('(pointer: coarse)'));

    expect(matchMediaSpy).toHaveBeenCalledWith('(pointer: coarse)');
  });

  it('should resubscribe when query parameter changes', () => {
    const removeEventListenerSpy = vi.fn();
    const addEventListenerSpy = vi.fn();

    window.matchMedia = vi.fn((query: string) => ({
      matches: query === '(pointer: coarse)',
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: addEventListenerSpy,
      removeEventListener: removeEventListenerSpy,
      dispatchEvent: vi.fn(),
    })) as unknown as typeof window.matchMedia;

    const { result, rerender } = renderHook(({ query }) => useMediaQuery(query), {
      initialProps: { query: '(max-width: 639px)' },
    });

    expect(result.current).toBe(false);

    // Change query
    rerender({ query: '(pointer: coarse)' });

    // Should have cleaned up old listener and added new one
    expect(removeEventListenerSpy).toHaveBeenCalled();
    expect(result.current).toBe(true);
  });
});
