import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, act, waitFor, screen } from '@/test/test-utils';
import { usePullToRefresh } from '../usePullToRefresh';
import * as useIsMobileModule from '../useIsMobile';

// Mock useIsMobile
vi.mock('../useIsMobile', () => ({
  useIsMobile: vi.fn(),
}));

// Test component that uses the hook
function TestComponent({ onRefresh }: { onRefresh: () => Promise<void> | void }) {
  const { containerRef, isPulling, isRefreshing, pullProgress } = usePullToRefresh({ onRefresh });

  return (
    <div ref={containerRef} data-testid="container">
      <div data-testid="is-pulling">{String(isPulling)}</div>
      <div data-testid="is-refreshing">{String(isRefreshing)}</div>
      <div data-testid="pull-progress">{pullProgress}</div>
    </div>
  );
}

describe('usePullToRefresh', () => {
  const mockOnRefresh = vi.fn();

  beforeEach(() => {
    mockOnRefresh.mockClear();
    mockOnRefresh.mockResolvedValue(undefined);
    vi.mocked(useIsMobileModule.useIsMobile).mockReturnValue(true);
  });

  it('should return correct initial state', () => {
    render(<TestComponent onRefresh={mockOnRefresh} />);

    expect(screen.getByTestId('is-pulling')).toHaveTextContent('false');
    expect(screen.getByTestId('is-refreshing')).toHaveTextContent('false');
    expect(screen.getByTestId('pull-progress')).toHaveTextContent('0');
  });

  it('should not activate touch events on desktop', () => {
    vi.mocked(useIsMobileModule.useIsMobile).mockReturnValue(false);

    render(<TestComponent onRefresh={mockOnRefresh} />);
    const container = screen.getByTestId('container');

    // Create and dispatch touch events
    const touchStart = new TouchEvent('touchstart', {
      touches: [{ clientY: 100 } as Touch],
      bubbles: true,
    });

    act(() => {
      container.dispatchEvent(touchStart);
    });

    const touchMove = new TouchEvent('touchmove', {
      touches: [{ clientY: 180 } as Touch],
      cancelable: true,
      bubbles: true,
    });

    act(() => {
      container.dispatchEvent(touchMove);
    });

    // Should remain in initial state since it's desktop
    expect(screen.getByTestId('is-pulling')).toHaveTextContent('false');
    expect(screen.getByTestId('pull-progress')).toHaveTextContent('0');
  });

  it('should set isPulling when touch moves down from top', () => {
    render(<TestComponent onRefresh={mockOnRefresh} />);
    const container = screen.getByTestId('container');

    // Touch start at 100px
    const touchStart = new TouchEvent('touchstart', {
      touches: [{ clientY: 100 } as Touch],
      bubbles: true,
    });

    act(() => {
      container.dispatchEvent(touchStart);
    });

    // Touch move to 180px (80px down, resistance = 40px)
    const touchMove = new TouchEvent('touchmove', {
      touches: [{ clientY: 180 } as Touch],
      cancelable: true,
      bubbles: true,
    });

    act(() => {
      container.dispatchEvent(touchMove);
    });

    expect(screen.getByTestId('is-pulling')).toHaveTextContent('true');
    const progress = parseFloat(screen.getByTestId('pull-progress').textContent ?? '0');
    expect(progress).toBeGreaterThan(0);
  });

  it('should apply resistance factor of 0.5x to pull distance', () => {
    render(<TestComponent onRefresh={mockOnRefresh} />);
    const container = screen.getByTestId('container');

    // Touch start at 100px
    const touchStart = new TouchEvent('touchstart', {
      touches: [{ clientY: 100 } as Touch],
      bubbles: true,
    });

    act(() => {
      container.dispatchEvent(touchStart);
    });

    // Touch move to 220px (120px down, resistance = 60px = threshold)
    const touchMove = new TouchEvent('touchmove', {
      touches: [{ clientY: 220 } as Touch],
      cancelable: true,
      bubbles: true,
    });

    act(() => {
      container.dispatchEvent(touchMove);
    });

    // At 60px pull distance (120px * 0.5), progress should be 1.0 (60 / 60 threshold)
    expect(screen.getByTestId('pull-progress')).toHaveTextContent('1');
  });

  it('should cap pull distance at MAX_PULL (120px)', () => {
    render(<TestComponent onRefresh={mockOnRefresh} />);
    const container = screen.getByTestId('container');

    const touchStart = new TouchEvent('touchstart', {
      touches: [{ clientY: 100 } as Touch],
      bubbles: true,
    });

    act(() => {
      container.dispatchEvent(touchStart);
    });

    // Touch move to 500px (400px down, would be 200px after resistance, but capped at 120px)
    const touchMove = new TouchEvent('touchmove', {
      touches: [{ clientY: 500 } as Touch],
      cancelable: true,
      bubbles: true,
    });

    act(() => {
      container.dispatchEvent(touchMove);
    });

    // Progress should still cap at 1.0 even though we pulled way past threshold
    expect(screen.getByTestId('pull-progress')).toHaveTextContent('1');
  });

  it('should calculate pullProgress as min(pullDistance / PULL_THRESHOLD, 1)', () => {
    render(<TestComponent onRefresh={mockOnRefresh} />);
    const container = screen.getByTestId('container');

    const touchStart = new TouchEvent('touchstart', {
      touches: [{ clientY: 100 } as Touch],
      bubbles: true,
    });

    act(() => {
      container.dispatchEvent(touchStart);
    });

    // Touch move to 160px (60px down, resistance = 30px pull distance)
    // Progress = 30 / 60 = 0.5
    const touchMove = new TouchEvent('touchmove', {
      touches: [{ clientY: 160 } as Touch],
      cancelable: true,
      bubbles: true,
    });

    act(() => {
      container.dispatchEvent(touchMove);
    });

    expect(screen.getByTestId('pull-progress')).toHaveTextContent('0.5');
  });

  it('should trigger onRefresh when released past threshold', async () => {
    render(<TestComponent onRefresh={mockOnRefresh} />);
    const container = screen.getByTestId('container');

    const touchStart = new TouchEvent('touchstart', {
      touches: [{ clientY: 100 } as Touch],
      bubbles: true,
    });

    act(() => {
      container.dispatchEvent(touchStart);
    });

    // Touch move to 220px (120px down, 60px after resistance = threshold)
    const touchMove = new TouchEvent('touchmove', {
      touches: [{ clientY: 220 } as Touch],
      cancelable: true,
      bubbles: true,
    });

    act(() => {
      container.dispatchEvent(touchMove);
    });

    // Release touch
    const touchEnd = new TouchEvent('touchend', { bubbles: true });

    await act(async () => {
      container.dispatchEvent(touchEnd);
      // Wait for onRefresh to complete
      await Promise.resolve();
    });

    expect(mockOnRefresh).toHaveBeenCalledTimes(1);
  });

  it('should set isRefreshing during refresh and reset after', async () => {
    let resolveRefresh: () => void;
    const refreshPromise = new Promise<void>((resolve) => {
      resolveRefresh = resolve;
    });
    mockOnRefresh.mockReturnValue(refreshPromise);

    render(<TestComponent onRefresh={mockOnRefresh} />);
    const container = screen.getByTestId('container');

    const touchStart = new TouchEvent('touchstart', {
      touches: [{ clientY: 100 } as Touch],
      bubbles: true,
    });

    act(() => {
      container.dispatchEvent(touchStart);
    });

    const touchMove = new TouchEvent('touchmove', {
      touches: [{ clientY: 220 } as Touch],
      cancelable: true,
      bubbles: true,
    });

    act(() => {
      container.dispatchEvent(touchMove);
    });

    const touchEnd = new TouchEvent('touchend', { bubbles: true });

    act(() => {
      container.dispatchEvent(touchEnd);
    });

    // Should be refreshing immediately
    await waitFor(() => {
      expect(screen.getByTestId('is-refreshing')).toHaveTextContent('true');
    });

    // Resolve refresh
    await act(async () => {
      resolveRefresh!();
      await refreshPromise;
    });

    // Should no longer be refreshing
    await waitFor(() => {
      expect(screen.getByTestId('is-refreshing')).toHaveTextContent('false');
    });
  });

  it('should not trigger refresh when released below threshold', async () => {
    render(<TestComponent onRefresh={mockOnRefresh} />);
    const container = screen.getByTestId('container');

    const touchStart = new TouchEvent('touchstart', {
      touches: [{ clientY: 100 } as Touch],
      bubbles: true,
    });

    act(() => {
      container.dispatchEvent(touchStart);
    });

    // Touch move to 150px (50px down, 25px after resistance = below 60px threshold)
    const touchMove = new TouchEvent('touchmove', {
      touches: [{ clientY: 150 } as Touch],
      cancelable: true,
      bubbles: true,
    });

    act(() => {
      container.dispatchEvent(touchMove);
    });

    const touchEnd = new TouchEvent('touchend', { bubbles: true });

    await act(async () => {
      container.dispatchEvent(touchEnd);
      await Promise.resolve();
    });

    expect(mockOnRefresh).not.toHaveBeenCalled();
    expect(screen.getByTestId('is-pulling')).toHaveTextContent('false');
    expect(screen.getByTestId('pull-progress')).toHaveTextContent('0');
  });

  it('should not pull when scrollTop > 0', () => {
    render(<TestComponent onRefresh={mockOnRefresh} />);
    const container = screen.getByTestId('container');
    Object.defineProperty(container, 'scrollTop', {
      value: 50,
      writable: true,
      configurable: true,
    });

    const touchStart = new TouchEvent('touchstart', {
      touches: [{ clientY: 100 } as Touch],
      bubbles: true,
    });

    act(() => {
      container.dispatchEvent(touchStart);
    });

    const touchMove = new TouchEvent('touchmove', {
      touches: [{ clientY: 180 } as Touch],
      cancelable: true,
      bubbles: true,
    });

    act(() => {
      container.dispatchEvent(touchMove);
    });

    // Should not pull because scrollTop > 0
    expect(screen.getByTestId('is-pulling')).toHaveTextContent('false');
    expect(screen.getByTestId('pull-progress')).toHaveTextContent('0');
  });

  it('should not pull when already refreshing', async () => {
    let resolveRefresh: () => void;
    const refreshPromise = new Promise<void>((resolve) => {
      resolveRefresh = resolve;
    });
    mockOnRefresh.mockReturnValue(refreshPromise);

    render(<TestComponent onRefresh={mockOnRefresh} />);
    const container = screen.getByTestId('container');

    // First pull to trigger refresh
    const touchStart1 = new TouchEvent('touchstart', {
      touches: [{ clientY: 100 } as Touch],
      bubbles: true,
    });

    act(() => {
      container.dispatchEvent(touchStart1);
    });

    const touchMove1 = new TouchEvent('touchmove', {
      touches: [{ clientY: 220 } as Touch],
      cancelable: true,
      bubbles: true,
    });

    act(() => {
      container.dispatchEvent(touchMove1);
    });

    const touchEnd1 = new TouchEvent('touchend', { bubbles: true });

    act(() => {
      container.dispatchEvent(touchEnd1);
    });

    // Wait for refreshing state
    await waitFor(() => {
      expect(screen.getByTestId('is-refreshing')).toHaveTextContent('true');
    });

    // Now try to pull again while still refreshing
    const touchStart2 = new TouchEvent('touchstart', {
      touches: [{ clientY: 100 } as Touch],
      bubbles: true,
    });

    act(() => {
      container.dispatchEvent(touchStart2);
    });

    const touchMove2 = new TouchEvent('touchmove', {
      touches: [{ clientY: 180 } as Touch],
      cancelable: true,
      bubbles: true,
    });

    act(() => {
      container.dispatchEvent(touchMove2);
    });

    // Should not allow pulling while refreshing
    expect(screen.getByTestId('is-refreshing')).toHaveTextContent('true');

    // Clean up
    act(() => {
      resolveRefresh!();
    });
  });

  it('should reset pull state after refresh completes', async () => {
    render(<TestComponent onRefresh={mockOnRefresh} />);
    const container = screen.getByTestId('container');

    const touchStart = new TouchEvent('touchstart', {
      touches: [{ clientY: 100 } as Touch],
      bubbles: true,
    });

    act(() => {
      container.dispatchEvent(touchStart);
    });

    const touchMove = new TouchEvent('touchmove', {
      touches: [{ clientY: 220 } as Touch],
      cancelable: true,
      bubbles: true,
    });

    act(() => {
      container.dispatchEvent(touchMove);
    });

    const touchEnd = new TouchEvent('touchend', { bubbles: true });

    await act(async () => {
      container.dispatchEvent(touchEnd);
      await Promise.resolve();
    });

    // After refresh completes, all state should be reset
    await waitFor(() => {
      expect(screen.getByTestId('is-pulling')).toHaveTextContent('false');
      expect(screen.getByTestId('is-refreshing')).toHaveTextContent('false');
      expect(screen.getByTestId('pull-progress')).toHaveTextContent('0');
    });
  });
});
