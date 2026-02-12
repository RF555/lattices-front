import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@/test/test-utils';
import userEvent from '@testing-library/user-event';
import { InviteMemberDialog } from '../InviteMemberDialog/InviteMemberDialog';
import type { InvitationCreatedResult } from '@features/workspaces/types/workspace';

const mockMutateAsync = vi.fn();
vi.mock('@features/workspaces/hooks/useInvitations', () => ({
  useCreateInvitation: vi.fn(() => ({
    mutateAsync: mockMutateAsync,
    isPending: false,
  })),
}));

import { useCreateInvitation } from '@features/workspaces/hooks/useInvitations';
const mockUseCreateInvitation = vi.mocked(useCreateInvitation);

describe('InviteMemberDialog', () => {
  const mockOnClose = vi.fn();
  const defaultProps = {
    isOpen: true,
    onClose: mockOnClose,
    workspaceId: 'ws-1',
  };

  const mockCreatedResult: InvitationCreatedResult = {
    invitation: {
      id: 'inv-1',
      workspaceId: 'ws-1',
      workspaceName: 'Test Workspace',
      email: 'test@example.com',
      role: 'member',
      invitedByName: 'Admin User',
      status: 'pending',
      createdAt: '2026-01-01T00:00:00Z',
      expiresAt: '2026-01-08T00:00:00Z',
    },
    token: 'raw-secret-token-abc123',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockMutateAsync.mockReset();
    mockUseCreateInvitation.mockReturnValue({
      mutateAsync: mockMutateAsync,
      isPending: false,
    } as unknown as ReturnType<typeof useCreateInvitation>);
  });

  // --- Form rendering ---

  it('should render when isOpen is true', () => {
    render(<InviteMemberDialog {...defaultProps} />);

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/role/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /send/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
  });

  it('should not render when isOpen is false', () => {
    render(<InviteMemberDialog {...defaultProps} isOpen={false} />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('should default to member role', () => {
    render(<InviteMemberDialog {...defaultProps} />);
    const roleSelect = screen.getByLabelText(/role/i);
    expect((roleSelect as HTMLSelectElement).value).toBe('member');
  });

  it('should allow changing role', async () => {
    const user = userEvent.setup();
    render(<InviteMemberDialog {...defaultProps} />);

    const roleSelect = screen.getByLabelText(/role/i);
    await user.selectOptions(roleSelect, 'admin');
    expect((roleSelect as HTMLSelectElement).value).toBe('admin');
  });

  it('should have all role options (viewer, member, admin)', () => {
    render(<InviteMemberDialog {...defaultProps} />);
    const roleSelect = screen.getByLabelText(/role/i);
    const options = Array.from(roleSelect.querySelectorAll('option')).map((opt) =>
      opt.getAttribute('value'),
    );
    expect(options).toContain('viewer');
    expect(options).toContain('member');
    expect(options).toContain('admin');
  });

  // --- Form validation ---

  it('should show validation error for invalid email', async () => {
    const user = userEvent.setup();
    render(<InviteMemberDialog {...defaultProps} />);

    await user.type(screen.getByLabelText(/email/i), 'bad@x');
    await user.click(screen.getByRole('button', { name: /send/i }));

    expect(await screen.findByText(/valid email/i)).toBeInTheDocument();
    expect(mockMutateAsync).not.toHaveBeenCalled();
  });

  it('should prevent submission with empty email', async () => {
    const user = userEvent.setup();
    render(<InviteMemberDialog {...defaultProps} />);

    await user.click(screen.getByRole('button', { name: /send/i }));
    expect(mockMutateAsync).not.toHaveBeenCalled();
  });

  // --- Successful submission: invite link display ---

  it('should call mutateAsync with correct params on submit', async () => {
    const user = userEvent.setup();
    mockMutateAsync.mockResolvedValue(mockCreatedResult);
    render(<InviteMemberDialog {...defaultProps} />);

    await user.type(screen.getByLabelText(/email/i), 'newuser@example.com');
    await user.selectOptions(screen.getByLabelText(/role/i), 'admin');
    await user.click(screen.getByRole('button', { name: /send/i }));

    await waitFor(() => {
      expect(mockMutateAsync).toHaveBeenCalledWith({
        workspaceId: 'ws-1',
        email: 'newuser@example.com',
        role: 'admin',
      });
    });
  });

  it('should show invite link after successful creation instead of closing', async () => {
    const user = userEvent.setup();
    mockMutateAsync.mockResolvedValue(mockCreatedResult);
    render(<InviteMemberDialog {...defaultProps} />);

    await user.type(screen.getByLabelText(/email/i), 'test@example.com');
    await user.click(screen.getByRole('button', { name: /send/i }));

    // Dialog should stay open and show the link
    await waitFor(() => {
      expect(screen.getByText(/raw-secret-token-abc123/)).toBeInTheDocument();
    });

    // Should NOT have called onClose yet
    expect(mockOnClose).not.toHaveBeenCalled();
  });

  it('should display the correct invite URL format', async () => {
    const user = userEvent.setup();
    mockMutateAsync.mockResolvedValue(mockCreatedResult);
    render(<InviteMemberDialog {...defaultProps} />);

    await user.type(screen.getByLabelText(/email/i), 'test@example.com');
    await user.click(screen.getByRole('button', { name: /send/i }));

    await waitFor(() => {
      // The link should contain the origin + /invite?token=<token>
      expect(screen.getByText(/\/invite\?token=raw-secret-token-abc123/)).toBeInTheDocument();
    });
  });

  it('should show Copy button in link display state', async () => {
    const user = userEvent.setup();
    mockMutateAsync.mockResolvedValue(mockCreatedResult);
    render(<InviteMemberDialog {...defaultProps} />);

    await user.type(screen.getByLabelText(/email/i), 'test@example.com');
    await user.click(screen.getByRole('button', { name: /send/i }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /copy/i })).toBeInTheDocument();
    });
  });

  it('should show Done button in link display state', async () => {
    const user = userEvent.setup();
    mockMutateAsync.mockResolvedValue(mockCreatedResult);
    render(<InviteMemberDialog {...defaultProps} />);

    await user.type(screen.getByLabelText(/email/i), 'test@example.com');
    await user.click(screen.getByRole('button', { name: /send/i }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /done/i })).toBeInTheDocument();
    });
  });

  it('should call onClose when Done button is clicked in link display state', async () => {
    const user = userEvent.setup();
    mockMutateAsync.mockResolvedValue(mockCreatedResult);
    render(<InviteMemberDialog {...defaultProps} />);

    await user.type(screen.getByLabelText(/email/i), 'test@example.com');
    await user.click(screen.getByRole('button', { name: /send/i }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /done/i })).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /done/i }));
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('should copy invite link to clipboard when Copy button is clicked', async () => {
    const user = userEvent.setup();
    const writeTextMock = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: writeTextMock },
      writable: true,
      configurable: true,
    });

    mockMutateAsync.mockResolvedValue(mockCreatedResult);
    render(<InviteMemberDialog {...defaultProps} />);

    await user.type(screen.getByLabelText(/email/i), 'test@example.com');
    await user.click(screen.getByRole('button', { name: /send/i }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /copy/i })).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /copy/i }));

    expect(writeTextMock).toHaveBeenCalledWith(expect.stringContaining('raw-secret-token-abc123'));
  });

  it('should show "Copied" feedback after copying link', async () => {
    const user = userEvent.setup();
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: vi.fn().mockResolvedValue(undefined) },
      writable: true,
      configurable: true,
    });

    mockMutateAsync.mockResolvedValue(mockCreatedResult);
    render(<InviteMemberDialog {...defaultProps} />);

    await user.type(screen.getByLabelText(/email/i), 'test@example.com');
    await user.click(screen.getByRole('button', { name: /send/i }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /copy/i })).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /copy/i }));

    await waitFor(() => {
      expect(screen.getByText(/copied/i)).toBeInTheDocument();
    });
  });

  // --- Error handling ---

  it('should show error message when submission fails', async () => {
    const user = userEvent.setup();
    mockMutateAsync.mockRejectedValue(new Error('Failed to send invitation'));
    render(<InviteMemberDialog {...defaultProps} />);

    await user.type(screen.getByLabelText(/email/i), 'test@example.com');
    await user.click(screen.getByRole('button', { name: /send/i }));

    expect(await screen.findByText('Failed to send invitation')).toBeInTheDocument();
  });

  it('should show generic error for non-Error exceptions', async () => {
    const user = userEvent.setup();
    mockMutateAsync.mockRejectedValue('Unknown error');
    render(<InviteMemberDialog {...defaultProps} />);

    await user.type(screen.getByLabelText(/email/i), 'test@example.com');
    await user.click(screen.getByRole('button', { name: /send/i }));

    expect(await screen.findByText('Failed to send invitation')).toBeInTheDocument();
  });

  it('should not call onClose when submission fails', async () => {
    const user = userEvent.setup();
    mockMutateAsync.mockRejectedValue(new Error('Network error'));
    render(<InviteMemberDialog {...defaultProps} />);

    await user.type(screen.getByLabelText(/email/i), 'test@example.com');
    await user.click(screen.getByRole('button', { name: /send/i }));

    await waitFor(() => {
      expect(screen.getByText('Network error')).toBeInTheDocument();
    });
    expect(mockOnClose).not.toHaveBeenCalled();
  });

  // --- Cancel / close ---

  it('should call onClose when cancel is clicked', async () => {
    const user = userEvent.setup();
    render(<InviteMemberDialog {...defaultProps} />);

    await user.click(screen.getByRole('button', { name: /cancel/i }));
    expect(mockOnClose).toHaveBeenCalled();
  });

  // --- Loading state ---

  it('should keep submit button visible when pending', () => {
    mockUseCreateInvitation.mockReturnValue({
      mutateAsync: mockMutateAsync,
      isPending: true,
    } as unknown as ReturnType<typeof useCreateInvitation>);

    render(<InviteMemberDialog {...defaultProps} />);

    // Submit button remains visible during pending state
    const submitButton = screen.getByRole('button', { name: /send/i });
    expect(submitButton).toBeInTheDocument();
  });

  // --- Reset state on close ---

  it('should reset form state when dialog closes from link display', async () => {
    const user = userEvent.setup();
    mockMutateAsync.mockResolvedValue(mockCreatedResult);

    const { rerender } = render(<InviteMemberDialog {...defaultProps} />);

    // Submit successfully to get to link display state
    await user.type(screen.getByLabelText(/email/i), 'test@example.com');
    await user.click(screen.getByRole('button', { name: /send/i }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /done/i })).toBeInTheDocument();
    });

    // Close and reopen
    await user.click(screen.getByRole('button', { name: /done/i }));

    // Rerender with fresh isOpen
    rerender(<InviteMemberDialog {...defaultProps} />);

    // Should be back to form state
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /send/i })).toBeInTheDocument();
  });
});
