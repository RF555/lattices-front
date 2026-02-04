import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, act } from '@/test/test-utils';
import userEvent from '@testing-library/user-event';
import { AcceptInvitation } from '../AcceptInvitation/AcceptInvitation';
import type { WorkspaceMember } from '../../types/workspace';

const mockNavigate = vi.fn();
const mockMutate = vi.fn();
const mockSetActiveWorkspace = vi.fn();

let mockSearchParams = new URLSearchParams('token=valid-token');
let mockIsAuthenticated = true;

vi.mock('react-router', async () => {
  const actual = await vi.importActual('react-router');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useSearchParams: () => [mockSearchParams],
  };
});

vi.mock('@features/auth/stores/authStore', () => ({
  useIsAuthenticated: vi.fn(() => mockIsAuthenticated),
}));

vi.mock('../../hooks/useInvitations', () => ({
  useAcceptInvitation: vi.fn(() => ({
    mutate: mockMutate,
    isPending: false,
  })),
}));

vi.mock('../../stores/workspaceUiStore', () => ({
  useWorkspaceUiStore: vi.fn((selector: (state: { setActiveWorkspace: typeof mockSetActiveWorkspace }) => unknown) =>
    selector({ setActiveWorkspace: mockSetActiveWorkspace })
  ),
}));

describe('AcceptInvitation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSearchParams = new URLSearchParams('token=valid-token');
    mockIsAuthenticated = true;
  });

  it('should redirect to login when not authenticated', () => {
    mockIsAuthenticated = false;
    render(<AcceptInvitation />);

    expect(mockNavigate).toHaveBeenCalledWith(
      '/auth/login?redirect=/invite?token=valid-token',
      { replace: true }
    );
  });

  it('should show error when no token is provided', () => {
    mockSearchParams = new URLSearchParams('');
    render(<AcceptInvitation />);

    // Shows "Invalid invitation link." from i18n
    expect(screen.getByText(/invalid invitation/i)).toBeInTheDocument();
    expect(mockMutate).not.toHaveBeenCalled();
  });

  it('should show loading state and call mutate with token', () => {
    render(<AcceptInvitation />);

    expect(screen.getByText(/accepting invitation/i)).toBeInTheDocument();
    expect(mockMutate).toHaveBeenCalledWith(
      'valid-token',
      expect.objectContaining({
        onSuccess: expect.any(Function),
        onError: expect.any(Function),
      })
    );
  });

  it('should show success state after acceptance', () => {
    render(<AcceptInvitation />);

    const { onSuccess } = mockMutate.mock.calls[0][1];
    const mockMember: WorkspaceMember = {
      userId: 'user-123',
      email: 'test@example.com',
      displayName: 'Test User',
      avatarUrl: null,
      role: 'member',
      joinedAt: '2024-01-01T00:00:00Z',
    };

    act(() => {
      onSuccess(mockMember);
    });

    expect(screen.getByText(/you've joined/i)).toBeInTheDocument();
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('should navigate to /app when "Go to Workspace" is clicked after success', async () => {
    const user = userEvent.setup();
    render(<AcceptInvitation />);

    const { onSuccess } = mockMutate.mock.calls[0][1];
    act(() => {
      onSuccess({
        userId: 'ws-456',
        email: 'test@example.com',
        displayName: 'Test User',
        avatarUrl: null,
        role: 'member',
        joinedAt: '2024-01-01T00:00:00Z',
      } as WorkspaceMember);
    });

    await user.click(screen.getByText(/go to workspace/i));

    expect(mockSetActiveWorkspace).toHaveBeenCalledWith('ws-456');
    expect(mockNavigate).toHaveBeenCalledWith('/app', { replace: true });
  });

  it('should show expired error message', () => {
    render(<AcceptInvitation />);

    const { onError } = mockMutate.mock.calls[0][1];
    act(() => {
      onError(new Error('Token has expired'));
    });

    // Should match "expired" translation: "This invitation has expired..."
    expect(screen.getByText(/expired/i)).toBeInTheDocument();
  });

  it('should show invalid error for non-expired errors', () => {
    render(<AcceptInvitation />);

    const { onError } = mockMutate.mock.calls[0][1];
    act(() => {
      onError(new Error('Something went wrong'));
    });

    expect(screen.getByText(/invalid invitation/i)).toBeInTheDocument();
  });

  it('should only call mutate once on mount', () => {
    const { rerender } = render(<AcceptInvitation />);
    expect(mockMutate).toHaveBeenCalledTimes(1);

    rerender(<AcceptInvitation />);
    expect(mockMutate).toHaveBeenCalledTimes(1);
  });

  it('should navigate to /app from error state', async () => {
    const user = userEvent.setup();
    render(<AcceptInvitation />);

    const { onError } = mockMutate.mock.calls[0][1];
    act(() => {
      onError(new Error('Invalid'));
    });

    await user.click(screen.getByText(/go to workspace/i));
    expect(mockNavigate).toHaveBeenCalledWith('/app', { replace: true });
  });
});
