import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@/test/test-utils';
import userEvent from '@testing-library/user-event';
import { WorkspaceSwitcher } from '../WorkspaceSwitcher/WorkspaceSwitcher';
import type { Workspace } from '../../types/workspace';

const mockSetActiveWorkspace = vi.fn();

const mockWorkspaces: Workspace[] = [
  {
    id: 'ws-1',
    name: 'Engineering',
    slug: 'engineering',
    description: 'Engineering team workspace',
    createdBy: 'user-1',
    memberCount: 5,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'ws-2',
    name: 'Marketing',
    slug: 'marketing',
    description: null,
    createdBy: 'user-2',
    memberCount: 3,
    createdAt: '2024-01-02T00:00:00Z',
    updatedAt: '2024-01-02T00:00:00Z',
  },
];

vi.mock('../../hooks/useActiveWorkspace', () => ({
  useActiveWorkspace: vi.fn(() => ({
    activeWorkspace: mockWorkspaces[0],
    workspaces: mockWorkspaces,
    setActiveWorkspace: mockSetActiveWorkspace,
    isAllWorkspaces: false,
    isLoading: false,
  })),
}));

import { useActiveWorkspace } from '../../hooks/useActiveWorkspace';
const mockUseActiveWorkspace = vi.mocked(useActiveWorkspace);

describe('WorkspaceSwitcher', () => {
  const mockOnCreateWorkspace = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseActiveWorkspace.mockReturnValue({
      activeWorkspace: mockWorkspaces[0],
      workspaces: mockWorkspaces,
      setActiveWorkspace: mockSetActiveWorkspace,
      isAllWorkspaces: false,
      isLoading: false,
    });
  });

  it('should render the active workspace name', () => {
    render(<WorkspaceSwitcher onCreateWorkspace={mockOnCreateWorkspace} />);
    expect(screen.getByText('Engineering')).toBeInTheDocument();
  });

  it('should show loading skeleton when loading', () => {
    mockUseActiveWorkspace.mockReturnValue({
      activeWorkspace: null,
      workspaces: [],
      setActiveWorkspace: mockSetActiveWorkspace,
      isAllWorkspaces: false,
      isLoading: true,
    });

    render(<WorkspaceSwitcher onCreateWorkspace={mockOnCreateWorkspace} />);
    expect(screen.queryByText('Engineering')).not.toBeInTheDocument();
  });

  it('should show "Select workspace" when no active workspace', () => {
    mockUseActiveWorkspace.mockReturnValue({
      activeWorkspace: null,
      workspaces: mockWorkspaces,
      setActiveWorkspace: mockSetActiveWorkspace,
      isAllWorkspaces: false,
      isLoading: false,
    });

    render(<WorkspaceSwitcher onCreateWorkspace={mockOnCreateWorkspace} />);
    expect(screen.getByText('Select workspace')).toBeInTheDocument();
  });

  it('should open dropdown on click and show workspace list', async () => {
    const user = userEvent.setup();
    render(<WorkspaceSwitcher onCreateWorkspace={mockOnCreateWorkspace} />);

    await user.click(screen.getByRole('button', { expanded: false }));

    expect(screen.getByRole('listbox')).toBeInTheDocument();
    expect(screen.getByRole('option', { name: /engineering/i })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: /marketing/i })).toBeInTheDocument();
  });

  it('should show description for workspaces that have one', async () => {
    const user = userEvent.setup();
    render(<WorkspaceSwitcher onCreateWorkspace={mockOnCreateWorkspace} />);

    await user.click(screen.getByRole('button', { expanded: false }));

    expect(screen.getByText('Engineering team workspace')).toBeInTheDocument();
  });

  it('should switch workspace on selection', async () => {
    const user = userEvent.setup();
    render(<WorkspaceSwitcher onCreateWorkspace={mockOnCreateWorkspace} />);

    await user.click(screen.getByRole('button', { expanded: false }));
    await user.click(screen.getByRole('option', { name: /marketing/i }));

    expect(mockSetActiveWorkspace).toHaveBeenCalledWith('ws-2');
  });

  it('should close dropdown after selecting a workspace', async () => {
    const user = userEvent.setup();
    render(<WorkspaceSwitcher onCreateWorkspace={mockOnCreateWorkspace} />);

    await user.click(screen.getByRole('button', { expanded: false }));
    await user.click(screen.getByRole('option', { name: /marketing/i }));

    await waitFor(() => {
      expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    });
  });

  it('should show create workspace option', async () => {
    const user = userEvent.setup();
    render(<WorkspaceSwitcher onCreateWorkspace={mockOnCreateWorkspace} />);

    await user.click(screen.getByRole('button', { expanded: false }));

    expect(screen.getByText('Create Workspace')).toBeInTheDocument();
  });

  it('should call onCreateWorkspace when create option is clicked', async () => {
    const user = userEvent.setup();
    render(<WorkspaceSwitcher onCreateWorkspace={mockOnCreateWorkspace} />);

    await user.click(screen.getByRole('button', { expanded: false }));
    await user.click(screen.getByText('Create Workspace'));

    expect(mockOnCreateWorkspace).toHaveBeenCalled();
  });

  it('should mark active workspace with aria-selected', async () => {
    const user = userEvent.setup();
    render(<WorkspaceSwitcher onCreateWorkspace={mockOnCreateWorkspace} />);

    await user.click(screen.getByRole('button', { expanded: false }));

    expect(screen.getByRole('option', { name: /engineering/i })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    expect(screen.getByRole('option', { name: /marketing/i })).toHaveAttribute(
      'aria-selected',
      'false',
    );
  });

  it('should close dropdown when Escape is pressed', async () => {
    const user = userEvent.setup();
    render(<WorkspaceSwitcher onCreateWorkspace={mockOnCreateWorkspace} />);

    await user.click(screen.getByRole('button', { expanded: false }));
    expect(screen.getByRole('listbox')).toBeInTheDocument();

    await user.keyboard('{Escape}');

    await waitFor(() => {
      expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    });
  });
});
