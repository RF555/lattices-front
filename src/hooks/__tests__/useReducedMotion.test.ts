import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@/test/test-utils';
import { useReducedMotion } from '../useReducedMotion';

describe('useReducedMotion', () => {
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

  it('should return false when user prefers normal motion', () => {
    window.matchMedia = mockMatchMedia(false);

    const { result } = renderHook(() => useReducedMotion());
    expect(result.current).toBe(false);
  });

  it('should return true when user prefers reduced motion', () => {
    window.matchMedia = mockMatchMedia(true);

    const { result } = renderHook(() => useReducedMotion());
    expect(result.current).toBe(true);
  });

  it('should use the correct media query string (prefers-reduced-motion: reduce)', () => {
    const matchMediaSpy = mockMatchMedia(false);
    window.matchMedia = matchMediaSpy;

    renderHook(() => useReducedMotion());

    expect(matchMediaSpy).toHaveBeenCalledWith('(prefers-reduced-motion: reduce)');
  });

  it('should update when user preference changes', () => {
    window.matchMedia = mockMatchMedia(false);

    const { result } = renderHook(() => useReducedMotion());
    expect(result.current).toBe(false);

    act(() => {
      currentMatches = true;
      mediaQueryListeners.forEach((listener) => {
        listener({
          matches: true,
          media: '(prefers-reduced-motion: reduce)',
        } as MediaQueryListEvent);
      });
    });

    expect(result.current).toBe(true);
  });
});
