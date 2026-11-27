'use client';

import { useEffect, useState, useRef } from 'react';
import {
  Query,
  onSnapshot,
  QuerySnapshot,
  DocumentData,
  FirestoreError,
} from 'firebase/firestore';

interface CachedEntry<T> {
  items: T[];
  timestamp: number;
}

const MEMORY_CACHE = new Map<string, CachedEntry<any>>();
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes

function readCache<T>(cacheKey?: string): T[] | null {
  if (!cacheKey) return null;
  const mem = MEMORY_CACHE.get(cacheKey);
  if (mem && Date.now() - mem.timestamp < CACHE_TTL_MS) {
    return mem.items as T[];
  }
  if (typeof window !== 'undefined') {
    try {
      const raw = sessionStorage.getItem(`gas_col_${cacheKey}`);
      if (raw) {
        const parsed = JSON.parse(raw) as CachedEntry<T>;
        if (parsed?.items && Date.now() - parsed.timestamp < CACHE_TTL_MS) {
          MEMORY_CACHE.set(cacheKey, parsed);
          return parsed.items;
        }
      }
    } catch {
      // Ignore storage quota / parse errors
    }
  }
  return null;
}

function writeCache<T>(cacheKey: string | undefined, items: T[]) {
  if (!cacheKey) return;
  const entry: CachedEntry<T> = { items, timestamp: Date.now() };
  MEMORY_CACHE.set(cacheKey, entry);
  if (typeof window !== 'undefined') {
    try {
      sessionStorage.setItem(`gas_col_${cacheKey}`, JSON.stringify(entry));
    } catch {
      // Ignore storage quota errors
    }
  }
}

/**
 * Ultra-performant useCollection hook with Stale-While-Revalidate (SWR) caching,
 * instant response, and connection timeout guard.
 */
export function useCollection<T = DocumentData>(
  query: Query<T> | null,
  cacheKey?: string
) {
  const cachedInitial = cacheKey ? readCache<T>(cacheKey) : null;
  const [data, setData] = useState<T[] | null>(cachedInitial);
  const [loading, setLoading] = useState<boolean>(!cachedInitial);
  const [error, setError] = useState<Error | null>(null);
  const initialLoadDone = useRef(Boolean(cachedInitial));

  useEffect(() => {
    if (!query) {
      setData(null);
      setLoading(false);
      return;
    }

    const cached = cacheKey ? readCache<T>(cacheKey) : null;
    if (cached) {
      setData(cached);
      setLoading(false);
      initialLoadDone.current = true;
    } else {
      setLoading(true);
    }

    let isMounted = true;

    // Safety timeout: If connection takes > 2000ms, unlock loading state to prevent hanging spinners
    const timeoutId = setTimeout(() => {
      if (isMounted && !initialLoadDone.current) {
        setLoading(false);
      }
    }, 2000);

    const unsubscribe = onSnapshot(
      query,
      { includeMetadataChanges: false },
      (snapshot: QuerySnapshot<T>) => {
        clearTimeout(timeoutId);
        initialLoadDone.current = true;
        if (isMounted) {
          const items = snapshot.docs.map((doc) => ({
            ...doc.data(),
            id: doc.id,
          })) as T[];
          writeCache(cacheKey, items);
          setData(items);
          setLoading(false);
          setError(null);
        }
      },
      (err: FirestoreError) => {
        clearTimeout(timeoutId);
        if (isMounted) {
          if (err.code !== 'permission-denied') {
            console.error('Firestore useCollection error:', err);
          }
          setError(err);
          setLoading(false);
        }
      }
    );

    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
      unsubscribe();
    };
  }, [query, cacheKey]);

  return { data, loading, error };
}
