import type { Tag } from '../types/tag';

export interface MergedTag {
  name: string;
  colorHex: string;
  ids: string[];
}

/**
 * Merges tags with the exact same name (case-sensitive) into single entries.
 * Uses the first encountered tag's color for the merged result.
 * Preserves original order (first occurrence).
 */
export function mergeTagsByName(tags: Tag[]): MergedTag[] {
  const map = new Map<string, MergedTag>();

  for (const tag of tags) {
    const existing = map.get(tag.name);
    if (existing) {
      existing.ids.push(tag.id);
    } else {
      map.set(tag.name, { name: tag.name, colorHex: tag.colorHex, ids: [tag.id] });
    }
  }

  return Array.from(map.values());
}
