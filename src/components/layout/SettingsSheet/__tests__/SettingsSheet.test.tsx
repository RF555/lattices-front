/**
 * Tests for SettingsSheet Component
 *
 * Tests mobile settings sheet that displays user info, language options, and sign out button.
 * Verifies open/close behavior and content rendering.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@/test/test-utils';
import { SettingsSheet } from '../SettingsSheet';

// Mock dependencies
vi.mock('@features/auth/stores/authStore', () => ({
  useAuthStore: vi.fn(),
}));

vi.mock('@features/workspaces/hooks/useActiveWorkspace', () => ({
  useActiveWorkspace: vi.fn(),
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

import { useAuthStore } from '@features/auth/stores/authStore';
import { useActiveWorkspace } from '@features/workspaces/hooks/useActiveWorkspace';
import { useMobileNavStore } from '@stores/mobileNavStore';

const mockUseAuthStore = vi.mocked(useAuthStore);
const mockUseActiveWorkspace = vi.mocked(useActiveWorkspace);
const mockUseMobileNavStore = vi.mocked(useMobileNavStore);

describe('SettingsSheet', () => {
  const mockUser = {
    id: 'user-1',
    email: 'test@example.com',
    name: 'Test User',
  };

  const mockLogout = vi.fn();
  const mockSetOpen = vi.fn();

  beforeEach(() => {
    // Reset mocks before each test
    mockUseAuthStore.mockImplementation((selector: any) => {
      const state = {
        user: mockUser,
        logout: mockLogout,
      };
      return selector(state);
    });

    mockUseActiveWorkspace.mockReturnValue({
      activeWorkspace: null,
      isAllWorkspaces: true,
      isLoading: false,
      setActiveWorkspace: vi.fn(),
      workspaces: [],
    });

    mockUseMobileNavStore.mockImplementation((selector: any) => {
      const state = {
        settingsSheetOpen: false,
        setSettingsSheetOpen: mockSetOpen,
      };
      return selector(state);
    });

    mockLogout.mockClear();
    mockSetOpen.mockClear();
  });

  describe('Visibility', () => {
    it('should render nothing when closed', () => {
      mockUseMobileNavStore.mockImplementation((selector: any) => {
        const state = {
          settingsSheetOpen: false,
          setSettingsSheetOpen: mockSetOpen,
        };
        return selector(state);
      });

      render(<SettingsSheet />);

      // Component returns null when closed, so dialog should not be in document
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('should render sheet when open', () => {
      mockUseMobileNavStore.mockImplementation((selector: any) => {
        const state = {
          settingsSheetOpen: true,
          setSettingsSheetOpen: mockSetOpen,
        };
        return selector(state);
      });

      render(<SettingsSheet />);

      expect(screen.getByRole('dialog', { name: 'nav.settings' })).toBeInTheDocument();
    });
  });

  describe('User Info Display', () => {
    it('should render user email when open', () => {
      mockUseMobileNavStore.mockImplementation((selector: any) => {
        const state = {
          settingsSheetOpen: true,
          setSettingsSheetOpen: mockSetOpen,
        };
        return selector(state);
      });

      render(<SettingsSheet />);

      expect(screen.getByText('Test User')).toBeInTheDocument();
      expect(screen.getByText('test@example.com')).toBeInTheDocument();
    });

    it('should render only email when user has no name', () => {
      mockUseAuthStore.mockImplementation((selector: any) => {
        const state = {
          user: {
            id: 'user-1',
            email: 'test@example.com',
            name: null,
          },
          logout: mockLogout,
        };
        return selector(state);
      });

      mockUseMobileNavStore.mockImplementation((selector: any) => {
        const state = {
          settingsSheetOpen: true,
          setSettingsSheetOpen: mockSetOpen,
        };
        return selector(state);
      });

      render(<SettingsSheet />);

      expect(screen.getByText('test@example.com')).toBeInTheDocument();
      // Name should not be rendered separately when it's null
      const emailElements = screen.getAllByText('test@example.com');
      expect(emailElements).toHaveLength(1);
    });

    it('should not render user section when user is null', () => {
      mockUseAuthStore.mockImplementation((selector: any) => {
        const state = {
          user: null,
          logout: mockLogout,
        };
        return selector(state);
      });

      mockUseMobileNavStore.mockImplementation((selector: any) => {
        const state = {
          settingsSheetOpen: true,
          setSettingsSheetOpen: mockSetOpen,
        };
        return selector(state);
      });

      render(<SettingsSheet />);

      // User section should not exist
      expect(screen.queryByText('Test User')).not.toBeInTheDocument();
      expect(screen.queryByText('test@example.com')).not.toBeInTheDocument();
    });
  });

  describe('Language Options', () => {
    it('should render English and Hebrew language options when open', () => {
      mockUseMobileNavStore.mockImplementation((selector: any) => {
        const state = {
          settingsSheetOpen: true,
          setSettingsSheetOpen: mockSetOpen,
        };
        return selector(state);
      });

      render(<SettingsSheet />);

      expect(screen.getByRole('button', { name: 'English' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'עברית' })).toBeInTheDocument();
    });

    it('should show English as pressed when current language is en', () => {
      mockUseMobileNavStore.mockImplementation((selector: any) => {
        const state = {
          settingsSheetOpen: true,
          setSettingsSheetOpen: mockSetOpen,
        };
        return selector(state);
      });

      render(<SettingsSheet />);

      const englishButton = screen.getByRole('button', { name: 'English' });
      const hebrewButton = screen.getByRole('button', { name: 'עברית' });

      expect(englishButton).toHaveAttribute('aria-pressed', 'true');
      expect(hebrewButton).toHaveAttribute('aria-pressed', 'false');
    });
  });

  describe('Sign Out Button', () => {
    it('should render sign out button when open', () => {
      mockUseMobileNavStore.mockImplementation((selector: any) => {
        const state = {
          settingsSheetOpen: true,
          setSettingsSheetOpen: mockSetOpen,
        };
        return selector(state);
      });

      render(<SettingsSheet />);

      expect(screen.getByRole('button', { name: 'nav.signOut' })).toBeInTheDocument();
    });

    it('should render sign out button as a button element', () => {
      mockUseMobileNavStore.mockImplementation((selector: any) => {
        const state = {
          settingsSheetOpen: true,
          setSettingsSheetOpen: mockSetOpen,
        };
        return selector(state);
      });

      render(<SettingsSheet />);

      const signOutButton = screen.getByRole('button', { name: 'nav.signOut' });
      expect(signOutButton.tagName).toBe('BUTTON');
    });
  });

  describe('Workspace Settings Link', () => {
    it('should render workspace settings link when active workspace exists', () => {
      mockUseActiveWorkspace.mockReturnValue({
        activeWorkspace: {
          id: 'ws-1',
          name: 'My Workspace',
          slug: 'my-workspace',
          description: null,
          createdBy: 'user-1',
          memberCount: 1,
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
        },
        isAllWorkspaces: false,
        isLoading: false,
        setActiveWorkspace: vi.fn(),
        workspaces: [],
      });

      mockUseMobileNavStore.mockImplementation((selector: any) => {
        const state = {
          settingsSheetOpen: true,
          setSettingsSheetOpen: mockSetOpen,
        };
        return selector(state);
      });

      render(<SettingsSheet />);

      // Language section uses "nav.language", workspace link uses "nav.workspaceSettings"
      expect(screen.getByText('nav.language')).toBeInTheDocument();
      expect(screen.getByText('nav.workspaceSettings')).toBeInTheDocument();
    });

    it('should not render workspace settings link when viewing all workspaces', () => {
      mockUseActiveWorkspace.mockReturnValue({
        activeWorkspace: null,
        isAllWorkspaces: true,
        isLoading: false,
        setActiveWorkspace: vi.fn(),
        workspaces: [],
      });

      mockUseMobileNavStore.mockImplementation((selector: any) => {
        const state = {
          settingsSheetOpen: true,
          setSettingsSheetOpen: mockSetOpen,
        };
        return selector(state);
      });

      render(<SettingsSheet />);

      // Language section label should exist
      expect(screen.getByText('nav.language')).toBeInTheDocument();
      // Workspace settings link should not exist
      expect(screen.queryByText('nav.workspaceSettings')).not.toBeInTheDocument();
    });
  });
});
