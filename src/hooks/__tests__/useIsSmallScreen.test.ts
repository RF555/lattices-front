import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@/test/test-utils';
import { useIsSmallScreen } from '../useIsSmallScreen';

describe('useIsSmallScreen', () => {
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

  it('should return false for large screen (desktop)', () => {
    window.matchMedia = mockMatchMedia(false);

    const { result } = renderHook(() => useIsSmallScreen());
    expect(result.current).toBe(false);
  });

  it('should return true for small screen (mobile viewport)', () => {
    window.matchMedia = mockMatchMedia(true);

    const { result } = renderHook(() => useIsSmallScreen());
    expect(result.current).toBe(true);
  });

  it('should use the correct media query string (max-width: 639px)', () => {
    const matchMediaSpy = mockMatchMedia(false);
    window.matchMedia = matchMediaSpy;

    renderHook(() => useIsSmallScreen());

    expect(matchMediaSpy).toHaveBeenCalledWith('(max-width: 639px)');
  });

  it('should update when viewport size changes', () => {
    window.matchMedia = mockMatchMedia(false);

    const { result } = renderHook(() => useIsSmallScreen());
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
});
