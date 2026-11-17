'use client';

import { useEffect, useState, useRef } from 'react';
import {
  DocumentReference,
  onSnapshot,
  DocumentSnapshot,
  DocumentData,
  FirestoreError,
  getDocFromCache,
} from 'firebase/firestore';

/**
 * Ultra-performant useDoc hook with local caching, instant response, and connection timeout guard.
 */
export function useDoc<T = DocumentData>(
  ref: DocumentReference<T> | null,
  initialData?: T | null
) {
  const [data, setData] = useState<T | null>(() => initialData ?? null);
  const [loading, setLoading] = useState(() => !initialData);
  const [error, setError] = useState<Error | null>(null);
  const initialLoadDone = useRef(Boolean(initialData));

  // Sync initialData if provided
  useEffect(() => {
    if (initialData && !data) {
      setData(initialData);
      setLoading(false);
      initialLoadDone.current = true;
    }
  }, [initialData, data]);

  useEffect(() => {
    if (!ref) {
      setData(null);
      setLoading(false);
      return;
    }

    if (!initialLoadDone.current) {
      setLoading(true);
    }
    let isMounted = true;

    // Fast-path: Check IndexedDB local cache immediately (resolves in ~3ms)
    if (!initialLoadDone.current) {
      getDocFromCache(ref)
        .then((cacheSnap) => {
          if (isMounted && cacheSnap.exists() && !initialLoadDone.current) {
            initialLoadDone.current = true;
            setData({ ...cacheSnap.data(), id: cacheSnap.id } as T);
            setLoading(false);
          }
        })
        .catch(() => {
          // Cache miss, onSnapshot will load from server
        });
    }

    // Safety timeout: If connection takes > 2000ms, unlock loading state to prevent hanging spinners
    const timeoutId = setTimeout(() => {
      if (isMounted && !initialLoadDone.current) {
        setLoading(false);
      }
    }, 2000);

    const unsubscribe = onSnapshot(
      ref,
      { includeMetadataChanges: false },
      (snapshot: DocumentSnapshot<T>) => {
        clearTimeout(timeoutId);
        initialLoadDone.current = true;
        if (isMounted) {
          setData(snapshot.exists() ? { ...snapshot.data(), id: snapshot.id } : null);
          setLoading(false);
          setError(null);
        }
      },
      (err: FirestoreError) => {
        clearTimeout(timeoutId);
        if (isMounted) {
          if (err.code !== 'permission-denied') {
            console.error(`Firestore useDoc error [${ref.path}]:`, err);
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
  }, [ref?.path]);

  return { data, loading, error };
}
