"use client";

import { useState, useEffect, useMemo } from 'react';
import { 
  Box, 
  Plus, 
  Trash2, 
  ImagePlus, 
  Sparkles, 
  CheckCircle2, 
  Loader2, 
  ExternalLink,
  Tag,
  Layers,
  Star,
  Info,
  DollarSign,
  ArrowRight,
  ClipboardPaste,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { useFirestore } from '@/firebase';
import { collection, addDoc, updateDoc, doc, serverTimestamp } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { cacheProduct } from '@/lib/product-cache';
import { cn } from '@/lib/utils';

export const CATEGORIES_LIST = [
  { 
    name: 'Personalised Gifts', 
    slug: 'personalized-gifts', 
    subcategories: ['mugs', 'bottles', 'passport-covers', 'laptop-bags', 'travel-cases', 'travelling', 'corporate-gifts'] 
  },
  { 
    name: 'Kids', 
    slug: 'kids', 
    subcategories: ['bags', 'water-bottles', 'lunch-boxes', 'umbrellas', 'combos', 'kids-gifts', 'stationery', 'toys', 'travelling'] 
  },
  { 
    name: 'Adults', 
    slug: 'adults', 
    subcategories: ['mens', 'womens', 'unisex', 'travelling'] 
  },
  { 
    name: 'Accessories', 
    slug: 'accessories', 
    subcategories: ['bags', 'travel-combo', 'travelling', 'gift-boxes', 'combos', 'desk'] 
  },
  { 
    name: 'Pets', 
    slug: 'pets', 
    subcategories: ['pet-bowls', 'pet-tags', 'pet-bands', 'pet-toys', 'pet-clothes', 'pet-accessories'] 
  },
  { 
    name: 'New Collection', 
    slug: 'new', 
    subcategories: ['new-collection', 'new-launch', 'best-sellers', 'festive'] 
  },
];

const DEFAULT_PLACEHOLDER_IMAGE = 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?q=80&w=800&auto=format&fit=crop';

export interface ColorVariantItem {
  name: string;
  hex: string;
  images: string[];
  stockStatus: 'In Stock' | 'Low Stock' | 'Out of Stock';
  stock: number;
}

interface ProductFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productToEdit?: any | null;
  defaultCategory?: string;
  defaultSubcategory?: string;
  onSuccess?: (product: any) => void;
}

export function ProductFormDialog({
  open,
  onOpenChange,
  productToEdit,
  defaultCategory,
  defaultSubcategory,
  onSuccess,
}: ProductFormDialogProps) {
  const db = useFirestore();
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState<'basics' | 'images' | 'variants' | 'details'>('basics');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form Fields
  const [name, setName] = useState('');
  const [category, setCategory] = useState(defaultCategory || 'personalized-gifts');
  const [subcategory, setSubcategory] = useState(defaultSubcategory || 'mugs');
  const [price, setPrice] = useState('');
  const [oldPrice, setOldPrice] = useState('');
  const [stockStatus, setStockStatus] = useState<'In Stock' | 'Low Stock' | 'Out of Stock'>('In Stock');
  const [stockQuantity, setStockQuantity] = useState('50');
  const [badge, setBadge] = useState('None');
  
  // Multiple Image URLs
  const [imageUrls, setImageUrls] = useState<string[]>(['']);
  const [bulkUrlInput, setBulkUrlInput] = useState('');
  const [showBulkPaste, setShowBulkPaste] = useState(false);

  // Variants Management: Colours & Capacities
  const [colors, setColors] = useState<ColorVariantItem[]>([
    { name: 'Royal Blue', hex: '#0284c7', images: [], stockStatus: 'In Stock', stock: 50 },
    { name: 'Pastel Pink', hex: '#f472b6', images: [], stockStatus: 'In Stock', stock: 50 },
  ]);
  const [capacities, setCapacities] = useState<string[]>(['500 ml', '750 ml']);
  const [newCapacityInput, setNewCapacityInput] = useState('');

  // Description & Highlights
  const [description, setDescription] = useState('');
  const [highlights, setHighlights] = useState<string[]>([
    'Handcrafted with love and attention to detail',
    'Premium, durable and food-safe materials',
    'Custom laser engraving / high-definition vibrant print'
  ]);
  const [newHighlight, setNewHighlight] = useState('');

  // Personalization
  const [isPersonalizable, setIsPersonalizable] = useState(true);
  const [personalizationPrompt, setPersonalizationPrompt] = useState('Enter Name / Custom Text');
  const [personalizationMaxChars, setPersonalizationMaxChars] = useState('20');

  // Synchronize when opening or changing edit item
  useEffect(() => {
    if (productToEdit) {
      setName(productToEdit.name || productToEdit.title || '');
      setCategory(productToEdit.category || defaultCategory || 'personalized-gifts');
      setSubcategory(productToEdit.subcategory || defaultSubcategory || 'mugs');
      setPrice(productToEdit.price ? String(productToEdit.price) : '');
      setOldPrice(productToEdit.oldPrice ? String(productToEdit.oldPrice) : '');
      setStockStatus(productToEdit.inventoryStatus || 'In Stock');
      setStockQuantity(productToEdit.stock ? String(productToEdit.stock) : '50');
      setBadge(productToEdit.badge || (productToEdit.isBestSeller ? 'Best Seller' : productToEdit.isNew ? 'New Arrival' : 'None'));

      // Images
      const existingImages = productToEdit.images?.length 
        ? productToEdit.images 
        : productToEdit.image 
        ? [productToEdit.image] 
        : [''];
      setImageUrls(existingImages);

      // Colors
      if (productToEdit.colors && Array.isArray(productToEdit.colors) && productToEdit.colors.length > 0) {
        setColors(productToEdit.colors.map((c: any) => ({
          name: c.name || 'Color',
          hex: c.hex || '#9333ea',
          images: Array.isArray(c.images) ? c.images : [],
          stockStatus: c.stockStatus || 'In Stock',
          stock: Number(c.stock) || 50
        })));
      } else {
        setColors([
          { name: 'Royal Blue', hex: '#0284c7', images: [], stockStatus: 'In Stock', stock: 50 },
          { name: 'Pastel Pink', hex: '#f472b6', images: [], stockStatus: 'In Stock', stock: 50 }
        ]);
      }

      // Capacities
      if (productToEdit.capacities && Array.isArray(productToEdit.capacities) && productToEdit.capacities.length > 0) {
        setCapacities(productToEdit.capacities);
      } else if (productToEdit.sizes && Array.isArray(productToEdit.sizes) && productToEdit.sizes.length > 0) {
        setCapacities(productToEdit.sizes);
      } else {
        setCapacities(['500 ml', '750 ml']);
      }

      setDescription(productToEdit.description || '');
      setHighlights(productToEdit.highlights?.length ? productToEdit.highlights : [
        'Handcrafted with love',
        'Premium quality materials',
        'Perfect personalized gift for loved ones'
      ]);
      setIsPersonalizable(productToEdit.isPersonalizable ?? true);
      setPersonalizationPrompt(productToEdit.personalizationPrompt || 'Enter Name / Custom Text');
      setPersonalizationMaxChars(productToEdit.personalizationMaxChars ? String(productToEdit.personalizationMaxChars) : '20');
    } else {
      // Reset to defaults
      setName('');
      setCategory(defaultCategory || 'personalized-gifts');
      setSubcategory(defaultSubcategory || 'mugs');
      setPrice('');
      setOldPrice('');
      setStockStatus('In Stock');
      setStockQuantity('50');
      setBadge('None');
      setImageUrls(['']);
      setColors([
        { name: 'Royal Blue', hex: '#0284c7', images: [], stockStatus: 'In Stock', stock: 50 },
        { name: 'Pastel Pink', hex: '#f472b6', images: [], stockStatus: 'In Stock', stock: 50 },
        { name: 'Matte Black', hex: '#1e293b', images: [], stockStatus: 'In Stock', stock: 50 }
      ]);
      setCapacities(['500 ml', '750 ml']);
      setNewCapacityInput('');
      setBulkUrlInput('');
      setShowBulkPaste(false);
      setDescription('');
      setHighlights([
        'Handcrafted with love and attention to detail',
        'Premium, durable and food-safe materials',
        'Custom laser engraving / high-definition vibrant print'
      ]);
      setNewHighlight('');
      setIsPersonalizable(true);
      setPersonalizationPrompt('Enter Name / Custom Text');
      setPersonalizationMaxChars('20');
      setActiveTab('basics');
    }
  }, [productToEdit, open, defaultCategory, defaultSubcategory]);

  // Available subcategories for chosen category
  const availableSubcategories = useMemo(() => {
    const found = CATEGORIES_LIST.find(c => c.slug === category);
    return found ? found.subcategories : ['general'];
  }, [category]);

  // Adjust subcategory if current subcategory is not in new category
  const handleCategoryChange = (newCat: string) => {
    setCategory(newCat);
    const found = CATEGORIES_LIST.find(c => c.slug === newCat);
    if (found && !found.subcategories.includes(subcategory)) {
      setSubcategory(found.subcategories[0] || 'general');
    }
  };

  // Image URL management
  const handleAddImageUrl = () => {
    setImageUrls([...imageUrls, '']);
  };

  const handleUpdateImageUrl = (index: number, val: string) => {
    const updated = [...imageUrls];
    updated[index] = val;
    setImageUrls(updated);
  };

  const handleRemoveImageUrl = (index: number) => {
    if (imageUrls.length <= 1) {
      setImageUrls(['']);
      return;
    }
    const updated = imageUrls.filter((_, i) => i !== index);
    setImageUrls(updated);
  };

  const handleMakeCoverImage = (index: number) => {
    if (index === 0) return;
    const target = imageUrls[index];
    const withoutTarget = imageUrls.filter((_, i) => i !== index);
    setImageUrls([target, ...withoutTarget]);
    toast({ title: 'Cover Image Updated', description: 'Selected image is now the primary product photo.' });
  };

  // Bulk paste URLs
  const handleApplyBulkUrls = () => {
    if (!bulkUrlInput.trim()) return;
    const extracted = bulkUrlInput
      .split(/[\n,]+/)
      .map(url => url.trim())
      .filter(url => url.startsWith('http://') || url.startsWith('https://'));

    if (extracted.length === 0) {
      toast({ variant: 'destructive', title: 'No Valid URLs', description: 'Please paste valid URLs starting with http or https.' });
      return;
    }

    const currentClean = imageUrls.filter(u => u.trim().length > 0);
    const combined = Array.from(new Set([...currentClean, ...extracted]));
    setImageUrls(combined);
    setBulkUrlInput('');
    setShowBulkPaste(false);
    toast({ title: `${extracted.length} Images Added!`, description: 'Preview thumbnails loaded below.' });
  };

  // Highlight bullet management
  const handleAddHighlight = () => {
    if (!newHighlight.trim()) return;
    setHighlights([...highlights, newHighlight.trim()]);
    setNewHighlight('');
  };

  const handleRemoveHighlight = (index: number) => {
    setHighlights(highlights.filter((_, i) => i !== index));
  };

  // Color Variant Handlers
  const handleAddColor = () => {
    setColors(prev => [
      ...prev,
      { name: `Color ${prev.length + 1}`, hex: '#7e22ce', images: [], stockStatus: 'In Stock', stock: 50 }
    ]);
  };

  const handleUpdateColor = (index: number, updates: Partial<ColorVariantItem>) => {
    setColors(prev => {
      const copy = [...prev];
      copy[index] = { ...copy[index], ...updates };
      return copy;
    });
  };

  const handleRemoveColor = (index: number) => {
    if (colors.length <= 1) {
      toast({ title: "At least 1 colour variant is required" });
      return;
    }
    setColors(prev => prev.filter((_, i) => i !== index));
  };

  const handleAddColorImage = (colorIndex: number, imgUrl: string) => {
    if (!imgUrl.trim()) return;
    setColors(prev => {
      const copy = [...prev];
      const curImages = copy[colorIndex].images || [];
      copy[colorIndex] = { ...copy[colorIndex], images: [...curImages, imgUrl.trim()] };
      return copy;
    });
  };

  const handleRemoveColorImage = (colorIndex: number, imgIndex: number) => {
    setColors(prev => {
      const copy = [...prev];
      const curImages = copy[colorIndex].images || [];
      copy[colorIndex] = { ...copy[colorIndex], images: curImages.filter((_, i) => i !== imgIndex) };
      return copy;
    });
  };

  // Capacity Handlers
  const handleAddCapacity = (cap: string) => {
    const clean = cap.trim();
    if (!clean) return;
    if (capacities.includes(clean)) {
      toast({ title: "Capacity already added" });
      return;
    }
    setCapacities(prev => [...prev, clean]);
    setNewCapacityInput('');
  };

  const handleRemoveCapacity = (index: number) => {
    setCapacities(prev => prev.filter((_, i) => i !== index));
  };

  // Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!db) {
      toast({ variant: 'destructive', title: 'Database Error', description: 'Firestore is not connected.' });
      return;
    }

    if (!name.trim()) {
      setActiveTab('basics');
      toast({ variant: 'destructive', title: 'Name Required', description: 'Please enter a product name.' });
      return;
    }

    const priceNum = Number(price);
    if (!price || isNaN(priceNum) || priceNum <= 0) {
      setActiveTab('basics');
      toast({ variant: 'destructive', title: 'Valid Price Required', description: 'Please enter a valid price in INR.' });
      return;
    }

    setIsSubmitting(true);
    try {
      // Clean image URLs
      const validImages = imageUrls
        .map(u => u.trim())
        .filter(u => u.length > 0);

      if (validImages.length === 0) {
        validImages.push(DEFAULT_PLACEHOLDER_IMAGE);
      }

      const primaryImage = validImages[0];
      const oldPriceNum = Number(oldPrice) || Math.round(priceNum * 1.3);
      const stockNum = Number(stockQuantity) || 50;

      const payload: any = {
        name: name.trim(),
        title: name.trim(),
        category,
        subcategory,
        price: priceNum,
        oldPrice: oldPriceNum,
        image: primaryImage,
        images: validImages,
        colors: colors.filter(c => c.name.trim().length > 0),
        capacities: capacities.filter(c => c.trim().length > 0),
        sizes: capacities.filter(c => c.trim().length > 0),
        description: description.trim() || `Premium handcrafted ${name.trim()} customized specially for you. Made with top-grade materials for lasting memories.`,
        highlights: highlights.filter(h => h.trim().length > 0),
        inventoryStatus: stockStatus,
        stock: stockNum,
        badge: badge !== 'None' ? badge : null,
        isBestSeller: badge === 'Best Seller',
        isNew: badge === 'New Arrival' || category === 'new',
        isPersonalizable: Boolean(isPersonalizable),
        personalizationPrompt: personalizationPrompt.trim() || 'Enter Name / Custom Text',
        personalizationMaxChars: Number(personalizationMaxChars) || 20,
        rating: productToEdit?.rating || 4.9,
        reviewsCount: productToEdit?.reviewsCount || 16,
        boughtCount: productToEdit?.boughtCount || '150+',
        updatedAt: serverTimestamp(),
      };

      let finalId = productToEdit?.id;

      if (productToEdit?.id) {
        // Edit existing product
        await updateDoc(doc(db, 'products', productToEdit.id), payload);
        toast({
          title: 'Product Updated! ✨',
          description: `"${name}" changes are now live across the store.`
        });
      } else {
        // Create new product
        payload.createdAt = serverTimestamp();
        const docRef = await addDoc(collection(db, 'products'), payload);
        finalId = docRef.id;
        toast({
          title: 'Product Live in Store! 🎉',
          description: `"${name}" was created successfully and is now visible to customers.`
        });
      }

      // Prime instant cache
      cacheProduct({ id: finalId, ...payload });

      if (onSuccess) {
        onSuccess({ id: finalId, ...payload });
      }

      onOpenChange(false);
    } catch (err: any) {
      console.error('Save product error:', err);
      toast({
        variant: 'destructive',
        title: 'Save Failed',
        description: err.message || 'Could not save product to Firestore.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl rounded-[2.2rem] p-0 overflow-hidden bg-white shadow-2xl border border-purple-100 max-h-[92vh] flex flex-col">
        {/* Modal Top Header */}
        <div className="bg-gradient-to-r from-purple-700 via-indigo-700 to-purple-800 text-white p-5 md:p-6 shrink-0 relative">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20">
              <Box className="w-5 h-5 text-purple-200" />
            </div>
            <div>
              <DialogTitle className="text-lg md:text-xl font-black tracking-tight text-white">
                {productToEdit ? 'Edit Product' : 'Add New Product'}
              </DialogTitle>
              <DialogDescription className="text-xs font-semibold text-purple-200 mt-0.5">
                {productToEdit ? 'Update product details, pricing and photos.' : 'Fill in the fields to publish this product immediately to the store.'}
              </DialogDescription>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-2 mt-5 border-b border-white/10 pb-0">
            <button
              type="button"
              onClick={() => setActiveTab('basics')}
              className={cn(
                "pb-2.5 px-3 text-xs font-black uppercase tracking-wider transition-all border-b-2 flex items-center gap-1.5",
                activeTab === 'basics' 
                  ? "border-white text-white" 
                  : "border-transparent text-purple-200/70 hover:text-white"
              )}
            >
              <Info className="w-3.5 h-3.5" />
              <span>1. Basics &amp; Price</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('images')}
              className={cn(
                "pb-2.5 px-3 text-xs font-black uppercase tracking-wider transition-all border-b-2 flex items-center gap-1.5",
                activeTab === 'images' 
                  ? "border-white text-white" 
                  : "border-transparent text-purple-200/70 hover:text-white"
              )}
            >
              <ImagePlus className="w-3.5 h-3.5" />
              <span>2. Multiple Images ({imageUrls.filter(u => u.trim()).length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('variants')}
              className={cn(
                "pb-2.5 px-3 text-xs font-black uppercase tracking-wider transition-all border-b-2 flex items-center gap-1.5",
                activeTab === 'variants' 
                  ? "border-white text-white" 
                  : "border-transparent text-purple-200/70 hover:text-white"
              )}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>3. Variants &amp; Stock ({colors.length} Colours)</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('details')}
              className={cn(
                "pb-2.5 px-3 text-xs font-black uppercase tracking-wider transition-all border-b-2 flex items-center gap-1.5",
                activeTab === 'details' 
                  ? "border-white text-white" 
                  : "border-transparent text-purple-200/70 hover:text-white"
              )}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>4. Details &amp; Customization</span>
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 md:p-6 space-y-5">
          {/* ========================================================
              TAB 1: BASICS & PRICING
             ======================================================== */}
          {activeTab === 'basics' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              {/* Product Name */}
              <div className="space-y-1.5">
                <Label className="text-[11px] font-black uppercase tracking-wider text-slate-600 flex items-center justify-between">
                  <span>Product Title / Name *</span>
                  <span className="text-[10px] text-purple-600 font-semibold">Shows on website cards &amp; checkout</span>
                </Label>
                <Input
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Personalized Insulated Smart Water Bottle"
                  className="rounded-xl h-11 border-slate-200 text-xs font-bold focus-visible:ring-purple-500"
                />
              </div>

              {/* Category & Subcategory */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="space-y-1.5">
                  <Label className="text-[11px] font-black uppercase tracking-wider text-slate-600">
                    Category *
                  </Label>
                  <select
                    value={category}
                    onChange={(e) => handleCategoryChange(e.target.value)}
                    className="w-full h-11 px-3.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-purple-400"
                  >
                    {CATEGORIES_LIST.map((c) => (
                      <option key={c.slug} value={c.slug}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-[11px] font-black uppercase tracking-wider text-slate-600">
                    Subcategory *
                  </Label>
                  <select
                    value={subcategory}
                    onChange={(e) => setSubcategory(e.target.value)}
                    className="w-full h-11 px-3.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-purple-400 capitalize"
                  >
                    {availableSubcategories.map((sub) => (
                      <option key={sub} value={sub}>{sub.replace(/-/g, ' ')}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Pricing & Stock */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-1">
                <div className="space-y-1.5">
                  <Label className="text-[11px] font-black uppercase tracking-wider text-slate-600">
                    Selling Price (₹) *
                  </Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-black text-slate-400">₹</span>
                    <Input
                      required
                      type="number"
                      min="1"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      placeholder="499"
                      className="pl-7 rounded-xl h-11 border-slate-200 text-xs font-bold focus-visible:ring-purple-500"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-[11px] font-black uppercase tracking-wider text-slate-600">
                    Original Price / MRP (₹)
                  </Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-black text-slate-400">₹</span>
                    <Input
                      type="number"
                      value={oldPrice}
                      onChange={(e) => setOldPrice(e.target.value)}
                      placeholder="799"
                      className="pl-7 rounded-xl h-11 border-slate-200 text-xs font-bold focus-visible:ring-purple-500"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-[11px] font-black uppercase tracking-wider text-slate-600">
                    Stock Availability
                  </Label>
                  <select
                    value={stockStatus}
                    onChange={(e) => setStockStatus(e.target.value)}
                    className="w-full h-11 px-3.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-purple-400"
                  >
                    <option value="In Stock">In Stock (Available)</option>
                    <option value="Low Stock">Low Stock (Hurry)</option>
                    <option value="Out of Stock">Out of Stock</option>
                  </select>
                </div>
              </div>

              {/* Badge & Inventory Quantity */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
                <div className="space-y-1.5">
                  <Label className="text-[11px] font-black uppercase tracking-wider text-slate-600">
                    Product Badge / Highlight Tag
                  </Label>
                  <select
                    value={badge}
                    onChange={(e) => setBadge(e.target.value)}
                    className="w-full h-11 px-3.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-purple-400"
                  >
                    <option value="None">None (Standard)</option>
                    <option value="Best Seller">⭐ Best Seller (Features in Collections)</option>
                    <option value="New Arrival">✨ New Arrival (Features in Collections)</option>
                    <option value="Trending">🔥 Trending Now</option>
                    <option value="Hot Deal">💥 Hot Deal</option>
                    <option value="Festive Special">🎉 Festive Special</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-[11px] font-black uppercase tracking-wider text-slate-600">
                    Inventory Stock Count
                  </Label>
                  <Input
                    type="number"
                    value={stockQuantity}
                    onChange={(e) => setStockQuantity(e.target.value)}
                    placeholder="50"
                    className="rounded-xl h-11 border-slate-200 text-xs font-bold focus-visible:ring-purple-500"
                  />
                </div>
              </div>

              {/* Next Step Pill */}
              <div className="pt-3 flex justify-end">
                <button
                  type="button"
                  onClick={() => setActiveTab('images')}
                  className="px-4 py-2 rounded-xl bg-purple-50 text-purple-700 font-bold text-xs hover:bg-purple-100 flex items-center gap-1.5 transition-all"
                >
                  <span>Next: Add Images</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* ========================================================
              TAB 2: MULTIPLE IMAGE URLS WITH LIVE PREVIEW
             ======================================================== */}
          {activeTab === 'images' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    <ImagePlus className="w-4 h-4 text-purple-600" />
                    <span>Product Photos ({imageUrls.length})</span>
                  </h4>
                  <p className="text-[11px] text-slate-400 font-semibold mt-0.5">
                    First image is the primary cover photo. Customers can swipe all photos in the gallery.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setShowBulkPaste(!showBulkPaste)}
                  className="px-3 py-1.5 rounded-xl border border-purple-200 bg-purple-50 text-purple-700 font-bold text-[11px] flex items-center gap-1 hover:bg-purple-100 transition-all"
                >
                  <ClipboardPaste className="w-3 h-3" />
                  <span>{showBulkPaste ? 'Hide Bulk Paste' : 'Quick Bulk Paste'}</span>
                </button>
              </div>

              {/* Quick Bulk Paste Box */}
              {showBulkPaste && (
                <div className="p-3.5 bg-purple-50/70 border border-purple-200 rounded-2xl space-y-2.5 animate-in fade-in">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-purple-900">Paste Multiple URLs (one per line or comma-separated):</span>
                  </div>
                  <Textarea
                    rows={3}
                    value={bulkUrlInput}
                    onChange={(e) => setBulkUrlInput(e.target.value)}
                    placeholder="https://images.unsplash.com/...&#10;https://images.unsplash.com/..."
                    className="bg-white rounded-xl text-xs font-medium border-purple-200"
                  />
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setShowBulkPaste(false)}
                      className="px-3 py-1 text-xs text-slate-500 font-bold hover:bg-slate-100 rounded-lg"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleApplyBulkUrls}
                      className="px-3.5 py-1.5 bg-purple-600 text-white text-xs font-bold rounded-xl hover:bg-purple-700 shadow-sm"
                    >
                      Apply URLs
                    </button>
                  </div>
                </div>
              )}

              {/* Dynamic Image URL list */}
              <div className="space-y-3">
                {imageUrls.map((url, idx) => (
                  <div 
                    key={idx} 
                    className={cn(
                      "p-3 rounded-2xl border transition-all flex flex-col sm:flex-row items-start sm:items-center gap-3",
                      idx === 0 
                        ? "border-purple-200 bg-purple-50/30" 
                        : "border-slate-200 bg-slate-50/50"
                    )}
                  >
                    {/* Thumbnail Preview */}
                    <div className="relative w-14 h-14 rounded-xl overflow-hidden bg-slate-200 border border-slate-300/80 shrink-0 shadow-xs flex items-center justify-center">
                      {url.trim() ? (
                        <img
                          src={url.trim()}
                          alt={`Preview ${idx + 1}`}
                          className="w-full h-full object-cover"
                          onError={(e: any) => {
                            e.target.src = 'https://placehold.co/100?text=Invalid';
                          }}
                        />
                      ) : (
                        <ImagePlus className="w-5 h-5 text-slate-400" />
                      )}
                      {idx === 0 && (
                        <span className="absolute bottom-0 inset-x-0 bg-purple-600 text-white text-[8px] font-black text-center py-0.5 uppercase tracking-tighter">
                          Cover
                        </span>
                      )}
                    </div>

                    {/* URL Input */}
                    <div className="flex-1 min-w-0 w-full">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                          {idx === 0 ? 'Primary Cover Image URL' : `Gallery Image #${idx + 1}`}
                        </span>
                        {idx > 0 && (
                          <button
                            type="button"
                            onClick={() => handleMakeCoverImage(idx)}
                            className="text-[10px] font-bold text-purple-600 hover:underline"
                          >
                            Set as Cover Photo
                          </button>
                        )}
                      </div>
                      <Input
                        value={url}
                        onChange={(e) => handleUpdateImageUrl(idx, e.target.value)}
                        placeholder="https://... image link (jpg, png, webp)"
                        className="rounded-xl h-9 border-slate-200 text-xs font-medium bg-white"
                      />
                    </div>

                    {/* Delete button */}
                    <button
                      type="button"
                      onClick={() => handleRemoveImageUrl(idx)}
                      disabled={imageUrls.length <= 1 && !url}
                      className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors self-end sm:self-center"
                      title="Remove image"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Add More Image Button */}
              <button
                type="button"
                onClick={handleAddImageUrl}
                className="w-full py-2.5 rounded-xl border border-dashed border-purple-300 bg-purple-50/50 hover:bg-purple-50 text-purple-700 font-bold text-xs flex items-center justify-center gap-2 transition-all active:scale-[0.99]"
              >
                <Plus className="w-4 h-4" />
                <span>+ Add Another Photo URL</span>
              </button>

              {/* Navigation */}
              <div className="pt-2 flex justify-between">
                <button
                  type="button"
                  onClick={() => setActiveTab('basics')}
                  className="px-3 py-1.5 text-xs text-slate-500 font-bold hover:bg-slate-100 rounded-xl"
                >
                  ← Back to Basics
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('variants')}
                  className="px-4 py-2 rounded-xl bg-purple-50 text-purple-700 font-bold text-xs hover:bg-purple-100 flex items-center gap-1.5 transition-all"
                >
                  <span>Next: Variants &amp; Stock</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* ========================================================
              TAB 3: VARIANTS & STOCK MANAGEMENT (COLOURS & CAPACITIES)
             ======================================================== */}
          {activeTab === 'variants' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              {/* Info banner */}
              <div className="p-3.5 rounded-2xl bg-purple-50/70 border border-purple-200 flex items-start gap-3">
                <Sparkles className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
                <div className="text-xs text-purple-900 leading-relaxed">
                  <p className="font-bold">Dynamic Product Variant Management</p>
                  <p className="text-[11px] text-purple-700 mt-0.5">
                    Add distinct colours with their own photos and capacities. When customers select a colour on the product page, the photo gallery will immediately switch to show that colour variant!
                  </p>
                </div>
              </div>

              {/* 1. Colour Variants & Specific Photos */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-xs font-black uppercase tracking-wider text-slate-800">
                      Product Colours &amp; Dedicated Photos
                    </Label>
                    <p className="text-[10px] text-slate-400">Add colours and attach images specific to that colour</p>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleAddColor}
                    className="h-8 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs"
                  >
                    <Plus className="w-3.5 h-3.5 mr-1" /> Add Colour
                  </Button>
                </div>

                <div className="space-y-3">
                  {colors.map((colorItem, cIdx) => (
                    <div key={cIdx} className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-3">
                      {/* Colour Header */}
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200/70 pb-3">
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            value={colorItem.hex}
                            onChange={(e) => handleUpdateColor(cIdx, { hex: e.target.value })}
                            className="w-8 h-8 rounded-xl border border-slate-300 cursor-pointer p-0.5 bg-white shadow-xs"
                            title="Choose colour hex"
                          />
                          <Input
                            value={colorItem.name}
                            onChange={(e) => handleUpdateColor(cIdx, { name: e.target.value })}
                            placeholder="e.g. Royal Blue"
                            className="h-9 w-36 sm:w-44 rounded-xl text-xs font-bold bg-white"
                          />
                        </div>

                        <div className="flex items-center gap-2">
                          {/* Variant Stock Status */}
                          <select
                            value={colorItem.stockStatus || 'In Stock'}
                            onChange={(e) => handleUpdateColor(cIdx, { stockStatus: e.target.value as any })}
                            className="h-9 px-2.5 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-700"
                          >
                            <option value="In Stock">🟢 In Stock</option>
                            <option value="Low Stock">🟡 Low Stock</option>
                            <option value="Out of Stock">🔴 Out of Stock</option>
                          </select>

                          <button
                            type="button"
                            onClick={() => handleRemoveColor(cIdx)}
                            className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl"
                            title="Delete colour variant"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Colour Specific Photos */}
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                          Photos for "{colorItem.name}" ({colorItem.images?.length || 0} attached)
                        </Label>

                        {/* Existing thumbnails for this colour */}
                        {colorItem.images && colorItem.images.length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            {colorItem.images.map((imgUrl, imgIdx) => (
                              <div key={imgIdx} className="relative group w-14 h-14 rounded-xl overflow-hidden border border-slate-300 bg-white shadow-xs">
                                <img
                                  src={imgUrl}
                                  alt={`${colorItem.name} ${imgIdx + 1}`}
                                  className="w-full h-full object-cover"
                                  onError={(e: any) => { e.target.src = 'https://placehold.co/100?text=Invalid'; }}
                                />
                                <button
                                  type="button"
                                  onClick={() => handleRemoveColorImage(cIdx, imgIdx)}
                                  className="absolute top-0.5 right-0.5 bg-black/70 hover:bg-rose-600 text-white rounded-full p-0.5 transition-colors"
                                  title="Remove image"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Quick Add URL to this Colour */}
                        <div className="flex gap-2">
                          <Input
                            id={`color-img-${cIdx}`}
                            placeholder="Paste image URL for this colour variant..."
                            className="h-8 rounded-xl text-xs bg-white"
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                const target = e.currentTarget as HTMLInputElement;
                                handleAddColorImage(cIdx, target.value);
                                target.value = '';
                              }
                            }}
                          />
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              const input = document.getElementById(`color-img-${cIdx}`) as HTMLInputElement;
                              if (input && input.value) {
                                handleAddColorImage(cIdx, input.value);
                                input.value = '';
                              }
                            }}
                            className="h-8 text-xs font-bold rounded-xl"
                          >
                            + Add Photo
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 2. Capacity Options */}
              <div className="space-y-3 pt-2 border-t border-slate-200">
                <Label className="text-xs font-black uppercase tracking-wider text-slate-800 block">
                  Capacity / Size Options
                </Label>
                <p className="text-[10px] text-slate-400">Available size/capacity options customers can choose from</p>

                {/* Selected capacities chips */}
                <div className="flex flex-wrap gap-2">
                  {capacities.map((cap, capIdx) => (
                    <span
                      key={capIdx}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-100 text-purple-900 font-bold text-xs"
                    >
                      <span>{cap}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveCapacity(capIdx)}
                        className="text-purple-600 hover:text-rose-600"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>

                {/* Quick Add Presets */}
                <div className="space-y-1.5 pt-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Quick Add Suggestions:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {['350 ml', '500 ml', '750 ml', '1000 ml', '1200 ml', '1.5 Litre', 'Small', 'Medium', 'Large'].map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => handleAddCapacity(preset)}
                        className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-slate-100 hover:bg-purple-100 text-slate-700 hover:text-purple-700 transition-colors"
                      >
                        + {preset}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Custom Capacity Input */}
                <div className="flex gap-2 pt-1 max-w-sm">
                  <Input
                    value={newCapacityInput}
                    onChange={(e) => setNewCapacityInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddCapacity(newCapacityInput);
                      }
                    }}
                    placeholder="e.g. 600 ml or XL"
                    className="h-9 rounded-xl text-xs bg-white"
                  />
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => handleAddCapacity(newCapacityInput)}
                    className="h-9 rounded-xl font-bold text-xs bg-slate-800 hover:bg-slate-900 text-white"
                  >
                    + Add
                  </Button>
                </div>
              </div>

              {/* 3. Overall Stock Status */}
              <div className="p-4 rounded-2xl bg-slate-100/70 border border-slate-200/80 space-y-3">
                <Label className="text-xs font-black uppercase tracking-wider text-slate-800 block">
                  Product Stock Status &amp; Inventory Level
                </Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-[10px] font-bold text-slate-500 uppercase">Availability Status</Label>
                    <select
                      value={stockStatus}
                      onChange={(e) => setStockStatus(e.target.value as any)}
                      className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-800"
                    >
                      <option value="In Stock">🟢 In Stock (Active &amp; Ready to Order)</option>
                      <option value="Low Stock">🟡 Low Stock (Show Urgency Badge)</option>
                      <option value="Out of Stock">🔴 Out of Stock (Disabled on Store)</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-[10px] font-bold text-slate-500 uppercase">Available Quantity</Label>
                    <Input
                      type="number"
                      value={stockQuantity}
                      onChange={(e) => setStockQuantity(e.target.value)}
                      placeholder="50"
                      className="h-10 rounded-xl text-xs font-bold bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* Navigation */}
              <div className="pt-2 flex justify-between">
                <button
                  type="button"
                  onClick={() => setActiveTab('images')}
                  className="px-3 py-1.5 text-xs text-slate-500 font-bold hover:bg-slate-100 rounded-xl"
                >
                  ← Back to Images
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('details')}
                  className="px-4 py-2 rounded-xl bg-purple-50 text-purple-700 font-bold text-xs hover:bg-purple-100 flex items-center gap-1.5 transition-all"
                >
                  <span>Next: Details &amp; Customization</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* ========================================================
              TAB 4: DESCRIPTION, HIGHLIGHTS & CUSTOMIZATION
             ======================================================== */}
          {activeTab === 'details' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              {/* Description */}
              <div className="space-y-1.5">
                <Label className="text-[11px] font-black uppercase tracking-wider text-slate-600">
                  Product Description
                </Label>
                <Textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe materials, sizing, why customers will love it..."
                  className="rounded-xl border-slate-200 text-xs font-medium resize-none focus-visible:ring-purple-500"
                />
              </div>

              {/* Key Highlights Bullet Points */}
              <div className="space-y-2">
                <Label className="text-[11px] font-black uppercase tracking-wider text-slate-600 flex items-center justify-between">
                  <span>Product Highlights / Bullet Features</span>
                  <span className="text-[10px] text-slate-400 font-normal">Shown as checkmarks on product page</span>
                </Label>

                <div className="space-y-1.5">
                  {highlights.map((h, i) => (
                    <div key={i} className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200/60">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      <span className="text-xs text-slate-700 font-medium flex-1">{h}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveHighlight(i)}
                        className="p-1 text-slate-400 hover:text-rose-500 rounded"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>

                <div className="flex gap-2 pt-1">
                  <Input
                    value={newHighlight}
                    onChange={(e) => setNewHighlight(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddHighlight();
                      }
                    }}
                    placeholder="e.g. Dishwasher safe, BPA-Free, 2-Year Warranty"
                    className="rounded-xl h-10 border-slate-200 text-xs font-medium"
                  />
                  <button
                    type="button"
                    onClick={handleAddHighlight}
                    className="px-3.5 h-10 rounded-xl bg-slate-800 text-white font-bold text-xs shrink-0 hover:bg-slate-900"
                  >
                    + Add
                  </button>
                </div>
              </div>

              {/* Personalization Options */}
              <div className="p-4 rounded-2xl bg-gradient-to-br from-purple-50 to-pink-50/50 border border-purple-200/80 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-black text-purple-950 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                      <span>Allow Customer Customization?</span>
                    </span>
                    <p className="text-[10px] text-purple-700 font-medium mt-0.5">
                      Enables the custom name input box on the product details page
                    </p>
                  </div>
                  <Switch
                    checked={isPersonalizable}
                    onCheckedChange={setIsPersonalizable}
                  />
                </div>

                {isPersonalizable && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 border-t border-purple-200/60">
                    <div className="space-y-1">
                      <Label className="text-[10px] font-black uppercase tracking-wider text-purple-900">
                        Input Prompt Label
                      </Label>
                      <Input
                        value={personalizationPrompt}
                        onChange={(e) => setPersonalizationPrompt(e.target.value)}
                        placeholder="e.g. Enter Child's Name to Print"
                        className="rounded-xl h-9 border-purple-200 text-xs font-medium bg-white"
                      />
                    </div>

                    <div className="space-y-1">
                      <Label className="text-[10px] font-black uppercase tracking-wider text-purple-900">
                        Max Character Limit
                      </Label>
                      <Input
                        type="number"
                        value={personalizationMaxChars}
                        onChange={(e) => setPersonalizationMaxChars(e.target.value)}
                        placeholder="20"
                        className="rounded-xl h-9 border-purple-200 text-xs font-medium bg-white"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Navigation */}
              <div className="pt-2 flex justify-start">
                <button
                  type="button"
                  onClick={() => setActiveTab('variants')}
                  className="px-3 py-1.5 text-xs text-slate-500 font-bold hover:bg-slate-100 rounded-xl"
                >
                  ← Back to Variants &amp; Stock
                </button>
              </div>
            </div>
          )}
        </form>

        {/* Modal Bottom Footer */}
        <div className="p-4 md:px-6 bg-slate-50 border-t border-slate-100 flex items-center justify-between shrink-0">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="px-4 py-2 rounded-xl text-slate-600 font-bold text-xs hover:bg-slate-200/70 transition-colors"
          >
            Cancel
          </button>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              disabled={isSubmitting}
              onClick={handleSubmit}
              className="px-6 h-11 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-black text-xs shadow-md shadow-purple-500/20 active:scale-95 transition-all flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Publishing Product...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{productToEdit ? 'Save Changes' : 'Publish Product to Store'}</span>
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
