// ui/src/hooks/useFetchData.ts
import { useState, useEffect, useCallback } from 'react';
import { GenericError } from '../api/api-client';

type FetchDataResult<T> = {
  data: T;
  loading: boolean;
  error: Error | GenericError | null;
  refetch: () => void;

  // Backwards compatible API (used in Dashboard.tsx)
  isLoading: boolean;
  reload: () => void;
};

// Overloads for better typing
export default function useFetchData<T>(fetchFunction: () => Promise<T>): FetchDataResult<T | null>;
export default function useFetchData<T>(
  fetchFunction: () => Promise<T>,
  initialValue: T
): FetchDataResult<T>;
export default function useFetchData<T>(
  fetchFunction: () => Promise<T>,
  initialValue: T | null = null
): FetchDataResult<T | null> {
  const [data, setData] = useState<T | null>(initialValue);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | GenericError | null>(null);
  const [reloadCount, setReloadCount] = useState<number>(0);

  useEffect(() => {
    let isMounted = true;

    const fetchData = async () => {
      if (isMounted) {
        setLoading(true);
        setError(null);
      }

      try {
        const result = await fetchFunction();
        if (isMounted) {
          setData(result);
        }
      } catch (e: any) {
        if (isMounted) {
          // Keep previous data (initial value) on error
          setError(e);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchData();

    return () => {
      isMounted = false;
    };
  }, [fetchFunction, reloadCount]);

  const refetch = useCallback(() => {
    setReloadCount((prev) => prev + 1);
  }, []);

  // Backwards compatible alias
  const reload = refetch;

  return { data, loading, error, refetch, isLoading: loading, reload };
}
