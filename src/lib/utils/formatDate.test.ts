import { describe, it, expect, vi, afterEach } from 'vitest';
import { formatDate, formatDateFull } from './formatDate';

describe('formatDate', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  function setNow(date: Date) {
    vi.useFakeTimers();
    vi.setSystemTime(date);
  }

  const now = new Date('2026-01-30T12:00:00Z');

  it('should return "just now" for < 60 seconds ago', () => {
    setNow(now);
    const thirtySecondsAgo = new Date(now.getTime() - 30 * 1000).toISOString();
    expect(formatDate(thirtySecondsAgo)).toBe('just now');
  });

  it('should return "Xm ago" for < 1 hour ago', () => {
    setNow(now);
    const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000).toISOString();
    expect(formatDate(fiveMinutesAgo)).toBe('5m ago');
  });

  it('should return "Xm ago" at 59 minutes', () => {
    setNow(now);
    const fiftyNineMinutesAgo = new Date(now.getTime() - 59 * 60 * 1000).toISOString();
    expect(formatDate(fiftyNineMinutesAgo)).toBe('59m ago');
  });

  it('should return "Xh ago" for < 24 hours ago', () => {
    setNow(now);
    const threeHoursAgo = new Date(now.getTime() - 3 * 60 * 60 * 1000).toISOString();
    expect(formatDate(threeHoursAgo)).toBe('3h ago');
  });

  it('should return "Xh ago" at 23 hours', () => {
    setNow(now);
    const twentyThreeHoursAgo = new Date(now.getTime() - 23 * 60 * 60 * 1000).toISOString();
    expect(formatDate(twentyThreeHoursAgo)).toBe('23h ago');
  });

  it('should return "Xd ago" for < 7 days ago', () => {
    setNow(now);
    const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString();
    expect(formatDate(twoDaysAgo)).toBe('2d ago');
  });

  it('should return "Xd ago" at 6 days', () => {
    setNow(now);
    const sixDaysAgo = new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000).toISOString();
    expect(formatDate(sixDaysAgo)).toBe('6d ago');
  });

  it('should return formatted date for same year (>= 7 days ago)', () => {
    setNow(now);
    const twoWeeksAgo = new Date('2026-01-16T12:00:00Z').toISOString();
    const result = formatDate(twoWeeksAgo);
    // Should include day number but not year (locale-independent check)
    expect(result).toContain('16');
    expect(result).not.toContain('2026');
  });

  it('should include year for different-year dates', () => {
    setNow(now);
    const lastYear = new Date('2025-06-15T12:00:00Z').toISOString();
    const result = formatDate(lastYear);
    // Should include both day and year (locale-independent check)
    expect(result).toContain('15');
    expect(result).toContain('2025');
  });
});

describe('formatDateFull', () => {
  it('should return a non-empty localized datetime string', () => {
    const result = formatDateFull('2026-01-30T15:45:12Z');
    expect(result).toBeTruthy();
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
  });

  it('should include date components', () => {
    const result = formatDateFull('2026-01-30T15:45:12Z');
    // The exact format is locale-dependent, but should contain recognizable parts
    expect(result).toMatch(/2026/);
  });
});
