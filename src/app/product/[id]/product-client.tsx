'use client';

import { useMemo, useEffect, useState } from 'react';
import ReactDOM from 'react-dom';
import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';
import { KidsDecor } from '@/components/kids-decor';
import { ProductDetails } from '@/components/shop/product-details';
import { RelatedProducts } from '@/components/shop/related-products';
import { useDoc, useFirestore } from '@/firebase';
import { doc } from 'firebase/firestore';
import { AlertCircle, ShoppingBag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { getCachedProduct, cacheProduct } from '@/lib/product-cache';
import { getOptimizedImageUrl } from '@/lib/image-optimizer';

function ProductDetailsSkeleton() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 md:py-6 animate-pulse">
      <div className="grid lg:grid-cols-12 gap-8 lg:gap-14 items-start">
        <div className="lg:col-span-6 space-y-4">
          <div className="aspect-square rounded-3xl bg-slate-100 border border-slate-200/60" />
          <div className="flex gap-2.5">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="w-16 h-16 rounded-xl bg-slate-100" />
            ))}
          </div>
        </div>
        <div className="lg:col-span-6 space-y-5">
          <div className="w-36 h-6 rounded-full bg-purple-100" />
          <div className="w-4/5 h-10 rounded-xl bg-slate-100" />
          <div className="w-full h-12 rounded-xl bg-slate-50" />
          <div className="w-44 h-8 rounded-xl bg-slate-100" />
          <div className="w-full h-32 rounded-2xl bg-purple-50/50 border border-purple-100" />
          <div className="grid grid-cols-2 gap-4">
            <div className="h-14 rounded-xl bg-slate-100" />
            <div className="h-14 rounded-xl bg-slate-100" />
          </div>
          <div className="w-full h-14 rounded-xl bg-purple-100" />
        </div>
      </div>
    </div>
  );
}

export default function ProductClient({ id }: { id: string }) {
  const db = useFirestore();
  const [showRelated, setShowRelated] = useState(false);
  
  const cachedProduct = useMemo(() => getCachedProduct(id), [id]);
  const productRef = useMemo(() => db ? doc(db, 'products', id) : null, [db, id]);
  const { data: product, loading } = useDoc<any>(productRef, cachedProduct);

  const heroImage = product?.image || cachedProduct?.image;
  if (heroImage && typeof ReactDOM.preload === 'function') {
    ReactDOM.preload(getOptimizedImageUrl(heroImage, 900), { as: 'image' });
  }

  useEffect(() => {
    if (product) {
      cacheProduct(product);
    }
  }, [product]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowRelated(true);
    }, 120);
    return () => clearTimeout(timer);
  }, []);

  return (
    <main className="min-h-screen bg-white relative overflow-x-hidden">
      <Navbar />
      <KidsDecor />

      <div className="pt-20 md:pt-28 lg:pt-32 pb-8 md:pb-16 relative z-10">
        {loading ? (
          <ProductDetailsSkeleton />
        ) : product ? (
          <>
            <ProductDetails product={product} />
            {showRelated && (
              <div className="mt-4 md:mt-8">
                <RelatedProducts currentProductId={product.id} category={product.category} />
              </div>
            )}
          </>
        ) : (
          <div className="h-[60vh] flex flex-col items-center justify-center space-y-6 text-center px-6">
            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center text-slate-200">
               <AlertCircle className="h-10 w-10 text-slate-300" />
            </div>
            <div className="space-y-2">
               <h2 className="text-3xl font-headline font-black text-slate-800 uppercase tracking-tight">Product Not Found</h2>
               <p className="text-slate-400 font-medium max-w-xs mx-auto">This treasure seems to have vanished from our studio.</p>
            </div>
            <Button asChild className="rounded-full bg-[#5f259f] hover:bg-[#4a1b7e] text-white px-10 h-14 font-black uppercase text-xs tracking-wider">
               <Link href="/collections" className="flex items-center gap-2"><ShoppingBag className="h-5 w-5" /> Shop Other Gifts</Link>
            </Button>
          </div>
        )}
      </div>

      <Footer />
    </main>
  );
}
