"use client";

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';
import { 
  Palette, 
  Plus, 
  Upload, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  LogOut, 
  Eye, 
  Sparkles, 
  User, 
  KeyRound, 
  Mail, 
  ExternalLink, 
  ShieldCheck, 
  Loader2,
  Tag,
  Brush,
  ArrowRight
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
  query, 
  where, 
  getDocs, 
  serverTimestamp, 
  orderBy 
} from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Artist, Artwork } from '@/lib/types';

export default function ArtistPortalPage() {
  const db = useFirestore();
  const { toast } = useToast();

  // Auth States
  const [currentArtist, setCurrentArtist] = useState<Artist | null>(null);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Upload Artwork Modal States
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isSubmittingArtwork, setIsSubmittingArtwork] = useState(false);

  // New Artwork Form
  const [artTitle, setArtTitle] = useState('');
  const [artMedium, setArtMedium] = useState('Oil on Canvas');
  const [artDimensions, setArtDimensions] = useState('24 × 36 inches');
  const [artYear, setArtYear] = useState('2024');
  const [artDescription, setArtDescription] = useState('');
  const [artImageUrl, setArtImageUrl] = useState('');
  const [artAdditionalImage, setArtAdditionalImage] = useState('');
  const [artSuggestedPrice, setArtSuggestedPrice] = useState('');

  // Check saved session on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('gas_artist_session');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          setCurrentArtist(parsed);
        } catch (e) {}
      }
    }
  }, []);

  // Fetch artist's artworks
  const myArtworksQuery = useMemo(() => {
    if (!db || !currentArtist?.id) return null;
    return query(
      collection(db, 'artworks'),
      where('artistId', '==', currentArtist.id),
      orderBy('createdAt', 'desc')
    );
  }, [db, currentArtist?.id]);

  const { data: rawMyArtworks, loading: loadingArtworks } = useCollection<any>(myArtworksQuery);

  const myArtworks: Artwork[] = useMemo(() => {
    if (!rawMyArtworks) return [];
    return rawMyArtworks.map((doc: any) => ({
      id: doc.id,
      artistId: doc.artistId,
      artistName: doc.artistName,
      artistEmail: doc.artistEmail,
      artistBio: doc.artistBio,
      artistAvatar: doc.artistAvatar,
      artistPortfolio: doc.artistPortfolio,
      artistCity: doc.artistCity,
      title: doc.title,
      medium: doc.medium,
      dimensions: doc.dimensions,
      yearCreated: doc.yearCreated,
      description: doc.description,
      imageUrl: doc.imageUrl,
      additionalImages: doc.additionalImages || [],
      suggestedPrice: Number(doc.suggestedPrice) || 0,
      price: Number(doc.price) || Number(doc.suggestedPrice) || 0,
      status: doc.status || 'pending_review',
      rejectionReason: doc.rejectionReason,
      soldOut: Boolean(doc.soldOut),
      createdAt: doc.createdAt
    }));
  }, [rawMyArtworks]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!db) return;
    setIsLoggingIn(true);
    setAuthError(null);

    try {
      const cleanEmail = loginEmail.toLowerCase().trim();
      const artistsRef = collection(db, 'artists');
      const q = query(artistsRef, where('email', '==', cleanEmail));
      const snap = await getDocs(q);

      if (snap.empty) {
        setAuthError("No artist account found with this email. Please apply first!");
        setIsLoggingIn(false);
        return;
      }

      const docSnap = snap.docs[0];
      const data = docSnap.data();
      const artistObj: Artist = {
        id: docSnap.id,
        name: data.name,
        email: data.email,
        phone: data.phone,
        city: data.city,
        specialty: data.specialty,
        bio: data.bio,
        avatarUrl: data.avatarUrl,
        portfolioUrl: data.portfolioUrl,
        instagramUrl: data.instagramUrl,
        password: data.password,
        status: data.status || 'pending_approval',
        rejectionReason: data.rejectionReason,
        createdAt: data.createdAt
      };

      // Check password
      if (data.password && data.password.trim() !== loginPassword.trim()) {
        setAuthError("Incorrect password. Please verify your credentials.");
        setIsLoggingIn(false);
        return;
      }

      // Check approval status
      if (artistObj.status === 'pending_approval') {
        setCurrentArtist(artistObj); // shows pending screen
        toast({
          title: "Application Under Review",
          description: "Your artist application is currently awaiting admin verification."
        });
        setIsLoggingIn(false);
        return;
      }

      if (artistObj.status === 'rejected') {
        setCurrentArtist(artistObj); // shows rejected screen
        setIsLoggingIn(false);
        return;
      }

      // Successful login
      setCurrentArtist(artistObj);
      if (typeof window !== 'undefined') {
        localStorage.setItem('gas_artist_session', JSON.stringify(artistObj));
      }
      toast({
        title: "Welcome to Artist Studio!",
        description: `Logged in as ${artistObj.name}`
      });
    } catch (err: any) {
      setAuthError(err.message || "Failed to log in.");
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = () => {
    setCurrentArtist(null);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('gas_artist_session');
    }
    toast({ title: "Logged Out from Artist Studio" });
  };

  const handleUploadArtwork = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!db || !currentArtist) return;

    if (!artTitle.trim() || !artImageUrl.trim() || !artSuggestedPrice.trim()) {
      toast({
        variant: "destructive",
        title: "Required Fields Missing",
        description: "Please provide Artwork Title, Image URL, and your Suggested Price."
      });
      return;
    }

    setIsSubmittingArtwork(true);
    try {
      const suggestedPriceNum = Number(artSuggestedPrice);

      const artworkDoc = {
        artistId: currentArtist.id,
        artistName: currentArtist.name,
        artistEmail: currentArtist.email,
        artistBio: currentArtist.bio || '',
        artistAvatar: currentArtist.avatarUrl || '',
        artistPortfolio: currentArtist.portfolioUrl || '',
        artistCity: currentArtist.city || '',
        title: artTitle.trim(),
        medium: artMedium.trim() || 'Visual Art',
        dimensions: artDimensions.trim(),
        yearCreated: artYear.trim(),
        description: artDescription.trim(),
        imageUrl: artImageUrl.trim(),
        additionalImages: artAdditionalImage.trim() ? [artAdditionalImage.trim()] : [],
        suggestedPrice: suggestedPriceNum,
        price: suggestedPriceNum, // initial placeholder until Admin approves final price
        status: 'pending_review', // strictly pending until Admin publishes
        soldOut: false,
        featured: false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      await addDoc(collection(db, 'artworks'), artworkDoc);

      toast({
        title: "Artwork Submitted for Review!",
        description: "Your artwork is sent to the admin curation team for price approval."
      });

      // Reset Form
      setArtTitle('');
      setArtDescription('');
      setArtImageUrl('');
      setArtAdditionalImage('');
      setArtSuggestedPrice('');
      setIsUploadOpen(false);
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Submission Error",
        description: err.message || "Could not submit artwork."
      });
    } finally {
      setIsSubmittingArtwork(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#faf5ff]/40">
      <Navbar />

      <div className="pt-28 md:pt-36 pb-20 px-4 sm:px-6 max-w-6xl mx-auto">
        {!currentArtist ? (
          /* LOGIN SCREEN */
          <div className="max-w-md mx-auto bg-white rounded-3xl border border-purple-100 shadow-xl p-8 sm:p-10 space-y-6">
            <div className="text-center space-y-2">
              <div className="w-16 h-16 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center mx-auto shadow-inner">
                <Palette className="w-8 h-8" />
              </div>
              <h1 className="text-2xl font-headline font-black text-slate-900 tracking-tight">
                Artist Studio Login
              </h1>
              <p className="text-xs text-slate-500 font-medium">
                Log into your artist workspace to submit original artworks, track curation reviews, and manage your portfolio.
              </p>
            </div>

            {authError && (
              <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-2xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{authError}</span>
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-700">Registered Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    type="email"
                    required
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder="artist@example.com"
                    className="rounded-xl h-11 pl-10 border-slate-200 text-xs font-medium focus-visible:ring-purple-500"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-700">Password</Label>
                <div className="relative">
                  <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    type="password"
                    required
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="Your artist account password"
                    className="rounded-xl h-11 pl-10 border-slate-200 text-xs font-bold focus-visible:ring-purple-500"
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={isLoggingIn}
                className="w-full h-12 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold text-xs uppercase tracking-wider shadow-md shadow-purple-500/20 active:scale-95 transition-all"
              >
                {isLoggingIn ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : "Sign In to Studio"}
              </Button>
            </form>

            <div className="pt-4 border-t border-slate-100 text-center space-y-2">
              <p className="text-xs text-slate-500">
                Not registered as an artist yet?
              </p>
              <Button asChild variant="outline" className="w-full rounded-xl border-purple-200 text-purple-700 hover:bg-purple-50 text-xs font-bold h-10">
                <Link href="/art-gallery/register">
                  Apply as an Artist <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                </Link>
              </Button>
            </div>
          </div>
        ) : currentArtist.status === 'pending_approval' ? (
          /* PENDING APPROVAL SCREEN */
          <div className="max-w-lg mx-auto bg-white rounded-3xl border border-amber-200 shadow-xl p-8 sm:p-12 text-center space-y-6">
            <div className="w-20 h-20 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto shadow-inner animate-pulse">
              <Clock className="w-10 h-10" />
            </div>

            <div className="space-y-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-amber-700 bg-amber-50 px-3 py-1 rounded-full border border-amber-200">
                Account Status: Under Admin Review
              </span>
              <h2 className="text-2xl font-headline font-black text-slate-900">
                Hello, {currentArtist.name}!
              </h2>
              <p className="text-xs text-slate-600 leading-relaxed max-w-sm mx-auto">
                Your artist registration has been received and is waiting for administrator approval in the Admin Panel.
              </p>
            </div>

            <div className="p-4 bg-purple-50 rounded-2xl border border-purple-100 text-xs text-purple-900 text-left space-y-1.5">
              <p className="font-bold flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-purple-600" /> Curation Process:
              </p>
              <p className="text-slate-600 text-[11px] leading-relaxed">
                Our curation admin inspects each artist profile before enabling uploads. Once the admin marks your account as <strong>Approved</strong>, refreshing this page will automatically unlock your upload studio!
              </p>
            </div>

            <Button
              type="button"
              variant="outline"
              onClick={handleLogout}
              className="rounded-xl border-slate-200 text-slate-600 font-bold text-xs h-10"
            >
              Sign Out
            </Button>
          </div>
        ) : currentArtist.status === 'rejected' ? (
          /* REJECTED SCREEN */
          <div className="max-w-lg mx-auto bg-white rounded-3xl border border-rose-200 shadow-xl p-8 sm:p-12 text-center space-y-6">
            <div className="w-20 h-20 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto">
              <AlertCircle className="w-10 h-10" />
            </div>
            <h2 className="text-2xl font-black text-slate-900">Application Status: Not Approved</h2>
            <p className="text-xs text-slate-600">
              Reason: {currentArtist.rejectionReason || "Portfolio does not meet current gallery criteria."}
            </p>
            <Button type="button" onClick={handleLogout} className="rounded-xl bg-slate-800 text-white font-bold text-xs">
              Log Out
            </Button>
          </div>
        ) : (
          /* APPROVED ARTIST DASHBOARD */
          <div className="space-y-8">
            {/* Top Artist Profile Card */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-purple-100 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white font-black text-xl flex items-center justify-center shadow-md overflow-hidden">
                  {currentArtist.avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={currentArtist.avatarUrl} alt={currentArtist.name} className="w-full h-full object-cover" />
                  ) : (
                    currentArtist.name.charAt(0).toUpperCase()
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="text-xl sm:text-2xl font-headline font-black text-slate-900">
                      {currentArtist.name}
                    </h1>
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold border border-emerald-200">
                      <ShieldCheck className="w-3 h-3 text-emerald-600" /> Verified Artist
                    </span>
                  </div>
                  <p className="text-xs text-purple-600 font-semibold">{currentArtist.specialty || "Studio Artist"}</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">{currentArtist.email} {currentArtist.city ? `• ${currentArtist.city}` : ''}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto">
                <Button
                  type="button"
                  onClick={() => setIsUploadOpen(true)}
                  className="flex-1 sm:flex-none rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold text-xs h-11 px-5 shadow-md shadow-purple-500/20 gap-2 active:scale-95 transition-all"
                >
                  <Plus className="w-4 h-4" /> Upload New Artwork
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  onClick={handleLogout}
                  className="rounded-2xl border-slate-200 text-slate-600 hover:bg-slate-100 text-xs font-bold h-11 px-3.5"
                >
                  <LogOut className="w-4 h-4 mr-1" /> Logout
                </Button>
              </div>
            </div>

            {/* My Submissions Header & Count */}
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-headline font-black text-slate-900">My Artworks &amp; Submissions</h2>
                <p className="text-xs text-slate-500">
                  All artworks are reviewed by the admin curation team and priced before going live.
                </p>
              </div>

              <span className="text-xs font-bold text-purple-700 bg-purple-50 px-3 py-1 rounded-full border border-purple-200">
                {myArtworks.length} Total Uploads
              </span>
            </div>

            {/* Artwork List Grid */}
            {loadingArtworks ? (
              <div className="p-12 text-center text-slate-400 font-bold text-xs flex items-center justify-center gap-2">
                <Loader2 className="w-5 h-5 animate-spin text-purple-600" /> Loading your studio works...
              </div>
            ) : myArtworks.length === 0 ? (
              <Card className="rounded-3xl border-dashed border-2 border-slate-200 bg-white/70 p-12 text-center">
                <CardContent className="space-y-4 max-w-sm mx-auto">
                  <div className="w-16 h-16 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center mx-auto">
                    <Brush className="w-8 h-8" />
                  </div>
                  <h3 className="text-base font-bold text-slate-800">No Artworks Uploaded Yet</h3>
                  <p className="text-xs text-slate-500">
                    Click the &quot;Upload New Artwork&quot; button above to submit your first masterpiece!
                  </p>
                  <Button
                    type="button"
                    onClick={() => setIsUploadOpen(true)}
                    className="rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold"
                  >
                    <Plus className="w-4 h-4 mr-1.5" /> Submit First Artwork
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {myArtworks.map((aw) => (
                  <Card key={aw.id} className="rounded-3xl border border-slate-100 bg-white overflow-hidden shadow-sm hover:shadow-md transition-all">
                    <div className="relative aspect-[4/3] w-full bg-slate-100 overflow-hidden border-b">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={aw.imageUrl} alt={aw.title} className="w-full h-full object-cover" />

                      <div className="absolute top-3 left-3">
                        <span className={cn(
                          "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider backdrop-blur-md shadow-md",
                          aw.status === 'published' ? "bg-emerald-600/90 text-white" :
                          aw.status === 'rejected' ? "bg-rose-600/90 text-white" :
                          "bg-amber-500/90 text-white animate-pulse"
                        )}>
                          {aw.status === 'published' ? "Live in Gallery" :
                           aw.status === 'rejected' ? "Rejected" :
                           "Awaiting Admin Approval"}
                        </span>
                      </div>
                    </div>

                    <CardContent className="p-5 space-y-3">
                      <div>
                        <h3 className="text-base font-bold text-slate-900 line-clamp-1">{aw.title}</h3>
                        <p className="text-xs text-purple-600 font-semibold">{aw.medium} • {aw.dimensions}</p>
                      </div>

                      <div className="bg-purple-50/70 border border-purple-100 rounded-xl p-3 space-y-1.5 text-xs">
                        <div className="flex justify-between">
                          <span className="text-slate-500">Your Proposed Price:</span>
                          <span className="font-semibold text-slate-700">₹{aw.suggestedPrice?.toLocaleString()}</span>
                        </div>
                        {aw.status === 'published' && (
                          <div className="flex justify-between font-bold text-emerald-700 pt-1 border-t border-purple-100">
                            <span>Admin Approved Price:</span>
                            <span className="text-sm">₹{aw.price?.toLocaleString()}</span>
                          </div>
                        )}
                      </div>

                      {aw.status === 'published' && (
                        <Button asChild variant="outline" size="sm" className="w-full rounded-xl border-purple-200 text-purple-700 text-xs font-bold">
                          <Link href={`/art-gallery/${aw.id}`} target="_blank">
                            <Eye className="w-3.5 h-3.5 mr-1.5" /> View on Live Gallery <ExternalLink className="w-3 h-3 ml-1" />
                          </Link>
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* UPLOAD ARTWORK DIALOG */}
      <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto rounded-3xl p-6 sm:p-8">
          <DialogHeader>
            <DialogTitle className="text-xl font-headline font-black text-slate-900 tracking-tight flex items-center gap-2">
              <Palette className="w-5 h-5 text-purple-600" />
              Upload New Artwork
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Provide complete details for your artwork. Once submitted, the admin curation team will verify the details, finalize the selling price, and publish it to the gallery.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleUploadArtwork} className="space-y-4 pt-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-700">Artwork Title *</Label>
              <Input
                type="text"
                required
                value={artTitle}
                onChange={(e) => setArtTitle(e.target.value)}
                placeholder="e.g. Whispers of the Sunset"
                className="rounded-xl h-11 border-slate-200 text-xs font-medium focus-visible:ring-purple-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-700">Medium / Technique *</Label>
                <Input
                  type="text"
                  required
                  value={artMedium}
                  onChange={(e) => setArtMedium(e.target.value)}
                  placeholder="e.g. Oil on Canvas, Resin Art"
                  className="rounded-xl h-11 border-slate-200 text-xs font-medium focus-visible:ring-purple-500"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-700">Dimensions *</Label>
                <Input
                  type="text"
                  required
                  value={artDimensions}
                  onChange={(e) => setArtDimensions(e.target.value)}
                  placeholder="e.g. 24 × 36 inches"
                  className="rounded-xl h-11 border-slate-200 text-xs font-medium focus-visible:ring-purple-500"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-700">Artwork Story &amp; Description *</Label>
              <textarea
                required
                rows={3}
                value={artDescription}
                onChange={(e) => setArtDescription(e.target.value)}
                placeholder="Describe the inspiration, emotions, or unique techniques behind this artwork."
                className="w-full rounded-2xl border border-slate-200 p-3.5 text-xs font-normal text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                <span>High-Resolution Artwork Image URL *</span>
                <span className="text-[10px] text-purple-600 font-semibold">Direct image link</span>
              </Label>
              <Input
                type="url"
                required
                value={artImageUrl}
                onChange={(e) => setArtImageUrl(e.target.value)}
                placeholder="https://... direct image URL"
                className="rounded-xl h-11 border-slate-200 text-xs font-medium focus-visible:ring-purple-500"
              />
            </div>

            {/* Live Preview */}
            {artImageUrl.trim() && (
              <div className="relative aspect-[16/9] w-full rounded-2xl bg-slate-100 overflow-hidden border border-slate-200">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={artImageUrl.trim()} alt="Preview" className="w-full h-full object-cover" />
              </div>
            )}

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-700">Additional View Image URL (Optional)</Label>
              <Input
                type="url"
                value={artAdditionalImage}
                onChange={(e) => setArtAdditionalImage(e.target.value)}
                placeholder="https://... framed view, close up, or signature view"
                className="rounded-xl h-11 border-slate-200 text-xs font-medium focus-visible:ring-purple-500"
              />
            </div>

            {/* Suggested Price Field with Explanatory Alert */}
            <div className="bg-amber-50/70 border border-amber-200 rounded-2xl p-4 space-y-2">
              <Label className="text-xs font-bold text-amber-950 flex items-center justify-between">
                <span>Your Proposed / Suggested Price (₹) *</span>
                <span className="text-[10px] text-amber-700 font-semibold">Under Admin Review</span>
              </Label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-bold text-slate-400 text-sm">₹</span>
                <Input
                  type="number"
                  min="100"
                  required
                  value={artSuggestedPrice}
                  onChange={(e) => setArtSuggestedPrice(e.target.value)}
                  placeholder="e.g. 2500"
                  className="rounded-xl h-11 pl-9 border-amber-200 text-xs font-bold bg-white focus-visible:ring-amber-500"
                />
              </div>
              <p className="text-[10px] text-amber-800 leading-tight">
                <strong>Important:</strong> As per gallery policy, final prices are set and confirmed by the Admin before publishing to maintain consistency and collector trust.
              </p>
            </div>

            <DialogFooter className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsUploadOpen(false)}
                className="rounded-xl h-11 text-xs font-bold border-slate-200 text-slate-600"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmittingArtwork}
                className="rounded-xl h-11 px-6 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-md shadow-purple-600/20"
              >
                {isSubmittingArtwork ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-1.5" />
                    Submitting...
                  </>
                ) : (
                  "Submit for Admin Approval"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Footer />
    </main>
  );
}
