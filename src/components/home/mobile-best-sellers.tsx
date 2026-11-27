'use client';

import React, { useCallback, useEffect, useState, useMemo } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useFirestore, useCollection } from '@/firebase';
import { collection, query, where, limit, orderBy } from 'firebase/firestore';
import { cacheProduct, cacheProducts } from '@/lib/product-cache';
import { getOptimizedImageUrl, getImageTransformStyle } from '@/lib/image-optimizer';

interface MobileBestSellersProps {
  cms?: any;
}

const DEFAULT_COLLECTION_BANNERS = [
  {
    id: 'default-boys-girls-mobile',
    imageUrl: "https://res.cloudinary.com/drjrbb4yn/image/upload/v1782027359/kids-image_pn17nh.png",
    mobileImageUrl: "https://res.cloudinary.com/drjrbb4yn/image/upload/v1782027359/kids-image_pn17nh.png",
    title: "Best Sellers",
  }
];

export function MobileBestSellers({ cms }: MobileBestSellersProps) {
  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: true,
    align: 'start',
    skipSnaps: false
  });

  const [selectedIndex, setSelectedIndex] = useState(0);
  const [scrollSnaps, setScrollSnaps] = useState<number[]>([]);
  const [bannerIdx, setBannerIdx] = useState(0);

  const db = useFirestore();

  const bestSellersQuery = useMemo(() => {
    if (!db) return null;
    return query(
      collection(db, 'products'),
      where('isBestSeller', '==', true),
      limit(9)
    );
  }, [db]);

  const bannersQuery = useMemo(() => {
    if (!db) return null;
    return query(collection(db, 'banners'), orderBy('order', 'asc'));
  }, [db]);

  const { data: products, loading } = useCollection<any>(bestSellersQuery, 'home_best_sellers_mobile');
  const { data: rawBanners } = useCollection<any>(bannersQuery, 'home_banners');

  const collectionBanners = useMemo(() => {
    if (rawBanners && rawBanners.length > 0) {
      const list = rawBanners
        .filter((b) => b.placement === 'collection' && b.active !== false && (b.mobileImageUrl || b.imageUrl))
        .sort((a, b) => (Number(a.order) || 0) - (Number(b.order) || 0));
      if (list.length > 0) return list;
    }
    return DEFAULT_COLLECTION_BANNERS;
  }, [rawBanners]);

  useEffect(() => {
    if (collectionBanners.length <= 1) return;
    const t = setInterval(() => {
      setBannerIdx((prev) => (prev + 1) % collectionBanners.length);
    }, 5000);
    return () => clearInterval(t);
  }, [collectionBanners.length]);

  useEffect(() => {
    if (products?.length) {
      cacheProducts(products);
    }
  }, [products]);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    setScrollSnaps(emblaApi.scrollSnapList());
    emblaApi.on('select', onSelect);
    emblaApi.on('reInit', onSelect);

    const autoScroll = setInterval(() => {
      emblaApi.scrollNext();
    }, 5000);

    return () => clearInterval(autoScroll);
  }, [emblaApi, onSelect]);

  const slides = useMemo(() => {
    const s = [];
    if (products) {
      for (let i = 0; i < products.length; i += 3) {
        s.push(products.slice(i, i + 3));
      }
    }
    return s;
  }, [products]);

  const currentBanner = collectionBanners[bannerIdx % collectionBanners.length] || collectionBanners[0];

  return (
    <section className="md:hidden px-4 py-6">
      <div className="bg-[#FFF0F7] rounded-[32px] p-5 shadow-sm overflow-hidden flex flex-col gap-5">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-xl font-black text-[#FF6B95] tracking-tight uppercase">
            {currentBanner?.title || cms?.title || "Best Sellers"}
          </h2>
          <Link href="/shop/new/best-sellers" className="text-[10px] font-black text-[#FF6B95] uppercase tracking-widest opacity-80">
            View All
          </Link>
        </div>

        {loading ? (
          <div className="relative pb-[120px] animate-pulse">
            <div className="relative w-full aspect-[1.6/1] rounded-[24px] bg-gradient-to-br from-pink-200 to-amber-100" />
            <div className="absolute bottom-0 left-0 right-0 z-20 px-2 grid grid-cols-3 gap-2">
              {[0, 1, 2].map((idx) => (
                <div key={idx} className="bg-white rounded-[14px] overflow-hidden shadow-md space-y-2">
                  <div className="aspect-square w-full bg-pink-50" />
                  <div className="p-2 space-y-1">
                    <div className="h-2.5 w-3/4 bg-pink-100 rounded-full" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : products && products.length > 0 ? (
          <div className="relative pb-[120px]">
            {/* Auto-Rotating Boys & Girls Collection Banner */}
            <div className="relative w-full aspect-[1.6/1] rounded-[24px] overflow-hidden shadow-inner bg-pink-100">
              <AnimatePresence initial={false} mode="wait">
                <motion.div
                  key={`mcol-${currentBanner.id || bannerIdx}`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.5 }}
                  className="absolute inset-0 overflow-hidden"
                >
                  <img
                    src={getOptimizedImageUrl(currentBanner.mobileImageUrl || currentBanner.imageUrl, 800, 82)}
                    alt={currentBanner.title || "Best Sellers"}
                    loading="lazy"
                    style={getImageTransformStyle((currentBanner as any).mobileTransform || (currentBanner as any).desktopTransform)}
                    className="w-full h-full object-cover object-top"
                  />
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Overlapping Fixed 1:1 Edge-to-Edge Product Cards */}
            <div className="absolute bottom-0 left-0 right-0 z-20 px-1" ref={emblaRef}>
              <div className="flex">
                {slides.map((group, groupIdx) => (
                  <div key={groupIdx} className="flex-[0_0_100%] min-w-0 grid grid-cols-3 gap-2">
                    {group.map((p: any) => (
                      <Link
                        key={p.id}
                        href={`/product?id=${p.id}`}
                        as={`/product/${p.id}`}
                        prefetch={false}
                        onMouseEnter={() => cacheProduct(p)}
                        onTouchStart={() => cacheProduct(p)}
                        className="block"
                      >
                        <div className="bg-white rounded-[14px] overflow-hidden shadow-[0_12px_35px_rgba(0,0,0,0.1)] flex flex-col h-full">
                          <div className="relative aspect-square w-full overflow-hidden">
                            <img
                              src={getOptimizedImageUrl(p.image, 360, 80)}
                              alt={p.name}
                              loading="lazy"
                              style={getImageTransformStyle(p.imageTransform)}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="p-2 space-y-1">
                            <h3 className="text-[9px] font-bold text-slate-800 leading-tight line-clamp-2 uppercase">
                              {p.name}
                            </h3>
                            <p className="text-[11px] font-black text-[#FF6B95]">
                              ₹{p.price.toLocaleString()}
                            </p>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-10 italic text-pink-300 text-xs font-bold uppercase tracking-widest">
            Best sellers arriving...
          </div>
        )}

        {!loading && scrollSnaps.length > 0 && (
          <div className="flex justify-center pt-2">
            <div className="flex gap-1.5">
              {scrollSnaps.map((_, i) => (
                <button
                  key={i}
                  onClick={() => emblaApi?.scrollTo(i)}
                  className={cn(
                    "h-1 rounded-full transition-all duration-300",
                    selectedIndex === i ? "w-8 bg-[#FF6B95]" : "w-1.5 bg-pink-200"
                  )}
                  aria-label={`Go to slide group ${i + 1}`}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
