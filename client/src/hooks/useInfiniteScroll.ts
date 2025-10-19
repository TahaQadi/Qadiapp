
import { useInfiniteQuery } from '@tanstack/react-query';
import { useCallback, useRef, useEffect } from 'react';

interface UseInfiniteScrollOptions<T> {
  queryKey: string[];
  fetchFn: (pageParam: number) => Promise<{ data: T[]; nextPage: number | null }>;
  pageSize?: number;
  enabled?: boolean;
}

export function useInfiniteScroll<T>({
  queryKey,
  fetchFn,
  pageSize = 50,
  enabled = true,
}: UseInfiniteScrollOptions<T>) {
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    error,
  } = useInfiniteQuery({
    queryKey,
    queryFn: ({ pageParam = 1 }) => fetchFn(pageParam),
    getNextPageParam: (lastPage) => lastPage.nextPage,
    initialPageParam: 1,
    enabled,
  });

  const handleObserver = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const [target] = entries;
      if (target.isIntersecting && hasNextPage && !isFetchingNextPage) {
        fetchNextPage();
      }
    },
    [fetchNextPage, hasNextPage, isFetchingNextPage]
  );

  useEffect(() => {
    const element = loadMoreRef.current;
    if (!element) return;

    observerRef.current = new IntersectionObserver(handleObserver, {
      threshold: 0.1,
    });

    observerRef.current.observe(element);

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [handleObserver]);

  const allItems = data?.pages.flatMap((page) => page.data) ?? [];

  return {
    items: allItems,
    loadMoreRef,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    error,
    fetchNextPage,
  };
}
