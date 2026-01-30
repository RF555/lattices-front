import { useCallback, useMemo } from 'react';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { TreeDndContext, type DragEndEvent } from '@lib/dnd/TreeDndContext';
import { useTodos, useMoveTodo } from '../../hooks/useTodos';
import { useTodoUiStore } from '../../stores/todoUiStore';
import { flattenTodoTree } from '../../utils/treeUtils';
import { SortableTodoNode } from './SortableTodoNode';
import { TodoTreeEmpty } from '../TodoTree/TodoTreeEmpty';
import { TodoTreeLoading } from '../TodoTree/TodoTreeLoading';
import { DragOverlayContent } from './DragOverlayContent';

export function SortableTodoTree() {
  const { data: todos, isLoading, error } = useTodos();
  const moveMutation = useMoveTodo();
  const expandedIds = useTodoUiStore((state) => state.expandedIds);

  // Flatten tree for sortable context
  const flatItems = useMemo(() => {
    if (!todos) return [];
    return flattenTodoTree(todos, expandedIds);
  }, [todos, expandedIds]);

  const itemIds = useMemo(() => flatItems.map((item) => item.id), [flatItems]);

  // Build a parent lookup map for O(1) ancestor traversal
  const parentMap = useMemo(() => {
    const map = new Map<string, string | null>();
    for (const item of flatItems) {
      map.set(item.id, item.parentId);
    }
    return map;
  }, [flatItems]);

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;

      if (!over || active.id === over.id) return;

      const activeId = active.id as string;
      const overId = over.id as string;

      // Find the items
      const activeItem = flatItems.find((item) => item.id === activeId);
      const overItem = flatItems.find((item) => item.id === overId);

      if (!activeItem || !overItem) return;

      // Don't allow moving parent into its own descendant (full ancestor chain check)
      if (isDescendantOf(activeId, overId, parentMap)) {
        return;
      }

      // Determine new parent and position
      let newParentId: string | null;
      let newPosition: number;

      // If dropping onto an expanded item with children, add as first child
      if (
        expandedIds.has(overId) &&
        overItem.children &&
        overItem.children.length > 0
      ) {
        newParentId = overId;
        newPosition = 0;
      } else {
        // Otherwise, place as sibling
        newParentId = overItem.parentId;
        newPosition = overItem.position;
      }

      moveMutation.mutate({
        id: activeId,
        parentId: newParentId,
        position: newPosition,
      });
    },
    [flatItems, expandedIds, moveMutation, parentMap]
  );

  if (isLoading) {
    return <TodoTreeLoading />;
  }

  if (error) {
    return (
      <div className="p-4 text-red-600 bg-red-50 rounded-md">
        Failed to load todos. Please try again.
      </div>
    );
  }

  if (!todos?.length) {
    return <TodoTreeEmpty hasFilters={false} />;
  }

  /**
   * FIX C5: Render a FLAT list matching SortableContext items.
   * Visual nesting is achieved via CSS indentation (depth * 24px),
   * NOT via nested DOM. This ensures SortableContext's
   * verticalListSortingStrategy correctly tracks drop positions.
   */
  return (
    <TreeDndContext
      items={flatItems}
      onDragEnd={handleDragEnd}
      renderOverlay={(item) => item && <DragOverlayContent todo={item} />}
    >
      <SortableContext items={itemIds} strategy={verticalListSortingStrategy}>
        <div className="space-y-0.5" role="tree">
          {flatItems.map((todo) => (
            <SortableTodoNode
              key={todo.id}
              todo={todo}
              depth={todo.depth ?? 0}
              isExpanded={expandedIds.has(todo.id)}
              hasChildren={!!todo.children?.length}
            />
          ))}
        </div>
      </SortableContext>
    </TreeDndContext>
  );
}

/**
 * Check if `ancestorId` is an ancestor of `item` by traversing
 * the full parent chain using a lookup map.
 * Prevents circular references when dragging a parent onto its own descendant.
 */
function isDescendantOf(
  ancestorId: string,
  itemId: string,
  parentMap: Map<string, string | null>
): boolean {
  let current = parentMap.get(itemId) ?? null;
  const visited = new Set<string>(); // safety guard against corrupted data
  while (current) {
    if (current === ancestorId) return true;
    if (visited.has(current)) break; // prevent infinite loop on corrupted tree
    visited.add(current);
    current = parentMap.get(current) ?? null;
  }
  return false;
}
