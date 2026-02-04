import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@/test/test-utils';
import userEvent from '@testing-library/user-event';
import { CreateWorkspaceDialog } from '../CreateWorkspaceDialog/CreateWorkspaceDialog';

const mockMutateAsync = vi.fn();
const mockSetActiveWorkspace = vi.fn();

vi.mock('../../hooks/useWorkspaces', () => ({
  useCreateWorkspace: vi.fn(() => ({
    mutateAsync: mockMutateAsync,
    isPending: false,
  })),
}));

vi.mock('../../stores/workspaceUiStore', () => ({
  useWorkspaceUiStore: vi.fn(() => mockSetActiveWorkspace),
}));

import { useCreateWorkspace } from '../../hooks/useWorkspaces';
const mockUseCreateWorkspace = vi.mocked(useCreateWorkspace);

describe('CreateWorkspaceDialog', () => {
  const mockOnClose = vi.fn();
  const defaultProps = {
    isOpen: true,
    onClose: mockOnClose,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockMutateAsync.mockReset();
    mockUseCreateWorkspace.mockReturnValue({
      mutateAsync: mockMutateAsync,
      isPending: false,
    } as ReturnType<typeof useCreateWorkspace>);
  });

  it('should not render when isOpen is false', () => {
    render(<CreateWorkspaceDialog {...defaultProps} isOpen={false} />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('should render modal with form when isOpen is true', () => {
    render(<CreateWorkspaceDialog {...defaultProps} />);

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByLabelText(/name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /create/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
  });

  it('should show validation error for empty name', async () => {
    const user = userEvent.setup();
    render(<CreateWorkspaceDialog {...defaultProps} />);

    // Submit without entering a name
    await user.click(screen.getByRole('button', { name: /create/i }));

    // Should show validation error from i18n: workspaces:validation.nameRequired
    expect(await screen.findByText(/workspace name is required/i)).toBeInTheDocument();
    expect(mockMutateAsync).not.toHaveBeenCalled();
  });

  it('should show validation error for name exceeding 50 characters', async () => {
    const user = userEvent.setup();
    render(<CreateWorkspaceDialog {...defaultProps} />);

    const longName = 'a'.repeat(51);
    await user.type(screen.getByLabelText(/name/i), longName);
    await user.click(screen.getByRole('button', { name: /create/i }));

    // Should show validation error from i18n: workspaces:validation.nameMaxLength
    expect(await screen.findByText(/50 characters or less/i)).toBeInTheDocument();
    expect(mockMutateAsync).not.toHaveBeenCalled();
  });

  it('should show validation error for description exceeding 200 characters', async () => {
    const user = userEvent.setup();
    render(<CreateWorkspaceDialog {...defaultProps} />);

    await user.type(screen.getByLabelText(/name/i), 'Valid Name');

    // Use paste to avoid slow typing for long text
    const longDescription = 'a'.repeat(201);
    const descriptionInput = screen.getByLabelText(/description/i);
    await user.click(descriptionInput);
    await user.paste(longDescription);

    await user.click(screen.getByRole('button', { name: /create/i }));

    // Should show validation error from i18n: workspaces:validation.descriptionMaxLength
    expect(await screen.findByText(/200 characters or less/i)).toBeInTheDocument();
    expect(mockMutateAsync).not.toHaveBeenCalled();
  });

  it('should call onClose when cancel button clicked', async () => {
    const user = userEvent.setup();
    render(<CreateWorkspaceDialog {...defaultProps} />);

    await user.click(screen.getByRole('button', { name: /cancel/i }));
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('should submit form with name only', async () => {
    const user = userEvent.setup();
    const mockWorkspace = {
      id: 'ws-new',
      name: 'New Workspace',
      slug: 'new-workspace',
      description: null,
      createdBy: 'user-1',
      memberCount: 1,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    };
    mockMutateAsync.mockResolvedValue(mockWorkspace);

    render(<CreateWorkspaceDialog {...defaultProps} />);

    await user.type(screen.getByLabelText(/name/i), 'New Workspace');
    await user.click(screen.getByRole('button', { name: /create/i }));

    await waitFor(() => {
      expect(mockMutateAsync).toHaveBeenCalledWith({
        name: 'New Workspace',
        description: undefined,
      });
    });
  });

  it('should submit form with name and description', async () => {
    const user = userEvent.setup();
    const mockWorkspace = {
      id: 'ws-new',
      name: 'New Workspace',
      slug: 'new-workspace',
      description: 'Test description',
      createdBy: 'user-1',
      memberCount: 1,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    };
    mockMutateAsync.mockResolvedValue(mockWorkspace);

    render(<CreateWorkspaceDialog {...defaultProps} />);

    await user.type(screen.getByLabelText(/name/i), 'New Workspace');
    await user.type(screen.getByLabelText(/description/i), 'Test description');
    await user.click(screen.getByRole('button', { name: /create/i }));

    await waitFor(() => {
      expect(mockMutateAsync).toHaveBeenCalledWith({
        name: 'New Workspace',
        description: 'Test description',
      });
    });
  });

  it('should set active workspace and call onClose on success', async () => {
    const user = userEvent.setup();
    const mockWorkspace = {
      id: 'ws-new',
      name: 'New Workspace',
      slug: 'new-workspace',
      description: null,
      createdBy: 'user-1',
      memberCount: 1,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    };
    mockMutateAsync.mockResolvedValue(mockWorkspace);

    render(<CreateWorkspaceDialog {...defaultProps} />);

    await user.type(screen.getByLabelText(/name/i), 'New Workspace');
    await user.click(screen.getByRole('button', { name: /create/i }));

    await waitFor(() => {
      expect(mockSetActiveWorkspace).toHaveBeenCalledWith('ws-new');
      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  it('should reset form on successful submission', async () => {
    const user = userEvent.setup();
    const mockWorkspace = {
      id: 'ws-new',
      name: 'New Workspace',
      slug: 'new-workspace',
      description: 'Test description',
      createdBy: 'user-1',
      memberCount: 1,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    };
    mockMutateAsync.mockResolvedValue(mockWorkspace);

    const { rerender } = render(<CreateWorkspaceDialog {...defaultProps} />);

    await user.type(screen.getByLabelText(/name/i), 'New Workspace');
    await user.type(screen.getByLabelText(/description/i), 'Test description');
    await user.click(screen.getByRole('button', { name: /create/i }));

    await waitFor(() => {
      expect(mockOnClose).toHaveBeenCalled();
    });

    // Reopen dialog to verify form was reset
    mockOnClose.mockClear();
    rerender(<CreateWorkspaceDialog isOpen={true} onClose={mockOnClose} />);

    expect(screen.getByLabelText(/name/i)).toHaveValue('');
    expect(screen.getByLabelText(/description/i)).toHaveValue('');
  });

  it('should reset form when cancel is clicked', async () => {
    const user = userEvent.setup();
    const { rerender } = render(<CreateWorkspaceDialog {...defaultProps} />);

    await user.type(screen.getByLabelText(/name/i), 'Partial Name');
    await user.click(screen.getByRole('button', { name: /cancel/i }));

    expect(mockOnClose).toHaveBeenCalled();

    // Reopen dialog to verify form was reset
    mockOnClose.mockClear();
    rerender(<CreateWorkspaceDialog isOpen={true} onClose={mockOnClose} />);

    expect(screen.getByLabelText(/name/i)).toHaveValue('');
  });

  it('should show loading state while submitting', () => {
    mockUseCreateWorkspace.mockReturnValue({
      mutateAsync: mockMutateAsync,
      isPending: true,
    } as ReturnType<typeof useCreateWorkspace>);

    render(<CreateWorkspaceDialog {...defaultProps} />);

    // When isPending, Button renders "Loading..." text
    const submitButton = screen.getByRole('button', { name: /loading/i });
    expect(submitButton).toBeInTheDocument();
  });

  it('should not call onClose when submission fails', async () => {
    const user = userEvent.setup();
    mockMutateAsync.mockRejectedValue(new Error('Network error'));

    render(<CreateWorkspaceDialog {...defaultProps} />);

    await user.type(screen.getByLabelText(/name/i), 'New Workspace');
    await user.click(screen.getByRole('button', { name: /create/i }));

    await waitFor(() => {
      expect(mockMutateAsync).toHaveBeenCalled();
    });

    // onClose should not be called on error
    expect(mockOnClose).not.toHaveBeenCalled();
  });
});
