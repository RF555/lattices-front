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
import type { Todo } from '../../types/todo';

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

  // Compute which depth levels have continuing branch lines for each item
  const branchLinesMap = useMemo(() => {
    return computeBranchLines(flatItems);
  }, [flatItems]);

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
              activeBranchDepths={branchLinesMap.get(todo.id) ?? []}
            />
          ))}
        </div>
      </SortableContext>
    </TreeDndContext>
  );
}

/**
 * For each item in the flat list, compute which depth levels still have
 * a sibling below (i.e. the vertical branch line should continue).
 */
function computeBranchLines(flatItems: Todo[]): Map<string, number[]> {
  const result = new Map<string, number[]>();
  // For each depth level, track the index of the last item at that depth
  // that shares a parent with subsequent items
  const lastAtDepth = new Map<number, number>();

  // Walk backwards to find, for each depth, where the last sibling is
  for (let i = flatItems.length - 1; i >= 0; i--) {
    const depth = flatItems[i].depth ?? 0;
    if (!lastAtDepth.has(depth)) {
      lastAtDepth.set(depth, i);
    }
    // Reset deeper depths when we step back to a shallower item
    for (const [d] of lastAtDepth) {
      if (d > depth) lastAtDepth.delete(d);
    }
  }

  // Now walk forward: for each item, track active depth levels
  // A depth level is "active" if there's another item at that depth
  // (same parent) further down in the list
  const activeDepths = new Set<number>();

  for (let i = 0; i < flatItems.length; i++) {
    const item = flatItems[i];
    const depth = item.depth ?? 0;

    // Remove depths deeper than current (we've stepped out of that subtree)
    for (const d of activeDepths) {
      if (d >= depth) activeDepths.delete(d);
    }

    // Check if there's a next sibling at this depth (same parent)
    let hasNextSibling = false;
    for (let j = i + 1; j < flatItems.length; j++) {
      const nextDepth = flatItems[j].depth ?? 0;
      if (nextDepth < depth) break; // stepped out of parent scope
      if (nextDepth === depth) {
        hasNextSibling = true;
        break;
      }
    }

    if (hasNextSibling) {
      activeDepths.add(depth);
    }

    // Store a copy of active depths for this item
    result.set(item.id, [...activeDepths]);
  }

  return result;
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
