import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@/test/test-utils';
import userEvent from '@testing-library/user-event';
import { InviteMemberDialog } from '../InviteMemberDialog/InviteMemberDialog';

const mockMutateAsync = vi.fn();
vi.mock('../../hooks/useInvitations', () => ({
  useCreateInvitation: vi.fn(() => ({
    mutateAsync: mockMutateAsync,
    isPending: false,
  })),
}));

import { useCreateInvitation } from '../../hooks/useInvitations';
const mockUseCreateInvitation = vi.mocked(useCreateInvitation);

describe('InviteMemberDialog', () => {
  const mockOnClose = vi.fn();
  const defaultProps = {
    isOpen: true,
    onClose: mockOnClose,
    workspaceId: 'ws-1',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockMutateAsync.mockReset();
    mockUseCreateInvitation.mockReturnValue({
      mutateAsync: mockMutateAsync,
      isPending: false,
    } as unknown as ReturnType<typeof useCreateInvitation>);
  });

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
    const roleSelect = screen.getByLabelText(/role/i) as HTMLSelectElement;
    expect(roleSelect.value).toBe('member');
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
    const options = Array.from(roleSelect.querySelectorAll('option')).map(
      (opt) => opt.getAttribute('value')
    );
    expect(options).toContain('viewer');
    expect(options).toContain('member');
    expect(options).toContain('admin');
  });

  it('should show validation error for invalid email', async () => {
    const user = userEvent.setup();
    render(<InviteMemberDialog {...defaultProps} />);

    // Use "bad@x" which passes HTML5 type="email" validation but fails the
    // component's regex /^[^\s@]+@[^\s@]+\.[^\s@]+$/ (no dot in domain)
    await user.type(screen.getByLabelText(/email/i), 'bad@x');
    await user.click(screen.getByRole('button', { name: /send/i }));

    // i18n resolves auth:validation.emailInvalid to "Please enter a valid email address"
    expect(await screen.findByText(/valid email/i)).toBeInTheDocument();
    expect(mockMutateAsync).not.toHaveBeenCalled();
  });

  it('should prevent submission with empty email', async () => {
    const user = userEvent.setup();
    render(<InviteMemberDialog {...defaultProps} />);

    await user.click(screen.getByRole('button', { name: /send/i }));
    expect(mockMutateAsync).not.toHaveBeenCalled();
  });

  it('should call mutateAsync with correct params on submit', async () => {
    const user = userEvent.setup();
    mockMutateAsync.mockResolvedValue({});
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

  it('should clear form and call onClose on successful submission', async () => {
    const user = userEvent.setup();
    mockMutateAsync.mockResolvedValue({});
    render(<InviteMemberDialog {...defaultProps} />);

    await user.type(screen.getByLabelText(/email/i), 'test@example.com');
    await user.click(screen.getByRole('button', { name: /send/i }));

    await waitFor(() => {
      expect(mockOnClose).toHaveBeenCalled();
    });
  });

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

  it('should call onClose when cancel is clicked', async () => {
    const user = userEvent.setup();
    render(<InviteMemberDialog {...defaultProps} />);

    await user.click(screen.getByRole('button', { name: /cancel/i }));
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('should disable submit button when pending', () => {
    mockUseCreateInvitation.mockReturnValue({
      mutateAsync: mockMutateAsync,
      isPending: true,
    } as unknown as ReturnType<typeof useCreateInvitation>);

    render(<InviteMemberDialog {...defaultProps} />);

    // When isPending, Button renders "Loading..." text and is disabled
    const submitButton = screen.getByRole('button', { name: /loading/i });
    expect(submitButton).toBeDisabled();
  });
});
