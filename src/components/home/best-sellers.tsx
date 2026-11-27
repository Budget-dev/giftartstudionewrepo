"use client";

import { motion, AnimatePresence } from 'framer-motion';
import { Star, Palette, Heart, Gift, Sparkles, ChevronLeft, ChevronRight } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useFirestore, useCollection } from '@/firebase';
import { collection, query, where, limit, orderBy } from 'firebase/firestore';
import { useMemo, useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { cacheProduct, cacheProducts } from '@/lib/product-cache';
import { getOptimizedImageUrl, getImageTransformStyle } from '@/lib/image-optimizer';

const DEFAULT_COLLECTION_BANNERS = [
  {
    id: 'default-boys-girls',
    imageUrl: "https://res.cloudinary.com/drjrbb4yn/image/upload/v1782027359/kids-image_pn17nh.png",
    title: "Boys & Girls Collection",
    linkUrl: "/shop/new/best-sellers",
  }
];

const CARD_THEMES = [
  { bg: 'bg-[#FFF0D9]', pill: 'bg-[#FF6B95]' },
  { bg: 'bg-[#E8F8F0]', pill: 'bg-[#FF6B95]' },
  { bg: 'bg-[#FFEAF6]', pill: 'bg-[#FF6B95]' },
];

export function BestSellers({ cms }: { cms?: any }) {
  const db = useFirestore();
  const [bannerIdx, setBannerIdx] = useState(0);

  const bestSellersQuery = useMemo(() => {
    if (!db) return null;
    return query(
      collection(db, 'products'),
      where('isBestSeller', '==', true),
      limit(3)
    );
  }, [db]);

  const bannersQuery = useMemo(() => {
    if (!db) return null;
    return query(collection(db, 'banners'), orderBy('order', 'asc'));
  }, [db]);

  const { data: products, loading } = useCollection<any>(bestSellersQuery, 'home_best_sellers');
  const { data: rawBanners } = useCollection<any>(bannersQuery, 'home_banners');

  const collectionBanners = useMemo(() => {
    if (rawBanners && rawBanners.length > 0) {
      const list = rawBanners
        .filter((b) => b.placement === 'collection' && b.active !== false && (b.imageUrl || b.mobileImageUrl))
        .sort((a, b) => (Number(a.order) || 0) - (Number(b.order) || 0));
      if (list.length > 0) return list;
    }
    return DEFAULT_COLLECTION_BANNERS;
  }, [rawBanners]);

  useEffect(() => {
    if (bannerIdx >= collectionBanners.length) setBannerIdx(0);
  }, [collectionBanners.length, bannerIdx]);

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

  const currentBanner = collectionBanners[bannerIdx] || collectionBanners[0];

  return (
    <section className="hidden md:block relative bg-white overflow-hidden py-12">
      {/* 3 Pointers */}
      <div className="max-w-[1440px] mx-auto px-6 mb-16">
        <div className="flex justify-center items-center gap-12 lg:gap-24">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-full bg-[#FFFBEB] flex items-center justify-center text-[#F59E0B] shadow-inner">
              <Star className="w-5 h-5 fill-[#F59E0B]" />
            </div>
            <div className="flex flex-col leading-tight">
              <span className="text-[14px] font-black text-slate-800">Premium Quality</span>
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider mt-0.5">PERSONALIZED FOR MEMORIES</span>
            </div>
          </div>

          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-full bg-[#ECFDF5] flex items-center justify-center text-[#10B981] shadow-inner">
              <Palette className="w-5 h-5 fill-[#10B981]" />
            </div>
            <div className="flex flex-col leading-tight">
              <span className="text-[14px] font-black text-slate-800">Unique &amp; Handcrafted</span>
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider mt-0.5">250+ UNIQUE THEMES</span>
            </div>
          </div>

          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-full bg-[#FFF1F2] flex items-center justify-center text-[#F43F5E] shadow-inner">
              <Heart className="w-5 h-5 fill-[#F43F5E]" />
            </div>
            <div className="flex flex-col leading-tight">
              <span className="text-[14px] font-black text-slate-800">Loved by Thousands</span>
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider mt-0.5">10,000+ HAPPY CUSTOMERS</span>
            </div>
          </div>
        </div>
      </div>

      {/* Boys & Girls Collection Auto-Rotating Banner Template */}
      <div className="relative w-full max-w-[1440px] mx-auto overflow-visible">
        <div className="relative w-full aspect-[1440/1000] overflow-hidden bg-slate-50 group/colbanner">
          <AnimatePresence initial={false} mode="wait">
            <motion.div
              key={`col-${currentBanner.id || bannerIdx}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.6 }}
              className="absolute inset-0 overflow-hidden"
            >
              <img
                src={getOptimizedImageUrl(currentBanner.imageUrl, 1440, 82)}
                alt={currentBanner.title || "New Collection Banner"}
                loading="lazy"
                style={getImageTransformStyle((currentBanner as any).desktopTransform)}
                className="w-full h-full object-cover object-top"
              />
            </motion.div>
          </AnimatePresence>

          {collectionBanners.length > 1 && (
            <>
              <button
                type="button"
                onClick={() => setBannerIdx((prev) => (prev - 1 + collectionBanners.length) % collectionBanners.length)}
                className="absolute left-4 top-1/2 -translate-y-1/2 z-30 w-10 h-10 rounded-full bg-white/85 hover:bg-white text-slate-800 shadow-lg flex items-center justify-center opacity-0 group-hover/colbanner:opacity-100 transition-opacity"
                aria-label="Previous Collection Banner"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                type="button"
                onClick={() => setBannerIdx((prev) => (prev + 1) % collectionBanners.length)}
                className="absolute right-4 top-1/2 -translate-y-1/2 z-30 w-10 h-10 rounded-full bg-white/85 hover:bg-white text-slate-800 shadow-lg flex items-center justify-center opacity-0 group-hover/colbanner:opacity-100 transition-opacity"
                aria-label="Next Collection Banner"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </>
          )}
        </div>

        {/* Overlay Header */}
        <div className="absolute top-[4%] left-0 right-0 z-20 flex flex-col items-center pointer-events-none">
          <div className="bg-white rounded-3xl shadow-xl shadow-[#0ea5e9]/5 px-8 py-3.5 flex items-center gap-3 border border-slate-100/50 pointer-events-auto">
            <div className="relative">
              <div className="w-9 h-9 bg-[#0ea5e9] rounded-xl flex items-center justify-center text-white shadow-lg shadow-sky-500/20">
                <Gift className="w-5 h-5" />
              </div>
              <Sparkles className="absolute -top-1 -right-1 w-3 h-3 text-amber-400 fill-amber-400 animate-pulse" />
            </div>
            <div className="flex flex-col leading-tight">
              <span className="font-headline font-black text-lg text-[#1E1B4B] tracking-tighter">
                GiftArtStudio
              </span>
              <span className="text-[7px] font-black text-[#0ea5e9] uppercase tracking-[0.3em]">
                MAGICAL GIFTS
              </span>
            </div>
          </div>

          <h2 className="mt-4 font-headline font-black text-white text-3xl md:text-4xl lg:text-5xl drop-shadow-sm tracking-tight">
            {currentBanner.title || "Best Sellers"}
          </h2>
        </div>

        {/* Fixed 1:1 Square Edge-to-Edge Product Cards */}
        <div className="absolute bottom-[5%] left-0 right-0 z-10 px-6">
          <div className="container mx-auto">
            {loading ? (
              <div className="grid grid-cols-3 gap-6 lg:gap-12 max-w-6xl mx-auto w-full">
                {[0, 1, 2].map((idx) => (
                  <div key={idx} className="rounded-[2.5rem] overflow-hidden shadow-2xl bg-white animate-pulse">
                    <div className="aspect-square w-full bg-purple-100" />
                    <div className="p-6 space-y-3">
                      <div className="h-4 w-3/4 mx-auto bg-slate-200 rounded-full" />
                      <div className="h-8 w-28 mx-auto bg-pink-200 rounded-full" />
                    </div>
                  </div>
                ))}
              </div>
            ) : products && products.length > 0 ? (
              <div className="grid grid-cols-3 gap-6 lg:gap-12 max-w-6xl mx-auto w-full">
                {products.map((p: any, i: number) => {
                  const theme = CARD_THEMES[i % CARD_THEMES.length];
                  return (
                    <motion.div
                      key={p.id}
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: i * 0.1, duration: 0.5 }}
                      className={cn(
                        "group cursor-pointer rounded-[2.5rem] overflow-hidden shadow-2xl flex flex-col transition-all hover:-translate-y-2 duration-300",
                        theme.bg
                      )}
                    >
                      <Link
                        href={`/product?id=${p.id}`}
                        as={`/product/${p.id}`}
                        prefetch={false}
                        onMouseEnter={() => cacheProduct(p)}
                        onTouchStart={() => cacheProduct(p)}
                        className="flex flex-col h-full"
                      >
                        {/* 1:1 Fixed Square Edge-to-Edge Image (Zero Borders / Gaps) */}
                        <div className="relative aspect-square w-full overflow-hidden">
                          <img
                            src={getOptimizedImageUrl(p.image, 600, 82)}
                            alt={p.name}
                            loading="lazy"
                            style={getImageTransformStyle(p.imageTransform)}
                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                          />
                        </div>

                        <div className="p-6 pt-7 pb-10 flex-1 flex flex-col items-center justify-between text-center space-y-6">
                          <h3 className="font-black text-slate-800 text-[14px] lg:text-[17px] leading-snug tracking-tight max-w-[220px]">
                            {p.name}
                          </h3>
                          <div className={cn(
                            "flex items-center justify-center w-28 h-7 md:h-9 rounded-full shadow-lg shadow-black/5 transition-all duration-500 group-hover:w-36 group-hover:brightness-110 text-white font-black text-[10px] md:text-[12px] uppercase tracking-widest",
                            theme.pill
                          )}>
                            BUY NOW
                          </div>
                        </div>
                      </Link>
                    </motion.div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-20 text-slate-400 font-black uppercase tracking-widest text-xs italic">
                Gathering the Studio Favourites...
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
