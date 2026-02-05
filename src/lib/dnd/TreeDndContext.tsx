import { useState, useCallback, type ReactNode } from 'react';
import {
  DndContext,
  DragOverlay,
  closestCenter,
  type DragStartEvent,
  type DragEndEvent,
  type DragOverEvent,
} from '@dnd-kit/core';
import { useDndSensors, measuring } from './config';

/** Minimal tree node shape required by TreeDndContext. */
interface TreeNode {
  id: string;
  children?: TreeNode[];
}

interface TreeDndContextProps<T extends TreeNode> {
  children: ReactNode;
  items: T[];
  onDragEnd: (event: DragEndEvent) => void;
  renderOverlay?: (activeItem: T | null) => ReactNode;
}

export function TreeDndContext<T extends TreeNode>({
  children,
  items,
  onDragEnd,
  renderOverlay,
}: TreeDndContextProps<T>) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [, setOverId] = useState<string | null>(null);
  const sensors = useDndSensors();

  const activeItem = activeId ? findItemById<T>(items, activeId) : null;

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  }, []);

  const handleDragOver = useCallback((event: DragOverEvent) => {
    setOverId(event.over?.id as string | null);
  }, []);

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      setActiveId(null);
      setOverId(null);
      onDragEnd(event);
    },
    [onDragEnd],
  );

  const handleDragCancel = useCallback(() => {
    setActiveId(null);
    setOverId(null);
  }, []);

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      measuring={measuring}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      {children}
      <DragOverlay>{renderOverlay ? renderOverlay(activeItem) : null}</DragOverlay>
    </DndContext>
  );
}

function findItemById<T extends TreeNode>(items: T[], id: string): T | null {
  for (const item of items) {
    if (item.id === id) return item;
    if (item.children) {
      const found = findItemById<T>(item.children as T[], id);
      if (found) return found;
    }
  }
  return null;
}

export { type DragEndEvent };
