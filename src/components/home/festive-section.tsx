"use client";

import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useFirestore, useCollection } from '@/firebase';
import { collection, query, where, limit, orderBy } from 'firebase/firestore';
import { useMemo, useEffect, useState } from 'react';
import { cacheProduct, cacheProducts } from '@/lib/product-cache';
import { getOptimizedImageUrl, getImageTransformStyle } from '@/lib/image-optimizer';

interface FestiveSectionProps {
  cms?: {
    title?: string;
    bannerUrl?: string;
  };
}

const DEFAULT_SEASONAL_BANNERS = [
  {
    id: 'default-seasonal',
    imageUrl: "https://res.cloudinary.com/dwgnnr10/image/upload/v1785341862/festive-section-image-_zy2mxi.png",
    title: "Celebration Gifts Collection",
    linkUrl: "/shop/new/festive",
  }
];

export function FestiveSection({ cms }: FestiveSectionProps) {
  const db = useFirestore();
  const [bannerIdx, setBannerIdx] = useState(0);

  const festiveQuery = useMemo(() => {
    if (!db) return null;
    return query(
      collection(db, 'products'),
      where('category', '==', 'new'),
      where('subcategory', '==', 'festive'),
      limit(3)
    );
  }, [db]);

  const bannersQuery = useMemo(() => {
    if (!db) return null;
    return query(collection(db, 'banners'), orderBy('order', 'asc'));
  }, [db]);

  const { data: products, loading } = useCollection<any>(festiveQuery, 'home_festive');
  const { data: rawBanners } = useCollection<any>(bannersQuery, 'home_banners');

  const seasonalBanners = useMemo(() => {
    if (rawBanners && rawBanners.length > 0) {
      const list = rawBanners
        .filter((b) => b.placement === 'seasonal' && b.active !== false && (b.imageUrl || b.mobileImageUrl))
        .sort((a, b) => (Number(a.order) || 0) - (Number(b.order) || 0));
      if (list.length > 0) return list;
    }
    if (cms?.bannerUrl) {
      return [{ id: 'cms-seasonal', imageUrl: cms.bannerUrl, title: cms.title }];
    }
    return DEFAULT_SEASONAL_BANNERS;
  }, [rawBanners, cms]);

  useEffect(() => {
    if (bannerIdx >= seasonalBanners.length) setBannerIdx(0);
  }, [seasonalBanners.length, bannerIdx]);

  useEffect(() => {
    if (seasonalBanners.length <= 1) return;
    const t = setInterval(() => {
      setBannerIdx((prev) => (prev + 1) % seasonalBanners.length);
    }, 5000);
    return () => clearInterval(t);
  }, [seasonalBanners.length]);

  useEffect(() => {
    if (products && products.length > 0) {
      cacheProducts(products);
    }
  }, [products]);

  const currentBanner = seasonalBanners[bannerIdx] || seasonalBanners[0];
  const sectionTitle = currentBanner.title || cms?.title || "Celebration Gifts Collection";

  return (
    <section className="hidden md:block bg-white py-12 overflow-hidden relative">
      <div className="container mx-auto px-4 mb-10 text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-amber-50 text-amber-600 rounded-full font-black text-[10px] uppercase tracking-[0.2em] border border-amber-100">
          <Sparkles className="h-3.5 w-3.5" />
          <span>Seasonal &amp; Sale Specials</span>
        </div>
        <h2 className="text-5xl md:text-7xl font-headline font-black text-slate-800 tracking-tight leading-tight">
          {sectionTitle}
        </h2>
      </div>

      {/* Auto-Rotating Seasonal / Festival Sale Banner */}
      <div className="relative w-full h-[540px] lg:h-[600px] overflow-hidden bg-amber-50 group/seasonal">
        <AnimatePresence initial={false} mode="wait">
          <motion.div
            key={`seasonal-${currentBanner.id || bannerIdx}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.65 }}
            className="absolute inset-0 overflow-hidden"
          >
            <img
              src={getOptimizedImageUrl(currentBanner.imageUrl, 1440, 82)}
              alt={sectionTitle}
              loading="lazy"
              style={getImageTransformStyle((currentBanner as any).desktopTransform)}
              className="w-full h-full object-cover object-top"
            />
          </motion.div>
        </AnimatePresence>

        {currentBanner.linkUrl && (
          <Link href={currentBanner.linkUrl} className="absolute inset-0 z-10" aria-label={sectionTitle} />
        )}

        {seasonalBanners.length > 1 && (
          <>
            <button
              type="button"
              onClick={() => setBannerIdx((prev) => (prev - 1 + seasonalBanners.length) % seasonalBanners.length)}
              className="absolute left-5 top-1/2 -translate-y-1/2 z-30 w-11 h-11 rounded-full bg-white/85 hover:bg-white text-slate-800 shadow-lg flex items-center justify-center opacity-0 group-hover/seasonal:opacity-100 transition-opacity"
              aria-label="Previous Seasonal Banner"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={() => setBannerIdx((prev) => (prev + 1) % seasonalBanners.length)}
              className="absolute right-5 top-1/2 -translate-y-1/2 z-30 w-11 h-11 rounded-full bg-white/85 hover:bg-white text-slate-800 shadow-lg flex items-center justify-center opacity-0 group-hover/seasonal:opacity-100 transition-opacity"
              aria-label="Next Seasonal Banner"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </>
        )}
      </div>

      {/* Overlapping Fixed 1:1 Edge-to-Edge Product Cards */}
      <div className="container mx-auto px-4 max-w-7xl relative">
        <div className="relative -mt-16 z-20 flex flex-col md:flex-row items-stretch justify-center gap-8 lg:gap-12 max-w-6xl mx-auto">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12 w-full max-w-6xl mx-auto">
              {[0, 1, 2].map((idx) => (
                <div key={idx} className="w-full bg-white rounded-[2.5rem] shadow-2xl overflow-hidden animate-pulse">
                  <div className="aspect-square w-full bg-amber-100" />
                  <div className="p-6 space-y-3">
                    <div className="h-4 w-3/4 mx-auto bg-amber-100 rounded-full" />
                  </div>
                </div>
              ))}
            </div>
          ) : products && products.length > 0 ? (
            products.map((p: any, i: number) => (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                whileHover={{ y: -15 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.6, type: 'spring' }}
                className="w-full md:flex-1 bg-[#EA580C] rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col group cursor-pointer"
              >
                <Link
                  href={`/product?id=${p.id}`}
                  as={`/product/${p.id}`}
                  prefetch={false}
                  onMouseEnter={() => cacheProduct(p)}
                  onTouchStart={() => cacheProduct(p)}
                  className="flex flex-col h-full"
                >
                  {/* 1:1 Fixed Square Edge-to-Edge Image */}
                  <div className="relative aspect-square w-full overflow-hidden">
                    <img
                      src={getOptimizedImageUrl(p.image, 600, 82)}
                      alt={p.name}
                      loading="lazy"
                      style={getImageTransformStyle(p.imageTransform)}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                  </div>

                  <div className="p-8 pt-7 pb-10 flex-1 flex flex-col items-center text-center space-y-6">
                    <h3 className="font-black text-white text-base lg:text-[17px] leading-snug tracking-tight line-clamp-2 min-h-[3rem]">
                      {p.name}
                    </h3>
                    <div className="flex items-center justify-center w-32 h-7 md:h-9 bg-[#FF69B4] rounded-full shadow-lg shadow-black/5 opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-300 text-white font-black text-[10px] md:text-[12px] uppercase tracking-widest">
                      BUY NOW
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))
          ) : (
            <div className="w-full py-16 text-center bg-white/80 backdrop-blur-md rounded-[3rem] border-4 border-dashed border-amber-100">
              <p className="text-amber-600 font-black uppercase tracking-widest text-xs italic">Magical festive collection arriving soon...</p>
            </div>
          )}
        </div>
      </div>

      <div className="mt-16 text-center">
        <Button asChild variant="outline" className="rounded-full border-2 border-slate-100 text-slate-400 hover:text-sky-600 hover:bg-sky-50 px-12 h-16 font-black uppercase text-xs tracking-widest gap-3 transition-all">
          <Link href="/shop/new/festive">View Entire Collection <ArrowRight className="h-4 w-4" /></Link>
        </Button>
      </div>
    </section>
  );
}
