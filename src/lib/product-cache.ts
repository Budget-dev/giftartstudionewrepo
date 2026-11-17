'use client';

/**
 * High-performance in-memory + sessionStorage product cache & preloader.
 * Guarantees instant 0ms load times when navigating to product detail pages.
 */

import { getOptimizedImageUrl } from '@/lib/image-optimizer';

// Fast in-memory map
const memoryCache = new Map<string, any>();
const preloadedImages = new Set<string>();

/**
 * Cache a single product and optionally preload its main hero image
 */
export function cacheProduct(product: any, preloadImage = true) {
  if (!product || !product.id) return;
  memoryCache.set(product.id, product);

  if (typeof window !== 'undefined') {
    try {
      sessionStorage.setItem(`gas_prod_${product.id}`, JSON.stringify(product));
    } catch (e) {
      // Ignore quota errors
    }

    if (preloadImage && product.image && !preloadedImages.has(product.image)) {
      preloadedImages.add(product.image);
      const optimizedUrl = getOptimizedImageUrl(product.image, 900);
      const img = new window.Image();
      img.src = optimizedUrl;
    }
  }
}

/**
 * Cache multiple products at once (e.g. from homepage or collections)
 */
export function cacheProducts(products: any[]) {
  if (!Array.isArray(products)) return;
  for (const p of products) {
    if (p && p.id) {
      memoryCache.set(p.id, p);
    }
  }

  if (typeof window !== 'undefined') {
    try {
      for (const p of products) {
        if (p && p.id) {
          sessionStorage.setItem(`gas_prod_${p.id}`, JSON.stringify(p));
        }
      }
    } catch (e) { }
  }
}

/**
 * Synchronously retrieve a product from memory or sessionStorage
 */
export function getCachedProduct(id: string): any | null {
  if (!id) return null;

  // 1. Check in-memory map (0ms synchronous lookup)
  if (memoryCache.has(id)) {
    return memoryCache.get(id);
  }

  // 2. Check sessionStorage
  if (typeof window !== 'undefined') {
    try {
      const item = sessionStorage.getItem(`gas_prod_${id}`);
      if (item) {
        const parsed = JSON.parse(item);
        memoryCache.set(id, parsed);
        return parsed;
      }
    } catch (e) { }
  }

  return null;
}
