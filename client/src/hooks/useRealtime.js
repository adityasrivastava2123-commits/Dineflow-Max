import { useState, useEffect, useCallback, useRef } from 'react';
import { useSocket } from '../context/SocketContext';

/**
 * Keeps data in sync via both polling and socket events.
 * @param {Function} fetchFn - async fetch function
 * @param {string[]} socketEvents - list of socket event names that should trigger refetch
 * @param {Object} options
 */
export function useRealtime(fetchFn, socketEvents = [], options = {}) {
  const { pollInterval = 0, immediate = true } = options;
  const { on } = useSocket();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(immediate);
  const [error, setError] = useState(null);
  const fetchRef = useRef(fetchFn);
  fetchRef.current = fetchFn;

  const refresh = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const result = await fetchRef.current();
      setData(result);
      setError(null);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    if (immediate) refresh();
  }, []);

  // Polling
  useEffect(() => {
    if (!pollInterval) return;
    const id = setInterval(() => refresh(true), pollInterval);
    return () => clearInterval(id);
  }, [pollInterval, refresh]);

  // Socket-driven refetch
  useEffect(() => {
    if (!on || !socketEvents.length) return;
    const cleanups = socketEvents.map((event) =>
      on(event, () => refresh(true))
    );
    return () => cleanups.forEach((off) => off?.());
  }, [socketEvents.join(','), refresh]);

  return { data, loading, error, refresh };
}

export default useRealtime;
