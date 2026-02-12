/**
 * Tests for TodoDetailSheet Component
 *
 * Tests todo detail bottom sheet with view-first approach (read-only by default,
 * with Edit button to enter edit mode). Verifies description editing, tag management,
 * parent picker, completion toggle, timestamps, and state transitions between view/edit modes.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@/test/test-utils';
import userEvent from '@testing-library/user-event';
import { TodoDetailSheet } from '../TodoDetailSheet';
import type { Todo } from '@features/todos/types/todo';

// Mock dependencies
vi.mock('@features/todos/hooks/useTodos', () => ({
  useUpdateTodo: vi.fn(),
  useToggleTodo: vi.fn(),
}));

vi.mock('@features/tags/hooks/useTags', () => ({
  useAddTagToTodo: vi.fn(),
  useRemoveTagFromTodo: vi.fn(),
}));

vi.mock('@features/workspaces/stores/workspaceUiStore', () => ({
  useActiveWorkspaceId: vi.fn(),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'en' },
  }),
}));

// Mock BottomSheet component
vi.mock('@components/ui/BottomSheet', () => ({
  BottomSheet: ({
    open,
    onOpenChange,
    title,
    children,
  }: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    title: string;
    children: React.ReactNode;
  }) =>
    open ? (
      <div data-testid="bottom-sheet" aria-label={title}>
        <button
          onClick={() => {
            onOpenChange(false);
          }}
          data-testid="close-sheet"
        >
          Close
        </button>
        {children}
      </div>
    ) : null,
}));

// Mock TagPicker component
vi.mock('@features/tags/components/TagPicker', () => ({
  TagPicker: ({
    selectedIds,
    onSelect,
    onDeselect,
  }: {
    selectedIds: string[];
    workspaceId?: string;
    onSelect: (id: string) => void;
    onDeselect: (id: string) => void;
  }) => (
    <div data-testid="tag-picker">
      <div data-testid="selected-tags">{selectedIds.join(',')}</div>
      <button
        onClick={() => {
          onSelect('tag-new');
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
    </div>
  ),
}));

// Mock TagBadge component
vi.mock('@features/tags/components/TagBadge', () => ({
  TagBadge: ({ tag }: { tag: { name: string; colorHex: string } }) => (
    <span data-testid={`tag-badge-${tag.name}`}>{tag.name}</span>
  ),
}));

// Mock ParentPicker component
vi.mock('../../ParentPicker', () => ({
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
      <div data-testid="current-parent">{currentParentId ?? 'none'}</div>
      <button
        onClick={() => {
          onParentChange('new-parent-id');
        }}
      >
        Change Parent
      </button>
    </div>
  ),
}));

// Mock TodoBreadcrumb component
vi.mock('../../TodoBreadcrumb', () => ({
  TodoBreadcrumb: ({ todoId }: { todoId: string }) => (
    <div data-testid="todo-breadcrumb">Breadcrumb for {todoId}</div>
  ),
}));

// Mock TodoCheckbox component
vi.mock('../../TodoTree/TodoCheckbox', () => ({
  TodoCheckbox: ({
    checked,
    onChange,
  }: {
    checked: boolean;
    onChange: () => void;
    className?: string;
  }) => (
    <input
      type="checkbox"
      checked={checked}
      onChange={onChange}
      data-testid="todo-checkbox"
      aria-label="Toggle completion"
    />
  ),
}));

// Mock formatDate utilities
vi.mock('@lib/utils/formatDate', () => ({
  formatDate: (date: string) => `formatted-${date}`,
  formatDateFull: (date: string) => `full-${date}`,
}));

import { useUpdateTodo, useToggleTodo } from '@features/todos/hooks/useTodos';
import { useAddTagToTodo, useRemoveTagFromTodo } from '@features/tags/hooks/useTags';
import { useActiveWorkspaceId } from '@features/workspaces/stores/workspaceUiStore';

const mockUseUpdateTodo = vi.mocked(useUpdateTodo);
const mockUseToggleTodo = vi.mocked(useToggleTodo);
const mockUseAddTagToTodo = vi.mocked(useAddTagToTodo);
const mockUseRemoveTagFromTodo = vi.mocked(useRemoveTagFromTodo);
const mockUseActiveWorkspaceId = vi.mocked(useActiveWorkspaceId);

describe('TodoDetailSheet', () => {
  const mockUpdateMutate = vi.fn();
  const mockToggleMutate = vi.fn();
  const mockAddTagMutate = vi.fn();
  const mockRemoveTagMutate = vi.fn();
  const mockOnOpenChange = vi.fn();

  const mockTodo: Todo = {
    id: 'todo-1',
    title: 'Test Todo',
    description: 'Test description',
    isCompleted: false,
    parentId: 'parent-1',
    workspaceId: 'ws-1',
    position: 0,
    completedAt: null,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-02T00:00:00Z',
    childCount: 0,
    completedChildCount: 0,
    tags: [
      { id: 'tag-1', name: 'Tag 1', colorHex: '#ff0000' },
      { id: 'tag-2', name: 'Tag 2', colorHex: '#00ff00' },
    ],
  };

  // Helper function to enter edit mode
  async function enterEditMode(user: ReturnType<typeof userEvent.setup>) {
    const editButton = screen.getByRole('button', { name: 'detail.editMode' });
    await user.click(editButton);
  }

  beforeEach(() => {
    // Reset all mocks
    mockUpdateMutate.mockClear();
    mockToggleMutate.mockClear();
    mockAddTagMutate.mockClear();
    mockRemoveTagMutate.mockClear();
    mockOnOpenChange.mockClear();

    // Default mock implementations
    mockUseUpdateTodo.mockReturnValue({
      mutate: mockUpdateMutate,
      isPending: false,
    } as any);

    mockUseToggleTodo.mockReturnValue({
      mutate: mockToggleMutate,
      isPending: false,
    } as any);

    mockUseAddTagToTodo.mockReturnValue({
      mutate: mockAddTagMutate,
      isPending: false,
    } as any);

    mockUseRemoveTagFromTodo.mockReturnValue({
      mutate: mockRemoveTagMutate,
      isPending: false,
    } as any);

    mockUseActiveWorkspaceId.mockReturnValue('ws-1');
  });

  describe('Visibility', () => {
    it('should not render when closed', () => {
      render(<TodoDetailSheet todo={mockTodo} open={false} onOpenChange={mockOnOpenChange} />);

      expect(screen.queryByTestId('bottom-sheet')).not.toBeInTheDocument();
    });

    it('should render when open', () => {
      render(<TodoDetailSheet todo={mockTodo} open={true} onOpenChange={mockOnOpenChange} />);

      expect(screen.getByTestId('bottom-sheet')).toBeInTheDocument();
    });
  });

  describe('View Mode (Default)', () => {
    it('should display todo title', () => {
      render(<TodoDetailSheet todo={mockTodo} open={true} onOpenChange={mockOnOpenChange} />);

      expect(screen.getByText('Test Todo')).toBeInTheDocument();
    });

    it('should display completion checkbox', () => {
      render(<TodoDetailSheet todo={mockTodo} open={true} onOpenChange={mockOnOpenChange} />);

      const checkbox = screen.getByTestId('todo-checkbox');
      expect(checkbox).toBeInTheDocument();
      expect(checkbox).not.toBeChecked();
    });

    it('should display checked checkbox when todo is completed', () => {
      const completedTodo = { ...mockTodo, isCompleted: true };
      render(<TodoDetailSheet todo={completedTodo} open={true} onOpenChange={mockOnOpenChange} />);

      const checkbox = screen.getByTestId('todo-checkbox');
      expect(checkbox).toBeChecked();
    });

    it('should display read-only description text', () => {
      render(<TodoDetailSheet todo={mockTodo} open={true} onOpenChange={mockOnOpenChange} />);

      expect(screen.getByText('Test description')).toBeInTheDocument();
      expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
    });

    it('should display "No description" placeholder when description is null', () => {
      const todoWithoutDescription = { ...mockTodo, description: null };
      render(
        <TodoDetailSheet
          todo={todoWithoutDescription}
          open={true}
          onOpenChange={mockOnOpenChange}
        />,
      );

      expect(screen.getByText('detail.noDescription')).toBeInTheDocument();
    });

    it('should display TagBadge components for each tag', () => {
      render(<TodoDetailSheet todo={mockTodo} open={true} onOpenChange={mockOnOpenChange} />);

      expect(screen.getByTestId('tag-badge-Tag 1')).toBeInTheDocument();
      expect(screen.getByTestId('tag-badge-Tag 2')).toBeInTheDocument();
      expect(screen.getByText('Tag 1')).toBeInTheDocument();
      expect(screen.getByText('Tag 2')).toBeInTheDocument();
    });

    it('should NOT display TagBadge section when todo has no tags', () => {
      const todoWithoutTags = { ...mockTodo, tags: [] };
      render(
        <TodoDetailSheet todo={todoWithoutTags} open={true} onOpenChange={mockOnOpenChange} />,
      );

      expect(screen.queryByTestId(/tag-badge-/)).not.toBeInTheDocument();
    });

    it('should display Edit button with correct aria-label', () => {
      render(<TodoDetailSheet todo={mockTodo} open={true} onOpenChange={mockOnOpenChange} />);

      const editButton = screen.getByRole('button', { name: 'detail.editMode' });
      expect(editButton).toBeInTheDocument();
    });

    it('should NOT display ParentPicker in view mode', () => {
      render(<TodoDetailSheet todo={mockTodo} open={true} onOpenChange={mockOnOpenChange} />);

      expect(screen.queryByTestId('parent-picker')).not.toBeInTheDocument();
    });

    it('should NOT display Textarea in view mode', () => {
      render(<TodoDetailSheet todo={mockTodo} open={true} onOpenChange={mockOnOpenChange} />);

      expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
    });

    it('should NOT display TagPicker in view mode', () => {
      render(<TodoDetailSheet todo={mockTodo} open={true} onOpenChange={mockOnOpenChange} />);

      expect(screen.queryByTestId('tag-picker')).not.toBeInTheDocument();
    });

    it('should NOT display Save button in view mode', () => {
      render(<TodoDetailSheet todo={mockTodo} open={true} onOpenChange={mockOnOpenChange} />);

      expect(screen.queryByRole('button', { name: 'actions.save' })).not.toBeInTheDocument();
    });

    it('should NOT display Cancel button in view mode', () => {
      render(<TodoDetailSheet todo={mockTodo} open={true} onOpenChange={mockOnOpenChange} />);

      expect(screen.queryByRole('button', { name: 'actions.cancel' })).not.toBeInTheDocument();
    });

    it('should display created timestamp', () => {
      render(<TodoDetailSheet todo={mockTodo} open={true} onOpenChange={mockOnOpenChange} />);

      expect(screen.getByText(/detail.created/)).toBeInTheDocument();
    });

    it('should display updated timestamp', () => {
      render(<TodoDetailSheet todo={mockTodo} open={true} onOpenChange={mockOnOpenChange} />);

      expect(screen.getByText(/detail.updated/)).toBeInTheDocument();
    });

    it('should not display completed timestamp when todo is not completed', () => {
      render(<TodoDetailSheet todo={mockTodo} open={true} onOpenChange={mockOnOpenChange} />);

      expect(screen.queryByText(/detail.completed/)).not.toBeInTheDocument();
    });

    it('should display completed timestamp when todo is completed', () => {
      const completedTodo = {
        ...mockTodo,
        isCompleted: true,
        completedAt: '2024-01-03T00:00:00Z',
      };
      render(<TodoDetailSheet todo={completedTodo} open={true} onOpenChange={mockOnOpenChange} />);

      expect(screen.getByText(/detail.completed/)).toBeInTheDocument();
    });
  });

  describe('Breadcrumb', () => {
    it('should show breadcrumb when todo has parent', () => {
      render(<TodoDetailSheet todo={mockTodo} open={true} onOpenChange={mockOnOpenChange} />);

      expect(screen.getByTestId('todo-breadcrumb')).toBeInTheDocument();
      expect(screen.getByText('Breadcrumb for todo-1')).toBeInTheDocument();
    });

    it('should not show breadcrumb when todo has no parent', () => {
      const rootTodo = { ...mockTodo, parentId: null };
      render(<TodoDetailSheet todo={rootTodo} open={true} onOpenChange={mockOnOpenChange} />);

      expect(screen.queryByTestId('todo-breadcrumb')).not.toBeInTheDocument();
    });
  });

  describe('Completion Toggle', () => {
    it('should call toggleMutate when checkbox is clicked', async () => {
      const user = userEvent.setup();
      render(<TodoDetailSheet todo={mockTodo} open={true} onOpenChange={mockOnOpenChange} />);

      const checkbox = screen.getByTestId('todo-checkbox');
      await user.click(checkbox);

      expect(mockToggleMutate).toHaveBeenCalledWith({
        id: 'todo-1',
        isCompleted: true,
      });
    });

    it('should toggle to false when todo is completed', async () => {
      const user = userEvent.setup();
      const completedTodo = { ...mockTodo, isCompleted: true };
      render(<TodoDetailSheet todo={completedTodo} open={true} onOpenChange={mockOnOpenChange} />);

      const checkbox = screen.getByTestId('todo-checkbox');
      await user.click(checkbox);

      expect(mockToggleMutate).toHaveBeenCalledWith({
        id: 'todo-1',
        isCompleted: false,
      });
    });
  });

  describe('Edit Mode Transition', () => {
    it('should show ParentPicker when Edit button is clicked', async () => {
      const user = userEvent.setup();
      render(<TodoDetailSheet todo={mockTodo} open={true} onOpenChange={mockOnOpenChange} />);

      expect(screen.queryByTestId('parent-picker')).not.toBeInTheDocument();

      await enterEditMode(user);

      expect(screen.getByTestId('parent-picker')).toBeInTheDocument();
    });

    it('should show Textarea when Edit button is clicked', async () => {
      const user = userEvent.setup();
      render(<TodoDetailSheet todo={mockTodo} open={true} onOpenChange={mockOnOpenChange} />);

      expect(screen.queryByRole('textbox')).not.toBeInTheDocument();

      await enterEditMode(user);

      expect(screen.getByRole('textbox')).toBeInTheDocument();
    });

    it('should show TagPicker when Edit button is clicked', async () => {
      const user = userEvent.setup();
      render(<TodoDetailSheet todo={mockTodo} open={true} onOpenChange={mockOnOpenChange} />);

      expect(screen.queryByTestId('tag-picker')).not.toBeInTheDocument();

      await enterEditMode(user);

      expect(screen.getByTestId('tag-picker')).toBeInTheDocument();
    });

    it('should show Save button when Edit button is clicked', async () => {
      const user = userEvent.setup();
      render(<TodoDetailSheet todo={mockTodo} open={true} onOpenChange={mockOnOpenChange} />);

      expect(screen.queryByRole('button', { name: 'actions.save' })).not.toBeInTheDocument();

      await enterEditMode(user);

      expect(screen.getByRole('button', { name: 'actions.save' })).toBeInTheDocument();
    });

    it('should show Cancel button when Edit button is clicked', async () => {
      const user = userEvent.setup();
      render(<TodoDetailSheet todo={mockTodo} open={true} onOpenChange={mockOnOpenChange} />);

      expect(screen.queryByRole('button', { name: 'actions.cancel' })).not.toBeInTheDocument();

      await enterEditMode(user);

      expect(screen.getByRole('button', { name: 'actions.cancel' })).toBeInTheDocument();
    });

    it('should hide read-only description when entering edit mode', async () => {
      const user = userEvent.setup();
      render(<TodoDetailSheet todo={mockTodo} open={true} onOpenChange={mockOnOpenChange} />);

      // In view mode, description is in a <p> tag (not editable)
      expect(screen.queryByRole('textbox')).not.toBeInTheDocument();

      await enterEditMode(user);

      // In edit mode, description is in a textarea (editable)
      expect(screen.getByRole('textbox')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Test description')).toBeInTheDocument();
    });

    it('should hide TagBadge components when entering edit mode', async () => {
      const user = userEvent.setup();
      render(<TodoDetailSheet todo={mockTodo} open={true} onOpenChange={mockOnOpenChange} />);

      expect(screen.getByTestId('tag-badge-Tag 1')).toBeInTheDocument();

      await enterEditMode(user);

      expect(screen.queryByTestId('tag-badge-Tag 1')).not.toBeInTheDocument();
    });

    it('should hide Edit button when entering edit mode', async () => {
      const user = userEvent.setup();
      render(<TodoDetailSheet todo={mockTodo} open={true} onOpenChange={mockOnOpenChange} />);

      const editButton = screen.getByRole('button', { name: 'detail.editMode' });
      expect(editButton).toBeInTheDocument();

      await user.click(editButton);

      expect(screen.queryByRole('button', { name: 'detail.editMode' })).not.toBeInTheDocument();
    });
  });

  describe('Description Editing', () => {
    it('should have Save button disabled initially in edit mode', async () => {
      const user = userEvent.setup();
      render(<TodoDetailSheet todo={mockTodo} open={true} onOpenChange={mockOnOpenChange} />);

      await enterEditMode(user);

      const saveButton = screen.getByRole('button', { name: 'actions.save' });
      expect(saveButton).toBeDisabled();
    });

    it('should enable save button when description changes', async () => {
      const user = userEvent.setup();
      render(<TodoDetailSheet todo={mockTodo} open={true} onOpenChange={mockOnOpenChange} />);

      await enterEditMode(user);

      const saveButton = screen.getByRole('button', { name: 'actions.save' });
      expect(saveButton).toBeDisabled();

      const textarea = screen.getByDisplayValue('Test description');
      await user.type(textarea, ' more text');

      expect(saveButton).toBeEnabled();
    });
  });

  describe('Save Behavior', () => {
    it('should call updateMutate with trimmed description', async () => {
      const user = userEvent.setup();
      render(<TodoDetailSheet todo={mockTodo} open={true} onOpenChange={mockOnOpenChange} />);

      await enterEditMode(user);

      const textarea = screen.getByDisplayValue('Test description');
      await user.clear(textarea);
      await user.type(textarea, '  Updated description  ');

      const saveButton = screen.getByRole('button', { name: 'actions.save' });
      await user.click(saveButton);

      expect(mockUpdateMutate).toHaveBeenCalledWith({
        id: 'todo-1',
        input: { description: 'Updated description' },
      });
    });

    it('should save null when description is empty', async () => {
      const user = userEvent.setup();
      render(<TodoDetailSheet todo={mockTodo} open={true} onOpenChange={mockOnOpenChange} />);

      await enterEditMode(user);

      const textarea = screen.getByDisplayValue('Test description');
      await user.clear(textarea);

      const saveButton = screen.getByRole('button', { name: 'actions.save' });
      await user.click(saveButton);

      expect(mockUpdateMutate).toHaveBeenCalledWith({
        id: 'todo-1',
        input: { description: null },
      });
    });

    it('should save null when description is only whitespace', async () => {
      const user = userEvent.setup();
      render(<TodoDetailSheet todo={mockTodo} open={true} onOpenChange={mockOnOpenChange} />);

      await enterEditMode(user);

      const textarea = screen.getByDisplayValue('Test description');
      await user.clear(textarea);
      await user.type(textarea, '   ');

      const saveButton = screen.getByRole('button', { name: 'actions.save' });
      await user.click(saveButton);

      expect(mockUpdateMutate).toHaveBeenCalledWith({
        id: 'todo-1',
        input: { description: null },
      });
    });

    it('should return to view mode after save (not close sheet)', async () => {
      const user = userEvent.setup();
      render(<TodoDetailSheet todo={mockTodo} open={true} onOpenChange={mockOnOpenChange} />);

      await enterEditMode(user);

      const textarea = screen.getByDisplayValue('Test description');
      await user.type(textarea, ' extra');

      const saveButton = screen.getByRole('button', { name: 'actions.save' });
      await user.click(saveButton);

      // Should not close the sheet
      expect(mockOnOpenChange).not.toHaveBeenCalled();

      // Should return to view mode (Edit button should be visible again)
      expect(screen.getByRole('button', { name: 'detail.editMode' })).toBeInTheDocument();

      // Should not show editable elements
      expect(screen.queryByTestId('parent-picker')).not.toBeInTheDocument();
      expect(screen.queryByTestId('tag-picker')).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'actions.save' })).not.toBeInTheDocument();
    });

    it('should include parentId in updateMutate call when parent changed', async () => {
      const user = userEvent.setup();
      render(<TodoDetailSheet todo={mockTodo} open={true} onOpenChange={mockOnOpenChange} />);

      await enterEditMode(user);

      // Change parent
      const changeParentButton = screen.getByRole('button', { name: 'Change Parent' });
      await user.click(changeParentButton);

      const saveButton = screen.getByRole('button', { name: 'actions.save' });
      await user.click(saveButton);

      expect(mockUpdateMutate).toHaveBeenCalledWith({
        id: 'todo-1',
        input: { description: 'Test description', parentId: 'new-parent-id' },
      });
    });

    it('should NOT include parentId in updateMutate call when parent unchanged', async () => {
      const user = userEvent.setup();
      render(<TodoDetailSheet todo={mockTodo} open={true} onOpenChange={mockOnOpenChange} />);

      await enterEditMode(user);

      // Change only description
      const textarea = screen.getByDisplayValue('Test description');
      await user.type(textarea, ' extra');

      const saveButton = screen.getByRole('button', { name: 'actions.save' });
      await user.click(saveButton);

      expect(mockUpdateMutate).toHaveBeenCalledWith({
        id: 'todo-1',
        input: { description: 'Test description extra' },
      });
    });

    it('should call addTagMutation for newly added tags', async () => {
      const user = userEvent.setup();
      render(<TodoDetailSheet todo={mockTodo} open={true} onOpenChange={mockOnOpenChange} />);

      await enterEditMode(user);

      // Add a new tag
      const addTagButton = screen.getByRole('button', { name: 'Add Tag' });
      await user.click(addTagButton);

      const saveButton = screen.getByRole('button', { name: 'actions.save' });
      await user.click(saveButton);

      expect(mockAddTagMutate).toHaveBeenCalledWith({
        todoId: 'todo-1',
        tagId: 'tag-new',
      });
    });

    it('should call removeTagMutation for removed tags', async () => {
      const user = userEvent.setup();
      render(<TodoDetailSheet todo={mockTodo} open={true} onOpenChange={mockOnOpenChange} />);

      await enterEditMode(user);

      // Remove a tag
      const removeTagButton = screen.getByRole('button', { name: 'Remove Tag' });
      await user.click(removeTagButton);

      const saveButton = screen.getByRole('button', { name: 'actions.save' });
      await user.click(saveButton);

      expect(mockRemoveTagMutate).toHaveBeenCalledWith({
        todoId: 'todo-1',
        tagId: 'tag-1',
      });
    });

    it('should handle both adding and removing tags in one save', async () => {
      const user = userEvent.setup();
      render(<TodoDetailSheet todo={mockTodo} open={true} onOpenChange={mockOnOpenChange} />);

      await enterEditMode(user);

      // Add a new tag
      const addTagButton = screen.getByRole('button', { name: 'Add Tag' });
      await user.click(addTagButton);

      // Remove an existing tag
      const removeTagButton = screen.getByRole('button', { name: 'Remove Tag' });
      await user.click(removeTagButton);

      const saveButton = screen.getByRole('button', { name: 'actions.save' });
      await user.click(saveButton);

      expect(mockAddTagMutate).toHaveBeenCalledWith({
        todoId: 'todo-1',
        tagId: 'tag-new',
      });
      expect(mockRemoveTagMutate).toHaveBeenCalledWith({
        todoId: 'todo-1',
        tagId: 'tag-1',
      });
    });
  });

  describe('Cancel Behavior', () => {
    it('should reset description when cancel is clicked', async () => {
      const user = userEvent.setup();
      render(<TodoDetailSheet todo={mockTodo} open={true} onOpenChange={mockOnOpenChange} />);

      await enterEditMode(user);

      const textarea = screen.getByDisplayValue('Test description');
      await user.clear(textarea);
      await user.type(textarea, 'Changed description');

      const cancelButton = screen.getByRole('button', { name: 'actions.cancel' });
      await user.click(cancelButton);

      // Should not close the sheet
      expect(mockOnOpenChange).not.toHaveBeenCalled();

      // Should return to view mode with original description
      expect(screen.getByText('Test description')).toBeInTheDocument();
    });

    it('should reset tags when cancel is clicked', async () => {
      const user = userEvent.setup();
      render(<TodoDetailSheet todo={mockTodo} open={true} onOpenChange={mockOnOpenChange} />);

      await enterEditMode(user);

      // Add a new tag
      const addTagButton = screen.getByRole('button', { name: 'Add Tag' });
      await user.click(addTagButton);

      const cancelButton = screen.getByRole('button', { name: 'actions.cancel' });
      await user.click(cancelButton);

      // Should not close the sheet
      expect(mockOnOpenChange).not.toHaveBeenCalled();

      // Should return to view mode with original tags
      expect(screen.getByTestId('tag-badge-Tag 1')).toBeInTheDocument();
      expect(screen.getByTestId('tag-badge-Tag 2')).toBeInTheDocument();
    });

    it('should reset parent when cancel is clicked', async () => {
      const user = userEvent.setup();
      render(<TodoDetailSheet todo={mockTodo} open={true} onOpenChange={mockOnOpenChange} />);

      await enterEditMode(user);

      // Verify initial parent
      expect(screen.getByTestId('current-parent')).toHaveTextContent('parent-1');

      // Change parent
      const changeParentButton = screen.getByRole('button', { name: 'Change Parent' });
      await user.click(changeParentButton);

      expect(screen.getByTestId('current-parent')).toHaveTextContent('new-parent-id');

      // Cancel
      const cancelButton = screen.getByRole('button', { name: 'actions.cancel' });
      await user.click(cancelButton);

      // Re-enter edit mode to verify parent was reset
      await enterEditMode(user);

      expect(screen.getByTestId('current-parent')).toHaveTextContent('parent-1');
    });

    it('should return to view mode after cancel (not close sheet)', async () => {
      const user = userEvent.setup();
      render(<TodoDetailSheet todo={mockTodo} open={true} onOpenChange={mockOnOpenChange} />);

      await enterEditMode(user);

      const textarea = screen.getByDisplayValue('Test description');
      await user.type(textarea, ' extra');

      const cancelButton = screen.getByRole('button', { name: 'actions.cancel' });
      await user.click(cancelButton);

      // Should not close the sheet
      expect(mockOnOpenChange).not.toHaveBeenCalled();

      // Should return to view mode (Edit button should be visible again)
      expect(screen.getByRole('button', { name: 'detail.editMode' })).toBeInTheDocument();

      // Should not show editable elements
      expect(screen.queryByTestId('parent-picker')).not.toBeInTheDocument();
      expect(screen.queryByTestId('tag-picker')).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'actions.save' })).not.toBeInTheDocument();
    });
  });

  describe('Parent Batching', () => {
    it('should NOT immediately call updateMutate when parent changes', async () => {
      const user = userEvent.setup();
      render(<TodoDetailSheet todo={mockTodo} open={true} onOpenChange={mockOnOpenChange} />);

      await enterEditMode(user);

      const changeParentButton = screen.getByRole('button', { name: 'Change Parent' });
      await user.click(changeParentButton);

      // Should not have called updateMutate yet
      expect(mockUpdateMutate).not.toHaveBeenCalled();
    });

    it('should enable Save button when parent changes', async () => {
      const user = userEvent.setup();
      render(<TodoDetailSheet todo={mockTodo} open={true} onOpenChange={mockOnOpenChange} />);

      await enterEditMode(user);

      const saveButton = screen.getByRole('button', { name: 'actions.save' });
      expect(saveButton).toBeDisabled();

      const changeParentButton = screen.getByRole('button', { name: 'Change Parent' });
      await user.click(changeParentButton);

      expect(saveButton).toBeEnabled();
    });

    it('should include parent change in Save call', async () => {
      const user = userEvent.setup();
      render(<TodoDetailSheet todo={mockTodo} open={true} onOpenChange={mockOnOpenChange} />);

      await enterEditMode(user);

      const changeParentButton = screen.getByRole('button', { name: 'Change Parent' });
      await user.click(changeParentButton);

      const saveButton = screen.getByRole('button', { name: 'actions.save' });
      await user.click(saveButton);

      expect(mockUpdateMutate).toHaveBeenCalledWith({
        id: 'todo-1',
        input: { description: 'Test description', parentId: 'new-parent-id' },
      });
    });

    it('should discard parent change on Cancel', async () => {
      const user = userEvent.setup();
      render(<TodoDetailSheet todo={mockTodo} open={true} onOpenChange={mockOnOpenChange} />);

      await enterEditMode(user);

      const changeParentButton = screen.getByRole('button', { name: 'Change Parent' });
      await user.click(changeParentButton);

      expect(screen.getByTestId('current-parent')).toHaveTextContent('new-parent-id');

      const cancelButton = screen.getByRole('button', { name: 'actions.cancel' });
      await user.click(cancelButton);

      expect(mockUpdateMutate).not.toHaveBeenCalled();
    });
  });

  describe('Sheet Dismiss', () => {
    it('should call onOpenChange(false) when dismissing sheet', async () => {
      const user = userEvent.setup();
      render(<TodoDetailSheet todo={mockTodo} open={true} onOpenChange={mockOnOpenChange} />);

      const closeButton = screen.getByTestId('close-sheet');
      await user.click(closeButton);

      expect(mockOnOpenChange).toHaveBeenCalledWith(false);
    });

    it('should reset to view mode when reopening after dismissing in edit mode', async () => {
      const user = userEvent.setup();
      const { rerender } = render(
        <TodoDetailSheet todo={mockTodo} open={true} onOpenChange={mockOnOpenChange} />,
      );

      // Enter edit mode
      await enterEditMode(user);
      expect(screen.getByTestId('parent-picker')).toBeInTheDocument();

      // Dismiss sheet
      const closeButton = screen.getByTestId('close-sheet');
      await user.click(closeButton);

      // Close the sheet
      rerender(<TodoDetailSheet todo={mockTodo} open={false} onOpenChange={mockOnOpenChange} />);

      // Reopen the sheet
      rerender(<TodoDetailSheet todo={mockTodo} open={true} onOpenChange={mockOnOpenChange} />);

      // Should be in view mode (Edit button visible, not editable fields)
      expect(screen.getByRole('button', { name: 'detail.editMode' })).toBeInTheDocument();
      expect(screen.queryByTestId('parent-picker')).not.toBeInTheDocument();
      expect(screen.queryByTestId('tag-picker')).not.toBeInTheDocument();
    });
  });

  describe('State Reset on Reopen', () => {
    it('should show new description when reopening with different description', () => {
      const { rerender } = render(
        <TodoDetailSheet todo={mockTodo} open={true} onOpenChange={mockOnOpenChange} />,
      );

      expect(screen.getByText('Test description')).toBeInTheDocument();

      // Close the sheet
      rerender(<TodoDetailSheet todo={mockTodo} open={false} onOpenChange={mockOnOpenChange} />);

      // Reopen with updated todo
      const updatedTodo = { ...mockTodo, description: 'New description' };
      rerender(<TodoDetailSheet todo={updatedTodo} open={true} onOpenChange={mockOnOpenChange} />);

      expect(screen.getByText('New description')).toBeInTheDocument();
      expect(screen.queryByText('Test description')).not.toBeInTheDocument();
    });

    it('should show new tags when reopening with different tags', () => {
      const { rerender } = render(
        <TodoDetailSheet todo={mockTodo} open={true} onOpenChange={mockOnOpenChange} />,
      );

      expect(screen.getByTestId('tag-badge-Tag 1')).toBeInTheDocument();
      expect(screen.getByTestId('tag-badge-Tag 2')).toBeInTheDocument();

      // Close the sheet
      rerender(<TodoDetailSheet todo={mockTodo} open={false} onOpenChange={mockOnOpenChange} />);

      // Reopen with different tags
      const updatedTodo = {
        ...mockTodo,
        tags: [{ id: 'tag-3', name: 'Tag 3', colorHex: '#0000ff' }],
      };
      rerender(<TodoDetailSheet todo={updatedTodo} open={true} onOpenChange={mockOnOpenChange} />);

      expect(screen.getByTestId('tag-badge-Tag 3')).toBeInTheDocument();
      expect(screen.queryByTestId('tag-badge-Tag 1')).not.toBeInTheDocument();
      expect(screen.queryByTestId('tag-badge-Tag 2')).not.toBeInTheDocument();
    });
  });
});
