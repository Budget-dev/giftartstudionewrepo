"use client";

import { useMemo, useState, useEffect } from 'react';
import {
  Shapes,
  Plus,
  Trash2,
  Edit,
  ArrowUp,
  ArrowDown,
  Crop,
  Upload,
  Sparkles,
  Loader2,
  ExternalLink,
  CheckCircle2
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { useFirestore, useDoc } from '@/firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { DEFAULT_CATEGORIES_CARDS, CategoryCardItem } from '@/components/home/category-grid';
import { ImageTransformEditor } from '@/components/admin/image-transform-editor';
import { compressImageFile, getImageTransformStyle, getOptimizedImageUrl } from '@/lib/image-optimizer';
import type { ImageTransform } from '@/lib/types';

export default function AdminCategoriesPage() {
  const db = useFirestore();
  const { toast } = useToast();

  const categoriesDocRef = useMemo(() => {
    if (!db) return null;
    return doc(db, 'homepage_sections', 'categories');
  }, [db]);

  const { data: cmsDoc, loading } = useDoc<{ title?: string; cards?: CategoryCardItem[] }>(categoriesDocRef);

  const [cards, setCards] = useState<CategoryCardItem[]>(DEFAULT_CATEGORIES_CARDS);
  const [isSaving, setIsSaving] = useState(false);

  // Dialog states
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editIndex, setEditIndex] = useState<number | null>(null);
  const [catTitle, setCatTitle] = useState('');
  const [catUrl, setCatUrl] = useState('');
  const [catImageUrl, setCatImageUrl] = useState('');
  const [catTextColor, setCatTextColor] = useState('#4338CA');
  const [catTransform, setCatTransform] = useState<ImageTransform>({ zoom: 1, x: 0, y: 0 });
  const [isCropOpen, setIsCropOpen] = useState(false);

  useEffect(() => {
    if (cmsDoc?.cards && Array.isArray(cmsDoc.cards) && cmsDoc.cards.length > 0) {
      setCards(cmsDoc.cards);
    }
  }, [cmsDoc]);

  const persistCategories = async (nextCards: CategoryCardItem[], successMsg = 'Categories updated live!') => {
    if (!db) return;
    setIsSaving(true);
    try {
      await setDoc(
        doc(db, 'homepage_sections', 'categories'),
        {
          title: 'Shop By Category',
          cards: nextCards,
          updatedAt: serverTimestamp()
        },
        { merge: true }
      );
      setCards(nextCards);
      toast({ title: 'Saved!', description: successMsg });
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'Save Failed', description: err.message });
    } finally {
      setIsSaving(false);
    }
  };

  const openAddDialog = () => {
    setEditIndex(null);
    setCatTitle('');
    setCatUrl('/shop/personalized-gifts/mugs');
    setCatImageUrl('');
    setCatTextColor('#6D28D9');
    setCatTransform({ zoom: 1, x: 0, y: 0 });
    setIsDialogOpen(true);
  };

  const openEditDialog = (idx: number) => {
    const item = cards[idx];
    setEditIndex(idx);
    setCatTitle(item.title || '');
    setCatUrl(item.url || '/shop');
    setCatImageUrl(item.imageUrl || '');
    setCatTextColor(item.textColor || '#6D28D9');
    setCatTransform(item.imageTransform || { zoom: 1, x: 0, y: 0 });
    setIsDialogOpen(true);
  };

  const handleUploadImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const compressed = await compressImageFile(file, 900, 0.84);
      setCatImageUrl(compressed);
      setCatTransform({ zoom: 1, x: 0, y: 0 });
      toast({ title: 'Image Uploaded', description: 'Use "Adjust / Zoom / Crop (1:1)" to fine-tune the square fill.' });
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'Upload Error', description: err.message });
    } finally {
      e.target.value = '';
    }
  };

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!catTitle.trim() || !catImageUrl.trim()) {
      toast({ variant: 'destructive', title: 'Required', description: 'Category title and image are required.' });
      return;
    }

    const nextItem: CategoryCardItem = {
      id: editIndex !== null ? (cards[editIndex].id || `cat-${Date.now()}`) : `cat-${Date.now()}`,
      title: catTitle.trim(),
      url: catUrl.trim() || '/shop',
      imageUrl: catImageUrl.trim(),
      textColor: catTextColor || '#6D28D9',
      imageTransform: catTransform,
    };

    const nextCards = [...cards];
    if (editIndex !== null) {
      nextCards[editIndex] = nextItem;
    } else {
      nextCards.push(nextItem);
    }

    await persistCategories(nextCards, `Category "${nextItem.title}" saved with 1:1 crop & positioning.`);
    setIsDialogOpen(false);
  };

  const handleMove = async (idx: number, dir: -1 | 1) => {
    const target = idx + dir;
    if (target < 0 || target >= cards.length) return;
    const nextCards = [...cards];
    const [moved] = nextCards.splice(idx, 1);
    nextCards.splice(target, 0, moved);
    await persistCategories(nextCards, 'Category order updated.');
  };

  const handleDelete = async (idx: number) => {
    if (!window.confirm(`Delete category "${cards[idx].title}"?`)) return;
    const nextCards = cards.filter((_, i) => i !== idx);
    await persistCategories(nextCards, 'Category deleted.');
  };

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-100 text-purple-700 text-[10px] font-black uppercase tracking-wider">
            <Shapes className="w-3.5 h-3.5" />
            <span>Homepage Category Slider</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Category Images &amp; 1:1 Square Editor
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Upload, replace, zoom, drag, and crop homepage category images inside a fixed 1:1 square edge-to-edge template (zero borders or gaps).
          </p>
        </div>

        <Button
          onClick={openAddDialog}
          className="bg-purple-600 hover:bg-purple-700 text-white rounded-2xl font-bold text-xs h-11 px-5 gap-2 shadow-md shadow-purple-500/20"
        >
          <Plus className="w-4 h-4" />
          Add Category
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {cards.map((cat, idx) => (
            <Card key={cat.id || idx} className="rounded-3xl overflow-hidden border border-slate-200 bg-white shadow-sm flex flex-col">
              {/* 1:1 Edge-to-Edge Square Preview */}
              <div className="relative aspect-square w-full overflow-hidden bg-slate-100">
                <img
                  src={getOptimizedImageUrl(cat.imageUrl, 400, 80)}
                  alt={cat.title}
                  style={getImageTransformStyle(cat.imageTransform)}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-slate-900/75 text-white text-[10px] font-black">
                  #{idx + 1}
                </div>
              </div>

              <CardContent className="p-3.5 space-y-3 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="font-extrabold text-sm text-slate-900 truncate" style={{ color: cat.textColor }}>
                    {cat.title}
                  </h3>
                  <p className="text-[10px] text-slate-400 truncate flex items-center gap-1 mt-0.5">
                    <ExternalLink className="w-3 h-3 shrink-0" /> {cat.url}
                  </p>
                </div>

                <div className="flex items-center justify-between gap-1 pt-2 border-t border-slate-100">
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleMove(idx, -1)}
                      disabled={idx === 0 || isSaving}
                      className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 disabled:opacity-30 text-slate-700"
                      title="Move Left"
                    >
                      <ArrowUp className="w-3 h-3 -rotate-90" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleMove(idx, 1)}
                      disabled={idx === cards.length - 1 || isSaving}
                      className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 disabled:opacity-30 text-slate-700"
                      title="Move Right"
                    >
                      <ArrowDown className="w-3 h-3 -rotate-90" />
                    </button>
                  </div>

                  <div className="flex items-center gap-1">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => openEditDialog(idx)}
                      className="h-7 px-2 rounded-lg text-[10px] font-bold gap-1"
                    >
                      <Edit className="w-3 h-3" /> Edit
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => handleDelete(idx)}
                      className="h-7 w-7 rounded-lg text-rose-500 hover:bg-rose-50"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg rounded-3xl p-6">
          <DialogHeader>
            <DialogTitle className="font-black text-xl">
              {editIndex !== null ? 'Edit Category & 1:1 Image' : 'Add Homepage Category'}
            </DialogTitle>
            <DialogDescription className="text-xs">
              Upload any image size and adjust it inside the fixed 1:1 square frame so there are zero borders or gaps.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveCategory} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold">Category Title *</Label>
                <Input
                  required
                  value={catTitle}
                  onChange={(e) => setCatTitle(e.target.value)}
                  placeholder="e.g. DIY Kits"
                  className="rounded-xl h-10 text-xs"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-bold">Title Badge Color</Label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={catTextColor}
                    onChange={(e) => setCatTextColor(e.target.value)}
                    className="w-10 h-10 rounded-xl border border-slate-200 cursor-pointer"
                  />
                  <span className="text-xs font-mono text-slate-500">{catTextColor}</span>
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold">Target Shop Link *</Label>
              <Input
                required
                value={catUrl}
                onChange={(e) => setCatUrl(e.target.value)}
                placeholder="/shop/kids/kids-gifts"
                className="rounded-xl h-10 text-xs"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-bold">Category Photo (1:1 Square Edge-to-Edge) *</Label>
              <div className="flex gap-2">
                <Input
                  required
                  value={catImageUrl}
                  onChange={(e) => setCatImageUrl(e.target.value)}
                  placeholder="https://... or upload photo →"
                  className="flex-1 rounded-xl h-10 text-xs"
                />
                <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 h-10 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 text-xs font-bold shrink-0">
                  <Upload className="w-3.5 h-3.5" />
                  <span>Upload</span>
                  <input type="file" accept="image/*" className="hidden" onChange={handleUploadImage} />
                </label>
              </div>
            </div>

            {/* Live 1:1 Square Preview + Crop Trigger */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center gap-4">
              <div className="relative w-24 h-24 rounded-2xl overflow-hidden bg-white shadow-sm shrink-0">
                {catImageUrl ? (
                  <img
                    src={catImageUrl}
                    alt="Preview"
                    style={getImageTransformStyle(catTransform)}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-[10px] font-bold text-slate-400">1:1 Preview</div>
                )}
              </div>

              <div className="flex-1 space-y-2">
                <p className="text-xs font-bold text-slate-800">1:1 Edge-to-Edge Fit</p>
                <p className="text-[11px] text-slate-500">
                  Zoom: <strong>{Math.round(catTransform.zoom * 100)}%</strong> | Position: {catTransform.x}%, {catTransform.y}%
                </p>
                <Button
                  type="button"
                  size="sm"
                  disabled={!catImageUrl.trim()}
                  onClick={() => setIsCropOpen(true)}
                  className="bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold gap-1.5"
                >
                  <Crop className="w-3.5 h-3.5" /> Zoom, Drag &amp; Crop (1:1)
                </Button>
              </div>
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} className="rounded-xl text-xs">
                Cancel
              </Button>
              <Button type="submit" disabled={isSaving} className="bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold gap-1.5">
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                Save Category
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ImageTransformEditor
        open={isCropOpen}
        onOpenChange={setIsCropOpen}
        imageUrl={catImageUrl}
        initialTransform={catTransform}
        aspectRatio="1/1"
        title="Crop & Position Category Photo (1:1 Square)"
        onSave={({ imageUrl: updatedUrl, transform }) => {
          setCatImageUrl(updatedUrl);
          setCatTransform(transform);
        }}
      />
    </div>
  );
}
