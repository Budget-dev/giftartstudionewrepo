'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import ProductClient from './[id]/product-client';

function DynamicProductView() {
  const searchParams = useSearchParams();
  const [targetId, setTargetId] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const q = new URLSearchParams(window.location.search).get('id');
      if (q) return q;
      const parts = window.location.pathname.split('/').filter(Boolean);
      const last = parts[parts.length - 1];
      if (last && last !== 'product') return last;
    }
    return '';
  });

  useEffect(() => {
    const qId = searchParams?.get('id');
    if (qId) {
      setTargetId(qId);
      return;
    }
    if (typeof window !== 'undefined') {
      const parts = window.location.pathname.split('/').filter(Boolean);
      const last = parts[parts.length - 1];
      if (last && last !== 'product') {
        setTargetId(last);
      }
    }
  }, [searchParams]);

  if (!targetId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600" />
      </div>
    );
  }

  return <ProductClient id={targetId} />;
}

export default function ProductFallbackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600" />
      </div>
    }>
      <DynamicProductView />
    </Suspense>
  );
}
