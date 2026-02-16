import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@/test/test-utils';
import userEvent from '@testing-library/user-event';
import { ActivityFeed } from '../ActivityFeed/ActivityFeed';
import type { ActivityEntry } from '@features/workspaces/types/activity';

const mockUseWorkspaceActivity = vi.fn();

vi.mock('@features/workspaces/hooks/useActivity', () => ({
  useWorkspaceActivity: (...args: unknown[]) => mockUseWorkspaceActivity(...args),
}));

vi.mock('@features/workspaces/utils/activityFormatter', () => ({
  formatAction: vi.fn((entry: ActivityEntry) => `${entry.actorName} did ${entry.action}`),
  formatRelativeTime: vi.fn(() => 'just now'),
}));

describe('ActivityFeed', () => {
  const createMockActivity = (overrides: Partial<ActivityEntry> = {}): ActivityEntry => ({
    id: 'activity-1',
    actorId: 'user-1',
    actorName: 'John Doe',
    actorAvatarUrl: null,
    action: 'created',
    entityType: 'todo',
    entityId: 'todo-1',
    entityTitle: 'Test Task',
    changes: null,
    createdAt: '2024-01-01T12:00:00Z',
    ...overrides,
  });

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseWorkspaceActivity.mockReturnValue({
      data: [],
      isLoading: false,
    });
  });

  it('should show loading spinner when loading', () => {
    mockUseWorkspaceActivity.mockReturnValue({
      data: undefined,
      isLoading: true,
    });

    render(<ActivityFeed workspaceId="ws-1" />);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('should show empty state when no activities', () => {
    render(<ActivityFeed workspaceId="ws-1" />);
    expect(screen.getByText('No activity yet')).toBeInTheDocument();
  });

  it('should render activity entries with formatted actions', () => {
    mockUseWorkspaceActivity.mockReturnValue({
      data: [
        createMockActivity({ id: '1', actorName: 'Alice', action: 'created' }),
        createMockActivity({ id: '2', actorName: 'Bob', action: 'updated' }),
      ],
      isLoading: false,
    });

    render(<ActivityFeed workspaceId="ws-1" />);

    expect(screen.getByText('Alice did created')).toBeInTheDocument();
    expect(screen.getByText('Bob did updated')).toBeInTheDocument();
  });

  it('should show initials when no avatar URL', () => {
    mockUseWorkspaceActivity.mockReturnValue({
      data: [createMockActivity({ actorName: 'John Doe', actorAvatarUrl: null })],
      isLoading: false,
    });

    render(<ActivityFeed workspaceId="ws-1" />);

    // Component uses actorName.slice(0, 2).toUpperCase()
    expect(screen.getByText('JO')).toBeInTheDocument();
  });

  it('should show avatar image when URL is provided', () => {
    mockUseWorkspaceActivity.mockReturnValue({
      data: [
        createMockActivity({
          actorAvatarUrl: 'https://example.com/avatar.jpg',
        }),
      ],
      isLoading: false,
    });

    const { container } = render(<ActivityFeed workspaceId="ws-1" />);

    // <img alt=""> is a presentational image so getByRole('img') won't find it
    const img = container.querySelector('img');
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute('src', 'https://example.com/avatar.jpg');
  });

  it('should show changes diff when entry has changes', () => {
    mockUseWorkspaceActivity.mockReturnValue({
      data: [
        createMockActivity({
          changes: {
            status: { old: 'pending', new: 'completed' },
          },
        }),
      ],
      isLoading: false,
    });

    render(<ActivityFeed workspaceId="ws-1" />);

    expect(screen.getByText('status')).toBeInTheDocument();
    expect(screen.getByText('pending')).toBeInTheDocument();
    expect(screen.getByText('completed')).toBeInTheDocument();
  });

  it('should not render changes diff when changes is null', () => {
    mockUseWorkspaceActivity.mockReturnValue({
      data: [createMockActivity({ changes: null })],
      isLoading: false,
    });

    render(<ActivityFeed workspaceId="ws-1" />);
    expect(screen.queryByText('status')).not.toBeInTheDocument();
  });

  it('should show "Load more" button when activities count >= PAGE_SIZE', () => {
    const activities = Array.from({ length: 20 }, (_, i) =>
      createMockActivity({ id: `a-${i}`, actorName: `User ${i}` }),
    );

    mockUseWorkspaceActivity.mockReturnValue({
      data: activities,
      isLoading: false,
    });

    render(<ActivityFeed workspaceId="ws-1" />);
    expect(screen.getByText('Load more')).toBeInTheDocument();
  });

  it('should not show "Load more" button when activities count < PAGE_SIZE', () => {
    const activities = Array.from({ length: 5 }, (_, i) =>
      createMockActivity({ id: `a-${i}`, actorName: `User ${i}` }),
    );

    mockUseWorkspaceActivity.mockReturnValue({
      data: activities,
      isLoading: false,
    });

    render(<ActivityFeed workspaceId="ws-1" />);
    expect(screen.queryByText('Load more')).not.toBeInTheDocument();
  });

  it('should increase limit when "Load more" is clicked', async () => {
    const user = userEvent.setup();
    const activities = Array.from({ length: 20 }, (_, i) =>
      createMockActivity({ id: `a-${i}`, actorName: `User ${i}` }),
    );

    mockUseWorkspaceActivity.mockReturnValue({
      data: activities,
      isLoading: false,
    });

    render(<ActivityFeed workspaceId="ws-1" />);

    await user.click(screen.getByText('Load more'));

    // After click, hook should be called with limit=40
    expect(mockUseWorkspaceActivity).toHaveBeenLastCalledWith('ws-1', { limit: 40 });
  });
});
