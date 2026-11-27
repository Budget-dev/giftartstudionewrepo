'use client';

import React, { useCallback, useEffect, useState, useMemo } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import Link from 'next/link';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { useFirestore, useCollection } from '@/firebase';
import { collection, query, where, limit } from 'firebase/firestore';
import { Loader2 } from 'lucide-react';
import { cacheProduct, cacheProducts } from '@/lib/product-cache';
import { getOptimizedImageUrl } from '@/lib/image-optimizer';

interface MobileFestiveCarouselProps {
  cms?: any;
}

const DEFAULT_BANNER = "https://res.cloudinary.com/dwgnnr10/image/upload/v1785341862/festive-section-image-_zy2mxi.png";

export function MobileFestiveCarousel({ cms }: MobileFestiveCarouselProps) {
  const [emblaRef, emblaApi] = useEmblaCarousel({ 
    loop: true,
    align: 'start',
    skipSnaps: false
  });
  
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [scrollSnaps, setScrollSnaps] = useState<number[]>([]);

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

  const { data: products, loading } = useCollection<any>(festiveQuery, 'home_festive_mobile');

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

  const bannerUrl = getOptimizedImageUrl(cms?.bannerUrl || DEFAULT_BANNER, 800, 80);

  return (
    <section className="md:hidden py-10 bg-white overflow-hidden">
      <div className="container mx-auto px-4 space-y-8">
        
        {/* Top Festive Banner */}
        <div className="relative w-full aspect-[1.6/1] rounded-[20px] overflow-hidden shadow-lg">
          <div className="absolute inset-x-0 top-0 h-[145%]">
            <Image 
              src={bannerUrl} 
              alt="Festive Collection" 
              fill
              sizes="100vw"
              loading="lazy"
              className="object-cover object-top"
            />
          </div>
        </div>

        {/* Heading Area */}
        <div className="flex items-end justify-between px-2">
          <div className="space-y-0">
            <h2 className="text-[26px] font-black text-[#F57C00] leading-[1.1] tracking-tight">
              Checkout Festive season <br />
              Gifts Collection
            </h2>
          </div>
          <Link href="/shop/new/festive" className="text-sm font-bold text-[#7E22CE] mb-1">
            View All
          </Link>
        </div>

        {/* Product Carousel */}
        {loading ? (
          <div className="grid grid-cols-3 gap-2 py-2">
            {[0, 1, 2].map((idx) => (
              <div key={idx} className="bg-white rounded-[16px] overflow-hidden p-1.5 border border-amber-50 shadow-sm animate-pulse space-y-2">
                <div className="aspect-[4/5] w-full rounded-[12px] bg-amber-50" />
                <div className="h-3 w-3/4 bg-amber-100 rounded-full" />
                <div className="h-3 w-1/2 bg-slate-100 rounded-full" />
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
                      <div className="bg-white rounded-[16px] overflow-hidden shadow-[0_15px_40px_rgba(0,0,0,0.06)] h-full flex flex-col border border-slate-50">
                        <div className="relative aspect-[4/5] w-full bg-slate-50">
                          <Image 
                            src={getOptimizedImageUrl(p.image, 400)} 
                            alt={p.name} 
                            fill 
                            className="object-cover"
                            sizes="(max-width: 768px) 33vw, 200px"
                          />
                        </div>
                        <div className="p-2.5 space-y-1.5 flex-1 flex flex-col justify-between">
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

            {/* Dots Pagination */}
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
