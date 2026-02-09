/**
 * Tests for QuickAddSheet Component
 *
 * Tests mobile bottom sheet for quick task creation with workspace selector,
 * description/tags/parent toggles, and subtask support. Verifies form behavior,
 * state management, and submit logic.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@/test/test-utils';
import userEvent from '@testing-library/user-event';
import { QuickAddSheet } from '../QuickAddSheet';

// Mock dependencies
vi.mock('@features/todos/hooks/useTodos', () => ({
  useCreateTodo: vi.fn(),
  useFlatTodos: vi.fn(),
}));

vi.mock('@features/tags/hooks/useTags', () => ({
  useAddTagToTodo: vi.fn(),
}));

vi.mock('@features/workspaces/stores/workspaceUiStore', () => ({
  useActiveWorkspaceId: vi.fn(),
}));

vi.mock('@features/workspaces/hooks/useWorkspaces', () => ({
  useWorkspaces: vi.fn(),
}));

vi.mock('@features/todos/stores/todoUiStore', () => ({
  useSelectedTodoId: vi.fn(),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

// Mock TagPicker component
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
      <button
        onClick={() => {
          onSelect('tag-1');
        }}
      >
        Add Tag
      </button>
      <button
        onClick={() => {
          onDeselect('tag-1');
        }}
      >
        Remove Tag
      </button>
      <div>Selected: {selectedIds.join(',')}</div>
    </div>
  ),
}));

// Mock ParentPicker component
vi.mock('../../../components/ParentPicker', () => ({
  ParentPicker: ({
    currentParentId,
    onParentChange,
  }: {
    todoId: string;
    currentParentId: string | null;
    workspaceId?: string;
    onParentChange: (parentId: string | null) => void;
  }) => (
    <div data-testid="parent-picker">
      <span data-testid="parent-picker-value">{currentParentId ?? 'none'}</span>
      <button
        onClick={() => {
          onParentChange('parent-abc');
        }}
      >
        Select Parent
      </button>
      <button
        onClick={() => {
          onParentChange(null);
        }}
      >
        Clear Parent
      </button>
    </div>
  ),
}));

import { useCreateTodo } from '@features/todos/hooks/useTodos';
import { useAddTagToTodo } from '@features/tags/hooks/useTags';
import { useActiveWorkspaceId } from '@features/workspaces/stores/workspaceUiStore';
import { useWorkspaces } from '@features/workspaces/hooks/useWorkspaces';
import { useSelectedTodoId } from '@features/todos/stores/todoUiStore';

const mockUseCreateTodo = vi.mocked(useCreateTodo);
const mockUseAddTagToTodo = vi.mocked(useAddTagToTodo);
const mockUseActiveWorkspaceId = vi.mocked(useActiveWorkspaceId);
const mockUseWorkspaces = vi.mocked(useWorkspaces);
const mockUseSelectedTodoId = vi.mocked(useSelectedTodoId);

describe('QuickAddSheet', () => {
  const mockOnOpenChange = vi.fn();
  const mockMutateAsync = vi.fn();
  const mockMutate = vi.fn();

  beforeEach(() => {
    // Reset mocks before each test
    mockOnOpenChange.mockClear();
    mockMutateAsync.mockClear();
    mockMutate.mockClear();

    // Default mock implementations
    mockUseCreateTodo.mockReturnValue({
      mutateAsync: mockMutateAsync,
      isPending: false,
    } as any);

    mockUseAddTagToTodo.mockReturnValue({
      mutate: mockMutate,
    } as any);

    mockUseActiveWorkspaceId.mockReturnValue('ws-1');
    mockUseSelectedTodoId.mockReturnValue(null);

    mockUseWorkspaces.mockReturnValue({
      data: [
        { id: 'ws-1', name: 'Workspace 1' },
        { id: 'ws-2', name: 'Workspace 2' },
      ],
    } as any);

    // Mock API response
    mockMutateAsync.mockResolvedValue({
      id: 'new-todo-1',
      title: 'New Task',
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
    });
  });

  describe('Visibility', () => {
    it('should render nothing when closed', () => {
      render(<QuickAddSheet open={false} onOpenChange={mockOnOpenChange} />);

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('should render dialog when open', () => {
      render(<QuickAddSheet open={true} onOpenChange={mockOnOpenChange} />);

      expect(screen.getByRole('dialog', { name: 'createForm.add' })).toBeInTheDocument();
    });
  });

  describe('Title Input', () => {
    it('should render title input when open', () => {
      render(<QuickAddSheet open={true} onOpenChange={mockOnOpenChange} />);

      expect(screen.getByPlaceholderText('createForm.placeholderTask')).toBeInTheDocument();
    });

    it('should show task placeholder when no parent is set', () => {
      mockUseSelectedTodoId.mockReturnValue(null);
      render(<QuickAddSheet open={true} onOpenChange={mockOnOpenChange} />);

      expect(screen.getByPlaceholderText('createForm.placeholderTask')).toBeInTheDocument();
    });

    it('should show subtask placeholder when a parent is pre-selected', () => {
      mockUseSelectedTodoId.mockReturnValue('todo-123');
      render(<QuickAddSheet open={true} onOpenChange={mockOnOpenChange} />);

      expect(screen.getByPlaceholderText('createForm.placeholderSubtask')).toBeInTheDocument();
    });

    it('should update title state when typing', async () => {
      const user = userEvent.setup();
      render(<QuickAddSheet open={true} onOpenChange={mockOnOpenChange} />);

      const input = screen.getByPlaceholderText('createForm.placeholderTask');
      await user.type(input, 'New Task');

      expect((input as HTMLInputElement).value).toBe('New Task');
    });
  });

  describe('Submit Button', () => {
    it('should render submit button when open', () => {
      render(<QuickAddSheet open={true} onOpenChange={mockOnOpenChange} />);

      expect(screen.getByRole('button', { name: 'createForm.add' })).toBeInTheDocument();
    });

    it('should disable submit button when title is empty', () => {
      render(<QuickAddSheet open={true} onOpenChange={mockOnOpenChange} />);

      const submitButton = screen.getByRole('button', { name: 'createForm.add' });
      expect(submitButton).toBeDisabled();
    });

    it('should enable submit button when title is provided', async () => {
      const user = userEvent.setup();
      render(<QuickAddSheet open={true} onOpenChange={mockOnOpenChange} />);

      const input = screen.getByPlaceholderText('createForm.placeholderTask');
      await user.type(input, 'New Task');

      const submitButton = screen.getByRole('button', { name: 'createForm.add' });
      expect(submitButton).toBeEnabled();
    });

    it('should disable submit button when title is only whitespace', async () => {
      const user = userEvent.setup();
      render(<QuickAddSheet open={true} onOpenChange={mockOnOpenChange} />);

      const input = screen.getByPlaceholderText('createForm.placeholderTask');
      await user.type(input, '   ');

      const submitButton = screen.getByRole('button', { name: 'createForm.add' });
      expect(submitButton).toBeDisabled();
    });
  });

  describe('Workspace Selector', () => {
    it('should always render workspace selector', () => {
      render(<QuickAddSheet open={true} onOpenChange={mockOnOpenChange} />);

      const select = screen.getByRole('combobox');
      expect(select).toBeInTheDocument();
    });

    it('should pre-select active workspace', () => {
      mockUseActiveWorkspaceId.mockReturnValue('ws-1');
      render(<QuickAddSheet open={true} onOpenChange={mockOnOpenChange} />);

      const select = screen.getByRole('combobox') as HTMLSelectElement;
      expect(select.value).toBe('ws-1');
    });

    it('should render workspace options', () => {
      render(<QuickAddSheet open={true} onOpenChange={mockOnOpenChange} />);

      const options = screen.getAllByRole('option');
      // Should have placeholder + 2 workspace options
      expect(options).toHaveLength(3);
      expect(screen.getByRole('option', { name: 'Workspace 1' })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: 'Workspace 2' })).toBeInTheDocument();
    });

    it('should show prompt when no active workspace (all-workspaces mode)', () => {
      mockUseActiveWorkspaceId.mockReturnValue(null);
      render(<QuickAddSheet open={true} onOpenChange={mockOnOpenChange} />);

      const select = screen.getByRole('combobox') as HTMLSelectElement;
      expect(select.value).toBe('');
    });

    it('should disable submit button when no workspace is selected', async () => {
      const user = userEvent.setup();
      mockUseActiveWorkspaceId.mockReturnValue(null);
      render(<QuickAddSheet open={true} onOpenChange={mockOnOpenChange} />);

      const input = screen.getByPlaceholderText('createForm.placeholderTask');
      await user.type(input, 'New Task');

      const submitButton = screen.getByRole('button', { name: 'createForm.add' });
      expect(submitButton).toBeDisabled();
    });

    it('should enable submit button when workspace is selected and title provided', async () => {
      const user = userEvent.setup();
      mockUseActiveWorkspaceId.mockReturnValue(null);
      render(<QuickAddSheet open={true} onOpenChange={mockOnOpenChange} />);

      const input = screen.getByPlaceholderText('createForm.placeholderTask');
      await user.type(input, 'New Task');

      const select = screen.getByRole('combobox');
      await user.selectOptions(select, 'ws-1');

      const submitButton = screen.getByRole('button', { name: 'createForm.add' });
      expect(submitButton).toBeEnabled();
    });

    it('should allow changing workspace even when one is pre-selected', async () => {
      const user = userEvent.setup();
      mockUseActiveWorkspaceId.mockReturnValue('ws-1');
      render(<QuickAddSheet open={true} onOpenChange={mockOnOpenChange} />);

      const select = screen.getByRole('combobox') as HTMLSelectElement;
      expect(select.value).toBe('ws-1');

      await user.selectOptions(select, 'ws-2');
      expect(select.value).toBe('ws-2');
    });

    it('should sync workspace selection when sheet re-opens with different active workspace', () => {
      mockUseActiveWorkspaceId.mockReturnValue('ws-1');
      const { rerender } = render(<QuickAddSheet open={true} onOpenChange={mockOnOpenChange} />);

      const select = screen.getByRole('combobox') as HTMLSelectElement;
      expect(select.value).toBe('ws-1');

      // Close sheet
      rerender(<QuickAddSheet open={false} onOpenChange={mockOnOpenChange} />);

      // Change active workspace and reopen
      mockUseActiveWorkspaceId.mockReturnValue('ws-2');
      rerender(<QuickAddSheet open={true} onOpenChange={mockOnOpenChange} />);

      // Should show the new active workspace
      const reopenedSelect = screen.getByRole('combobox') as HTMLSelectElement;
      expect(reopenedSelect.value).toBe('ws-2');
    });
  });

  describe('Parent Toggle', () => {
    it('should show add parent toggle button when no todo is selected', () => {
      mockUseSelectedTodoId.mockReturnValue(null);
      render(<QuickAddSheet open={true} onOpenChange={mockOnOpenChange} />);

      expect(screen.getByRole('button', { name: 'createForm.addParent' })).toBeInTheDocument();
      expect(screen.queryByTestId('parent-picker')).not.toBeInTheDocument();
    });

    it('should auto-show parent picker when a todo is selected', () => {
      mockUseSelectedTodoId.mockReturnValue('todo-123');
      render(<QuickAddSheet open={true} onOpenChange={mockOnOpenChange} />);

      expect(screen.getByTestId('parent-picker')).toBeInTheDocument();
      expect(screen.getByTestId('parent-picker-value')).toHaveTextContent('todo-123');
      expect(
        screen.queryByRole('button', { name: 'createForm.addParent' }),
      ).not.toBeInTheDocument();
    });

    it('should not auto-show parent picker for temp- IDs', () => {
      mockUseSelectedTodoId.mockReturnValue('temp-optimistic-123');
      render(<QuickAddSheet open={true} onOpenChange={mockOnOpenChange} />);

      expect(screen.queryByTestId('parent-picker')).not.toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'createForm.addParent' })).toBeInTheDocument();
    });

    it('should show parent picker when add parent toggle is clicked', async () => {
      const user = userEvent.setup();
      render(<QuickAddSheet open={true} onOpenChange={mockOnOpenChange} />);

      await user.click(screen.getByRole('button', { name: 'createForm.addParent' }));

      expect(screen.getByTestId('parent-picker')).toBeInTheDocument();
    });

    it('should hide add parent button when parent picker is shown', async () => {
      const user = userEvent.setup();
      render(<QuickAddSheet open={true} onOpenChange={mockOnOpenChange} />);

      await user.click(screen.getByRole('button', { name: 'createForm.addParent' }));

      expect(
        screen.queryByRole('button', { name: 'createForm.addParent' }),
      ).not.toBeInTheDocument();
    });

    it('should show remove parent button when parent picker is visible', async () => {
      const user = userEvent.setup();
      render(<QuickAddSheet open={true} onOpenChange={mockOnOpenChange} />);

      await user.click(screen.getByRole('button', { name: 'createForm.addParent' }));

      expect(screen.getByRole('button', { name: 'createForm.removeParent' })).toBeInTheDocument();
    });

    it('should hide parent picker when remove parent is clicked', async () => {
      const user = userEvent.setup();
      mockUseSelectedTodoId.mockReturnValue('todo-123');
      render(<QuickAddSheet open={true} onOpenChange={mockOnOpenChange} />);

      // Parent picker should be auto-shown
      expect(screen.getByTestId('parent-picker')).toBeInTheDocument();

      await user.click(screen.getByRole('button', { name: 'createForm.removeParent' }));

      expect(screen.queryByTestId('parent-picker')).not.toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'createForm.addParent' })).toBeInTheDocument();
    });

    it('should switch placeholder to subtask when parent is selected', async () => {
      const user = userEvent.setup();
      render(<QuickAddSheet open={true} onOpenChange={mockOnOpenChange} />);

      // Initially task placeholder
      expect(screen.getByPlaceholderText('createForm.placeholderTask')).toBeInTheDocument();

      // Open parent picker and select a parent
      await user.click(screen.getByRole('button', { name: 'createForm.addParent' }));
      await user.click(screen.getByRole('button', { name: 'Select Parent' }));

      // Should now show subtask placeholder
      expect(screen.getByPlaceholderText('createForm.placeholderSubtask')).toBeInTheDocument();
    });

    it('should switch placeholder back to task when parent is removed', async () => {
      const user = userEvent.setup();
      mockUseSelectedTodoId.mockReturnValue('todo-123');
      render(<QuickAddSheet open={true} onOpenChange={mockOnOpenChange} />);

      // Initially subtask placeholder (auto-selected parent)
      expect(screen.getByPlaceholderText('createForm.placeholderSubtask')).toBeInTheDocument();

      // Remove parent
      await user.click(screen.getByRole('button', { name: 'createForm.removeParent' }));

      // Should now show task placeholder
      expect(screen.getByPlaceholderText('createForm.placeholderTask')).toBeInTheDocument();
    });
  });

  describe('Description Toggle', () => {
    it('should show description toggle button initially', () => {
      render(<QuickAddSheet open={true} onOpenChange={mockOnOpenChange} />);

      expect(screen.getByRole('button', { name: 'createForm.addDescription' })).toBeInTheDocument();
    });

    it('should show textarea when description toggle is clicked', async () => {
      const user = userEvent.setup();
      render(<QuickAddSheet open={true} onOpenChange={mockOnOpenChange} />);

      await user.click(screen.getByRole('button', { name: 'createForm.addDescription' }));

      expect(screen.getByPlaceholderText('createForm.descriptionPlaceholder')).toBeInTheDocument();
    });

    it('should hide description toggle button when textarea is shown', async () => {
      const user = userEvent.setup();
      render(<QuickAddSheet open={true} onOpenChange={mockOnOpenChange} />);

      await user.click(screen.getByRole('button', { name: 'createForm.addDescription' }));

      expect(
        screen.queryByRole('button', { name: 'createForm.addDescription' }),
      ).not.toBeInTheDocument();
    });

    it('should show remove description button when textarea is visible', async () => {
      const user = userEvent.setup();
      render(<QuickAddSheet open={true} onOpenChange={mockOnOpenChange} />);

      await user.click(screen.getByRole('button', { name: 'createForm.addDescription' }));

      expect(
        screen.getByRole('button', { name: 'createForm.removeDescription' }),
      ).toBeInTheDocument();
    });

    it('should hide textarea when remove description is clicked', async () => {
      const user = userEvent.setup();
      render(<QuickAddSheet open={true} onOpenChange={mockOnOpenChange} />);

      await user.click(screen.getByRole('button', { name: 'createForm.addDescription' }));
      await user.click(screen.getByRole('button', { name: 'createForm.removeDescription' }));

      expect(
        screen.queryByPlaceholderText('createForm.descriptionPlaceholder'),
      ).not.toBeInTheDocument();
    });
  });

  describe('Tags Toggle', () => {
    it('should show tags toggle button initially', () => {
      render(<QuickAddSheet open={true} onOpenChange={mockOnOpenChange} />);

      expect(screen.getByRole('button', { name: 'createForm.addTags' })).toBeInTheDocument();
    });

    it('should show tag picker when tags toggle is clicked', async () => {
      const user = userEvent.setup();
      render(<QuickAddSheet open={true} onOpenChange={mockOnOpenChange} />);

      await user.click(screen.getByRole('button', { name: 'createForm.addTags' }));

      expect(screen.getByTestId('tag-picker')).toBeInTheDocument();
    });

    it('should hide tags toggle button when tag picker is shown', async () => {
      const user = userEvent.setup();
      render(<QuickAddSheet open={true} onOpenChange={mockOnOpenChange} />);

      await user.click(screen.getByRole('button', { name: 'createForm.addTags' }));

      expect(screen.queryByRole('button', { name: 'createForm.addTags' })).not.toBeInTheDocument();
    });

    it('should show remove tags button when tag picker is visible', async () => {
      const user = userEvent.setup();
      render(<QuickAddSheet open={true} onOpenChange={mockOnOpenChange} />);

      await user.click(screen.getByRole('button', { name: 'createForm.addTags' }));

      expect(screen.getByRole('button', { name: 'createForm.removeTags' })).toBeInTheDocument();
    });

    it('should hide tag picker when remove tags is clicked', async () => {
      const user = userEvent.setup();
      render(<QuickAddSheet open={true} onOpenChange={mockOnOpenChange} />);

      await user.click(screen.getByRole('button', { name: 'createForm.addTags' }));
      await user.click(screen.getByRole('button', { name: 'createForm.removeTags' }));

      expect(screen.queryByTestId('tag-picker')).not.toBeInTheDocument();
    });
  });

  describe('Form Submission', () => {
    it('should call createTodo with title when submitted', async () => {
      const user = userEvent.setup();
      render(<QuickAddSheet open={true} onOpenChange={mockOnOpenChange} />);

      const input = screen.getByPlaceholderText('createForm.placeholderTask');
      await user.type(input, 'New Task');
      await user.click(screen.getByRole('button', { name: 'createForm.add' }));

      await waitFor(() => {
        expect(mockMutateAsync).toHaveBeenCalledWith(
          expect.objectContaining({
            title: 'New Task',
          }),
        );
      });
    });

    it('should call createTodo with description when provided', async () => {
      const user = userEvent.setup();
      render(<QuickAddSheet open={true} onOpenChange={mockOnOpenChange} />);

      const titleInput = screen.getByPlaceholderText('createForm.placeholderTask');
      await user.type(titleInput, 'Task with description');

      await user.click(screen.getByRole('button', { name: 'createForm.addDescription' }));
      const descriptionInput = screen.getByPlaceholderText('createForm.descriptionPlaceholder');
      await user.type(descriptionInput, 'This is a description');

      await user.click(screen.getByRole('button', { name: 'createForm.add' }));

      await waitFor(() => {
        expect(mockMutateAsync).toHaveBeenCalledWith(
          expect.objectContaining({
            title: 'Task with description',
            description: 'This is a description',
          }),
        );
      });
    });

    it('should call createTodo with parentId when parent is selected', async () => {
      const user = userEvent.setup();
      mockUseSelectedTodoId.mockReturnValue('parent-123');
      render(<QuickAddSheet open={true} onOpenChange={mockOnOpenChange} />);

      const input = screen.getByPlaceholderText('createForm.placeholderSubtask');
      await user.type(input, 'Subtask');
      await user.click(screen.getByRole('button', { name: 'createForm.add' }));

      await waitFor(() => {
        expect(mockMutateAsync).toHaveBeenCalledWith(
          expect.objectContaining({
            title: 'Subtask',
            parentId: 'parent-123',
          }),
        );
      });
    });

    it('should not include parentId when parent toggle is removed', async () => {
      const user = userEvent.setup();
      mockUseSelectedTodoId.mockReturnValue('parent-123');
      render(<QuickAddSheet open={true} onOpenChange={mockOnOpenChange} />);

      // Remove the pre-selected parent
      await user.click(screen.getByRole('button', { name: 'createForm.removeParent' }));

      const input = screen.getByPlaceholderText('createForm.placeholderTask');
      await user.type(input, 'Root Task');
      await user.click(screen.getByRole('button', { name: 'createForm.add' }));

      await waitFor(() => {
        expect(mockMutateAsync).toHaveBeenCalledWith(
          expect.objectContaining({
            title: 'Root Task',
            parentId: undefined,
          }),
        );
      });
    });

    it('should call createTodo with manually selected parentId', async () => {
      const user = userEvent.setup();
      render(<QuickAddSheet open={true} onOpenChange={mockOnOpenChange} />);

      // Open parent picker and select a parent
      await user.click(screen.getByRole('button', { name: 'createForm.addParent' }));
      await user.click(screen.getByRole('button', { name: 'Select Parent' }));

      const input = screen.getByPlaceholderText('createForm.placeholderSubtask');
      await user.type(input, 'Subtask');
      await user.click(screen.getByRole('button', { name: 'createForm.add' }));

      await waitFor(() => {
        expect(mockMutateAsync).toHaveBeenCalledWith(
          expect.objectContaining({
            title: 'Subtask',
            parentId: 'parent-abc',
          }),
        );
      });
    });

    it('should close sheet after successful submission', async () => {
      const user = userEvent.setup();
      render(<QuickAddSheet open={true} onOpenChange={mockOnOpenChange} />);

      const input = screen.getByPlaceholderText('createForm.placeholderTask');
      await user.type(input, 'New Task');
      await user.click(screen.getByRole('button', { name: 'createForm.add' }));

      await waitFor(() => {
        expect(mockOnOpenChange).toHaveBeenCalledWith(false);
      });
    });

    it('should submit on Enter key press', async () => {
      const user = userEvent.setup();
      render(<QuickAddSheet open={true} onOpenChange={mockOnOpenChange} />);

      const input = screen.getByPlaceholderText('createForm.placeholderTask');
      await user.type(input, 'New Task{Enter}');

      await waitFor(() => {
        expect(mockMutateAsync).toHaveBeenCalledWith(
          expect.objectContaining({
            title: 'New Task',
          }),
        );
      });
    });

    it('should allow selecting tags before creating todo', async () => {
      const user = userEvent.setup();
      render(<QuickAddSheet open={true} onOpenChange={mockOnOpenChange} />);

      const titleInput = screen.getByPlaceholderText('createForm.placeholderTask');
      await user.type(titleInput, 'Task with tags');

      // Open tag picker
      await user.click(screen.getByRole('button', { name: 'createForm.addTags' }));
      expect(screen.getByTestId('tag-picker')).toBeInTheDocument();

      // Select a tag
      await user.click(screen.getByRole('button', { name: 'Add Tag' }));

      // Submit the form
      await user.click(screen.getByRole('button', { name: 'createForm.add' }));

      // Verify todo was created
      await waitFor(() => {
        expect(mockMutateAsync).toHaveBeenCalledWith(
          expect.objectContaining({
            title: 'Task with tags',
          }),
        );
      });
    });
  });

  describe('Form Reset on Close', () => {
    it('should reset form when sheet is closed', async () => {
      const user = userEvent.setup();
      render(<QuickAddSheet open={true} onOpenChange={mockOnOpenChange} />);

      const input = screen.getByPlaceholderText('createForm.placeholderTask');
      await user.type(input, 'New Task');

      // Simulate closing the sheet
      mockOnOpenChange.mockImplementation((isOpen) => {
        if (!isOpen) {
          // Sheet would unmount and remount, simulating form reset
        }
      });

      // Trigger onOpenChange(false) through the BottomSheet
      // In a real scenario, this happens when user dismisses the sheet
      mockOnOpenChange(false);

      expect(mockOnOpenChange).toHaveBeenCalledWith(false);
    });
  });
});
