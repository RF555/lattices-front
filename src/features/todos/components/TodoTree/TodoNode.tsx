import { memo } from 'react';
import { useTodoUiStore } from '../../stores/todoUiStore';
import { TodoNodeContent } from '../TodoNodeContent';
import type { Todo } from '../../types/todo';

interface TodoNodeProps {
  todo: Todo;
  depth: number;
  isExpanded: boolean;
}

export const TodoNode = memo(function TodoNode({
  todo,
  depth,
  isExpanded,
}: TodoNodeProps) {
  const expandedIds = useTodoUiStore((s) => s.expandedIds);
  const hasChildren = !!todo.children?.length;

  return (
    <div role="treeitem" aria-expanded={hasChildren ? isExpanded : undefined}>
      <TodoNodeContent
        todo={todo}
        depth={depth}
        isExpanded={isExpanded}
        hasChildren={hasChildren}
      />

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
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
});
