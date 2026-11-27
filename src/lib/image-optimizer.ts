import type React from 'react';
import type { ImageTransform } from './types';

/**
 * CDN Image Optimizer for GiftArtStudio
 * Dynamically resizes, compresses, and converts images to next-gen WebP
 * reducing image payload by 80-95% for instant page rendering.
 */

export function getOptimizedImageUrl(
  url: string | undefined | null,
  width = 800,
  quality = 80
): string {
  if (!url) return 'https://placehold.co/800';
  if (url.startsWith('data:') || url.startsWith('blob:')) return url;

  // 1. Sirv CDN optimization
  if (url.includes('.sirv.com')) {
    const cleanUrl = url.split('?')[0];
    return `${cleanUrl}?w=${width}&q=${quality}&format=webp`;
  }

  // 2. Unsplash optimization
  if (url.includes('images.unsplash.com')) {
    const cleanUrl = url.split('?')[0];
    return `${cleanUrl}?auto=format&fit=crop&w=${width}&q=${quality}`;
  }

  // 3. Cloudinary optimization
  if (url.includes('res.cloudinary.com')) {
    return url.replace('/upload/', `/upload/w_${width},q_${quality},f_auto/`);
  }

  return url;
}

/**
 * Specifically optimized for gallery thumbnail previews (small footprint, ~4KB)
 */
export function getThumbnailImageUrl(url: string | undefined | null): string {
  return getOptimizedImageUrl(url, 160, 75);
}

/**
 * Returns inline CSS transform styling from a saved ImageTransform ({ zoom, x, y }).
 */
export function getImageTransformStyle(transform?: ImageTransform | null): React.CSSProperties {
  if (!transform) return {};
  const zoom = Number(transform.zoom) || 1;
  const x = Number(transform.x) || 0;
  const y = Number(transform.y) || 0;
  if (zoom === 1 && x === 0 && y === 0) return {};
  return {
    transform: `translate(${x}%, ${y}%) scale(${zoom})`,
    transformOrigin: 'center center',
  };
}

/**
 * Compresses an uploaded image File via offscreen Canvas to keep Firestore storage fast & small
 * while preserving crisp quality for web banners and 1:1 product cards.
 */
export function compressImageFile(
  file: File,
  maxDimension = 1400,
  quality = 0.84
): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Failed to read image file'));
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      if (!dataUrl) return reject(new Error('Empty file result'));

      const img = new window.Image();
      img.onerror = () => reject(new Error('Invalid image format'));
      img.onload = () => {
        let { width, height } = img;
        if (width > maxDimension || height > maxDimension) {
          if (width >= height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(dataUrl);
          return;
        }
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);

        // Prefer WebP if supported, fallback to JPEG
        let output = canvas.toDataURL('image/webp', quality);
        if (!output.startsWith('data:image/webp')) {
          output = canvas.toDataURL('image/jpeg', quality);
        }
        resolve(output);
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  });
}
