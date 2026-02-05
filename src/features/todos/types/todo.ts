export interface TagSummary {
  id: string;
  name: string;
  colorHex: string;
}

export interface Todo {
  id: string;
  title: string;
  description: string | null;
  isCompleted: boolean;
  parentId: string | null;
  workspaceId?: string;
  position: number;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;

  // Backend-computed child progress counts (server-side GROUP BY query).
  childCount: number;
  completedChildCount: number;

  // Embedded tag summaries returned by backend
  tags: TagSummary[];

  // Computed/assembled on client
  depth?: number;
  children?: Todo[];
  isExpanded?: boolean;
}

export interface CreateTodoInput {
  title: string;
  description?: string;
  parentId?: string;
}

export interface UpdateTodoInput {
  title?: string;
  description?: string | null;
  isCompleted?: boolean;
  parentId?: string | null;
  position?: number;
}

export interface TodoFilters {
  includeCompleted?: boolean;
  tagId?: string;
}
