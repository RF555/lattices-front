import { Skeleton } from '@components/ui/Skeleton';

interface TodoTreeSkeletonProps {
  count?: number;
}

// Deterministic widths to avoid Math.random() in render (violates pure render)
const SKELETON_DEPTHS = [0, 1, 0, 2, 1, 0, 1, 2];
const SKELETON_WIDTHS = [65, 40, 55, 35, 50, 45, 60, 38];

export function TodoTreeSkeleton({ count = 8 }: TodoTreeSkeletonProps) {
  return (
    <div className="space-y-2" role="status" aria-label="Loading tasks">
      {Array.from({ length: count }, (_, i) => {
        const depth = SKELETON_DEPTHS[i % SKELETON_DEPTHS.length];
        const indent = depth * 24;

        return (
          <div
            key={i}
            className="flex items-center gap-2 px-2 py-2"
            style={{ paddingLeft: `${indent + 8}px` }}
          >
            <Skeleton variant="circular" width={16} height={16} />
            <Skeleton variant="circular" width={16} height={16} />
            <Skeleton
              variant="text"
              width={`${SKELETON_WIDTHS[i % SKELETON_WIDTHS.length]}%`}
              height={16}
            />
          </div>
        );
      })}
      <span className="sr-only">Loading tasks...</span>
    </div>
  );
}
