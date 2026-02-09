import { useCallback, useEffect } from 'react';
import { ELEMENT_IDS } from '@/constants';
import { useTodoUiStore } from '../stores/todoUiStore';
import { useToggleTodo, useDeleteTodo } from './useTodos';
import type { Todo } from '../types/todo';

interface UseTreeKeyboardOptions {
  todos: Todo[];
  isEnabled?: boolean;
}

export function useTreeKeyboard({ todos, isEnabled = true }: UseTreeKeyboardOptions) {
  const selectedId = useTodoUiStore((s) => s.selectedId);
  const setSelectedId = useTodoUiStore((s) => s.setSelectedId);
  const expandedIds = useTodoUiStore((s) => s.expandedIds);
  const toggleExpanded = useTodoUiStore((s) => s.toggleExpanded);

  const toggleMutation = useToggleTodo();
  const deleteMutation = useDeleteTodo();

  // Flatten visible items for navigation
  const getVisibleItems = useCallback((): Todo[] => {
    const items: Todo[] = [];

    const traverse = (nodes: Todo[]) => {
      for (const node of nodes) {
        items.push(node);
        if (node.children?.length && expandedIds.has(node.id)) {
          traverse(node.children);
        }
      }
    };

    traverse(todos);
    return items;
  }, [todos, expandedIds]);

  const findSelectedIndex = useCallback(() => {
    const items = getVisibleItems();
    return items.findIndex((item) => item.id === selectedId);
  }, [getVisibleItems, selectedId]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!isEnabled) return;

      // Ignore if user is typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      const items = getVisibleItems();
      const currentIndex = findSelectedIndex();

      switch (e.key) {
        case 'ArrowDown':
        case 'j': {
          e.preventDefault();
          const nextIndex = Math.min(currentIndex + 1, items.length - 1);
          if (nextIndex >= 0 && items[nextIndex]) {
            setSelectedId(items[nextIndex].id);
          }
          break;
        }

        case 'ArrowUp':
        case 'k': {
          e.preventDefault();
          const prevIndex = Math.max(currentIndex - 1, 0);
          if (items[prevIndex]) {
            setSelectedId(items[prevIndex].id);
          }
          break;
        }

        case 'ArrowRight':
        case 'l': {
          e.preventDefault();
          if (selectedId) {
            const item = items.find((i) => i.id === selectedId);
            if (item?.children?.length && !expandedIds.has(selectedId)) {
              toggleExpanded(selectedId);
            }
          }
          break;
        }

        case 'ArrowLeft':
        case 'h': {
          e.preventDefault();
          if (selectedId) {
            const item = items.find((i) => i.id === selectedId);
            if (item?.children?.length && expandedIds.has(selectedId)) {
              toggleExpanded(selectedId);
            } else if (item?.parentId) {
              // Move to parent
              setSelectedId(item.parentId);
            }
          }
          break;
        }

        case 'Enter':
        case ' ': {
          e.preventDefault();
          if (selectedId) {
            const currentTodo = items.find((i) => i.id === selectedId);
            if (currentTodo) {
              toggleMutation.mutate({ id: selectedId, isCompleted: !currentTodo.isCompleted });
            }
          }
          break;
        }

        case 'Delete':
        case 'Backspace': {
          if (e.metaKey || e.ctrlKey) {
            e.preventDefault();
            if (selectedId) {
              // Select next item before delete
              const nextIndex = Math.min(currentIndex + 1, items.length - 2);
              if (nextIndex >= 0 && items[nextIndex] && items[nextIndex].id !== selectedId) {
                setSelectedId(items[nextIndex].id);
              } else {
                setSelectedId(null);
              }
              deleteMutation.mutate(selectedId);
            }
          }
          break;
        }

        case 'n': {
          if (e.metaKey || e.ctrlKey) {
            e.preventDefault();
            document.getElementById(ELEMENT_IDS.CREATE_TODO_INPUT)?.focus();
          }
          break;
        }

        case 'Escape': {
          setSelectedId(null);
          break;
        }

        case 'Home': {
          e.preventDefault();
          if (items[0]) {
            setSelectedId(items[0].id);
          }
          break;
        }

        case 'End': {
          e.preventDefault();
          if (items[items.length - 1]) {
            setSelectedId(items[items.length - 1].id);
          }
          break;
        }
      }
    },
    [
      isEnabled,
      getVisibleItems,
      findSelectedIndex,
      selectedId,
      setSelectedId,
      expandedIds,
      toggleExpanded,
      toggleMutation,
      deleteMutation,
    ],
  );

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);
}
