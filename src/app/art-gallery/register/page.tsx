"use client";

import { useState } from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';
import { 
  Palette, 
  Sparkles, 
  ArrowRight, 
  CheckCircle2, 
  UploadCloud, 
  Lock, 
  Mail, 
  Phone, 
  User, 
  MapPin, 
  Globe, 
  Instagram, 
  ShieldCheck, 
  Loader2,
  Brush,
  Heart
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useFirestore } from '@/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';

export default function ArtistRegistrationPage() {
  const db = useFirestore();
  const { toast } = useToast();

  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Form Fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('');
  const [specialty, setSpecialty] = useState('');
  const [bio, setBio] = useState('');
  const [portfolioUrl, setPortfolioUrl] = useState('');
  const [instagramUrl, setInstagramUrl] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [sampleUrl1, setSampleUrl1] = useState('');
  const [sampleUrl2, setSampleUrl2] = useState('');
  const [sampleUrl3, setSampleUrl3] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!db) return;

    if (!name.trim() || !email.trim() || !phone.trim() || !password.trim()) {
      toast({
        variant: "destructive",
        title: "Missing Information",
        description: "Please fill in all required fields (Name, Email, Phone, Password)."
      });
      return;
    }

    setLoading(true);
    try {
      const sampleImages = [sampleUrl1, sampleUrl2, sampleUrl3]
        .map(s => s.trim())
        .filter(Boolean);

      const artistDoc = {
        name: name.trim(),
        email: email.toLowerCase().trim(),
        phone: phone.trim(),
        city: city.trim(),
        specialty: specialty.trim() || 'Visual Arts',
        bio: bio.trim(),
        portfolioUrl: portfolioUrl.trim(),
        instagramUrl: instagramUrl.trim(),
        avatarUrl: avatarUrl.trim(),
        sampleImages,
        password: password.trim(),
        status: 'pending_approval',
        totalArtworks: 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      await addDoc(collection(db, 'artists'), artistDoc);
      setSubmitted(true);
      toast({
        title: "Application Received!",
        description: "Your artist portfolio has been submitted to the curation team."
      });
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Registration Failed",
        description: err.message || "Could not submit your application."
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#faf5ff]/40">
      <Navbar />

      <div className="pt-28 md:pt-36 pb-20 px-4 sm:px-6 max-w-4xl mx-auto">
        {submitted ? (
          <div className="bg-white rounded-3xl p-8 sm:p-14 border border-purple-100 shadow-xl text-center space-y-6 max-w-2xl mx-auto">
            <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div className="space-y-2">
              <span className="text-xs font-black text-purple-600 uppercase tracking-widest">
                Application Submitted Successfully
              </span>
              <h1 className="text-2xl sm:text-3xl font-headline font-black text-slate-900">
                Welcome to the GiftArtStudio Collective!
              </h1>
              <p className="text-slate-600 text-sm leading-relaxed max-w-lg mx-auto">
                Thank you for applying, <strong>{name}</strong>! Our curation team reviews all artist portfolios to ensure genuine handcrafted quality.
              </p>
            </div>

            <div className="bg-purple-50 rounded-2xl p-5 border border-purple-100 text-left space-y-2.5 text-xs text-purple-900">
              <p className="font-bold flex items-center gap-2 text-purple-950">
                <ShieldCheck className="w-4 h-4 text-purple-600" />
                What happens next?
              </p>
              <ul className="list-disc list-inside space-y-1 text-slate-600 pl-1">
                <li>Our curation admin will inspect your portfolio and bio in the admin panel.</li>
                <li>Once approved, you can log into the <strong>Artist Studio Portal</strong> using your email (<strong>{email}</strong>) and password.</li>
                <li>You can then upload your artworks and suggest prices for admin listing!</li>
              </ul>
            </div>

            <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Button asChild className="rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs h-12 px-6 w-full sm:w-auto">
                <Link href="/art-gallery/artist-portal">
                  Go to Artist Login Portal <ArrowRight className="w-4 h-4 ml-1.5" />
                </Link>
              </Button>
              <Button asChild variant="outline" className="rounded-xl border-slate-200 text-slate-700 font-bold text-xs h-12 px-6 w-full sm:w-auto">
                <Link href="/art-gallery">
                  Browse Art Gallery
                </Link>
              </Button>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-3xl border border-purple-100 shadow-xl overflow-hidden">
            {/* Hero Top */}
            <div className="bg-gradient-to-r from-purple-700 via-indigo-700 to-pink-600 p-8 sm:p-12 text-white relative overflow-hidden">
              <div className="relative z-10 space-y-2 max-w-2xl">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-white text-xs font-bold">
                  <Brush className="w-3.5 h-3.5" />
                  <span>Call for Independent Artists</span>
                </div>
                <h1 className="text-3xl sm:text-4xl font-headline font-black tracking-tight leading-tight">
                  Sell Your Original Art on GiftArtStudio
                </h1>
                <p className="text-sm text-purple-100 leading-relaxed font-normal">
                  Join our curated art marketplace. Reach art collectors and gift lovers across India. Every artist gets a verified profile, bio showcase, and seamless fulfillment.
                </p>
              </div>
              <div className="absolute right-0 top-0 w-80 h-80 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
            </div>

            {/* Application Form */}
            <form onSubmit={handleSubmit} className="p-6 sm:p-10 space-y-8">
              {/* Personal Details */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-purple-900 font-black text-sm uppercase tracking-wider pb-1 border-b border-purple-100">
                  <User className="w-4 h-4 text-purple-600" />
                  <span>1. Artist Profile &amp; Contact Details</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-slate-700">Full Name *</Label>
                    <Input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Ananya Roy"
                      className="rounded-xl h-11 border-slate-200 text-xs font-medium focus-visible:ring-purple-500"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-slate-700">Email Address *</Label>
                    <Input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="e.g. ananya.art@gmail.com"
                      className="rounded-xl h-11 border-slate-200 text-xs font-medium focus-visible:ring-purple-500"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-slate-700">Phone / WhatsApp Number *</Label>
                    <Input
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="e.g. +91 98765 43210"
                      className="rounded-xl h-11 border-slate-200 text-xs font-medium focus-visible:ring-purple-500"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-slate-700">City &amp; State</Label>
                    <Input
                      type="text"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="e.g. Bangalore, Karnataka"
                      className="rounded-xl h-11 border-slate-200 text-xs font-medium focus-visible:ring-purple-500"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-700">
                    Art Specialty / Mediums
                  </Label>
                  <Input
                    type="text"
                    value={specialty}
                    onChange={(e) => setSpecialty(e.target.value)}
                    placeholder="e.g. Oil on Canvas, Resin Ocean Art, Textured Acrylics, Watercolors"
                    className="rounded-xl h-11 border-slate-200 text-xs font-medium focus-visible:ring-purple-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-700">
                    Artist Bio / About You *
                  </Label>
                  <textarea
                    required
                    rows={4}
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Share your journey as an artist, your inspiration, techniques you love, and what makes your art unique. This bio will be visible to art buyers alongside your artworks."
                    className="w-full rounded-2xl border border-slate-200 p-3.5 text-xs font-normal text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                  />
                </div>
              </div>

              {/* Online Presence & Samples */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-purple-900 font-black text-sm uppercase tracking-wider pb-1 border-b border-purple-100">
                  <Globe className="w-4 h-4 text-purple-600" />
                  <span>2. Portfolio &amp; Sample Artworks</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-slate-700">Portfolio Website / Behance (Optional)</Label>
                    <Input
                      type="url"
                      value={portfolioUrl}
                      onChange={(e) => setPortfolioUrl(e.target.value)}
                      placeholder="https://behance.net/yourprofile"
                      className="rounded-xl h-11 border-slate-200 text-xs font-medium focus-visible:ring-purple-500"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-slate-700">Instagram Profile Link (Optional)</Label>
                    <Input
                      type="url"
                      value={instagramUrl}
                      onChange={(e) => setInstagramUrl(e.target.value)}
                      placeholder="https://instagram.com/your_art_handle"
                      className="rounded-xl h-11 border-slate-200 text-xs font-medium focus-visible:ring-purple-500"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-700">Artist Profile Photo URL (Optional)</Label>
                  <Input
                    type="url"
                    value={avatarUrl}
                    onChange={(e) => setAvatarUrl(e.target.value)}
                    placeholder="https://... photo of yourself or studio"
                    className="rounded-xl h-11 border-slate-200 text-xs font-medium focus-visible:ring-purple-500"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-bold text-slate-700">
                    Sample Artwork Image URLs (1 to 3 direct image links)
                  </Label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <Input
                      type="url"
                      value={sampleUrl1}
                      onChange={(e) => setSampleUrl1(e.target.value)}
                      placeholder="Sample Art Image URL 1"
                      className="rounded-xl h-10 border-slate-200 text-xs font-medium focus-visible:ring-purple-500"
                    />
                    <Input
                      type="url"
                      value={sampleUrl2}
                      onChange={(e) => setSampleUrl2(e.target.value)}
                      placeholder="Sample Art Image URL 2"
                      className="rounded-xl h-10 border-slate-200 text-xs font-medium focus-visible:ring-purple-500"
                    />
                    <Input
                      type="url"
                      value={sampleUrl3}
                      onChange={(e) => setSampleUrl3(e.target.value)}
                      placeholder="Sample Art Image URL 3"
                      className="rounded-xl h-10 border-slate-200 text-xs font-medium focus-visible:ring-purple-500"
                    />
                  </div>
                </div>
              </div>

              {/* Login Credentials */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-purple-900 font-black text-sm uppercase tracking-wider pb-1 border-b border-purple-100">
                  <Lock className="w-4 h-4 text-purple-600" />
                  <span>3. Desired Artist Studio Portal Password</span>
                </div>

                <div className="space-y-1.5 max-w-md">
                  <Label className="text-xs font-bold text-slate-700">Create Password *</Label>
                  <Input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Choose a secure password for your artist login"
                    className="rounded-xl h-11 border-slate-200 text-xs font-bold focus-visible:ring-purple-500"
                  />
                  <p className="text-[10px] text-slate-400">
                    Once the admin approves your application, you will log in with your email and this password to manage your artworks.
                  </p>
                </div>
              </div>

              {/* Submit CTA */}
              <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
                <p className="text-xs text-slate-500">
                  Already registered?{' '}
                  <Link href="/art-gallery/artist-portal" className="font-bold text-purple-600 hover:underline">
                    Log in to Artist Portal
                  </Link>
                </p>

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full sm:w-auto h-12 px-8 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-purple-500/20 active:scale-95 transition-all"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-2" /> Submitting Application...
                    </>
                  ) : (
                    <>
                      Submit Application for Admin Review <ArrowRight className="w-4 h-4 ml-2" />
                    </>
                  )}
                </Button>
              </div>
            </form>
          </div>
        )}
      </div>

      <Footer />
    </main>
  );
}
