
import { useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
  snapPoints?: number[];
  defaultSnap?: number;
}

export function BottomSheet({
  isOpen,
  onClose,
  children,
  title,
  snapPoints = [0.3, 0.6, 0.9],
  defaultSnap = 1,
}: BottomSheetProps) {
  const sheetRef = useRef<HTMLDivElement>(null);
  const [snapIndex, setSnapIndex] = useState(defaultSnap);
  const [startY, setStartY] = useState(0);
  const [currentY, setCurrentY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  const currentSnapPoint = snapPoints[snapIndex] || 0.6;
  const height = isDragging
    ? Math.max(0, Math.min(100, currentSnapPoint * 100 - ((currentY - startY) / window.innerHeight) * 100))
    : currentSnapPoint * 100;

  useEffect(() => {
    if (!isOpen) {
      setSnapIndex(defaultSnap);
    }
  }, [isOpen, defaultSnap]);

  useEffect(() => {
    const sheet = sheetRef.current;
    if (!sheet) return;

    const handleTouchStart = (e: TouchEvent) => {
      if ((e.target as HTMLElement).closest('[data-sheet-handle]')) {
        setStartY(e.touches[0].clientY);
        setCurrentY(e.touches[0].clientY);
        setIsDragging(true);
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isDragging) return;
      setCurrentY(e.touches[0].clientY);
    };

    const handleTouchEnd = () => {
      if (!isDragging) return;

      const deltaY = currentY - startY;
      const deltaPercent = (deltaY / window.innerHeight) * 100;

      // Determine closest snap point
      const currentHeight = currentSnapPoint * 100 - deltaPercent;
      const targetSnapHeights = snapPoints.map(sp => sp * 100);
      
      let closestIndex = 0;
      let minDiff = Infinity;

      targetSnapHeights.forEach((snapHeight, index) => {
        const diff = Math.abs(currentHeight - snapHeight);
        if (diff < minDiff) {
          minDiff = diff;
          closestIndex = index;
        }
      });

      // If dragged down significantly, close the sheet
      if (deltaY > 100 && currentHeight < snapPoints[0] * 100) {
        onClose();
      } else {
        setSnapIndex(closestIndex);
      }

      setIsDragging(false);
      setStartY(0);
      setCurrentY(0);
    };

    sheet.addEventListener('touchstart', handleTouchStart);
    sheet.addEventListener('touchmove', handleTouchMove);
    sheet.addEventListener('touchend', handleTouchEnd);

    return () => {
      sheet.removeEventListener('touchstart', handleTouchStart);
      sheet.removeEventListener('touchmove', handleTouchMove);
      sheet.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isDragging, startY, currentY, snapIndex, snapPoints, currentSnapPoint, onClose]);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className={cn(
          'fixed inset-0 bg-black/50 z-50 transition-opacity',
          isOpen ? 'opacity-100' : 'opacity-0'
        )}
        onClick={onClose}
      />

      {/* Bottom Sheet */}
      <div
        ref={sheetRef}
        className="fixed bottom-0 left-0 right-0 bg-background rounded-t-3xl shadow-xl z-50 flex flex-col"
        style={{
          height: `${height}vh`,
          transition: isDragging ? 'none' : 'height 0.3s ease-out',
        }}
      >
        {/* Handle */}
        <div
          data-sheet-handle
          className="flex flex-col items-center pt-3 pb-2 cursor-grab active:cursor-grabbing"
        >
          <div className="w-12 h-1.5 bg-muted rounded-full mb-3" />
          {title && (
            <div className="flex items-center justify-between w-full px-4 pb-2">
              <h3 className="text-lg font-semibold">{title}</h3>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={onClose}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto px-4 pb-4">
          {children}
        </div>
      </div>
    </>
  );
}
