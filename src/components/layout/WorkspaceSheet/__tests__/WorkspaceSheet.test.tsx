/**
 * Tests for WorkspaceSheet Component
 *
 * Tests mobile workspace switcher sheet that displays workspace list, manage options,
 * and create workspace button. Verifies open/close behavior and content rendering.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@/test/test-utils';
import userEvent from '@testing-library/user-event';
import { WorkspaceSheet } from '../WorkspaceSheet';

// Mock dependencies
vi.mock('@features/workspaces/hooks/useActiveWorkspace', () => ({
  useActiveWorkspace: vi.fn(),
}));

vi.mock('@stores/mobileNavStore', () => ({
  useMobileNavStore: vi.fn(),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

vi.mock('react-router', async () => {
  const actual = await vi.importActual('react-router');
  return {
    ...actual,
    useNavigate: () => vi.fn(),
  };
});

import { useActiveWorkspace } from '@features/workspaces/hooks/useActiveWorkspace';
import { useMobileNavStore } from '@stores/mobileNavStore';

const mockUseActiveWorkspace = vi.mocked(useActiveWorkspace);
const mockUseMobileNavStore = vi.mocked(useMobileNavStore);

describe('WorkspaceSheet', () => {
  const mockWorkspace1 = {
    id: 'ws-1',
    name: 'Engineering',
    slug: 'engineering',
    description: 'Engineering team workspace',
    createdBy: 'user-1',
    memberCount: 5,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  };

  const mockWorkspace2 = {
    id: 'ws-2',
    name: 'Design',
    slug: 'design',
    description: null,
    createdBy: 'user-1',
    memberCount: 3,
    createdAt: '2024-01-02T00:00:00Z',
    updatedAt: '2024-01-02T00:00:00Z',
  };

  const mockSetOpen = vi.fn();
  const mockSetActiveWorkspace = vi.fn();
  const mockOnCreateWorkspace = vi.fn();

  beforeEach(() => {
    // Reset mocks before each test
    mockUseActiveWorkspace.mockReturnValue({
      activeWorkspace: null,
      isAllWorkspaces: true,
      isLoading: false,
      setActiveWorkspace: mockSetActiveWorkspace,
      workspaces: [mockWorkspace1, mockWorkspace2],
    });

    mockUseMobileNavStore.mockImplementation((selector: any) => {
      const state = {
        settingsSheetOpen: false,
        setSettingsSheetOpen: vi.fn(),
        workspaceSwitcherOpen: false,
        setWorkspaceSwitcherOpen: mockSetOpen,
      };
      return selector(state);
    });

    mockSetOpen.mockClear();
    mockSetActiveWorkspace.mockClear();
    mockOnCreateWorkspace.mockClear();
  });

  describe('Visibility', () => {
    it('should render nothing when closed', () => {
      mockUseMobileNavStore.mockImplementation((selector: any) => {
        const state = {
          settingsSheetOpen: false,
          setSettingsSheetOpen: vi.fn(),
          workspaceSwitcherOpen: false,
          setWorkspaceSwitcherOpen: mockSetOpen,
        };
        return selector(state);
      });

      render(<WorkspaceSheet onCreateWorkspace={mockOnCreateWorkspace} />);

      // Component returns null when closed, so dialog should not be in document
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('should render sheet when open', () => {
      mockUseMobileNavStore.mockImplementation((selector: any) => {
        const state = {
          settingsSheetOpen: false,
          setSettingsSheetOpen: vi.fn(),
          workspaceSwitcherOpen: true,
          setWorkspaceSwitcherOpen: mockSetOpen,
        };
        return selector(state);
      });

      render(<WorkspaceSheet onCreateWorkspace={mockOnCreateWorkspace} />);

      expect(screen.getByRole('dialog', { name: 'switchWorkspace' })).toBeInTheDocument();
    });
  });

  describe('All Workspaces Option', () => {
    it('should render All Workspaces option with correct text', () => {
      mockUseMobileNavStore.mockImplementation((selector: any) => {
        const state = {
          settingsSheetOpen: false,
          setSettingsSheetOpen: vi.fn(),
          workspaceSwitcherOpen: true,
          setWorkspaceSwitcherOpen: mockSetOpen,
        };
        return selector(state);
      });

      render(<WorkspaceSheet onCreateWorkspace={mockOnCreateWorkspace} />);

      expect(screen.getByText('allWorkspaces')).toBeInTheDocument();
      expect(screen.getByText('allWorkspacesDescription')).toBeInTheDocument();
    });

    it('should show check mark when All Workspaces is active', () => {
      mockUseActiveWorkspace.mockReturnValue({
        activeWorkspace: null,
        isAllWorkspaces: true,
        isLoading: false,
        setActiveWorkspace: mockSetActiveWorkspace,
        workspaces: [mockWorkspace1, mockWorkspace2],
      });

      mockUseMobileNavStore.mockImplementation((selector: any) => {
        const state = {
          settingsSheetOpen: false,
          setSettingsSheetOpen: vi.fn(),
          workspaceSwitcherOpen: true,
          setWorkspaceSwitcherOpen: mockSetOpen,
        };
        return selector(state);
      });

      render(<WorkspaceSheet onCreateWorkspace={mockOnCreateWorkspace} />);

      // All Workspaces button should have the check icon
      const allWorkspacesButton = screen.getByRole('button', { name: /allWorkspaces/ });
      expect(allWorkspacesButton).toBeInTheDocument();
      // Check that the Check icon is present (via lucide-react Check component)
      const checkIcon = allWorkspacesButton.querySelector('svg');
      expect(checkIcon).toBeInTheDocument();
    });

    it('should not show check mark when a workspace is active', () => {
      mockUseActiveWorkspace.mockReturnValue({
        activeWorkspace: mockWorkspace1,
        isAllWorkspaces: false,
        isLoading: false,
        setActiveWorkspace: mockSetActiveWorkspace,
        workspaces: [mockWorkspace1, mockWorkspace2],
      });

      mockUseMobileNavStore.mockImplementation((selector: any) => {
        const state = {
          settingsSheetOpen: false,
          setSettingsSheetOpen: vi.fn(),
          workspaceSwitcherOpen: true,
          setWorkspaceSwitcherOpen: mockSetOpen,
        };
        return selector(state);
      });

      render(<WorkspaceSheet onCreateWorkspace={mockOnCreateWorkspace} />);

      // All Workspaces button should exist but without bg-gray-50 class (not active)
      const allWorkspacesButton = screen.getByRole('button', { name: /allWorkspaces/ });
      expect(allWorkspacesButton).toBeInTheDocument();
      expect(allWorkspacesButton).not.toHaveClass('bg-gray-50');
    });
  });

  describe('Workspace List', () => {
    it('should render all workspace names', () => {
      mockUseMobileNavStore.mockImplementation((selector: any) => {
        const state = {
          settingsSheetOpen: false,
          setSettingsSheetOpen: vi.fn(),
          workspaceSwitcherOpen: true,
          setWorkspaceSwitcherOpen: mockSetOpen,
        };
        return selector(state);
      });

      render(<WorkspaceSheet onCreateWorkspace={mockOnCreateWorkspace} />);

      expect(screen.getByText('Engineering')).toBeInTheDocument();
      expect(screen.getByText('Design')).toBeInTheDocument();
    });

    it('should render workspace descriptions when available', () => {
      mockUseMobileNavStore.mockImplementation((selector: any) => {
        const state = {
          settingsSheetOpen: false,
          setSettingsSheetOpen: vi.fn(),
          workspaceSwitcherOpen: true,
          setWorkspaceSwitcherOpen: mockSetOpen,
        };
        return selector(state);
      });

      render(<WorkspaceSheet onCreateWorkspace={mockOnCreateWorkspace} />);

      expect(screen.getByText('Engineering team workspace')).toBeInTheDocument();
      // Design workspace has no description, so it should not render
      expect(screen.queryByText('Design workspace')).not.toBeInTheDocument();
    });

    it('should show check mark for active workspace', () => {
      mockUseActiveWorkspace.mockReturnValue({
        activeWorkspace: mockWorkspace1,
        isAllWorkspaces: false,
        isLoading: false,
        setActiveWorkspace: mockSetActiveWorkspace,
        workspaces: [mockWorkspace1, mockWorkspace2],
      });

      mockUseMobileNavStore.mockImplementation((selector: any) => {
        const state = {
          settingsSheetOpen: false,
          setSettingsSheetOpen: vi.fn(),
          workspaceSwitcherOpen: true,
          setWorkspaceSwitcherOpen: mockSetOpen,
        };
        return selector(state);
      });

      render(<WorkspaceSheet onCreateWorkspace={mockOnCreateWorkspace} />);

      // Engineering workspace button should have bg-gray-50 class (active)
      const engineeringButton = screen.getByRole('button', { name: /Engineering/ });
      expect(engineeringButton).toHaveClass('bg-gray-50');

      // Design workspace button should not have bg-gray-50 class (inactive)
      const designButton = screen.getByRole('button', { name: /Design/ });
      expect(designButton).not.toHaveClass('bg-gray-50');
    });

    it('should render workspace buttons as clickable', () => {
      mockUseMobileNavStore.mockImplementation((selector: any) => {
        const state = {
          settingsSheetOpen: false,
          setSettingsSheetOpen: vi.fn(),
          workspaceSwitcherOpen: true,
          setWorkspaceSwitcherOpen: mockSetOpen,
        };
        return selector(state);
      });

      render(<WorkspaceSheet onCreateWorkspace={mockOnCreateWorkspace} />);

      const engineeringButton = screen.getByRole('button', { name: /Engineering/ });
      const designButton = screen.getByRole('button', { name: /Design/ });

      expect(engineeringButton.tagName).toBe('BUTTON');
      expect(designButton.tagName).toBe('BUTTON');
    });
  });

  describe('Manage Section', () => {
    it('should render manage links when workspace is active', () => {
      mockUseActiveWorkspace.mockReturnValue({
        activeWorkspace: mockWorkspace1,
        isAllWorkspaces: false,
        isLoading: false,
        setActiveWorkspace: mockSetActiveWorkspace,
        workspaces: [mockWorkspace1, mockWorkspace2],
      });

      mockUseMobileNavStore.mockImplementation((selector: any) => {
        const state = {
          settingsSheetOpen: false,
          setSettingsSheetOpen: vi.fn(),
          workspaceSwitcherOpen: true,
          setWorkspaceSwitcherOpen: mockSetOpen,
        };
        return selector(state);
      });

      render(<WorkspaceSheet onCreateWorkspace={mockOnCreateWorkspace} />);

      expect(screen.getByText('switcher.manage')).toBeInTheDocument();
      expect(screen.getByText('sidebar.members')).toBeInTheDocument();
      expect(screen.getByText('sidebar.groups')).toBeInTheDocument();
      expect(screen.getByText('sidebar.activity')).toBeInTheDocument();
      expect(screen.getByText('sidebar.settings')).toBeInTheDocument();
    });

    it('should not render manage section when All Workspaces is active', () => {
      mockUseActiveWorkspace.mockReturnValue({
        activeWorkspace: null,
        isAllWorkspaces: true,
        isLoading: false,
        setActiveWorkspace: mockSetActiveWorkspace,
        workspaces: [mockWorkspace1, mockWorkspace2],
      });

      mockUseMobileNavStore.mockImplementation((selector: any) => {
        const state = {
          settingsSheetOpen: false,
          setSettingsSheetOpen: vi.fn(),
          workspaceSwitcherOpen: true,
          setWorkspaceSwitcherOpen: mockSetOpen,
        };
        return selector(state);
      });

      render(<WorkspaceSheet onCreateWorkspace={mockOnCreateWorkspace} />);

      expect(screen.queryByText('switcher.manage')).not.toBeInTheDocument();
      expect(screen.queryByText('sidebar.members')).not.toBeInTheDocument();
      expect(screen.queryByText('sidebar.groups')).not.toBeInTheDocument();
      expect(screen.queryByText('sidebar.activity')).not.toBeInTheDocument();
      expect(screen.queryByText('sidebar.settings')).not.toBeInTheDocument();
    });

    it('should render manage links as buttons', () => {
      mockUseActiveWorkspace.mockReturnValue({
        activeWorkspace: mockWorkspace1,
        isAllWorkspaces: false,
        isLoading: false,
        setActiveWorkspace: mockSetActiveWorkspace,
        workspaces: [mockWorkspace1, mockWorkspace2],
      });

      mockUseMobileNavStore.mockImplementation((selector: any) => {
        const state = {
          settingsSheetOpen: false,
          setSettingsSheetOpen: vi.fn(),
          workspaceSwitcherOpen: true,
          setWorkspaceSwitcherOpen: mockSetOpen,
        };
        return selector(state);
      });

      render(<WorkspaceSheet onCreateWorkspace={mockOnCreateWorkspace} />);

      const membersButton = screen.getByRole('button', { name: 'sidebar.members' });
      const groupsButton = screen.getByRole('button', { name: 'sidebar.groups' });
      const activityButton = screen.getByRole('button', { name: 'sidebar.activity' });
      const settingsButton = screen.getByRole('button', { name: 'sidebar.settings' });

      expect(membersButton.tagName).toBe('BUTTON');
      expect(groupsButton.tagName).toBe('BUTTON');
      expect(activityButton.tagName).toBe('BUTTON');
      expect(settingsButton.tagName).toBe('BUTTON');
    });
  });

  describe('Create Workspace', () => {
    it('should render create workspace button', () => {
      mockUseMobileNavStore.mockImplementation((selector: any) => {
        const state = {
          settingsSheetOpen: false,
          setSettingsSheetOpen: vi.fn(),
          workspaceSwitcherOpen: true,
          setWorkspaceSwitcherOpen: mockSetOpen,
        };
        return selector(state);
      });

      render(<WorkspaceSheet onCreateWorkspace={mockOnCreateWorkspace} />);

      expect(screen.getByRole('button', { name: 'createWorkspace' })).toBeInTheDocument();
    });

    it('should call onCreateWorkspace when create button is clicked', async () => {
      const user = userEvent.setup();

      mockUseMobileNavStore.mockImplementation((selector: any) => {
        const state = {
          settingsSheetOpen: false,
          setSettingsSheetOpen: vi.fn(),
          workspaceSwitcherOpen: true,
          setWorkspaceSwitcherOpen: mockSetOpen,
        };
        return selector(state);
      });

      render(<WorkspaceSheet onCreateWorkspace={mockOnCreateWorkspace} />);

      const createButton = screen.getByRole('button', { name: 'createWorkspace' });
      await user.click(createButton);

      expect(mockOnCreateWorkspace).toHaveBeenCalledTimes(1);
    });

    it('should close sheet when create button is clicked', async () => {
      const user = userEvent.setup();

      mockUseMobileNavStore.mockImplementation((selector: any) => {
        const state = {
          settingsSheetOpen: false,
          setSettingsSheetOpen: vi.fn(),
          workspaceSwitcherOpen: true,
          setWorkspaceSwitcherOpen: mockSetOpen,
        };
        return selector(state);
      });

      render(<WorkspaceSheet onCreateWorkspace={mockOnCreateWorkspace} />);

      const createButton = screen.getByRole('button', { name: 'createWorkspace' });
      await user.click(createButton);

      expect(mockSetOpen).toHaveBeenCalledWith(false);
    });
  });

  describe('Sheet Accessibility', () => {
    it('should have dialog role and aria-label', () => {
      mockUseMobileNavStore.mockImplementation((selector: any) => {
        const state = {
          settingsSheetOpen: false,
          setSettingsSheetOpen: vi.fn(),
          workspaceSwitcherOpen: true,
          setWorkspaceSwitcherOpen: mockSetOpen,
        };
        return selector(state);
      });

      render(<WorkspaceSheet onCreateWorkspace={mockOnCreateWorkspace} />);

      const dialog = screen.getByRole('dialog', { name: 'switchWorkspace' });
      expect(dialog).toHaveAttribute('aria-label', 'switchWorkspace');
    });

    it('should have backdrop button with aria-label', () => {
      mockUseMobileNavStore.mockImplementation((selector: any) => {
        const state = {
          settingsSheetOpen: false,
          setSettingsSheetOpen: vi.fn(),
          workspaceSwitcherOpen: true,
          setWorkspaceSwitcherOpen: mockSetOpen,
        };
        return selector(state);
      });

      const { container } = render(<WorkspaceSheet onCreateWorkspace={mockOnCreateWorkspace} />);

      // Query for backdrop button specifically (not the dialog)
      const backdrop = container.querySelector('button[aria-label="switchWorkspace"]');
      expect(backdrop).toBeInTheDocument();
      expect(backdrop?.tagName).toBe('BUTTON');
    });
  });
});
