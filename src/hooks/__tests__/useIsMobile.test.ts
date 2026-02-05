import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@/test/test-utils';
import { useIsMobile } from '../useIsMobile';

describe('useIsMobile', () => {
  const MOBILE_BREAKPOINT = 640;

  // Store original matchMedia
  const originalMatchMedia = window.matchMedia;

  // Mock matchMedia implementation
  let mediaQueryListeners: Array<(event: MediaQueryListEvent) => void> = [];
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

  it('should return false for desktop widths', () => {
    // Mock desktop width (>= 640px)
    window.matchMedia = mockMatchMedia(false);

    const { result } = renderHook(() => useIsMobile());
    expect(result.current).toBe(false);
  });

  it('should return true for mobile widths', () => {
    // Mock mobile width (< 640px)
    window.matchMedia = mockMatchMedia(true);

    const { result } = renderHook(() => useIsMobile());
    expect(result.current).toBe(true);
  });

  it('should update when window is resized from desktop to mobile', () => {
    // Start with desktop
    window.matchMedia = mockMatchMedia(false);

    const { result } = renderHook(() => useIsMobile());
    expect(result.current).toBe(false);

    // Simulate resize to mobile
    act(() => {
      currentMatches = true;
      mediaQueryListeners.forEach((listener) => {
        listener({ matches: true, media: `(max-width: ${MOBILE_BREAKPOINT - 1}px)` } as MediaQueryListEvent);
      });
    });

    expect(result.current).toBe(true);
  });

  it('should update when window is resized from mobile to desktop', () => {
    // Start with mobile
    window.matchMedia = mockMatchMedia(true);

    const { result } = renderHook(() => useIsMobile());
    expect(result.current).toBe(true);

    // Simulate resize to desktop
    act(() => {
      currentMatches = false;
      mediaQueryListeners.forEach((listener) => {
        listener({ matches: false, media: `(max-width: ${MOBILE_BREAKPOINT - 1}px)` } as MediaQueryListEvent);
      });
    });

    expect(result.current).toBe(false);
  });

  it('should use correct breakpoint query', () => {
    const matchMediaSpy = mockMatchMedia(false);
    window.matchMedia = matchMediaSpy;

    renderHook(() => useIsMobile());

    // Verify the query uses the correct breakpoint (639px = 640 - 1)
    expect(matchMediaSpy).toHaveBeenCalledWith('(max-width: 639px)');
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

    const { unmount } = renderHook(() => useIsMobile());

    expect(addEventListenerSpy).toHaveBeenCalledWith('change', expect.any(Function));

    unmount();

    expect(removeEventListenerSpy).toHaveBeenCalledWith('change', expect.any(Function));
  });

  it('should handle multiple resize events', () => {
    window.matchMedia = mockMatchMedia(false);

    const { result } = renderHook(() => useIsMobile());
    expect(result.current).toBe(false);

    // Resize to mobile
    act(() => {
      currentMatches = true;
      mediaQueryListeners.forEach((listener) => {
        listener({ matches: true, media: `(max-width: ${MOBILE_BREAKPOINT - 1}px)` } as MediaQueryListEvent);
      });
    });
    expect(result.current).toBe(true);

    // Resize back to desktop
    act(() => {
      currentMatches = false;
      mediaQueryListeners.forEach((listener) => {
        listener({ matches: false, media: `(max-width: ${MOBILE_BREAKPOINT - 1}px)` } as MediaQueryListEvent);
      });
    });
    expect(result.current).toBe(false);

    // Resize to mobile again
    act(() => {
      currentMatches = true;
      mediaQueryListeners.forEach((listener) => {
        listener({ matches: true, media: `(max-width: ${MOBILE_BREAKPOINT - 1}px)` } as MediaQueryListEvent);
      });
    });
    expect(result.current).toBe(true);
  });

  it('should initialize with correct state based on initial width', () => {
    // Test desktop initialization
    window.matchMedia = mockMatchMedia(false);
    const { result: desktopResult } = renderHook(() => useIsMobile());
    expect(desktopResult.current).toBe(false);

    // Test mobile initialization
    window.matchMedia = mockMatchMedia(true);
    const { result: mobileResult } = renderHook(() => useIsMobile());
    expect(mobileResult.current).toBe(true);
  });
});
