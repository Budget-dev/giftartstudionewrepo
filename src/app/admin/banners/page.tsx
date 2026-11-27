"use client";

import { useMemo, useState } from 'react';
import {
  Plus,
  Trash2,
  Edit,
  Eye,
  EyeOff,
  ExternalLink,
  Sparkles,
  Loader2,
  Layers,
  Clock,
  Monitor,
  Smartphone,
  Sliders,
  RotateCcw,
  Maximize2,
  Crop,
  Upload,
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
import { useFirestore, useCollection } from '@/firebase';
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
  query,
  orderBy
} from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Banner, BannerLayoutStyle, ImageTransform } from '@/lib/types';
import { compressImageFile, getImageTransformStyle, getOptimizedImageUrl } from '@/lib/image-optimizer';
import { HeroTornPaper } from '@/components/ui/hero-torn-paper';
import { ImageTransformEditor } from '@/components/admin/image-transform-editor';

type BannerPlacement = 'hero' | 'collection' | 'seasonal';

const DEFAULT_HERO_BANNERS = [
  {
    placement: 'hero' as BannerPlacement,
    imageUrl: "https://rohanwakkar.sirv.com/main-home-banner-website-design-home-page.png",
    mobileImageUrl: "https://rohanwakkar.sirv.com/WhatsApp%20Image%202026-06-20%20at%206.03.34%20PM.jpeg",
    title: "Main Homepage Banner",
    linkUrl: "/shop/new/best-sellers",
    order: 1,
    active: true,
    tornPaperBottom: true,
  }
];

const DEFAULT_COLLECTION_BANNERS = [
  {
    placement: 'collection' as BannerPlacement,
    imageUrl: "https://res.cloudinary.com/drjrbb4yn/image/upload/v1782027359/kids-image_pn17nh.png",
    mobileImageUrl: "https://res.cloudinary.com/drjrbb4yn/image/upload/v1782027359/kids-image_pn17nh.png",
    title: "Best Sellers — Boys & Girls Collection",
    linkUrl: "/shop/new/best-sellers",
    order: 1,
    active: true,
  }
];

const DEFAULT_SEASONAL_BANNERS = [
  {
    placement: 'seasonal' as BannerPlacement,
    imageUrl: "https://res.cloudinary.com/dwgnnr10/image/upload/v1785341862/festive-section-image-_zy2mxi.png",
    mobileImageUrl: "https://res.cloudinary.com/dwgnnr10/image/upload/v1785341862/festive-section-image-_zy2mxi.png",
    title: "Celebration & Seasonal Sale Collection",
    linkUrl: "/shop/new/festive",
    order: 1,
    active: true,
  }
];

const DEFAULT_DESKTOP_STYLE: BannerLayoutStyle = {
  heightMode: 'auto',
  heightPx: 620,
  widthMode: 'full',
  objectFit: 'cover',
  objectPosition: 'center top',
  paddingTop: 0,
  paddingBottom: 0,
  paddingX: 0,
  bgColor: '#f0f9ff',
};

const DEFAULT_MOBILE_STYLE: BannerLayoutStyle = {
  heightMode: 'auto',
  heightPx: 460,
  widthMode: 'full',
  objectFit: 'cover',
  objectPosition: 'center top',
  paddingTop: 0,
  paddingBottom: 0,
  paddingX: 0,
  bgColor: '#f0f9ff',
};

const DEFAULT_TRANSFORM: ImageTransform = { zoom: 1, x: 0, y: 0 };

const PLACEMENT_META: Record<BannerPlacement, {
  label: string;
  shortLabel: string;
  desc: string;
  badgeColor: string;
}> = {
  hero: {
    label: 'Main Hero Banner (16:9 Torn-Paper Template)',
    shortLabel: 'Main Hero (Torn Paper)',
    desc: 'Fixed 16:9 template with realistic torn-paper bottom edge and zero "Shop Now" button clutter. Supports multiple auto-rotating slides.',
    badgeColor: 'bg-purple-100 text-purple-800',
  },
  collection: {
    label: 'New Collection Banners (Boys & Girls Slider)',
    shortLabel: 'New Collection (Boys & Girls)',
    desc: 'Replaces or rotates the Boys & Girls showcase banners in the Best Sellers section. Multiple banners rotate automatically every 5 seconds.',
    badgeColor: 'bg-pink-100 text-pink-800',
  },
  seasonal: {
    label: 'Seasonal Collection & Festival Sale Slider',
    shortLabel: 'Seasonal / Festival Sale',
    desc: 'Replace the Raksha Bandhan banner with any festival, seasonal campaign, or promotional offer banners. Rotates automatically every 5 seconds.',
    badgeColor: 'bg-amber-100 text-amber-800',
  },
};

export default function AdminBannersPage() {
  const db = useFirestore();
  const { toast } = useToast();

  const [activePlacementTab, setActivePlacementTab] = useState<BannerPlacement>('hero');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);

  // Interactive Crop/Zoom/Drag modal state
  const [cropTarget, setCropTarget] = useState<'desktop' | 'mobile' | null>(null);

  // Form states
  const [placement, setPlacement] = useState<BannerPlacement>('hero');
  const [imageUrl, setImageUrl] = useState('');
  const [mobileImageUrl, setMobileImageUrl] = useState('');
  const [title, setTitle] = useState('');
  const [linkUrl, setLinkUrl] = useState('/shop');
  const [order, setOrder] = useState('1');
  const [active, setActive] = useState(true);
  const [tornPaperBottom, setTornPaperBottom] = useState(true);
  const [adjustTab, setAdjustTab] = useState<'desktop' | 'mobile'>('desktop');
  const [desktopStyle, setDesktopStyle] = useState<BannerLayoutStyle>(DEFAULT_DESKTOP_STYLE);
  const [mobileStyle, setMobileStyle] = useState<BannerLayoutStyle>(DEFAULT_MOBILE_STYLE);
  const [desktopTransform, setDesktopTransform] = useState<ImageTransform>(DEFAULT_TRANSFORM);
  const [mobileTransform, setMobileTransform] = useState<ImageTransform>(DEFAULT_TRANSFORM);

  const bannersQuery = useMemo(() => {
    if (!db) return null;
    return query(collection(db, 'banners'), orderBy('order', 'asc'));
  }, [db]);

  const { data: rawBanners, loading } = useCollection<any>(bannersQuery);

  const allBanners: Banner[] = useMemo(() => {
    if (!rawBanners) return [];
    return rawBanners.map(doc => ({
      id: doc.id,
      placement: (doc.placement as BannerPlacement) || 'hero',
      imageUrl: doc.imageUrl || '',
      mobileImageUrl: doc.mobileImageUrl || '',
      title: doc.title || '',
      linkUrl: doc.linkUrl || '/shop',
      order: typeof doc.order === 'number' ? doc.order : parseInt(doc.order, 10) || 0,
      active: doc.active !== false,
      desktopStyle: doc.desktopStyle,
      mobileStyle: doc.mobileStyle,
      desktopTransform: doc.desktopTransform || { ...DEFAULT_TRANSFORM },
      mobileTransform: doc.mobileTransform || { ...DEFAULT_TRANSFORM },
      tornPaperBottom: doc.tornPaperBottom !== false,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt
    })).sort((a, b) => a.order - b.order);
  }, [rawBanners]);

  const visibleBanners = useMemo(() => {
    return allBanners.filter((b) => (b.placement || 'hero') === activePlacementTab);
  }, [allBanners, activePlacementTab]);

  const resetForm = (targetPlacement: BannerPlacement = activePlacementTab) => {
    setPlacement(targetPlacement);
    setImageUrl('');
    setMobileImageUrl('');
    setTitle('');
    setLinkUrl('/shop');
    setOrder(String((allBanners.filter(b => (b.placement || 'hero') === targetPlacement).length || 0) + 1));
    setActive(true);
    setTornPaperBottom(true);
    setDesktopStyle({ ...DEFAULT_DESKTOP_STYLE });
    setMobileStyle({ ...DEFAULT_MOBILE_STYLE });
    setDesktopTransform({ ...DEFAULT_TRANSFORM });
    setMobileTransform({ ...DEFAULT_TRANSFORM });
    setAdjustTab('desktop');
    setEditingBanner(null);
  };

  const handleOpenCreate = () => {
    resetForm(activePlacementTab);
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (banner: Banner) => {
    setEditingBanner(banner);
    setPlacement((banner.placement as BannerPlacement) || 'hero');
    setImageUrl(banner.imageUrl || '');
    setMobileImageUrl(banner.mobileImageUrl || '');
    setTitle(banner.title || '');
    setLinkUrl(banner.linkUrl || '/shop');
    setOrder(String(banner.order || 1));
    setActive(banner.active !== false);
    setTornPaperBottom(banner.tornPaperBottom !== false);
    setDesktopStyle({ ...DEFAULT_DESKTOP_STYLE, ...(banner.desktopStyle || {}) });
    setMobileStyle({ ...DEFAULT_MOBILE_STYLE, ...(banner.mobileStyle || {}) });
    setDesktopTransform({ ...DEFAULT_TRANSFORM, ...(banner.desktopTransform || {}) });
    setMobileTransform({ ...DEFAULT_TRANSFORM, ...(banner.mobileTransform || {}) });
    setAdjustTab('desktop');
    setIsDialogOpen(true);
  };

  const handleDeviceUpload = async (target: 'desktop' | 'mobile', e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const compressed = await compressImageFile(file, target === 'mobile' ? 1000 : 1600, 0.84);
      if (target === 'desktop') {
        setImageUrl(compressed);
        setDesktopTransform({ zoom: 1, x: 0, y: 0 });
      } else {
        setMobileImageUrl(compressed);
        setMobileTransform({ zoom: 1, x: 0, y: 0 });
      }
      toast({ title: 'Image Uploaded', description: 'Now you can use Zoom, Crop & Reposition tools to adjust the fit.' });
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'Upload Failed', description: err.message });
    } finally {
      e.target.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!db) return;

    if (!imageUrl.trim()) {
      toast({
        variant: "destructive",
        title: "Banner Image Required",
        description: "Please upload a banner image or paste an HTTPS URL."
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const bannerData = {
        placement,
        imageUrl: imageUrl.trim(),
        mobileImageUrl: mobileImageUrl.trim() || imageUrl.trim(),
        title: title.trim(),
        linkUrl: linkUrl.trim() || '/shop',
        order: Number(order) || 1,
        active: Boolean(active),
        tornPaperBottom: placement === 'hero' ? Boolean(tornPaperBottom) : false,
        desktopStyle,
        mobileStyle,
        desktopTransform,
        mobileTransform,
        updatedAt: serverTimestamp()
      };

      if (editingBanner) {
        await updateDoc(doc(db, 'banners', editingBanner.id), bannerData);
        toast({
          title: "Banner Updated!",
          description: "Your customized crop, zoom & position changes are live."
        });
      } else {
        await addDoc(collection(db, 'banners'), {
          ...bannerData,
          createdAt: serverTimestamp()
        });
        toast({
          title: "Banner Added!",
          description: "Banner added to the 5-second automatic slider."
        });
      }

      setIsDialogOpen(false);
      resetForm(placement);
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Error saving banner",
        description: err.message || "Failed to save banner."
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleActive = async (banner: Banner) => {
    if (!db) return;
    try {
      await updateDoc(doc(db, 'banners', banner.id), {
        active: !banner.active,
        updatedAt: serverTimestamp()
      });
      toast({
        title: banner.active ? "Banner Paused" : "Banner Activated"
      });
    } catch {
      toast({ variant: "destructive", title: "Error", description: "Failed to toggle banner status." });
    }
  };

  const handleDelete = async (bannerId: string) => {
    if (!db) return;
    if (!window.confirm("Are you sure you want to delete this banner?")) return;
    try {
      await deleteDoc(doc(db, 'banners', bannerId));
      toast({ title: "Banner Deleted" });
    } catch (err: any) {
      toast({ variant: "destructive", title: "Delete Failed", description: err.message });
    }
  };

  const handleSeedCurrentTab = async () => {
    if (!db) return;
    setIsSeeding(true);
    try {
      const seeds =
        activePlacementTab === 'collection'
          ? DEFAULT_COLLECTION_BANNERS
          : activePlacementTab === 'seasonal'
            ? DEFAULT_SEASONAL_BANNERS
            : DEFAULT_HERO_BANNERS;

      for (const item of seeds) {
        await addDoc(collection(db, 'banners'), {
          ...item,
          desktopTransform: DEFAULT_TRANSFORM,
          mobileTransform: DEFAULT_TRANSFORM,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
      }
      toast({
        title: "Existing Banner Loaded!",
        description: "Click Edit on it to replace, crop, zoom, or add more slides."
      });
    } catch (err: any) {
      toast({ variant: "destructive", title: "Error initializing", description: err.message });
    } finally {
      setIsSeeding(false);
    }
  };

  const currentMeta = PLACEMENT_META[activePlacementTab];

  return (
    <div className="space-y-7 p-4 md:p-8 max-w-7xl mx-auto">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-50 text-purple-700 text-xs font-bold">
            <Layers className="w-3.5 h-3.5" />
            <span>Complete Banner &amp; Campaign Control</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-headline font-black text-slate-800 tracking-tight">
            Homepage Banners &amp; Sliders
          </h1>
          <p className="text-xs md:text-sm text-slate-500 font-medium">
            Manage Main 16:9 Torn-Paper Hero, Boys &amp; Girls Collection Slider, and Seasonal Sale Slider with full zoom, resize, crop, and drag positioning.
          </p>
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          {visibleBanners.length === 0 && !loading && (
            <Button
              type="button"
              variant="outline"
              onClick={handleSeedCurrentTab}
              disabled={isSeeding}
              className="rounded-2xl border-purple-200 text-purple-700 hover:bg-purple-50 text-xs font-bold h-11"
            >
              {isSeeding ? <Loader2 className="w-4 h-4 animate-spin mr-1.5" /> : <Sparkles className="w-4 h-4 mr-1.5 text-purple-600" />}
              Load Existing Banner
            </Button>
          )}

          <Button
            type="button"
            onClick={handleOpenCreate}
            className="flex-1 sm:flex-none rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold text-xs h-11 px-5 shadow-md shadow-purple-500/20 gap-2 active:scale-95 transition-all"
          >
            <Plus className="w-4 h-4" />
            Add {activePlacementTab === 'hero' ? 'Hero Banner' : activePlacementTab === 'collection' ? 'Collection Banner' : 'Seasonal Banner'}
          </Button>
        </div>
      </div>

      {/* Placement Tabs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {(['hero', 'collection', 'seasonal'] as BannerPlacement[]).map((key) => {
          const meta = PLACEMENT_META[key];
          const count = allBanners.filter((b) => (b.placement || 'hero') === key).length;
          const isSelected = activePlacementTab === key;
          return (
            <button
              key={key}
              type="button"
              onClick={() => setActivePlacementTab(key)}
              className={cn(
                "text-left p-4 rounded-2xl border-2 transition-all",
                isSelected
                  ? "bg-white border-purple-600 shadow-md shadow-purple-500/10"
                  : "bg-white/70 border-slate-200 hover:border-purple-200"
              )}
            >
              <div className="flex items-center justify-between gap-2 mb-1">
                <span className={cn("text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full", meta.badgeColor)}>
                  {count} Slide{count === 1 ? '' : 's'}
                </span>
                {isSelected && <CheckCircle2 className="w-4 h-4 text-purple-600" />}
              </div>
              <p className="font-extrabold text-sm text-slate-900">{meta.shortLabel}</p>
              <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">{meta.desc}</p>
            </button>
          );
        })}
      </div>

      {/* Section Context Notice */}
      <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-100 rounded-2xl text-xs text-purple-900 font-semibold">
        <Clock className="w-4 h-4 text-purple-600 shrink-0" />
        <span>
          <strong>{currentMeta.label}:</strong> {currentMeta.desc}
        </span>
      </div>

      {/* Banners Grid */}
      {loading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm animate-pulse space-y-4">
              <div className="w-full aspect-[16/9] bg-slate-100 rounded-2xl" />
              <div className="h-5 bg-slate-100 rounded-lg w-2/3" />
            </div>
          ))}
        </div>
      ) : visibleBanners.length === 0 ? (
        <Card className="rounded-3xl border-dashed border-2 border-slate-200 bg-white/70 p-10 text-center">
          <CardContent className="space-y-4 max-w-md mx-auto">
            <div className="w-14 h-14 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center mx-auto">
              <Layers className="w-7 h-7" />
            </div>
            <h3 className="text-lg font-bold text-slate-800">No Custom Banners Added for This Section Yet</h3>
            <p className="text-xs text-slate-500 font-medium">
              The storefront currently displays the fallback default artwork. Click &quot;Load Existing Banner&quot; to edit/replace it, or upload a brand-new banner!
            </p>
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={handleSeedCurrentTab}
                disabled={isSeeding}
                className="w-full sm:w-auto rounded-xl border-purple-200 text-purple-700 text-xs font-bold"
              >
                {isSeeding ? <Loader2 className="w-4 h-4 animate-spin mr-1.5" /> : <Sparkles className="w-4 h-4 mr-1.5 text-purple-600" />}
                Import Existing Banner
              </Button>
              <Button
                type="button"
                onClick={handleOpenCreate}
                className="w-full sm:w-auto rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold"
              >
                <Plus className="w-4 h-4 mr-1.5" /> Upload New Banner
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {visibleBanners.map((b, index) => (
            <Card
              key={b.id}
              className={cn(
                "rounded-3xl border transition-all duration-300 overflow-hidden group hover:shadow-xl bg-white flex flex-col",
                b.active ? "border-purple-100/80" : "border-slate-200 opacity-60"
              )}
            >
              {/* Image Preview Box with Torn Paper if hero */}
              <div className="relative aspect-[16/9] w-full bg-slate-100 overflow-hidden border-b border-slate-100">
                {b.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={getOptimizedImageUrl(b.imageUrl, 800, 80)}
                    alt={b.title || `Banner ${index + 1}`}
                    style={getImageTransformStyle(b.desktopTransform)}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-300 text-xs font-bold">
                    No Image
                  </div>
                )}

                {activePlacementTab === 'hero' && b.tornPaperBottom !== false && (
                  <HeroTornPaper className="absolute -bottom-[1px] left-0 right-0 scale-y-75 origin-bottom" />
                )}

                {/* Badges Overlay */}
                <div className="absolute top-3 left-3 flex items-center gap-2 z-20">
                  <span className="px-2.5 py-1 rounded-full bg-slate-900/85 backdrop-blur-md text-white text-[11px] font-black shadow-md">
                    #{b.order || index + 1}
                  </span>
                  <span className={cn(
                    "px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider backdrop-blur-md shadow-md",
                    b.active ? "bg-emerald-500/90 text-white" : "bg-rose-500/90 text-white"
                  )}>
                    {b.active ? "Active" : "Paused"}
                  </span>
                </div>
              </div>

              {/* Details Content */}
              <CardContent className="p-5 flex-1 flex flex-col justify-between space-y-4">
                <div className="space-y-1.5">
                  <h3 className="text-base font-bold text-slate-900 line-clamp-1">
                    {b.title || `Slide #${b.order || index + 1}`}
                  </h3>
                  {b.linkUrl && (
                    <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-500">
                      <ExternalLink className="w-3 h-3 text-purple-500 shrink-0" />
                      <span className="truncate">{b.linkUrl}</span>
                    </div>
                  )}
                </div>

                {/* Actions Footer */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => handleToggleActive(b)}
                    className={cn(
                      "text-xs font-bold px-3 py-1.5 rounded-xl border transition-colors flex items-center gap-1.5",
                      b.active
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                        : "bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200"
                    )}
                  >
                    {b.active ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                    {b.active ? "Enabled" : "Paused"}
                  </button>

                  <div className="flex items-center gap-1.5">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenEdit(b)}
                      className="rounded-xl h-8 px-2.5 text-xs font-bold text-slate-700 border-slate-200 hover:bg-slate-50"
                    >
                      <Edit className="w-3.5 h-3.5 mr-1 text-slate-500" /> Edit &amp; Crop
                    </Button>

                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(b.id)}
                      className="rounded-xl h-8 w-8 p-0 text-rose-500 hover:bg-rose-50 hover:text-rose-600"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add / Edit Banner Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-5xl max-h-[92vh] overflow-y-auto rounded-3xl p-6 sm:p-8">
          <DialogHeader>
            <DialogTitle className="text-xl font-headline font-black text-slate-900 tracking-tight">
              {editingBanner ? `Edit ${PLACEMENT_META[placement].shortLabel}` : `Add ${PLACEMENT_META[placement].shortLabel}`}
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Upload an image or paste URL, then use the Interactive Crop/Zoom/Drag tool to fit it cleanly inside the template.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="pt-3">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* LEFT COLUMN: Image Upload, URL, Title, Order */}
              <div className="lg:col-span-6 space-y-4">
                {/* Banner Section Selector */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-700">Banner Placement Section</Label>
                  <select
                    value={placement}
                    onChange={(e) => setPlacement(e.target.value as BannerPlacement)}
                    className="w-full h-10 rounded-xl border border-slate-200 px-3 text-xs font-bold bg-white"
                  >
                    <option value="hero">Main Homepage Banner (16:9 Torn Paper)</option>
                    <option value="collection">New Collection Banner (Boys &amp; Girls Slider)</option>
                    <option value="seasonal">Seasonal / Festival Sale Slider</option>
                  </select>
                </div>

                {/* Desktop Image URL + Upload + Crop Button */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                    <span>Desktop Banner Image *</span>
                    <span className="text-[10px] text-purple-600 font-semibold">16:9 Recommended</span>
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      type="text"
                      required
                      value={imageUrl}
                      onChange={(e) => setImageUrl(e.target.value)}
                      placeholder="https://... or upload from device →"
                      className="flex-1 rounded-xl h-10 border-slate-200 text-xs font-medium"
                    />
                    <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 h-10 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 text-xs font-bold shrink-0">
                      <Upload className="w-3.5 h-3.5" />
                      <span>Upload</span>
                      <input type="file" accept="image/*" className="hidden" onChange={(e) => handleDeviceUpload('desktop', e)} />
                    </label>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setCropTarget('desktop')}
                      disabled={!imageUrl.trim()}
                      className="rounded-xl h-10 px-3 text-xs font-bold border-purple-200 text-purple-700 gap-1 shrink-0"
                    >
                      <Crop className="w-3.5 h-3.5" /> Zoom / Crop
                    </Button>
                  </div>
                </div>

                {/* Mobile Image URL + Upload + Crop Button */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                    <span>Mobile Specific Image (Optional)</span>
                    <span className="text-[10px] text-slate-400 font-normal">Uses desktop image if empty</span>
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      type="text"
                      value={mobileImageUrl}
                      onChange={(e) => setMobileImageUrl(e.target.value)}
                      placeholder="https://... (optional mobile banner)"
                      className="flex-1 rounded-xl h-10 border-slate-200 text-xs font-medium"
                    />
                    <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold shrink-0">
                      <Upload className="w-3.5 h-3.5" />
                      <span>Upload</span>
                      <input type="file" accept="image/*" className="hidden" onChange={(e) => handleDeviceUpload('mobile', e)} />
                    </label>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setCropTarget('mobile')}
                      disabled={!mobileImageUrl.trim() && !imageUrl.trim()}
                      className="rounded-xl h-10 px-3 text-xs font-bold border-slate-200 text-slate-700 gap-1 shrink-0"
                    >
                      <Crop className="w-3.5 h-3.5" /> Crop
                    </Button>
                  </div>
                </div>

                {/* Section Title (useful for Collection/Seasonal headings) & Link URL */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-slate-700">
                      {placement === 'hero' ? 'Internal Slide Name (No overlay)' : 'Section Heading / Campaign Title'}
                    </Label>
                    <Input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder={placement === 'seasonal' ? 'e.g. Diwali Special Collection' : 'e.g. Kids Summer Collection'}
                      className="rounded-xl h-10 border-slate-200 text-xs font-medium"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-slate-700">Click Destination Link</Label>
                    <Input
                      type="text"
                      value={linkUrl}
                      onChange={(e) => setLinkUrl(e.target.value)}
                      placeholder="/shop/new/festive or /collections"
                      className="rounded-xl h-10 border-slate-200 text-xs font-medium"
                    />
                  </div>
                </div>

                {/* Torn paper toggle for Hero */}
                {placement === 'hero' && (
                  <div className="p-3.5 rounded-2xl bg-purple-50/70 border border-purple-200 flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xs font-extrabold text-purple-950">Fixed Torn-Paper Bottom Edge Template</p>
                      <p className="text-[10px] text-purple-700">Locked cleanly at the bottom edge of 16:9 banners while scrolling.</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setTornPaperBottom(!tornPaperBottom)}
                      className={cn(
                        "px-3 py-1.5 rounded-xl text-xs font-bold border",
                        tornPaperBottom ? "bg-purple-600 text-white border-purple-600" : "bg-white text-slate-600 border-slate-200"
                      )}
                    >
                      {tornPaperBottom ? 'Enabled' : 'Disabled'}
                    </button>
                  </div>
                )}

                {/* Order and Active status */}
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-slate-700">Slider Order (#)</Label>
                    <Input
                      type="number"
                      min="1"
                      value={order}
                      onChange={(e) => setOrder(e.target.value)}
                      className="rounded-xl h-10 border-slate-200 text-xs font-bold"
                    />
                  </div>
                  <div className="space-y-1.5 flex flex-col justify-end">
                    <Label className="text-xs font-bold text-slate-700">Visibility</Label>
                    <button
                      type="button"
                      onClick={() => setActive(!active)}
                      className={cn(
                        "h-10 px-3 rounded-xl border font-bold text-xs flex items-center justify-between transition-colors",
                        active ? "bg-emerald-50 border-emerald-300 text-emerald-700" : "bg-slate-100 border-slate-200 text-slate-500"
                      )}
                    >
                      <span className="flex items-center gap-1.5">
                        <span className={cn("w-2 h-2 rounded-full", active ? "bg-emerald-500" : "bg-slate-400")} />
                        {active ? "Active Slide" : "Paused"}
                      </span>
                      <span className="text-[10px] underline">Toggle</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* RIGHT COLUMN: Live Template Preview + Crop/CSS Adjustment Panel */}
              <div className="lg:col-span-6 bg-slate-50/90 border border-slate-200 rounded-2xl p-4 space-y-4">
                {(() => {
                  const isMobileTab = adjustTab === 'mobile';
                  const currentLayout = isMobileTab ? mobileStyle : desktopStyle;
                  const setCurrentLayout = isMobileTab ? setMobileStyle : setDesktopStyle;
                  const currentTransform = isMobileTab ? mobileTransform : desktopTransform;
                  const previewImg = isMobileTab ? (mobileImageUrl.trim() || imageUrl.trim()) : imageUrl.trim();

                  const updateField = <K extends keyof BannerLayoutStyle>(key: K, val: BannerLayoutStyle[K]) => {
                    setCurrentLayout(prev => ({ ...prev, [key]: val }));
                  };

                  return (
                    <>
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 text-xs font-black text-slate-800 uppercase tracking-wider">
                          <Sliders className="w-3.5 h-3.5 text-purple-600" />
                          <span>Template Preview &amp; Adjustments</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setCurrentLayout(isMobileTab ? { ...DEFAULT_MOBILE_STYLE } : { ...DEFAULT_DESKTOP_STYLE })}
                          className="text-[10px] font-bold text-slate-500 hover:text-purple-600 flex items-center gap-1"
                        >
                          <RotateCcw className="w-3 h-3" /> Reset CSS
                        </button>
                      </div>

                      {/* Desktop vs Mobile Switcher */}
                      <div className="grid grid-cols-2 gap-2 p-1 bg-white rounded-xl border border-slate-200">
                        <button
                          type="button"
                          onClick={() => setAdjustTab('desktop')}
                          className={cn(
                            "py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all",
                            !isMobileTab ? "bg-purple-600 text-white shadow-sm" : "text-slate-600 hover:bg-slate-50"
                          )}
                        >
                          <Monitor className="w-3.5 h-3.5" /> Desktop View
                        </button>
                        <button
                          type="button"
                          onClick={() => setAdjustTab('mobile')}
                          className={cn(
                            "py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all",
                            isMobileTab ? "bg-purple-600 text-white shadow-sm" : "text-slate-600 hover:bg-slate-50"
                          )}
                        >
                          <Smartphone className="w-3.5 h-3.5" /> Mobile View
                        </button>
                      </div>

                      {/* Interactive Crop Launcher Banner */}
                      <div className="flex items-center justify-between gap-2 bg-purple-100/70 border border-purple-200 rounded-xl p-2.5">
                        <div className="text-[11px] font-bold text-purple-900">
                          Zoom: <span className="font-black">{Math.round((currentTransform.zoom || 1) * 100)}%</span> | Pos: {currentTransform.x}%, {currentTransform.y}%
                        </div>
                        <Button
                          type="button"
                          size="sm"
                          disabled={!previewImg}
                          onClick={() => setCropTarget(isMobileTab ? 'mobile' : 'desktop')}
                          className="h-8 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-[11px] font-bold gap-1"
                        >
                          <Crop className="w-3.5 h-3.5" /> Drag / Zoom / Crop
                        </Button>
                      </div>

                      {/* Live Preview Inside Exact Template */}
                      <div className="space-y-1">
                        <span className="text-[10px] font-bold text-slate-400 uppercase">
                          Live {isMobileTab ? 'Mobile' : 'Desktop'} Template Preview:
                        </span>
                        <div className={cn(
                          "mx-auto border border-slate-300 rounded-xl overflow-hidden bg-slate-200 flex items-center justify-center",
                          isMobileTab ? "w-[180px]" : "w-full"
                        )}>
                          <div
                            style={{
                              backgroundColor: currentLayout.bgColor || '#f0f9ff',
                              paddingTop: `${Math.round((currentLayout.paddingTop || 0) * 0.3)}px`,
                              paddingBottom: `${Math.round((currentLayout.paddingBottom || 0) * 0.3)}px`,
                              paddingLeft: `${Math.round((currentLayout.paddingX || 0) * 0.3)}px`,
                              paddingRight: `${Math.round((currentLayout.paddingX || 0) * 0.3)}px`,
                              height: currentLayout.heightMode === 'custom' && currentLayout.heightPx
                                ? `${Math.max(80, Math.round(currentLayout.heightPx * (isMobileTab ? 0.38 : 0.28)))}px`
                                : isMobileTab ? '220px' : '170px',
                              width: currentLayout.widthMode === 'contained' ? '88%' : '100%',
                            }}
                            className="relative overflow-hidden transition-all"
                          >
                            {previewImg ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={previewImg}
                                alt="Live Preview"
                                style={{
                                  objectFit: currentLayout.objectFit || 'cover',
                                  objectPosition: currentLayout.objectPosition || 'center center',
                                  ...getImageTransformStyle(currentTransform),
                                }}
                                className="w-full h-full"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-[10px] font-bold text-slate-400">
                                Upload or Enter Image URL to Preview
                              </div>
                            )}
                            {placement === 'hero' && tornPaperBottom && (
                              <HeroTornPaper className="absolute -bottom-[1px] left-0 right-0 scale-y-50 origin-bottom" />
                            )}
                          </div>
                        </div>
                      </div>

                      {/* CSS Adjustments */}
                      <div className="grid grid-cols-2 gap-2.5 text-xs">
                        <div className="space-y-1">
                          <Label className="text-[11px] font-bold text-slate-600">Width</Label>
                          <select
                            value={currentLayout.widthMode || 'full'}
                            onChange={(e) => updateField('widthMode', e.target.value as any)}
                            className="w-full h-9 rounded-xl border border-slate-200 bg-white px-2.5 text-xs font-semibold"
                          >
                            <option value="full">100% Full Width</option>
                            <option value="contained">Contained Box</option>
                          </select>
                        </div>

                        <div className="space-y-1">
                          <Label className="text-[11px] font-bold text-slate-600">Image Fit</Label>
                          <select
                            value={currentLayout.objectFit || 'cover'}
                            onChange={(e) => updateField('objectFit', e.target.value as any)}
                            className="w-full h-9 rounded-xl border border-slate-200 bg-white px-2.5 text-xs font-semibold"
                          >
                            <option value="cover">Cover (Fill Edge-to-Edge)</option>
                            <option value="contain">Contain (Full Image)</option>
                            <option value="fill">Stretch 100%</option>
                          </select>
                        </div>

                        <div className="space-y-1">
                          <Label className="text-[11px] font-bold text-slate-600">Height Mode</Label>
                          <select
                            value={currentLayout.heightMode || 'auto'}
                            onChange={(e) => updateField('heightMode', e.target.value as any)}
                            className="w-full h-9 rounded-xl border border-slate-200 bg-white px-2.5 text-xs font-semibold"
                          >
                            <option value="auto">16:9 Template Auto</option>
                            <option value="custom">Custom Height (px)</option>
                          </select>
                        </div>

                        <div className="space-y-1">
                          <Label className="text-[11px] font-bold text-slate-600">Quick Fit Preset</Label>
                          <button
                            type="button"
                            onClick={() => setCurrentLayout(prev => ({ ...prev, widthMode: 'full', objectFit: 'cover', paddingTop: 0, paddingBottom: 0, paddingX: 0 }))}
                            className="w-full h-9 rounded-xl border border-purple-200 bg-white hover:bg-purple-50 text-purple-700 text-[11px] font-bold flex items-center justify-center gap-1"
                          >
                            <Maximize2 className="w-3 h-3" /> Edge-to-Edge 100%
                          </button>
                        </div>
                      </div>

                      {currentLayout.heightMode === 'custom' && (
                        <div className="space-y-1">
                          <div className="flex justify-between text-[11px] font-bold text-slate-700">
                            <span>Custom Height</span>
                            <span className="text-purple-700">{currentLayout.heightPx || (isMobileTab ? 460 : 620)}px</span>
                          </div>
                          <input
                            type="range"
                            min={220}
                            max={950}
                            step={10}
                            value={currentLayout.heightPx || (isMobileTab ? 460 : 620)}
                            onChange={(e) => updateField('heightPx', Number(e.target.value))}
                            className="w-full accent-purple-600"
                          />
                        </div>
                      )}

                      <div className="grid grid-cols-3 gap-2 pt-1 border-t border-slate-200">
                        <div className="space-y-1">
                          <div className="flex justify-between text-[10px] font-bold text-slate-600">
                            <span>Pad Top</span>
                            <span>{currentLayout.paddingTop || 0}px</span>
                          </div>
                          <input
                            type="range"
                            min={0}
                            max={160}
                            step={4}
                            value={currentLayout.paddingTop || 0}
                            onChange={(e) => updateField('paddingTop', Number(e.target.value))}
                            className="w-full accent-purple-600"
                          />
                        </div>
                        <div className="space-y-1">
                          <div className="flex justify-between text-[10px] font-bold text-slate-600">
                            <span>Pad Bottom</span>
                            <span>{currentLayout.paddingBottom || 0}px</span>
                          </div>
                          <input
                            type="range"
                            min={0}
                            max={160}
                            step={4}
                            value={currentLayout.paddingBottom || 0}
                            onChange={(e) => updateField('paddingBottom', Number(e.target.value))}
                            className="w-full accent-purple-600"
                          />
                        </div>
                        <div className="space-y-1">
                          <div className="flex justify-between text-[10px] font-bold text-slate-600">
                            <span>Pad X</span>
                            <span>{currentLayout.paddingX || 0}px</span>
                          </div>
                          <input
                            type="range"
                            min={0}
                            max={100}
                            step={4}
                            value={currentLayout.paddingX || 0}
                            onChange={(e) => updateField('paddingX', Number(e.target.value))}
                            className="w-full accent-purple-600"
                          />
                        </div>
                      </div>
                    </>
                  );
                })()}
              </div>
            </div>

            <DialogFooter className="pt-5 mt-5 border-t border-slate-100 flex items-center justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
                className="rounded-xl h-11 text-xs font-bold border-slate-200 text-slate-600"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="rounded-xl h-11 px-6 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold text-xs shadow-md shadow-purple-500/20"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-1.5" />
                    Saving...
                  </>
                ) : (
                  editingBanner ? "Save & Publish Banner" : "Publish Banner"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Interactive Banner Crop / Zoom / Drag Modal */}
      <ImageTransformEditor
        open={cropTarget !== null}
        onOpenChange={(o) => !o && setCropTarget(null)}
        imageUrl={cropTarget === 'mobile' ? (mobileImageUrl || imageUrl) : imageUrl}
        initialTransform={cropTarget === 'mobile' ? mobileTransform : desktopTransform}
        aspectRatio={cropTarget === 'mobile' ? '3/4' : placement === 'hero' ? '16/9' : '16/7'}
        showTornPaperOverlay={placement === 'hero' && tornPaperBottom}
        title={cropTarget === 'mobile' ? 'Adjust Mobile Banner (Zoom, Crop & Position)' : 'Adjust Desktop Banner (Zoom, Crop & Position)'}
        onSave={({ imageUrl: updatedUrl, transform }) => {
          if (cropTarget === 'mobile') {
            setMobileImageUrl(updatedUrl);
            setMobileTransform(transform);
          } else {
            setImageUrl(updatedUrl);
            setDesktopTransform(transform);
          }
        }}
      />
    </div>
  );
}
