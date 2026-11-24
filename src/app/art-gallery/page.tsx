"use client";

import { useMemo, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';
import { 
  Palette, 
  Sparkles, 
  Search, 
  Filter, 
  Eye, 
  ShoppingCart, 
  ShieldCheck, 
  ArrowRight, 
  ExternalLink, 
  Heart, 
  MapPin, 
  Brush, 
  Layers,
  ChevronRight,
  Check
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { useFirestore, useCollection } from '@/firebase';
import { collection, query, where, orderBy } from 'firebase/firestore';
import { useCart } from '@/lib/store/cart-context';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Artwork } from '@/lib/types';

// Curated default artworks if gallery is newly launched
const SEED_CURATED_ARTWORKS: Artwork[] = [
  {
    id: 'seed-art-1',
    artistId: 'artist-1',
    artistName: 'Rohan Wakkar',
    artistEmail: 'curator@giftartstudio.com',
    artistBio: 'Contemporary visual artist blending traditional Indian heritage motifs with vibrant modern pop-art palettes.',
    artistAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
    artistCity: 'Mumbai',
    title: 'Ethereal Lotus Harmony',
    medium: 'Oil on Canvas',
    dimensions: '24 × 36 inches',
    description: 'An original textured oil painting capturing the timeless serenity of blooming lotuses in golden dawn waters.',
    imageUrl: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=900&auto=format&fit=crop&q=80',
    suggestedPrice: 4500,
    price: 4999,
    status: 'published',
    featured: true
  },
  {
    id: 'seed-art-2',
    artistId: 'artist-2',
    artistName: 'Ananya Deshmukh',
    artistEmail: 'ananya.art@gmail.com',
    artistBio: 'Resin and fluid acrylic artisan specializing in coastline aerials and deep ocean luminescence.',
    artistAvatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&auto=format&fit=crop&q=80',
    artistCity: 'Goa',
    title: 'Azure Coastline Tidal Fluid',
    medium: 'Resin Art',
    dimensions: '18 × 24 inches',
    description: 'Multi-layered crystal clear resin with shimmering pigments recreating a mesmerizing sea foam beach shoreline.',
    imageUrl: 'https://images.unsplash.com/photo-1541701494587-cb58502866ab?w=900&auto=format&fit=crop&q=80',
    suggestedPrice: 3200,
    price: 3499,
    status: 'published',
    featured: true
  },
  {
    id: 'seed-art-3',
    artistId: 'artist-3',
    artistName: 'Kabir Verma',
    artistEmail: 'kabir.v@artstudio.in',
    artistBio: 'Fine art illustrator focusing on architectural nostalgia and spiritual ink & acrylic compositions.',
    artistAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80',
    artistCity: 'Jaipur',
    title: 'Gilded Haveli Twilight',
    medium: 'Acrylic & Gold Foil',
    dimensions: '20 × 30 inches',
    description: 'Intricate Rajasthani heritage arches illuminated under moonlit skies with genuine 24K gold foil embellishments.',
    imageUrl: 'https://images.unsplash.com/photo-1582561424760-0321d75e81fa?w=900&auto=format&fit=crop&q=80',
    suggestedPrice: 5800,
    price: 5999,
    status: 'published',
    featured: true
  }
];

const MEDIUM_FILTERS = [
  'All',
  'Oil on Canvas',
  'Acrylic Painting',
  'Resin Art',
  'Watercolors',
  'Charcoal & Sketch',
  'Handmade Decor'
];

export default function ArtGalleryPage() {
  const db = useFirestore();
  const { addToCart } = useCart();
  const { toast } = useToast();

  const [selectedMedium, setSelectedMedium] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'featured' | 'price-asc' | 'price-desc'>('featured');

  // Query published artworks from Firestore
  const artworksQuery = useMemo(() => {
    if (!db) return null;
    return query(
      collection(db, 'artworks'),
      where('status', '==', 'published')
    );
  }, [db]);

  const { data: rawArtworks, loading } = useCollection<any>(artworksQuery);

  const artworks: Artwork[] = useMemo(() => {
    let list: Artwork[] = [];
    if (rawArtworks && rawArtworks.length > 0) {
      list = rawArtworks.map((doc: any) => ({
        id: doc.id,
        artistId: doc.artistId,
        artistName: doc.artistName || 'Studio Artist',
        artistEmail: doc.artistEmail || '',
        artistBio: doc.artistBio || '',
        artistAvatar: doc.artistAvatar || '',
        artistPortfolio: doc.artistPortfolio || '',
        artistCity: doc.artistCity || '',
        title: doc.title || 'Untitled Artwork',
        medium: doc.medium || 'Visual Art',
        dimensions: doc.dimensions || '',
        yearCreated: doc.yearCreated || '',
        description: doc.description || '',
        imageUrl: doc.imageUrl || '',
        additionalImages: doc.additionalImages || [],
        suggestedPrice: Number(doc.suggestedPrice) || 0,
        price: Number(doc.price) || 1999,
        oldPrice: Number(doc.oldPrice) || 0,
        status: 'published',
        featured: Boolean(doc.featured),
        soldOut: Boolean(doc.soldOut),
        createdAt: doc.createdAt
      }));
    } else if (!loading) {
      list = SEED_CURATED_ARTWORKS;
    }

    // Filter by Medium
    if (selectedMedium !== 'All') {
      list = list.filter((aw) => 
        aw.medium.toLowerCase().includes(selectedMedium.toLowerCase())
      );
    }

    // Search Query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter((aw) => 
        aw.title.toLowerCase().includes(q) ||
        aw.artistName.toLowerCase().includes(q) ||
        aw.medium.toLowerCase().includes(q) ||
        (aw.artistCity && aw.artistCity.toLowerCase().includes(q))
      );
    }

    // Sort
    if (sortBy === 'price-asc') {
      list.sort((a, b) => a.price - b.price);
    } else if (sortBy === 'price-desc') {
      list.sort((a, b) => b.price - a.price);
    }

    return list;
  }, [rawArtworks, loading, selectedMedium, searchQuery, sortBy]);

  const handleAddToCart = (artwork: Artwork) => {
    addToCart(
      {
        id: artwork.id,
        name: `${artwork.title} (Original by ${artwork.artistName})`,
        price: artwork.price,
        image: artwork.imageUrl,
        images: [artwork.imageUrl, ...(artwork.additionalImages || [])],
        category: 'Art Gallery',
        subcategory: artwork.medium,
        description: artwork.description,
        rating: 5.0,
        reviews: 18,
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

  return (
    <main className="min-h-screen bg-white">
      <Navbar />

      {/* Hero Exhibition Banner */}
      <section className="relative pt-28 md:pt-36 pb-16 md:pb-24 bg-gradient-to-b from-[#faf5ff] via-white to-white overflow-hidden border-b border-purple-50">
        <div className="container mx-auto px-4 sm:px-6 relative z-10 max-w-6xl text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-purple-100/70 border border-purple-200/80 text-purple-800 text-xs font-black uppercase tracking-widest shadow-2xs">
            <Brush className="w-3.5 h-3.5 text-purple-600" />
            <span>Curated Original Artworks &bull; Independent Verified Artists</span>
          </div>

          <h1 className="text-3xl sm:text-5xl md:text-6xl font-headline font-black text-slate-900 tracking-tight leading-tight max-w-4xl mx-auto">
            Discover Original Art Handcrafted by Exceptional Creators
          </h1>

          <p className="text-sm sm:text-base md:text-lg text-slate-600 max-w-2xl mx-auto font-normal leading-relaxed">
            Every piece in our gallery is an authentic original created by verified artists, strictly curated and priced by the GiftArtStudio team with safe pan-India shipping.
          </p>

          <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
            <Button asChild className="rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-black text-xs uppercase tracking-wider h-12 px-7 shadow-lg shadow-purple-500/25 active:scale-95 transition-all">
              <Link href="/art-gallery/register">
                Sell Your Art Here (Join as Artist) <ArrowRight className="w-4 h-4 ml-1.5" />
              </Link>
            </Button>

            <Button asChild variant="outline" className="rounded-2xl border-purple-200 text-purple-800 hover:bg-purple-50 font-bold text-xs uppercase tracking-wider h-12 px-6">
              <Link href="/art-gallery/artist-portal">
                Artist Login Portal
              </Link>
            </Button>
          </div>
        </div>

        {/* Ambient Glows */}
        <div className="absolute left-1/2 -top-20 -translate-x-1/2 w-[700px] h-[350px] bg-purple-200/30 rounded-full blur-3xl pointer-events-none" />
      </section>

      {/* Main Gallery Section */}
      <section className="container mx-auto px-4 sm:px-6 py-10 md:py-16 max-w-7xl">
        {/* Medium Filter Pills & Search */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 pb-8 border-b border-slate-100">
          {/* Medium Pills */}
          <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto scrollbar-hide py-1">
            {MEDIUM_FILTERS.map((med) => (
              <button
                key={med}
                type="button"
                onClick={() => setSelectedMedium(med)}
                className={cn(
                  "px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all cursor-pointer",
                  selectedMedium === med
                    ? "bg-slate-900 text-white shadow-sm shadow-slate-900/20"
                    : "bg-slate-100 text-slate-600 hover:bg-purple-50 hover:text-purple-700"
                )}
              >
                {med}
              </button>
            ))}
          </div>

          {/* Search & Sort */}
          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:w-64">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                type="text"
                placeholder="Search art or artist..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="rounded-full h-10 pl-9 border-slate-200 text-xs font-medium focus-visible:ring-purple-500 bg-slate-50 focus:bg-white"
              />
            </div>

            <select
              value={sortBy}
              onChange={(e: any) => setSortBy(e.target.value)}
              className="h-10 px-3.5 rounded-full border border-slate-200 bg-slate-50 text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-400 cursor-pointer"
            >
              <option value="featured">Featured Curations</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
            </select>
          </div>
        </div>

        {/* Gallery Artwork Grid */}
        <div className="pt-10">
          {artworks.length === 0 ? (
            <div className="text-center py-20 bg-slate-50 rounded-3xl border border-dashed border-slate-200 max-w-md mx-auto p-8 space-y-4">
              <Palette className="w-12 h-12 text-slate-300 mx-auto" />
              <h3 className="text-lg font-bold text-slate-800">No Artworks Found</h3>
              <p className="text-xs text-slate-500">
                Try selecting a different medium or clearing your search filter.
              </p>
              <Button
                variant="outline"
                onClick={() => { setSelectedMedium('All'); setSearchQuery(''); }}
                className="rounded-xl text-xs font-bold"
              >
                Reset All Filters
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {artworks.map((aw) => (
                <Card 
                  key={aw.id}
                  className="rounded-3xl border border-slate-100 bg-white overflow-hidden shadow-sm hover:shadow-xl transition-all duration-500 group flex flex-col justify-between"
                >
                  <div>
                    {/* Artwork Image Container */}
                    <Link href={`/art-gallery/${aw.id}`} className="block relative aspect-[4/3] w-full bg-slate-100 overflow-hidden cursor-pointer">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img 
                        src={aw.imageUrl} 
                        alt={aw.title} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" 
                      />

                      {/* Medium Tag */}
                      <div className="absolute top-3 left-3 px-3 py-1 rounded-full bg-slate-900/80 backdrop-blur-md text-white text-[11px] font-bold shadow-md">
                        {aw.medium}
                      </div>

                      {aw.soldOut ? (
                        <div className="absolute top-3 right-3 px-3 py-1 rounded-full bg-rose-600 text-white text-[10px] font-black uppercase tracking-wider shadow-md">
                          Sold Out
                        </div>
                      ) : (
                        <div className="absolute bottom-3 right-3 px-3 py-1 rounded-full bg-white/90 backdrop-blur-md text-slate-800 text-[11px] font-black shadow-md flex items-center gap-1">
                          <span>₹{aw.price.toLocaleString()}</span>
                        </div>
                      )}
                    </Link>

                    {/* Card Content */}
                    <CardContent className="p-6 space-y-4">
                      {/* Title & Dimensions */}
                      <div>
                        <Link href={`/art-gallery/${aw.id}`}>
                          <h3 className="text-lg font-headline font-black text-slate-900 hover:text-purple-600 transition-colors line-clamp-1">
                            {aw.title}
                          </h3>
                        </Link>
                        {aw.dimensions && (
                          <p className="text-xs text-slate-400 font-medium mt-0.5">
                            Original Canvas Size: {aw.dimensions}
                          </p>
                        )}
                      </div>

                      {/* Artist Bio Box */}
                      <div className="flex items-center gap-3 p-3 bg-purple-50/60 border border-purple-100 rounded-2xl">
                        <div className="w-10 h-10 rounded-full bg-purple-200 overflow-hidden shrink-0 flex items-center justify-center text-purple-800 font-black text-sm">
                          {aw.artistAvatar ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={aw.artistAvatar} alt={aw.artistName} className="w-full h-full object-cover" />
                          ) : (
                            aw.artistName.charAt(0)
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1">
                            <span className="text-xs font-bold text-slate-900 truncate">{aw.artistName}</span>
                            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" title="Verified Artist" />
                          </div>
                          <p className="text-[11px] text-purple-700 font-medium line-clamp-1">
                            {aw.artistBio || (aw.artistCity ? `Artist based in ${aw.artistCity}` : "Verified Studio Creator")}
                          </p>
                        </div>
                      </div>

                      {/* Description excerpt */}
                      {aw.description && (
                        <p className="text-xs text-slate-500 font-normal line-clamp-2 leading-relaxed">
                          {aw.description}
                        </p>
                      )}
                    </CardContent>
                  </div>

                  {/* Actions Footer */}
                  <div className="p-6 pt-0 border-t border-slate-50 flex items-center justify-between gap-3 mt-1">
                    <Button
                      asChild
                      variant="outline"
                      className="flex-1 rounded-xl border-slate-200 hover:bg-purple-50 text-slate-800 font-bold text-xs h-11"
                    >
                      <Link href={`/art-gallery/${aw.id}`}>
                        <Eye className="w-3.5 h-3.5 mr-1.5 text-purple-600" /> View Story &amp; Details
                      </Link>
                    </Button>

                    <Button
                      type="button"
                      disabled={aw.soldOut}
                      onClick={() => handleAddToCart(aw)}
                      className={cn(
                        "rounded-xl font-bold text-xs h-11 px-4 shadow-sm transition-all",
                        aw.soldOut 
                          ? "bg-slate-200 text-slate-400 cursor-not-allowed" 
                          : "bg-purple-600 hover:bg-purple-700 text-white shadow-purple-600/20 active:scale-95"
                      )}
                    >
                      <ShoppingCart className="w-3.5 h-3.5 mr-1" /> Buy (₹{aw.price.toLocaleString()})
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Artist Invitation Banner */}
        <div className="mt-20 bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 rounded-[2.5rem] p-8 sm:p-14 text-white relative overflow-hidden shadow-2xl">
          <div className="relative z-10 max-w-2xl space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-purple-200 text-xs font-bold">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>For Independent Artists Across India</span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-headline font-black tracking-tight leading-tight">
              Are you an artist? Showcase and sell your original art with us.
            </h2>
            <p className="text-xs sm:text-sm text-purple-200 leading-relaxed font-normal">
              Register as an artist, get verified by our curation team, and receive a dedicated artist studio where you can upload and showcase your original works to our national customer base.
            </p>
            <div className="pt-2 flex flex-wrap items-center gap-3">
              <Button asChild className="rounded-xl bg-white text-purple-950 hover:bg-purple-50 font-black text-xs uppercase tracking-wider h-11 px-6 shadow-md">
                <Link href="/art-gallery/register">
                  Register as Artist <ArrowRight className="w-4 h-4 ml-1.5" />
                </Link>
              </Button>
              <Button asChild variant="outline" className="rounded-xl border-white/30 text-white hover:bg-white/10 font-bold text-xs h-11 px-5">
                <Link href="/art-gallery/artist-portal">
                  Artist Studio Login
                </Link>
              </Button>
            </div>
          </div>
          <div className="absolute right-0 bottom-0 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl pointer-events-none" />
        </div>
      </section>

      <Footer />
    </main>
  );
}
