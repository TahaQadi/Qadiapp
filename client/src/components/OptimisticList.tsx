
import { useState, useTransition } from 'react';

interface OptimisticListProps<T> {
  items: T[];
  onUpdate: (item: T) => Promise<void>;
  onDelete: (id: string | number) => Promise<void>;
  renderItem: (item: T, isPending: boolean) => React.ReactNode;
  keyExtractor: (item: T) => string | number;
}

export function OptimisticList<T>({
  items,
  onUpdate,
  onDelete,
  renderItem,
  keyExtractor,
}: OptimisticListProps<T>) {
  const [isPending, startTransition] = useTransition();
  const [pendingItems, setPendingItems] = useState<Set<string | number>>(new Set());

  const handleUpdate = async (item: T) => {
    const key = keyExtractor(item);
    setPendingItems((prev) => new Set(prev).add(key));
    
    startTransition(async () => {
      try {
        await onUpdate(item);
      } finally {
        setPendingItems((prev) => {
          const next = new Set(prev);
          next.delete(key);
          return next;
        });
      }
    });
  };

  const handleDelete = async (id: string | number) => {
    setPendingItems((prev) => new Set(prev).add(id));
    
    startTransition(async () => {
      try {
        await onDelete(id);
      } finally {
        setPendingItems((prev) => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
      }
    });
  };

  return (
    <>
      {items.map((item) => {
        const key = keyExtractor(item);
        const isItemPending = pendingItems.has(key);
        return (
          <div
            key={key}
            style={{
              opacity: isItemPending ? 0.6 : 1,
              transition: 'opacity 0.2s',
            }}
          >
            {renderItem(item, isItemPending)}
          </div>
        );
      })}
    </>
  );
}
