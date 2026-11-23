'use client';

import { useState, useMemo, useEffect } from 'react';
import Image from 'next/image';
import {
  Star,
  ShoppingCart,
  Zap,
  Heart,
  Truck,
  Plus,
  Minus,
  Pencil,
  CheckCircle2,
  Loader2,
  Play,
  ChevronRight,
  Droplet,
  Leaf,
  Shield,
  Thermometer,
  Gift,
  Sparkles,
  Package,
  Flame,
  Scale,
  Ruler,
  Users,
  Layers,
  Milk,
  Check
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Product } from '@/lib/types';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { useCart } from '@/lib/store/cart-context';
import { useRouter } from 'next/navigation';
import useEmblaCarousel from 'embla-carousel-react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { motion, AnimatePresence } from 'framer-motion';
import { useUser, useFirestore } from '@/firebase';
import { collection, query, where, getDocs, addDoc, deleteDoc, doc } from 'firebase/firestore';
import { getOptimizedImageUrl, getThumbnailImageUrl } from '@/lib/image-optimizer';

interface ProductDetailsProps {
  product: Product;
}

export function ProductDetails({ product }: ProductDetailsProps) {
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [personalizationName, setPersonalizationName] = useState('');
  const [selectedVariantOption, setSelectedVariantOption] = useState('');
  const [selectedColor, setSelectedColor] = useState<string>('');
  const [selectedCapacity, setSelectedCapacity] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'description' | 'specifications' | 'box' | 'care'>('description');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isVideoOpen, setIsVideoOpen] = useState(false);

  const { toast } = useToast();
  const { addToCart } = useCart();
  const router = useRouter();

  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true, align: 'start' });

  const { user } = useUser();
  const db = useFirestore();
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [wishlistDocId, setWishlistDocId] = useState<string | null>(null);

  // Fallbacks and derived attributes
  const colors = useMemo(() => {
    if (product.colors && product.colors.length > 0) return product.colors;
    return [
      { name: 'Purple', hex: '#9333ea' },
      { name: 'Pink', hex: '#f472b6' },
      { name: 'Sky Blue', hex: '#38bdf8' },
      { name: 'Mint Green', hex: '#4ade80' }
    ];
  }, [product.colors]);

  const capacities = useMemo(() => {
    if (product.capacities && product.capacities.length > 0) return product.capacities;
    if (product.sizes && product.sizes.length > 0) return product.sizes;
    return ['500 ml', '750 ml'];
  }, [product.capacities, product.sizes]);

  const personalizationDropdownOptions = useMemo(() => {
    if (product.personalizationOptions && product.personalizationOptions.length > 0) {
      return product.personalizationOptions.map(opt =>
        opt.replace(/^Font\s*Style:\s*/i, '')
           .replace(/^Icon\s*Charm:\s*/i, '')
           .replace(/\bFont\b/gi, '')
           .replace(/\bCharm\b/gi, '')
           .replace(/\s{2,}/g, ' ')
           .trim()
      ).filter(Boolean);
    }
    return [
      'Playful Comic',
      'Elegant Cursive',
      'Modern Bold',
      'Star / Magic',
      'Unicorn / Dino'
    ];
  }, [product.personalizationOptions]);

  const highlights = useMemo(() => {
    if (product.highlights && product.highlights.length > 0) return product.highlights;
    return [
      "Personalized with your child's name",
      "Leak-proof and spill-proof lid",
      "BPA-free, food-grade material",
      "Lightweight, durable and kid-friendly",
      "Available in multiple colours and fun designs",
      "Perfect for school, travel, sports and daily use"
    ];
  }, [product.highlights]);

  const specifications = useMemo(() => {
    if (product.specifications && Object.keys(product.specifications).length > 0) {
      return product.specifications;
    }
    return {
      'Capacity': capacities.join(' / '),
      'Material': 'Food-grade, BPA-Free (PP + Tritan)',
      'Weight': '~ 210 g (500 ml)',
      'Dimensions': '7.2 × 22 cm (500 ml)',
      'Age Group': '3+ Years'
    };
  }, [product.specifications, capacities]);

  const whatsInBox = useMemo(() => {
    if (product.whatsInBox && product.whatsInBox.length > 0) return product.whatsInBox;
    return [
      `1 × ${product.name}`,
      '1 × Spill-Proof Lid & Straw Cap',
      '1 × Soft Cleaning Sponge Brush',
      '1 × GiftArtStudio Care & Warranty Guide'
    ];
  }, [product.whatsInBox, product.name]);

  const careInstructions = useMemo(() => {
    if (product.careInstructions && product.careInstructions.length > 0) return product.careInstructions;
    return [
      'Hand wash recommended to preserve custom prints and vibrant colours',
      'Do not place in microwave oven or direct deep freezer',
      'Wash thoroughly with mild soap and warm water before initial use',
      'Store with lid open to ensure complete ventilation and drying'
    ];
  }, [product.careInstructions]);

  // Set default variants
  useEffect(() => {
    if (colors.length > 0 && !selectedColor) {
      setSelectedColor(colors[0].name);
    }
  }, [colors, selectedColor]);

  useEffect(() => {
    if (capacities.length > 0 && !selectedCapacity) {
      setSelectedCapacity(capacities[0]);
    }
  }, [capacities, selectedCapacity]);

  // Check wishlist
  useEffect(() => {
    async function checkWishlist() {
      if (!user) {
        const savedWishlist = localStorage.getItem('giftart_wishlist');
        if (savedWishlist && product.id) {
          try {
            const items = JSON.parse(savedWishlist);
            const found = items.find((item: any) => item.productId === product.id);
            if (found) {
              setIsWishlisted(true);
              setWishlistDocId(found.id);
            } else {
              setIsWishlisted(false);
              setWishlistDocId(null);
            }
          } catch (e) {
            console.error('Failed to parse guest wishlist', e);
          }
        }
        return;
      }

      if (!db || !product.id) return;
      try {
        const q = query(
          collection(db, 'wishlist'),
          where('userId', '==', user.uid),
          where('productId', '==', product.id)
        );
        const snapshot = await getDocs(q);
        if (!snapshot.empty) {
          setIsWishlisted(true);
          setWishlistDocId(snapshot.docs[0].id);
        } else {
          setIsWishlisted(false);
          setWishlistDocId(null);
        }
      } catch (err) {
        console.error("Error checking wishlist: ", err);
      }
    }
    checkWishlist();
  }, [db, user, product.id]);

  const handleToggleWishlist = async () => {
    if (!user) {
      try {
        const savedWishlist = localStorage.getItem('giftart_wishlist') || '[]';
        let items = JSON.parse(savedWishlist);
        const index = items.findIndex((item: any) => item.productId === product.id);

        if (index > -1) {
          items.splice(index, 1);
          localStorage.setItem('giftart_wishlist', JSON.stringify(items));
          setIsWishlisted(false);
          setWishlistDocId(null);
          toast({
            title: "Removed from Wishlist",
            description: `${product.name} removed from your wishlist.`
          });
        } else {
          const newId = `local_${Date.now()}`;
          const newItem = {
            id: newId,
            productId: product.id,
            name: product.name,
            price: product.price,
            image: product.image,
            addedAt: new Date().toISOString()
          };
          items.push(newItem);
          localStorage.setItem('giftart_wishlist', JSON.stringify(items));
          setIsWishlisted(true);
          setWishlistDocId(newId);
          toast({
            title: "Saved to Wishlist",
            description: `${product.name} is now saved in your wishlist.`
          });
        }
      } catch (err) {
        console.error('Error toggling guest wishlist: ', err);
      }
      return;
    }
    if (!db) return;

    try {
      if (isWishlisted && wishlistDocId) {
        await deleteDoc(doc(db, 'wishlist', wishlistDocId));
        setIsWishlisted(false);
        setWishlistDocId(null);
        toast({
          title: "Removed from Wishlist",
          description: `${product.name} removed from your wishlist.`
        });
      } else {
        const newDoc = await addDoc(collection(db, 'wishlist'), {
          userId: user.uid,
          productId: product.id,
          name: product.name,
          price: product.price,
          image: product.image,
          addedAt: new Date()
        });
        setIsWishlisted(true);
        setWishlistDocId(newDoc.id);
        toast({
          title: "Saved to Wishlist",
          description: `${product.name} added to your wishlist.`
        });
      }
    } catch (err) {
      console.error("Error toggling wishlist: ", err);
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive"
      });
    }
  };

  const activeColorObj = useMemo(() => {
    return colors.find(c => c.name.toLowerCase() === (selectedColor || '').toLowerCase()) || (colors.length > 0 ? colors[0] : null);
  }, [colors, selectedColor]);

  // Gallery images dynamically switches to color-specific photos when available!
  const galleryImages = useMemo(() => {
    if (activeColorObj && (activeColorObj as any).images && (activeColorObj as any).images.length > 0) {
      return (activeColorObj as any).images;
    }
    const list = product.images?.length ? product.images : [product.image];
    if (!list.length) return ['https://placehold.co/800'];
    return list;
  }, [product, activeColorObj]);

  const isOutOfStock = useMemo(() => {
    if (product.inventoryStatus === 'Out of Stock') return true;
    if (activeColorObj && (activeColorObj as any).stockStatus === 'Out of Stock') return true;
    return false;
  }, [product.inventoryStatus, activeColorObj]);

  const isLowStock = useMemo(() => {
    if (product.inventoryStatus === 'Low Stock') return true;
    if (activeColorObj && (activeColorObj as any).stockStatus === 'Low Stock') return true;
    return false;
  }, [product.inventoryStatus, activeColorObj]);

  // Dynamic price calculation based on selected colour variant if that colour has its own pricing
  const currentPrice = useMemo(() => {
    if (activeColorObj && (activeColorObj as any).price && Number((activeColorObj as any).price) > 0) {
      return Number((activeColorObj as any).price);
    }
    return product.price || 0;
  }, [activeColorObj, product.price]);

  const currentOldPrice = useMemo(() => {
    if (activeColorObj && (activeColorObj as any).oldPrice && Number((activeColorObj as any).oldPrice) > 0) {
      return Number((activeColorObj as any).oldPrice);
    }
    if (activeColorObj && (activeColorObj as any).price && Number((activeColorObj as any).price) > 0) {
      return Math.round(Number((activeColorObj as any).price) * 1.3);
    }
    return product.oldPrice || Math.round((product.price || 0) * 1.3);
  }, [activeColorObj, product.oldPrice, product.price]);

  const discountPercentage = useMemo(() => {
    if (currentOldPrice && currentOldPrice > currentPrice) {
      return Math.round(((currentOldPrice - currentPrice) / currentOldPrice) * 100);
    }
    return 30; // fallback aesthetic badge
  }, [currentPrice, currentOldPrice]);

  const skuCode = useMemo(() => {
    if (product.sku) return product.sku;
    const catCode = (product.category || 'GAS').replace(/[^a-zA-Z]/g, '').slice(0, 3).toUpperCase();
    const subCode = (product.subcategory || 'WB').replace(/[^a-zA-Z]/g, '').slice(0, 4).toUpperCase();
    const idCode = (product.id || '001').slice(-3).toUpperCase();
    return `GAS-${catCode}-${subCode}-${idCode}`;
  }, [product.sku, product.category, product.subcategory, product.id]);

  const maxChars = product.personalizationMaxChars || 12;

  const handleSelectColor = (colorName: string) => {
    setSelectedColor(colorName);
    setSelectedImage(0); // Immediately switch main photo to the first image of this color
  };

  const handleAddToCart = () => {
    if (isOutOfStock) {
      toast({ variant: 'destructive', title: 'Out of Stock', description: 'This item/colour is currently out of stock.' });
      return;
    }
    const colorPhoto = (activeColorObj && (activeColorObj as any).images && (activeColorObj as any).images[0]) || product.image;
    const variantEffectivePrice = currentPrice;

    addToCart(
      {
        ...product,
        price: variantEffectivePrice,
        oldPrice: currentOldPrice
      }, 
      quantity, 
      { 
        personalizationName,
        selectedColor,
        selectedCapacity,
        personalizationOption: selectedVariantOption,
        variantImage: colorPhoto,
        variantPrice: variantEffectivePrice,
        gstType: product.gstType || 'percentage',
        gstRate: Number(product.gstRate) || 0
      }
    );
    toast({ 
      title: "Added to Bag!", 
      description: `${product.name} (${selectedColor || ''} • ₹${variantEffectivePrice.toLocaleString()}) added to your cart.` 
    });
  };

  const handleBuyNow = async () => {
    if (isOutOfStock) {
      toast({ variant: 'destructive', title: 'Out of Stock', description: 'This item/colour is currently out of stock.' });
      return;
    }
    setIsProcessing(true);
    const colorPhoto = (activeColorObj && (activeColorObj as any).images && (activeColorObj as any).images[0]) || product.image;
    const variantEffectivePrice = currentPrice;

    addToCart(
      {
        ...product,
        price: variantEffectivePrice,
        oldPrice: currentOldPrice
      }, 
      quantity, 
      { 
        personalizationName,
        selectedColor,
        selectedCapacity,
        personalizationOption: selectedVariantOption,
        variantImage: colorPhoto,
        variantPrice: variantEffectivePrice,
        gstType: product.gstType || 'percentage',
        gstRate: Number(product.gstRate) || 0
      }
    );
    setTimeout(() => router.push('/checkout'), 350);
  };

  const onThumbClick = (idx: number) => {
    setSelectedImage(idx);
    emblaApi?.scrollTo(idx);
  };

  useEffect(() => {
    if (!emblaApi) return;
    emblaApi.on('select', () => {
      setSelectedImage(emblaApi.selectedScrollSnap());
    });
  }, [emblaApi]);

  const subtitleText = product.subtitle ||
    `A cute, durable and leak-proof ${product.name.toLowerCase()} with your child's name – perfect for school, travel and everyday use.`;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 md:py-6">
      <div className="grid lg:grid-cols-12 gap-8 lg:gap-14 items-start">

        {/* Visual Column: Image Gallery */}
        <div className="lg:col-span-6 flex flex-col gap-4">
          <div className="relative group rounded-3xl overflow-hidden bg-[#e6f4f1] border border-slate-100 shadow-sm aspect-square flex items-center justify-center">

            {/* Top Badges */}
            <div className="absolute top-4 left-4 flex flex-col gap-1.5 z-20">
              {product.isBestSeller !== false && (
                <div className="bg-[#f59e0b] text-white text-[10px] font-black px-3 py-1 rounded-full shadow-md uppercase tracking-wider">
                  BEST SELLER
                </div>
              )}
              {product.isNew && (
                <div className="bg-[#0ea5e9] text-white text-[10px] font-black px-3 py-1 rounded-full shadow-md uppercase tracking-wider">
                  NEW
                </div>
              )}
            </div>

            {/* Video Reel Trigger if Available */}
            {product.videoUrl && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsVideoOpen(true)}
                className="absolute top-4 right-4 bg-white/95 backdrop-blur-md px-3.5 py-1.5 rounded-full shadow-md flex items-center gap-1.5 hover:bg-white transition-all z-20"
              >
                <div className="w-5 h-5 bg-[#5f259f] rounded-full flex items-center justify-center text-white">
                  <Play className="h-2.5 w-2.5 fill-white ml-0.5" />
                </div>
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-800">Watch Reel</span>
              </motion.button>
            )}

            {/* Carousel Viewport */}
            <div className="w-full h-full overflow-hidden" ref={emblaRef}>
              <div className="flex h-full">
                {galleryImages.map((img, i) => (
                  <div key={i} className="relative flex-[0_0_100%] min-w-0 h-full p-4 md:p-6 flex items-center justify-center">
                    <div className="relative w-full h-full">
                      <Image
                        src={getOptimizedImageUrl(img, 900)}
                        alt={`${product.name} view ${i + 1}`}
                        fill
                        className="object-contain transition-transform duration-700 group-hover:scale-105"
                        priority={i === 0}
                        sizes="(max-width: 1024px) 100vw, 50vw"
                        unoptimized
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Carousel Dots */}
            {galleryImages.length > 1 && (
              <div className="absolute bottom-4 left-0 right-0 flex justify-center items-center gap-1.5 z-20">
                {galleryImages.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => onThumbClick(i)}
                    aria-label={`Go to slide ${i + 1}`}
                    className={cn(
                      "transition-all duration-300 rounded-full",
                      selectedImage === i
                        ? "w-6 h-1.5 bg-[#0ea5e9]"
                        : "w-1.5 h-1.5 bg-slate-300 hover:bg-slate-400"
                    )}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Thumbnails Row */}
          {galleryImages.length > 1 && (
            <div className="flex gap-2.5 overflow-x-auto pb-2 scrollbar-hide">
              {galleryImages.map((img, i) => (
                <button
                  key={i}
                  onClick={() => onThumbClick(i)}
                  className={cn(
                    "relative w-16 h-16 rounded-xl overflow-hidden border-2 bg-slate-50 shrink-0 transition-all",
                    selectedImage === i
                      ? "border-[#5f259f] ring-2 ring-[#e9c9f2] shadow-sm scale-95"
                      : "border-slate-200 opacity-70 hover:opacity-100"
                  )}
                >
                  <Image
                    src={getThumbnailImageUrl(img)}
                    alt={`Thumb ${i + 1}`}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Info Column: Details & Purchase */}
        <div className="lg:col-span-6 space-y-5">

          {/* Category Pill */}
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#f3e8ff] text-[#7e22ce] rounded-full text-xs font-bold tracking-wide">
              <Sparkles className="h-3 w-3 text-[#9333ea]" />
              <span>{product.category || 'Kids Water Bottle'}</span>
              {product.subcategory && (
                <>
                  <span className="text-[#c084fc]">•</span>
                  <span>{product.subcategory.replace(/-/g, ' ')}</span>
                </>
              )}
            </div>
          </div>

          {/* Product Title */}
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight leading-snug">
            {product.name}
          </h1>

          {/* Tagline / Subtitle */}
          <p className="text-xs sm:text-sm text-slate-600 font-normal leading-relaxed">
            {subtitleText}
          </p>

          {/* Rating & Social Proof Row */}
          <div className="flex flex-wrap items-center gap-3 text-xs sm:text-sm text-slate-700">
            <div className="flex items-center gap-1 font-bold">
              <Star className="h-4 w-4 fill-[#f59e0b] text-[#f59e0b]" />
              <span>{product.rating?.toFixed(1) || '5.0'}</span>
              <span className="text-slate-400 font-medium">({product.reviews || 128} Reviews)</span>
            </div>

            <span className="text-slate-300">|</span>

            <div className="flex items-center gap-1.5 font-semibold text-slate-800">
              <Flame className="h-4 w-4 text-[#ef4444] fill-[#ef4444]" />
              <span><span className="font-bold text-[#ef4444]">{product.boughtCount || '349+'}</span> Bought this month</span>
            </div>
          </div>

          {/* Price & Stock / SKU Row */}
          <div className="flex items-center justify-between pt-1 pb-1 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <span className="text-3xl sm:text-4xl font-extrabold text-slate-900">
                ₹{currentPrice.toLocaleString()}
              </span>
              {currentOldPrice > currentPrice && (
                <span className="text-lg sm:text-xl text-slate-400 line-through font-medium">
                  ₹{currentOldPrice.toLocaleString()}
                </span>
              )}
              {discountPercentage > 0 && (
                <span className="bg-[#fee2e2] text-[#ef4444] font-bold text-xs px-2.5 py-1 rounded-md">
                  {discountPercentage}% OFF
                </span>
              )}
            </div>

            <div className="text-right space-y-0.5">
              {isOutOfStock ? (
                <div className="text-xs font-bold text-rose-600 flex items-center justify-end gap-1">
                  <span className="w-2 h-2 rounded-full bg-rose-500 inline-block"></span>
                  Out of Stock
                </div>
              ) : isLowStock ? (
                <div className="text-xs font-bold text-amber-600 flex items-center justify-end gap-1">
                  <span className="w-2 h-2 rounded-full bg-amber-500 inline-block animate-ping"></span>
                  Only Few Left!
                </div>
              ) : (
                <div className="text-xs font-bold text-emerald-600 flex items-center justify-end gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse"></span>
                  In Stock
                </div>
              )}
              <div className="text-[10px] text-slate-400 font-mono font-medium">
                SKU: {skuCode}
              </div>
            </div>
          </div>

          {/* Personalization Container */}
          <div className="bg-[#faf5ff] border border-[#e9d5ff] rounded-2xl p-4 sm:p-5 space-y-3.5 shadow-sm">
            <div className="flex items-center gap-2 text-[#5f259f] font-bold text-sm">
              <Pencil className="h-4 w-4 text-[#5f259f]" />
              <span>
                {product.personalizationTitle ||
                  (product.name?.toLowerCase().includes('bottle')
                    ? 'Personalize Your Bottle'
                    : product.name?.toLowerCase().includes('lunch')
                    ? 'Personalize Your Lunch Box'
                    : `Personalize Your ${product.name ? product.name.split(' ')[0] : 'Item'}`)}
              </span>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 block">
                {product.personalizationLabel ||
                  (product.name?.toLowerCase().includes('bottle')
                    ? 'Name on Bottle *'
                    : product.name?.toLowerCase().includes('lunch')
                    ? 'Name on Lunch Box *'
                    : 'Name on Item *')}
              </label>
              <div className="relative">
                <input
                  type="text"
                  maxLength={maxChars}
                  value={personalizationName}
                  onChange={(e) => setPersonalizationName(e.target.value.toUpperCase())}
                  placeholder="e.g. TRISHA"
                  className="w-full bg-white border border-[#d8b4fe] rounded-xl px-3.5 py-2.5 text-sm font-semibold tracking-wide text-slate-800 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-[#9333ea] pr-16 uppercase transition-all"
                />
                <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-medium">
                  {personalizationName.length} / {maxChars}
                </span>
              </div>
            </div>

            {/* Dropdown Variant Selector */}
            <div className="space-y-1.5">
              <div className="relative">
                <select
                  value={selectedVariantOption}
                  onChange={(e) => setSelectedVariantOption(e.target.value)}
                  className="w-full bg-white border border-[#d8b4fe] rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#9333ea] appearance-none pr-8 cursor-pointer transition-all"
                >
                  <option value="">• Please Select Style / Design •</option>
                  {personalizationDropdownOptions.map((opt, i) => (
                    <option key={i} value={opt}>{opt}</option>
                  ))}
                </select>
                <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 text-xs">
                  ▼
                </div>
              </div>
            </div>
          </div>

          {/* Color & Capacity Selectors */}
          <div className="grid grid-cols-2 gap-4 pt-1">
            {/* Color Swatches */}
            <div className="space-y-2">
              <div className="text-xs font-semibold text-slate-700 flex items-center justify-between">
                <div>
                  Colour: <span className="font-bold text-slate-900">{selectedColor || colors[0]?.name}</span>
                </div>
                {activeColorObj && (activeColorObj as any).price && Number((activeColorObj as any).price) > 0 && (
                  <span className="text-[11px] font-extrabold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full border border-purple-200">
                    ₹{Number((activeColorObj as any).price).toLocaleString()}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2.5 flex-wrap">
                {colors.map((c) => {
                  const isSelected = (selectedColor || colors[0]?.name) === c.name;
                  const hasColorImages = Array.isArray((c as any).images) && (c as any).images.length > 0;
                  const customPrice = (c as any).price && Number((c as any).price) > 0 ? Number((c as any).price) : null;
                  return (
                    <button
                      key={c.name}
                      type="button"
                      onClick={() => handleSelectColor(c.name)}
                      title={`${c.name}${customPrice ? ` - ₹${customPrice.toLocaleString()}` : ''}${hasColorImages ? ` (${(c as any).images.length} photos)` : ''}`}
                      style={{ backgroundColor: c.hex }}
                      className={cn(
                        "w-8 h-8 rounded-full transition-transform shadow-sm relative flex items-center justify-center",
                        isSelected
                          ? "ring-2 ring-offset-2 ring-[#5f259f] scale-110"
                          : "hover:scale-105 opacity-90"
                      )}
                    >
                      {isSelected && (
                        <Check className="w-3.5 h-3.5 text-white drop-shadow-md stroke-[3]" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Capacity Pills */}
            <div className="space-y-2">
              <div className="text-xs font-semibold text-slate-700">
                Capacity:
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                {capacities.map((cap) => {
                  const isSelected = (selectedCapacity || capacities[0]) === cap;
                  return (
                    <button
                      key={cap}
                      type="button"
                      onClick={() => setSelectedCapacity(cap)}
                      className={cn(
                        "px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all border",
                        isSelected
                          ? "border-[#5f259f] bg-[#f5e6fb] text-[#5f259f] shadow-sm"
                          : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
                      )}
                    >
                      {cap}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Quantity & CTA Buttons */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center gap-3">
              {/* Quantity Counter */}
              <div className="flex items-center border border-slate-200 rounded-xl bg-white px-2 py-1 shrink-0">
                <button
                  type="button"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="p-1.5 text-slate-500 hover:text-slate-800 transition-colors"
                  aria-label="Decrease quantity"
                >
                  <Minus className="h-3.5 w-3.5" />
                </button>
                <span className="w-8 text-center text-sm font-bold text-slate-900">
                  {quantity}
                </span>
                <button
                  type="button"
                  onClick={() => setQuantity(quantity + 1)}
                  className="p-1.5 text-slate-500 hover:text-slate-800 transition-colors"
                  aria-label="Increase quantity"
                >
                  <Plus className="h-3.5 w-3.5" />
                </button>
              </div>

              {/* Buy Now Gradient Button */}
              <Button
                type="button"
                onClick={handleBuyNow}
                disabled={isProcessing || isOutOfStock}
                className={cn(
                  "flex-1 h-12 rounded-xl text-white font-extrabold text-sm sm:text-base tracking-wide uppercase shadow-md transition-all flex items-center justify-center gap-2 border border-white/20",
                  isOutOfStock
                    ? "bg-slate-400 cursor-not-allowed opacity-75"
                    : "bg-gradient-to-r from-[#5f259f] via-[#7c3aed] to-[#ec4899] hover:from-[#4a1b7e] hover:to-[#db2777] active:scale-95 hover:shadow-lg"
                )}
              >
                {isProcessing ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : isOutOfStock ? (
                  <span>OUT OF STOCK</span>
                ) : (
                  <>
                    <Zap className="h-4 w-4 fill-white" />
                    <span>BUY NOW</span>
                    <ChevronRight className="h-4 w-4" />
                  </>
                )}
              </Button>
            </div>

            {/* Add to Cart & Wishlist Row */}
            <div className="flex items-center gap-3">
              <Button
                type="button"
                onClick={handleAddToCart}
                disabled={isOutOfStock}
                variant="outline"
                className={cn(
                  "flex-1 h-11 rounded-xl border-2 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all",
                  isOutOfStock
                    ? "border-slate-200 text-slate-400 cursor-not-allowed bg-slate-50"
                    : "border-2 border-slate-200 hover:border-[#5f259f] hover:bg-[#faf5ff] text-slate-800 hover:text-[#5f259f]"
                )}
              >
                <ShoppingCart className="h-4 w-4 text-[#5f259f]" />
                <span>{isOutOfStock ? 'OUT OF STOCK' : 'ADD TO CART'}</span>
              </Button>

              <Button
                type="button"
                onClick={handleToggleWishlist}
                variant="outline"
                aria-label="Toggle wishlist"
                className={cn(
                  "w-11 h-11 rounded-xl border-2 flex items-center justify-center transition-all shrink-0",
                  isWishlisted
                    ? "border-rose-200 bg-rose-50 text-rose-500 hover:bg-rose-100"
                    : "border-slate-200 bg-white text-slate-400 hover:text-rose-500 hover:border-rose-200"
                )}
              >
                <Heart className={cn("h-5 w-5", isWishlisted && "fill-rose-500 text-rose-500")} />
              </Button>
            </div>
          </div>

          {/* Estimated Delivery Box */}
          <div className="bg-[#faf5ff] border border-purple-100 rounded-2xl p-4 flex items-center justify-between shadow-xs">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white border border-purple-200 flex items-center justify-center text-[#5f259f] shrink-0">
                <Truck className="h-5 w-5 text-[#5f259f]" />
              </div>
              <div>
                <div className="text-xs sm:text-sm font-bold text-slate-900">
                  Estimated Delivery: {product.deliveryTime || '2 – 4 Days'}
                </div>
                <div className="text-[11px] text-slate-500 font-medium">
                  100% Free Shipping on All Orders across India
                </div>
              </div>
            </div>
            <ChevronRight className="h-4 w-4 text-purple-400 shrink-0" />
          </div>

          {/* 5 Feature Badges (Grid) */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-1">
            <div className="bg-white border border-purple-100 rounded-xl p-2.5 flex flex-col items-center justify-center text-center gap-1.5 shadow-2xs hover:border-purple-300 transition-colors">
              <Droplet className="h-5 w-5 text-[#5f259f]" />
              <span className="text-[10px] font-semibold text-slate-700 leading-tight">Leak-Proof Design</span>
            </div>
            <div className="bg-white border border-purple-100 rounded-xl p-2.5 flex flex-col items-center justify-center text-center gap-1.5 shadow-2xs hover:border-purple-300 transition-colors">
              <Leaf className="h-5 w-5 text-[#5f259f]" />
              <span className="text-[10px] font-semibold text-slate-700 leading-tight">BPA-Free & Safe</span>
            </div>
            <div className="bg-white border border-purple-100 rounded-xl p-2.5 flex flex-col items-center justify-center text-center gap-1.5 shadow-2xs hover:border-purple-300 transition-colors">
              <Shield className="h-5 w-5 text-[#5f259f]" />
              <span className="text-[10px] font-semibold text-slate-700 leading-tight">Durable & Lightweight</span>
            </div>
            <div className="bg-white border border-purple-100 rounded-xl p-2.5 flex flex-col items-center justify-center text-center gap-1.5 shadow-2xs hover:border-purple-300 transition-colors">
              <Thermometer className="h-5 w-5 text-[#5f259f]" />
              <span className="text-[10px] font-semibold text-slate-700 leading-tight">Keeps Drinks Fresh</span>
            </div>
            <div className="col-span-2 sm:col-span-1 bg-white border border-purple-100 rounded-xl p-2.5 flex flex-col items-center justify-center text-center gap-1.5 shadow-2xs hover:border-purple-300 transition-colors">
              <Gift className="h-5 w-5 text-[#5f259f]" />
              <span className="text-[10px] font-semibold text-slate-700 leading-tight">Personalized with Name</span>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="pt-4 border-t border-slate-100">
            <div className="flex items-center gap-4 sm:gap-6 border-b border-slate-200 overflow-x-auto scrollbar-hide text-xs sm:text-sm font-semibold">
              <button
                type="button"
                onClick={() => setActiveTab('description')}
                className={cn(
                  "pb-2.5 border-b-2 transition-all whitespace-nowrap",
                  activeTab === 'description'
                    ? "border-[#5f259f] text-[#5f259f] font-bold"
                    : "border-transparent text-slate-500 hover:text-slate-800"
                )}
              >
                Description
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('specifications')}
                className={cn(
                  "pb-2.5 border-b-2 transition-all whitespace-nowrap",
                  activeTab === 'specifications'
                    ? "border-[#5f259f] text-[#5f259f] font-bold"
                    : "border-transparent text-slate-500 hover:text-slate-800"
                )}
              >
                Specifications
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('box')}
                className={cn(
                  "pb-2.5 border-b-2 transition-all whitespace-nowrap",
                  activeTab === 'box'
                    ? "border-[#5f259f] text-[#5f259f] font-bold"
                    : "border-transparent text-slate-500 hover:text-slate-800"
                )}
              >
                What's in Box
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('care')}
                className={cn(
                  "pb-2.5 border-b-2 transition-all whitespace-nowrap",
                  activeTab === 'care'
                    ? "border-[#5f259f] text-[#5f259f] font-bold"
                    : "border-transparent text-slate-500 hover:text-slate-800"
                )}
              >
                Care & Maintenance
              </button>
            </div>

            {/* Tab Contents */}
            <div className="py-4 space-y-4">

              {/* Tab 1: Description */}
              {activeTab === 'description' && (
                <div className="space-y-4 text-xs sm:text-sm">
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm mb-1.5">Product Description</h3>
                    <p className="text-slate-600 leading-relaxed font-normal">
                      {product.description ||
                        `Make hydration fun and personal! The GiftArtStudio ${product.name} is designed especially for kids with vibrant prints, a leak-proof cap and their own name on it. It's safe, durable and perfect for school, travel, sports or everyday use.`
                      }
                    </p>
                  </div>

                  {/* Highlights Card */}
                  <div className="bg-[#faf5ff] border border-purple-100 rounded-2xl p-4 sm:p-5 space-y-2.5">
                    <div className="flex items-center gap-1.5 text-xs sm:text-sm font-bold text-[#5f259f]">
                      <Sparkles className="h-4 w-4 text-[#9333ea]" />
                      <span>Product Highlights</span>
                    </div>
                    <ul className="space-y-2">
                      {highlights.map((h, i) => (
                        <li key={i} className="flex items-start gap-2 text-xs sm:text-sm text-slate-700">
                          <div className="w-4 h-4 rounded-full bg-[#9333ea] text-white flex items-center justify-center shrink-0 mt-0.5">
                            <Check className="h-2.5 w-2.5" />
                          </div>
                          <span>{h}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Specifications Card directly visible in Description view like the reference */}
                  <div className="bg-white border border-purple-100 rounded-2xl p-4 sm:p-5 space-y-3 shadow-2xs">
                    <div className="flex items-center gap-2 text-xs sm:text-sm font-bold text-slate-900">
                      <Layers className="h-4 w-4 text-[#5f259f]" />
                      <span>Specifications</span>
                    </div>
                    <div className="divide-y divide-purple-50 text-xs sm:text-sm">
                      {Object.entries(specifications).map(([key, value]) => (
                        <div key={key} className="py-2 flex items-center justify-between gap-4">
                          <span className="font-semibold text-slate-600 flex items-center gap-2">
                            {key === 'Capacity' && <Milk className="h-3.5 w-3.5 text-[#5f259f]" />}
                            {key === 'Material' && <Package className="h-3.5 w-3.5 text-[#5f259f]" />}
                            {key === 'Weight' && <Scale className="h-3.5 w-3.5 text-[#5f259f]" />}
                            {key === 'Dimensions' && <Ruler className="h-3.5 w-3.5 text-[#5f259f]" />}
                            {key === 'Age Group' && <Users className="h-3.5 w-3.5 text-[#5f259f]" />}
                            {key}
                          </span>
                          <span className="font-medium text-slate-800 text-right">{value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 2: Specifications standalone */}
              {activeTab === 'specifications' && (
                <div className="bg-white border border-purple-100 rounded-2xl p-4 sm:p-5 space-y-3 shadow-2xs">
                  <div className="flex items-center gap-2 text-xs sm:text-sm font-bold text-slate-900">
                    <Layers className="h-4 w-4 text-[#5f259f]" />
                    <span>Specifications Overview</span>
                  </div>
                  <div className="divide-y divide-purple-50 text-xs sm:text-sm">
                    {Object.entries(specifications).map(([key, value]) => (
                      <div key={key} className="py-2.5 flex items-center justify-between gap-4">
                        <span className="font-semibold text-slate-600 flex items-center gap-2">
                          {key === 'Capacity' && <Milk className="h-4 w-4 text-[#5f259f]" />}
                          {key === 'Material' && <Package className="h-4 w-4 text-[#5f259f]" />}
                          {key === 'Weight' && <Scale className="h-4 w-4 text-[#5f259f]" />}
                          {key === 'Dimensions' && <Ruler className="h-4 w-4 text-[#5f259f]" />}
                          {key === 'Age Group' && <Users className="h-4 w-4 text-[#5f259f]" />}
                          {key}
                        </span>
                        <span className="font-medium text-slate-800 text-right">{value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Tab 3: What's in Box */}
              {activeTab === 'box' && (
                <div className="bg-[#faf5ff] border border-purple-100 rounded-2xl p-4 sm:p-5 space-y-3">
                  <div className="flex items-center gap-2 text-xs sm:text-sm font-bold text-[#5f259f]">
                    <Package className="h-4 w-4 text-[#9333ea]" />
                    <span>Included in the Package</span>
                  </div>
                  <ul className="space-y-2.5 text-xs sm:text-sm">
                    {whatsInBox.map((item, i) => (
                      <li key={i} className="flex items-center gap-2.5 text-slate-700 font-medium">
                        <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Tab 4: Care & Maintenance */}
              {activeTab === 'care' && (
                <div className="bg-[#faf5ff] border border-purple-100 rounded-2xl p-4 sm:p-5 space-y-3">
                  <div className="flex items-center gap-2 text-xs sm:text-sm font-bold text-[#5f259f]">
                    <Shield className="h-4 w-4 text-[#9333ea]" />
                    <span>Care & Usage Instructions</span>
                  </div>
                  <ul className="space-y-2.5 text-xs sm:text-sm">
                    {careInstructions.map((tip, i) => (
                      <li key={i} className="flex items-start gap-2.5 text-slate-700 font-medium">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#9333ea] mt-1.5 shrink-0" />
                        <span>{tip}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

            </div>
          </div>

        </div>

      </div>

      {/* Video Reel Modal */}
      <Dialog open={isVideoOpen} onOpenChange={setIsVideoOpen}>
        <DialogContent className="max-w-md p-0 overflow-hidden bg-black border-none rounded-[2rem] aspect-[9/16] shadow-2xl">
          <DialogTitle className="sr-only">Product Reel</DialogTitle>
          <div className="relative h-full w-full">
            {isVideoOpen && product.videoUrl && (
              <video
                src={product.videoUrl}
                className="w-full h-full object-cover"
                controls
                autoPlay
                loop
              />
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Mobile Sticky Action Bar */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-[100] bg-white/95 backdrop-blur-md border-t border-purple-100 p-3 pb-safe shadow-[0_-8px_30px_rgba(0,0,0,0.08)]">
        <div className="flex items-center gap-2 max-w-md mx-auto">
          <Button
            type="button"
            onClick={handleToggleWishlist}
            variant="outline"
            aria-label="Wishlist"
            className={cn(
              "w-12 h-12 rounded-xl border-2 flex items-center justify-center shrink-0 transition-colors",
              isWishlisted
                ? "border-rose-200 bg-rose-50 text-rose-500"
                : "border-slate-200 bg-white text-slate-400"
            )}
          >
            <Heart className={cn("h-5 w-5", isWishlisted && "fill-rose-500 text-rose-500")} />
          </Button>

          <Button
            type="button"
            onClick={handleAddToCart}
            variant="outline"
            className="flex-1 h-12 rounded-xl border-2 border-slate-200 bg-white font-bold text-xs uppercase tracking-wider text-slate-700 hover:bg-slate-50 transition-colors"
          >
            <ShoppingCart className="h-4 w-4 mr-1.5 text-[#5f259f]" /> Add
          </Button>

          <Button
            type="button"
            onClick={handleBuyNow}
            disabled={isProcessing}
            className="flex-[1.5] h-12 rounded-xl bg-gradient-to-r from-[#5f259f] via-[#7c3aed] to-[#ec4899] text-white font-black text-xs uppercase tracking-wider shadow-md border border-white/20"
          >
            {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : <>BUY NOW <ChevronRight className="h-4 w-4 ml-1" /></>}
          </Button>
        </div>
      </div>
    </div>
  );
}
