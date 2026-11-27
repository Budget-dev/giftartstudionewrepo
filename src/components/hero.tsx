"use client";

import React, { memo, useState, useEffect, useMemo, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronRight, ChevronLeft, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { useFirestore, useCollection } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';
import { cn } from '@/lib/utils';
import { Banner } from '@/lib/types';
import { getOptimizedImageUrl } from '@/lib/image-optimizer';

interface HeroProps {
  cms?: any;
  isMobile?: boolean;
}

const DEFAULT_MOCK = {
  id: 'default-desktop',
  imageUrl: "https://rohanwakkar.sirv.com/main-home-banner-website-design-home-page.png",
  mobileImageUrl: "https://rohanwakkar.sirv.com/WhatsApp%20Image%202026-06-20%20at%206.03.34%20PM.jpeg",
  subHeading: "UNIQUE, PERSONALIZED GIFTS",
  heading: "Unique Gifts, Made for Kids",
  title: "Unique Gifts, Made for Kids",
  description: "Create unforgettable childhood memories with our premium handcrafted collection of personalized bags, toys, and essentials.",
  primaryButtonText: "Explore Shop",
  primaryButtonUrl: "/shop/new/best-sellers",
  linkUrl: "/shop/new/best-sellers",
  secondaryButtonText: "All Categories",
  secondaryButtonUrl: "/collections",
  order: 1,
  active: true
};

const MOBILE_SPECIFIC_MOCK = {
  id: 'default-mobile',
  imageUrl: "https://rohanwakkar.sirv.com/WhatsApp%20Image%202026-06-20%20at%206.03.34%20PM.jpeg",
  mobileImageUrl: "https://rohanwakkar.sirv.com/WhatsApp%20Image%202026-06-20%20at%206.03.34%20PM.jpeg",
  subHeading: "UNIQUE BOUTIQUE GIFTS",
  heading: "Gifts Made Extra Special",
  title: "Gifts Made Extra Special",
  description: "Memorable handcrafted treasures for your little ones.",
  primaryButtonText: "Shop Now",
  primaryButtonUrl: "/shop/new/best-sellers",
  linkUrl: "/shop/new/best-sellers",
  secondaryButtonText: "View Catalog",
  secondaryButtonUrl: "/collections",
  order: 1,
  active: true
};

export const Hero = memo(({ cms, isMobile }: HeroProps) => {
  const db = useFirestore();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  // Real-time query to Firestore 'banners' collection
  const bannersQuery = useMemo(() => {
    if (!db) return null;
    return query(collection(db, 'banners'), orderBy('order', 'asc'));
  }, [db]);

  const { data: rawBanners } = useCollection<any>(bannersQuery, cms ? undefined : 'home_banners');

  // Filter active banners and format
  const activeBanners = useMemo(() => {
    if (cms) {
      return [cms];
    }
    if (rawBanners && rawBanners.length > 0) {
      const activeList = rawBanners
        .filter((b) => b.active !== false && (b.imageUrl || b.mobileImageUrl))
        .map((b) => ({
          id: b.id,
          imageUrl: b.imageUrl,
          mobileImageUrl: b.mobileImageUrl || b.imageUrl,
          subHeading: b.subHeading,
          heading: b.title || b.heading,
          title: b.title || b.heading,
          description: b.description,
          primaryButtonText: b.primaryButtonText,
          primaryButtonUrl: b.linkUrl || b.primaryButtonUrl || '/shop',
          linkUrl: b.linkUrl || b.primaryButtonUrl || '/shop',
          secondaryButtonText: b.secondaryButtonText,
          secondaryButtonUrl: b.secondaryButtonUrl,
          order: typeof b.order === 'number' ? b.order : parseInt(b.order, 10) || 1,
          active: true
        }))
        .sort((a, b) => a.order - b.order);

      if (activeList.length > 0) {
        return activeList;
      }
    }

    const fallback = isMobile ? MOBILE_SPECIFIC_MOCK : DEFAULT_MOCK;
    return [fallback];
  }, [cms, rawBanners, isMobile]);

  // Keep index within bounds if list length changes
  useEffect(() => {
    if (currentIndex >= activeBanners.length) {
      setCurrentIndex(0);
    }
  }, [activeBanners.length, currentIndex]);

  // Auto-slide every 5 seconds (5000ms)
  useEffect(() => {
    if (activeBanners.length <= 1 || isPaused) return;

    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % activeBanners.length);
    }, 5000);

    return () => clearInterval(timer);
  }, [activeBanners.length, isPaused, currentIndex]);

  const handlePrev = useCallback((e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setCurrentIndex((prev) => (prev - 1 + activeBanners.length) % activeBanners.length);
  }, [activeBanners.length]);

  const handleNext = useCallback((e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setCurrentIndex((prev) => (prev + 1) % activeBanners.length);
  }, [activeBanners.length]);

  const currentBanner = activeBanners[currentIndex] || activeBanners[0];
  const bannerImage = (isMobile && currentBanner.mobileImageUrl)
    ? currentBanner.mobileImageUrl
    : (currentBanner.imageUrl || currentBanner.mobileImageUrl);

  const hasOverlayText = Boolean(
    currentBanner.heading ||
    currentBanner.subHeading ||
    currentBanner.description ||
    currentBanner.primaryButtonText
  );

  return (
    <section 
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={() => setIsPaused(true)}
      onTouchEnd={() => setIsPaused(false)}
      className="relative overflow-hidden flex items-center pt-[110px] pb-12 md:pt-[140px] md:pb-16 lg:pt-[160px] lg:pb-20 w-full aspect-[3/5] md:aspect-auto lg:aspect-[4924/2684] md:min-h-[700px] lg:min-h-0 bg-sky-50 transition-all duration-700 select-none group/hero"
    >
      {/* Background Animated Slides */}
      <AnimatePresence initial={false} mode="wait">
        <motion.div
          key={`slide-${currentBanner.id || currentIndex}`}
          initial={{ opacity: 0, scale: 1.01 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.7, ease: "easeInOut" }}
          className="absolute inset-0 z-10"
        >
          {/* Desktop background */}
          <img
            src={getOptimizedImageUrl(currentBanner.imageUrl, 1600, 82)}
            alt={currentBanner.title || currentBanner.heading || 'GiftArtStudio Banner'}
            fetchPriority="high"
            loading="eager"
            decoding="async"
            className={cn(
              "absolute inset-0 w-full h-full object-cover object-top",
              currentBanner.mobileImageUrl && currentBanner.mobileImageUrl !== currentBanner.imageUrl ? "hidden md:block" : "block"
            )}
          />
          <div className="absolute inset-0 bg-white/5 pointer-events-none" />

          {/* Mobile background (if mobileImageUrl provided) */}
          {currentBanner.mobileImageUrl && currentBanner.mobileImageUrl !== currentBanner.imageUrl && (
            <img
              src={getOptimizedImageUrl(currentBanner.mobileImageUrl, 800, 82)}
              alt={currentBanner.title || currentBanner.heading || 'GiftArtStudio Banner'}
              fetchPriority="high"
              loading="eager"
              decoding="async"
              className="absolute inset-0 w-full h-full object-cover object-top block md:hidden"
            />
          )}
        </motion.div>
      </AnimatePresence>

      {/* Optional Clickable Full-Banner Wrapper if no overlay text */}
      {!hasOverlayText && currentBanner.linkUrl && (
        <Link
          href={currentBanner.linkUrl}
          className="absolute inset-0 z-20 cursor-pointer"
          aria-label={currentBanner.title || "Banner link"}
        />
      )}

      {/* Content Container (Visible when banner has text) */}
      {hasOverlayText && (
        <div className="container mx-auto px-6 relative z-20 pointer-events-auto">
          <AnimatePresence mode="wait">
            <motion.div 
              key={`content-${currentBanner.id || currentIndex}`}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.5 }}
              className="flex flex-col items-center text-center space-y-6 md:space-y-10 max-w-4xl mx-auto"
            >
              {currentBanner.subHeading && (
                <div className="inline-flex items-center gap-2 bg-white/80 backdrop-blur-md px-4 py-2 rounded-full shadow-sm border border-sky-100">
                  <Sparkles className="h-3.5 w-3.5 text-sky-500" />
                  <span className="text-[9px] md:text-[11px] font-black text-sky-600 uppercase tracking-[0.25em]">
                    {currentBanner.subHeading}
                  </span>
                </div>
              )}
              
              {currentBanner.heading && (
                <h1 className="font-headline font-black text-3xl md:text-6xl lg:text-7xl leading-[1.15] text-slate-800 tracking-tight drop-shadow-sm">
                  {currentBanner.heading}
                </h1>
              )}

              {currentBanner.description && (
                <p className="text-sm md:text-xl font-bold leading-relaxed text-slate-600 max-w-2xl">
                  {currentBanner.description}
                </p>
              )}

              <div className="pt-6 flex flex-col sm:flex-row justify-center items-center gap-3 w-full sm:w-auto mx-auto">
                {currentBanner.primaryButtonText && (
                  <Button asChild className="w-44 md:w-52 rounded-2xl bg-sky-600 hover:bg-sky-500 text-white h-11 md:h-13 text-[10px] md:text-[11px] font-black uppercase tracking-widest shadow-xl gap-2 group active:scale-95 transition-all">
                    <Link href={currentBanner.primaryButtonUrl || currentBanner.linkUrl || '#'}>
                      {currentBanner.primaryButtonText} <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    </Link>
                  </Button>
                )}
                
                {currentBanner.secondaryButtonText && (
                  <Button asChild variant="outline" className="w-44 md:w-52 rounded-2xl bg-white border-2 border-slate-100 text-slate-700 hover:bg-slate-50 h-11 md:h-13 text-[10px] md:text-[11px] font-black uppercase tracking-widest shadow-sm active:scale-95 transition-all">
                    <Link href={currentBanner.secondaryButtonUrl || '#'}>
                      {currentBanner.secondaryButtonText}
                    </Link>
                  </Button>
                )}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      )}

      {/* Manual Left & Right Navigation Arrows (Visible when 2+ banners) */}
      {activeBanners.length > 1 && (
        <>
          <button
            type="button"
            onClick={handlePrev}
            aria-label="Previous Banner"
            className="absolute left-3 md:left-6 top-1/2 -translate-y-1/2 z-30 w-10 h-10 md:w-12 md:h-12 rounded-full bg-white/80 hover:bg-white text-slate-800 backdrop-blur-md shadow-lg border border-slate-200/50 flex items-center justify-center transition-all opacity-80 md:opacity-0 group-hover/hero:opacity-100 hover:scale-110 active:scale-95 cursor-pointer"
          >
            <ChevronLeft className="w-5 h-5 md:w-6 md:h-6 text-slate-700" />
          </button>

          <button
            type="button"
            onClick={handleNext}
            aria-label="Next Banner"
            className="absolute right-3 md:right-6 top-1/2 -translate-y-1/2 z-30 w-10 h-10 md:w-12 md:h-12 rounded-full bg-white/80 hover:bg-white text-slate-800 backdrop-blur-md shadow-lg border border-slate-200/50 flex items-center justify-center transition-all opacity-80 md:opacity-0 group-hover/hero:opacity-100 hover:scale-110 active:scale-95 cursor-pointer"
          >
            <ChevronRight className="w-5 h-5 md:w-6 md:h-6 text-slate-700" />
          </button>

          {/* Indicator Dots at Bottom */}
          <div className="absolute bottom-4 md:bottom-6 left-0 right-0 z-30 flex items-center justify-center gap-2 pointer-events-auto">
            {activeBanners.map((b, idx) => {
              const isActive = idx === currentIndex;
              return (
                <button
                  key={b.id || idx}
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setCurrentIndex(idx);
                  }}
                  aria-label={`Go to slide ${idx + 1}`}
                  className={cn(
                    "transition-all duration-300 rounded-full h-2.5 cursor-pointer",
                    isActive
                      ? "w-8 bg-sky-600 shadow-md shadow-sky-600/30"
                      : "w-2.5 bg-slate-400/50 hover:bg-slate-600/80"
                  )}
                />
              );
            })}
          </div>
        </>
      )}
    </section>
  );
});

Hero.displayName = "Hero";
