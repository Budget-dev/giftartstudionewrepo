"use client";

import { useMemo, useState } from 'react';
import Image from 'next/image';
import { 
  Plus, 
  Trash2, 
  Edit, 
  Eye, 
  EyeOff, 
  ArrowUp, 
  ArrowDown, 
  ExternalLink, 
  Sparkles, 
  Loader2, 
  Layers, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  HelpCircle,
  Monitor,
  Smartphone,
  Sliders,
  RotateCcw,
  Maximize2
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
import { Banner, BannerLayoutStyle } from '@/lib/types';

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

const INITIAL_DEFAULT_BANNERS = [
  {
    imageUrl: "https://rohanwakkar.sirv.com/main-home-banner-website-design-home-page.png",
    mobileImageUrl: "https://rohanwakkar.sirv.com/WhatsApp%20Image%202026-06-20%20at%206.03.34%20PM.jpeg",
    subHeading: "UNIQUE, PERSONALIZED GIFTS",
    title: "Unique Gifts, Made for Kids",
    description: "Create unforgettable childhood memories with our premium handcrafted collection of personalized bags, toys, and essentials.",
    primaryButtonText: "Explore Shop",
    linkUrl: "/shop/new/best-sellers",
    order: 1,
    active: true
  }
];

export default function AdminBannersPage() {
  const db = useFirestore();
  const { toast } = useToast();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);

  // Form states
  const [imageUrl, setImageUrl] = useState('');
  const [mobileImageUrl, setMobileImageUrl] = useState('');
  const [title, setTitle] = useState('');
  const [subHeading, setSubHeading] = useState('');
  const [description, setDescription] = useState('');
  const [primaryButtonText, setPrimaryButtonText] = useState('Explore Shop');
  const [linkUrl, setLinkUrl] = useState('/shop');
  const [order, setOrder] = useState('1');
  const [active, setActive] = useState(true);
  const [adjustTab, setAdjustTab] = useState<'desktop' | 'mobile'>('desktop');
  const [desktopStyle, setDesktopStyle] = useState<BannerLayoutStyle>(DEFAULT_DESKTOP_STYLE);
  const [mobileStyle, setMobileStyle] = useState<BannerLayoutStyle>(DEFAULT_MOBILE_STYLE);

  const bannersQuery = useMemo(() => {
    if (!db) return null;
    return query(collection(db, 'banners'), orderBy('order', 'asc'));
  }, [db]);

  const { data: rawBanners, loading } = useCollection<any>(bannersQuery);

  const banners: Banner[] = useMemo(() => {
    if (!rawBanners) return [];
    return rawBanners.map(doc => ({
      id: doc.id,
      imageUrl: doc.imageUrl || '',
      mobileImageUrl: doc.mobileImageUrl || '',
      title: doc.title || '',
      subHeading: doc.subHeading || '',
      description: doc.description || '',
      primaryButtonText: doc.primaryButtonText || 'Explore Shop',
      linkUrl: doc.linkUrl || '/shop',
      order: typeof doc.order === 'number' ? doc.order : parseInt(doc.order, 10) || 0,
      active: doc.active !== false,
      desktopStyle: doc.desktopStyle,
      mobileStyle: doc.mobileStyle,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt
    })).sort((a, b) => a.order - b.order);
  }, [rawBanners]);

  const resetForm = () => {
    setImageUrl('');
    setMobileImageUrl('');
    setTitle('');
    setSubHeading('');
    setDescription('');
    setPrimaryButtonText('Explore Shop');
    setLinkUrl('/shop');
    setOrder(String((banners.length || 0) + 1));
    setActive(true);
    setDesktopStyle({ ...DEFAULT_DESKTOP_STYLE });
    setMobileStyle({ ...DEFAULT_MOBILE_STYLE });
    setAdjustTab('desktop');
    setEditingBanner(null);
  };

  const handleOpenCreate = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (banner: Banner) => {
    setEditingBanner(banner);
    setImageUrl(banner.imageUrl || '');
    setMobileImageUrl(banner.mobileImageUrl || '');
    setTitle(banner.title || '');
    setSubHeading(banner.subHeading || '');
    setDescription(banner.description || '');
    setPrimaryButtonText(banner.primaryButtonText || 'Explore Shop');
    setLinkUrl(banner.linkUrl || '/shop');
    setOrder(String(banner.order || 1));
    setActive(banner.active !== false);
    setDesktopStyle({ ...DEFAULT_DESKTOP_STYLE, ...(banner.desktopStyle || {}) });
    setMobileStyle({ ...DEFAULT_MOBILE_STYLE, ...(banner.mobileStyle || {}) });
    setAdjustTab('desktop');
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!db) return;

    if (!imageUrl.trim()) {
      toast({
        variant: "destructive",
        title: "Image URL Required",
        description: "Please enter the desktop/main banner image URL."
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const bannerData = {
        imageUrl: imageUrl.trim(),
        mobileImageUrl: mobileImageUrl.trim() || imageUrl.trim(),
        title: title.trim(),
        subHeading: subHeading.trim(),
        description: description.trim(),
        primaryButtonText: primaryButtonText.trim() || 'Explore Shop',
        linkUrl: linkUrl.trim() || '/shop',
        order: Number(order) || 1,
        active: Boolean(active),
        desktopStyle,
        mobileStyle,
        updatedAt: serverTimestamp()
      };

      if (editingBanner) {
        await updateDoc(doc(db, 'banners', editingBanner.id), bannerData);
        toast({
          title: "Banner Updated!",
          description: "Changes are now live on the homepage carousel."
        });
      } else {
        await addDoc(collection(db, 'banners'), {
          ...bannerData,
          createdAt: serverTimestamp()
        });
        toast({
          title: "Banner Added!",
          description: "New banner will appear in the 5-second rotation."
        });
      }

      setIsDialogOpen(false);
      resetForm();
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
        title: banner.active ? "Banner Deactivated" : "Banner Activated",
        description: banner.active
          ? "This banner will not appear on the website."
          : "This banner is now active in the 5-second carousel."
      });
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to toggle banner status."
      });
    }
  };

  const handleDelete = async (bannerId: string) => {
    if (!db) return;
    if (!window.confirm("Are you sure you want to delete this banner?")) return;

    try {
      await deleteDoc(doc(db, 'banners', bannerId));
      toast({
        title: "Banner Deleted",
        description: "Banner has been removed from the homepage slider."
      });
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Error deleting banner",
        description: err.message || "Failed to delete banner."
      });
    }
  };

  const handleSeedDefaults = async () => {
    if (!db) return;
    setIsSeeding(true);
    try {
      for (const item of INITIAL_DEFAULT_BANNERS) {
        await addDoc(collection(db, 'banners'), {
          ...item,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
      }
      toast({
        title: "Default Banner Initialized!",
        description: "You can now edit it or add more banners alongside it."
      });
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Error initializing",
        description: err.message
      });
    } finally {
      setIsSeeding(false);
    }
  };

  return (
    <div className="space-y-8 p-4 md:p-8 max-w-7xl mx-auto">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-50 text-purple-700 text-xs font-bold">
            <Layers className="w-3.5 h-3.5" />
            <span>Homepage Hero Carousel</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-headline font-black text-slate-800 tracking-tight">
            Banner Management
          </h1>
          <p className="text-xs md:text-sm text-slate-500 font-medium">
            Add banner images using image URLs. Active banners automatically slide one by one every 5 seconds on the website.
          </p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          {banners.length === 0 && !loading && (
            <Button
              type="button"
              variant="outline"
              onClick={handleSeedDefaults}
              disabled={isSeeding}
              className="rounded-2xl border-purple-200 text-purple-700 hover:bg-purple-50 text-xs font-bold h-11"
            >
              {isSeeding ? <Loader2 className="w-4 h-4 animate-spin mr-1.5" /> : <Sparkles className="w-4 h-4 mr-1.5 text-purple-600" />}
              Load Default Banner
            </Button>
          )}

          <Button
            type="button"
            onClick={handleOpenCreate}
            className="flex-1 sm:flex-none rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold text-xs h-11 px-5 shadow-md shadow-purple-500/20 gap-2 active:scale-95 transition-all"
          >
            <Plus className="w-4 h-4" />
            Add New Banner
          </Button>
        </div>
      </div>

      {/* 5-Second Notice Banner */}
      <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-100 rounded-2xl text-xs text-purple-900 font-semibold">
        <Clock className="w-4 h-4 text-purple-600 shrink-0" />
        <span>
          <strong>Auto-Rotation Enabled:</strong> Customers on the homepage will see these banners transition automatically every <strong>5 seconds</strong>. Users can also swipe or use the left/right arrows to browse.
        </span>
      </div>

      {/* Banners Grid / List */}
      {loading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm animate-pulse space-y-4">
              <div className="w-full aspect-[16/9] bg-slate-100 rounded-2xl" />
              <div className="h-5 bg-slate-100 rounded-lg w-2/3" />
              <div className="h-4 bg-slate-50 rounded-lg w-1/2" />
            </div>
          ))}
        </div>
      ) : banners.length === 0 ? (
        <Card className="rounded-3xl border-dashed border-2 border-slate-200 bg-white/70 p-12 text-center">
          <CardContent className="space-y-4 max-w-md mx-auto">
            <div className="w-16 h-16 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center mx-auto">
              <Layers className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-slate-800">No Banners Added Yet</h3>
            <p className="text-xs text-slate-500 font-medium">
              The website is currently displaying the fallback default banner. Click &quot;Load Default Banner&quot; to import it or click &quot;Add New Banner&quot; to add your own custom image URLs!
            </p>
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={handleSeedDefaults}
                disabled={isSeeding}
                className="w-full sm:w-auto rounded-xl border-purple-200 text-purple-700 text-xs font-bold"
              >
                {isSeeding ? <Loader2 className="w-4 h-4 animate-spin mr-1.5" /> : <Sparkles className="w-4 h-4 mr-1.5 text-purple-600" />}
                Import Default Banner
              </Button>
              <Button
                type="button"
                onClick={handleOpenCreate}
                className="w-full sm:w-auto rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold"
              >
                <Plus className="w-4 h-4 mr-1.5" /> Add First Banner
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {banners.map((b, index) => (
            <Card 
              key={b.id} 
              className={cn(
                "rounded-3xl border transition-all duration-300 overflow-hidden group hover:shadow-xl bg-white flex flex-col",
                b.active ? "border-purple-100/80" : "border-slate-200 opacity-60"
              )}
            >
              {/* Image Preview Box */}
              <div className="relative aspect-[16/9] w-full bg-slate-100 overflow-hidden border-b border-slate-100">
                {b.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={b.imageUrl}
                    alt={b.title || `Banner ${index + 1}`}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-300 text-xs font-bold">
                    No Image URL
                  </div>
                )}

                {/* Badges Overlay */}
                <div className="absolute top-3 left-3 flex items-center gap-2">
                  <span className="px-2.5 py-1 rounded-full bg-slate-900/85 backdrop-blur-md text-white text-[11px] font-black shadow-md">
                    #{b.order || index + 1}
                  </span>
                  <span className={cn(
                    "px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider backdrop-blur-md shadow-md",
                    b.active ? "bg-emerald-500/90 text-white" : "bg-rose-500/90 text-white"
                  )}>
                    {b.active ? "Active" : "Disabled"}
                  </span>
                </div>

                {b.mobileImageUrl && b.mobileImageUrl !== b.imageUrl && (
                  <div className="absolute bottom-3 left-3 px-2 py-0.5 rounded-md bg-purple-900/80 text-white text-[9px] font-bold backdrop-blur-sm">
                    Mobile Specific Image Set
                  </div>
                )}
              </div>

              {/* Details Content */}
              <CardContent className="p-5 flex-1 flex flex-col justify-between space-y-4">
                <div className="space-y-1.5">
                  {b.subHeading && (
                    <p className="text-[10px] font-black text-purple-600 uppercase tracking-widest">
                      {b.subHeading}
                    </p>
                  )}
                  <h3 className="text-base font-bold text-slate-900 line-clamp-1">
                    {b.title || `Banner #${b.order || index + 1}`}
                  </h3>
                  {b.description && (
                    <p className="text-xs text-slate-500 font-medium line-clamp-2">
                      {b.description}
                    </p>
                  )}
                  {b.linkUrl && (
                    <div className="flex items-center gap-1.5 pt-1 text-[11px] font-semibold text-slate-600">
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
                    {b.active ? "Enabled" : "Disabled"}
                  </button>

                  <div className="flex items-center gap-1.5">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenEdit(b)}
                      className="rounded-xl h-8 px-2.5 text-xs font-bold text-slate-700 border-slate-200 hover:bg-slate-50"
                    >
                      <Edit className="w-3.5 h-3.5 mr-1 text-slate-500" /> Edit
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
              {editingBanner ? "Edit Banner & Layout Adjustments" : "Add New Banner & Layout Adjustments"}
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Add your banner URLs and fine-tune Desktop &amp; Mobile width, height/length, image fit, alignment, and CSS padding before submitting.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="pt-3">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* LEFT COLUMN: Banner URLs & Content */}
              <div className="lg:col-span-6 space-y-4">
                {/* Desktop / Main Image URL */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                    <span>Desktop / Main Banner Image URL *</span>
                    <span className="text-[10px] text-purple-600 font-semibold">Required</span>
                  </Label>
                  <Input
                    type="url"
                    required
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    placeholder="https://rohanwakkar.sirv.com/my-banner.png"
                    className="rounded-xl h-10 border-slate-200 text-xs font-medium focus-visible:ring-purple-500"
                  />
                </div>

                {/* Mobile Image URL (Optional) */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                    <span>Mobile Specific Image URL (Optional)</span>
                    <span className="text-[10px] text-slate-400 font-normal">Falls back to desktop URL</span>
                  </Label>
                  <Input
                    type="url"
                    value={mobileImageUrl}
                    onChange={(e) => setMobileImageUrl(e.target.value)}
                    placeholder="https://rohanwakkar.sirv.com/my-mobile-banner.jpeg"
                    className="rounded-xl h-10 border-slate-200 text-xs font-medium focus-visible:ring-purple-500"
                  />
                </div>

                {/* Optional Banner Title & Subheading */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-slate-700">Banner Heading (Optional)</Label>
                    <Input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="e.g. Unique Gifts, Made for Kids"
                      className="rounded-xl h-10 border-slate-200 text-xs font-medium"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-slate-700">Badge / Subheading (Optional)</Label>
                    <Input
                      type="text"
                      value={subHeading}
                      onChange={(e) => setSubHeading(e.target.value)}
                      placeholder="e.g. UNIQUE, PERSONALIZED GIFTS"
                      className="rounded-xl h-10 border-slate-200 text-xs font-medium"
                    />
                  </div>
                </div>

                {/* Description */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-700">Short Description (Optional)</Label>
                  <Input
                    type="text"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="e.g. Create unforgettable memories with personalized gifts."
                    className="rounded-xl h-10 border-slate-200 text-xs font-medium"
                  />
                </div>

                {/* Button Text & Target Link */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-slate-700">CTA Button Text (Optional)</Label>
                    <Input
                      type="text"
                      value={primaryButtonText}
                      onChange={(e) => setPrimaryButtonText(e.target.value)}
                      placeholder="e.g. Explore Shop"
                      className="rounded-xl h-10 border-slate-200 text-xs font-medium"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-slate-700">Destination Link URL</Label>
                    <Input
                      type="text"
                      value={linkUrl}
                      onChange={(e) => setLinkUrl(e.target.value)}
                      placeholder="e.g. /shop or /collections"
                      className="rounded-xl h-10 border-slate-200 text-xs font-medium"
                    />
                  </div>
                </div>

                {/* Order and Active status */}
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-slate-700">Slide Order</Label>
                    <Input
                      type="number"
                      min="1"
                      value={order}
                      onChange={(e) => setOrder(e.target.value)}
                      className="rounded-xl h-10 border-slate-200 text-xs font-bold"
                    />
                  </div>
                  <div className="space-y-1.5 flex flex-col justify-end">
                    <Label className="text-xs font-bold text-slate-700">Status</Label>
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
                        {active ? "Active" : "Hidden"}
                      </span>
                      <span className="text-[10px] underline">Toggle</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* RIGHT COLUMN: Desktop & Mobile CSS / Layout Adjustments + Live Preview */}
              <div className="lg:col-span-6 bg-slate-50/90 border border-slate-200 rounded-2xl p-4 space-y-4">
                {(() => {
                  const isMobileTab = adjustTab === 'mobile';
                  const currentLayout = isMobileTab ? mobileStyle : desktopStyle;
                  const setCurrentLayout = isMobileTab ? setMobileStyle : setDesktopStyle;
                  const previewImg = isMobileTab ? (mobileImageUrl.trim() || imageUrl.trim()) : imageUrl.trim();

                  const updateField = <K extends keyof BannerLayoutStyle>(key: K, val: BannerLayoutStyle[K]) => {
                    setCurrentLayout(prev => ({ ...prev, [key]: val }));
                  };

                  return (
                    <>
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 text-xs font-black text-slate-800 uppercase tracking-wider">
                          <Sliders className="w-3.5 h-3.5 text-purple-600" />
                          <span>Layout &amp; CSS Adjustments</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setCurrentLayout(isMobileTab ? { ...DEFAULT_MOBILE_STYLE } : { ...DEFAULT_DESKTOP_STYLE })}
                          className="text-[10px] font-bold text-slate-500 hover:text-purple-600 flex items-center gap-1"
                        >
                          <RotateCcw className="w-3 h-3" /> Reset {isMobileTab ? 'Mobile' : 'Desktop'}
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

                      {/* Quick 1-Click Fit Presets */}
                      <div className="flex flex-wrap gap-1.5">
                        <button
                          type="button"
                          onClick={() => setCurrentLayout(prev => ({ ...prev, widthMode: 'full', objectFit: 'contain', paddingTop: 0, paddingBottom: 0, paddingX: 0 }))}
                          className="px-2.5 py-1 rounded-lg bg-purple-100 hover:bg-purple-200 text-purple-800 text-[10px] font-bold flex items-center gap-1"
                        >
                          <Maximize2 className="w-3 h-3" /> Full Width (No Crop)
                        </button>
                        <button
                          type="button"
                          onClick={() => setCurrentLayout(prev => ({ ...prev, widthMode: 'full', objectFit: 'cover', objectPosition: 'center center' }))}
                          className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 text-[10px] font-bold"
                        >
                          Full Bleed Cover
                        </button>
                        <button
                          type="button"
                          onClick={() => setCurrentLayout(prev => ({ ...prev, widthMode: 'full', objectFit: 'fill', paddingX: 0 }))}
                          className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 text-[10px] font-bold"
                        >
                          Stretch 100%
                        </button>
                      </div>

                      {/* Live Scaled Preview */}
                      <div className="space-y-1">
                        <span className="text-[10px] font-bold text-slate-400 uppercase">
                          Live {isMobileTab ? 'Mobile' : 'Desktop'} Preview:
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
                                : isMobileTab ? '220px' : '150px',
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
                                  objectPosition: currentLayout.objectPosition || 'center top',
                                }}
                                className="w-full h-full"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-[10px] font-bold text-slate-400">
                                Enter Image URL to Preview
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Adjustment Controls */}
                      <div className="grid grid-cols-2 gap-3 text-xs">
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
                            <option value="cover">Cover (Fill Area)</option>
                            <option value="contain">Contain (Full Image, No Crop)</option>
                            <option value="fill">Fill (Stretch 100%)</option>
                          </select>
                        </div>

                        <div className="space-y-1">
                          <Label className="text-[11px] font-bold text-slate-600">Height Mode</Label>
                          <select
                            value={currentLayout.heightMode || 'auto'}
                            onChange={(e) => updateField('heightMode', e.target.value as any)}
                            className="w-full h-9 rounded-xl border border-slate-200 bg-white px-2.5 text-xs font-semibold"
                          >
                            <option value="auto">Auto Aspect Ratio</option>
                            <option value="custom">Custom Length (px)</option>
                          </select>
                        </div>

                        <div className="space-y-1">
                          <Label className="text-[11px] font-bold text-slate-600">Image Alignment</Label>
                          <select
                            value={currentLayout.objectPosition || 'center top'}
                            onChange={(e) => updateField('objectPosition', e.target.value as any)}
                            className="w-full h-9 rounded-xl border border-slate-200 bg-white px-2.5 text-xs font-semibold"
                          >
                            <option value="center top">Top</option>
                            <option value="center center">Center</option>
                            <option value="center bottom">Bottom</option>
                            <option value="left center">Left</option>
                            <option value="right center">Right</option>
                          </select>
                        </div>
                      </div>

                      {currentLayout.heightMode === 'custom' && (
                        <div className="space-y-1">
                          <div className="flex justify-between text-[11px] font-bold text-slate-700">
                            <span>Banner Length / Height</span>
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

                      {/* CSS Padding Sliders */}
                      <div className="space-y-2.5 pt-1 border-t border-slate-200">
                        <div className="space-y-1">
                          <div className="flex justify-between text-[11px] font-bold text-slate-600">
                            <span>Padding Top</span>
                            <span className="text-purple-700">{currentLayout.paddingTop || 0}px</span>
                          </div>
                          <input
                            type="range"
                            min={0}
                            max={200}
                            step={4}
                            value={currentLayout.paddingTop || 0}
                            onChange={(e) => updateField('paddingTop', Number(e.target.value))}
                            className="w-full accent-purple-600"
                          />
                        </div>

                        <div className="space-y-1">
                          <div className="flex justify-between text-[11px] font-bold text-slate-600">
                            <span>Padding Bottom</span>
                            <span className="text-purple-700">{currentLayout.paddingBottom || 0}px</span>
                          </div>
                          <input
                            type="range"
                            min={0}
                            max={200}
                            step={4}
                            value={currentLayout.paddingBottom || 0}
                            onChange={(e) => updateField('paddingBottom', Number(e.target.value))}
                            className="w-full accent-purple-600"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-3 items-center">
                          <div className="space-y-1">
                            <div className="flex justify-between text-[11px] font-bold text-slate-600">
                              <span>Left / Right Padding</span>
                              <span className="text-purple-700">{currentLayout.paddingX || 0}px</span>
                            </div>
                            <input
                              type="range"
                              min={0}
                              max={120}
                              step={4}
                              value={currentLayout.paddingX || 0}
                              onChange={(e) => updateField('paddingX', Number(e.target.value))}
                              className="w-full accent-purple-600"
                            />
                          </div>

                          <div className="space-y-1">
                            <Label className="text-[11px] font-bold text-slate-600 block">Background Color</Label>
                            <div className="flex items-center gap-2">
                              <input
                                type="color"
                                value={currentLayout.bgColor || '#f0f9ff'}
                                onChange={(e) => updateField('bgColor', e.target.value)}
                                className="w-9 h-8 rounded-lg border border-slate-200 cursor-pointer"
                              />
                              <span className="text-[10px] font-mono text-slate-500">{currentLayout.bgColor || '#f0f9ff'}</span>
                            </div>
                          </div>
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
                  editingBanner ? "Update Banner" : "Add Banner"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
