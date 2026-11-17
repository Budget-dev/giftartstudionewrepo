'use client';

import { useMemo, useEffect } from 'react';
import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';
import { KidsDecor } from '@/components/kids-decor';
import { ProductCard } from '@/components/product-card';
import { Sparkles, Star, TrendingUp, Gem, Tag, Leaf, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useCollection, useFirestore } from '@/firebase';
import { collection, query, where, limit } from 'firebase/firestore';
import { CategoryGrid } from '@/components/home/category-grid';
import { cacheProducts } from '@/lib/product-cache';

const COLLECTIONS = [
  { name: 'Best Sellers', icon: Star, color: 'text-amber-500', bg: 'bg-amber-50' },
  { name: 'New Arrivals', icon: Sparkles, color: 'text-sky-500', bg: 'bg-sky-50' },
  { name: 'Trending', icon: TrendingUp, color: 'text-rose-500', bg: 'bg-rose-50' },
  { name: 'Premium', icon: Gem, color: 'text-indigo-500', bg: 'bg-indigo-50' },
  { name: 'Budget Gifts', icon: Tag, color: 'text-emerald-500', bg: 'bg-emerald-50' },
  { name: 'Eco-Friendly', icon: Leaf, color: 'text-green-500', bg: 'bg-green-50' },
];

export default function CollectionsPage() {
  const db = useFirestore();
  
  const bestSellersQuery = useMemo(() => {
    if (!db) return null;
    return query(collection(db, 'products'), where('isBestSeller', '==', true), limit(8));
  }, [db]);

  const newArrivalsQuery = useMemo(() => {
    if (!db) return null;
    return query(collection(db, 'products'), where('isNew', '==', true), limit(8));
  }, [db]);

  const allProductsQuery = useMemo(() => {
    if (!db) return null;
    return query(collection(db, 'products'), limit(8));
  }, [db]);
  
  const { data: bestSellers, loading: bestLoading } = useCollection<any>(bestSellersQuery);
  const { data: newArrivals, loading: newLoading } = useCollection<any>(newArrivalsQuery);
  const { data: allProducts, loading: allLoading } = useCollection<any>(allProductsQuery);

  const displayBestSellers = useMemo(() => {
    if (bestSellers && bestSellers.length > 0) return bestSellers;
    return allProducts?.slice(0, 4) || [];
  }, [bestSellers, allProducts]);

  const displayNewArrivals = useMemo(() => {
    if (newArrivals && newArrivals.length > 0) return newArrivals;
    return allProducts?.slice(2, 6) || allProducts?.slice(0, 4) || [];
  }, [newArrivals, allProducts]);

  useEffect(() => {
    if (displayBestSellers && displayBestSellers.length > 0) {
      cacheProducts(displayBestSellers);
    }
    if (displayNewArrivals && displayNewArrivals.length > 0) {
      cacheProducts(displayNewArrivals);
    }
  }, [displayBestSellers, displayNewArrivals]);

  return (
    <main className="min-h-screen bg-white relative overflow-x-hidden">
      <Navbar />
      <KidsDecor />
      
      <div className="pt-28 lg:pt-36">
        <div className="container mx-auto px-4 py-8 text-center flex flex-col items-center border-b border-slate-50">
          <h1 className="text-3xl md:text-5xl font-headline font-black tracking-tight text-slate-800 uppercase">
            Store Collections
          </h1>
          <p className="text-[10px] md:text-xs font-bold text-slate-400 mt-2 uppercase tracking-widest italic opacity-80">
            Handpicked sets designed to bring joy and wonder to every occasion.
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="mb-12">
          <CategoryGrid />
        </div>

        <div className="space-y-20">
          <section>
            <div className="flex items-center justify-between mb-8 border-b border-slate-50 pb-4">
              <h2 className="text-xl font-headline font-black text-slate-800 flex items-center gap-3 uppercase tracking-tight">
                <Star className="h-5 w-5 text-amber-400 fill-amber-400" /> Best Sellers
              </h2>
              <Link href="/shop/new/best-sellers" className="text-[10px] font-black text-sky-600 uppercase tracking-widest hover:underline">View All</Link>
            </div>
            {bestLoading ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 animate-pulse">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="space-y-3">
                    <div className="aspect-square rounded-2xl bg-slate-100" />
                    <div className="h-4 w-3/4 rounded-lg bg-slate-100" />
                    <div className="h-4 w-1/2 rounded-lg bg-slate-100" />
                  </div>
                ))}
              </div>
            ) : displayBestSellers && displayBestSellers.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {displayBestSellers.map((product: any) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            ) : (
              <p className="py-12 text-center text-slate-300 font-bold text-xs uppercase tracking-widest">No best sellers curated yet.</p>
            )}
          </section>

          <section>
            <div className="flex items-center justify-between mb-8 border-b border-slate-50 pb-4">
              <h2 className="text-xl font-headline font-black text-slate-800 flex items-center gap-3 uppercase tracking-tight">
                <Sparkles className="h-5 w-5 text-sky-400 fill-sky-400" /> New Arrivals
              </h2>
              <Link href="/shop/new/new-collection" className="text-[10px] font-black text-sky-600 uppercase tracking-widest hover:underline">View All</Link>
            </div>
            {newLoading && allLoading ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 animate-pulse">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="space-y-3">
                    <div className="aspect-square rounded-2xl bg-slate-100" />
                    <div className="h-4 w-3/4 rounded-lg bg-slate-100" />
                    <div className="h-4 w-1/2 rounded-lg bg-slate-100" />
                  </div>
                ))}
              </div>
            ) : displayNewArrivals && displayNewArrivals.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {displayNewArrivals.map((product: any) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            ) : (
              <p className="py-12 text-center text-slate-300 font-bold text-xs uppercase tracking-widest">Fresh magic coming soon.</p>
            )}
          </section>
        </div>
      </div>

      <Footer />
    </main>
  );
}
