'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  ArrowRight,
  ArrowLeft,
  Smartphone,
  Code,
  Edit2,
  User,
  Mail,
  Lock,
  Phone,
  Loader2,
  CheckCircle2,
  Sparkles
} from 'lucide-react';
import { useAuth, useFirestore } from '@/firebase';
import {
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signInAnonymously,
  updateProfile
} from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';

const ADMIN_EMAIL = 'rohanswakkargiftartstudio@gmail.com';

function SignupContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const auth = useAuth();
  const db = useFirestore();
  const { toast } = useToast();

  // Mode: 'email' (Default Email Signup) | 'mobile' (Mobile OTP) | 'otp' (OTP Verification) | 'code' (Create with Code)
  const initialMode = searchParams?.get('mode') === 'code' ? 'code' : 'email';
  const [mode, setMode] = useState<'email' | 'mobile' | 'otp' | 'code'>(initialMode);

  // Email Signup Form Fields (No OTP for Email!)
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');

  // Mobile OTP Form Fields (OTP Only for Mobile!)
  const [mobileNumber, setMobileNumber] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [timer, setTimer] = useState(45);

  // Invite Code
  const [inviteCode, setInviteCode] = useState('');

  const [loading, setLoading] = useState(false);
  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // OTP Countdown
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (mode === 'otp' && timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [mode, timer]);

  // ========================================================
  // 1. DIRECT EMAIL SIGNUP (NO OTP - Name, Phone, Email, Password)
  // ========================================================
  const handleEmailSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth) {
      toast({ variant: 'destructive', title: 'Initialization Error', description: 'Firebase Auth is loading.' });
      return;
    }

    if (!name.trim()) {
      toast({ variant: 'destructive', title: 'Name Required', description: 'Please enter your full name.' });
      return;
    }

    const cleanPhone = phone.trim().replace(/\D/g, '');
    if (cleanPhone.length < 10) {
      toast({ variant: 'destructive', title: 'Valid Phone Required', description: 'Please enter a valid 10-digit mobile number.' });
      return;
    }

    if (!email.trim() || !password || password.length < 6) {
      toast({ variant: 'destructive', title: 'Password Too Short', description: 'Password must be at least 6 characters long.' });
      return;
    }

    setLoading(true);
    try {
      const userCred = await createUserWithEmailAndPassword(auth, email.trim(), password);
      const user = userCred.user;

      // Update Profile Display Name
      await updateProfile(user, { displayName: name.trim() });

      const role = email.trim().toLowerCase() === ADMIN_EMAIL.toLowerCase() ? 'admin' : 'user';

      // Save to Firestore 'users' collection
      if (db) {
        await setDoc(doc(db, 'users', user.uid), {
          uid: user.uid,
          displayName: name.trim(),
          email: email.trim(),
          phoneNumber: `+91 ${cleanPhone.slice(-10)}`,
          role: role,
          createdAt: serverTimestamp()
        }, { merge: true });
      }

      toast({
        title: 'Welcome to GiftArtStudio! 🎉',
        description: `Account created successfully for ${name.trim()}.`
      });

      if (role === 'admin') {
        router.push('/admin/dashboard');
      } else {
        router.push('/');
      }
    } catch (err: any) {
      console.error("Signup error:", err);
      let msg = err.message || 'Failed to create account.';
      if (err.code === 'auth/email-already-in-use') {
        msg = 'An account already exists with this email. Please log in.';
      }
      toast({ variant: 'destructive', title: 'Signup Failed', description: msg });
    } finally {
      setLoading(false);
    }
  };

  // ========================================================
  // 2. MOBILE NUMBER OTP FLOW (OTP ONLY FOR MOBILE NUMBER)
  // ========================================================
  const handleSendMobileOtp = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanNumber = mobileNumber.trim().replace(/\D/g, '');
    if (cleanNumber.length < 10) {
      toast({
        variant: 'destructive',
        title: 'Invalid Mobile Number',
        description: 'Please enter a valid 10-digit mobile number.',
      });
      return;
    }
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setMode('otp');
      setTimer(45);
      setOtp(['', '', '', '', '', '']);
      toast({
        title: 'OTP Sent! 📩',
        description: `We've sent a 6-digit code to +91 ${cleanNumber.slice(-10)}.`,
      });
      setTimeout(() => {
        otpInputRefs.current[0]?.focus();
      }, 150);
    }, 600);
  };

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) {
      const digits = value.replace(/\D/g, '').slice(0, 6).split('');
      const newOtp = [...otp];
      digits.forEach((d, i) => {
        if (i < 6) newOtp[i] = d;
      });
      setOtp(newOtp);
      const nextIndex = Math.min(digits.length, 5);
      otpInputRefs.current[nextIndex]?.focus();
      return;
    }

    const newOtp = [...otp];
    newOtp[index] = value.replace(/\D/g, '');
    setOtp(newOtp);

    if (value && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerifyMobileOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const enteredCode = otp.join('');
    if (enteredCode.length < 6) {
      toast({
        variant: 'destructive',
        title: 'Incomplete Code',
        description: 'Please enter all 6 digits of your OTP.',
      });
      return;
    }

    setLoading(true);
    try {
      if (auth) {
        try {
          const userCred = await signInAnonymously(auth);
          if (db && userCred?.user) {
            await setDoc(doc(db, 'users', userCred.user.uid), {
              uid: userCred.user.uid,
              phoneNumber: `+91 ${mobileNumber.slice(-10)}`,
              role: 'user',
              createdAt: serverTimestamp()
            }, { merge: true });
          }
        } catch { }
      }

      toast({
        title: 'Welcome to the Family! 💜',
        description: 'Your mobile account is ready.',
      });
      router.push('/');
    } catch (err: any) {
      toast({
        variant: 'destructive',
        title: 'Verification Failed',
        description: err.message || 'Invalid verification code.',
      });
    } finally {
      setLoading(false);
    }
  };

  // ========================================================
  // 3. GOOGLE SIGNUP
  // ========================================================
  const handleGoogleSignup = async () => {
    if (!auth) return;
    setLoading(true);
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      if (db && user) {
        const role = user.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase() ? 'admin' : 'user';
        await setDoc(doc(db, 'users', user.uid), {
          uid: user.uid,
          displayName: user.displayName || 'Magical Gifter',
          email: user.email || '',
          photoURL: user.photoURL || '',
          role: role,
          createdAt: serverTimestamp()
        }, { merge: true });
      }

      toast({ title: 'Welcome to GiftArtStudio! 🦄', description: 'Account created with Google.' });
      router.push('/');
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Google Signup Failed', description: error.message });
    } finally {
      setLoading(false);
    }
  };

  // ========================================================
  // 4. CREATE WITH CODE
  // ========================================================
  const handleCreateWithCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteCode.trim()) {
      toast({ variant: 'destructive', title: 'Code Required', description: 'Please enter your invite code.' });
      return;
    }
    setLoading(true);
    setTimeout(async () => {
      try {
        if (auth) {
          try {
            const userCred = await signInAnonymously(auth);
            if (db && userCred?.user) {
              await setDoc(doc(db, 'users', userCred.user.uid), {
                uid: userCred.user.uid,
                referralCode: inviteCode.trim().toUpperCase(),
                role: 'user',
                createdAt: serverTimestamp()
              }, { merge: true });
            }
          } catch { }
        }
        toast({
          title: 'Code Activated! 🎁',
          description: `VIP account created with code ${inviteCode.toUpperCase()}!`,
        });
        router.push('/');
      } finally {
        setLoading(false);
      }
    }, 600);
  };

  const formattedTimer = `00:${timer.toString().padStart(2, '0')}`;
  const displayPhone = mobileNumber ? `+91 ${mobileNumber.slice(-10)}` : '+91 98765 43210';

  return (
    <div className="min-h-screen relative flex items-center justify-center p-3 sm:p-6 overflow-x-hidden bg-gradient-to-b from-[#dce4fc] via-[#e8dcfa] to-[#f6e6fb]">
      {/* Decorative Cloud & Star Background Overlays */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-10 left-10 w-72 h-72 bg-white/40 rounded-full blur-3xl" />
        <div className="absolute top-1/3 right-10 w-96 h-96 bg-purple-200/40 rounded-full blur-3xl" />
        <div className="absolute bottom-10 left-1/4 w-80 h-80 bg-sky-200/40 rounded-full blur-3xl" />
        <span className="absolute top-14 left-1/4 text-amber-300 text-lg">✨</span>
        <span className="absolute top-20 right-1/4 text-amber-300 text-sm">⭐</span>
        <span className="absolute bottom-28 left-16 text-pink-300 text-xl">✨</span>
        <span className="absolute top-1/2 right-10 text-amber-300 text-base">⭐</span>
      </div>

      {/* Main Glassmorphic Mobile Card */}
      <div className="relative w-full max-w-[390px] bg-gradient-to-b from-[#eaf4ff] via-white to-white rounded-[2.8rem] shadow-2xl shadow-indigo-200/60 border border-white/90 p-6 pt-7 pb-6 flex flex-col justify-between min-h-[660px] z-10 overflow-hidden transition-all duration-300">

        {/* ========================================================
            VIEW: EMAIL SIGNUP (DEFAULT - Name, Phone, Email, Password - NO OTP!)
           ======================================================== */}
        {mode === 'email' && (
          <div className="flex flex-col flex-1 justify-between relative">
            <div>
              {/* Header Navigation: Back + Logo */}
              <div className="flex items-center gap-3">
                <Link
                  href="/login"
                  className="w-9 h-9 rounded-full bg-white border border-slate-200/80 flex items-center justify-center text-slate-600 hover:bg-slate-50 shadow-sm active:scale-95 transition-all"
                >
                  <ArrowLeft className="w-4 h-4" />
                </Link>
                <div className="flex items-center gap-2.5 ml-1">
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#00b0f0] to-[#0070ba] flex items-center justify-center shadow-md shadow-sky-400/40 p-2">
                    <img src="/auth/gift_logo_icon.png" alt="Gift Logo" className="w-full h-full object-contain brightness-200" />
                  </div>
                  <div>
                    <h2 className="text-base font-black text-[#192a45] tracking-tight leading-tight">GiftArtStudio</h2>
                    <p className="text-[8px] font-extrabold text-[#3b4d66] tracking-[0.22em] uppercase">MAGICAL GIFTS</p>
                  </div>
                </div>
              </div>

              {/* Title & Subtitle */}
              <div className="mt-5">
                <h1 className="text-[24px] font-black text-[#1b263b] tracking-tight leading-tight">
                  Create Account
                </h1>
                <p className="text-xs font-semibold text-slate-500 mt-0.5">
                  Join and make gifting more special 💜
                </p>
              </div>

              {/* Mode Switcher Tabs */}
              <div className="flex items-center gap-1.5 p-1 bg-slate-100/80 rounded-2xl mt-4">
                <button
                  type="button"
                  onClick={() => setMode('email')}
                  className="flex-1 py-1.5 text-[11px] font-black rounded-xl bg-white text-purple-700 shadow-sm transition-all"
                >
                  Email &amp; Password
                </button>
                <button
                  type="button"
                  onClick={() => setMode('mobile')}
                  className="flex-1 py-1.5 text-[11px] font-bold text-slate-500 hover:text-slate-800 transition-all"
                >
                  Mobile OTP
                </button>
              </div>

              {/* Continue with Google */}
              <button
                type="button"
                onClick={handleGoogleSignup}
                disabled={loading}
                className="w-full h-[44px] mt-3.5 rounded-2xl bg-white border border-slate-200 hover:bg-slate-50 flex items-center justify-center gap-3 text-xs font-bold text-slate-700 shadow-sm transition-all active:scale-[0.98]"
              >
                <img
                  src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
                  alt="Google"
                  className="w-4 h-4"
                />
                <span>Continue with Google</span>
              </button>

              {/* Divider */}
              <div className="relative my-3 flex items-center justify-center">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-200/70" /></div>
                <span className="relative bg-white px-2.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">or with credentials</span>
              </div>

              {/* Form: Name, Phone, Email, Password (Direct, NO OTP) */}
              <form onSubmit={handleEmailSignup} className="space-y-2.5">
                {/* 1. Full Name */}
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Full Name"
                    className="w-full h-[44px] pl-10 pr-3 rounded-2xl bg-white border border-slate-200/90 focus:outline-none focus:ring-2 focus:ring-[#0084d6] text-xs font-bold text-slate-800 placeholder:text-slate-400 shadow-sm"
                  />
                </div>

                {/* 2. Mobile Phone */}
                <div className="relative">
                  <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="tel"
                    required
                    maxLength={10}
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Mobile Number (10 digits)"
                    className="w-full h-[44px] pl-10 pr-3 rounded-2xl bg-white border border-slate-200/90 focus:outline-none focus:ring-2 focus:ring-[#0084d6] text-xs font-bold text-slate-800 placeholder:text-slate-400 shadow-sm"
                  />
                </div>

                {/* 3. Email */}
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Email Address"
                    className="w-full h-[44px] pl-10 pr-3 rounded-2xl bg-white border border-slate-200/90 focus:outline-none focus:ring-2 focus:ring-[#0084d6] text-xs font-bold text-slate-800 placeholder:text-slate-400 shadow-sm"
                  />
                </div>

                {/* 4. Password */}
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Password (min 6 chars)"
                    className="w-full h-[44px] pl-10 pr-3 rounded-2xl bg-white border border-slate-200/90 focus:outline-none focus:ring-2 focus:ring-[#0084d6] text-xs font-bold text-slate-800 placeholder:text-slate-400 shadow-sm"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full h-[46px] mt-1 rounded-2xl bg-[#0084d6] hover:bg-[#0074be] active:scale-[0.98] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-sky-500/25 transition-all"
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <span>Create Account</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>

              {/* Invite Code Option */}
              <div className="mt-2 text-center">
                <button
                  type="button"
                  onClick={() => setMode('code')}
                  className="text-[11px] font-bold text-purple-600 hover:underline"
                >
                  Have an invite code? Create with Code
                </button>
              </div>

              {/* Already have an account? Login */}
              <p className="text-[11px] text-slate-500 font-semibold text-center mt-2">
                Already have an account?{' '}
                <Link href="/login" className="text-[#6366f1] font-bold hover:underline">
                  Login
                </Link>
              </p>
            </div>

            {/* Bottom 3D Artwork: Magical Unicorn in Clouds with Gifts */}
            <div className="mt-2 -mx-6 -mb-6 flex justify-center pointer-events-none select-none">
              <img
                src="/auth/unicorn_gifts.png"
                alt="Magical Unicorn with Gifts in Clouds"
                className="w-[210px] h-auto object-contain drop-shadow-md"
              />
            </div>
          </div>
        )}

        {/* ========================================================
            VIEW: MOBILE NUMBER SIGNUP (OTP ONLY FOR MOBILE NUMBER)
           ======================================================== */}
        {mode === 'mobile' && (
          <div className="flex flex-col flex-1 justify-between relative">
            <div>
              {/* Header Navigation: Back + Logo */}
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setMode('email')}
                  className="w-9 h-9 rounded-full bg-white border border-slate-200/80 flex items-center justify-center text-slate-600 hover:bg-slate-50 shadow-sm active:scale-95 transition-all"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <div className="flex items-center gap-2.5 ml-1">
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#00b0f0] to-[#0070ba] flex items-center justify-center shadow-md shadow-sky-400/40 p-2">
                    <img src="/auth/gift_logo_icon.png" alt="Gift Logo" className="w-full h-full object-contain brightness-200" />
                  </div>
                  <div>
                    <h2 className="text-base font-black text-[#192a45] tracking-tight leading-tight">GiftArtStudio</h2>
                    <p className="text-[8px] font-extrabold text-[#3b4d66] tracking-[0.22em] uppercase">MAGICAL GIFTS</p>
                  </div>
                </div>
              </div>

              {/* Title & Subtitle */}
              <div className="mt-6">
                <h1 className="text-[24px] font-black text-[#1b263b] tracking-tight leading-tight">
                  Mobile Sign Up
                </h1>
                <p className="text-xs font-semibold text-slate-500 mt-0.5">
                  We'll send a 6-digit OTP to verify your number
                </p>
              </div>

              {/* Mode Switcher Tabs */}
              <div className="flex items-center gap-1.5 p-1 bg-slate-100/80 rounded-2xl mt-4">
                <button
                  type="button"
                  onClick={() => setMode('email')}
                  className="flex-1 py-1.5 text-[11px] font-bold text-slate-500 hover:text-slate-800 transition-all"
                >
                  Email &amp; Password
                </button>
                <button
                  type="button"
                  onClick={() => setMode('mobile')}
                  className="flex-1 py-1.5 text-[11px] font-black rounded-xl bg-white text-purple-700 shadow-sm transition-all"
                >
                  Mobile OTP
                </button>
              </div>

              {/* Mobile Input Form */}
              <form onSubmit={handleSendMobileOtp} className="space-y-3 mt-6">
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                    <Smartphone className="w-4 h-4 text-slate-400" />
                  </div>
                  <input
                    type="tel"
                    required
                    value={mobileNumber}
                    onChange={(e) => setMobileNumber(e.target.value)}
                    placeholder="Enter 10-digit mobile number"
                    maxLength={10}
                    className="w-full h-[48px] pl-11 pr-4 rounded-2xl bg-white border border-slate-200/90 focus:outline-none focus:ring-2 focus:ring-[#0084d6] text-xs font-bold text-slate-800 placeholder:text-slate-400 shadow-sm"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full h-[48px] rounded-2xl bg-[#0084d6] hover:bg-[#0074be] active:scale-[0.98] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-sky-500/25 transition-all"
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <span>Send OTP</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>

              {/* Already have an account? Login */}
              <p className="text-[11px] text-slate-500 font-semibold text-center mt-4">
                Already have an account?{' '}
                <Link href="/login" className="text-[#6366f1] font-bold hover:underline">
                  Login
                </Link>
              </p>
            </div>

            {/* Bottom 3D Artwork: Cute Unicorn */}
            <div className="mt-4 -mx-6 -mb-6 flex justify-center pointer-events-none select-none">
              <img
                src="/auth/unicorn_gifts.png"
                alt="Unicorn in Clouds"
                className="w-[210px] h-auto object-contain drop-shadow-md"
              />
            </div>
          </div>
        )}

        {/* ========================================================
            VIEW: OTP VERIFICATION (SCREEN 2)
           ======================================================== */}
        {mode === 'otp' && (
          <div className="flex flex-col flex-1 justify-between relative">
            <div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setMode('mobile')}
                  className="w-9 h-9 rounded-full bg-white border border-slate-200/80 flex items-center justify-center text-slate-600 hover:bg-slate-50 shadow-sm active:scale-95 transition-all"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <div className="flex items-center gap-2.5 ml-1">
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#00b0f0] to-[#0070ba] flex items-center justify-center shadow-md shadow-sky-400/40 p-2">
                    <img src="/auth/gift_logo_icon.png" alt="Gift Logo" className="w-full h-full object-contain brightness-200" />
                  </div>
                  <div>
                    <h2 className="text-base font-black text-[#192a45] tracking-tight leading-tight">GiftArtStudio</h2>
                    <p className="text-[8px] font-extrabold text-[#3b4d66] tracking-[0.22em] uppercase">MAGICAL GIFTS</p>
                  </div>
                </div>
              </div>

              <div className="mt-6 text-center">
                <h1 className="text-[24px] font-black text-[#1b263b] tracking-tight leading-tight">
                  Verify Your Number
                </h1>
                <p className="text-[11px] font-semibold text-slate-400 mt-1">
                  We've sent a 6-digit code to
                </p>
                <div className="inline-flex items-center gap-1.5 mt-1 font-extrabold text-xs text-slate-700 bg-white/70 px-3 py-1 rounded-full border border-slate-200/60 shadow-sm">
                  <span>{displayPhone}</span>
                  <button
                    type="button"
                    onClick={() => setMode('mobile')}
                    className="text-sky-600 hover:text-sky-700"
                  >
                    <Edit2 className="w-3 h-3" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-6 gap-2 my-5 px-1">
                {otp.map((digit, idx) => (
                  <input
                    key={idx}
                    ref={(el) => { otpInputRefs.current[idx] = el; }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(idx, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                    className="w-full h-12 rounded-xl bg-white border-2 border-slate-200/90 text-center text-lg font-black text-slate-800 focus:outline-none focus:border-[#0084d6] focus:ring-2 focus:ring-sky-200 shadow-sm transition-all"
                  />
                ))}
              </div>

              <div className="text-center">
                {timer > 0 ? (
                  <p className="text-[11px] font-bold text-slate-400">
                    Resend OTP in <span className="text-[#0084d6] font-black">{formattedTimer}</span>
                  </p>
                ) : (
                  <button
                    type="button"
                    onClick={handleSendMobileOtp}
                    className="text-[11px] font-black text-[#0084d6] hover:underline"
                  >
                    Resend OTP now
                  </button>
                )}
              </div>

              <button
                type="button"
                onClick={handleVerifyMobileOtp}
                disabled={loading}
                className="w-full h-[48px] mt-4 rounded-2xl bg-[#0084d6] hover:bg-[#0074be] active:scale-[0.98] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-sky-500/25 transition-all"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <span>Verify &amp; Join</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>

            <div className="mt-3 -mx-6 -mb-6 flex justify-center pointer-events-none select-none">
              <img
                src="/auth/astronaut_rocket.png"
                alt="Astronaut Riding Rocket"
                className="w-[180px] h-auto object-contain drop-shadow-md"
              />
            </div>
          </div>
        )}

        {/* ========================================================
            VIEW: CREATE WITH CODE (SCREEN 4)
           ======================================================== */}
        {mode === 'code' && (
          <div className="flex flex-col flex-1 justify-between relative">
            <div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setMode('email')}
                  className="w-9 h-9 rounded-full bg-white border border-slate-200/80 flex items-center justify-center text-slate-600 hover:bg-slate-50 shadow-sm active:scale-95 transition-all"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <div className="flex items-center gap-2.5 ml-1">
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#00b0f0] to-[#0070ba] flex items-center justify-center shadow-md shadow-sky-400/40 p-2">
                    <img src="/auth/gift_logo_icon.png" alt="Gift Logo" className="w-full h-full object-contain brightness-200" />
                  </div>
                  <div>
                    <h2 className="text-base font-black text-[#192a45] tracking-tight leading-tight">GiftArtStudio</h2>
                    <p className="text-[8px] font-extrabold text-[#3b4d66] tracking-[0.22em] uppercase">MAGICAL GIFTS</p>
                  </div>
                </div>
              </div>

              <div className="mt-7">
                <h1 className="text-[26px] font-black text-[#1b263b] tracking-tight leading-tight">
                  Create with Code
                </h1>
                <p className="text-xs font-semibold text-slate-500 mt-1">
                  Have a code? Use it to create your account instantly!
                </p>
              </div>

              <form onSubmit={handleCreateWithCode} className="space-y-4 mt-6">
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                    <Code className="w-4 h-4 text-slate-400" />
                  </div>
                  <input
                    type="text"
                    value={inviteCode}
                    onChange={(e) => setInviteCode(e.target.value)}
                    placeholder="Enter your code"
                    className="w-full h-[48px] pl-11 pr-4 rounded-2xl bg-white border border-slate-200/90 focus:outline-none focus:ring-2 focus:ring-[#0084d6] text-xs font-bold text-slate-800 placeholder:text-slate-400 shadow-sm uppercase tracking-wider"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full h-[48px] rounded-2xl bg-[#0084d6] hover:bg-[#0074be] active:scale-[0.98] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-sky-500/25 transition-all"
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <span>Create Account</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>

              <div className="relative my-4 flex items-center justify-center">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-200/70" /></div>
                <span className="relative bg-white px-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider">or</span>
              </div>

              <button
                type="button"
                onClick={() => setMode('email')}
                className="w-full p-3 rounded-2xl bg-white border border-slate-200/90 hover:bg-slate-50 flex items-center gap-3.5 shadow-sm text-left active:scale-[0.98] transition-all"
              >
                <div className="w-10 h-10 rounded-xl bg-slate-100/80 flex items-center justify-center text-slate-700 flex-shrink-0">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-800">Continue with Email</div>
                  <div className="text-[10px] font-semibold text-slate-400">Quick sign up without code</div>
                </div>
              </button>
            </div>

            <div className="mt-3 -mx-6 -mb-6 flex justify-center pointer-events-none select-none">
              <img
                src="/auth/giftbox_heart.png"
                alt="3D Gift with Heart"
                className="w-[210px] h-auto object-contain drop-shadow-md"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function SignupPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-[#dce4fc] via-[#e8dcfa] to-[#f6e6fb]">
        <div className="w-10 h-10 rounded-2xl bg-white/80 shadow-lg flex items-center justify-center">
          <Loader2 className="w-5 h-5 text-sky-500 animate-spin" />
        </div>
      </div>
    }>
      <SignupContent />
    </Suspense>
  );
}
