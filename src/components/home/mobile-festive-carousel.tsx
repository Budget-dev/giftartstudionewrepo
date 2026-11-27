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

interface MobileFestiveCarouselProps {
  cms?: any;
}

const DEFAULT_SEASONAL_BANNERS = [
  {
    id: 'default-seasonal-mobile',
    imageUrl: "https://res.cloudinary.com/dwgnnr10/image/upload/v1785341862/festive-section-image-_zy2mxi.png",
    mobileImageUrl: "https://res.cloudinary.com/dwgnnr10/image/upload/v1785341862/festive-section-image-_zy2mxi.png",
    title: "Seasonal Gifts Collection",
  }
];

export function MobileFestiveCarousel({ cms }: MobileFestiveCarouselProps) {
  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: true,
    align: 'start',
    skipSnaps: false
  });

  const [selectedIndex, setSelectedIndex] = useState(0);
  const [scrollSnaps, setScrollSnaps] = useState<number[]>([]);
  const [bannerIdx, setBannerIdx] = useState(0);

  const db = useFirestore();

  const festiveQuery = useMemo(() => {
    if (!db) return null;
    return query(
      collection(db, 'products'),
      where('category', '==', 'new'),
      where('subcategory', '==', 'festive'),
      limit(6)
    );
  }, [db]);

  const bannersQuery = useMemo(() => {
    if (!db) return null;
    return query(collection(db, 'banners'), orderBy('order', 'asc'));
  }, [db]);

  const { data: products, loading } = useCollection<any>(festiveQuery, 'home_festive_mobile');
  const { data: rawBanners } = useCollection<any>(bannersQuery, 'home_banners');

  const seasonalBanners = useMemo(() => {
    if (rawBanners && rawBanners.length > 0) {
      const list = rawBanners
        .filter((b) => b.placement === 'seasonal' && b.active !== false && (b.mobileImageUrl || b.imageUrl))
        .sort((a, b) => (Number(a.order) || 0) - (Number(b.order) || 0));
      if (list.length > 0) return list;
    }
    return DEFAULT_SEASONAL_BANNERS;
  }, [rawBanners]);

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

  const currentBanner = seasonalBanners[bannerIdx % seasonalBanners.length] || seasonalBanners[0];

  return (
    <section className="md:hidden py-10 bg-white overflow-hidden">
      <div className="container mx-auto px-4 space-y-8">
        {/* Auto-Rotating Seasonal Sale Banner */}
        <div className="relative w-full aspect-[1.6/1] rounded-[20px] overflow-hidden shadow-lg bg-amber-50">
          <AnimatePresence initial={false} mode="wait">
            <motion.div
              key={`mseasonal-${currentBanner.id || bannerIdx}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
              className="absolute inset-0 overflow-hidden"
            >
              <img
                src={getOptimizedImageUrl(currentBanner.mobileImageUrl || currentBanner.imageUrl, 800, 82)}
                alt={currentBanner.title || "Seasonal Collection"}
                loading="lazy"
                style={getImageTransformStyle((currentBanner as any).mobileTransform || (currentBanner as any).desktopTransform)}
                className="w-full h-full object-cover object-top"
              />
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Heading Area */}
        <div className="flex items-end justify-between px-2">
          <div className="space-y-0">
            <h2 className="text-[24px] font-black text-[#F57C00] leading-[1.15] tracking-tight">
              {currentBanner.title || cms?.title || "Seasonal & Festive Collection"}
            </h2>
          </div>
          <Link href="/shop/new/festive" className="text-sm font-bold text-[#7E22CE] mb-1 shrink-0 ml-2">
            View All
          </Link>
        </div>

        {/* Product Carousel - Fixed 1:1 Edge-to-Edge */}
        {loading ? (
          <div className="grid grid-cols-3 gap-2 py-2">
            {[0, 1, 2].map((idx) => (
              <div key={idx} className="bg-white rounded-[16px] overflow-hidden border border-amber-50 shadow-sm animate-pulse space-y-2">
                <div className="aspect-square w-full bg-amber-50" />
                <div className="p-2 space-y-1">
                  <div className="h-3 w-3/4 bg-amber-100 rounded-full" />
                </div>
              </div>
            ))}
          </div>
        ) : products && products.length > 0 ? (
          <>
            <div className="overflow-hidden" ref={emblaRef}>
              <div className="flex gap-2">
                {products.map((p: any) => (
                  <div key={p.id} className="flex-[0_0_calc((100%-16px)/3)] min-w-0">
                    <Link
                      href={`/product?id=${p.id}`}
                      as={`/product/${p.id}`}
                      prefetch={false}
                      onMouseEnter={() => cacheProduct(p)}
                      onTouchStart={() => cacheProduct(p)}
                      className="block h-full"
                    >
                      <div className="bg-white rounded-[16px] overflow-hidden shadow-[0_15px_40px_rgba(0,0,0,0.06)] h-full flex flex-col">
                        <div className="relative aspect-square w-full overflow-hidden">
                          <img
                            src={getOptimizedImageUrl(p.image, 400, 82)}
                            alt={p.name}
                            loading="lazy"
                            style={getImageTransformStyle(p.imageTransform)}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="p-2.5 space-y-1 flex-1 flex flex-col justify-between">
                          <h3 className="text-[10px] font-bold text-slate-800 leading-tight line-clamp-2">
                            {p.name}
                          </h3>
                          <p className="text-[12px] font-black text-[#0ea5e9]">
                            ₹{p.price.toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </Link>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-center gap-2 pt-2">
              {scrollSnaps.map((_, i) => (
                <button
                  key={i}
                  onClick={() => emblaApi?.scrollTo(i)}
                  className={cn(
                    "h-2 rounded-full transition-all duration-300",
                    selectedIndex === i ? "w-6 bg-[#0ea5e9]" : "w-2 bg-[#D8B4FE]"
                  )}
                  aria-label={`Go to slide ${i + 1}`}
                />
              ))}
            </div>
          </>
        ) : (
          <div className="py-16 text-center italic text-amber-300 text-xs font-bold uppercase tracking-widest">
            Festive picks arriving...
          </div>
        )}
      </div>
    </section>
  );
}
