"use client";

import { useMemo, useState } from 'react';
import Image from 'next/image';
import { 
  Palette, 
  Users, 
  Image as ImageIcon, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Search, 
  ExternalLink, 
  KeyRound, 
  Edit, 
  Trash2, 
  AlertCircle, 
  Eye, 
  Sparkles, 
  Tag, 
  Mail, 
  Phone, 
  MapPin, 
  Globe, 
  Instagram, 
  ShieldCheck, 
  Loader2,
  DollarSign
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
  updateDoc, 
  deleteDoc, 
  doc, 
  serverTimestamp, 
  query, 
  orderBy 
} from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Artist, Artwork } from '@/lib/types';

export default function AdminArtGalleryPage() {
  const db = useFirestore();
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState<'artists' | 'artworks'>('artists');
  const [artistFilter, setArtistFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [artworkFilter, setArtworkFilter] = useState<'all' | 'pending' | 'published' | 'rejected'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [selectedArtist, setSelectedArtist] = useState<Artist | null>(null);
  const [artistPasswordModal, setArtistPasswordModal] = useState(false);
  const [customPassword, setCustomPassword] = useState('');
  const [isProcessingArtist, setIsProcessingArtist] = useState(false);

  const [selectedArtwork, setSelectedArtwork] = useState<Artwork | null>(null);
  const [artworkApproveModal, setArtworkApproveModal] = useState(false);
  const [finalSellingPrice, setFinalSellingPrice] = useState('');
  const [isProcessingArtwork, setIsProcessingArtwork] = useState(false);

  // Firestore Queries
  const artistsQuery = useMemo(() => {
    if (!db) return null;
    return query(collection(db, 'artists'), orderBy('createdAt', 'desc'));
  }, [db]);

  const artworksQuery = useMemo(() => {
    if (!db) return null;
    return query(collection(db, 'artworks'), orderBy('createdAt', 'desc'));
  }, [db]);

  const { data: rawArtists, loading: loadingArtists } = useCollection<any>(artistsQuery);
  const { data: rawArtworks, loading: loadingArtworks } = useCollection<any>(artworksQuery);

  const artists: Artist[] = useMemo(() => {
    if (!rawArtists) return [];
    return rawArtists.map((doc: any) => ({
      id: doc.id,
      name: doc.name || 'Anonymous Artist',
      email: doc.email || '',
      phone: doc.phone || '',
      city: doc.city || '',
      specialty: doc.specialty || '',
      bio: doc.bio || '',
      avatarUrl: doc.avatarUrl || '',
      portfolioUrl: doc.portfolioUrl || '',
      instagramUrl: doc.instagramUrl || '',
      sampleImages: doc.sampleImages || [],
      password: doc.password || '',
      status: doc.status || 'pending_approval',
      rejectionReason: doc.rejectionReason || '',
      totalArtworks: doc.totalArtworks || 0,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt
    }));
  }, [rawArtists]);

  const artworks: Artwork[] = useMemo(() => {
    if (!rawArtworks) return [];
    return rawArtworks.map((doc: any) => ({
      id: doc.id,
      artistId: doc.artistId || '',
      artistName: doc.artistName || 'Studio Artist',
      artistEmail: doc.artistEmail || '',
      artistBio: doc.artistBio || '',
      artistAvatar: doc.artistAvatar || '',
      artistPortfolio: doc.artistPortfolio || '',
      artistCity: doc.artistCity || '',
      title: doc.title || 'Untitled Artwork',
      medium: doc.medium || 'Canvas Art',
      dimensions: doc.dimensions || '',
      yearCreated: doc.yearCreated || '',
      description: doc.description || '',
      imageUrl: doc.imageUrl || '',
      additionalImages: doc.additionalImages || [],
      suggestedPrice: Number(doc.suggestedPrice) || 0,
      price: Number(doc.price) || Number(doc.suggestedPrice) || 0,
      oldPrice: Number(doc.oldPrice) || 0,
      status: doc.status || 'pending_review',
      rejectionReason: doc.rejectionReason || '',
      featured: Boolean(doc.featured),
      soldOut: Boolean(doc.soldOut),
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt
    }));
  }, [rawArtworks]);

  // Filtered lists
  const filteredArtists = useMemo(() => {
    return artists.filter((a) => {
      const matchesFilter = 
        artistFilter === 'all' ||
        (artistFilter === 'pending' && a.status === 'pending_approval') ||
        (artistFilter === 'approved' && a.status === 'approved') ||
        (artistFilter === 'rejected' && a.status === 'rejected');

      const matchesSearch = 
        !searchQuery.trim() ||
        a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (a.city && a.city.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (a.specialty && a.specialty.toLowerCase().includes(searchQuery.toLowerCase()));

      return matchesFilter && matchesSearch;
    });
  }, [artists, artistFilter, searchQuery]);

  const filteredArtworks = useMemo(() => {
    return artworks.filter((aw) => {
      const matchesFilter =
        artworkFilter === 'all' ||
        (artworkFilter === 'pending' && aw.status === 'pending_review') ||
        (artworkFilter === 'published' && aw.status === 'published') ||
        (artworkFilter === 'rejected' && aw.status === 'rejected');

      const matchesSearch =
        !searchQuery.trim() ||
        aw.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        aw.artistName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        aw.medium.toLowerCase().includes(searchQuery.toLowerCase());

      return matchesFilter && matchesSearch;
    });
  }, [artworks, artworkFilter, searchQuery]);

  // Metrics
  const metrics = useMemo(() => {
    return {
      totalArtists: artists.length,
      pendingArtists: artists.filter((a) => a.status === 'pending_approval').length,
      approvedArtists: artists.filter((a) => a.status === 'approved').length,
      totalArtworks: artworks.length,
      pendingArtworks: artworks.filter((aw) => aw.status === 'pending_review').length,
      publishedArtworks: artworks.filter((aw) => aw.status === 'published').length
    };
  }, [artists, artworks]);

  // Artist Actions
  const handleOpenApproveArtist = (artist: Artist) => {
    setSelectedArtist(artist);
    setCustomPassword(artist.password || `Art@${Math.floor(1000 + Math.random() * 9000)}`);
    setArtistPasswordModal(true);
  };

  const handleConfirmApproveArtist = async () => {
    if (!db || !selectedArtist) return;
    setIsProcessingArtist(true);
    try {
      await updateDoc(doc(db, 'artists', selectedArtist.id), {
        status: 'approved',
        password: customPassword.trim(),
        updatedAt: serverTimestamp()
      });
      toast({
        title: "Artist Approved & Access Granted!",
        description: `${selectedArtist.name} can now log into the Artist Studio with their email and password.`
      });
      setArtistPasswordModal(false);
      setSelectedArtist(null);
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Failed to approve artist",
        description: err.message
      });
    } finally {
      setIsProcessingArtist(false);
    }
  };

  const handleRejectArtist = async (artist: Artist) => {
    if (!db) return;
    const reason = window.prompt("Enter rejection reason (optional):", "Portfolio does not match current studio curation criteria.");
    if (reason === null) return;

    try {
      await updateDoc(doc(db, 'artists', artist.id), {
        status: 'rejected',
        rejectionReason: reason || 'Application declined by admin.',
        updatedAt: serverTimestamp()
      });
      toast({
        title: "Artist Application Rejected",
        description: `${artist.name}'s status updated.`
      });
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: err.message
      });
    }
  };

  const handleDeleteArtist = async (artistId: string) => {
    if (!db) return;
    if (!window.confirm("Permanently delete this artist record?")) return;
    try {
      await deleteDoc(doc(db, 'artists', artistId));
      toast({ title: "Artist Deleted" });
    } catch (err: any) {
      toast({ variant: "destructive", title: "Error", description: err.message });
    }
  };

  // Artwork Actions
  const handleOpenApproveArtwork = (artwork: Artwork) => {
    setSelectedArtwork(artwork);
    setFinalSellingPrice(String(artwork.price || artwork.suggestedPrice || 1999));
    setArtworkApproveModal(true);
  };

  const handleConfirmPublishArtwork = async () => {
    if (!db || !selectedArtwork) return;
    const priceNum = Number(finalSellingPrice);
    if (!priceNum || priceNum <= 0) {
      toast({
        variant: "destructive",
        title: "Invalid Price",
        description: "Please enter a valid final selling price."
      });
      return;
    }

    setIsProcessingArtwork(true);
    try {
      await updateDoc(doc(db, 'artworks', selectedArtwork.id), {
        status: 'published',
        price: priceNum,
        updatedAt: serverTimestamp()
      });
      toast({
        title: "Artwork Published Live!",
        description: `"${selectedArtwork.title}" is now visible in the public Art Gallery at ₹${priceNum.toLocaleString()}.`
      });
      setArtworkApproveModal(false);
      setSelectedArtwork(null);
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Failed to publish artwork",
        description: err.message
      });
    } finally {
      setIsProcessingArtwork(false);
    }
  };

  const handleRejectArtwork = async (artwork: Artwork) => {
    if (!db) return;
    const reason = window.prompt("Reason for artwork revision / rejection:", "Higher resolution image needed or details incomplete.");
    if (reason === null) return;

    try {
      await updateDoc(doc(db, 'artworks', artwork.id), {
        status: 'rejected',
        rejectionReason: reason,
        updatedAt: serverTimestamp()
      });
      toast({ title: "Artwork Rejected / Sent for Revision" });
    } catch (err: any) {
      toast({ variant: "destructive", title: "Error", description: err.message });
    }
  };

  const handleToggleArtworkSoldOut = async (artwork: Artwork) => {
    if (!db) return;
    try {
      await updateDoc(doc(db, 'artworks', artwork.id), {
        soldOut: !artwork.soldOut,
        updatedAt: serverTimestamp()
      });
      toast({
        title: artwork.soldOut ? "Marked as Available" : "Marked as Sold Out"
      });
    } catch (err: any) {
      toast({ variant: "destructive", title: "Error", description: err.message });
    }
  };

  const handleDeleteArtwork = async (artworkId: string) => {
    if (!db) return;
    if (!window.confirm("Delete this artwork from the gallery?")) return;
    try {
      await deleteDoc(doc(db, 'artworks', artworkId));
      toast({ title: "Artwork Deleted" });
    } catch (err: any) {
      toast({ variant: "destructive", title: "Error", description: err.message });
    }
  };

  return (
    <div className="space-y-8 p-4 md:p-8 max-w-7xl mx-auto">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-50 text-purple-700 text-xs font-bold">
            <Palette className="w-3.5 h-3.5" />
            <span>Curated Art Marketplace &amp; Gallery</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-headline font-black text-slate-800 tracking-tight">
            Art Gallery &amp; Artist Management
          </h1>
          <p className="text-xs md:text-sm text-slate-500 font-medium">
            Review registered artists, assign login access, and strictly review/price artworks before publishing them live.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            asChild
            variant="outline"
            className="rounded-2xl border-purple-200 text-purple-700 hover:bg-purple-50 text-xs font-bold h-11"
          >
            <a href="/art-gallery" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5">
              <Eye className="w-4 h-4" /> View Live Art Gallery <ExternalLink className="w-3 h-3" />
            </a>
          </Button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="rounded-2xl border-slate-100 shadow-sm bg-white p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase">Total Artists</span>
            <Users className="w-4 h-4 text-purple-600" />
          </div>
          <p className="text-2xl font-black text-slate-900 mt-2">{metrics.totalArtists}</p>
          <span className="text-[10px] text-emerald-600 font-bold">{metrics.approvedArtists} Verified</span>
        </Card>

        <Card className="rounded-2xl border-slate-100 shadow-sm bg-white p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-600 uppercase">Pending Artists</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-2xl font-black text-amber-600 mt-2">{metrics.pendingArtists}</p>
          <span className="text-[10px] text-slate-400 font-medium">Need Admin Approval</span>
        </Card>

        <Card className="rounded-2xl border-slate-100 shadow-sm bg-white p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase">Live Artworks</span>
            <ImageIcon className="w-4 h-4 text-indigo-600" />
          </div>
          <p className="text-2xl font-black text-slate-900 mt-2">{metrics.publishedArtworks}</p>
          <span className="text-[10px] text-slate-400 font-medium">Published on Gallery</span>
        </Card>

        <Card className="rounded-2xl border-slate-100 shadow-sm bg-white p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-rose-600 uppercase">Pending Artworks</span>
            <Sparkles className="w-4 h-4 text-rose-500" />
          </div>
          <p className="text-2xl font-black text-rose-600 mt-2">{metrics.pendingArtworks}</p>
          <span className="text-[10px] text-slate-400 font-medium">Awaiting Price &amp; Approval</span>
        </Card>
      </div>

      {/* Main Tabs Header */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-slate-200 pb-3">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setActiveTab('artists')}
            className={cn(
              "px-5 py-2.5 rounded-2xl text-xs md:text-sm font-bold transition-all flex items-center gap-2",
              activeTab === 'artists'
                ? "bg-purple-600 text-white shadow-md shadow-purple-600/20"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            )}
          >
            <Users className="w-4 h-4" />
            <span>Artist Applications ({metrics.totalArtists})</span>
            {metrics.pendingArtists > 0 && (
              <span className="px-1.5 py-0.5 rounded-full bg-amber-400 text-slate-900 text-[10px] font-black">
                {metrics.pendingArtists}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('artworks')}
            className={cn(
              "px-5 py-2.5 rounded-2xl text-xs md:text-sm font-bold transition-all flex items-center gap-2",
              activeTab === 'artworks'
                ? "bg-purple-600 text-white shadow-md shadow-purple-600/20"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            )}
          >
            <Palette className="w-4 h-4" />
            <span>Artwork Submissions ({metrics.totalArtworks})</span>
            {metrics.pendingArtworks > 0 && (
              <span className="px-1.5 py-0.5 rounded-full bg-rose-500 text-white text-[10px] font-black">
                {metrics.pendingArtworks}
              </span>
            )}
          </button>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            type="text"
            placeholder={activeTab === 'artists' ? "Search artists, email, city..." : "Search artworks, medium, artist..."}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="rounded-xl h-10 pl-10 border-slate-200 text-xs font-medium focus-visible:ring-purple-500 bg-white"
          />
        </div>
      </div>

      {/* TAB 1: ARTISTS */}
      {activeTab === 'artists' && (
        <div className="space-y-6">
          {/* Sub Filters */}
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide text-xs font-bold">
            <button
              onClick={() => setArtistFilter('all')}
              className={cn("px-4 py-1.5 rounded-xl border transition-colors", artistFilter === 'all' ? "bg-slate-900 text-white border-slate-900" : "bg-white text-slate-600 border-slate-200")}
            >
              All ({artists.length})
            </button>
            <button
              onClick={() => setArtistFilter('pending')}
              className={cn("px-4 py-1.5 rounded-xl border transition-colors", artistFilter === 'pending' ? "bg-amber-500 text-white border-amber-500" : "bg-white text-amber-700 border-amber-200")}
            >
              Pending Approval ({metrics.pendingArtists})
            </button>
            <button
              onClick={() => setArtistFilter('approved')}
              className={cn("px-4 py-1.5 rounded-xl border transition-colors", artistFilter === 'approved' ? "bg-emerald-600 text-white border-emerald-600" : "bg-white text-emerald-700 border-emerald-200")}
            >
              Approved &amp; Active ({metrics.approvedArtists})
            </button>
            <button
              onClick={() => setArtistFilter('rejected')}
              className={cn("px-4 py-1.5 rounded-xl border transition-colors", artistFilter === 'rejected' ? "bg-rose-600 text-white border-rose-600" : "bg-white text-rose-700 border-rose-200")}
            >
              Rejected ({artists.filter(a => a.status === 'rejected').length})
            </button>
          </div>

          {loadingArtists ? (
            <div className="p-12 text-center text-slate-400 font-bold text-xs flex items-center justify-center gap-2">
              <Loader2 className="w-5 h-5 animate-spin text-purple-600" /> Loading artist applications...
            </div>
          ) : filteredArtists.length === 0 ? (
            <Card className="rounded-3xl border-dashed border-2 border-slate-200 bg-white/70 p-12 text-center">
              <p className="text-slate-500 font-bold text-sm">No artists match the current filter.</p>
              <p className="text-xs text-slate-400 mt-1">Artists can register at /art-gallery/register.</p>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 gap-6">
              {filteredArtists.map((artist) => (
                <Card 
                  key={artist.id} 
                  className={cn(
                    "rounded-3xl border transition-all duration-300 bg-white overflow-hidden shadow-sm hover:shadow-md",
                    artist.status === 'approved' ? "border-emerald-200" : artist.status === 'rejected' ? "border-rose-200 opacity-70" : "border-amber-200"
                  )}
                >
                  <CardContent className="p-6 space-y-5">
                    {/* Top Info */}
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="w-13 h-13 rounded-2xl bg-purple-100 text-purple-700 font-black text-lg flex items-center justify-center overflow-hidden border border-purple-200">
                          {artist.avatarUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={artist.avatarUrl} alt={artist.name} className="w-full h-full object-cover" />
                          ) : (
                            artist.name.charAt(0).toUpperCase()
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-base font-black text-slate-900">{artist.name}</h3>
                            {artist.status === 'approved' && (
                              <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" title="Verified Artist" />
                            )}
                          </div>
                          <p className="text-xs text-purple-600 font-semibold">{artist.specialty || "Visual Artist"}</p>
                          {artist.city && (
                            <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                              <MapPin className="w-3 h-3 text-slate-400" /> {artist.city}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Status Badge */}
                      <span className={cn(
                        "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider",
                        artist.status === 'approved' ? "bg-emerald-100 text-emerald-700 border border-emerald-200" :
                        artist.status === 'rejected' ? "bg-rose-100 text-rose-700 border border-rose-200" :
                        "bg-amber-100 text-amber-800 border border-amber-200 animate-pulse"
                      )}>
                        {artist.status === 'approved' ? "Approved" : artist.status === 'rejected' ? "Rejected" : "Pending Review"}
                      </span>
                    </div>

                    {/* Bio */}
                    {artist.bio && (
                      <p className="text-xs text-slate-600 leading-relaxed font-normal bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
                        &quot;{artist.bio}&quot;
                      </p>
                    )}

                    {/* Contact & Portfolio Links */}
                    <div className="grid grid-cols-2 gap-2 text-[11px] font-semibold text-slate-600 pt-1">
                      <div className="flex items-center gap-1.5 truncate">
                        <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">{artist.email}</span>
                      </div>
                      <div className="flex items-center gap-1.5 truncate">
                        <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{artist.phone || "No phone"}</span>
                      </div>
                      {artist.portfolioUrl && (
                        <a 
                          href={artist.portfolioUrl} 
                          target="_blank" 
                          rel="noreferrer" 
                          className="flex items-center gap-1.5 text-purple-600 hover:underline truncate"
                        >
                          <Globe className="w-3.5 h-3.5 shrink-0" />
                          <span className="truncate">Portfolio Link</span>
                          <ExternalLink className="w-2.5 h-2.5 shrink-0" />
                        </a>
                      )}
                      {artist.instagramUrl && (
                        <a 
                          href={artist.instagramUrl} 
                          target="_blank" 
                          rel="noreferrer" 
                          className="flex items-center gap-1.5 text-pink-600 hover:underline truncate"
                        >
                          <Instagram className="w-3.5 h-3.5 shrink-0" />
                          <span className="truncate">Instagram Profile</span>
                        </a>
                      )}
                    </div>

                    {/* Credentials Preview */}
                    <div className="bg-purple-50/70 border border-purple-100 rounded-xl p-3 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <KeyRound className="w-4 h-4 text-purple-600" />
                        <span className="text-purple-900 font-bold">Portal Password:</span>
                        <code className="bg-white px-2 py-0.5 rounded text-purple-700 font-mono text-xs font-bold border border-purple-200">
                          {artist.password || "Not set yet"}
                        </code>
                      </div>
                      <span className="text-[10px] text-purple-600 font-semibold">Artist Studio Login</span>
                    </div>

                    {/* Sample Artwork Photos */}
                    {artist.sampleImages && artist.sampleImages.length > 0 && (
                      <div className="space-y-1.5">
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Portfolio Samples:</span>
                        <div className="flex items-center gap-2 overflow-x-auto pb-1">
                          {artist.sampleImages.map((img, i) => (
                            <a key={i} href={img} target="_blank" rel="noreferrer" className="w-16 h-16 rounded-xl bg-slate-100 border overflow-hidden shrink-0 block hover:opacity-80">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img src={img} alt="Sample" className="w-full h-full object-cover" />
                            </a>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        {artist.status !== 'approved' ? (
                          <Button
                            type="button"
                            size="sm"
                            onClick={() => handleOpenApproveArtist(artist)}
                            className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs h-9 px-4 shadow-sm"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" /> Approve &amp; Give Access
                          </Button>
                        ) : (
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => handleOpenApproveArtist(artist)}
                            className="rounded-xl border-purple-200 text-purple-700 hover:bg-purple-50 font-bold text-xs h-9 px-3"
                          >
                            <KeyRound className="w-3.5 h-3.5 mr-1.5" /> Reset Credentials
                          </Button>
                        )}

                        {artist.status !== 'rejected' && (
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => handleRejectArtist(artist)}
                            className="rounded-xl border-slate-200 text-rose-600 hover:bg-rose-50 font-bold text-xs h-9 px-3"
                          >
                            <XCircle className="w-3.5 h-3.5 mr-1.5" /> Reject
                          </Button>
                        )}
                      </div>

                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteArtist(artist.id)}
                        className="rounded-xl h-9 w-9 p-0 text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: ARTWORKS */}
      {activeTab === 'artworks' && (
        <div className="space-y-6">
          {/* Sub Filters */}
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide text-xs font-bold">
            <button
              onClick={() => setArtworkFilter('all')}
              className={cn("px-4 py-1.5 rounded-xl border transition-colors", artworkFilter === 'all' ? "bg-slate-900 text-white border-slate-900" : "bg-white text-slate-600 border-slate-200")}
            >
              All Submissions ({artworks.length})
            </button>
            <button
              onClick={() => setArtworkFilter('pending')}
              className={cn("px-4 py-1.5 rounded-xl border transition-colors", artworkFilter === 'pending' ? "bg-amber-500 text-white border-amber-500" : "bg-white text-amber-700 border-amber-200")}
            >
              Pending Admin Review ({metrics.pendingArtworks})
            </button>
            <button
              onClick={() => setArtworkFilter('published')}
              className={cn("px-4 py-1.5 rounded-xl border transition-colors", artworkFilter === 'published' ? "bg-emerald-600 text-white border-emerald-600" : "bg-white text-emerald-700 border-emerald-200")}
            >
              Published Live ({metrics.publishedArtworks})
            </button>
            <button
              onClick={() => setArtworkFilter('rejected')}
              className={cn("px-4 py-1.5 rounded-xl border transition-colors", artworkFilter === 'rejected' ? "bg-rose-600 text-white border-rose-600" : "bg-white text-rose-700 border-rose-200")}
            >
              Rejected ({artworks.filter(a => a.status === 'rejected').length})
            </button>
          </div>

          {loadingArtworks ? (
            <div className="p-12 text-center text-slate-400 font-bold text-xs flex items-center justify-center gap-2">
              <Loader2 className="w-5 h-5 animate-spin text-purple-600" /> Loading submitted artworks...
            </div>
          ) : filteredArtworks.length === 0 ? (
            <Card className="rounded-3xl border-dashed border-2 border-slate-200 bg-white/70 p-12 text-center">
              <p className="text-slate-500 font-bold text-sm">No artwork submissions found.</p>
              <p className="text-xs text-slate-400 mt-1">Approved artists can submit artworks via the Artist Studio Portal.</p>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredArtworks.map((aw) => (
                <Card 
                  key={aw.id}
                  className={cn(
                    "rounded-3xl border bg-white overflow-hidden shadow-sm hover:shadow-lg transition-all flex flex-col justify-between",
                    aw.status === 'published' ? "border-emerald-200" : aw.status === 'rejected' ? "border-rose-200 opacity-60" : "border-amber-200"
                  )}
                >
                  <div>
                    {/* Artwork Image */}
                    <div className="relative aspect-[4/3] w-full bg-slate-100 overflow-hidden border-b">
                      {aw.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img 
                          src={aw.imageUrl} 
                          alt={aw.title} 
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-300 text-xs font-bold">
                          No Image
                        </div>
                      )}

                      {/* Status Badges Overlay */}
                      <div className="absolute top-3 left-3 flex items-center gap-2">
                        <span className={cn(
                          "px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider backdrop-blur-md shadow-md",
                          aw.status === 'published' ? "bg-emerald-600/90 text-white" :
                          aw.status === 'rejected' ? "bg-rose-600/90 text-white" :
                          "bg-amber-500/90 text-white animate-pulse"
                        )}>
                          {aw.status === 'published' ? "Live on Gallery" : aw.status === 'rejected' ? "Rejected" : "Pending Approval"}
                        </span>

                        {aw.soldOut && (
                          <span className="px-2 py-0.5 rounded-full bg-rose-900/90 text-white text-[10px] font-bold">
                            Sold Out
                          </span>
                        )}
                      </div>

                      <div className="absolute bottom-3 right-3 px-2.5 py-1 rounded-lg bg-black/75 backdrop-blur-md text-white text-xs font-bold">
                        {aw.medium}
                      </div>
                    </div>

                    <CardContent className="p-5 space-y-4">
                      {/* Title & Artist */}
                      <div>
                        <h3 className="text-base font-bold text-slate-900 line-clamp-1">{aw.title}</h3>
                        <p className="text-xs text-purple-700 font-semibold mt-0.5">
                          By {aw.artistName} {aw.artistCity ? `• ${aw.artistCity}` : ''}
                        </p>
                        {aw.dimensions && (
                          <p className="text-[11px] text-slate-400 mt-0.5">Dimensions: {aw.dimensions}</p>
                        )}
                      </div>

                      {/* Description */}
                      {aw.description && (
                        <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                          {aw.description}
                        </p>
                      )}

                      {/* Price Comparison Card (Artist Suggested vs Admin Price) */}
                      <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3.5 space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-500 font-medium">Artist Proposed:</span>
                          <span className="font-semibold text-slate-700">₹{aw.suggestedPrice?.toLocaleString() || 'N/A'}</span>
                        </div>
                        <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-200">
                          <span className="font-bold text-purple-900">Final Selling Price:</span>
                          <span className="font-black text-sm text-emerald-600">₹{aw.price?.toLocaleString()}</span>
                        </div>
                        <p className="text-[9px] text-slate-400 font-medium text-right">
                          *Set exclusively by Admin
                        </p>
                      </div>
                    </CardContent>
                  </div>

                  {/* Actions Footer */}
                  <div className="p-5 pt-0 border-t border-slate-100 flex items-center justify-between gap-2 mt-2">
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => handleOpenApproveArtwork(aw)}
                        className={cn(
                          "rounded-xl font-bold text-xs h-9 px-3.5 shadow-sm",
                          aw.status === 'published' 
                            ? "bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200" 
                            : "bg-emerald-600 hover:bg-emerald-700 text-white"
                        )}
                      >
                        {aw.status === 'published' ? <Edit className="w-3.5 h-3.5 mr-1" /> : <CheckCircle2 className="w-3.5 h-3.5 mr-1" />}
                        {aw.status === 'published' ? "Edit Price" : "Review & Publish"}
                      </Button>

                      {aw.status === 'published' && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleToggleArtworkSoldOut(aw)}
                          className="rounded-xl border-slate-200 text-xs font-bold h-9 px-2.5"
                        >
                          {aw.soldOut ? "Make Available" : "Mark Sold"}
                        </Button>
                      )}

                      {aw.status !== 'rejected' && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRejectArtwork(aw)}
                          className="rounded-xl text-rose-500 hover:bg-rose-50 text-xs font-bold h-9 px-2"
                        >
                          Reject
                        </Button>
                      )}
                    </div>

                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteArtwork(aw.id)}
                      className="rounded-xl h-9 w-9 p-0 text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* MODAL 1: Approve Artist & Set Access Password */}
      <Dialog open={artistPasswordModal} onOpenChange={setArtistPasswordModal}>
        <DialogContent className="max-w-md rounded-3xl p-6 sm:p-8">
          <DialogHeader>
            <DialogTitle className="text-xl font-headline font-black text-slate-900 tracking-tight flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
              Approve Artist &amp; Grant Access
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Confirm approval for <strong>{selectedArtist?.name}</strong>. Provide their login password so they can access the Artist Studio portal.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 pt-3">
            <div className="bg-slate-50 rounded-2xl p-4 space-y-2 border border-slate-100 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Artist Name:</span>
                <span className="font-bold text-slate-800">{selectedArtist?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Registered Email:</span>
                <span className="font-bold text-slate-800">{selectedArtist?.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Specialty:</span>
                <span className="font-bold text-purple-600">{selectedArtist?.specialty || "Artist"}</span>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-700">
                Portal Login Password *
              </Label>
              <div className="relative">
                <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-purple-500" />
                <Input
                  type="text"
                  required
                  value={customPassword}
                  onChange={(e) => setCustomPassword(e.target.value)}
                  placeholder="Enter or generate password"
                  className="rounded-xl h-11 pl-10 border-slate-200 text-xs font-bold font-mono focus-visible:ring-purple-500"
                />
              </div>
              <p className="text-[10px] text-slate-400">
                The artist will use their registered email and this password to log in at <code>/art-gallery/artist-portal</code>.
              </p>
            </div>
          </div>

          <DialogFooter className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => setArtistPasswordModal(false)}
              className="rounded-xl h-11 text-xs font-bold border-slate-200 text-slate-600"
            >
              Cancel
            </Button>
            <Button
              type="button"
              disabled={isProcessingArtist || !customPassword.trim()}
              onClick={handleConfirmApproveArtist}
              className="rounded-xl h-11 px-6 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20"
            >
              {isProcessingArtist ? <Loader2 className="w-4 h-4 animate-spin mr-1.5" /> : <CheckCircle2 className="w-4 h-4 mr-1.5" />}
              Confirm Approval &amp; Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MODAL 2: Approve Artwork & Set Admin Selling Price */}
      <Dialog open={artworkApproveModal} onOpenChange={setArtworkApproveModal}>
        <DialogContent className="max-w-md rounded-3xl p-6 sm:p-8">
          <DialogHeader>
            <DialogTitle className="text-xl font-headline font-black text-slate-900 tracking-tight flex items-center gap-2">
              <Palette className="w-5 h-5 text-purple-600" />
              Set Selling Price &amp; Publish Artwork
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              The artist proposed a price. As the admin curator, you decide the final selling price on the website.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 pt-3">
            {/* Artwork Snapshot */}
            <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-100">
              <div className="w-16 h-16 rounded-xl bg-slate-200 overflow-hidden shrink-0">
                {selectedArtwork?.imageUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={selectedArtwork.imageUrl} alt={selectedArtwork.title} className="w-full h-full object-cover" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="text-sm font-bold text-slate-900 truncate">{selectedArtwork?.title}</h4>
                <p className="text-xs text-purple-600 font-semibold">{selectedArtwork?.medium}</p>
                <p className="text-[11px] text-slate-400">By {selectedArtwork?.artistName}</p>
              </div>
            </div>

            {/* Price Setting */}
            <div className="bg-purple-50/70 border border-purple-100 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-600 font-medium">Artist&apos;s Suggested Price:</span>
                <span className="font-bold text-slate-800">₹{selectedArtwork?.suggestedPrice?.toLocaleString() || '0'}</span>
              </div>

              <div className="space-y-1.5 pt-1 border-t border-purple-100">
                <Label className="text-xs font-bold text-purple-950 flex items-center justify-between">
                  <span>Final Approved Selling Price (₹) *</span>
                  <span className="text-[10px] text-purple-600 font-bold">Admin Controlled</span>
                </Label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-black text-slate-400 text-sm">₹</span>
                  <Input
                    type="number"
                    min="1"
                    required
                    value={finalSellingPrice}
                    onChange={(e) => setFinalSellingPrice(e.target.value)}
                    placeholder="e.g. 2999"
                    className="rounded-xl h-11 pl-9 border-purple-200 text-sm font-black text-slate-900 bg-white focus-visible:ring-purple-500"
                  />
                </div>
                <p className="text-[10px] text-purple-700">
                  This is the exact price customers will pay when ordering this artwork.
                </p>
              </div>
            </div>
          </div>

          <DialogFooter className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => setArtworkApproveModal(false)}
              className="rounded-xl h-11 text-xs font-bold border-slate-200 text-slate-600"
            >
              Cancel
            </Button>
            <Button
              type="button"
              disabled={isProcessingArtwork || !finalSellingPrice}
              onClick={handleConfirmPublishArtwork}
              className="rounded-xl h-11 px-6 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold text-xs shadow-md shadow-purple-600/20"
            >
              {isProcessingArtwork ? <Loader2 className="w-4 h-4 animate-spin mr-1.5" /> : <Sparkles className="w-4 h-4 mr-1.5" />}
              Publish to Art Gallery
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
