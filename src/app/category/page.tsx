'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import CategoryLandingContent from './[categoryName]/client';

function DynamicCategoryView() {
  const searchParams = useSearchParams();
  const [categoryName, setCategoryName] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const q = new URLSearchParams(window.location.search).get('name') || new URLSearchParams(window.location.search).get('category');
      if (q) return q;
      const parts = window.location.pathname.split('/').filter(Boolean);
      const last = parts[parts.length - 1];
      if (last && last !== 'category') return last;
    }
    return 'all';
  });

  useEffect(() => {
    const qName = searchParams?.get('name') || searchParams?.get('category');
    if (qName) {
      setCategoryName(qName);
      return;
    }
    if (typeof window !== 'undefined') {
      const parts = window.location.pathname.split('/').filter(Boolean);
      const last = parts[parts.length - 1];
      if (last && last !== 'category') {
        setCategoryName(last);
      }
    }
  }, [searchParams]);

  return <CategoryLandingContent categoryName={categoryName} />;
}

export default function CategoryFallbackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600" />
      </div>
    }>
      <DynamicCategoryView />
    </Suspense>
  );
}
