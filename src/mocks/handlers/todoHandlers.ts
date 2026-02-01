import { http, HttpResponse } from 'msw';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

interface MockTodo {
  id: string;
  title: string;
  is_completed: boolean;
  parent_id: string | null;
  position: number;
  description: string | null;
  completed_at: string | null;
  child_count: number;
  completed_child_count: number;
  tags: { id: string; name: string; color_hex: string }[];
  created_at: string;
  updated_at: string;
}

function daysAgo(days: number): string {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
}
function hoursAgo(hours: number): string {
  return new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
}

let mockTodos: MockTodo[] = [
  {
    id: '1', title: 'First task', is_completed: false,
    parent_id: null, position: 0,
    description: 'This is the first task with a detailed description. It has subtasks below.',
    completed_at: null,
    child_count: 1, completed_child_count: 0, tags: [],
    created_at: daysAgo(3), updated_at: hoursAgo(1),
  },
  {
    id: '2', title: 'Second task', is_completed: false,
    parent_id: null, position: 1, description: null, completed_at: null,
    child_count: 0, completed_child_count: 0, tags: [],
    created_at: daysAgo(1), updated_at: daysAgo(1),
  },
  {
    id: '3', title: 'Subtask', is_completed: false,
    parent_id: '1', position: 0,
    description: 'A subtask with its own description for testing nested detail panels.',
    completed_at: null,
    child_count: 0, completed_child_count: 0, tags: [],
    created_at: daysAgo(7), updated_at: daysAgo(2),
  },
];

export const todoHandlers = [
  http.get(`${API_URL}/todos`, () => {
    const rootCount = mockTodos.filter((t) => t.parent_id === null).length;
    return HttpResponse.json({
      data: mockTodos,
      meta: { total: mockTodos.length, root_count: rootCount },
    });
  }),

  http.get(`${API_URL}/todos/:id`, ({ params }) => {
    const todo = mockTodos.find((t) => t.id === params.id);
    if (!todo) {
      return HttpResponse.json(
        { error_code: 'TASK_NOT_FOUND', message: 'Task not found' },
        { status: 404 }
      );
    }
    return HttpResponse.json({ data: todo });
  }),

  http.post(`${API_URL}/todos`, async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    const newTodo = {
      id: `todo-${Date.now()}`,
      title: body.title as string,
      description: (body.description as string) || null,
      is_completed: false,
      parent_id: (body.parent_id as string) || null,
      position: mockTodos.length,
      completed_at: null,
      child_count: 0,
      completed_child_count: 0,
      tags: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    mockTodos.push(newTodo);
    return HttpResponse.json({ data: newTodo }, { status: 201 });
  }),

  http.patch(`${API_URL}/todos/:id`, async ({ params, request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    const todo = mockTodos.find((t) => t.id === params.id);
    if (!todo) {
      return HttpResponse.json(
        { error_code: 'TASK_NOT_FOUND', message: 'Task not found' },
        { status: 404 }
      );
    }
    Object.assign(todo, body, { updated_at: new Date().toISOString() });
    return HttpResponse.json({ data: todo });
  }),

  http.delete(`${API_URL}/todos/:id`, ({ params }) => {
    mockTodos = mockTodos.filter((t) => t.id !== params.id && t.parent_id !== params.id);
    return new HttpResponse(null, { status: 204 });
  }),

  // Add tag to todo
  http.post(`${API_URL}/todos/:todoId/tags`, async ({ params, request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    const todo = mockTodos.find((t) => t.id === params.todoId);
    if (!todo) {
      return HttpResponse.json(
        { error_code: 'TASK_NOT_FOUND', message: 'Task not found' },
        { status: 404 }
      );
    }
    const tagId = body.tag_id as string;
    if (!todo.tags.find((t) => t.id === tagId)) {
      todo.tags.push({ id: tagId, name: 'Mock Tag', color_hex: '#3b82f6' });
    }
    return HttpResponse.json({ data: todo });
  }),

  // Remove tag from todo
  http.delete(`${API_URL}/todos/:todoId/tags/:tagId`, ({ params }) => {
    const todo = mockTodos.find((t) => t.id === params.todoId);
    if (todo) {
      todo.tags = todo.tags.filter((t) => t.id !== params.tagId);
    }
    return new HttpResponse(null, { status: 204 });
  }),
];
