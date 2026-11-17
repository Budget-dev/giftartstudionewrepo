'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import CatalogContent from './[...slug]/client';

function DynamicShopView() {
  const searchParams = useSearchParams();
  const [slug, setSlug] = useState<string[]>(() => {
    if (typeof window !== 'undefined') {
      const parts = window.location.pathname.split('/').filter(Boolean);
      const afterShop = parts.slice(parts.indexOf('shop') + 1);
      if (afterShop.length > 0) return afterShop;
    }
    return ['all'];
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const parts = window.location.pathname.split('/').filter(Boolean);
      const idx = parts.indexOf('shop');
      if (idx !== -1) {
        const afterShop = parts.slice(idx + 1);
        if (afterShop.length > 0) {
          setSlug(afterShop);
          return;
        }
      }
    }
    const cat = searchParams?.get('category');
    const sub = searchParams?.get('subcategory');
    if (cat) {
      setSlug(sub ? [cat, sub] : [cat]);
    }
  }, [searchParams]);

  return <CatalogContent slug={slug} />;
}

export default function ShopFallbackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600" />
      </div>
    }>
      <DynamicShopView />
    </Suspense>
  );
}
