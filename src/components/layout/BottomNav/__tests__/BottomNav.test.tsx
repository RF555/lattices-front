/**
 * Tests for BottomNav Component
 *
 * Tests mobile bottom navigation bar with tabs for Tasks, Workspaces, Notifications, and Settings.
 * Verifies navigation, active state, and notification badge display.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@/test/test-utils';
import { BottomNav } from '../BottomNav';

// Mock dependencies
vi.mock('@features/notifications/hooks/useNotifications', () => ({
  useUnreadCount: vi.fn(),
}));

vi.mock('@stores/mobileNavStore', () => ({
  useMobileNavStore: vi.fn(),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: {
      resolvedLanguage: 'en',
      changeLanguage: vi.fn(),
    },
  }),
}));

import { useUnreadCount } from '@features/notifications/hooks/useNotifications';
import { useMobileNavStore } from '@stores/mobileNavStore';

const mockUseUnreadCount = vi.mocked(useUnreadCount);
const mockUseMobileNavStore = vi.mocked(useMobileNavStore);

describe('BottomNav', () => {
  beforeEach(() => {
    // Reset mocks before each test
    mockUseUnreadCount.mockReturnValue({ data: 0 } as ReturnType<typeof useUnreadCount>);

    mockUseMobileNavStore.mockImplementation((selector: any) => {
      const state = {
        settingsSheetOpen: false,
        setSettingsSheetOpen: vi.fn(),
        workspaceSwitcherOpen: false,
        setWorkspaceSwitcherOpen: vi.fn(),
      };
      return selector(state);
    });
  });

  it('should render 4 navigation tabs with correct labels', () => {
    render(<BottomNav />);

    expect(screen.getByText('nav.tasks')).toBeInTheDocument();
    expect(screen.getByText('nav.workspaces')).toBeInTheDocument();
    expect(screen.getByText('nav.notifications')).toBeInTheDocument();
    expect(screen.getByText('nav.more')).toBeInTheDocument();
  });

  it('should render all navigation tabs as buttons', () => {
    render(<BottomNav />);

    const buttons = screen.getAllByRole('button');
    expect(buttons).toHaveLength(4);
  });

  describe('Notification Badge', () => {
    it('should not show badge when unread count is 0', () => {
      mockUseUnreadCount.mockReturnValue({ data: 0 } as ReturnType<typeof useUnreadCount>);

      render(<BottomNav />);

      // Badge should not be in document
      expect(screen.queryByText('0')).not.toBeInTheDocument();
    });

    it('should show unread count badge when count > 0', () => {
      mockUseUnreadCount.mockReturnValue({ data: 5 } as ReturnType<typeof useUnreadCount>);

      render(<BottomNav />);

      expect(screen.getByText('5')).toBeInTheDocument();
    });

    it('should show 99+ when count > 99', () => {
      mockUseUnreadCount.mockReturnValue({ data: 150 } as ReturnType<typeof useUnreadCount>);

      render(<BottomNav />);

      expect(screen.getByText('99+')).toBeInTheDocument();
    });

    it('should show 99 when count equals 99', () => {
      mockUseUnreadCount.mockReturnValue({ data: 99 } as ReturnType<typeof useUnreadCount>);

      render(<BottomNav />);

      expect(screen.getByText('99')).toBeInTheDocument();
      expect(screen.queryByText('99+')).not.toBeInTheDocument();
    });

    it('should show 100+ when count is 100', () => {
      mockUseUnreadCount.mockReturnValue({ data: 100 } as ReturnType<typeof useUnreadCount>);

      render(<BottomNav />);

      expect(screen.getByText('99+')).toBeInTheDocument();
    });
  });

  describe('Active Tab Highlighting', () => {
    it('should highlight Tasks tab when on /app route', () => {
      render(<BottomNav />, {
        routerProps: { initialEntries: ['/app'] },
      });

      const tasksButton = screen.getByRole('button', { current: 'page' });
      expect(tasksButton).toHaveTextContent('nav.tasks');
    });

    it('should highlight Tasks tab when on /app/todos route', () => {
      render(<BottomNav />, {
        routerProps: { initialEntries: ['/app/todos/123'] },
      });

      const tasksButton = screen.getByRole('button', { current: 'page' });
      expect(tasksButton).toHaveTextContent('nav.tasks');
    });

    it('should highlight Workspaces tab when workspace switcher is open', () => {
      mockUseMobileNavStore.mockImplementation((selector: any) => {
        const state = {
          settingsSheetOpen: false,
          setSettingsSheetOpen: vi.fn(),
          workspaceSwitcherOpen: true,
          setWorkspaceSwitcherOpen: vi.fn(),
        };
        return selector(state);
      });

      render(<BottomNav />, {
        routerProps: { initialEntries: ['/app'] },
      });

      const workspacesButton = screen.getByRole('button', { current: 'page' });
      expect(workspacesButton).toHaveTextContent('nav.workspaces');
    });

    it('should highlight Notifications tab when on /app/notifications route', () => {
      render(<BottomNav />, {
        routerProps: { initialEntries: ['/app/notifications'] },
      });

      const notificationsButton = screen.getByRole('button', { current: 'page' });
      expect(notificationsButton).toHaveTextContent('nav.notifications');
    });

    it('should highlight More tab when settings sheet is open', () => {
      mockUseMobileNavStore.mockImplementation((selector: any) => {
        const state = {
          settingsSheetOpen: true,
          setSettingsSheetOpen: vi.fn(),
          workspaceSwitcherOpen: false,
          setWorkspaceSwitcherOpen: vi.fn(),
        };
        return selector(state);
      });

      render(<BottomNav />, {
        routerProps: { initialEntries: ['/app'] },
      });

      const moreButton = screen.getByRole('button', { current: 'page' });
      expect(moreButton).toHaveTextContent('nav.more');
    });

    it('should not highlight Tasks tab when on notifications route', () => {
      render(<BottomNav />, {
        routerProps: { initialEntries: ['/app/notifications'] },
      });

      // Tasks tab should not be active when on notifications route
      const buttons = screen.getAllByRole('button');
      const tasksButton = buttons.find((btn) => btn.textContent?.includes('nav.tasks'));
      expect(tasksButton).not.toHaveAttribute('aria-current', 'page');
    });

    it('should not highlight Tasks tab when settings sheet is open', () => {
      mockUseMobileNavStore.mockImplementation((selector: any) => {
        const state = {
          settingsSheetOpen: true,
          setSettingsSheetOpen: vi.fn(),
          workspaceSwitcherOpen: false,
          setWorkspaceSwitcherOpen: vi.fn(),
        };
        return selector(state);
      });

      render(<BottomNav />, {
        routerProps: { initialEntries: ['/app'] },
      });

      // Tasks tab should not be active when settings sheet is open
      const buttons = screen.getAllByRole('button');
      const tasksButton = buttons.find((btn) => btn.textContent?.includes('nav.tasks'));
      expect(tasksButton).not.toHaveAttribute('aria-current', 'page');
    });
  });
});
