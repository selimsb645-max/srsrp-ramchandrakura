import { useEffect, useState } from 'react';
import type { ListResult } from '@/services/publicData';

/** Small helper that runs a list loader once and exposes loading / error states. */
export function useAsyncList<T>(loader: () => Promise<ListResult<T>>, deps: unknown[] = []) {
  const [state, setState] = useState<{ data: T[]; loading: boolean; configured: boolean; error: string | null }>({
    data: [],
    loading: true,
    configured: true,
    error: null,
  });

  useEffect(() => {
    let alive = true;
    setState((prev) => ({ ...prev, loading: true }));
    loader()
      .then((result) => {
        if (!alive) return;
        setState({ data: result.data, loading: false, configured: result.configured, error: result.error });
      })
      .catch((error: Error) => {
        if (!alive) return;
        setState({ data: [], loading: false, configured: true, error: error.message });
      });
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return state;
}
