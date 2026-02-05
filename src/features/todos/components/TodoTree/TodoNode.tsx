import { memo } from 'react';
import { useTodoUiStore } from '../../stores/todoUiStore';
import { TodoNodeContent } from '../TodoNodeContent';
import { ViewingIndicator } from '@features/workspaces/components/ViewingIndicator/ViewingIndicator';
import type { Todo } from '../../types/todo';
import type { PresenceUser } from '@lib/realtime';

interface TodoNodeProps {
  todo: Todo;
  depth: number;
  isExpanded: boolean;
  viewingTask?: Map<string, PresenceUser[]>;
}

export const TodoNode = memo(function TodoNode({
  todo,
  depth,
  isExpanded,
  viewingTask,
}: TodoNodeProps) {
  const expandedIds = useTodoUiStore((s) => s.expandedIds);
  const hasChildren = !!todo.children?.length;
  const viewers = viewingTask?.get(todo.id) || [];

  return (
    <div role="treeitem" aria-selected={false} aria-expanded={hasChildren ? isExpanded : undefined}>
      <div className="flex items-center gap-1">
        <div className="flex-1 min-w-0">
          <TodoNodeContent
            todo={todo}
            depth={depth}
            isExpanded={isExpanded}
            hasChildren={hasChildren}
          />
        </div>
        {viewers.length > 0 && <ViewingIndicator viewers={viewers} className="shrink-0 mr-2" />}
      </div>

      {hasChildren && isExpanded && (
        <div
          role="group"
          className="lattice-branch"
          style={{ '--branch-x': `${(depth + 1) * 24 + 8}px` } as React.CSSProperties}
        >
          {todo.children!.map((child, index) => (
            <div
              key={child.id}
              className={`lattice-connector${index === todo.children!.length - 1 ? ' lattice-branch-last' : ''}`}
              style={{ '--branch-x': `${(depth + 1) * 24 + 8}px` } as React.CSSProperties}
            >
              <TodoNode
                todo={child}
                depth={depth + 1}
                isExpanded={expandedIds.has(child.id)}
                viewingTask={viewingTask}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
});
