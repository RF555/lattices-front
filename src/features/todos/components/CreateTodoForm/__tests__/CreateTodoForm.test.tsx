/**
 * Tests for CreateTodoForm Component
 *
 * Tests form submission, keyboard shortcuts, description/tag toggles,
 * subtask placeholder switching, and temp ID guarding.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@/test/test-utils';
import userEvent from '@testing-library/user-event';
import { server } from '@/mocks/server';
import { http, HttpResponse } from 'msw';
import { CreateTodoForm } from '../CreateTodoForm';
import { useTodoUiStore } from '@features/todos/stores/todoUiStore';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
const API_VERSION = import.meta.env.VITE_API_VERSION || 'v1';
const API_URL = `${BASE_URL}/api/${API_VERSION}`;

// Mock the TagPicker component to simplify testing
vi.mock('@features/tags/components/TagPicker', () => ({
  TagPicker: ({
    selectedIds,
    onSelect,
    onDeselect,
  }: {
    selectedIds: string[];
    onSelect: (id: string) => void;
    onDeselect: (id: string) => void;
  }) => (
    <div data-testid="tag-picker">
      <button onClick={() => onSelect('tag-1')}>Add Tag</button>
      <button onClick={() => onDeselect('tag-1')}>Remove Tag</button>
      <div>Selected: {selectedIds.join(',')}</div>
    </div>
  ),
}));

describe('CreateTodoForm', () => {
  beforeEach(() => {
    // Reset store before each test
    useTodoUiStore.setState({
      selectedId: null,
      expandedIds: new Set(),
      showCompleted: true,
      sortBy: 'position',
      sortOrder: 'asc',
      searchQuery: '',
      filterTagIds: [],
      toolbarExpanded: false,
    });
  });

  describe('Rendering', () => {
    it('should render input field and submit button', () => {
      render(<CreateTodoForm />);

      expect(screen.getByPlaceholderText(/add task/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /^add$/i })).toBeInTheDocument();
    });

    it('should show task placeholder when no todo is selected', () => {
      render(<CreateTodoForm />);

      expect(screen.getByPlaceholderText(/add task\.\.\./i)).toBeInTheDocument();
    });

    it('should show subtask placeholder when a todo is selected', () => {
      useTodoUiStore.setState({ selectedId: 'todo-123' });
      render(<CreateTodoForm />);

      expect(screen.getByPlaceholderText(/add subtask\.\.\./i)).toBeInTheDocument();
    });

    it('should show subtask info text when a todo is selected', () => {
      useTodoUiStore.setState({ selectedId: 'todo-123' });
      render(<CreateTodoForm />);

      expect(screen.getByText(/adding as subtask to selected item/i)).toBeInTheDocument();
    });
  });

  describe('Submit Button State', () => {
    it('should disable submit button when input is empty', () => {
      render(<CreateTodoForm />);

      const submitButton = screen.getByRole('button', { name: /^add$/i });
      expect(submitButton).toBeDisabled();
    });

    it('should enable submit button when input has text', async () => {
      const user = userEvent.setup();
      render(<CreateTodoForm />);

      const input = screen.getByPlaceholderText(/add task/i);
      await user.type(input, 'New task');

      const submitButton = screen.getByRole('button', { name: /^add$/i });
      expect(submitButton).toBeEnabled();
    });

    it('should disable submit button when input contains only whitespace', async () => {
      const user = userEvent.setup();
      render(<CreateTodoForm />);

      const input = screen.getByPlaceholderText(/add task/i);
      await user.type(input, '   ');

      const submitButton = screen.getByRole('button', { name: /^add$/i });
      expect(submitButton).toBeDisabled();
    });
  });

  describe('Form Submission', () => {
    it('should submit on form submit with title', async () => {
      const user = userEvent.setup();
      let capturedBody: Record<string, unknown> = {};

      server.use(
        http.post(`${API_URL}/todos`, async ({ request }) => {
          capturedBody = (await request.json()) as Record<string, unknown>;
          return HttpResponse.json(
            {
              data: {
                id: 'new-1',
                title: capturedBody.title,
                is_completed: false,
                parent_id: null,
                position: 0,
                description: null,
                completed_at: null,
                child_count: 0,
                completed_child_count: 0,
                tags: [],
                created_at: '2024-01-01T00:00:00Z',
                updated_at: '2024-01-01T00:00:00Z',
              },
            },
            { status: 201 }
          );
        })
      );

      render(<CreateTodoForm />);

      const input = screen.getByPlaceholderText(/add task/i);
      await user.type(input, 'Test Task');
      await user.click(screen.getByRole('button', { name: /^add$/i }));

      await waitFor(() => {
        expect(capturedBody.title).toBe('Test Task');
      });
    });

    it('should submit on Enter key press', async () => {
      const user = userEvent.setup();
      let capturedBody: Record<string, unknown> = {};

      server.use(
        http.post(`${API_URL}/todos`, async ({ request }) => {
          capturedBody = (await request.json()) as Record<string, unknown>;
          return HttpResponse.json(
            {
              data: {
                id: 'new-1',
                title: capturedBody.title,
                is_completed: false,
                parent_id: null,
                position: 0,
                description: null,
                completed_at: null,
                child_count: 0,
                completed_child_count: 0,
                tags: [],
                created_at: '2024-01-01T00:00:00Z',
                updated_at: '2024-01-01T00:00:00Z',
              },
            },
            { status: 201 }
          );
        })
      );

      render(<CreateTodoForm />);

      const input = screen.getByPlaceholderText(/add task/i);
      await user.type(input, 'Test Task');
      await user.keyboard('{Enter}');

      await waitFor(() => {
        expect(capturedBody.title).toBe('Test Task');
      });
    });

    it('should clear input after successful submission', async () => {
      const user = userEvent.setup();

      server.use(
        http.post(`${API_URL}/todos`, async ({ request }) => {
          const body = (await request.json()) as Record<string, unknown>;
          return HttpResponse.json(
            {
              data: {
                id: 'new-1',
                title: body.title,
                is_completed: false,
                parent_id: null,
                position: 0,
                description: null,
                completed_at: null,
                child_count: 0,
                completed_child_count: 0,
                tags: [],
                created_at: '2024-01-01T00:00:00Z',
                updated_at: '2024-01-01T00:00:00Z',
              },
            },
            { status: 201 }
          );
        })
      );

      render(<CreateTodoForm />);

      const input = screen.getByPlaceholderText(/add task/i) as HTMLInputElement;
      await user.type(input, 'Test Task');
      await user.click(screen.getByRole('button', { name: /^add$/i }));

      await waitFor(() => {
        expect(input.value).toBe('');
      });
    });

    it('should include parentId when a todo is selected', async () => {
      const user = userEvent.setup();
      let capturedBody: Record<string, unknown> = {};

      useTodoUiStore.setState({ selectedId: 'parent-123' });

      server.use(
        http.post(`${API_URL}/todos`, async ({ request }) => {
          capturedBody = (await request.json()) as Record<string, unknown>;
          return HttpResponse.json(
            {
              data: {
                id: 'new-1',
                title: capturedBody.title,
                is_completed: false,
                parent_id: capturedBody.parent_id,
                position: 0,
                description: null,
                completed_at: null,
                child_count: 0,
                completed_child_count: 0,
                tags: [],
                created_at: '2024-01-01T00:00:00Z',
                updated_at: '2024-01-01T00:00:00Z',
              },
            },
            { status: 201 }
          );
        })
      );

      render(<CreateTodoForm />);

      const input = screen.getByPlaceholderText(/add subtask/i);
      await user.type(input, 'Subtask');
      await user.click(screen.getByRole('button', { name: /^add$/i }));

      await waitFor(() => {
        expect(capturedBody.parent_id).toBe('parent-123');
      });
    });

    it('should guard against temp- prefix in parentId', async () => {
      const user = userEvent.setup();
      let capturedBody: Record<string, unknown> = {};

      useTodoUiStore.setState({ selectedId: 'temp-optimistic-123' });

      server.use(
        http.post(`${API_URL}/todos`, async ({ request }) => {
          capturedBody = (await request.json()) as Record<string, unknown>;
          return HttpResponse.json(
            {
              data: {
                id: 'new-1',
                title: capturedBody.title,
                is_completed: false,
                parent_id: null,
                position: 0,
                description: null,
                completed_at: null,
                child_count: 0,
                completed_child_count: 0,
                tags: [],
                created_at: '2024-01-01T00:00:00Z',
                updated_at: '2024-01-01T00:00:00Z',
              },
            },
            { status: 201 }
          );
        })
      );

      render(<CreateTodoForm />);

      const input = screen.getByPlaceholderText(/add subtask/i);
      await user.type(input, 'Task with temp parent');
      await user.click(screen.getByRole('button', { name: /^add$/i }));

      await waitFor(() => {
        // parentId should be undefined/null, not temp-optimistic-123
        expect(capturedBody.parent_id).toBeUndefined();
      });
    });

    it('should not submit when title is empty', async () => {
      const user = userEvent.setup();
      const mockPost = vi.fn();

      server.use(
        http.post(`${API_URL}/todos`, () => {
          mockPost();
          return HttpResponse.json({ data: {} }, { status: 201 });
        })
      );

      render(<CreateTodoForm />);

      await user.click(screen.getByRole('button', { name: /^add$/i }));

      // Wait a bit to ensure no request was made
      await new Promise((resolve) => setTimeout(resolve, 100));
      expect(mockPost).not.toHaveBeenCalled();
    });
  });

  describe('Description Toggle', () => {
    it('should show description toggle button initially', () => {
      render(<CreateTodoForm />);

      expect(screen.getByRole('button', { name: /\+ add description/i })).toBeInTheDocument();
    });

    it('should show textarea when description toggle is clicked', async () => {
      const user = userEvent.setup();
      render(<CreateTodoForm />);

      await user.click(screen.getByRole('button', { name: /\+ add description/i }));

      expect(screen.getByPlaceholderText(/add a description \(optional\)/i)).toBeInTheDocument();
    });

    it('should hide description toggle button when textarea is shown', async () => {
      const user = userEvent.setup();
      render(<CreateTodoForm />);

      await user.click(screen.getByRole('button', { name: /\+ add description/i }));

      expect(
        screen.queryByRole('button', { name: /\+ add description/i })
      ).not.toBeInTheDocument();
    });

    it('should show remove description button when textarea is visible', async () => {
      const user = userEvent.setup();
      render(<CreateTodoForm />);

      await user.click(screen.getByRole('button', { name: /\+ add description/i }));

      expect(screen.getByRole('button', { name: /remove description/i })).toBeInTheDocument();
    });

    it('should hide textarea when remove description is clicked', async () => {
      const user = userEvent.setup();
      render(<CreateTodoForm />);

      await user.click(screen.getByRole('button', { name: /\+ add description/i }));
      await user.click(screen.getByRole('button', { name: /remove description/i }));

      expect(
        screen.queryByPlaceholderText(/add a description \(optional\)/i)
      ).not.toBeInTheDocument();
    });

    it('should include description in submission when provided', async () => {
      const user = userEvent.setup();
      let capturedBody: Record<string, unknown> = {};

      server.use(
        http.post(`${API_URL}/todos`, async ({ request }) => {
          capturedBody = (await request.json()) as Record<string, unknown>;
          return HttpResponse.json(
            {
              data: {
                id: 'new-1',
                title: capturedBody.title,
                description: capturedBody.description,
                is_completed: false,
                parent_id: null,
                position: 0,
                completed_at: null,
                child_count: 0,
                completed_child_count: 0,
                tags: [],
                created_at: '2024-01-01T00:00:00Z',
                updated_at: '2024-01-01T00:00:00Z',
              },
            },
            { status: 201 }
          );
        })
      );

      render(<CreateTodoForm />);

      const titleInput = screen.getByPlaceholderText(/add task/i);
      await user.type(titleInput, 'Task with description');

      await user.click(screen.getByRole('button', { name: /\+ add description/i }));
      const descriptionInput = screen.getByPlaceholderText(/add a description \(optional\)/i);
      await user.type(descriptionInput, 'This is a detailed description');

      await user.click(screen.getByRole('button', { name: /^add$/i }));

      await waitFor(() => {
        expect(capturedBody.description).toBe('This is a detailed description');
      });
    });

    it('should clear description after successful submission', async () => {
      const user = userEvent.setup();

      server.use(
        http.post(`${API_URL}/todos`, async ({ request }) => {
          const body = (await request.json()) as Record<string, unknown>;
          return HttpResponse.json(
            {
              data: {
                id: 'new-1',
                title: body.title,
                is_completed: false,
                parent_id: null,
                position: 0,
                description: null,
                completed_at: null,
                child_count: 0,
                completed_child_count: 0,
                tags: [],
                created_at: '2024-01-01T00:00:00Z',
                updated_at: '2024-01-01T00:00:00Z',
              },
            },
            { status: 201 }
          );
        })
      );

      render(<CreateTodoForm />);

      await user.type(screen.getByPlaceholderText(/add task/i), 'Task');
      await user.click(screen.getByRole('button', { name: /\+ add description/i }));
      await user.type(
        screen.getByPlaceholderText(/add a description \(optional\)/i),
        'Description'
      );
      await user.click(screen.getByRole('button', { name: /^add$/i }));

      await waitFor(() => {
        // Description toggle should be hidden after submission
        expect(
          screen.queryByPlaceholderText(/add a description \(optional\)/i)
        ).not.toBeInTheDocument();
      });
    });
  });

  describe('Tags Toggle', () => {
    it('should show tags toggle button initially', () => {
      render(<CreateTodoForm />);

      expect(screen.getByRole('button', { name: /\+ add tags/i })).toBeInTheDocument();
    });

    it('should show tag picker when tags toggle is clicked', async () => {
      const user = userEvent.setup();
      render(<CreateTodoForm />);

      await user.click(screen.getByRole('button', { name: /\+ add tags/i }));

      expect(screen.getByTestId('tag-picker')).toBeInTheDocument();
    });

    it('should hide tags toggle button when tag picker is shown', async () => {
      const user = userEvent.setup();
      render(<CreateTodoForm />);

      await user.click(screen.getByRole('button', { name: /\+ add tags/i }));

      expect(screen.queryByRole('button', { name: /\+ add tags/i })).not.toBeInTheDocument();
    });

    it('should show remove tags button when tag picker is visible', async () => {
      const user = userEvent.setup();
      render(<CreateTodoForm />);

      await user.click(screen.getByRole('button', { name: /\+ add tags/i }));

      expect(screen.getByRole('button', { name: /remove tags/i })).toBeInTheDocument();
    });

    it('should hide tag picker when remove tags is clicked', async () => {
      const user = userEvent.setup();
      render(<CreateTodoForm />);

      await user.click(screen.getByRole('button', { name: /\+ add tags/i }));
      await user.click(screen.getByRole('button', { name: /remove tags/i }));

      expect(screen.queryByTestId('tag-picker')).not.toBeInTheDocument();
    });

    it('should clear selected tags after successful submission', async () => {
      const user = userEvent.setup();

      server.use(
        http.post(`${API_URL}/todos`, async ({ request }) => {
          const body = (await request.json()) as Record<string, unknown>;
          return HttpResponse.json(
            {
              data: {
                id: 'new-1',
                title: body.title,
                is_completed: false,
                parent_id: null,
                position: 0,
                description: null,
                completed_at: null,
                child_count: 0,
                completed_child_count: 0,
                tags: [],
                created_at: '2024-01-01T00:00:00Z',
                updated_at: '2024-01-01T00:00:00Z',
              },
            },
            { status: 201 }
          );
        })
      );

      render(<CreateTodoForm />);

      await user.type(screen.getByPlaceholderText(/add task/i), 'Task with tags');
      await user.click(screen.getByRole('button', { name: /\+ add tags/i }));
      await user.click(screen.getByRole('button', { name: /add tag/i }));
      await user.click(screen.getByRole('button', { name: /^add$/i }));

      await waitFor(() => {
        // Tag picker should be hidden after submission
        expect(screen.queryByTestId('tag-picker')).not.toBeInTheDocument();
      });
    });
  });
});
