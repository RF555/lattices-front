/**
 * Tests for ReloadPrompt Component
 *
 * Tests the PWA update notification prompt that appears when a new service worker is available.
 * Verifies display, reload functionality, and dismiss behavior.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@/test/test-utils';
import userEvent from '@testing-library/user-event';
import { ReloadPrompt } from '../ReloadPrompt';

// Mock the PWA register hook
vi.mock('virtual:pwa-register/react', () => ({
  useRegisterSW: vi.fn(),
}));

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

import { useRegisterSW } from 'virtual:pwa-register/react';

const mockUseRegisterSW = vi.mocked(useRegisterSW);

describe('ReloadPrompt', () => {
  const mockSetNeedRefresh = vi.fn();
  const mockSetOfflineReady = vi.fn();
  const mockUpdateServiceWorker = vi.fn();

  const mockSWReturn = (needRefresh: boolean) => ({
    needRefresh: [needRefresh, mockSetNeedRefresh] as [boolean, typeof mockSetNeedRefresh],
    offlineReady: [false, mockSetOfflineReady] as [boolean, typeof mockSetOfflineReady],
    updateServiceWorker: mockUpdateServiceWorker,
  });

  beforeEach(() => {
    mockSetNeedRefresh.mockClear();
    mockSetOfflineReady.mockClear();
    mockUpdateServiceWorker.mockClear();

    mockUseRegisterSW.mockReturnValue(mockSWReturn(false));
  });

  it('should return null when needRefresh is false', () => {
    const { container } = render(<ReloadPrompt />);
    expect(container.firstChild).toBeNull();
  });

  it('should render alert banner when needRefresh is true', () => {
    mockUseRegisterSW.mockReturnValue(mockSWReturn(true));

    render(<ReloadPrompt />);

    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  it('should show update message text', () => {
    mockUseRegisterSW.mockReturnValue(mockSWReturn(true));

    render(<ReloadPrompt />);

    expect(screen.getByText('pwa.updateAvailable')).toBeInTheDocument();
  });

  it('should render reload and close buttons', () => {
    mockUseRegisterSW.mockReturnValue(mockSWReturn(true));

    render(<ReloadPrompt />);

    expect(screen.getByRole('button', { name: 'actions.reloadPage' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'actions.close' })).toBeInTheDocument();
  });

  it('should call updateServiceWorker(true) when reload button is clicked', async () => {
    mockUseRegisterSW.mockReturnValue(mockSWReturn(true));

    const user = userEvent.setup();
    render(<ReloadPrompt />);

    const reloadButton = screen.getByRole('button', { name: 'actions.reloadPage' });
    await user.click(reloadButton);

    expect(mockUpdateServiceWorker).toHaveBeenCalledTimes(1);
    expect(mockUpdateServiceWorker).toHaveBeenCalledWith(true);
  });

  it('should call setNeedRefresh(false) when close button is clicked', async () => {
    mockUseRegisterSW.mockReturnValue(mockSWReturn(true));

    const user = userEvent.setup();
    render(<ReloadPrompt />);

    const closeButton = screen.getByRole('button', { name: 'actions.close' });
    await user.click(closeButton);

    expect(mockSetNeedRefresh).toHaveBeenCalledTimes(1);
    expect(mockSetNeedRefresh).toHaveBeenCalledWith(false);
  });

  it('should have role="alert" for accessibility', () => {
    mockUseRegisterSW.mockReturnValue(mockSWReturn(true));

    render(<ReloadPrompt />);

    const alert = screen.getByRole('alert');
    expect(alert).toBeInTheDocument();
  });

  it('should have correct z-index class (z-toast)', () => {
    mockUseRegisterSW.mockReturnValue(mockSWReturn(true));

    render(<ReloadPrompt />);

    const alert = screen.getByRole('alert');
    expect(alert).toHaveClass('z-toast');
  });

  it('should position correctly with fixed bottom classes', () => {
    mockUseRegisterSW.mockReturnValue(mockSWReturn(true));

    render(<ReloadPrompt />);

    const alert = screen.getByRole('alert');
    expect(alert).toHaveClass('fixed');
    expect(alert).toHaveClass('bottom-20');
    expect(alert).toHaveClass('sm:bottom-4');
  });
});
