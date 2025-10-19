
import { useQueryClient } from '@tanstack/react-query';
import { useToast } from './use-toast';

interface OptimisticUpdateOptions<T> {
  queryKey: string[];
  updateFn: (oldData: T, newItem: any) => T;
  rollbackFn?: (oldData: T) => T;
}

export function useOptimisticUpdate<T>({
  queryKey,
  updateFn,
  rollbackFn,
}: OptimisticUpdateOptions<T>) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const optimisticUpdate = async (newItem: any, mutation: () => Promise<any>) => {
    // Cancel outgoing refetches
    await queryClient.cancelQueries({ queryKey });

    // Snapshot the previous value
    const previousData = queryClient.getQueryData<T>(queryKey);

    // Optimistically update to the new value
    if (previousData) {
      queryClient.setQueryData<T>(queryKey, updateFn(previousData, newItem));
    }

    try {
      // Perform the mutation
      await mutation();
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey });
    } catch (error) {
      // Rollback on error
      if (previousData && rollbackFn) {
        queryClient.setQueryData<T>(queryKey, rollbackFn(previousData));
      } else if (previousData) {
        queryClient.setQueryData<T>(queryKey, previousData);
      }
      
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error instanceof Error ? error.message : 'An error occurred',
      });
      throw error;
    }
  };

  return { optimisticUpdate };
}
