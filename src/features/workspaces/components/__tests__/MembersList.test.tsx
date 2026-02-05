import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@/test/test-utils';
import { MembersList } from '../MembersList/MembersList';
import type { WorkspaceMember } from '../../types/workspace';

const mockMembers: WorkspaceMember[] = [
  {
    userId: 'user-1',
    email: 'owner@example.com',
    displayName: 'Alice Owner',
    avatarUrl: null,
    role: 'owner',
    joinedAt: '2024-01-01T00:00:00Z',
  },
  {
    userId: 'user-2',
    email: 'admin@example.com',
    displayName: 'Bob Admin',
    avatarUrl: 'https://example.com/bob.jpg',
    role: 'admin',
    joinedAt: '2024-01-02T00:00:00Z',
  },
  {
    userId: 'user-3',
    email: 'member@example.com',
    displayName: 'Carol Member',
    avatarUrl: null,
    role: 'member',
    joinedAt: '2024-01-03T00:00:00Z',
  },
  {
    userId: 'user-4',
    email: 'viewer@example.com',
    displayName: null,
    avatarUrl: null,
    role: 'viewer',
    joinedAt: '2024-01-04T00:00:00Z',
  },
];

const mockUpdateRole = { mutate: vi.fn(), isPending: false };
const mockRemoveMember = { mutate: vi.fn(), isPending: false };

vi.mock('../../hooks/useWorkspaceMembers', () => ({
  useWorkspaceMembers: vi.fn(() => ({
    data: mockMembers,
    isLoading: false,
  })),
  useUpdateMemberRole: vi.fn(() => mockUpdateRole),
  useRemoveMember: vi.fn(() => mockRemoveMember),
}));

vi.mock('../../hooks/useWorkspacePermission', () => ({
  useWorkspacePermission: vi.fn(() => ({
    role: 'admin' as const,
    canEdit: true,
    canManageMembers: true,
    canDelete: true,
    isOwner: false,
    isAdmin: true,
    isMember: false,
    isViewer: false,
  })),
}));

vi.mock('@features/auth/stores/authStore', () => ({
  useAuthStore: vi.fn((selector: (state: unknown) => unknown) =>
    selector({
      user: { id: 'user-2', email: 'admin@example.com', name: 'Bob Admin' },
    })
  ),
}));

// Mock child components to keep tests focused
vi.mock('../InviteMemberDialog/InviteMemberDialog', () => ({
  InviteMemberDialog: () => null,
}));

vi.mock('../RoleSelector/RoleSelector', () => ({
  RoleSelector: ({ onChange }: { onChange: (role: string) => void }) => (
    <select data-testid="role-selector" onChange={(e) => onChange(e.target.value)}>
      <option value="admin">Admin</option>
      <option value="member">Member</option>
      <option value="viewer">Viewer</option>
    </select>
  ),
}));

import { useWorkspaceMembers } from '../../hooks/useWorkspaceMembers';
import { useWorkspacePermission } from '../../hooks/useWorkspacePermission';
const mockUseWorkspaceMembers = vi.mocked(useWorkspaceMembers);
const mockUseWorkspacePermission = vi.mocked(useWorkspacePermission);

describe('MembersList', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseWorkspaceMembers.mockReturnValue({
      data: mockMembers,
      isLoading: false,
    } as unknown as ReturnType<typeof useWorkspaceMembers>);
    mockUseWorkspacePermission.mockReturnValue({
      role: 'admin' as const,
      canEdit: true,
      canManageMembers: true,
      canDelete: true,
      isOwner: false,
      isAdmin: true,
      isMember: false,
      isViewer: false,
    });
  });

  it('should render all members', () => {
    render(<MembersList workspaceId="ws-1" />);

    expect(screen.getByText('Alice Owner')).toBeInTheDocument();
    expect(screen.getByText('Bob Admin')).toBeInTheDocument();
    expect(screen.getByText('Carol Member')).toBeInTheDocument();
    expect(screen.getByText('viewer@example.com')).toBeInTheDocument();
  });

  it('should show role badges', () => {
    render(<MembersList workspaceId="ws-1" />);

    expect(screen.getByText('Owner')).toBeInTheDocument();
    // Admin/Member/Viewer also appear as <option> in mock RoleSelector
    expect(screen.getAllByText('Admin').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Member').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Viewer').length).toBeGreaterThanOrEqual(1);
  });

  it('should show loading state', () => {
    mockUseWorkspaceMembers.mockReturnValue({
      data: undefined,
      isLoading: true,
    } as unknown as ReturnType<typeof useWorkspaceMembers>);

    render(<MembersList workspaceId="ws-1" />);
    expect(screen.queryByText('Alice Owner')).not.toBeInTheDocument();
  });

  it('should show empty state when no members', () => {
    mockUseWorkspaceMembers.mockReturnValue({
      data: [],
      isLoading: false,
    } as unknown as ReturnType<typeof useWorkspaceMembers>);

    render(<MembersList workspaceId="ws-1" />);
    expect(screen.getByText(/no members/i)).toBeInTheDocument();
  });

  it('should show Invite button when user can manage members', () => {
    render(<MembersList workspaceId="ws-1" />);
    expect(screen.getByText('Invite Member')).toBeInTheDocument();
  });

  it('should hide Invite button when user cannot manage members', () => {
    mockUseWorkspacePermission.mockReturnValue({
      role: 'viewer' as const,
      canEdit: false,
      canManageMembers: false,
      canDelete: false,
      isOwner: false,
      isAdmin: false,
      isMember: false,
      isViewer: true,
    });

    render(<MembersList workspaceId="ws-1" />);
    expect(screen.queryByText('Invite Member')).not.toBeInTheDocument();
  });

  it('should show action buttons for manageable users when user is admin+', async () => {
    render(<MembersList workspaceId="ws-1" />);

    // Should have action menu buttons for non-owner members
    const actionButtons = screen.getAllByRole('button', { name: /actions/i });
    expect(actionButtons.length).toBeGreaterThan(0);
  });

  it('should display initials when no avatar URL is provided', () => {
    render(<MembersList workspaceId="ws-1" />);

    // Component uses name.slice(0, 2).toUpperCase()
    // Alice Owner → "AL", Carol Member → "CA"
    expect(screen.getByText('AL')).toBeInTheDocument();
    expect(screen.getByText('CA')).toBeInTheDocument();
  });
});
