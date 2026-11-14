'use client';

import { useEffect, useState, useRef } from 'react';
import {
  Query,
  onSnapshot,
  QuerySnapshot,
  DocumentData,
  FirestoreError,
} from 'firebase/firestore';

/**
 * Ultra-performant useCollection hook with local caching, instant response, and connection timeout guard.
 */
export function useCollection<T = DocumentData>(query: Query<T> | null) {
  const [data, setData] = useState<T[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const initialLoadDone = useRef(false);

  useEffect(() => {
    if (!query) {
      setData(null);
      setLoading(false);
      return;
    }

    setLoading(true);
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
  }, [query]);

  return { data, loading, error };
}
