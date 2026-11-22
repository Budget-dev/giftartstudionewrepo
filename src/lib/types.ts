/**
 * @fileOverview Application-wide types and deterministic mock data.
 * Updated to support multiple images and consistent category mapping.
 */

export interface ProductSEO {
  title?: string;
  description?: string;
  keywords?: string;
  slug?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  canonicalUrl?: string;
  noIndex?: boolean;
}

export interface ProductColorVariant {
  name: string;
  hex: string;
  price?: number; // Colour-specific price (overrides product base price if set)
  oldPrice?: number; // Colour-specific original/strikethrough price
  images?: string[]; // Colour-specific photos
  stockStatus?: 'In Stock' | 'Low Stock' | 'Out of Stock';
  stock?: number;
}

export interface Product {
  id: string;
  name: string;
  subtitle?: string; // Short tagline under title
  description: string;
  price: number;
  oldPrice?: number;
  discount?: number;
  image: string; // Main featured image
  images: string[]; // Gallery images
  videoUrl?: string; // Product Reel or Demo Video
  imageHint: string;
  category: string;
  subcategory: string;
  rating: number;
  reviews: number;
  boughtCount?: string; // e.g. "349+"
  sku?: string; // e.g. "GAS-WB-KIDS-001"
  isNew?: boolean;
  isBestSeller?: boolean;
  inventoryStatus: 'In Stock' | 'Low Stock' | 'Out of Stock';
  stock?: number;
  couponCode?: string;
  couponDiscount?: number;
  colors?: ProductColorVariant[];
  sizes?: string[];
  capacities?: string[]; // e.g. ['500 ml', '750 ml']
  features?: string[];
  highlights?: string[]; // ✨ Product Highlights checklist
  specifications?: Record<string, string>; // e.g. { Capacity: '500 ml / 750 ml', Material: '...', ... }
  whatsInBox?: string[];
  careInstructions?: string[];
  personalizationTitle?: string; // e.g. "Personalize Your Bottle"
  personalizationLabel?: string; // e.g. "Name on Bottle *"
  personalizationMaxChars?: number; // e.g. 12
  personalizationOptions?: string[]; // Dropdown variants (fonts, charms, etc.)
  deliveryTime?: string; // e.g. "2 - 4 Days"
  createdAt?: any;
  updatedAt?: any;
  seo?: ProductSEO;
}

export interface CartItem extends Product {
  cartItemId?: string;
  quantity: number;
  selectedColor?: string;
  selectedSize?: string;
  selectedCapacity?: string;
  personalizationName?: string;
  personalizationOption?: string;
  variantImage?: string;
  variantPrice?: number;
}

export const CATEGORIES_MAP: Record<string, string[]> = {
  'new': ['new-collection', 'new-launch', 'best-sellers', 'festive'],
  'personalized-gifts': ['mugs', 'bottles', 'passport-covers', 'laptop-bags', 'travel-cases', 'travelling', 'corporate-gifts'],
  'kids': ['bags', 'water-bottles', 'lunch-boxes', 'kids-gifts', 'stationery', 'toys', 'umbrellas', 'combos', 'travelling'],
  'adults': ['mens', 'womens', 'unisex', 'travelling'],
  'accessories': ['bags', 'travel-combo', 'travelling', 'gift-boxes', 'desk', 'combos']
};

export const ALL_PRODUCTS: Product[] = [];
