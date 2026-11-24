"use client";

import { useState, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';
import { 
  Palette, 
  ShieldCheck, 
  ShoppingCart, 
  Share2, 
  ExternalLink, 
  Globe, 
  Instagram, 
  MapPin, 
  CheckCircle2, 
  Truck, 
  Package, 
  Sparkles, 
  ChevronRight, 
  ArrowLeft,
  Heart,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useFirestore, useDoc } from '@/firebase';
import { doc } from 'firebase/firestore';
import { useCart } from '@/lib/store/cart-context';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Artwork } from '@/lib/types';

// Fallback seed data if offline or newly launched
const SEED_MAP: Record<string, Artwork> = {
  'seed-art-1': {
    id: 'seed-art-1',
    artistId: 'artist-1',
    artistName: 'Rohan Wakkar',
    artistEmail: 'curator@giftartstudio.com',
    artistBio: 'Contemporary visual artist blending traditional Indian heritage motifs with vibrant modern pop-art palettes. Rohan works with heavy body oils, palette knife texturing, and gold accents to celebrate Indian folklore in modern urban homes.',
    artistAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
    artistCity: 'Mumbai, Maharashtra',
    artistPortfolio: 'https://giftartstudio.com',
    instagramUrl: 'https://instagram.com',
    title: 'Ethereal Lotus Harmony',
    medium: 'Oil on Canvas',
    dimensions: '24 × 36 inches',
    yearCreated: '2024',
    description: 'An original textured oil painting capturing the timeless serenity of blooming lotuses in golden dawn waters. Heavy impasto textures bring the petals alive with depth and physical dimension. Coated with UV varnish to preserve the brilliance of the pigments for generations.',
    imageUrl: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=900&auto=format&fit=crop&q=80',
    additionalImages: [
      'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?w=900&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1579783901586-d88db74b4fe4?w=900&auto=format&fit=crop&q=80'
    ],
    suggestedPrice: 4500,
    price: 4999,
    status: 'published',
    featured: true
  },
  'seed-art-2': {
    id: 'seed-art-2',
    artistId: 'artist-2',
    artistName: 'Ananya Deshmukh',
    artistEmail: 'ananya.art@gmail.com',
    artistBio: 'Resin and fluid acrylic artisan specializing in coastline aerials and deep ocean luminescence. Her pieces evoke the therapeutic calm of turquoise sea waves crashing against golden shoreline sands.',
    artistAvatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&auto=format&fit=crop&q=80',
    artistCity: 'Goa',
    artistPortfolio: 'https://instagram.com',
    title: 'Azure Coastline Tidal Fluid',
    medium: 'Resin Art',
    dimensions: '18 × 24 inches',
    yearCreated: '2024',
    description: 'Multi-layered crystal clear resin with shimmering pigments recreating a mesmerizing sea foam beach shoreline. Mounted on reinforced MDF board, ready to hang with invisible cleat mounts.',
    imageUrl: 'https://images.unsplash.com/photo-1541701494587-cb58502866ab?w=900&auto=format&fit=crop&q=80',
    suggestedPrice: 3200,
    price: 3499,
    status: 'published',
    featured: true
  },
  'seed-art-3': {
    id: 'seed-art-3',
    artistId: 'artist-3',
    artistName: 'Kabir Verma',
    artistEmail: 'kabir.v@artstudio.in',
    artistBio: 'Fine art illustrator focusing on architectural nostalgia and spiritual ink & acrylic compositions with genuine 24K gold leafing. His works are collected across India and Dubai.',
    artistAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80',
    artistCity: 'Jaipur, Rajasthan',
    title: 'Gilded Haveli Twilight',
    medium: 'Acrylic & Gold Foil',
    dimensions: '20 × 30 inches',
    yearCreated: '2024',
    description: 'Intricate Rajasthani heritage arches illuminated under moonlit skies with genuine 24K gold foil embellishments. Each jharokha window is rendered with fine single-hair brush precision.',
    imageUrl: 'https://images.unsplash.com/photo-1582561424760-0321d75e81fa?w=900&auto=format&fit=crop&q=80',
    suggestedPrice: 5800,
    price: 5999,
    status: 'published',
    featured: true
  }
};

export default function ArtworkClient({ id }: { id: string }) {
  const db = useFirestore();
  const router = useRouter();
  const { addToCart } = useCart();
  const { toast } = useToast();

  const [activeImageIndex, setActiveImageIndex] = useState(0);

  const artworkRef = useMemo(() => {
    if (!db || !id) return null;
    return doc(db, 'artworks', id);
  }, [db, id]);

  const { data: rawArtwork, loading } = useDoc<any>(artworkRef, SEED_MAP[id] || null);

  const artwork: Artwork | null = useMemo(() => {
    if (rawArtwork) {
      return {
        id: rawArtwork.id || id,
        artistId: rawArtwork.artistId || '',
        artistName: rawArtwork.artistName || 'Studio Artist',
        artistEmail: rawArtwork.artistEmail || '',
        artistBio: rawArtwork.artistBio || '',
        artistAvatar: rawArtwork.artistAvatar || '',
        artistPortfolio: rawArtwork.artistPortfolio || '',
        artistCity: rawArtwork.artistCity || '',
        title: rawArtwork.title || 'Original Artwork',
        medium: rawArtwork.medium || 'Visual Art',
        dimensions: rawArtwork.dimensions || '',
        yearCreated: rawArtwork.yearCreated || '',
        description: rawArtwork.description || '',
        imageUrl: rawArtwork.imageUrl || '',
        additionalImages: rawArtwork.additionalImages || [],
        suggestedPrice: Number(rawArtwork.suggestedPrice) || 0,
        price: Number(rawArtwork.price) || Number(rawArtwork.suggestedPrice) || 1999,
        status: rawArtwork.status || 'published',
        soldOut: Boolean(rawArtwork.soldOut),
        featured: Boolean(rawArtwork.featured)
      };
    }
    return SEED_MAP[id] || null;
  }, [rawArtwork, id]);

  const allImages = useMemo(() => {
    if (!artwork) return [];
    return [artwork.imageUrl, ...(artwork.additionalImages || [])].filter(Boolean);
  }, [artwork]);

  const handleAddToCart = () => {
    if (!artwork) return;
    addToCart(
      {
        id: artwork.id,
        name: `${artwork.title} (Original by ${artwork.artistName})`,
        price: artwork.price,
        image: artwork.imageUrl,
        images: allImages,
        category: 'Art Gallery',
        subcategory: artwork.medium,
        description: artwork.description,
        rating: 5.0,
        reviews: 24,
        inventoryStatus: artwork.soldOut ? 'Out of Stock' : 'In Stock',
        imageHint: artwork.medium
      },
      1,
      {
        variantPrice: artwork.price,
        variantImage: artwork.imageUrl,
        personalizationName: `Original Art by ${artwork.artistName}`
      }
    );

    toast({
      title: "Artwork Added to Bag!",
      description: `"${artwork.title}" by ${artwork.artistName} added to your cart.`
    });
  };

  const handleBuyNow = () => {
    handleAddToCart();
    setTimeout(() => {
      router.push('/checkout');
    }, 300);
  };

  if (loading && !artwork) {
    return (
      <main className="min-h-screen bg-white">
        <Navbar />
        <div className="pt-36 pb-20 text-center flex items-center justify-center gap-2 text-slate-400">
          <Loader2 className="w-5 h-5 animate-spin text-purple-600" /> Loading artwork...
        </div>
        <Footer />
      </main>
    );
  }

  if (!artwork) {
    return (
      <main className="min-h-screen bg-white">
        <Navbar />
        <div className="pt-36 pb-20 max-w-md mx-auto text-center space-y-4 p-6">
          <AlertCircle className="w-12 h-12 text-slate-300 mx-auto" />
          <h2 className="text-xl font-bold text-slate-800">Artwork Not Found</h2>
          <p className="text-xs text-slate-500">This artwork may have been moved or removed from the gallery.</p>
          <Button asChild className="rounded-xl bg-purple-600 text-white font-bold text-xs">
            <Link href="/art-gallery">Back to Art Gallery</Link>
          </Button>
        </div>
        <Footer />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-white">
      <Navbar />

      <div className="pt-24 md:pt-32 pb-20 container mx-auto px-4 sm:px-6 max-w-7xl">
        {/* Breadcrumb Back Link */}
        <div className="pb-6">
          <Link href="/art-gallery" className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-purple-600 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back to Curated Art Gallery
          </Link>
        </div>

        {/* Main 2-Column Product Layout */}
        <div className="grid lg:grid-cols-12 gap-10 lg:gap-14 items-start">
          {/* Left Column: Artwork Imagery */}
          <div className="lg:col-span-7 space-y-4">
            {/* Primary Main Artwork Canvas Display */}
            <div className="relative aspect-[4/3] w-full rounded-3xl bg-slate-100 overflow-hidden border border-slate-200/80 shadow-md">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={allImages[activeImageIndex] || artwork.imageUrl}
                alt={artwork.title}
                className="w-full h-full object-cover"
              />

              {/* Medium Badge */}
              <div className="absolute top-4 left-4 px-3.5 py-1 rounded-full bg-slate-900/85 backdrop-blur-md text-white text-xs font-bold shadow-md">
                {artwork.medium}
              </div>

              {artwork.soldOut && (
                <div className="absolute top-4 right-4 px-3.5 py-1 rounded-full bg-rose-600 text-white text-xs font-black uppercase tracking-wider shadow-md">
                  Original Sold
                </div>
              )}
            </div>

            {/* Thumbnail Carousel (if multiple images) */}
            {allImages.length > 1 && (
              <div className="flex items-center gap-3 overflow-x-auto pb-2">
                {allImages.map((img, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setActiveImageIndex(idx)}
                    className={cn(
                      "w-20 h-20 rounded-2xl bg-slate-100 overflow-hidden border-2 transition-all shrink-0 cursor-pointer",
                      activeImageIndex === idx ? "border-purple-600 ring-2 ring-purple-600/30 scale-105" : "border-slate-200 opacity-70 hover:opacity-100"
                    )}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={img} alt={`View ${idx + 1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}

            {/* Authenticity Guarantee Card */}
            <div className="bg-[#faf5ff] border border-purple-100 rounded-3xl p-5 flex items-start gap-3.5">
              <ShieldCheck className="w-6 h-6 text-purple-600 shrink-0 mt-0.5" />
              <div className="space-y-1 text-xs">
                <h4 className="font-bold text-slate-900">Certificate of Authenticity Included</h4>
                <p className="text-slate-600 leading-relaxed font-normal">
                  Every original artwork shipped from GiftArtStudio comes with a signed Certificate of Authenticity by artist <strong>{artwork.artistName}</strong>, detailing the creation year, mediums, and registration number.
                </p>
              </div>
            </div>
          </div>

          {/* Right Column: Title, Artist Profile & Purchase CTA */}
          <div className="lg:col-span-5 space-y-6">
            {/* Title & Medium */}
            <div className="space-y-2">
              <span className="text-[11px] font-black uppercase tracking-widest text-purple-600 bg-purple-50 px-3 py-1 rounded-full border border-purple-200">
                Original Handcrafted Work
              </span>
              <h1 className="text-2xl sm:text-3xl font-headline font-black text-slate-900 tracking-tight leading-snug">
                {artwork.title}
              </h1>
              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 font-medium">
                <span>Medium: <strong>{artwork.medium}</strong></span>
                {artwork.dimensions && <span>&bull; Size: <strong>{artwork.dimensions}</strong></span>}
                {artwork.yearCreated && <span>&bull; Year: <strong>{artwork.yearCreated}</strong></span>}
              </div>
            </div>

            {/* Price Row */}
            <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Original Artwork Price (All Inclusive)
                </span>
                <span className="text-3xl font-black text-slate-900">
                  ₹{artwork.price.toLocaleString()}
                </span>
              </div>

              <div className="text-right">
                <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full">
                  Free Insured Shipping
                </span>
              </div>
            </div>

            {/* Buy Now & Add to Cart Action Buttons */}
            <div className="flex items-center gap-3">
              <Button
                type="button"
                disabled={artwork.soldOut}
                onClick={handleBuyNow}
                className={cn(
                  "flex-1 h-13 rounded-2xl text-white font-black text-xs uppercase tracking-wider shadow-lg transition-all",
                  artwork.soldOut 
                    ? "bg-slate-300 cursor-not-allowed" 
                    : "bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 shadow-purple-500/25 active:scale-95"
                )}
              >
                <Sparkles className="w-4 h-4 mr-2" />
                {artwork.soldOut ? "Original Already Sold" : "Buy Original Artwork"}
              </Button>

              <Button
                type="button"
                variant="outline"
                disabled={artwork.soldOut}
                onClick={handleAddToCart}
                className="h-13 px-4 rounded-2xl border-2 border-purple-200 hover:bg-purple-50 text-purple-700 font-bold text-xs"
              >
                <ShoppingCart className="w-4 h-4" />
              </Button>
            </div>

            {/* ARTIST BIO & FULL DETAILS BOX */}
            <div className="bg-white border-2 border-purple-100 rounded-3xl p-6 space-y-4 shadow-sm">
              <div className="flex items-center justify-between border-b border-purple-50 pb-3">
                <span className="text-[11px] font-black uppercase tracking-widest text-slate-500">
                  About the Artist
                </span>
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  <ShieldCheck className="w-3 h-3 text-emerald-600" /> Verified Studio Artist
                </span>
              </div>

              {/* Artist Header */}
              <div className="flex items-center gap-3.5">
                <div className="w-14 h-14 rounded-2xl bg-purple-100 overflow-hidden shrink-0 border border-purple-200 flex items-center justify-center text-purple-700 font-black text-lg">
                  {artwork.artistAvatar ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={artwork.artistAvatar} alt={artwork.artistName} className="w-full h-full object-cover" />
                  ) : (
                    artwork.artistName.charAt(0)
                  )}
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">{artwork.artistName}</h3>
                  {artwork.artistCity && (
                    <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                      <MapPin className="w-3 h-3" /> {artwork.artistCity}
                    </p>
                  )}
                </div>
              </div>

              {/* Artist Bio Paragraph */}
              <p className="text-xs text-slate-600 leading-relaxed font-normal">
                {artwork.artistBio || "A passionate contemporary artist showcasing original works through the GiftArtStudio curation collective."}
              </p>

              {/* Artist External Links */}
              {artwork.artistPortfolio && (
                <div className="pt-1">
                  <a
                    href={artwork.artistPortfolio}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-purple-600 hover:underline"
                  >
                    <Globe className="w-3.5 h-3.5" /> View Artist Portfolio / Website <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}
            </div>

            {/* Artwork Story / Description */}
            <div className="space-y-2">
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                Artwork Story &amp; Inspiration
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-normal whitespace-pre-line">
                {artwork.description || "An authentic handcrafted composition celebrating the beauty of texture, light, and colour harmony."}
              </p>
            </div>

            {/* Safe Art Shipping Highlights */}
            <div className="grid grid-cols-2 gap-3 pt-2 text-xs">
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-slate-800">
                  <Truck className="w-4 h-4 text-purple-600" />
                  <span>Pan-India Delivery</span>
                </div>
                <p className="text-[11px] text-slate-500 font-normal">
                  Delivered in 4 - 7 business days with fragile handling.
                </p>
              </div>

              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-slate-800">
                  <Package className="w-4 h-4 text-purple-600" />
                  <span>Crate Packaging</span>
                </div>
                <p className="text-[11px] text-slate-500 font-normal">
                  Multi-layer bubble wrap &amp; rigid wooden outer framing.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </main>
  );
}
