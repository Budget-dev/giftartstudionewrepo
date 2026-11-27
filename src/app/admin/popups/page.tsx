"use client";

import { useMemo, useState, useEffect } from 'react';
import {
  BellRing,
  Plus,
  Trash2,
  Edit,
  Eye,
  EyeOff,
  Power,
  CheckCircle2,
  Loader2,
  Sparkles,
  MapPin,
  Clock,
  ExternalLink,
  Package
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { useFirestore, useCollection, useDoc } from '@/firebase';
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  setDoc,
  serverTimestamp,
  query,
  orderBy
} from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { getOptimizedImageUrl } from '@/lib/image-optimizer';

interface PurchasePopup {
  id: string;
  buyerName: string;
  productName: string;
  location: string;
  timeLabel: string;
  imageUrl: string;
  productUrl?: string;
  active: boolean;
  order: number;
}

export default function AdminPopupsPage() {
  const db = useFirestore();
  const { toast } = useToast();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<PurchasePopup | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSavingSettings, setIsSavingSettings] = useState(false);

  // Form state
  const [buyerName, setBuyerName] = useState('');
  const [productName, setProductName] = useState('');
  const [location, setLocation] = useState('');
  const [timeLabel, setTimeLabel] = useState('15 mins ago');
  const [imageUrl, setImageUrl] = useState('');
  const [productUrl, setProductUrl] = useState('');
  const [active, setActive] = useState(true);
  const [intervalSeconds, setIntervalSeconds] = useState(16);

  // Global settings doc
  const settingsRef = useMemo(() => {
    if (!db) return null;
    return doc(db, 'settings', 'purchase_popups');
  }, [db]);
  const { data: settings } = useDoc<{ enabled?: boolean; intervalSeconds?: number }>(settingsRef);

  // Welcome / Grand Opening animation toggle doc
  const welcomeSettingsRef = useMemo(() => {
    if (!db) return null;
    return doc(db, 'settings', 'grand_opening');
  }, [db]);
  const { data: welcomeSettings } = useDoc<{ enabled?: boolean }>(welcomeSettingsRef);
  const [isSavingWelcome, setIsSavingWelcome] = useState(false);

  const isGlobalEnabled = settings?.enabled !== false;
  const isWelcomeEnabled = welcomeSettings?.enabled === true;

  const handleToggleWelcome = async (nextEnabled: boolean) => {
    if (!db) return;
    setIsSavingWelcome(true);
    try {
      await setDoc(
        doc(db, 'settings', 'grand_opening'),
        { enabled: nextEnabled, updatedAt: serverTimestamp() },
        { merge: true }
      );
      toast({
        title: nextEnabled ? 'Welcome Animation Enabled' : 'Welcome Animation Disabled',
        description: nextEnabled
          ? 'The Jai Shankar ribbon-cutting inauguration animation will now show to new visitors.'
          : 'The welcome inauguration animation is now turned OFF.'
      });
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'Error', description: err.message });
    } finally {
      setIsSavingWelcome(false);
    }
  };

  useEffect(() => {
    if (settings?.intervalSeconds) {
      setIntervalSeconds(settings.intervalSeconds);
    }
  }, [settings?.intervalSeconds]);

  // Custom popups list
  const popupsQuery = useMemo(() => {
    if (!db) return null;
    return query(collection(db, 'purchase_popups'), orderBy('order', 'asc'));
  }, [db]);
  const { data: popups, loading } = useCollection<PurchasePopup>(popupsQuery);

  // Products for quick-fill
  const productsQuery = useMemo(() => {
    if (!db) return null;
    return query(collection(db, 'products'));
  }, [db]);
  const { data: products } = useCollection<any>(productsQuery);

  const handleToggleGlobal = async (nextEnabled: boolean) => {
    if (!db) return;
    setIsSavingSettings(true);
    try {
      await setDoc(
        doc(db, 'settings', 'purchase_popups'),
        { enabled: nextEnabled, intervalSeconds: Number(intervalSeconds) || 16, updatedAt: serverTimestamp() },
        { merge: true }
      );
      toast({
        title: nextEnabled ? 'Purchase Popups Enabled' : 'Purchase Popups Stopped',
        description: nextEnabled
          ? 'Active custom popups will now appear on the website.'
          : 'All purchase popups are now completely hidden on the website.'
      });
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'Error', description: err.message });
    } finally {
      setIsSavingSettings(false);
    }
  };

  const handleSaveInterval = async () => {
    if (!db) return;
    setIsSavingSettings(true);
    try {
      await setDoc(
        doc(db, 'settings', 'purchase_popups'),
        { enabled: isGlobalEnabled, intervalSeconds: Math.max(8, Number(intervalSeconds) || 16), updatedAt: serverTimestamp() },
        { merge: true }
      );
      toast({ title: 'Timing Updated', description: `Popups will rotate every ${Math.max(8, Number(intervalSeconds) || 16)} seconds.` });
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'Error', description: err.message });
    } finally {
      setIsSavingSettings(false);
    }
  };

  const openCreateDialog = () => {
    setEditingItem(null);
    setBuyerName('Priya');
    setProductName('');
    setLocation('Mumbai, India');
    setTimeLabel('15 mins ago');
    setImageUrl('');
    setProductUrl('');
    setActive(true);
    setIsDialogOpen(true);
  };

  const openEditDialog = (item: PurchasePopup) => {
    setEditingItem(item);
    setBuyerName(item.buyerName || '');
    setProductName(item.productName || '');
    setLocation(item.location || '');
    setTimeLabel(item.timeLabel || '');
    setImageUrl(item.imageUrl || '');
    setProductUrl(item.productUrl || '');
    setActive(item.active !== false);
    setIsDialogOpen(true);
  };

  const handleQuickFillProduct = (productId: string) => {
    const prod = products?.find((p: any) => p.id === productId);
    if (!prod) return;
    setProductName(prod.name || '');
    setImageUrl(prod.image || (Array.isArray(prod.images) ? prod.images[0] : '') || '');
    setProductUrl(`/product/${prod.id}`);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!db) return;
    if (!productName.trim() || !imageUrl.trim()) {
      toast({ variant: 'destructive', title: 'Missing Fields', description: 'Product name and image URL are required.' });
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        buyerName: buyerName.trim() || 'Someone',
        productName: productName.trim(),
        location: location.trim() || 'India',
        timeLabel: timeLabel.trim() || 'Recently',
        imageUrl: imageUrl.trim(),
        productUrl: productUrl.trim(),
        active,
        updatedAt: serverTimestamp()
      };

      if (editingItem) {
        await updateDoc(doc(db, 'purchase_popups', editingItem.id), payload);
        toast({ title: 'Popup Updated', description: 'Your custom purchase popup has been saved.' });
      } else {
        await addDoc(collection(db, 'purchase_popups'), {
          ...payload,
          order: (popups?.length || 0) + 1,
          createdAt: serverTimestamp()
        });
        toast({ title: 'Popup Added', description: 'New purchase popup is ready.' });
      }
      setIsDialogOpen(false);
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'Save Failed', description: err.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleItemActive = async (item: PurchasePopup) => {
    if (!db) return;
    try {
      await updateDoc(doc(db, 'purchase_popups', item.id), { active: !(item.active !== false) });
      toast({ title: item.active !== false ? 'Popup Paused' : 'Popup Activated' });
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'Error', description: err.message });
    }
  };

  const handleDelete = async (id: string) => {
    if (!db) return;
    try {
      await deleteDoc(doc(db, 'purchase_popups', id));
      toast({ title: 'Popup Deleted' });
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'Delete Failed', description: err.message });
    }
  };

  return (
    <div className="p-4 sm:p-8 max-w-6xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-100 text-purple-700 text-[10px] font-black uppercase tracking-wider mb-2">
            <BellRing className="w-3.5 h-3.5" />
            <span>Live Social Proof</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Purchase Popups Manager
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Add your own verified buyer popups or turn them off globally. Displayed as a compact, pill-shaped badge on the storefront.
          </p>
        </div>

        <Button
          onClick={openCreateDialog}
          className="bg-purple-600 hover:bg-purple-700 text-white rounded-2xl font-bold text-xs h-11 px-5 gap-2 shadow-md shadow-purple-500/20"
        >
          <Plus className="w-4 h-4" />
          Add Purchase Popup
        </Button>
      </div>

      {/* Master On/Off Toggle & Timing Card */}
      <Card className={cn(
        "rounded-3xl border-2 transition-colors shadow-sm",
        isGlobalEnabled ? "border-emerald-200 bg-emerald-50/40" : "border-rose-200 bg-rose-50/40"
      )}>
        <CardContent className="p-5 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="flex items-start gap-4">
            <div className={cn(
              "w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-sm",
              isGlobalEnabled ? "bg-emerald-600 text-white" : "bg-rose-600 text-white"
            )}>
              <Power className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-extrabold text-base sm:text-lg text-slate-900">
                  {isGlobalEnabled ? 'Purchase Popups are LIVE' : 'Purchase Popups are STOPPED'}
                </h2>
                <span className={cn(
                  "text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full",
                  isGlobalEnabled ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"
                )}>
                  {isGlobalEnabled ? 'ON' : 'OFF'}
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-1">
                {isGlobalEnabled
                  ? 'Only your custom popups below will be shown (demo popups are completely removed).'
                  : 'No purchase popups will be shown to visitors on mobile or desktop.'}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-2xl border border-slate-200">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-xs font-bold text-slate-600">Every</span>
              <input
                type="number"
                min={8}
                max={120}
                value={intervalSeconds}
                onChange={(e) => setIntervalSeconds(Number(e.target.value))}
                className="w-12 text-center text-xs font-black text-slate-900 bg-slate-50 border border-slate-200 rounded-lg py-1"
              />
              <span className="text-xs font-bold text-slate-600">sec</span>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={handleSaveInterval}
                disabled={isSavingSettings}
                className="h-7 px-2.5 text-[11px] font-bold text-purple-700 hover:bg-purple-50 rounded-xl"
              >
                Save
              </Button>
            </div>

            <Button
              type="button"
              onClick={() => handleToggleGlobal(!isGlobalEnabled)}
              disabled={isSavingSettings}
              variant={isGlobalEnabled ? 'destructive' : 'default'}
              className={cn(
                "rounded-2xl font-extrabold text-xs h-11 px-5 gap-2",
                !isGlobalEnabled && "bg-emerald-600 hover:bg-emerald-700 text-white"
              )}
            >
              {isSavingSettings ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Power className="w-4 h-4" />
              )}
              {isGlobalEnabled ? 'Stop All Popups' : 'Enable Popups'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Welcome Animation (Jai Shankar) On/Off Toggle Card */}
      <Card className={cn(
        "rounded-3xl border-2 transition-colors shadow-sm",
        isWelcomeEnabled ? "border-amber-300 bg-amber-50/50" : "border-slate-200 bg-slate-50/70"
      )}>
        <CardContent className="p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className={cn(
              "w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-sm",
              isWelcomeEnabled ? "bg-amber-500 text-white" : "bg-slate-600 text-white"
            )}>
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-extrabold text-base sm:text-lg text-slate-900">
                  Welcome Inauguration Animation (Jai Shankar)
                </h2>
                <span className={cn(
                  "text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full",
                  isWelcomeEnabled ? "bg-amber-100 text-amber-800" : "bg-slate-200 text-slate-600"
                )}>
                  {isWelcomeEnabled ? 'ON' : 'OFF'}
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-1">
                {isWelcomeEnabled
                  ? 'Ribbon-cutting countdown & Jai Shankar celebration animation is currently ON for visitors.'
                  : 'Currently disabled. Visitors go straight to the homepage without the ribbon-cutting screen.'}
              </p>
            </div>
          </div>

          <Button
            type="button"
            onClick={() => handleToggleWelcome(!isWelcomeEnabled)}
            disabled={isSavingWelcome}
            variant={isWelcomeEnabled ? 'destructive' : 'default'}
            className={cn(
              "rounded-2xl font-extrabold text-xs h-11 px-5 gap-2 shrink-0",
              !isWelcomeEnabled && "bg-amber-600 hover:bg-amber-700 text-white"
            )}
          >
            {isSavingWelcome ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Power className="w-4 h-4" />
            )}
            {isWelcomeEnabled ? 'Turn Off Welcome Animation' : 'Turn On Welcome Animation'}
          </Button>
        </CardContent>
      </Card>

      {/* Live Pill-Shaped Preview */}
      <div className="bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 rounded-3xl p-6 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-md">
        <div className="space-y-1">
          <div className="text-[10px] font-black uppercase tracking-widest text-purple-300">
            Live Pill Design Preview
          </div>
          <p className="text-xs text-slate-300">
            Compact, silent, pill-shaped badge designed to stay unobtrusive on mobile and desktop.
          </p>
        </div>

        <div className="bg-white/95 backdrop-blur-xl text-slate-900 rounded-full py-1.5 pl-1.5 pr-3 flex items-center gap-2.5 shadow-xl max-w-[330px] border border-purple-200/70">
          <div className="relative w-9 h-9 rounded-full bg-slate-100 overflow-hidden shrink-0 ring-2 ring-purple-100">
            <img
              src={getOptimizedImageUrl(popups?.[0]?.imageUrl || 'https://rohanwakkar.sirv.com/toneed.png', 120, 80)}
              alt="Preview"
              className="w-full h-full object-cover"
            />
            <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-emerald-500 ring-1 ring-white" />
          </div>
          <div className="min-w-0 flex-1 leading-tight">
            <p className="text-[11px] font-bold truncate">
              <span className="text-purple-700 font-extrabold">{popups?.[0]?.buyerName || 'Priya'}</span>{' '}
              <span className="text-slate-400 font-medium">bought</span>{' '}
              <span className="font-black text-slate-900">{popups?.[0]?.productName || 'Your Custom Product'}</span>
            </p>
            <p className="text-[10px] text-slate-500 font-medium truncate flex items-center gap-1 mt-0.5">
              <CheckCircle2 className="w-2.5 h-2.5 text-emerald-500 shrink-0" />
              <span>{popups?.[0]?.timeLabel || '15 mins ago'} • {popups?.[0]?.location || 'Mumbai, India'}</span>
            </p>
          </div>
        </div>
      </div>

      {/* Custom Popups List */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
        </div>
      ) : !popups || popups.length === 0 ? (
        <Card className="rounded-3xl border-dashed border-2 border-slate-200 bg-slate-50/50">
          <CardContent className="p-12 text-center space-y-3">
            <BellRing className="w-10 h-10 text-slate-300 mx-auto" />
            <h3 className="font-extrabold text-base text-slate-800">No Custom Purchase Popups Yet</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              All demo popups have been removed. Add your own real customer purchases here so they appear as sleek pill notifications on your store.
            </p>
            <Button onClick={openCreateDialog} className="bg-purple-600 hover:bg-purple-700 text-white rounded-2xl text-xs font-bold mt-2">
              <Plus className="w-4 h-4 mr-1.5" /> Add First Popup
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {popups.map((item) => (
            <Card key={item.id} className={cn(
              "rounded-3xl border transition-all shadow-sm",
              item.active !== false ? "border-slate-200 bg-white" : "border-slate-200 bg-slate-50 opacity-70"
            )}>
              <CardContent className="p-4 flex items-center gap-4">
                <div className="relative w-14 h-14 rounded-2xl bg-slate-100 overflow-hidden shrink-0 border border-slate-200">
                  <img
                    src={getOptimizedImageUrl(item.imageUrl, 160, 80)}
                    alt={item.productName}
                    className="w-full h-full object-cover"
                  />
                </div>

                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black text-purple-700 truncate">{item.buyerName}</span>
                    <span className={cn(
                      "text-[9px] font-black uppercase px-2 py-0.5 rounded-full",
                      item.active !== false ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-600"
                    )}>
                      {item.active !== false ? 'Active' : 'Paused'}
                    </span>
                  </div>
                  <h4 className="text-sm font-extrabold text-slate-900 truncate">{item.productName}</h4>
                  <p className="text-[11px] text-slate-500 flex items-center gap-2 truncate">
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {item.timeLabel}</span>
                    <span>•</span>
                    <span className="flex items-center gap-1 truncate"><MapPin className="w-3 h-3" /> {item.location}</span>
                  </p>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => handleToggleItemActive(item)}
                    title={item.active !== false ? 'Pause' : 'Activate'}
                    className="h-9 w-9 rounded-xl text-slate-500 hover:text-purple-600"
                  >
                    {item.active !== false ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => openEditDialog(item)}
                    className="h-9 w-9 rounded-xl text-slate-500 hover:text-blue-600"
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => handleDelete(item.id)}
                    className="h-9 w-9 rounded-xl text-slate-500 hover:text-rose-600"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add / Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg rounded-3xl">
          <DialogHeader>
            <DialogTitle className="font-black text-xl">
              {editingItem ? 'Edit Purchase Popup' : 'Add Custom Purchase Popup'}
            </DialogTitle>
            <DialogDescription className="text-xs">
              Enter the buyer and product details you want to display in the pill-shaped storefront notification.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Quick Fill from Catalog */}
            {products && products.length > 0 && (
              <div className="p-3 rounded-2xl bg-purple-50/70 border border-purple-100 space-y-1.5">
                <Label className="text-[11px] font-bold text-purple-800 flex items-center gap-1.5">
                  <Package className="w-3.5 h-3.5" />
                  Quick-Fill from Your Store Products (Optional)
                </Label>
                <select
                  onChange={(e) => e.target.value && handleQuickFillProduct(e.target.value)}
                  defaultValue=""
                  className="w-full bg-white border border-purple-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700"
                >
                  <option value="">-- Select a product to auto-fill name, image &amp; link --</option>
                  {products.map((p: any) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold">Buyer Name</Label>
                <Input
                  value={buyerName}
                  onChange={(e) => setBuyerName(e.target.value)}
                  placeholder="e.g. Sneha / Someone"
                  className="rounded-xl"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-bold">Time Label</Label>
                <Input
                  value={timeLabel}
                  onChange={(e) => setTimeLabel(e.target.value)}
                  placeholder="e.g. 15 mins ago"
                  className="rounded-xl"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold">Product Name *</Label>
              <Input
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                placeholder="e.g. Personalized Insulated Bottle"
                required
                className="rounded-xl"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold">City / Location</Label>
                <Input
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g. Pune, India"
                  className="rounded-xl"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-bold">Product Link (Optional)</Label>
                <Input
                  value={productUrl}
                  onChange={(e) => setProductUrl(e.target.value)}
                  placeholder="e.g. /product/abc123"
                  className="rounded-xl"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold">Product Image URL *</Label>
              <Input
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://..."
                required
                className="rounded-xl"
              />
            </div>

            <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-100">
              <span className="text-xs font-bold text-slate-700">Active on Website</span>
              <Switch checked={active} onCheckedChange={setActive} />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} className="rounded-xl">
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting} className="bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold">
                {isSubmitting && <Loader2 className="w-4 h-4 animate-spin mr-1.5" />}
                {editingItem ? 'Save Changes' : 'Add Popup'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
