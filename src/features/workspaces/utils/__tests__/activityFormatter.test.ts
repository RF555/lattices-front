import { describe, it, expect, vi, afterEach } from 'vitest';
import { formatAction, formatRelativeTime } from '../activityFormatter';
import type { ActivityEntry } from '@features/workspaces/types/activity';
import i18n from '@/i18n/i18n';

// Helper to create mock activity entries
const createActivityEntry = (partial: Partial<ActivityEntry>): ActivityEntry => ({
  id: 'test-activity-id',
  actorId: 'actor-123',
  actorName: 'John Doe',
  actorAvatarUrl: null,
  action: 'todo.created',
  entityType: 'todo',
  entityId: 'entity-123',
  entityTitle: 'Test Task',
  changes: null,
  createdAt: '2026-01-01T00:00:00Z',
  ...partial,
});

describe('formatAction', () => {
  const t = i18n.getFixedT('en', 'workspaces');

  describe('todo actions', () => {
    it('should format todo.created action correctly', () => {
      const entry = createActivityEntry({
        action: 'todo.created',
        actorName: 'Alice',
        entityTitle: 'New Feature',
      });

      const result = formatAction(entry, t);
      expect(result).toBe('Alice created task "New Feature"');
    });

    it('should format todo.updated action correctly', () => {
      const entry = createActivityEntry({
        action: 'todo.updated',
        actorName: 'Bob',
        entityTitle: 'Bug Fix',
      });

      const result = formatAction(entry, t);
      expect(result).toBe('Bob updated "Bug Fix"');
    });

    it('should format todo.completed action correctly', () => {
      const entry = createActivityEntry({
        action: 'todo.completed',
        actorName: 'Charlie',
        entityTitle: 'Code Review',
      });

      const result = formatAction(entry, t);
      expect(result).toBe('Charlie completed "Code Review"');
    });

    it('should format todo.deleted action correctly', () => {
      const entry = createActivityEntry({
        action: 'todo.deleted',
        actorName: 'Dave',
        entityTitle: 'Old Task',
      });

      const result = formatAction(entry, t);
      expect(result).toBe('Dave deleted "Old Task"');
    });
  });

  describe('tag actions', () => {
    it('should format tag.created action correctly', () => {
      const entry = createActivityEntry({
        action: 'tag.created',
        actorName: 'Eve',
        entityTitle: 'urgent',
        entityType: 'tag',
      });

      const result = formatAction(entry, t);
      expect(result).toBe('Eve created tag "urgent"');
    });

    it('should format tag.updated action correctly', () => {
      const entry = createActivityEntry({
        action: 'tag.updated',
        actorName: 'Frank',
        entityTitle: 'priority',
        entityType: 'tag',
      });

      const result = formatAction(entry, t);
      // Note: tag.updated is not in the actionMap, so it falls back to default
      expect(result).toBe('Frank performed tag.updated');
    });

    it('should format tag.deleted action correctly', () => {
      const entry = createActivityEntry({
        action: 'tag.deleted',
        actorName: 'Grace',
        entityTitle: 'deprecated',
        entityType: 'tag',
      });

      const result = formatAction(entry, t);
      // Note: tag.deleted is not in the actionMap, so it falls back to default
      expect(result).toBe('Grace performed tag.deleted');
    });
  });

  describe('member actions', () => {
    it('should format member.invited action correctly', () => {
      const entry = createActivityEntry({
        action: 'member.invited',
        actorName: 'Hannah',
        entityTitle: 'newuser@example.com',
        entityType: 'member',
      });

      const result = formatAction(entry, t);
      expect(result).toBe('Hannah invited newuser@example.com');
    });

    it('should format member.joined action correctly', () => {
      const entry = createActivityEntry({
        action: 'member.joined',
        actorName: 'Ian',
        entityType: 'member',
      });

      const result = formatAction(entry, t);
      expect(result).toBe('Ian joined the workspace');
    });

    it('should format member.removed action correctly', () => {
      const entry = createActivityEntry({
        action: 'member.removed',
        actorName: 'Jane',
        entityTitle: 'olduser@example.com',
        entityType: 'member',
      });

      const result = formatAction(entry, t);
      expect(result).toBe('Jane removed olduser@example.com');
    });

    it('should format member.role_changed action correctly', () => {
      const entry = createActivityEntry({
        action: 'member.role_changed',
        actorName: 'Kevin',
        entityTitle: 'user@example.com',
        entityType: 'member',
      });

      const result = formatAction(entry, t);
      expect(result).toBe("Kevin changed user@example.com's role");
    });
  });

  describe('workspace actions', () => {
    it('should format workspace.updated action correctly', () => {
      const entry = createActivityEntry({
        action: 'workspace.updated',
        actorName: 'Laura',
        entityType: 'workspace',
      });

      const result = formatAction(entry, t);
      expect(result).toBe('Laura updated workspace settings');
    });
  });

  describe('edge cases', () => {
    it('should handle missing entityTitle gracefully', () => {
      const entry = createActivityEntry({
        action: 'todo.created',
        actorName: 'Mike',
        entityTitle: null,
      });

      const result = formatAction(entry, t);
      // The defaultValue will use null, which gets converted to "null" in string interpolation
      expect(result).toBe('Mike created task "null"');
    });

    it('should fallback to raw action string for unknown actions', () => {
      const entry = createActivityEntry({
        action: 'unknown.action',
        actorName: 'Nancy',
        entityTitle: 'Something',
      });

      const result = formatAction(entry, t);
      expect(result).toBe('Nancy performed unknown.action');
    });

    it('should handle empty actor name', () => {
      const entry = createActivityEntry({
        action: 'todo.created',
        actorName: '',
        entityTitle: 'Task',
      });

      const result = formatAction(entry, t);
      expect(result).toBe(' created task "Task"');
    });

    it('should handle special characters in entity title', () => {
      const entry = createActivityEntry({
        action: 'todo.created',
        actorName: 'Oscar',
        entityTitle: 'Task with "quotes" and special chars <>&',
      });

      const result = formatAction(entry, t);
      expect(result).toBe('Oscar created task "Task with "quotes" and special chars <>&"');
    });
  });
});

describe('formatRelativeTime', () => {
  const t = i18n.t;

  afterEach(() => {
    vi.useRealTimers();
  });

  function setNow(date: Date) {
    vi.useFakeTimers();
    vi.setSystemTime(date);
  }

  const now = new Date('2026-02-03T12:00:00Z');

  describe('recent time periods', () => {
    it('should return "just now" for less than 1 minute ago', () => {
      setNow(now);
      const thirtySecondsAgo = new Date(now.getTime() - 30 * 1000).toISOString();

      const result = formatRelativeTime(thirtySecondsAgo, t);
      expect(result).toBe('just now');
    });

    it('should return "just now" for exactly 0 seconds ago', () => {
      setNow(now);

      const result = formatRelativeTime(now.toISOString(), t);
      expect(result).toBe('just now');
    });
  });

  describe('minutes ago', () => {
    it('should return "Xm ago" for 1 minute ago', () => {
      setNow(now);
      const oneMinuteAgo = new Date(now.getTime() - 1 * 60 * 1000).toISOString();

      const result = formatRelativeTime(oneMinuteAgo, t);
      expect(result).toBe('1m ago');
    });

    it('should return "Xm ago" for 30 minutes ago', () => {
      setNow(now);
      const thirtyMinutesAgo = new Date(now.getTime() - 30 * 60 * 1000).toISOString();

      const result = formatRelativeTime(thirtyMinutesAgo, t);
      expect(result).toBe('30m ago');
    });

    it('should return "Xm ago" for 59 minutes ago', () => {
      setNow(now);
      const fiftyNineMinutesAgo = new Date(now.getTime() - 59 * 60 * 1000).toISOString();

      const result = formatRelativeTime(fiftyNineMinutesAgo, t);
      expect(result).toBe('59m ago');
    });
  });

  describe('hours ago', () => {
    it('should return "Xh ago" for 1 hour ago', () => {
      setNow(now);
      const oneHourAgo = new Date(now.getTime() - 1 * 60 * 60 * 1000).toISOString();

      const result = formatRelativeTime(oneHourAgo, t);
      expect(result).toBe('1h ago');
    });

    it('should return "Xh ago" for 5 hours ago', () => {
      setNow(now);
      const fiveHoursAgo = new Date(now.getTime() - 5 * 60 * 60 * 1000).toISOString();

      const result = formatRelativeTime(fiveHoursAgo, t);
      expect(result).toBe('5h ago');
    });

    it('should return "Xh ago" for 23 hours ago', () => {
      setNow(now);
      const twentyThreeHoursAgo = new Date(now.getTime() - 23 * 60 * 60 * 1000).toISOString();

      const result = formatRelativeTime(twentyThreeHoursAgo, t);
      expect(result).toBe('23h ago');
    });
  });

  describe('days ago', () => {
    it('should return "Xd ago" for 1 day ago', () => {
      setNow(now);
      const oneDayAgo = new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString();

      const result = formatRelativeTime(oneDayAgo, t);
      expect(result).toBe('1d ago');
    });

    it('should return "Xd ago" for 7 days ago', () => {
      setNow(now);
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();

      const result = formatRelativeTime(sevenDaysAgo, t);
      expect(result).toBe('7d ago');
    });

    it('should return "Xd ago" for 30 days ago', () => {
      setNow(now);
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();

      const result = formatRelativeTime(thirtyDaysAgo, t);
      expect(result).toBe('30d ago');
    });

    it('should return "Xd ago" for 365 days ago', () => {
      setNow(now);
      const oneYearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000).toISOString();

      const result = formatRelativeTime(oneYearAgo, t);
      expect(result).toBe('365d ago');
    });
  });

  describe('boundary conditions', () => {
    it('should handle exactly 1 minute (60 seconds)', () => {
      setNow(now);
      const exactlyOneMinute = new Date(now.getTime() - 60 * 1000).toISOString();

      const result = formatRelativeTime(exactlyOneMinute, t);
      expect(result).toBe('1m ago');
    });

    it('should handle exactly 1 hour (3600 seconds)', () => {
      setNow(now);
      const exactlyOneHour = new Date(now.getTime() - 3600 * 1000).toISOString();

      const result = formatRelativeTime(exactlyOneHour, t);
      expect(result).toBe('1h ago');
    });

    it('should handle exactly 24 hours', () => {
      setNow(now);
      const exactlyOneDay = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();

      const result = formatRelativeTime(exactlyOneDay, t);
      expect(result).toBe('1d ago');
    });
  });

  describe('edge cases', () => {
    it('should handle dates in the future gracefully', () => {
      setNow(now);
      const futureDate = new Date(now.getTime() + 60 * 60 * 1000).toISOString();

      const result = formatRelativeTime(futureDate, t);
      // Negative time difference will result in negative values
      expect(result).toBe('just now');
    });

    it('should handle invalid date strings gracefully', () => {
      setNow(now);

      const result = formatRelativeTime('invalid-date', t);
      // Invalid date will result in NaN calculations
      expect(result).toBeTruthy(); // Should return something without crashing
    });

    it('should handle very old dates', () => {
      setNow(now);
      const veryOld = new Date('1990-01-01T00:00:00Z').toISOString();

      const result = formatRelativeTime(veryOld, t);
      // Should still format as days ago
      expect(result).toContain('d ago');
    });
  });
});
