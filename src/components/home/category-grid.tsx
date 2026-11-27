"use client";

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import useEmblaCarousel from 'embla-carousel-react';
import { ChevronLeft, ChevronRight, ArrowRight, Sparkles } from 'lucide-react';
import { getOptimizedImageUrl } from '@/lib/image-optimizer';

export interface CategoryCardItem {
  title: string;
  imageUrl: string;
  url: string;
  backgroundColor: string;
  borderColor?: string;
  textColor?: string;
}

const DEFAULT_MOCK = {
  title: "Shop by Category",
  cards: [
    { 
      title: 'DIY', 
      imageUrl: 'https://rohanwakkar.sirv.com/KIDS/Christmas%20Nativity%20DIY%20Kit/WhatsApp%20Image%202026-11-18%20at%203.00.54%20PM.jpeg', 
      url: '/shop/kids/kids-gifts', 
      backgroundColor: '#FEE2E2',
      borderColor: '#EF4444',
      textColor: '#DC2626'
    },
    { 
      title: 'Combos', 
      imageUrl: 'https://rohanwakkar.sirv.com/ChatGPT%20Image%20Jun%2019%2C%202026%2C%2009_08_49%20PM.png', 
      url: '/shop/kids/combos', 
      backgroundColor: '#B2EBF2',
      borderColor: '#00897B',
      textColor: '#00796B'
    },
    { 
      title: 'Corporate Gifts', 
      imageUrl: 'https://rohanwakkar.sirv.com/UNISEX/WhatsApp%20Image%202026-10-08%20at%203.57.56%20PM.jpeg', 
      url: '/shop/personalized-gifts/corporate-gifts', 
      backgroundColor: '#E0E7FF',
      borderColor: '#4F46E5',
      textColor: '#4338CA'
    },
    { 
      title: 'Wall Clocks', 
      imageUrl: 'https://rohanwakkar.sirv.com/KIDS/Kids%20Wall%20Hanging%20Organiser/WhatsApp%20Image%202026-11-18%20at%207.17.50%20PM%20(1).jpeg', 
      url: '/shop/personalized-gifts/wall-clocks', 
      backgroundColor: '#FEF3C7',
      borderColor: '#D97706',
      textColor: '#B45309'
    },
    { 
      title: 'Small Bags', 
      imageUrl: 'https://rohanwakkar.sirv.com/KIDS/Veigo%20Medium%20Stainless%20Steel%20Leakproof%20%26%20Airtight%20Lunch%20Box%20with%20Lid%20Lock/hfyhn.png', 
      url: '/shop/kids/small-bags', 
      backgroundColor: '#FCE7F3',
      borderColor: '#DB2777',
      textColor: '#BE185D'
    },
    { 
      title: 'Big Bags', 
      imageUrl: 'https://rohanwakkar.sirv.com/toneed.png', 
      url: '/shop/kids/big-bags', 
      backgroundColor: '#F8BBD0',
      borderColor: '#E11D48',
      textColor: '#BE123C'
    },
    { 
      title: 'Laptop Sleeves', 
      imageUrl: 'https://rohanwakkar.sirv.com/KIDS/Christmas%20A5%20Diary%20%26%20Pen%20Set/WhatsApp%20Image%202026-11-19%20at%203.13.08%20PM.jpeg', 
      url: '/shop/personalized-gifts/laptop-sleeves', 
      backgroundColor: '#EDE9FE',
      borderColor: '#7C3AED',
      textColor: '#6D28D9'
    },
    { 
      title: 'Tumblers', 
      imageUrl: 'https://rohanwakkar.sirv.com/UNISEX/WhatsApp%20Image%202026-10-06%20at%206.13.06%20PM%20(1).jpeg', 
      url: '/shop/adults/tumblers', 
      backgroundColor: '#CCFBF1',
      borderColor: '#0D9488',
      textColor: '#0F766E'
    },
    { 
      title: 'Bottles', 
      imageUrl: 'https://rohanwakkar.sirv.com/ChatGPT%20Image%20Jun%2019%2C%202026%2C%2009_00_07%20PM.png', 
      url: '/shop/kids/water-bottles', 
      backgroundColor: '#BBDEFB',
      borderColor: '#0284C7',
      textColor: '#0369A1'
    },
    { 
      title: 'Umbrellas', 
      imageUrl: 'https://rohanwakkar.sirv.com/ChatGPT%20Image%20Jun%2019%2C%202026%2C%2009_05_54%20PM.png', 
      url: '/shop/kids/umbrellas', 
      backgroundColor: '#F3E5F5',
      borderColor: '#9333EA',
      textColor: '#7E22CE'
    },
  ]
};

export function CategoryGrid({ cms }: { cms?: any }) {
  const data = cms || DEFAULT_MOCK;
  const cards: CategoryCardItem[] = data.cards || DEFAULT_MOCK.cards;

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

  const onInit = useCallback((emblaApi: any) => {
    setScrollSnaps(emblaApi.scrollSnapList());
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
        
        {/* Header with Title and Left/Right Slider Controls */}
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

          {/* Slider Arrow Controls (Available for both Mobile & Desktop) */}
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

        {/* Horizontal Slider (Embla Carousel for all screen sizes) */}
        <div className="relative">
          {/* Floating Left Arrow (Desktop Only) */}
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

          {/* Floating Right Arrow (Desktop Only) */}
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

          {/* Carousel Viewport */}
          <div className="overflow-hidden -mx-4 px-4 sm:mx-0 sm:px-0" ref={emblaRef}>
            <div className="flex -ml-3.5 sm:-ml-4 md:-ml-6 pb-6 pt-2">
              {cards.map((cat, i) => {
                const borderCls = cat.borderColor ? { borderColor: cat.borderColor } : {};
                const textCls = cat.textColor ? { color: cat.textColor } : {};

                return (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, scale: 0.95 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.03, duration: 0.4 }}
                    viewport={{ once: true }}
                    className="flex-[0_0_66%] sm:flex-[0_0_46%] md:flex-[0_0_30%] lg:flex-[0_0_22%] min-w-0 pl-3.5 sm:pl-4 md:pl-6 group relative select-none"
                  >
                    <Link 
                      href={cat.url || '#'}
                      className={cn(
                        "block rounded-[2.2rem] md:rounded-[3rem] aspect-[3/3.7] sm:aspect-[3/3.6] relative transition-all duration-500 hover:shadow-2xl border-4 border-white shadow-md overflow-hidden group"
                      )}
                      style={{ backgroundColor: cat.backgroundColor || '#F1F5F9' }}
                    >
                      {/* Top Category Badge with Arrow Indicator */}
                      <div className="absolute top-3.5 sm:top-4 left-1/2 -translate-x-1/2 z-10 w-full px-2 flex justify-center">
                        <div 
                          className="bg-white/95 backdrop-blur-sm border-[1.5px] px-3 py-1 rounded-full text-center shadow-xs max-w-[92%] flex items-center gap-1.5 transition-all group-hover:bg-white group-hover:scale-105"
                          style={borderCls}
                        >
                          <span 
                            className="font-black text-[10px] md:text-xs tracking-wider uppercase block truncate"
                            style={textCls}
                          >
                            {cat.title}
                          </span>
                          <ArrowRight 
                            className="w-3 h-3 shrink-0 transition-transform group-hover:translate-x-0.5" 
                            style={textCls}
                          />
                        </div>
                      </div>

                      {/* Product Category Cutout / Preview Image */}
                      {cat.imageUrl && (
                        <div className="absolute -bottom-4 sm:-bottom-6 md:-bottom-8 left-1/2 -translate-x-1/2 w-[105%] sm:w-[110%] h-[82%] sm:h-[86%] transition-all duration-500 group-hover:scale-108 group-hover:-translate-y-1.5 origin-bottom pointer-events-none">
                          <Image 
                            src={getOptimizedImageUrl(cat.imageUrl, 400, 80)} 
                            alt={cat.title} 
                            fill 
                            sizes="(max-width: 640px) 66vw, (max-width: 1024px) 30vw, 22vw"
                            loading={i < 4 ? "eager" : "lazy"}
                            className="object-contain object-bottom drop-shadow-[0_15px_15px_rgba(0,0,0,0.18)]"
                          />
                        </div>
                      )}
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
