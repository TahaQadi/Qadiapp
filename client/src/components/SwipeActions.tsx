
import { useRef, useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Trash2, Edit, Archive, Check } from 'lucide-react';

export interface SwipeAction {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  color: 'destructive' | 'primary' | 'secondary' | 'success';
  onAction: () => void | Promise<void>;
}

interface SwipeActionsProps {
  children: React.ReactNode;
  leftActions?: SwipeAction[];
  rightActions?: SwipeAction[];
  threshold?: number;
}

const colorClasses = {
  destructive: 'bg-destructive text-destructive-foreground',
  primary: 'bg-primary text-primary-foreground',
  secondary: 'bg-secondary text-secondary-foreground',
  success: 'bg-green-600 text-white',
};

export function SwipeActions({
  children,
  leftActions = [],
  rightActions = [],
  threshold = 80,
}: SwipeActionsProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [offset, setOffset] = useState(0);
  const [startX, setStartX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);

  const maxOffset = Math.max(leftActions.length, rightActions.length) * 80;

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleTouchStart = (e: TouchEvent) => {
      setStartX(e.touches[0].clientX);
      setIsDragging(true);
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isDragging || isExecuting) return;

      const currentX = e.touches[0].clientX;
      const diff = currentX - startX;

      // Only allow swipe if there are actions in that direction
      if ((diff > 0 && leftActions.length > 0) || (diff < 0 && rightActions.length > 0)) {
        setOffset(Math.max(-maxOffset, Math.min(maxOffset, diff)));
      }
    };

    const handleTouchEnd = async () => {
      setIsDragging(false);

      const absOffset = Math.abs(offset);
      const direction = offset > 0 ? 'left' : 'right';
      const actions = direction === 'left' ? leftActions : rightActions;

      if (absOffset >= threshold && actions.length > 0) {
        const actionIndex = Math.min(
          Math.floor(absOffset / 80),
          actions.length - 1
        );
        const action = actions[actionIndex];

        if (action) {
          setIsExecuting(true);
          try {
            await action.onAction();
          } finally {
            setIsExecuting(false);
            setOffset(0);
          }
        }
      } else {
        setOffset(0);
      }
    };

    container.addEventListener('touchstart', handleTouchStart);
    container.addEventListener('touchmove', handleTouchMove);
    container.addEventListener('touchend', handleTouchEnd);

    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isDragging, isExecuting, offset, startX, leftActions, rightActions, threshold, maxOffset]);

  return (
    <div ref={containerRef} className="relative overflow-hidden touch-pan-y">
      {/* Left actions */}
      {leftActions.length > 0 && (
        <div className="absolute left-0 top-0 bottom-0 flex">
          {leftActions.map((action, index) => {
            const Icon = action.icon;
            return (
              <div
                key={action.id}
                className={cn(
                  'flex items-center justify-center w-20 transition-opacity',
                  colorClasses[action.color],
                  offset <= index * 80 && 'opacity-0'
                )}
              >
                <Icon className="h-5 w-5" />
              </div>
            );
          })}
        </div>
      )}

      {/* Right actions */}
      {rightActions.length > 0 && (
        <div className="absolute right-0 top-0 bottom-0 flex">
          {rightActions.map((action, index) => {
            const Icon = action.icon;
            return (
              <div
                key={action.id}
                className={cn(
                  'flex items-center justify-center w-20 transition-opacity',
                  colorClasses[action.color],
                  Math.abs(offset) <= index * 80 && 'opacity-0'
                )}
              >
                <Icon className="h-5 w-5" />
              </div>
            );
          })}
        </div>
      )}

      {/* Content */}
      <div
        className="relative bg-background"
        style={{
          transform: `translateX(${offset}px)`,
          transition: isDragging ? 'none' : 'transform 0.3s ease-out',
        }}
      >
        {children}
      </div>
    </div>
  );
}

// Predefined common actions
export const commonSwipeActions = {
  delete: (onDelete: () => void | Promise<void>): SwipeAction => ({
    id: 'delete',
    label: 'Delete',
    icon: Trash2,
    color: 'destructive',
    onAction: onDelete,
  }),
  edit: (onEdit: () => void | Promise<void>): SwipeAction => ({
    id: 'edit',
    label: 'Edit',
    icon: Edit,
    color: 'primary',
    onAction: onEdit,
  }),
  archive: (onArchive: () => void | Promise<void>): SwipeAction => ({
    id: 'archive',
    label: 'Archive',
    icon: Archive,
    color: 'secondary',
    onAction: onArchive,
  }),
  complete: (onComplete: () => void | Promise<void>): SwipeAction => ({
    id: 'complete',
    label: 'Complete',
    icon: Check,
    color: 'success',
    onAction: onComplete,
  }),
};
