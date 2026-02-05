import { useMemo } from 'react';
import { useDndContext } from '@dnd-kit/core';
import type { Todo } from '../types/todo';

export type DropZonePosition = 'above' | 'below' | 'child' | null;

interface UseDropZoneResult {
  position: DropZonePosition;
  isOver: boolean;
}

export function useDropZone(todo: Todo, _depth: number, isExpanded: boolean): UseDropZoneResult {
  const { active, over } = useDndContext();

  const isOver = over?.id === todo.id;
  const activeId = active?.id as string | undefined;

  const position = useMemo<DropZonePosition>(() => {
    if (!isOver || !activeId || activeId === todo.id) {
      return null;
    }

    // If expanded with no children, treat as "add child" target
    if (isExpanded && todo.children?.length === 0) {
      return 'child';
    }

    return 'below';
  }, [isOver, activeId, todo.id, isExpanded, todo.children]);

  return { position, isOver };
}
