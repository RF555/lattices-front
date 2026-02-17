import { useState, useRef, useCallback, useEffect, type ReactNode } from 'react';
import { useSwipeable } from 'react-swipeable';
import { Trash2, Check, Undo2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '@lib/utils/cn';
import { useIsCoarsePointer } from '@hooks/useIsCoarsePointer';

const REVEAL_THRESHOLD = 140;
const AUTO_TRIGGER_RATIO = 0.6;
const ACTION_WIDTH = 72;

type RevealState = 'closed' | 'delete' | 'complete';

interface SwipeableTodoRowProps {
  children: ReactNode;
  onDelete: () => void;
  onToggleComplete: () => void;
  isCompleted: boolean;
  todoId: string;
}

export function SwipeableTodoRow({
  children,
  onDelete,
  onToggleComplete,
  isCompleted,
  todoId,
}: SwipeableTodoRowProps) {
  const isTouch = useIsCoarsePointer();
  const { t, i18n } = useTranslation('todos');
  const isRtl = i18n.dir() === 'rtl';

  const [revealed, setRevealed] = useState<RevealState>('closed');
  const [swiping, setSwiping] = useState(false);
  const [swipeDelta, setSwipeDelta] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close revealed actions when clicking outside
  useEffect(() => {
    if (revealed === 'closed') return;

    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setRevealed('closed');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [revealed]);

  // Close when todoId changes (e.g., after delete/reorder)
  useEffect(() => {
    setRevealed('closed');
  }, [todoId]);

  const handleAction = useCallback(
    (action: 'delete' | 'complete') => {
      setRevealed('closed');
      if (action === 'delete') {
        onDelete();
      } else {
        onToggleComplete();
      }
    },
    [onDelete, onToggleComplete],
  );

  const getRowWidth = () => containerRef.current?.offsetWidth ?? 0;

  const handleSwipeEnd = useCallback(
    (direction: 'left' | 'right', absDelta: number) => {
      const rowWidth = getRowWidth();
      const autoTriggerThreshold = rowWidth * AUTO_TRIGGER_RATIO;

      // Determine which action this direction maps to
      const action: 'delete' | 'complete' =
        (direction === 'left') !== isRtl ? 'delete' : 'complete';

      if (rowWidth > 0 && absDelta >= autoTriggerThreshold) {
        // Full swipe: auto-trigger the action
        setSwiping(false);
        setSwipeDelta(0);
        setRevealed('closed');
        if (action === 'delete') {
          onDelete();
        } else {
          onToggleComplete();
        }
      } else if (absDelta >= REVEAL_THRESHOLD) {
        // Partial swipe: reveal the action button
        setRevealed(action);
        setSwiping(false);
        setSwipeDelta(0);
      } else {
        // Below threshold: snap back
        setSwiping(false);
        setSwipeDelta(0);
      }
    },
    [isRtl, onDelete, onToggleComplete],
  );

  const handlers = useSwipeable({
    onSwipeStart: (eventData) => {
      // Only activate swipe if the initial direction is horizontal
      if (eventData.dir === 'Left' || eventData.dir === 'Right') {
        setSwiping(true);
      }
    },
    onSwiping: (eventData) => {
      // Ignore vertical scrolling - only track primarily horizontal movement
      if (!swiping || eventData.absX < eventData.absY * 1.5) return;
      setSwipeDelta(eventData.deltaX);
    },
    onSwipedLeft: (eventData) => {
      handleSwipeEnd('left', Math.abs(eventData.deltaX));
    },
    onSwipedRight: (eventData) => {
      handleSwipeEnd('right', Math.abs(eventData.deltaX));
    },
    onSwiped: () => {
      setSwiping(false);
      setSwipeDelta(0);
    },
    trackMouse: false,
    trackTouch: true,
    delta: 20,
    preventScrollOnSwipe: true,
  });

  // On non-touch devices, just render children directly
  if (!isTouch) {
    return <>{children}</>;
  }

  // Calculate the visual translation during swipe
  const getTranslateX = (): number => {
    if (swiping && swipeDelta !== 0) {
      // Apply diminishing resistance but allow full-width swipe
      const abs = Math.abs(swipeDelta);
      const resisted =
        abs <= ACTION_WIDTH * 2 ? abs * 0.5 : ACTION_WIDTH + (abs - ACTION_WIDTH * 2) * 0.25;
      return Math.sign(swipeDelta) * resisted;
    }
    if (revealed === 'delete') {
      return isRtl ? ACTION_WIDTH : -ACTION_WIDTH;
    }
    if (revealed === 'complete') {
      return isRtl ? -ACTION_WIDTH : ACTION_WIDTH;
    }
    return 0;
  };

  const translateX = getTranslateX();

  const showActions = Math.abs(translateX) > 1;

  return (
    <div ref={containerRef} className="relative overflow-hidden">
      {showActions && (
        <>
          {/* Delete action (behind the row) */}
          <button
            className={cn(
              'absolute inset-y-0 flex items-center justify-center',
              'bg-red-500 text-white',
              'end-0',
            )}
            style={{ width: `${ACTION_WIDTH}px` }}
            onClick={() => {
              handleAction('delete');
            }}
            aria-label={t('swipe.delete')}
            tabIndex={revealed === 'delete' ? 0 : -1}
          >
            <Trash2 className="w-5 h-5" />
          </button>

          {/* Complete/Uncomplete action (behind the row) */}
          <button
            className={cn(
              'absolute inset-y-0 flex items-center justify-center',
              'text-white',
              isCompleted ? 'bg-amber-500' : 'bg-green-500',
              'start-0',
            )}
            style={{ width: `${ACTION_WIDTH}px` }}
            onClick={() => {
              handleAction('complete');
            }}
            aria-label={isCompleted ? t('swipe.uncomplete') : t('swipe.complete')}
            tabIndex={revealed === 'complete' ? 0 : -1}
          >
            {isCompleted ? <Undo2 className="w-5 h-5" /> : <Check className="w-5 h-5" />}
          </button>
        </>
      )}

      {/* The row content slides over the action buttons */}
      <div
        {...handlers}
        className="relative bg-white"
        style={{
          transform: `translateX(${translateX}px)`,
          transition: swiping ? 'none' : 'transform 200ms ease-out',
          willChange: swiping ? 'transform' : 'auto',
        }}
      >
        {children}
      </div>
    </div>
  );
}
