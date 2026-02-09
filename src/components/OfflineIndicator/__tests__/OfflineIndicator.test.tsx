/**
 * Tests for OfflineIndicator Component
 *
 * Tests the offline status indicator that appears when the network connection is lost.
 * Verifies display, online/offline event handling, and toast notifications.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@/test/test-utils';
import { OfflineIndicator } from '../OfflineIndicator';

// Mock react-i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: {
      resolvedLanguage: 'en',
      changeLanguage: vi.fn(),
    },
  }),
}));

// Mock toast store
vi.mock('@stores/toastStore', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  },
}));

import { toast } from '@stores/toastStore';

describe('OfflineIndicator', () => {
  let originalOnLine: boolean;

  beforeEach(() => {
    // Save original navigator.onLine value
    originalOnLine = navigator.onLine;

    // Clear toast mock
    vi.mocked(toast.success).mockClear();

    // Default to online
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      value: true,
      configurable: true,
    });
  });

  afterEach(() => {
    // Restore original navigator.onLine
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      value: originalOnLine,
      configurable: true,
    });
  });

  it('should return null when navigator.onLine is true (online)', () => {
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      value: true,
      configurable: true,
    });

    const { container } = render(<OfflineIndicator />);
    expect(container.firstChild).toBeNull();
  });

  it('should render banner when navigator.onLine is false (offline)', () => {
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      value: false,
      configurable: true,
    });

    render(<OfflineIndicator />);

    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('should have role="status" and aria-live="polite"', () => {
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      value: false,
      configurable: true,
    });

    render(<OfflineIndicator />);

    const banner = screen.getByRole('status');
    expect(banner).toBeInTheDocument();
    expect(banner).toHaveAttribute('aria-live', 'polite');
  });

  it('should show offline message text', () => {
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      value: false,
      configurable: true,
    });

    render(<OfflineIndicator />);

    expect(screen.getByText('pwa.offline')).toBeInTheDocument();
  });

  it('should show WifiOff icon when offline', () => {
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      value: false,
      configurable: true,
    });

    const { container } = render(<OfflineIndicator />);

    // WifiOff icon is rendered as an SVG
    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
  });

  it('should show banner when offline event is fired', async () => {
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      value: true,
      configurable: true,
    });

    render(<OfflineIndicator />);

    // Initially online, no banner
    expect(screen.queryByRole('status')).not.toBeInTheDocument();

    // Simulate going offline
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      value: false,
      configurable: true,
    });
    window.dispatchEvent(new Event('offline'));

    // Banner should appear
    await waitFor(() => {
      expect(screen.getByRole('status')).toBeInTheDocument();
    });
  });

  it('should hide banner when online event is fired', async () => {
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      value: false,
      configurable: true,
    });

    render(<OfflineIndicator />);

    // Initially offline, banner present
    expect(screen.getByRole('status')).toBeInTheDocument();

    // Simulate going online
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      value: true,
      configurable: true,
    });
    window.dispatchEvent(new Event('online'));

    // Banner should disappear
    await waitFor(() => {
      expect(screen.queryByRole('status')).not.toBeInTheDocument();
    });
  });

  it('should call toast.success when coming back online after being offline', async () => {
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      value: true,
      configurable: true,
    });

    render(<OfflineIndicator />);

    // Go offline first
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      value: false,
      configurable: true,
    });
    window.dispatchEvent(new Event('offline'));

    await waitFor(() => {
      expect(screen.getByRole('status')).toBeInTheDocument();
    });

    // Come back online
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      value: true,
      configurable: true,
    });
    window.dispatchEvent(new Event('online'));

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledTimes(1);
      expect(toast.success).toHaveBeenCalledWith('pwa.backOnline');
    });
  });

  it('should NOT call toast.success when initially online (wasOfflineRef is false)', async () => {
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      value: true,
      configurable: true,
    });

    render(<OfflineIndicator />);

    // Trigger online event without ever going offline
    window.dispatchEvent(new Event('online'));

    // Wait a bit to ensure handler would have fired
    await waitFor(() => {
      expect(toast.success).not.toHaveBeenCalled();
    });
  });

  it('should clean up event listeners on unmount', () => {
    const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');

    const { unmount } = render(<OfflineIndicator />);
    unmount();

    expect(removeEventListenerSpy).toHaveBeenCalledWith('offline', expect.any(Function));
    expect(removeEventListenerSpy).toHaveBeenCalledWith('online', expect.any(Function));

    removeEventListenerSpy.mockRestore();
  });

  it('should have correct styling classes when offline', () => {
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      value: false,
      configurable: true,
    });

    render(<OfflineIndicator />);

    const banner = screen.getByRole('status');
    expect(banner).toHaveClass('bg-amber-50');
    expect(banner).toHaveClass('border-b');
    expect(banner).toHaveClass('border-amber-200');
  });
});
