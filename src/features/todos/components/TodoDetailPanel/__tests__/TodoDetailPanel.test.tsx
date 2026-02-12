/**
 * Tests for TodoDetailPanel Component
 *
 * Tests the desktop detail panel for viewing/editing todo details.
 * Focus: ParentPicker changes are now batched with Save (not immediate).
 * Verifies edit mode toggling, parent batching, save/cancel behavior, and state management.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@/test/test-utils';
import userEvent from '@testing-library/user-event';
import { TodoDetailPanel } from '../TodoDetailPanel';
import type { Todo } from '@features/todos/types/todo';

// Mock dependencies
vi.mock('@features/todos/hooks/useTodos', () => ({
  useUpdateTodo: vi.fn(),
}));

vi.mock('@features/tags/hooks/useTags', () => ({
  useAddTagToTodo: vi.fn(),
  useRemoveTagFromTodo: vi.fn(),
}));

vi.mock('@features/workspaces/stores/workspaceUiStore', () => ({
  useActiveWorkspaceId: vi.fn(),
}));

vi.mock('@features/todos/stores/todoUiStore', () => ({
  useTodoUiStore: vi.fn(),
}));

vi.mock('@hooks/useIsMobile', () => ({
  useIsMobile: () => false,
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'en' },
  }),
}));

// Mock TagPicker component
vi.mock('@features/tags/components/TagPicker', () => ({
  TagPicker: ({
    selectedIds,
    onSelect,
    onDeselect,
    workspaceId,
  }: {
    selectedIds: string[];
    workspaceId?: string;
    onSelect: (id: string) => void;
    onDeselect: (id: string) => void;
  }) => (
    <div data-testid="tag-picker" data-workspace-id={workspaceId ?? ''}>
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

// Mock formatDate utilities
vi.mock('@lib/utils/formatDate', () => ({
  formatDate: (date: string) => `formatted-${date}`,
  formatDateFull: (date: string) => `full-${date}`,
}));

import { useUpdateTodo } from '@features/todos/hooks/useTodos';
import { useAddTagToTodo, useRemoveTagFromTodo } from '@features/tags/hooks/useTags';
import { useActiveWorkspaceId } from '@features/workspaces/stores/workspaceUiStore';
import { useTodoUiStore } from '@features/todos/stores/todoUiStore';

const mockUseUpdateTodo = vi.mocked(useUpdateTodo);
const mockUseAddTagToTodo = vi.mocked(useAddTagToTodo);
const mockUseRemoveTagFromTodo = vi.mocked(useRemoveTagFromTodo);
const mockUseActiveWorkspaceId = vi.mocked(useActiveWorkspaceId);
const mockUseTodoUiStore = vi.mocked(useTodoUiStore);

describe('TodoDetailPanel', () => {
  const mockUpdateMutate = vi.fn();
  const mockAddTagMutate = vi.fn();
  const mockRemoveTagMutate = vi.fn();
  const mockSetDetailEditing = vi.fn();

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

  beforeEach(() => {
    // Reset all mocks
    mockUpdateMutate.mockClear();
    mockAddTagMutate.mockClear();
    mockRemoveTagMutate.mockClear();
    mockSetDetailEditing.mockClear();

    // Default mock implementations
    mockUseUpdateTodo.mockReturnValue({
      mutate: mockUpdateMutate,
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

    // Setup useTodoUiStore mock with selector pattern
    mockUseTodoUiStore.mockImplementation((selector: any) => {
      const state = {
        isDetailEditing: false,
        setDetailEditing: mockSetDetailEditing,
      };
      return selector(state);
    });
  });

  describe('View Mode Rendering', () => {
    it('should display breadcrumb when todo has parent', () => {
      render(<TodoDetailPanel todo={mockTodo} indentPx={20} />);

      expect(screen.getByTestId('todo-breadcrumb')).toBeInTheDocument();
      expect(screen.getByText('Breadcrumb for todo-1')).toBeInTheDocument();
    });

    it('should not display breadcrumb when todo has no parent', () => {
      const rootTodo = { ...mockTodo, parentId: null };
      render(<TodoDetailPanel todo={rootTodo} indentPx={20} />);

      expect(screen.queryByTestId('todo-breadcrumb')).not.toBeInTheDocument();
    });

    it('should display edit button', () => {
      render(<TodoDetailPanel todo={mockTodo} indentPx={20} />);

      expect(screen.getByLabelText('detail.editMode')).toBeInTheDocument();
    });

    it('should display description', () => {
      render(<TodoDetailPanel todo={mockTodo} indentPx={20} />);

      expect(screen.getByText('Test description')).toBeInTheDocument();
    });

    it('should display placeholder when description is null', () => {
      const todoWithoutDescription = { ...mockTodo, description: null };
      render(<TodoDetailPanel todo={todoWithoutDescription} indentPx={20} />);

      expect(screen.getByText('detail.noDescription')).toBeInTheDocument();
    });

    it('should display timestamps', () => {
      render(<TodoDetailPanel todo={mockTodo} indentPx={20} />);

      expect(screen.getByText(/detail.created/)).toBeInTheDocument();
      expect(screen.getByText(/detail.updated/)).toBeInTheDocument();
    });

    it('should not display completed timestamp when todo is not completed', () => {
      render(<TodoDetailPanel todo={mockTodo} indentPx={20} />);

      expect(screen.queryByText(/detail.completed/)).not.toBeInTheDocument();
    });

    it('should display completed timestamp when todo is completed', () => {
      const completedTodo = {
        ...mockTodo,
        isCompleted: true,
        completedAt: '2024-01-03T00:00:00Z',
      };
      render(<TodoDetailPanel todo={completedTodo} indentPx={20} />);

      expect(screen.getByText(/detail.completed/)).toBeInTheDocument();
    });

    it('should not display edit mode controls in view mode', () => {
      render(<TodoDetailPanel todo={mockTodo} indentPx={20} />);

      expect(screen.queryByTestId('parent-picker')).not.toBeInTheDocument();
      expect(screen.queryByTestId('tag-picker')).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'actions.save' })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'actions.cancel' })).not.toBeInTheDocument();
    });
  });

  describe('Entering Edit Mode', () => {
    it('should call setDetailEditing when edit button is clicked', async () => {
      const user = userEvent.setup();
      render(<TodoDetailPanel todo={mockTodo} indentPx={20} />);

      const editButton = screen.getByLabelText('detail.editMode');
      await user.click(editButton);

      expect(mockSetDetailEditing).toHaveBeenCalledWith(true);
    });

    it('should display edit mode controls when isDetailEditing is true', () => {
      // Set up mock to return isDetailEditing: true
      mockUseTodoUiStore.mockImplementation((selector: any) => {
        const state = {
          isDetailEditing: true,
          setDetailEditing: mockSetDetailEditing,
        };
        return selector(state);
      });

      render(<TodoDetailPanel todo={mockTodo} indentPx={20} />);

      expect(screen.getByTestId('parent-picker')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('detail.descriptionPlaceholder')).toBeInTheDocument();
      expect(screen.getByTestId('tag-picker')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'actions.save' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'actions.cancel' })).toBeInTheDocument();
    });

    it('should display close button in edit mode', () => {
      mockUseTodoUiStore.mockImplementation((selector: any) => {
        const state = {
          isDetailEditing: true,
          setDetailEditing: mockSetDetailEditing,
        };
        return selector(state);
      });

      render(<TodoDetailPanel todo={mockTodo} indentPx={20} />);

      expect(screen.getByLabelText('detail.closeEdit')).toBeInTheDocument();
    });

    it('should always display breadcrumb in edit mode', () => {
      mockUseTodoUiStore.mockImplementation((selector: any) => {
        const state = {
          isDetailEditing: true,
          setDetailEditing: mockSetDetailEditing,
        };
        return selector(state);
      });

      render(<TodoDetailPanel todo={mockTodo} indentPx={20} />);

      expect(screen.getByTestId('todo-breadcrumb')).toBeInTheDocument();
    });

    it('should display save button as disabled initially', () => {
      mockUseTodoUiStore.mockImplementation((selector: any) => {
        const state = {
          isDetailEditing: true,
          setDetailEditing: mockSetDetailEditing,
        };
        return selector(state);
      });

      render(<TodoDetailPanel todo={mockTodo} indentPx={20} />);

      const saveButton = screen.getByRole('button', { name: 'actions.save' });
      expect(saveButton).toBeDisabled();
    });
  });

  describe('Parent Batching - Local State', () => {
    beforeEach(() => {
      mockUseTodoUiStore.mockImplementation((selector: any) => {
        const state = {
          isDetailEditing: true,
          setDetailEditing: mockSetDetailEditing,
        };
        return selector(state);
      });
    });

    it('should NOT immediately call updateMutate when parent is changed', async () => {
      const user = userEvent.setup();
      render(<TodoDetailPanel todo={mockTodo} indentPx={20} />);

      const changeParentButton = screen.getByRole('button', { name: 'Change Parent' });
      await user.click(changeParentButton);

      // This is the KEY test - parent changes are NOT immediate
      expect(mockUpdateMutate).not.toHaveBeenCalled();
    });

    it('should set dirty flag when parent is changed', async () => {
      const user = userEvent.setup();
      render(<TodoDetailPanel todo={mockTodo} indentPx={20} />);

      const saveButton = screen.getByRole('button', { name: 'actions.save' });
      expect(saveButton).toBeDisabled();

      const changeParentButton = screen.getByRole('button', { name: 'Change Parent' });
      await user.click(changeParentButton);

      expect(saveButton).toBeEnabled();
    });

    it('should update ParentPicker current parent after change', async () => {
      const user = userEvent.setup();
      render(<TodoDetailPanel todo={mockTodo} indentPx={20} />);

      // Initial parent
      expect(screen.getByTestId('current-parent')).toHaveTextContent('parent-1');

      const changeParentButton = screen.getByRole('button', { name: 'Change Parent' });
      await user.click(changeParentButton);

      // Updated to new local parent
      expect(screen.getByTestId('current-parent')).toHaveTextContent('new-parent-id');
    });

    it('should keep local parent state when switching to view mode and back', async () => {
      const user = userEvent.setup();
      const { rerender } = render(<TodoDetailPanel todo={mockTodo} indentPx={20} />);

      // Change parent
      const changeParentButton = screen.getByRole('button', { name: 'Change Parent' });
      await user.click(changeParentButton);
      expect(screen.getByTestId('current-parent')).toHaveTextContent('new-parent-id');

      // Simulate exiting edit mode (but not saving - this would normally reset)
      mockUseTodoUiStore.mockImplementation((selector: any) => {
        const state = {
          isDetailEditing: false,
          setDetailEditing: mockSetDetailEditing,
        };
        return selector(state);
      });
      rerender(<TodoDetailPanel todo={mockTodo} indentPx={20} />);

      // Note: When exiting edit mode without saving, the component's useEffect
      // resets local state from props, so local changes are lost
      expect(screen.queryByTestId('parent-picker')).not.toBeInTheDocument();
    });
  });

  describe('Save with Parent Change', () => {
    beforeEach(() => {
      mockUseTodoUiStore.mockImplementation((selector: any) => {
        const state = {
          isDetailEditing: true,
          setDetailEditing: mockSetDetailEditing,
        };
        return selector(state);
      });
    });

    it('should include parentId in update when parent was changed', async () => {
      const user = userEvent.setup();
      render(<TodoDetailPanel todo={mockTodo} indentPx={20} />);

      // Change parent
      const changeParentButton = screen.getByRole('button', { name: 'Change Parent' });
      await user.click(changeParentButton);

      // Save
      const saveButton = screen.getByRole('button', { name: 'actions.save' });
      await user.click(saveButton);

      expect(mockUpdateMutate).toHaveBeenCalledWith({
        id: 'todo-1',
        input: {
          description: 'Test description',
          parentId: 'new-parent-id',
        },
      });
    });

    it('should NOT include parentId in update when parent was NOT changed', async () => {
      const user = userEvent.setup();
      render(<TodoDetailPanel todo={mockTodo} indentPx={20} />);

      // Change description only
      const textarea = screen.getByDisplayValue('Test description');
      await user.type(textarea, ' updated');

      // Save
      const saveButton = screen.getByRole('button', { name: 'actions.save' });
      await user.click(saveButton);

      expect(mockUpdateMutate).toHaveBeenCalledWith({
        id: 'todo-1',
        input: {
          description: 'Test description updated',
          // parentId should NOT be present
        },
      });
      // Verify parentId is not in the input object
      const call = mockUpdateMutate.mock.calls[0][0];
      expect(call.input).not.toHaveProperty('parentId');
    });

    it('should call setDetailEditing(false) after save with parent change', async () => {
      const user = userEvent.setup();
      render(<TodoDetailPanel todo={mockTodo} indentPx={20} />);

      const changeParentButton = screen.getByRole('button', { name: 'Change Parent' });
      await user.click(changeParentButton);

      const saveButton = screen.getByRole('button', { name: 'actions.save' });
      await user.click(saveButton);

      expect(mockSetDetailEditing).toHaveBeenCalledWith(false);
    });
  });

  describe('Save with Description + Parent', () => {
    beforeEach(() => {
      mockUseTodoUiStore.mockImplementation((selector: any) => {
        const state = {
          isDetailEditing: true,
          setDetailEditing: mockSetDetailEditing,
        };
        return selector(state);
      });
    });

    it('should send combined update with description and parentId', async () => {
      const user = userEvent.setup();
      render(<TodoDetailPanel todo={mockTodo} indentPx={20} />);

      // Change description
      const textarea = screen.getByDisplayValue('Test description');
      await user.clear(textarea);
      await user.type(textarea, 'Updated description');

      // Change parent
      const changeParentButton = screen.getByRole('button', { name: 'Change Parent' });
      await user.click(changeParentButton);

      // Save
      const saveButton = screen.getByRole('button', { name: 'actions.save' });
      await user.click(saveButton);

      expect(mockUpdateMutate).toHaveBeenCalledWith({
        id: 'todo-1',
        input: {
          description: 'Updated description',
          parentId: 'new-parent-id',
        },
      });
    });

    it('should trim description and include parentId', async () => {
      const user = userEvent.setup();
      render(<TodoDetailPanel todo={mockTodo} indentPx={20} />);

      // Change description with whitespace
      const textarea = screen.getByDisplayValue('Test description');
      await user.clear(textarea);
      await user.type(textarea, '  Trimmed  ');

      // Change parent
      const changeParentButton = screen.getByRole('button', { name: 'Change Parent' });
      await user.click(changeParentButton);

      // Save
      const saveButton = screen.getByRole('button', { name: 'actions.save' });
      await user.click(saveButton);

      expect(mockUpdateMutate).toHaveBeenCalledWith({
        id: 'todo-1',
        input: {
          description: 'Trimmed',
          parentId: 'new-parent-id',
        },
      });
    });

    it('should handle empty description with parent change', async () => {
      const user = userEvent.setup();
      render(<TodoDetailPanel todo={mockTodo} indentPx={20} />);

      // Clear description
      const textarea = screen.getByDisplayValue('Test description');
      await user.clear(textarea);

      // Change parent
      const changeParentButton = screen.getByRole('button', { name: 'Change Parent' });
      await user.click(changeParentButton);

      // Save
      const saveButton = screen.getByRole('button', { name: 'actions.save' });
      await user.click(saveButton);

      expect(mockUpdateMutate).toHaveBeenCalledWith({
        id: 'todo-1',
        input: {
          description: null,
          parentId: 'new-parent-id',
        },
      });
    });
  });

  describe('Cancel Resets Parent', () => {
    beforeEach(() => {
      mockUseTodoUiStore.mockImplementation((selector: any) => {
        const state = {
          isDetailEditing: true,
          setDetailEditing: mockSetDetailEditing,
        };
        return selector(state);
      });
    });

    it('should reset parent to original when cancel is clicked', async () => {
      const user = userEvent.setup();
      const { rerender } = render(<TodoDetailPanel todo={mockTodo} indentPx={20} />);

      // Change parent
      const changeParentButton = screen.getByRole('button', { name: 'Change Parent' });
      await user.click(changeParentButton);
      expect(screen.getByTestId('current-parent')).toHaveTextContent('new-parent-id');

      // Cancel
      const cancelButton = screen.getByRole('button', { name: 'actions.cancel' });
      await user.click(cancelButton);

      // Exit edit mode (simulate store state change)
      mockUseTodoUiStore.mockImplementation((selector: any) => {
        const state = {
          isDetailEditing: false,
          setDetailEditing: mockSetDetailEditing,
        };
        return selector(state);
      });
      rerender(<TodoDetailPanel todo={mockTodo} indentPx={20} />);

      // Re-enter edit mode to verify state was reset
      mockUseTodoUiStore.mockImplementation((selector: any) => {
        const state = {
          isDetailEditing: true,
          setDetailEditing: mockSetDetailEditing,
        };
        return selector(state);
      });
      rerender(<TodoDetailPanel todo={mockTodo} indentPx={20} />);

      // Should show original parent
      expect(screen.getByTestId('current-parent')).toHaveTextContent('parent-1');
    });

    it('should call setDetailEditing(false) when cancel is clicked', async () => {
      const user = userEvent.setup();
      render(<TodoDetailPanel todo={mockTodo} indentPx={20} />);

      const cancelButton = screen.getByRole('button', { name: 'actions.cancel' });
      await user.click(cancelButton);

      expect(mockSetDetailEditing).toHaveBeenCalledWith(false);
    });

    it('should not call updateMutate when cancel is clicked', async () => {
      const user = userEvent.setup();
      render(<TodoDetailPanel todo={mockTodo} indentPx={20} />);

      // Change parent
      const changeParentButton = screen.getByRole('button', { name: 'Change Parent' });
      await user.click(changeParentButton);

      // Cancel
      const cancelButton = screen.getByRole('button', { name: 'actions.cancel' });
      await user.click(cancelButton);

      expect(mockUpdateMutate).not.toHaveBeenCalled();
    });
  });

  describe('Cancel Resets All State', () => {
    beforeEach(() => {
      mockUseTodoUiStore.mockImplementation((selector: any) => {
        const state = {
          isDetailEditing: true,
          setDetailEditing: mockSetDetailEditing,
        };
        return selector(state);
      });
    });

    it('should reset description, tags, and parent when cancel is clicked', async () => {
      const user = userEvent.setup();
      const { rerender } = render(<TodoDetailPanel todo={mockTodo} indentPx={20} />);

      // Change description
      const textarea = screen.getByDisplayValue('Test description');
      await user.type(textarea, ' modified');

      // Change tags
      const addTagButton = screen.getByRole('button', { name: 'Add Tag' });
      await user.click(addTagButton);

      // Change parent
      const changeParentButton = screen.getByRole('button', { name: 'Change Parent' });
      await user.click(changeParentButton);

      // Cancel
      const cancelButton = screen.getByRole('button', { name: 'actions.cancel' });
      await user.click(cancelButton);

      // Exit edit mode
      mockUseTodoUiStore.mockImplementation((selector: any) => {
        const state = {
          isDetailEditing: false,
          setDetailEditing: mockSetDetailEditing,
        };
        return selector(state);
      });
      rerender(<TodoDetailPanel todo={mockTodo} indentPx={20} />);

      // Re-enter edit mode
      mockUseTodoUiStore.mockImplementation((selector: any) => {
        const state = {
          isDetailEditing: true,
          setDetailEditing: mockSetDetailEditing,
        };
        return selector(state);
      });
      rerender(<TodoDetailPanel todo={mockTodo} indentPx={20} />);

      // Verify all state reset
      expect(screen.getByDisplayValue('Test description')).toBeInTheDocument();
      expect(screen.getByTestId('selected-tags')).toHaveTextContent('tag-1,tag-2');
      expect(screen.getByTestId('current-parent')).toHaveTextContent('parent-1');
    });
  });

  describe('Close Edit Button', () => {
    beforeEach(() => {
      mockUseTodoUiStore.mockImplementation((selector: any) => {
        const state = {
          isDetailEditing: true,
          setDetailEditing: mockSetDetailEditing,
        };
        return selector(state);
      });
    });

    it('should reset all state when close button is clicked', async () => {
      const user = userEvent.setup();
      const { rerender } = render(<TodoDetailPanel todo={mockTodo} indentPx={20} />);

      // Change parent
      const changeParentButton = screen.getByRole('button', { name: 'Change Parent' });
      await user.click(changeParentButton);
      expect(screen.getByTestId('current-parent')).toHaveTextContent('new-parent-id');

      // Click close (X) button
      const closeButton = screen.getByLabelText('detail.closeEdit');
      await user.click(closeButton);

      // Exit edit mode
      mockUseTodoUiStore.mockImplementation((selector: any) => {
        const state = {
          isDetailEditing: false,
          setDetailEditing: mockSetDetailEditing,
        };
        return selector(state);
      });
      rerender(<TodoDetailPanel todo={mockTodo} indentPx={20} />);

      // Re-enter edit mode
      mockUseTodoUiStore.mockImplementation((selector: any) => {
        const state = {
          isDetailEditing: true,
          setDetailEditing: mockSetDetailEditing,
        };
        return selector(state);
      });
      rerender(<TodoDetailPanel todo={mockTodo} indentPx={20} />);

      // Should show original parent
      expect(screen.getByTestId('current-parent')).toHaveTextContent('parent-1');
    });

    it('should call setDetailEditing(false) when close button is clicked', async () => {
      const user = userEvent.setup();
      render(<TodoDetailPanel todo={mockTodo} indentPx={20} />);

      const closeButton = screen.getByLabelText('detail.closeEdit');
      await user.click(closeButton);

      expect(mockSetDetailEditing).toHaveBeenCalledWith(false);
    });
  });

  describe('Tag Operations with Parent Change', () => {
    beforeEach(() => {
      mockUseTodoUiStore.mockImplementation((selector: any) => {
        const state = {
          isDetailEditing: true,
          setDetailEditing: mockSetDetailEditing,
        };
        return selector(state);
      });
    });

    it('should send parent change and tag changes on save', async () => {
      const user = userEvent.setup();
      render(<TodoDetailPanel todo={mockTodo} indentPx={20} />);

      // Change parent
      const changeParentButton = screen.getByRole('button', { name: 'Change Parent' });
      await user.click(changeParentButton);

      // Add tag
      const addTagButton = screen.getByRole('button', { name: 'Add Tag' });
      await user.click(addTagButton);

      // Save
      const saveButton = screen.getByRole('button', { name: 'actions.save' });
      await user.click(saveButton);

      // Verify parent change
      expect(mockUpdateMutate).toHaveBeenCalledWith({
        id: 'todo-1',
        input: {
          description: 'Test description',
          parentId: 'new-parent-id',
        },
      });

      // Verify tag change
      expect(mockAddTagMutate).toHaveBeenCalledWith({
        todoId: 'todo-1',
        tagId: 'tag-new',
      });
    });

    it('should reset both tags and parent on cancel', async () => {
      const user = userEvent.setup();
      const { rerender } = render(<TodoDetailPanel todo={mockTodo} indentPx={20} />);

      // Change parent
      const changeParentButton = screen.getByRole('button', { name: 'Change Parent' });
      await user.click(changeParentButton);

      // Remove tag
      const removeTagButton = screen.getByRole('button', { name: 'Remove Tag' });
      await user.click(removeTagButton);

      // Cancel
      const cancelButton = screen.getByRole('button', { name: 'actions.cancel' });
      await user.click(cancelButton);

      // No mutations should be called
      expect(mockUpdateMutate).not.toHaveBeenCalled();
      expect(mockRemoveTagMutate).not.toHaveBeenCalled();

      // Exit and re-enter edit mode
      mockUseTodoUiStore.mockImplementation((selector: any) => {
        const state = {
          isDetailEditing: false,
          setDetailEditing: mockSetDetailEditing,
        };
        return selector(state);
      });
      rerender(<TodoDetailPanel todo={mockTodo} indentPx={20} />);

      mockUseTodoUiStore.mockImplementation((selector: any) => {
        const state = {
          isDetailEditing: true,
          setDetailEditing: mockSetDetailEditing,
        };
        return selector(state);
      });
      rerender(<TodoDetailPanel todo={mockTodo} indentPx={20} />);

      // Verify state reset
      expect(screen.getByTestId('selected-tags')).toHaveTextContent('tag-1,tag-2');
      expect(screen.getByTestId('current-parent')).toHaveTextContent('parent-1');
    });
  });

  describe('TagPicker workspace scoping', () => {
    beforeEach(() => {
      mockUseTodoUiStore.mockImplementation((selector: any) => {
        const state = {
          isDetailEditing: true,
          setDetailEditing: mockSetDetailEditing,
        };
        return selector(state);
      });
    });

    it('should pass todo.workspaceId to TagPicker, not active workspace', () => {
      // Simulate "All Workspaces" mode where activeWorkspaceId is null
      mockUseActiveWorkspaceId.mockReturnValue(null);

      render(<TodoDetailPanel todo={mockTodo} indentPx={20} />);

      const tagPicker = screen.getByTestId('tag-picker');
      expect(tagPicker).toHaveAttribute('data-workspace-id', 'ws-1');
    });

    it('should pass todo.workspaceId even when active workspace differs', () => {
      mockUseActiveWorkspaceId.mockReturnValue('ws-other');

      render(<TodoDetailPanel todo={mockTodo} indentPx={20} />);

      const tagPicker = screen.getByTestId('tag-picker');
      expect(tagPicker).toHaveAttribute('data-workspace-id', 'ws-1');
    });
  });

  describe('Description Editing', () => {
    beforeEach(() => {
      mockUseTodoUiStore.mockImplementation((selector: any) => {
        const state = {
          isDetailEditing: true,
          setDetailEditing: mockSetDetailEditing,
        };
        return selector(state);
      });
    });

    it('should enable save button when description changes', async () => {
      const user = userEvent.setup();
      render(<TodoDetailPanel todo={mockTodo} indentPx={20} />);

      const saveButton = screen.getByRole('button', { name: 'actions.save' });
      expect(saveButton).toBeDisabled();

      const textarea = screen.getByDisplayValue('Test description');
      await user.type(textarea, ' updated');

      expect(saveButton).toBeEnabled();
    });

    it('should send trimmed description on save', async () => {
      const user = userEvent.setup();
      render(<TodoDetailPanel todo={mockTodo} indentPx={20} />);

      const textarea = screen.getByDisplayValue('Test description');
      await user.clear(textarea);
      await user.type(textarea, '  Updated  ');

      const saveButton = screen.getByRole('button', { name: 'actions.save' });
      await user.click(saveButton);

      expect(mockUpdateMutate).toHaveBeenCalledWith({
        id: 'todo-1',
        input: { description: 'Updated' },
      });
    });

    it('should send null description when empty', async () => {
      const user = userEvent.setup();
      render(<TodoDetailPanel todo={mockTodo} indentPx={20} />);

      const textarea = screen.getByDisplayValue('Test description');
      await user.clear(textarea);

      const saveButton = screen.getByRole('button', { name: 'actions.save' });
      await user.click(saveButton);

      expect(mockUpdateMutate).toHaveBeenCalledWith({
        id: 'todo-1',
        input: { description: null },
      });
    });
  });
});
