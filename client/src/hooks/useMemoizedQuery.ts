
import { useQuery, QueryKey, UseQueryOptions } from '@tanstack/react-query';
import { useMemo } from 'react';

export function useMemoizedQuery<
  TQueryFnData = unknown,
  TError = unknown,
  TData = TQueryFnData
>(
  queryKey: QueryKey,
  options?: Omit<
    UseQueryOptions<TQueryFnData, TError, TData, QueryKey>,
    'queryKey'
  >
) {
  const memoizedOptions = useMemo(() => options, [JSON.stringify(options)]);
  
  return useQuery({
    queryKey,
    ...memoizedOptions,
  });
}
