import { memo } from 'react';
import { useIsSmallScreen } from '@hooks/useIsSmallScreen';
import { useTodoUiStore } from '@features/todos/stores/todoUiStore';
import { TodoNodeContent } from '../TodoNodeContent';
import { ViewingIndicator } from '@features/workspaces/components/ViewingIndicator/ViewingIndicator';
import type { Todo } from '@features/todos/types/todo';
import type { PresenceUser } from '@lib/realtime';

interface TodoNodeProps {
  todo: Todo;
  depth: number;
  isExpanded: boolean;
  viewingTask?: Map<string, PresenceUser[]>;
  siblings?: Todo[];
  siblingIndex?: number;
}

export const TodoNode = memo(function TodoNode({
  todo,
  depth,
  isExpanded,
  viewingTask,
  siblings,
  siblingIndex,
}: TodoNodeProps) {
  const expandedIds = useTodoUiStore((s) => s.expandedIds);
  const isSmallScreen = useIsSmallScreen();
  const hasChildren = !!todo.children?.length;
  const viewers = viewingTask?.get(todo.id) ?? [];

  // Branch-x must match the child indentation formula in TodoNodeContent
  const childIndent = isSmallScreen ? Math.min((depth + 1) * 16, 80) : (depth + 1) * 24;
  const branchX = `${childIndent + 8}px`;

  return (
    <div role="treeitem" aria-selected={false} aria-expanded={hasChildren ? isExpanded : undefined}>
      <div className="flex items-center gap-1">
        <div className="flex-1 min-w-0">
          <TodoNodeContent
            todo={todo}
            depth={depth}
            isExpanded={isExpanded}
            hasChildren={hasChildren}
            siblings={siblings}
            siblingIndex={siblingIndex}
          />
        </div>
        {viewers.length > 0 && <ViewingIndicator viewers={viewers} className="shrink-0 mr-2" />}
      </div>

      {hasChildren && isExpanded && (
        <div
          role="group"
          className="lattice-branch"
          style={{ '--branch-x': branchX } as React.CSSProperties}
        >
          {todo.children?.map((child, index) => (
            <div
              key={child.id}
              className={`lattice-connector${index === (todo.children?.length ?? 0) - 1 ? ' lattice-branch-last' : ''}`}
              style={{ '--branch-x': branchX } as React.CSSProperties}
            >
              <TodoNode
                todo={child}
                depth={depth + 1}
                isExpanded={expandedIds.has(child.id)}
                viewingTask={viewingTask}
                siblings={todo.children}
                siblingIndex={index}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
});
