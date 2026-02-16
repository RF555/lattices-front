import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@/test/test-utils';
import userEvent from '@testing-library/user-event';
import { InvitationBanner } from '../InvitationBanner/InvitationBanner';
import { createMockInvitation } from '@/test/factories';

const mockMutate = vi.fn();
let mockInvitations = [createMockInvitation({ workspaceName: 'Team Alpha' })];
let mockIsPending = false;

vi.mock('@features/workspaces/hooks/useInvitations', () => ({
  usePendingInvitations: vi.fn(() => ({
    data: mockInvitations,
  })),
  useAcceptInvitationById: vi.fn(() => ({
    mutate: mockMutate,
    isPending: mockIsPending,
  })),
}));

describe('InvitationBanner', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockInvitations = [createMockInvitation({ id: 'inv-test-1', workspaceName: 'Team Alpha' })];
    mockIsPending = false;
  });

  it('should render nothing when there are no pending invitations', () => {
    mockInvitations = [];
    const { container } = render(<InvitationBanner />);
    expect(container.firstChild).toBeNull();
  });

  it('should render nothing when invitations is undefined', () => {
    mockInvitations = undefined as unknown as typeof mockInvitations;
    const { container } = render(<InvitationBanner />);
    expect(container.firstChild).toBeNull();
  });

  it('should render a banner for each pending invitation', () => {
    mockInvitations = [
      createMockInvitation({ id: 'inv-1', workspaceName: 'Workspace A' }),
      createMockInvitation({ id: 'inv-2', workspaceName: 'Workspace B' }),
    ];
    render(<InvitationBanner />);

    const acceptButtons = screen.getAllByRole('button', { name: /accept/i });
    expect(acceptButtons).toHaveLength(2);
  });

  it('should display workspace name in the banner text', () => {
    render(<InvitationBanner />);

    // i18n key: invitation.banner with workspace param
    // The banner text should contain the workspace name
    expect(screen.getByText(/team alpha/i)).toBeInTheDocument();
  });

  it('should call mutate with invitation ID when Accept is clicked', async () => {
    const user = userEvent.setup();
    render(<InvitationBanner />);

    await user.click(screen.getByRole('button', { name: /accept/i }));

    expect(mockMutate).toHaveBeenCalledWith('inv-test-1');
  });

  it('should call mutate with the correct invitation ID for multiple invitations', async () => {
    const user = userEvent.setup();
    mockInvitations = [
      createMockInvitation({ id: 'inv-first', workspaceName: 'First WS' }),
      createMockInvitation({ id: 'inv-second', workspaceName: 'Second WS' }),
    ];
    render(<InvitationBanner />);

    const acceptButtons = screen.getAllByRole('button', { name: /accept/i });
    await user.click(acceptButtons[1]);

    expect(mockMutate).toHaveBeenCalledWith('inv-second');
  });

  it('should show the mail icon for each invitation', () => {
    render(<InvitationBanner />);

    // The Mail icon from lucide-react renders as an SVG
    const svgs = document.querySelectorAll('svg');
    expect(svgs.length).toBeGreaterThanOrEqual(1);
  });

  it('should render a decline button for each invitation', () => {
    render(<InvitationBanner />);

    const declineButtons = screen.getAllByRole('button', { name: /decline/i });
    expect(declineButtons).toHaveLength(1);
  });

  it('should render banner container with correct styling', () => {
    render(<InvitationBanner />);

    // The outer div should have bg-blue-50 class
    const banner = screen.getByText(/team alpha/i).closest('.bg-blue-50');
    expect(banner).toBeInTheDocument();
  });
});
