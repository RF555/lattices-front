export interface Tag {
  id: string;
  name: string;
  colorHex: string;
  workspaceId?: string;
  usageCount?: number;
  createdAt: string;
}

export interface CreateTagInput {
  name: string;
  colorHex?: string;
  workspaceId?: string;
}

export interface UpdateTagInput {
  name?: string;
  colorHex?: string;
}

export const TAG_COLORS = [
  '#ef4444', // red
  '#f97316', // orange
  '#eab308', // yellow
  '#22c55e', // green
  '#14b8a6', // teal
  '#3b82f6', // blue
  '#8b5cf6', // violet
  '#ec4899', // pink
  '#6b7280', // gray
] as const;

export type TagColor = (typeof TAG_COLORS)[number];
