import { apiClient } from '@lib/api/client';
import type { ListResponse, SingleResponse } from '@lib/api/types';
import type { Tag, CreateTagInput, UpdateTagInput } from '../types/tag';

/** Raw tag shape returned by the API (snake_case). */
interface ApiTag {
  id: string;
  name: string;
  color_hex: string;
  usage_count?: number;
  created_at: string;
}

function mapTag(raw: ApiTag): Tag {
  return {
    id: raw.id,
    name: raw.name,
    colorHex: raw.color_hex,
    usageCount: raw.usage_count,
    createdAt: raw.created_at,
  };
}

export const tagApi = {
  async getAll(workspaceId?: string): Promise<Tag[]> {
    const params: Record<string, string | boolean | undefined> = {};
    if (workspaceId) params.workspace_id = workspaceId;

    const response = await apiClient.get<ListResponse<ApiTag>>('/tags', { params });
    return response.data.map(mapTag);
  },

  async create(input: CreateTagInput, workspaceId?: string): Promise<Tag> {
    const body: Record<string, unknown> = {
      name: input.name,
      color_hex: input.colorHex,
    };
    if (workspaceId) body.workspace_id = workspaceId;

    const response = await apiClient.post<SingleResponse<ApiTag>>('/tags', body);
    return mapTag(response.data);
  },

  async update(id: string, input: UpdateTagInput): Promise<Tag> {
    const body: Record<string, unknown> = {};
    if (input.name !== undefined) body.name = input.name;
    if (input.colorHex !== undefined) body.color_hex = input.colorHex;

    const response = await apiClient.patch<SingleResponse<ApiTag>>(`/tags/${id}`, body);
    return mapTag(response.data);
  },

  async delete(id: string): Promise<void> {
    await apiClient.delete(`/tags/${id}`);
  },

  async addToTodo(todoId: string, tagId: string): Promise<void> {
    await apiClient.post(`/todos/${todoId}/tags`, { tag_id: tagId });
  },

  async removeFromTodo(todoId: string, tagId: string): Promise<void> {
    await apiClient.delete(`/todos/${todoId}/tags/${tagId}`);
  },

  async getForTodo(todoId: string): Promise<Tag[]> {
    const response = await apiClient.get<ListResponse<ApiTag>>(`/todos/${todoId}/tags`);
    return response.data.map(mapTag);
  },
};
