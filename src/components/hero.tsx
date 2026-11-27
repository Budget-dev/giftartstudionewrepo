"use client";

import React, { memo, useState, useEffect, useMemo, useCallback } from 'react';
import { ChevronRight, ChevronLeft } from 'lucide-react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { useFirestore, useCollection } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';
import { cn } from '@/lib/utils';
import { getOptimizedImageUrl, getImageTransformStyle } from '@/lib/image-optimizer';
import { HeroTornPaper } from '@/components/ui/hero-torn-paper';

interface HeroProps {
  cms?: any;
  isMobile?: boolean;
}

const DEFAULT_MOCK = {
  id: 'default-desktop',
  placement: 'hero',
  imageUrl: "https://rohanwakkar.sirv.com/main-home-banner-website-design-home-page.png",
  mobileImageUrl: "https://rohanwakkar.sirv.com/WhatsApp%20Image%202026-06-20%20at%206.03.34%20PM.jpeg",
  linkUrl: "/shop/new/best-sellers",
  order: 1,
  active: true,
  tornPaperBottom: true,
};

const MOBILE_SPECIFIC_MOCK = {
  id: 'default-mobile',
  placement: 'hero',
  imageUrl: "https://rohanwakkar.sirv.com/WhatsApp%20Image%202026-06-20%20at%206.03.34%20PM.jpeg",
  mobileImageUrl: "https://rohanwakkar.sirv.com/WhatsApp%20Image%202026-06-20%20at%206.03.34%20PM.jpeg",
  linkUrl: "/shop/new/best-sellers",
  order: 1,
  active: true,
  tornPaperBottom: true,
};

export const Hero = memo(({ cms, isMobile }: HeroProps) => {
  const db = useFirestore();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const bannersQuery = useMemo(() => {
    if (!db) return null;
    return query(collection(db, 'banners'), orderBy('order', 'asc'));
  }, [db]);

  const { data: rawBanners } = useCollection<any>(bannersQuery, cms ? undefined : 'home_banners');

  const activeBanners = useMemo(() => {
    if (cms) {
      return [cms];
    }
    if (rawBanners && rawBanners.length > 0) {
      const activeList = rawBanners
        .filter((b) => (b.placement || 'hero') === 'hero' && b.active !== false && (b.imageUrl || b.mobileImageUrl))
        .map((b) => ({
          id: b.id,
          imageUrl: b.imageUrl,
          mobileImageUrl: b.mobileImageUrl || b.imageUrl,
          heading: b.title || b.heading,
          title: b.title || b.heading,
          subHeading: b.subHeading,
          description: b.description,
          linkUrl: b.linkUrl || b.primaryButtonUrl || '',
          desktopStyle: b.desktopStyle,
          mobileStyle: b.mobileStyle,
          desktopTransform: b.desktopTransform,
          mobileTransform: b.mobileTransform,
          tornPaperBottom: b.tornPaperBottom !== false,
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

  useEffect(() => {
    if (currentIndex >= activeBanners.length) {
      setCurrentIndex(0);
    }
  }, [activeBanners.length, currentIndex]);

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
  const activeStyle = isMobile ? currentBanner.mobileStyle : currentBanner.desktopStyle;
  const desktopTransformStyle = getImageTransformStyle(currentBanner.desktopTransform);
  const mobileTransformStyle = getImageTransformStyle(currentBanner.mobileTransform || currentBanner.desktopTransform);

  const hasCustomStyle = Boolean(
    activeStyle && (
      activeStyle.heightMode === 'custom' ||
      activeStyle.widthMode === 'contained' ||
      activeStyle.objectFit ||
      activeStyle.paddingTop !== undefined ||
      activeStyle.paddingBottom !== undefined ||
      activeStyle.paddingX !== undefined ||
      activeStyle.bgColor
    )
  );

  const sectionStyle: React.CSSProperties = hasCustomStyle ? {
    backgroundColor: activeStyle?.bgColor || '#f0f9ff',
    paddingTop: activeStyle?.paddingTop !== undefined ? `${activeStyle.paddingTop}px` : undefined,
    paddingBottom: activeStyle?.paddingBottom !== undefined ? `${activeStyle.paddingBottom}px` : undefined,
    paddingLeft: activeStyle?.paddingX !== undefined ? `${activeStyle.paddingX}px` : undefined,
    paddingRight: activeStyle?.paddingX !== undefined ? `${activeStyle.paddingX}px` : undefined,
    height: activeStyle?.heightMode === 'custom' && activeStyle?.heightPx ? `${activeStyle.heightPx}px` : undefined,
  } : {};

  const fitClass = activeStyle?.objectFit === 'contain'
    ? 'object-contain'
    : activeStyle?.objectFit === 'fill'
      ? 'object-fill'
      : 'object-cover';

  return (
    <section
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={() => setIsPaused(true)}
      onTouchEnd={() => setIsPaused(false)}
      style={sectionStyle}
      className={cn(
        "relative overflow-hidden flex items-center bg-sky-50 transition-all duration-700 select-none group/hero",
        activeStyle?.widthMode === 'contained' ? "max-w-7xl mx-auto rounded-3xl my-4" : "w-full",
        activeStyle?.heightMode === 'custom'
          ? "min-h-0"
          : "aspect-[3/4] sm:aspect-[16/9]"
      )}
    >
      {/* Background Animated Slides (16:9 desktop template) */}
      <AnimatePresence initial={false} mode="wait">
        <motion.div
          key={`slide-${currentBanner.id || currentIndex}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.65, ease: "easeInOut" }}
          style={hasCustomStyle ? {
            paddingTop: activeStyle?.paddingTop ? `${activeStyle.paddingTop}px` : undefined,
            paddingBottom: activeStyle?.paddingBottom ? `${activeStyle.paddingBottom}px` : undefined,
            paddingLeft: activeStyle?.paddingX ? `${activeStyle.paddingX}px` : undefined,
            paddingRight: activeStyle?.paddingX ? `${activeStyle.paddingX}px` : undefined,
          } : undefined}
          className="absolute inset-0 z-10 overflow-hidden"
        >
          {/* Desktop Image */}
          <img
            src={getOptimizedImageUrl(currentBanner.imageUrl, 1600, 84)}
            alt={currentBanner.title || currentBanner.heading || 'GiftArtStudio Banner'}
            fetchPriority="high"
            loading="eager"
            decoding="async"
            style={{
              ...desktopTransformStyle,
              ...(activeStyle?.objectPosition ? { objectPosition: activeStyle.objectPosition } : {}),
            }}
            className={cn(
              "w-full h-full",
              fitClass,
              !activeStyle?.objectPosition && "object-center",
              currentBanner.mobileImageUrl && currentBanner.mobileImageUrl !== currentBanner.imageUrl ? "hidden md:block" : "block"
            )}
          />

          {/* Mobile Image */}
          {currentBanner.mobileImageUrl && currentBanner.mobileImageUrl !== currentBanner.imageUrl && (
            <img
              src={getOptimizedImageUrl(currentBanner.mobileImageUrl, 800, 84)}
              alt={currentBanner.title || currentBanner.heading || 'GiftArtStudio Banner'}
              fetchPriority="high"
              loading="eager"
              decoding="async"
              style={{
                ...mobileTransformStyle,
                ...(activeStyle?.objectPosition ? { objectPosition: activeStyle.objectPosition } : {}),
              }}
              className={cn(
                "w-full h-full block md:hidden",
                fitClass,
                !activeStyle?.objectPosition && "object-center"
              )}
            />
          )}
        </motion.div>
      </AnimatePresence>

      {/* Fixed Realistic Torn-Paper Bottom Edge Template (Consistent while scrolling) */}
      {currentBanner.tornPaperBottom !== false && (
        <HeroTornPaper className="absolute -bottom-[1px] left-0 right-0 z-30" />
      )}

      {/* Optional Clickable Full-Banner Link (No "Shop Now" button overlay) */}
      {currentBanner.linkUrl && (
        <Link
          href={currentBanner.linkUrl}
          className="absolute inset-0 z-20 cursor-pointer"
          aria-label={currentBanner.title || "Explore banner"}
        />
      )}

      {/* Left/Right Navigation Arrows when multiple active Hero banners exist */}
      {activeBanners.length > 1 && (
        <>
          <button
            type="button"
            onClick={handlePrev}
            aria-label="Previous Banner"
            className="absolute left-3 md:left-6 top-1/2 -translate-y-1/2 z-40 w-10 h-10 md:w-12 md:h-12 rounded-full bg-white/85 hover:bg-white text-slate-800 shadow-lg border border-slate-200 flex items-center justify-center opacity-0 group-hover/hero:opacity-100 md:opacity-90 transition-all hover:scale-105 active:scale-95"
          >
            <ChevronLeft className="w-5 h-5 md:w-6 md:h-6" />
          </button>

          <button
            type="button"
            onClick={handleNext}
            aria-label="Next Banner"
            className="absolute right-3 md:right-6 top-1/2 -translate-y-1/2 z-40 w-10 h-10 md:w-12 md:h-12 rounded-full bg-white/85 hover:bg-white text-slate-800 shadow-lg border border-slate-200 flex items-center justify-center opacity-0 group-hover/hero:opacity-100 md:opacity-90 transition-all hover:scale-105 active:scale-95"
          >
            <ChevronRight className="w-5 h-5 md:w-6 md:h-6" />
          </button>

          {/* Dot Indicators positioned neatly above torn-paper edge */}
          <div className="absolute bottom-9 sm:bottom-12 md:bottom-16 left-1/2 -translate-x-1/2 z-40 flex items-center gap-2 bg-white/75 backdrop-blur-md px-3 py-1.5 rounded-full shadow-sm border border-white/60">
            {activeBanners.map((b, idx) => (
              <button
                key={b.id || idx}
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setCurrentIndex(idx);
                }}
                aria-label={`Go to banner ${idx + 1}`}
                className={cn(
                  "h-2 rounded-full transition-all duration-300",
                  currentIndex === idx ? "w-6 bg-purple-600" : "w-2 bg-slate-400/60 hover:bg-slate-600"
                )}
              />
            ))}
          </div>
        </>
      )}
    </section>
  );
});

Hero.displayName = 'Hero';
