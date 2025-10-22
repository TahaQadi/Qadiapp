import { useEffect, useRef } from 'react';

interface SwipeHandlers {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
}

export function useSwipeGesture(
  handlers: SwipeHandlers,
  threshold = 50,
  velocityThreshold = 0.3
) {
  const touchStart = useRef<{ x: number; y: number; time: number } | null>(null);

  const triggerHaptic = () => {
    if ('vibrate' in navigator) {
      navigator.vibrate(10);
    }
  };

  const handleTouchStart = (e: TouchEvent) => {
    const touch = e.touches[0];
    touchStart.current = {
      x: touch.clientX,
      y: touch.clientY,
      time: Date.now(),
    };
  };

  const handleTouchEnd = (e: TouchEvent) => {
    if (!touchStart.current) return;

    const touch = e.changedTouches[0];
    const deltaX = touch.clientX - touchStart.current.x;
    const deltaY = touch.clientY - touchStart.current.y;
    const deltaTime = Date.now() - touchStart.current.time;
    const velocity = Math.abs(deltaX) / deltaTime;

    // Only trigger swipe if horizontal movement is greater than vertical
    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      const exceedsThreshold = Math.abs(deltaX) > threshold;
      const exceedsVelocity = velocity > velocityThreshold;

      if ((exceedsThreshold || exceedsVelocity) && deltaX > 0 && handlers.onSwipeRight) {
        triggerHaptic();
        handlers.onSwipeRight();
      } else if ((exceedsThreshold || exceedsVelocity) && deltaX < 0 && handlers.onSwipeLeft) {
        triggerHaptic();
        handlers.onSwipeLeft();
      }
    } else if (Math.abs(deltaY) > threshold && Math.abs(deltaY) > Math.abs(deltaX)) {
      // Vertical swipe logic (optional, can be added similarly if needed)
      if (deltaY > 0 && handlers.onSwipeDown) {
        // triggerHaptic(); // Uncomment if haptic feedback is desired for vertical swipes
        // handlers.onSwipeDown();
      } else if (deltaY < 0 && handlers.onSwipeUp) {
        // triggerHaptic(); // Uncomment if haptic feedback is desired for vertical swipes
        // handlers.onSwipeUp();
      }
    }

    touchStart.current = null;
  };

  useEffect(() => {
    document.addEventListener('touchstart', handleTouchStart);
    document.addEventListener('touchend', handleTouchEnd);

    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [handlers, threshold, velocityThreshold]); // Added velocityThreshold to dependencies
}