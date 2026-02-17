import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook } from '@/test/test-utils';
import { useIsMobile } from '../useIsMobile';

describe('useIsMobile', () => {
  const originalMatchMedia = window.matchMedia;

  /**
   * Creates a query-aware matchMedia mock.
   * `useIsMobile` calls `useMediaQuery` twice: once for screen size, once for pointer.
   */
  const mockMatchMedia = (queryResults: Record<string, boolean>): typeof window.matchMedia => {
    return vi.fn((query: string) => ({
      matches: queryResults[query] ?? false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })) as unknown as typeof window.matchMedia;
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    window.matchMedia = originalMatchMedia;
  });

  it('should return true only when both small screen AND coarse pointer', () => {
    window.matchMedia = mockMatchMedia({
      '(max-width: 639px)': true,
      '(pointer: coarse)': true,
    });

    const { result } = renderHook(() => useIsMobile());
    expect(result.current).toBe(true);
  });

  it('should return false for narrow desktop window (small screen, fine pointer)', () => {
    window.matchMedia = mockMatchMedia({
      '(max-width: 639px)': true,
      '(pointer: coarse)': false,
    });

    const { result } = renderHook(() => useIsMobile());
    expect(result.current).toBe(false);
  });

  it('should return false for large tablet (large screen, coarse pointer)', () => {
    window.matchMedia = mockMatchMedia({
      '(max-width: 639px)': false,
      '(pointer: coarse)': true,
    });

    const { result } = renderHook(() => useIsMobile());
    expect(result.current).toBe(false);
  });

  it('should return false for desktop (large screen, fine pointer)', () => {
    window.matchMedia = mockMatchMedia({
      '(max-width: 639px)': false,
      '(pointer: coarse)': false,
    });

    const { result } = renderHook(() => useIsMobile());
    expect(result.current).toBe(false);
  });

  it('should check both screen size and pointer media queries', () => {
    const spy = mockMatchMedia({
      '(max-width: 639px)': false,
      '(pointer: coarse)': false,
    });
    window.matchMedia = spy;

    renderHook(() => useIsMobile());

    expect(spy).toHaveBeenCalledWith('(max-width: 639px)');
    expect(spy).toHaveBeenCalledWith('(pointer: coarse)');
  });
});
