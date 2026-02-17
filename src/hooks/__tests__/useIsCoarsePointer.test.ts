import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@/test/test-utils';
import { useIsCoarsePointer } from '../useIsCoarsePointer';

describe('useIsCoarsePointer', () => {
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

  it('should return false for fine pointer (desktop mouse)', () => {
    window.matchMedia = mockMatchMedia(false);

    const { result } = renderHook(() => useIsCoarsePointer());
    expect(result.current).toBe(false);
  });

  it('should return true for coarse pointer (touch device)', () => {
    window.matchMedia = mockMatchMedia(true);

    const { result } = renderHook(() => useIsCoarsePointer());
    expect(result.current).toBe(true);
  });

  it('should use the correct media query string', () => {
    const matchMediaSpy = mockMatchMedia(false);
    window.matchMedia = matchMediaSpy;

    renderHook(() => useIsCoarsePointer());

    expect(matchMediaSpy).toHaveBeenCalledWith('(pointer: coarse)');
  });

  it('should update when pointer changes', () => {
    window.matchMedia = mockMatchMedia(false);

    const { result } = renderHook(() => useIsCoarsePointer());
    expect(result.current).toBe(false);

    act(() => {
      currentMatches = true;
      mediaQueryListeners.forEach((listener) => {
        listener({
          matches: true,
          media: '(pointer: coarse)',
        } as MediaQueryListEvent);
      });
    });

    expect(result.current).toBe(true);
  });
});
