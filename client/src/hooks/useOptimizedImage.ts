
import { useState, useEffect } from 'react';

interface UseOptimizedImageOptions {
  src: string;
  width?: number;
  quality?: number;
}

export function useOptimizedImage({ src, width, quality = 85 }: UseOptimizedImageOptions) {
  const [imageSrc, setImageSrc] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!src) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    // Create optimized image URL
    const url = new URL(src, window.location.origin);
    if (width) url.searchParams.set('w', width.toString());
    url.searchParams.set('q', quality.toString());
    url.searchParams.set('fm', 'webp');

    const img = new Image();
    img.src = url.toString();

    img.onload = () => {
      setImageSrc(url.toString());
      setIsLoading(false);
    };

    img.onerror = () => {
      // Fallback to original image
      setImageSrc(src);
      setIsLoading(false);
      setError(new Error('Failed to load optimized image'));
    };

    return () => {
      img.onload = null;
      img.onerror = null;
    };
  }, [src, width, quality]);

  return { imageSrc, isLoading, error };
}
