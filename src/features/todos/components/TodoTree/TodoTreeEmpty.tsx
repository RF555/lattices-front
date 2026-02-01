import { LayoutList } from 'lucide-react';

interface TodoTreeEmptyProps {
  hasFilters: boolean;
}

export function TodoTreeEmpty({ hasFilters }: TodoTreeEmptyProps) {
  return (
    <div className="text-center py-12">
      <div className="text-gray-400 mb-2">
        <LayoutList className="w-12 h-12 mx-auto" strokeWidth={1.5} />
      </div>
      <h3 className="text-lg font-medium text-gray-900">
        {hasFilters ? 'No matching tasks' : 'No tasks yet'}
      </h3>
      <p className="text-sm text-gray-500 mt-1">
        {hasFilters
          ? 'Try adjusting your filters'
          : 'Tasks with a foundation. Create your first task to build your lattice.'}
      </p>
    </div>
  );
}
