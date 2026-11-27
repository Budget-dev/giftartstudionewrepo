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
  gstType?: 'percentage' | 'flat'; // 'percentage' (e.g. 18%) or 'flat' (e.g. ₹50)
  gstRate?: number; // GST rate percentage or flat rupees per unit
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
  gstType?: 'percentage' | 'flat';
  gstRate?: number;
  gstAmount?: number;
}

export interface BannerLayoutStyle {
  heightMode?: 'auto' | 'custom';
  heightPx?: number;
  widthMode?: 'full' | 'contained';
  objectFit?: 'cover' | 'contain' | 'fill';
  objectPosition?: 'center top' | 'center center' | 'center bottom' | 'left center' | 'right center';
  paddingTop?: number;
  paddingBottom?: number;
  paddingX?: number;
  bgColor?: string;
}

export interface Banner {
  id: string;
  imageUrl: string;
  mobileImageUrl?: string;
  title?: string;
  subHeading?: string;
  description?: string;
  primaryButtonText?: string;
  linkUrl?: string;
  order: number;
  active: boolean;
  desktopStyle?: BannerLayoutStyle;
  mobileStyle?: BannerLayoutStyle;
  createdAt?: any;
  updatedAt?: any;
}

export interface Artist {
  id: string;
  name: string;
  email: string;
  phone: string;
  city?: string;
  specialty?: string; // e.g. "Oil on Canvas, Acrylics, Resin Art"
  bio: string;
  avatarUrl?: string;
  portfolioUrl?: string;
  instagramUrl?: string;
  sampleImages?: string[];
  password?: string;
  status: 'pending_approval' | 'approved' | 'rejected';
  rejectionReason?: string;
  totalArtworks?: number;
  createdAt?: any;
  updatedAt?: any;
}

export interface Artwork {
  id: string;
  artistId: string;
  artistName: string;
  artistEmail: string;
  artistBio?: string;
  artistAvatar?: string;
  artistPortfolio?: string;
  artistCity?: string;
  title: string;
  medium: string; // e.g. "Oil on Canvas", "Acrylic", "Resin Art", "Charcoal & Pencil", "Handmade Decor"
  dimensions: string; // e.g. "24 × 36 inches", "A3 (11.7 × 16.5 in)"
  yearCreated?: string;
  description: string;
  imageUrl: string;
  additionalImages?: string[];
  suggestedPrice: number; // Artist's proposed price
  price: number; // Final selling price set & approved by Admin
  oldPrice?: number;
  status: 'pending_review' | 'published' | 'rejected';
  rejectionReason?: string;
  featured?: boolean;
  soldOut?: boolean;
  createdAt?: any;
  updatedAt?: any;
}

export const CATEGORIES_MAP: Record<string, string[]> = {
  'new': ['new-collection', 'new-launch', 'best-sellers', 'festive'],
  'personalized-gifts': ['mugs', 'bottles', 'passport-covers', 'laptop-bags', 'travel-cases', 'travelling', 'corporate-gifts', 'wall-clocks', 'diy'],
  'kids': ['bags', 'small-bags', 'big-bags', 'water-bottles', 'lunch-boxes', 'kids-gifts', 'stationery', 'toys', 'umbrellas', 'combos', 'travelling'],
  'adults': ['mens', 'womens', 'unisex', 'tumblers', 'travelling'],
  'corporate-gifts': ['executive-sets', 'diaries-pens', 'drinkware', 'desk-organizers', 'tech-accessories', 'gift-boxes', 'hampers', 'general'],
  'return-gifts': ['birthday-return-gifts', 'wedding-favors', 'party-favors', 'stationery-kits', 'pouches-bags', 'custom-mementos', 'general'],
  'lifestyle': ['bottles-tumblers', 'bags-organizers', 'wall-decor', 'wall-clocks', 'stationery', 'travel-essentials', 'home-decor', 'general'],
  'souvenirs': ['custom-plaques', 'keychains', 'photo-frames', 'mementos', 'travel-keepsakes', 'general'],
  'accessories': ['bags', 'small-bags', 'big-bags', 'laptop-sleeves', 'travel-combo', 'travelling', 'gift-boxes', 'desk', 'combos', 'general'],
  'pets': ['pet-bowls', 'pet-tags', 'pet-bands', 'pet-toys', 'pet-clothes', 'pet-accessories']
};

export const ALL_PRODUCTS: Product[] = [];
