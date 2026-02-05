import { apiClient } from '@lib/api/client';
import type { ListResponse, SingleResponse } from '@lib/api/types';
import type { Todo, CreateTodoInput, UpdateTodoInput, TodoFilters } from '../types/todo';

/** Raw todo shape returned by the API (snake_case). */
interface ApiTodo {
  id: string;
  parent_id: string | null;
  workspace_id?: string;
  title: string;
  description: string | null;
  is_completed: boolean;
  position: number;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
  tags: { id: string; name: string; color_hex: string }[];
  child_count: number;
  completed_child_count: number;
}

function mapTodo(raw: ApiTodo): Todo {
  return {
    id: raw.id,
    title: raw.title,
    description: raw.description,
    isCompleted: raw.is_completed,
    parentId: raw.parent_id,
    workspaceId: raw.workspace_id,
    position: raw.position,
    completedAt: raw.completed_at,
    createdAt: raw.created_at,
    updatedAt: raw.updated_at,
    childCount: raw.child_count,
    completedChildCount: raw.completed_child_count,
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- defensive: API may omit tags
    tags: (raw.tags ?? []).map((t) => ({
      id: t.id,
      name: t.name,
      colorHex: t.color_hex,
    })),
  };
}

export const todoApi = {
  async getAll(filters?: TodoFilters, workspaceId?: string): Promise<Todo[]> {
    const params: Record<string, string | boolean | undefined> = {};

    if (filters?.includeCompleted !== undefined)
      params.include_completed = filters.includeCompleted;
    if (filters?.tagId) params.tag_id = filters.tagId;
    if (workspaceId) params.workspace_id = workspaceId;

    const response = await apiClient.get<ListResponse<ApiTodo>>('/todos', { params });
    return response.data.map(mapTodo);
  },

  async getById(id: string): Promise<Todo> {
    const response = await apiClient.get<SingleResponse<ApiTodo>>(`/todos/${id}`);
    return mapTodo(response.data);
  },

  async create(input: CreateTodoInput, workspaceId?: string): Promise<Todo> {
    const body: Record<string, unknown> = {
      title: input.title,
      description: input.description,
      parent_id: input.parentId,
    };
    if (workspaceId) body.workspace_id = workspaceId;

    const response = await apiClient.post<SingleResponse<ApiTodo>>('/todos', body);
    return mapTodo(response.data);
  },

  async update(id: string, input: UpdateTodoInput): Promise<Todo> {
    const body: Record<string, unknown> = {};
    if (input.title !== undefined) body.title = input.title;
    if (input.description !== undefined) body.description = input.description;
    if (input.isCompleted !== undefined) body.is_completed = input.isCompleted;
    if (input.parentId !== undefined) body.parent_id = input.parentId;
    if (input.position !== undefined) body.position = input.position;

    const response = await apiClient.patch<SingleResponse<ApiTodo>>(`/todos/${id}`, body);
    return mapTodo(response.data);
  },

  async delete(id: string): Promise<void> {
    await apiClient.delete(`/todos/${id}`);
  },
};
