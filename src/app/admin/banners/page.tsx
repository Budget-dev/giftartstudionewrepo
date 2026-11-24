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
  HelpCircle
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
import { Banner } from '@/lib/types';

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
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto rounded-3xl p-6 sm:p-8">
          <DialogHeader>
            <DialogTitle className="text-xl font-headline font-black text-slate-900 tracking-tight">
              {editingBanner ? "Edit Banner" : "Add New Banner"}
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Provide the banner image URL and optional details. Active banners will cycle every 5 seconds on the homepage.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-5 pt-3">
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
                className="rounded-xl h-11 border-slate-200 text-xs font-medium focus-visible:ring-purple-500"
              />
              <p className="text-[10px] text-slate-400">
                Direct image link (Sirv, Cloudinary, AWS S3, or any HTTPS PNG/JPEG URL).
              </p>
            </div>

            {/* Desktop Image Preview */}
            {imageUrl.trim() && (
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Live Image Preview:</span>
                <div className="relative aspect-[16/7] w-full rounded-2xl bg-slate-100 overflow-hidden border border-slate-200">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={imageUrl.trim()}
                    alt="Preview"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                  />
                </div>
              </div>
            )}

            {/* Mobile Image URL (Optional) */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                <span>Mobile Specific Image URL (Optional)</span>
                <span className="text-[10px] text-slate-400 font-normal">Falls back to desktop URL if empty</span>
              </Label>
              <Input
                type="url"
                value={mobileImageUrl}
                onChange={(e) => setMobileImageUrl(e.target.value)}
                placeholder="https://rohanwakkar.sirv.com/my-mobile-banner.jpeg"
                className="rounded-xl h-11 border-slate-200 text-xs font-medium focus-visible:ring-purple-500"
              />
            </div>

            {/* Optional Banner Title & Subheading */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-700">
                  Banner Heading (Optional)
                </Label>
                <Input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Unique Gifts, Made for Kids"
                  className="rounded-xl h-11 border-slate-200 text-xs font-medium focus-visible:ring-purple-500"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-700">
                  Badge / Subheading (Optional)
                </Label>
                <Input
                  type="text"
                  value={subHeading}
                  onChange={(e) => setSubHeading(e.target.value)}
                  placeholder="e.g. UNIQUE, PERSONALIZED GIFTS"
                  className="rounded-xl h-11 border-slate-200 text-xs font-medium focus-visible:ring-purple-500"
                />
              </div>
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-700">
                Short Description (Optional)
              </Label>
              <Input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g. Create unforgettable memories with personalized gifts."
                className="rounded-xl h-11 border-slate-200 text-xs font-medium focus-visible:ring-purple-500"
              />
            </div>

            {/* Button Text & Target Link */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-700">
                  CTA Button Text (Optional)
                </Label>
                <Input
                  type="text"
                  value={primaryButtonText}
                  onChange={(e) => setPrimaryButtonText(e.target.value)}
                  placeholder="e.g. Explore Shop (leave blank to hide button)"
                  className="rounded-xl h-11 border-slate-200 text-xs font-medium focus-visible:ring-purple-500"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-700">
                  Destination / Click Link URL
                </Label>
                <Input
                  type="text"
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  placeholder="e.g. /shop or /collections"
                  className="rounded-xl h-11 border-slate-200 text-xs font-medium focus-visible:ring-purple-500"
                />
              </div>
            </div>

            {/* Order and Active status */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-700">
                  Slide Sequence / Order
                </Label>
                <Input
                  type="number"
                  min="1"
                  value={order}
                  onChange={(e) => setOrder(e.target.value)}
                  placeholder="1"
                  className="rounded-xl h-11 border-slate-200 text-xs font-bold focus-visible:ring-purple-500"
                />
                <p className="text-[10px] text-slate-400">Order #1 appears first, then #2, etc.</p>
              </div>

              <div className="space-y-1.5 flex flex-col justify-end">
                <Label className="text-xs font-bold text-slate-700 mb-2">
                  Display Status
                </Label>
                <button
                  type="button"
                  onClick={() => setActive(!active)}
                  className={cn(
                    "h-11 px-4 rounded-xl border font-bold text-xs flex items-center justify-between transition-colors",
                    active
                      ? "bg-emerald-50 border-emerald-300 text-emerald-700"
                      : "bg-slate-100 border-slate-200 text-slate-500"
                  )}
                >
                  <span className="flex items-center gap-2">
                    <span className={cn("w-2.5 h-2.5 rounded-full", active ? "bg-emerald-500 animate-pulse" : "bg-slate-400")} />
                    {active ? "Active in Carousel" : "Disabled / Hidden"}
                  </span>
                  <span className="text-[10px] uppercase underline">Toggle</span>
                </button>
              </div>
            </div>

            <DialogFooter className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
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
