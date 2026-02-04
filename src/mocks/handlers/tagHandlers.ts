import { http, HttpResponse } from 'msw';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
const API_VERSION = import.meta.env.VITE_API_VERSION || 'v1';
const API_URL = `${BASE_URL}/api/${API_VERSION}`;

let mockTags = [
  {
    id: 'tag-1', name: 'Work', color_hex: '#3b82f6',
    usage_count: 2, created_at: new Date().toISOString(),
  },
  {
    id: 'tag-2', name: 'Personal', color_hex: '#22c55e',
    usage_count: 1, created_at: new Date().toISOString(),
  },
];

export const tagHandlers = [
  http.get(`${API_URL}/tags`, () => {
    return HttpResponse.json({ data: mockTags });
  }),

  http.post(`${API_URL}/tags`, async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    const newTag = {
      id: `tag-${Date.now()}`,
      name: body.name as string,
      color_hex: (body.color_hex as string) || '#6b7280',
      usage_count: 0,
      created_at: new Date().toISOString(),
    };
    mockTags.push(newTag);
    return HttpResponse.json({ data: newTag }, { status: 201 });
  }),

  http.patch(`${API_URL}/tags/:id`, async ({ params, request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    const tag = mockTags.find((t) => t.id === params.id);
    if (!tag) {
      return HttpResponse.json(
        { error_code: 'TAG_NOT_FOUND', message: 'Tag not found' },
        { status: 404 }
      );
    }
    Object.assign(tag, body);
    return HttpResponse.json({ data: tag });
  }),

  http.delete(`${API_URL}/tags/:id`, ({ params }) => {
    mockTags = mockTags.filter((t) => t.id !== params.id);
    return new HttpResponse(null, { status: 204 });
  }),
];
