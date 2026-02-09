import { useRef, useState, useEffect, useCallback } from 'react';
import { useIsMobile } from './useIsMobile';

const PULL_THRESHOLD = 60;
const MAX_PULL = 120;

interface UsePullToRefreshOptions {
  onRefresh: () => Promise<void> | void;
}

interface UsePullToRefreshReturn {
  containerRef: React.RefObject<HTMLDivElement>;
  isPulling: boolean;
  isRefreshing: boolean;
  pullProgress: number;
}

export function usePullToRefresh({ onRefresh }: UsePullToRefreshOptions): UsePullToRefreshReturn {
  const containerRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();
  const [isPulling, setIsPulling] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);

  const startYRef = useRef(0);
  const pullingRef = useRef(false);

  const handleTouchStart = useCallback(
    (e: TouchEvent) => {
      if (isRefreshing) return;
      const container = containerRef.current;
      if (!container || container.scrollTop > 0) return;

      startYRef.current = e.touches[0].clientY;
      pullingRef.current = false;
    },
    [isRefreshing],
  );

  const handleTouchMove = useCallback(
    (e: TouchEvent) => {
      if (isRefreshing) return;
      const container = containerRef.current;
      if (!container || container.scrollTop > 0) return;

      const currentY = e.touches[0].clientY;
      const diff = currentY - startYRef.current;

      if (diff > 0) {
        // Apply resistance: diminishing returns as user pulls further
        const distance = Math.min(diff * 0.5, MAX_PULL);
        pullingRef.current = true;
        setIsPulling(true);
        setPullDistance(distance);
        e.preventDefault();
      }
    },
    [isRefreshing],
  );

  const handleTouchEnd = useCallback(async () => {
    if (!pullingRef.current) return;

    if (pullDistance >= PULL_THRESHOLD) {
      setIsRefreshing(true);
      setPullDistance(0);
      setIsPulling(false);
      try {
        await onRefresh();
      } finally {
        setIsRefreshing(false);
      }
    } else {
      setPullDistance(0);
      setIsPulling(false);
    }
    pullingRef.current = false;
  }, [pullDistance, onRefresh]);

  useEffect(() => {
    if (!isMobile) return;

    const container = containerRef.current;
    if (!container) return;

    container.addEventListener('touchstart', handleTouchStart, { passive: true });
    container.addEventListener('touchmove', handleTouchMove, { passive: false });
    const onTouchEnd = () => {
      void handleTouchEnd();
    };
    container.addEventListener('touchend', onTouchEnd);

    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', onTouchEnd);
    };
  }, [isMobile, handleTouchStart, handleTouchMove, handleTouchEnd]);

  const pullProgress = Math.min(pullDistance / PULL_THRESHOLD, 1);

  return {
    containerRef,
    isPulling,
    isRefreshing,
    pullProgress,
  };
}
