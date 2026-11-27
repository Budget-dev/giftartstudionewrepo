"use client";

import Link from 'next/link';
import { memo, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Product } from '@/lib/types';
import { Star } from 'lucide-react';
import { cacheProduct } from '@/lib/product-cache';
import { getOptimizedImageUrl, getImageTransformStyle } from '@/lib/image-optimizer';

interface ProductCardProps {
  product: Product;
}

export const ProductCard = memo(({ product }: ProductCardProps) => {
  useEffect(() => {
    cacheProduct(product);
  }, [product]);

  const rawImg = product.image || product.images?.[0] || 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?q=80&w=600&auto=format&fit=crop';

  return (
    <Link
      href={`/product?id=${product.id}`}
      as={`/product/${product.id}`}
      prefetch={false}
      onMouseEnter={() => cacheProduct(product)}
      onTouchStart={() => cacheProduct(product)}
      className="block h-full group"
    >
      <Card className="relative h-full overflow-hidden bg-white border-none shadow-sm hover:shadow-2xl transition-all duration-500 rounded-[1.8rem]">
        {/* Fixed 1:1 Square Edge-to-Edge Image Display (Zero Borders / Empty Space) */}
        <div className="relative aspect-square w-full overflow-hidden">
          <img
            src={getOptimizedImageUrl(rawImg, 550, 82)}
            alt={product.name || 'Product'}
            loading="lazy"
            style={getImageTransformStyle(product.imageTransform)}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          />

          <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

          {/* Badges */}
          {product.isBestSeller && (
            <div className="absolute top-3 left-3 bg-amber-500 text-white text-[8px] font-black px-2 py-1 rounded-full shadow-lg z-10 uppercase tracking-widest">
              BEST SELLER
            </div>
          )}
          {product.isNew && !product.isBestSeller && (
            <div className="absolute top-3 left-3 bg-sky-600 text-white text-[8px] font-black px-2 py-1 rounded-full shadow-lg z-10 uppercase tracking-widest">
              NEW
            </div>
          )}
        </div>

        {/* Content Section */}
        <CardContent className="p-4 sm:p-5 space-y-2.5 bg-white relative">
          <div className="space-y-1">
            <h4 className="font-black text-sm text-slate-800 leading-tight line-clamp-2 group-hover:text-blue-600 transition-colors">
              {product.name}
            </h4>
          </div>

          <div className="flex items-center justify-between pt-1">
            <div className="flex items-baseline gap-2">
              <span className="text-base font-black text-slate-800">₹{product.price.toLocaleString()}</span>
            </div>
            <div className="flex items-center gap-1">
              <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
              <span className="text-[10px] font-black text-slate-400">{(product.rating || 4.9).toFixed(1)}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
});

ProductCard.displayName = "ProductCard";
