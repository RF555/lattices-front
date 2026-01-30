interface TodoTreeEmptyProps {
  hasFilters: boolean;
}

export function TodoTreeEmpty({ hasFilters }: TodoTreeEmptyProps) {
  return (
    <div className="text-center py-12">
      <div className="text-gray-400 mb-2">
        <svg
          className="w-12 h-12 mx-auto"
          viewBox="0 0 48 48"
          fill="none"
        >
          <rect
            x="8"
            y="8"
            width="32"
            height="32"
            rx="4"
            stroke="currentColor"
            strokeWidth="2"
          />
          <path
            d="M16 20h16M16 28h10"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      </div>
      <h3 className="text-lg font-medium text-gray-900">
        {hasFilters ? 'No matching tasks' : 'No tasks yet'}
      </h3>
      <p className="text-sm text-gray-500 mt-1">
        {hasFilters
          ? 'Try adjusting your filters'
          : 'Create your first task to get started'}
      </p>
    </div>
  );
}
