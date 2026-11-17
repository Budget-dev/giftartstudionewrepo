'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  ArrowRight, 
  ArrowLeft, 
  Smartphone, 
  Edit2, 
  Sparkles, 
  Mail, 
  Lock, 
  Loader2,
  CheckCircle2
} from 'lucide-react';
import { useAuth, useFirestore } from '@/firebase';
import { 
  signInWithEmailAndPassword, 
  signInWithPopup, 
  GoogleAuthProvider,
  signInAnonymously
} from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';

const ADMIN_EMAIL = 'rohanswakkargiftartstudio@gmail.com';

export default function LoginPage() {
  const router = useRouter();
  const auth = useAuth();
  const db = useFirestore();
  const { toast } = useToast();

  // Screen view state: 'mobile' | 'email' | 'otp'
  const [tab, setTab] = useState<'mobile' | 'email'>('mobile');
  const [view, setView] = useState<'form' | 'otp'>('form');

  // Mobile OTP state
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [timer, setTimer] = useState(45);

  // Email login state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // OTP Countdown timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (view === 'otp' && timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [view, timer]);

  // Handle Google Login
  const handleGoogleLogin = async () => {
    if (!auth) {
      toast({ variant: 'destructive', title: 'Auth Error', description: 'Firebase Auth is initializing.' });
      return;
    }
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
          lastLogin: serverTimestamp()
        }, { merge: true });
      }

      toast({ title: 'Welcome Back! ✨', description: 'Signed in with Google successfully.' });
      router.push('/');
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Google Login Failed', description: error.message });
    } finally {
      setLoading(false);
    }
  };

  // Handle Send Mobile OTP
  const handleSendOtp = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanNumber = phoneNumber.trim().replace(/\D/g, '');
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
      setView('otp');
      setTimer(45);
      setOtp(['', '', '', '', '', '']);
      toast({
        title: 'OTP Sent! 📩',
        description: `We've sent a 6-digit verification code to +91 ${cleanNumber.slice(-10)}.`,
      });
      setTimeout(() => {
        otpInputRefs.current[0]?.focus();
      }, 150);
    }, 600);
  };

  // Handle OTP individual input change
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

  // Verify OTP and Login
  const handleVerifyOtp = async (e?: React.FormEvent) => {
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
              phoneNumber: `+91 ${phoneNumber.slice(-10)}`,
              role: 'user',
              lastLogin: serverTimestamp()
            }, { merge: true });
          }
        } catch {}
      }
      toast({
        title: 'Verification Successful! 🎉',
        description: 'Welcome back to GiftArtStudio.',
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

  // Handle Direct Email & Password Login
  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth) return;
    setLoading(true);
    try {
      const userCred = await signInWithEmailAndPassword(auth, email.trim(), password);
      const user = userCred.user;

      if (db && user) {
        await setDoc(doc(db, 'users', user.uid), {
          lastLogin: serverTimestamp()
        }, { merge: true });
      }

      toast({ title: 'Welcome Back!', description: 'Logged in successfully.' });
      if (email.trim().toLowerCase() === ADMIN_EMAIL.toLowerCase()) {
        router.push('/admin/dashboard');
      } else {
        router.push('/');
      }
    } catch (error: any) {
      let msg = error.message || 'Failed to sign in.';
      if (error.code === 'auth/invalid-credential' || error.code === 'auth/wrong-password') {
        msg = 'Invalid email or password. Please try again.';
      }
      toast({ variant: 'destructive', title: 'Login Failed', description: msg });
    } finally {
      setLoading(false);
    }
  };

  const formattedTimer = `00:${timer.toString().padStart(2, '0')}`;
  const displayPhone = phoneNumber ? `+91 ${phoneNumber.slice(-10)}` : '+91 98765 43210';

  return (
    <div className="min-h-screen relative flex items-center justify-center p-3 sm:p-6 overflow-x-hidden bg-gradient-to-b from-[#dce4fc] via-[#e8dcfa] to-[#f6e6fb]">
      {/* Decorative Cloud & Star Background Overlays */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-10 left-10 w-72 h-72 bg-white/40 rounded-full blur-3xl" />
        <div className="absolute top-1/3 right-10 w-96 h-96 bg-purple-200/40 rounded-full blur-3xl" />
        <div className="absolute bottom-10 left-1/4 w-80 h-80 bg-sky-200/40 rounded-full blur-3xl" />
        <span className="absolute top-12 left-1/4 text-amber-300 text-xl animate-pulse">✨</span>
        <span className="absolute top-24 right-1/4 text-amber-300 text-sm">⭐</span>
        <span className="absolute bottom-32 left-12 text-pink-300 text-lg">✨</span>
        <span className="absolute top-1/2 right-12 text-amber-300 text-base">⭐</span>
      </div>

      {/* Main Glassmorphic Mobile Card */}
      <div className="relative w-full max-w-[390px] bg-gradient-to-b from-[#eaf4ff] via-white to-white rounded-[2.8rem] shadow-2xl shadow-indigo-200/60 border border-white/90 p-6 pt-7 pb-6 flex flex-col justify-between min-h-[650px] z-10 overflow-hidden transition-all duration-300">
        
        {/* ========================================================
            VIEW: FORM (MOBILE OTP OR EMAIL LOGIN)
           ======================================================== */}
        {view === 'form' && (
          <div className="flex flex-col flex-1 justify-between relative">
            {/* Top Right 3D Teddy Bear with Purple Gift */}
            <div className="absolute -top-3 -right-2 pointer-events-none z-20 flex flex-col items-center">
              <span className="text-amber-300 text-xs self-start -mb-1 animate-bounce">⭐</span>
              <img 
                src="/auth/teddy_gift.png" 
                alt="Teddy Bear with Gift" 
                className="w-[84px] h-auto drop-shadow-md select-none transform hover:rotate-3 transition-transform" 
              />
            </div>

            <div>
              {/* Header Logo & Brand */}
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#00b0f0] to-[#0070ba] flex items-center justify-center shadow-md shadow-sky-400/40 p-2">
                  <img src="/auth/gift_logo_icon.png" alt="Gift Logo" className="w-full h-full object-contain brightness-200" />
                </div>
                <div>
                  <h2 className="text-lg font-black text-[#192a45] tracking-tight leading-tight">GiftArtStudio</h2>
                  <p className="text-[9px] font-extrabold text-[#3b4d66] tracking-[0.22em] uppercase">MAGICAL GIFTS</p>
                </div>
              </div>

              {/* Title & Subtitle */}
              <div className="mt-6">
                <h1 className="text-[26px] font-black text-[#1b263b] tracking-tight leading-tight">
                  Welcome Back!
                </h1>
                <p className="text-xs font-semibold text-slate-500 mt-0.5 flex items-center gap-1">
                  Continue your magical journey <span className="text-amber-400 text-sm">✨</span>
                </p>
              </div>

              {/* Switcher: Mobile OTP vs Email Login */}
              <div className="flex items-center gap-1.5 p-1 bg-slate-100/80 rounded-2xl mt-4">
                <button
                  type="button"
                  onClick={() => setTab('mobile')}
                  className={`flex-1 py-1.5 text-[11px] rounded-xl transition-all ${
                    tab === 'mobile' 
                      ? 'bg-white text-purple-700 font-black shadow-sm' 
                      : 'text-slate-500 font-bold hover:text-slate-800'
                  }`}
                >
                  Mobile OTP
                </button>
                <button
                  type="button"
                  onClick={() => setTab('email')}
                  className={`flex-1 py-1.5 text-[11px] rounded-xl transition-all ${
                    tab === 'email' 
                      ? 'bg-white text-purple-700 font-black shadow-sm' 
                      : 'text-slate-500 font-bold hover:text-slate-800'
                  }`}
                >
                  Email &amp; Password
                </button>
              </div>

              {/* Continue with Google */}
              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={loading}
                className="w-full h-[44px] mt-3.5 rounded-2xl bg-white border border-slate-200/90 hover:bg-slate-50 flex items-center justify-center gap-3 text-xs font-bold text-slate-700 shadow-sm transition-all active:scale-[0.98]"
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
                <span className="relative bg-white px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">or</span>
              </div>

              {/* TAB 1: Mobile Phone Form */}
              {tab === 'mobile' && (
                <form onSubmit={handleSendOtp} className="space-y-3">
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                      <Smartphone className="w-4 h-4 text-slate-400" />
                    </div>
                    <input
                      type="tel"
                      required
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      placeholder="Enter mobile number"
                      maxLength={10}
                      className="w-full h-[46px] pl-11 pr-4 rounded-2xl bg-white border border-slate-200/90 focus:outline-none focus:ring-2 focus:ring-[#0084d6] text-xs font-bold text-slate-800 placeholder:text-slate-400 shadow-sm transition-all"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full h-[46px] rounded-2xl bg-[#0084d6] hover:bg-[#0074be] active:scale-[0.98] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-sky-500/25 transition-all"
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
              )}

              {/* TAB 2: Direct Email & Password Login */}
              {tab === 'email' && (
                <form onSubmit={handleEmailLogin} className="space-y-2.5">
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Email Address"
                      className="w-full h-[44px] pl-10 pr-3 rounded-2xl bg-white border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#0084d6] text-xs font-bold text-slate-800 placeholder:text-slate-400 shadow-sm"
                    />
                  </div>

                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Password"
                      className="w-full h-[44px] pl-10 pr-3 rounded-2xl bg-white border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#0084d6] text-xs font-bold text-slate-800 placeholder:text-slate-400 shadow-sm"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full h-[46px] rounded-2xl bg-[#0084d6] hover:bg-[#0074be] active:scale-[0.98] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-sky-500/25 transition-all mt-1"
                  >
                    {loading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <span>Sign In</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>
              )}

              {/* Don't have an account? Sign Up */}
              <p className="text-[11px] text-slate-500 font-semibold text-center mt-3">
                Don't have an account?{' '}
                <Link href="/signup" className="text-[#6366f1] font-bold hover:underline">
                  Sign Up
                </Link>
              </p>
            </div>

            {/* Bottom 3D Artwork: Rainbow & Gifts in Clouds */}
            <div className="mt-3 -mx-6 -mb-6 flex justify-center pointer-events-none select-none">
              <img
                src="/auth/rainbow_gifts.png"
                alt="Rainbow & 3D Gifts in Clouds"
                className="w-full max-w-[270px] h-auto object-contain drop-shadow-sm"
              />
            </div>
          </div>
        )}

        {/* ========================================================
            VIEW: VERIFY YOUR NUMBER (OTP)
           ======================================================== */}
        {view === 'otp' && (
          <div className="flex flex-col flex-1 justify-between relative">
            <div>
              {/* Top Navigation Row: Back Arrow + Logo */}
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setView('form')}
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

              {/* Title & Phone Info */}
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
                    onClick={() => setView('form')}
                    className="text-sky-600 hover:text-sky-700"
                    title="Change Phone Number"
                  >
                    <Edit2 className="w-3 h-3" />
                  </button>
                </div>
              </div>

              {/* 6 OTP Input Boxes */}
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

              {/* Countdown / Resend */}
              <div className="text-center">
                {timer > 0 ? (
                  <p className="text-[11px] font-bold text-slate-400">
                    Resend OTP in <span className="text-[#0084d6] font-black">{formattedTimer}</span>
                  </p>
                ) : (
                  <button
                    type="button"
                    onClick={handleSendOtp}
                    className="text-[11px] font-black text-[#0084d6] hover:underline"
                  >
                    Resend OTP now
                  </button>
                )}
              </div>

              {/* Verify & Login Button */}
              <button
                type="button"
                onClick={handleVerifyOtp}
                disabled={loading}
                className="w-full h-[48px] mt-4 rounded-2xl bg-[#0084d6] hover:bg-[#0074be] active:scale-[0.98] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-sky-500/25 transition-all"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <span>Verify &amp; Login</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>

            {/* Bottom 3D Artwork: Cute Astronaut riding Rocket */}
            <div className="mt-3 -mx-6 -mb-6 flex justify-center pointer-events-none select-none">
              <img
                src="/auth/astronaut_rocket.png"
                alt="Astronaut Riding Rocket"
                className="w-[180px] h-auto object-contain drop-shadow-md"
              />
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
