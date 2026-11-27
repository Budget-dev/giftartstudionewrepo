"use client";

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import useEmblaCarousel from 'embla-carousel-react';
import { ChevronLeft, ChevronRight, ArrowRight, Sparkles } from 'lucide-react';
import { useFirestore, useDoc } from '@/firebase';
import { doc } from 'firebase/firestore';
import { getOptimizedImageUrl, getImageTransformStyle } from '@/lib/image-optimizer';
import type { ImageTransform } from '@/lib/types';

export interface CategoryCardItem {
  id?: string;
  title: string;
  imageUrl: string;
  url: string;
  backgroundColor?: string;
  borderColor?: string;
  textColor?: string;
  imageTransform?: ImageTransform;
}

export const DEFAULT_CATEGORIES_CARDS: CategoryCardItem[] = [
  {
    id: 'cat-diy',
    title: 'DIY',
    imageUrl: 'https://rohanwakkar.sirv.com/KIDS/Christmas%20Nativity%20DIY%20Kit/WhatsApp%20Image%202026-11-18%20at%203.00.54%20PM.jpeg',
    url: '/shop/kids/kids-gifts',
    textColor: '#DC2626'
  },
  {
    id: 'cat-combos',
    title: 'Combos',
    imageUrl: 'https://rohanwakkar.sirv.com/ChatGPT%20Image%20Jun%2019%2C%202026%2C%2009_08_49%20PM.png',
    url: '/shop/kids/combos',
    textColor: '#00796B'
  },
  {
    id: 'cat-corp',
    title: 'Corporate Gifts',
    imageUrl: 'https://rohanwakkar.sirv.com/UNISEX/WhatsApp%20Image%202026-10-08%20at%203.57.56%20PM.jpeg',
    url: '/shop/personalized-gifts/corporate-gifts',
    textColor: '#4338CA'
  },
  {
    id: 'cat-clocks',
    title: 'Wall Clocks',
    imageUrl: 'https://rohanwakkar.sirv.com/KIDS/Kids%20Wall%20Hanging%20Organiser/WhatsApp%20Image%202026-11-18%20at%207.17.50%20PM%20(1).jpeg',
    url: '/shop/personalized-gifts/wall-clocks',
    textColor: '#B45309'
  },
  {
    id: 'cat-small-bags',
    title: 'Small Bags',
    imageUrl: 'https://rohanwakkar.sirv.com/KIDS/Veigo%20Medium%20Stainless%20Steel%20Leakproof%20%26%20Airtight%20Lunch%20Box%20with%20Lid%20Lock/hfyhn.png',
    url: '/shop/kids/small-bags',
    textColor: '#BE185D'
  },
  {
    id: 'cat-big-bags',
    title: 'Big Bags',
    imageUrl: 'https://rohanwakkar.sirv.com/toneed.png',
    url: '/shop/kids/big-bags',
    textColor: '#BE123C'
  },
  {
    id: 'cat-sleeves',
    title: 'Laptop Sleeves',
    imageUrl: 'https://rohanwakkar.sirv.com/KIDS/Christmas%20A5%20Diary%20%26%20Pen%20Set/WhatsApp%20Image%202026-11-19%20at%203.13.08%20PM.jpeg',
    url: '/shop/personalized-gifts/laptop-sleeves',
    textColor: '#6D28D9'
  },
  {
    id: 'cat-tumblers',
    title: 'Tumblers',
    imageUrl: 'https://rohanwakkar.sirv.com/UNISEX/WhatsApp%20Image%202026-10-06%20at%206.13.06%20PM%20(1).jpeg',
    url: '/shop/adults/tumblers',
    textColor: '#0F766E'
  },
  {
    id: 'cat-bottles',
    title: 'Bottles',
    imageUrl: 'https://rohanwakkar.sirv.com/ChatGPT%20Image%20Jun%2019%2C%202026%2C%2009_00_07%20PM.png',
    url: '/shop/kids/water-bottles',
    textColor: '#0369A1'
  },
  {
    id: 'cat-umbrellas',
    title: 'Umbrellas',
    imageUrl: 'https://rohanwakkar.sirv.com/ChatGPT%20Image%20Jun%2019%2C%202026%2C%2009_05_54%20PM.png',
    url: '/shop/kids/umbrellas',
    textColor: '#7E22CE'
  },
];

export function CategoryGrid({ cms }: { cms?: any }) {
  const db = useFirestore();

  const categoriesDocRef = useMemo(() => {
    if (!db) return null;
    return doc(db, 'homepage_sections', 'categories');
  }, [db]);

  const { data: cmsDoc } = useDoc<{ title?: string; cards?: CategoryCardItem[] }>(categoriesDocRef);

  const cards: CategoryCardItem[] = useMemo(() => {
    if (cmsDoc?.cards && Array.isArray(cmsDoc.cards) && cmsDoc.cards.length > 0) {
      return cmsDoc.cards;
    }
    if (cms?.cards && Array.isArray(cms.cards) && cms.cards.length > 0) {
      return cms.cards;
    }
    return DEFAULT_CATEGORIES_CARDS;
  }, [cmsDoc, cms]);

  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: 'start',
    containScroll: 'trimSnaps',
    dragFree: true
  });

  const [selectedIndex, setSelectedIndex] = useState(0);
  const [scrollSnaps, setScrollSnaps] = useState<number[]>([]);
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(true);

  const scrollTo = useCallback((index: number) => emblaApi && emblaApi.scrollTo(index), [emblaApi]);
  const scrollPrev = useCallback(() => emblaApi && emblaApi.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi && emblaApi.scrollNext(), [emblaApi]);

  const onInit = useCallback((api: any) => {
    setScrollSnaps(api.scrollSnapList());
  }, []);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
    setCanScrollPrev(emblaApi.canScrollPrev());
    setCanScrollNext(emblaApi.canScrollNext());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    onInit(emblaApi);
    onSelect();
    emblaApi.on('reInit', onInit);
    emblaApi.on('reInit', onSelect);
    emblaApi.on('select', onSelect);
  }, [emblaApi, onInit, onSelect]);

  return (
    <section className="py-10 md:py-16 bg-white relative overflow-hidden">
      <div className="container mx-auto px-4 max-w-7xl">
        {/* Header with Title and Slider Controls */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6 md:mb-10">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-50 text-sky-600 text-[10px] md:text-xs font-black uppercase tracking-wider mb-2 border border-sky-100">
              <Sparkles className="w-3.5 h-3.5 text-sky-500" />
              <span>Explore Handcrafted Gifts</span>
            </div>
            <h2 className="font-headline font-black text-2xl md:text-4xl lg:text-5xl text-slate-800 tracking-tight">
              Shop By <span className="text-sky-500">Category</span>
            </h2>
            <p className="text-xs md:text-sm font-semibold text-slate-400 mt-1 flex items-center gap-1.5">
              <span>Scroll horizontally with arrow buttons or swipe</span>
              <ArrowRight className="w-3.5 h-3.5 text-sky-500 hidden sm:inline" />
            </p>
          </div>

          <div className="flex items-center gap-2 self-end md:self-auto">
            <button
              onClick={scrollPrev}
              disabled={!canScrollPrev}
              aria-label="Previous categories"
              className={cn(
                "w-10 h-10 md:w-12 md:h-12 rounded-full bg-white text-slate-700 shadow-md border border-slate-200 flex items-center justify-center transition-all hover:scale-105 active:scale-95 hover:bg-slate-50",
                !canScrollPrev && "opacity-35 cursor-not-allowed hover:scale-100"
              )}
            >
              <ChevronLeft className="w-5 h-5 md:w-6 md:h-6 stroke-[2.5]" />
            </button>

            <button
              onClick={scrollNext}
              disabled={!canScrollNext}
              aria-label="Next categories"
              className={cn(
                "w-10 h-10 md:w-12 md:h-12 rounded-full bg-white text-slate-700 shadow-md border border-slate-200 flex items-center justify-center transition-all hover:scale-105 active:scale-95 hover:bg-slate-50",
                !canScrollNext && "opacity-35 cursor-not-allowed hover:scale-100"
              )}
            >
              <ChevronRight className="w-5 h-5 md:w-6 md:h-6 stroke-[2.5]" />
            </button>
          </div>
        </div>

        {/* Horizontal Carousel */}
        <div className="relative">
          <button
            onClick={scrollPrev}
            disabled={!canScrollPrev}
            aria-label="Previous categories"
            className={cn(
              "hidden lg:flex absolute -left-5 top-1/2 -translate-y-1/2 z-30 w-12 h-12 rounded-full bg-white/95 backdrop-blur-sm text-slate-700 shadow-xl border border-slate-200 items-center justify-center transition-all hover:scale-110 active:scale-95 hover:bg-white",
              !canScrollPrev && "opacity-0 pointer-events-none"
            )}
          >
            <ChevronLeft className="w-6 h-6 stroke-[2.5]" />
          </button>

          <button
            onClick={scrollNext}
            disabled={!canScrollNext}
            aria-label="Next categories"
            className={cn(
              "hidden lg:flex absolute -right-5 top-1/2 -translate-y-1/2 z-30 w-12 h-12 rounded-full bg-white/95 backdrop-blur-sm text-slate-700 shadow-xl border border-slate-200 items-center justify-center transition-all hover:scale-110 active:scale-95 hover:bg-white",
              !canScrollNext && "opacity-0 pointer-events-none"
            )}
          >
            <ChevronRight className="w-6 h-6 stroke-[2.5]" />
          </button>

          <div className="overflow-hidden -mx-4 px-4 sm:mx-0 sm:px-0" ref={emblaRef}>
            <div className="flex -ml-3.5 sm:-ml-4 md:-ml-5 pb-6 pt-2">
              {cards.map((cat, i) => {
                const textCls = cat.textColor ? { color: cat.textColor } : {};
                return (
                  <motion.div
                    key={cat.id || cat.title || i}
                    initial={{ opacity: 0, scale: 0.96 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.03, duration: 0.35 }}
                    viewport={{ once: true }}
                    className="flex-[0_0_58%] sm:flex-[0_0_42%] md:flex-[0_0_28%] lg:flex-[0_0_22%] min-w-0 pl-3.5 sm:pl-4 md:pl-5 group relative select-none"
                  >
                    <Link
                      href={cat.url || '#'}
                      className="block rounded-[1.8rem] md:rounded-[2.2rem] aspect-square relative transition-all duration-500 hover:shadow-2xl shadow-md overflow-hidden group"
                    >
                      {/* Fixed 1:1 Edge-to-Edge Square Photo (Zero Borders or Empty Spaces) */}
                      {cat.imageUrl && (
                        <img
                          src={getOptimizedImageUrl(cat.imageUrl, 500, 82)}
                          alt={cat.title}
                          loading={i < 4 ? "eager" : "lazy"}
                          style={getImageTransformStyle(cat.imageTransform)}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      )}

                      {/* Subtle bottom gradient for readable title badge */}
                      <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/50 via-black/15 to-transparent pointer-events-none" />

                      {/* Compact Title Pill */}
                      <div className="absolute bottom-3 left-3 right-3 z-10 flex justify-center">
                        <div className="bg-white/95 backdrop-blur-sm px-3.5 py-1.5 rounded-full shadow-md max-w-full flex items-center gap-1.5 transition-transform group-hover:scale-105">
                          <span
                            className="font-black text-[10px] md:text-xs tracking-wider uppercase truncate text-slate-900"
                            style={textCls}
                          >
                            {cat.title}
                          </span>
                          <ArrowRight
                            className="w-3 h-3 shrink-0 transition-transform group-hover:translate-x-0.5 text-slate-700"
                            style={textCls}
                          />
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Scroll Progress Indicator Dots */}
        {scrollSnaps.length > 1 && (
          <div className="flex justify-center gap-2 mt-4 md:mt-6">
            {scrollSnaps.map((_, index) => (
              <button
                key={index}
                onClick={() => scrollTo(index)}
                className={cn(
                  "h-2 rounded-full transition-all duration-300",
                  selectedIndex === index
                    ? "bg-sky-500 w-6"
                    : "bg-slate-200 hover:bg-slate-300 w-2"
                )}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
