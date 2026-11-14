"use client";

import { use, useMemo, useState, useEffect, useCallback } from 'react';
import { 
  Plus, 
  Search, 
  Tag, 
  Edit2, 
  Trash2, 
  ImagePlus,
  Box,
  ArrowLeft,
  Loader2,
  Star,
  Sparkles,
  Save,
  X,
  Lock,
  ChevronUp,
  ChevronDown,
  Video,
  Pencil,
  Truck,
  Flame,
  Layers,
  Package,
  Shield,
  Palette
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { useFirestore, useCollection, errorEmitter, FirestorePermissionError, useUser } from '@/firebase';
import { collection, addDoc, serverTimestamp, query, where, doc, deleteDoc, updateDoc } from 'firebase/firestore';
import Image from 'next/image';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

const SUPER_ADMIN_EMAIL = "rohanswakkargiftartstudio@gmail.com";

function ProductForm({ isEdit, editingProduct, imageUrls, setImageUrls, isSaving, onSubmit }: {
  isEdit?: boolean;
  editingProduct: any;
  imageUrls: string[];
  setImageUrls: React.Dispatch<React.SetStateAction<string[]>>;
  isSaving: boolean;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
}) {
  const addImageUrl = () => setImageUrls((prev: string[]) => [...prev, '']);
  const removeImageUrl = (index: number) => setImageUrls((prev: string[]) => prev.filter((_: string, i: number) => i !== index));
  const updateImageUrl = (index: number, val: string) => {
    setImageUrls((prev: string[]) => {
      const updated = [...prev];
      updated[index] = val;
      return updated;
    });
  };
  const moveImage = (index: number, direction: 'up' | 'down') => {
    setImageUrls((prev: string[]) => {
      const newIdx = direction === 'up' ? index - 1 : index + 1;
      if (newIdx < 0 || newIdx >= prev.length) return prev;
      const updated = [...prev];
      [updated[index], updated[newIdx]] = [updated[newIdx], updated[index]];
      return updated;
    });
  };

  // Convert colors array to formatted string
  const defaultColorsStr = editingProduct?.colors?.length
    ? editingProduct.colors.map((c: any) => `${c.name}:${c.hex}`).join(', ')
    : 'Purple:#9333ea, Pink:#f472b6, Sky Blue:#38bdf8, Mint Green:#4ade80';

  // Convert capacities array to formatted string
  const defaultCapacitiesStr = editingProduct?.capacities?.length
    ? editingProduct.capacities.join(', ')
    : (editingProduct?.sizes?.join(', ') || '500 ml, 750 ml');

  // Highlights to multiline string
  const defaultHighlightsStr = editingProduct?.highlights?.length
    ? editingProduct.highlights.join('\n')
    : `Personalized with your child's name\nLeak-proof and spill-proof lid\nBPA-free, food-grade material\nLightweight, durable and kid-friendly\nAvailable in multiple colours and fun designs\nPerfect for school, travel, sports and daily use`;

  // What's in box to multiline string
  const defaultWhatsInBoxStr = editingProduct?.whatsInBox?.length
    ? editingProduct.whatsInBox.join('\n')
    : `1 × Personalized Water Bottle\n1 × Spill-Proof Straw & Lid\n1 × Soft Bottle Cleaning Brush\n1 × Care & Instructions Card`;

  // Care instructions to multiline string
  const defaultCareStr = editingProduct?.careInstructions?.length
    ? editingProduct.careInstructions.join('\n')
    : `Hand wash recommended to preserve custom prints and vibrant colours\nDo not place in microwave oven or direct deep freezer\nWash thoroughly with mild soap and warm water before initial use\nStore with lid open to ensure complete ventilation and drying`;

  // Dropdown options to multiline string
  const defaultDropdownOptionsStr = editingProduct?.personalizationOptions?.length
    ? editingProduct.personalizationOptions.join('\n')
    : `Font Style: Playful Comic\nFont Style: Elegant Cursive\nFont Style: Modern Bold\nIcon Charm: Star / Magic\nIcon Charm: Unicorn / Dino`;

  return (
    <form onSubmit={onSubmit} className="space-y-8 pb-8">
      
      {/* 1. Core Identification & Pricing */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
          <Box className="h-4 w-4 text-[#5f259f]" />
          <h3 className="text-xs font-black uppercase tracking-widest text-slate-800">1. Core Details & Pricing</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2 space-y-1.5">
            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Product Name *</Label>
            <Input 
              name="name" 
              required 
              defaultValue={editingProduct?.name || ''} 
              placeholder="e.g. Personalized Kids Water Bottle – Unicorn" 
              className="rounded-xl h-11 border-slate-200" 
            />
          </div>

          <div className="md:col-span-2 space-y-1.5">
            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Subtitle / Tagline</Label>
            <Input 
              name="subtitle" 
              defaultValue={editingProduct?.subtitle || ''} 
              placeholder="e.g. A cute, durable and leak-proof water bottle with your child's name – perfect for school, travel and everyday use." 
              className="rounded-xl h-11 border-slate-200" 
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Selling Price (₹) *</Label>
            <Input 
              name="price" 
              type="number" 
              required 
              defaultValue={editingProduct?.price || ''} 
              placeholder="699" 
              className="rounded-xl h-11 border-slate-200 font-bold" 
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Strike / Old Price (₹)</Label>
            <Input 
              name="oldPrice" 
              type="number" 
              defaultValue={editingProduct?.oldPrice || ''} 
              placeholder="999" 
              className="rounded-xl h-11 border-slate-200" 
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">SKU Code</Label>
            <Input 
              name="sku" 
              defaultValue={editingProduct?.sku || ''} 
              placeholder="e.g. GAS-WB-KIDS-001" 
              className="rounded-xl h-11 border-slate-200 uppercase font-mono text-xs" 
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Inventory Status</Label>
            <select 
              name="inventoryStatus" 
              defaultValue={editingProduct?.inventoryStatus || 'In Stock'}
              className="w-full rounded-xl h-11 border border-slate-200 px-3 text-xs font-semibold text-slate-700 bg-white"
            >
              <option value="In Stock">In Stock</option>
              <option value="Low Stock">Low Stock</option>
              <option value="Out of Stock">Out of Stock</option>
            </select>
          </div>
        </div>
      </div>

      {/* 2. Social Proof & Delivery */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
          <Flame className="h-4 w-4 text-[#ef4444]" />
          <h3 className="text-xs font-black uppercase tracking-widest text-slate-800">2. Social Proof & Delivery</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Rating (1.0 - 5.0)</Label>
            <div className="relative">
              <Star className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-amber-500" />
              <Input 
                name="rating" 
                type="number" 
                step="0.1" 
                min="1" 
                max="5" 
                defaultValue={editingProduct?.rating || 5.0} 
                className="pl-9 rounded-xl h-11 border-slate-200 font-bold" 
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Bought This Month</Label>
            <div className="relative">
              <Flame className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-rose-500" />
              <Input 
                name="boughtCount" 
                defaultValue={editingProduct?.boughtCount || '349+'} 
                placeholder="349+" 
                className="pl-9 rounded-xl h-11 border-slate-200 font-bold" 
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Estimated Delivery</Label>
            <div className="relative">
              <Truck className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#5f259f]" />
              <Input 
                name="deliveryTime" 
                defaultValue={editingProduct?.deliveryTime || '2 – 4 Days'} 
                placeholder="2 – 4 Days" 
                className="pl-9 rounded-xl h-11 border-slate-200" 
              />
            </div>
          </div>
        </div>
      </div>

      {/* 3. Personalization Settings */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
          <Pencil className="h-4 w-4 text-[#5f259f]" />
          <h3 className="text-xs font-black uppercase tracking-widest text-slate-800">3. Personalization Box</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Box Heading</Label>
            <Input 
              name="personalizationTitle" 
              defaultValue={editingProduct?.personalizationTitle || 'Personalize Your Bottle'} 
              placeholder="e.g. Personalize Your Bottle" 
              className="rounded-xl h-11 border-slate-200" 
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Field Label</Label>
            <Input 
              name="personalizationLabel" 
              defaultValue={editingProduct?.personalizationLabel || 'Name on Bottle *'} 
              placeholder="e.g. Name on Bottle *" 
              className="rounded-xl h-11 border-slate-200" 
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Max Characters</Label>
            <Input 
              name="personalizationMaxChars" 
              type="number" 
              defaultValue={editingProduct?.personalizationMaxChars || 12} 
              placeholder="12" 
              className="rounded-xl h-11 border-slate-200" 
            />
          </div>

          <div className="md:col-span-3 space-y-1.5">
            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Dropdown Options (1 option per line)</Label>
            <Textarea 
              name="personalizationOptions" 
              defaultValue={defaultDropdownOptionsStr} 
              placeholder="Font Style: Playful Comic&#10;Font Style: Elegant Cursive&#10;Icon Charm: Unicorn / Dino" 
              className="rounded-xl min-h-[90px] border-slate-200 text-xs font-medium" 
            />
          </div>
        </div>
      </div>

      {/* 4. Variants (Colors & Capacities) */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
          <Palette className="h-4 w-4 text-[#5f259f]" />
          <h3 className="text-xs font-black uppercase tracking-widest text-slate-800">4. Variants (Colors & Capacities)</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">
              Colour Swatches (Format: Name:HexCode, comma-separated)
            </Label>
            <Input 
              name="colors" 
              defaultValue={defaultColorsStr} 
              placeholder="Purple:#9333ea, Pink:#f472b6, Sky Blue:#38bdf8, Mint Green:#4ade80" 
              className="rounded-xl h-11 border-slate-200 text-xs font-mono" 
            />
            <p className="text-[10px] text-slate-400">e.g. Purple:#9333ea, Pink:#f472b6, Sky Blue:#38bdf8, Mint Green:#4ade80</p>
          </div>

          <div className="space-y-1.5">
            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">
              Capacities / Sizes (comma-separated)
            </Label>
            <Input 
              name="capacities" 
              defaultValue={defaultCapacitiesStr} 
              placeholder="500 ml, 750 ml" 
              className="rounded-xl h-11 border-slate-200 text-xs font-semibold" 
            />
            <p className="text-[10px] text-slate-400">e.g. 500 ml, 750 ml or Small, Medium, Large</p>
          </div>
        </div>
      </div>

      {/* 5. Specifications Table */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
          <Layers className="h-4 w-4 text-[#5f259f]" />
          <h3 className="text-xs font-black uppercase tracking-widest text-slate-800">5. Specifications Table</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Capacity Spec</Label>
            <Input 
              name="specCapacity" 
              defaultValue={editingProduct?.specifications?.Capacity || '500 ml / 750 ml'} 
              placeholder="500 ml / 750 ml" 
              className="rounded-xl h-11 border-slate-200 text-xs" 
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Material Spec</Label>
            <Input 
              name="specMaterial" 
              defaultValue={editingProduct?.specifications?.Material || 'Food-grade, BPA-Free (PP + Tritan)'} 
              placeholder="Food-grade, BPA-Free (PP + Tritan)" 
              className="rounded-xl h-11 border-slate-200 text-xs" 
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Weight Spec</Label>
            <Input 
              name="specWeight" 
              defaultValue={editingProduct?.specifications?.Weight || '~ 210 g (500 ml)'} 
              placeholder="~ 210 g (500 ml)" 
              className="rounded-xl h-11 border-slate-200 text-xs" 
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Dimensions Spec</Label>
            <Input 
              name="specDimensions" 
              defaultValue={editingProduct?.specifications?.Dimensions || '7.2 × 22 cm (500 ml)'} 
              placeholder="7.2 × 22 cm (500 ml)" 
              className="rounded-xl h-11 border-slate-200 text-xs" 
            />
          </div>

          <div className="space-y-1.5 md:col-span-2">
            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Age Group Spec</Label>
            <Input 
              name="specAgeGroup" 
              defaultValue={editingProduct?.specifications?.['Age Group'] || '3+ Years'} 
              placeholder="3+ Years" 
              className="rounded-xl h-11 border-slate-200 text-xs" 
            />
          </div>
        </div>
      </div>

      {/* 6. Tabs Content (Description, Highlights, What's In Box, Care) */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
          <Package className="h-4 w-4 text-[#5f259f]" />
          <h3 className="text-xs font-black uppercase tracking-widest text-slate-800">6. Description & Tab Sections</h3>
        </div>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Full Description Paragraph</Label>
            <Textarea 
              name="description" 
              defaultValue={editingProduct?.description || ''} 
              placeholder="Make hydration fun and personal! The GiftArtStudio Personalized Kids Water Bottle is designed especially for kids with vibrant prints, a leak-proof cap and their own name on it. It's safe, durable and perfect for school, travel, sports or everyday use." 
              className="rounded-xl min-h-[90px] border-slate-200 text-xs leading-relaxed" 
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">
              ✨ Product Highlights Checklist (1 bullet per line)
            </Label>
            <Textarea 
              name="highlights" 
              defaultValue={defaultHighlightsStr} 
              placeholder="Personalized with your child's name&#10;Leak-proof and spill-proof lid&#10;BPA-free, food-grade material" 
              className="rounded-xl min-h-[110px] border-slate-200 text-xs leading-relaxed" 
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                📦 What's in the Box (1 item per line)
              </Label>
              <Textarea 
                name="whatsInBox" 
                defaultValue={defaultWhatsInBoxStr} 
                placeholder="1 × Personalized Water Bottle&#10;1 × Spill-Proof Straw & Lid&#10;1 × Soft Bottle Cleaning Brush" 
                className="rounded-xl min-h-[95px] border-slate-200 text-xs leading-relaxed" 
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                🛡️ Care & Maintenance (1 tip per line)
              </Label>
              <Textarea 
                name="careInstructions" 
                defaultValue={defaultCareStr} 
                placeholder="Hand wash recommended to preserve custom prints&#10;Do not place in microwave oven or direct freezer" 
                className="rounded-xl min-h-[95px] border-slate-200 text-xs leading-relaxed" 
              />
            </div>
          </div>
        </div>
      </div>

      {/* 7. Media & Badges */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
          <Sparkles className="h-4 w-4 text-[#5f259f]" />
          <h3 className="text-xs font-black uppercase tracking-widest text-slate-800">7. Badges & Gallery Media</h3>
        </div>

        <div className="grid grid-cols-2 gap-4 p-4 bg-purple-50/50 rounded-2xl border border-purple-100">
          <div className="flex items-center space-x-3">
            <Checkbox id="isNew" name="isNew" defaultChecked={editingProduct?.isNew} />
            <Label htmlFor="isNew" className="text-xs font-black uppercase text-slate-700 cursor-pointer">
              NEW Badge (Cyan)
            </Label>
          </div>
          <div className="flex items-center space-x-3">
            <Checkbox id="isBestSeller" name="isBestSeller" defaultChecked={editingProduct ? editingProduct.isBestSeller : true} />
            <Label htmlFor="isBestSeller" className="text-xs font-black uppercase text-slate-700 cursor-pointer">
              BEST SELLER Badge (Orange)
            </Label>
          </div>
        </div>

        <div className="space-y-1.5">
          <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Video Reel URL (Optional)</Label>
          <div className="relative">
            <Video className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#5f259f]" />
            <Input 
              name="videoUrl" 
              defaultValue={editingProduct?.videoUrl || ''} 
              placeholder="https://..." 
              className="pl-10 rounded-xl h-11 border-slate-200 text-xs" 
            />
          </div>
        </div>

        {/* Gallery Image URLs */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between">
            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">
              Gallery Images (First is Main Featured Image)
            </Label>
            <Button 
              type="button" 
              variant="outline" 
              size="sm" 
              onClick={addImageUrl} 
              className="h-8 rounded-lg text-[9px] font-black uppercase border-purple-200 text-[#5f259f] hover:bg-purple-50"
            >
              <Plus className="h-3 w-3 mr-1" /> Add Image URL
            </Button>
          </div>

          <div className="space-y-2.5">
            {imageUrls.map((url: string, i: number) => (
              <div key={i} className="flex gap-2 items-center">
                <div className="relative w-11 h-11 rounded-lg bg-slate-100 overflow-hidden shrink-0 border border-slate-200">
                  {url ? (
                    <img src={url} className="w-full h-full object-cover" alt="Preview" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-[10px] text-slate-400">
                      {i === 0 ? 'Main' : `#${i + 1}`}
                    </div>
                  )}
                </div>
                <Input 
                  value={url} 
                  onChange={(e) => updateImageUrl(i, e.target.value)}
                  placeholder="https://images.unsplash.com/... or cloud storage URL" 
                  className="flex-1 rounded-xl h-11 text-xs" 
                />
                <div className="flex flex-col gap-0.5">
                  <button type="button" onClick={() => moveImage(i, 'up')} className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-700">
                    <ChevronUp className="h-3 w-3" />
                  </button>
                  <button type="button" onClick={() => moveImage(i, 'down')} className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-700">
                    <ChevronDown className="h-3 w-3" />
                  </button>
                </div>
                <button 
                  type="button" 
                  onClick={() => removeImageUrl(i)} 
                  className="p-2 text-rose-400 hover:text-rose-600 rounded-lg hover:bg-rose-50"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Submit Button */}
      <div className="pt-4 sticky bottom-0 bg-white/95 backdrop-blur-md pb-2 z-10 border-t border-slate-100">
        <Button 
          type="submit" 
          disabled={isSaving} 
          className="w-full h-13 rounded-2xl bg-[#5f259f] hover:bg-[#4a1b7e] text-white font-black uppercase tracking-widest text-sm shadow-xl shadow-purple-200 transition-all"
        >
          {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : isEdit ? <Save className="h-4 w-4 mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
          {isEdit ? 'Save Changes' : 'Publish Product to Store'}
        </Button>
      </div>
    </form>
  );
}

export default function CategoryProductsPage({ params }: { params: Promise<{ category: string, subcategory: string }> }) {
  const resolvedParams = use(params);
  const db = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [imageUrls, setImageUrls] = useState<string[]>(['']);

  const isAuthorized = user?.email === SUPER_ADMIN_EMAIL;

  const productsQuery = useMemo(() => {
    if (!db) return null;
    return query(
      collection(db, 'products'),
      where('category', '==', resolvedParams.category),
      where('subcategory', '==', resolvedParams.subcategory)
    );
  }, [db, resolvedParams.category, resolvedParams.subcategory]);
  
  const { data: products, loading } = useCollection<any>(productsQuery);

  useEffect(() => {
    if (editingProduct) {
      setImageUrls(editingProduct.images?.length ? editingProduct.images : [editingProduct.image]);
    } else {
      setImageUrls(['']);
    }
  }, [editingProduct, isAddModalOpen]);

  const handleUpsertProduct = useCallback(async (e: React.FormEvent<HTMLFormElement>) => {
    if (!db || !user || !isAuthorized) return;

    e.preventDefault();
    setIsSaving(true);
    const formData = new FormData(e.currentTarget);
    
    const validImages = imageUrls.filter(url => url.trim() !== '');

    // Parse colors
    const colorsRaw = (formData.get('colors') as string) || '';
    const colors = colorsRaw
      .split(/[\n,]/)
      .map(s => s.trim())
      .filter(Boolean)
      .map(item => {
        const [name, hex] = item.split(':').map(x => x.trim());
        return { name: name || 'Color', hex: hex || '#9333ea' };
      });

    // Parse capacities
    const capacitiesRaw = (formData.get('capacities') as string) || '';
    const capacities = capacitiesRaw
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);

    // Parse multiline textareas
    const parseLines = (raw: string | null) => 
      (raw || '')
        .split('\n')
        .map(l => l.trim())
        .filter(Boolean);

    const highlights = parseLines(formData.get('highlights') as string);
    const whatsInBox = parseLines(formData.get('whatsInBox') as string);
    const careInstructions = parseLines(formData.get('careInstructions') as string);
    const personalizationOptions = parseLines(formData.get('personalizationOptions') as string);

    // Parse specifications
    const specifications: Record<string, string> = {
      'Capacity': (formData.get('specCapacity') as string) || '500 ml / 750 ml',
      'Material': (formData.get('specMaterial') as string) || 'Food-grade, BPA-Free (PP + Tritan)',
      'Weight': (formData.get('specWeight') as string) || '~ 210 g (500 ml)',
      'Dimensions': (formData.get('specDimensions') as string) || '7.2 × 22 cm (500 ml)',
      'Age Group': (formData.get('specAgeGroup') as string) || '3+ Years'
    };
    
    const productData: any = {
      name: formData.get('name'),
      subtitle: formData.get('subtitle') || '',
      sku: formData.get('sku') || '',
      description: formData.get('description') || 'Handcrafted with love.',
      price: Number(formData.get('price')),
      oldPrice: Number(formData.get('oldPrice')) || null,
      category: resolvedParams.category,
      subcategory: resolvedParams.subcategory,
      image: validImages[0] || '',
      images: validImages,
      videoUrl: formData.get('videoUrl') || '',
      inventoryStatus: formData.get('inventoryStatus') || 'In Stock',
      rating: Number(formData.get('rating')) || 5.0,
      boughtCount: formData.get('boughtCount') || '349+',
      deliveryTime: formData.get('deliveryTime') || '2 – 4 Days',
      personalizationTitle: formData.get('personalizationTitle') || 'Personalize Your Bottle',
      personalizationLabel: formData.get('personalizationLabel') || 'Name on Bottle *',
      personalizationMaxChars: Number(formData.get('personalizationMaxChars')) || 12,
      personalizationOptions: personalizationOptions.length ? personalizationOptions : null,
      colors: colors.length ? colors : null,
      capacities: capacities.length ? capacities : null,
      sizes: capacities.length ? capacities : null,
      highlights: highlights.length ? highlights : null,
      specifications,
      whatsInBox: whatsInBox.length ? whatsInBox : null,
      careInstructions: careInstructions.length ? careInstructions : null,
      reviews: editingProduct ? editingProduct.reviews : 128,
      isNew: formData.get('isNew') === 'on',
      isBestSeller: formData.get('isBestSeller') === 'on',
      updatedAt: serverTimestamp(),
      ...(editingProduct ? {} : { createdAt: serverTimestamp() })
    };

    if (editingProduct) {
      const docRef = doc(db, 'products', editingProduct.id);
      updateDoc(docRef, productData)
        .then(() => {
          toast({ title: "Product Updated!", description: "All details and tab sections saved successfully." });
          setEditingProduct(null);
        })
        .catch(async (err: any) => {
          errorEmitter.emit('permission-error', new FirestorePermissionError({
            path: docRef.path,
            operation: 'update',
            requestResourceData: productData,
          }));
        })
        .finally(() => setIsSaving(false));
    } else {
      addDoc(collection(db, 'products'), productData)
        .then(() => {
          toast({ title: "Product Added!", description: "Product is published and available in the store." });
          setIsAddModalOpen(false);
        })
        .catch(async (err: any) => {
          errorEmitter.emit('permission-error', new FirestorePermissionError({
            path: 'products',
            operation: 'create',
            requestResourceData: productData,
          }));
        })
        .finally(() => setIsSaving(false));
    }
  }, [db, user, isAuthorized, imageUrls, resolvedParams.category, resolvedParams.subcategory, editingProduct, toast]);

  const pageTitle = `${resolvedParams.subcategory.replace(/-/g, ' ')}`.toUpperCase();

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <Link href="/admin/products" className="flex items-center gap-2 text-[10px] font-black text-[#5f259f] uppercase tracking-widest hover:underline">
            <ArrowLeft className="h-3 w-3" /> Back
          </Link>
          <h1 className="text-3xl font-headline font-black text-slate-800 uppercase tracking-tight">{pageTitle}</h1>
        </div>

        {isAuthorized ? (
          <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
            <DialogTrigger asChild>
              <Button className="rounded-2xl bg-[#5f259f] hover:bg-[#4a1b7e] text-white h-14 px-10 font-black uppercase text-sm tracking-widest gap-2 shadow-xl shadow-purple-200 hover:shadow-2xl hover:shadow-purple-300 transition-all">
                <Plus className="h-5 w-5" /> Add Product
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl rounded-[2.5rem] border-none shadow-2xl p-0 max-h-[92vh] overflow-hidden flex flex-col">
              <DialogHeader className="p-6 md:p-8 border-b bg-slate-50/50">
                <DialogTitle className="text-2xl font-headline font-black text-slate-800 uppercase tracking-tight">Create New Product Entry</DialogTitle>
              </DialogHeader>
              <div className="p-6 md:p-8 overflow-y-auto max-h-[calc(92vh-100px)]">
                <ProductForm editingProduct={editingProduct} imageUrls={imageUrls} setImageUrls={setImageUrls} isSaving={isSaving} onSubmit={handleUpsertProduct} />
              </div>
            </DialogContent>
          </Dialog>
        ) : (
          <div className="bg-rose-50 px-6 py-4 rounded-2xl flex items-center gap-3 text-rose-600">
            <Lock className="h-5 w-5" />
            <span className="text-[10px] font-black uppercase tracking-widest">Locked Mode (Read-Only)</span>
          </div>
        )}
      </div>

      {/* Edit Product Modal */}
      <Dialog open={!!editingProduct} onOpenChange={(open) => !open && setEditingProduct(null)}>
        <DialogContent className="max-w-3xl rounded-[2.5rem] border-none shadow-2xl p-0 max-h-[92vh] overflow-hidden flex flex-col">
          <DialogHeader className="p-6 md:p-8 border-b bg-slate-50/50">
            <DialogTitle className="text-2xl font-headline font-black text-slate-800 uppercase tracking-tight">Edit Product Metadata</DialogTitle>
          </DialogHeader>
          <div className="p-6 md:p-8 overflow-y-auto max-h-[calc(92vh-100px)]">
            {editingProduct && <ProductForm isEdit editingProduct={editingProduct} imageUrls={imageUrls} setImageUrls={setImageUrls} isSaving={isSaving} onSubmit={handleUpsertProduct} />}
          </div>
        </DialogContent>
      </Dialog>

      {/* Products Table */}
      <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
        {loading ? (
          <div className="p-8 space-y-4 animate-pulse">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="flex items-center justify-between p-4 bg-slate-50/60 rounded-2xl gap-4">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 bg-slate-200 rounded-xl" />
                  <div className="space-y-1">
                    <div className="h-4 w-40 bg-slate-200 rounded-md" />
                    <div className="h-3 w-24 bg-slate-100 rounded-md" />
                  </div>
                </div>
                <div className="h-4 w-20 bg-slate-200 rounded-md" />
                <div className="h-6 w-20 bg-purple-100 rounded-full" />
                <div className="h-8 w-8 bg-slate-200 rounded-xl" />
              </div>
            ))}
          </div>
        ) : products && products.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow className="border-none bg-slate-50/50">
                <TableHead className="px-8 font-black text-[10px] uppercase tracking-widest text-slate-400 h-14">Product</TableHead>
                <TableHead className="font-black text-[10px] uppercase tracking-widest text-slate-400 h-14">Pricing & Stock</TableHead>
                <TableHead className="font-black text-[10px] uppercase tracking-widest text-slate-400 h-14">Social & Badges</TableHead>
                <TableHead className="px-8 text-right h-14"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map((product: any) => (
                <TableRow key={product.id} className="hover:bg-slate-50/30 border-slate-50 group">
                  <TableCell className="px-8 py-5">
                    <div className="flex items-center gap-4">
                      <div className="relative w-14 h-14 rounded-xl overflow-hidden bg-slate-50 border shrink-0">
                        <Image src={product.image || 'https://placehold.co/100'} alt={product.name} fill className="object-cover" />
                      </div>
                      <div className="space-y-1">
                        <div className="font-black text-sm text-slate-800">{product.name}</div>
                        {product.subtitle && (
                          <div className="text-xs text-slate-500 max-w-sm truncate">{product.subtitle}</div>
                        )}
                        <div className="text-[10px] font-mono text-slate-400 font-semibold">
                          SKU: {product.sku || 'N/A'} • {product.images?.length || 1} IMAGES
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="font-black text-sm text-slate-800">₹{product.price?.toLocaleString()}</div>
                    {product.oldPrice && (
                      <div className="text-xs text-slate-400 line-through">₹{product.oldPrice?.toLocaleString()}</div>
                    )}
                    <div className="text-[9px] font-black text-emerald-600 uppercase tracking-widest mt-1">
                      {product.inventoryStatus || 'In Stock'}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                       <div className="flex items-center gap-1 bg-amber-50 px-2 py-0.5 rounded text-[10px] font-black text-amber-600">
                         <Star className="h-3 w-3 fill-amber-600" /> {product.rating || 5.0}
                       </div>
                       {product.boughtCount && (
                         <div className="text-[10px] font-bold text-rose-500 bg-rose-50 px-2 py-0.5 rounded">
                           🔥 {product.boughtCount}
                         </div>
                       )}
                       {product.isBestSeller && (
                         <span className="text-[9px] font-black bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded uppercase">Best Seller</span>
                       )}
                       {product.isNew && (
                         <span className="text-[9px] font-black bg-sky-100 text-sky-700 px-1.5 py-0.5 rounded uppercase">New</span>
                       )}
                    </div>
                  </TableCell>
                  <TableCell className="px-8 text-right">
                    <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button variant="ghost" size="icon" onClick={() => setEditingProduct(product)} className="rounded-xl text-slate-400 hover:text-[#5f259f] hover:bg-purple-50">
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => {
                        if (db && confirm('Delete this product permanently?')) deleteDoc(doc(db, 'products', product.id));
                      }} className="rounded-xl text-slate-400 hover:text-rose-500 hover:bg-rose-50">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="flex flex-col items-center justify-center py-32 space-y-4">
             <Box className="h-10 w-10 text-slate-200" />
             <p className="text-xs font-black text-slate-400 uppercase tracking-widest">No products found in this subcategory</p>
          </div>
        )}
      </div>
    </div>
  );
}
