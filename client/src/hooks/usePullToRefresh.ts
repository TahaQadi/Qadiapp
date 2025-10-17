
import { useEffect, useRef, useState } from 'react';

export function usePullToRefresh(onRefresh: () => Promise<void>) {
  const [isPulling, setIsPulling] = useState(false);
  const startY = useRef(0);
  const currentY = useRef(0);

  useEffect(() => {
    const handleTouchStart = (e: TouchEvent) => {
      if (window.scrollY === 0) {
        startY.current = e.touches[0].clientY;
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (startY.current === 0) return;
      currentY.current = e.touches[0].clientY;
      const pullDistance = currentY.current - startY.current;
      
      if (pullDistance > 80 && !isPulling) {
        setIsPulling(true);
      }
    };

    const handleTouchEnd = async () => {
      if (isPulling) {
        await onRefresh();
        setIsPulling(false);
      }
      startY.current = 0;
      currentY.current = 0;
    };

    document.addEventListener('touchstart', handleTouchStart);
    document.addEventListener('touchmove', handleTouchMove);
    document.addEventListener('touchend', handleTouchEnd);

    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isPulling, onRefresh]);

  return { isPulling };
}
