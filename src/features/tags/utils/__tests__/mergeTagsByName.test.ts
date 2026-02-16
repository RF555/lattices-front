import { describe, it, expect } from 'vitest';
import { mergeTagsByName } from '../mergeTagsByName';
import type { Tag } from '../../types/tag';

const makeTag = (overrides: Partial<Tag> & { id: string; name: string }): Tag => ({
  colorHex: '#3b82f6',
  createdAt: '2024-01-01T00:00:00Z',
  ...overrides,
});

describe('mergeTagsByName', () => {
  it('should return empty array for empty input', () => {
    expect(mergeTagsByName([])).toEqual([]);
  });

  it('should return tags as-is when no duplicates', () => {
    const tags = [
      makeTag({ id: '1', name: 'Frontend', colorHex: '#3b82f6' }),
      makeTag({ id: '2', name: 'Backend', colorHex: '#22c55e' }),
    ];

    const result = mergeTagsByName(tags);

    expect(result).toEqual([
      { name: 'Frontend', colorHex: '#3b82f6', ids: ['1'] },
      { name: 'Backend', colorHex: '#22c55e', ids: ['2'] },
    ]);
  });

  it('should merge tags with the exact same name', () => {
    const tags = [
      makeTag({ id: 'a1', name: 'Frontend', colorHex: '#3b82f6', workspaceId: 'ws-a' }),
      makeTag({ id: 'b1', name: 'Frontend', colorHex: '#ef4444', workspaceId: 'ws-b' }),
    ];

    const result = mergeTagsByName(tags);

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      name: 'Frontend',
      colorHex: '#3b82f6', // first tag's color
      ids: ['a1', 'b1'],
    });
  });

  it('should be case-sensitive', () => {
    const tags = [
      makeTag({ id: '1', name: 'Frontend' }),
      makeTag({ id: '2', name: 'frontend' }),
      makeTag({ id: '3', name: 'FRONTEND' }),
    ];

    const result = mergeTagsByName(tags);

    expect(result).toHaveLength(3);
    expect(result.map((t) => t.name)).toEqual(['Frontend', 'frontend', 'FRONTEND']);
  });

  it('should preserve order of first occurrence', () => {
    const tags = [
      makeTag({ id: 'a1', name: 'Bug' }),
      makeTag({ id: 'a2', name: 'Feature' }),
      makeTag({ id: 'b1', name: 'Bug' }),
      makeTag({ id: 'a3', name: 'Docs' }),
    ];

    const result = mergeTagsByName(tags);

    expect(result.map((t) => t.name)).toEqual(['Bug', 'Feature', 'Docs']);
  });

  it('should use first encountered color for merged tags', () => {
    const tags = [
      makeTag({ id: '1', name: 'Urgent', colorHex: '#ef4444' }),
      makeTag({ id: '2', name: 'Urgent', colorHex: '#22c55e' }),
      makeTag({ id: '3', name: 'Urgent', colorHex: '#3b82f6' }),
    ];

    const result = mergeTagsByName(tags);

    expect(result[0].colorHex).toBe('#ef4444');
    expect(result[0].ids).toEqual(['1', '2', '3']);
  });

  it('should handle mix of unique and duplicate tags', () => {
    const tags = [
      makeTag({ id: 'a1', name: 'Frontend', colorHex: '#3b82f6' }),
      makeTag({ id: 'a2', name: 'Backend', colorHex: '#22c55e' }),
      makeTag({ id: 'b1', name: 'Frontend', colorHex: '#ef4444' }),
      makeTag({ id: 'b2', name: 'Design', colorHex: '#8b5cf6' }),
    ];

    const result = mergeTagsByName(tags);

    expect(result).toHaveLength(3);
    expect(result).toEqual([
      { name: 'Frontend', colorHex: '#3b82f6', ids: ['a1', 'b1'] },
      { name: 'Backend', colorHex: '#22c55e', ids: ['a2'] },
      { name: 'Design', colorHex: '#8b5cf6', ids: ['b2'] },
    ]);
  });
});
