'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Mail, 
  Lock, 
  Smartphone, 
  ArrowRight, 
  Loader2, 
  CheckCircle2, 
  Gift, 
  Edit3,
  ShieldCheck,
  Eye,
  EyeOff
} from 'lucide-react';
import { useAuth, useFirestore } from '@/firebase';
import { 
  signInWithEmailAndPassword, 
  signInWithPopup, 
  GoogleAuthProvider,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  ConfirmationResult,
  sendPasswordResetEmail
} from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const ADMIN_EMAIL = 'rohanswakkargiftartstudio@gmail.com';

declare global {
  interface Window {
    recaptchaVerifier?: RecaptchaVerifier;
    confirmationResult?: ConfirmationResult;
  }
}

export default function LoginPage() {
  const router = useRouter();
  const auth = useAuth();
  const db = useFirestore();
  const { toast } = useToast();

  // Mode: 'mobile' (Phone OTP) | 'email' (Email & Password)
  const [tab, setTab] = useState<'mobile' | 'email'>('mobile');
  const [otpView, setOtpView] = useState<'phone' | 'verify'>('phone');

  // Phone states
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [timer, setTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);

  // Email states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Loading & general states
  const [loading, setLoading] = useState(false);
  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Countdown timer for OTP resend
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (otpView === 'verify' && timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => {
          if (prev <= 1) {
            setCanResend(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [otpView, timer]);

  // Clean up recaptcha verifier on unmount
  useEffect(() => {
    return () => {
      if (window.recaptchaVerifier) {
        try {
          window.recaptchaVerifier.clear();
          window.recaptchaVerifier = undefined;
        } catch (e) {}
      }
    };
  }, []);

  // Initialize Recaptcha Verifier
  const getOrCreateRecaptcha = () => {
    if (!auth) return null;
    if (window.recaptchaVerifier) {
      try {
        window.recaptchaVerifier.clear();
      } catch (e) {}
    }
    window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
      size: 'invisible',
      callback: () => {
        // Recaptcha resolved
      },
      'expired-callback': () => {
        toast({
          variant: 'destructive',
          title: 'Verification Expired',
          description: 'Please request the OTP again.'
        });
      }
    });
    return window.recaptchaVerifier;
  };

  // Google Sign-In
  const handleGoogleLogin = async () => {
    if (!auth) {
      toast({ variant: 'destructive', title: 'Initialization', description: 'Firebase Auth is loading.' });
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
          displayName: user.displayName || 'Customer',
          email: user.email || '',
          photoURL: user.photoURL || '',
          role: role,
          lastLogin: serverTimestamp()
        }, { merge: true });
      }

      toast({ title: 'Welcome Back! ✨', description: 'Signed in successfully.' });
      const role = user.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase() ? 'admin' : 'user';
      router.push(role === 'admin' ? '/admin/dashboard' : '/');
    } catch (error: any) {
      console.error('Google login error:', error);
      if (error.code !== 'auth/popup-closed-by-user') {
        toast({ variant: 'destructive', title: 'Google Login Failed', description: error.message });
      }
    } finally {
      setLoading(false);
    }
  };

  // Send Mobile OTP via Firebase
  const handleSendOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!auth) {
      toast({ variant: 'destructive', title: 'Error', description: 'Firebase is initializing. Please wait.' });
      return;
    }

    const clean = phoneNumber.trim().replace(/\D/g, '');
    if (clean.length < 10) {
      toast({
        variant: 'destructive',
        title: 'Invalid Mobile Number',
        description: 'Please enter a valid 10-digit mobile number.'
      });
      return;
    }

    const formatted = `+91${clean.slice(-10)}`;
    setLoading(true);

    try {
      const appVerifier = getOrCreateRecaptcha();
      if (!appVerifier) throw new Error('Could not setup security verification.');

      const confirmation = await signInWithPhoneNumber(auth, formatted, appVerifier);
      window.confirmationResult = confirmation;
      setConfirmationResult(confirmation);
      setOtpView('verify');
      setTimer(60);
      setCanResend(false);
      setOtp(['', '', '', '', '', '']);

      toast({
        title: 'OTP Sent! 📩',
        description: `6-digit verification code sent to ${formatted}.`
      });

      setTimeout(() => {
        otpInputRefs.current[0]?.focus();
      }, 200);
    } catch (err: any) {
      console.error('Phone auth error:', err);
      let msg = err.message || 'Could not send verification code.';
      if (err.code === 'auth/invalid-phone-number') {
        msg = 'The phone number format is invalid.';
      } else if (err.code === 'auth/too-many-requests') {
        msg = 'Too many attempts. Please try again after a few minutes.';
      } else if (err.code === 'auth/billing-not-enabled' || err.code === 'auth/quota-exceeded') {
        msg = 'SMS service quota reached. Please use Email or Google login.';
      }
      toast({
        variant: 'destructive',
        title: 'SMS Delivery Issue',
        description: msg
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle OTP Inputs
  const handleOtpChange = (index: number, val: string) => {
    if (val.length > 1) {
      const digits = val.replace(/\D/g, '').slice(0, 6).split('');
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
    newOtp[index] = val.replace(/\D/g, '');
    setOtp(newOtp);

    if (val && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  // Verify OTP
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const entered = otp.join('').trim();
    if (entered.length < 6) {
      toast({
        variant: 'destructive',
        title: 'Incomplete OTP',
        description: 'Please enter all 6 digits of the verification code.'
      });
      return;
    }

    const verifier = confirmationResult || window.confirmationResult;
    if (!verifier) {
      toast({
        variant: 'destructive',
        title: 'Session Expired',
        description: 'Verification session expired. Please request a new OTP.'
      });
      setOtpView('phone');
      return;
    }

    setLoading(true);
    try {
      const cred = await verifier.confirm(entered);
      const user = cred.user;

      if (db && user) {
        const role = user.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase() ? 'admin' : 'user';
        await setDoc(doc(db, 'users', user.uid), {
          uid: user.uid,
          phoneNumber: user.phoneNumber || `+91${phoneNumber.slice(-10)}`,
          role: role,
          lastLogin: serverTimestamp()
        }, { merge: true });
      }

      toast({
        title: 'Welcome Back! 🎉',
        description: 'Successfully verified mobile number.'
      });

      router.push('/');
    } catch (err: any) {
      console.error('OTP verify error:', err);
      let msg = err.message || 'Verification failed.';
      if (err.code === 'auth/invalid-verification-code') {
        msg = 'Incorrect 6-digit OTP. Please recheck the code from your SMS.';
      } else if (err.code === 'auth/code-expired') {
        msg = 'This code has expired. Please click Resend OTP.';
      }
      toast({
        variant: 'destructive',
        title: 'Verification Failed',
        description: msg
      });
    } finally {
      setLoading(false);
    }
  };

  // Email & Password Sign In
  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth) return;

    if (!email.trim() || !password) {
      toast({
        variant: 'destructive',
        title: 'Missing Fields',
        description: 'Please enter both your email and password.'
      });
      return;
    }

    setLoading(true);
    try {
      const userCred = await signInWithEmailAndPassword(auth, email.trim(), password);
      const user = userCred.user;

      const role = email.trim().toLowerCase() === ADMIN_EMAIL.toLowerCase() ? 'admin' : 'user';

      if (db && user) {
        await setDoc(doc(db, 'users', user.uid), {
          uid: user.uid,
          email: user.email || email.trim(),
          role: role,
          lastLogin: serverTimestamp()
        }, { merge: true });
      }

      toast({
        title: 'Login Successful! ✨',
        description: `Welcome back, ${user.displayName || user.email}!`
      });

      router.push(role === 'admin' ? '/admin/dashboard' : '/');
    } catch (err: any) {
      console.error('Email login error:', err);
      let msg = err.message || 'Failed to sign in.';
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        msg = 'Invalid email or password. Please try again or reset your password.';
      }
      toast({
        variant: 'destructive',
        title: 'Sign In Failed',
        description: msg
      });
    } finally {
      setLoading(false);
    }
  };

  // Forgot password
  const handleForgotPassword = async () => {
    if (!email.trim()) {
      toast({
        variant: 'destructive',
        title: 'Email Required',
        description: 'Please type your email address above to receive a reset link.'
      });
      return;
    }
    if (!auth) return;
    try {
      await sendPasswordResetEmail(auth, email.trim());
      toast({
        title: 'Reset Link Sent 📬',
        description: `Check your inbox at ${email.trim()} for password reset instructions.`
      });
    } catch (err: any) {
      toast({
        variant: 'destructive',
        title: 'Password Reset Error',
        description: err.message || 'Could not send reset link.'
      });
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      {/* Invisible Recaptcha container */}
      <div id="recaptcha-container"></div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {/* Brand Header */}
        <div className="text-center mb-6">
          <Link href="/" className="inline-flex items-center gap-2 group mb-2">
            <div className="w-12 h-12 rounded-xl bg-purple-600 text-white flex items-center justify-center shadow-md shadow-purple-200 dark:shadow-none group-hover:scale-105 transition-transform">
              <Gift className="w-6 h-6" />
            </div>
          </Link>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Welcome to GiftArtStudio
          </h2>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Sign in to access your orders, saved gifts, and rewards
          </p>
        </div>

        {/* Main Card */}
        <div className="bg-white dark:bg-slate-900 py-8 px-6 shadow-xl shadow-slate-200/50 dark:shadow-none sm:rounded-2xl border border-slate-200 dark:border-slate-800">
          {/* Quick Google Sign In */}
          <Button
            type="button"
            variant="outline"
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 h-11 border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 font-medium text-slate-700 dark:text-slate-200 mb-5"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            Continue with Google
          </Button>

          {/* Divider */}
          <div className="relative mb-5">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200 dark:border-slate-800" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white dark:bg-slate-900 px-3 text-slate-500 font-medium">
                Or sign in with
              </span>
            </div>
          </div>

          {/* Method Tabs */}
          <div className="grid grid-cols-2 gap-1 p-1 bg-slate-100 dark:bg-slate-800/60 rounded-xl mb-6">
            <button
              type="button"
              onClick={() => { setTab('mobile'); setOtpView('phone'); }}
              className={`py-2 text-xs sm:text-sm font-semibold rounded-lg flex items-center justify-center gap-2 transition-all ${
                tab === 'mobile'
                  ? 'bg-white dark:bg-slate-700 text-purple-700 dark:text-purple-300 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <Smartphone className="w-4 h-4" />
              Mobile OTP
            </button>
            <button
              type="button"
              onClick={() => setTab('email')}
              className={`py-2 text-xs sm:text-sm font-semibold rounded-lg flex items-center justify-center gap-2 transition-all ${
                tab === 'email'
                  ? 'bg-white dark:bg-slate-700 text-purple-700 dark:text-purple-300 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <Mail className="w-4 h-4" />
              Email & Password
            </button>
          </div>

          {/* TAB 1: MOBILE OTP FLOW */}
          {tab === 'mobile' && (
            <div>
              {otpView === 'phone' ? (
                <form onSubmit={handleSendOtp} className="space-y-4">
                  <div>
                    <Label htmlFor="phone" className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 block">
                      Mobile Number
                    </Label>
                    <div className="relative flex rounded-xl border border-slate-300 dark:border-slate-700 focus-within:ring-2 focus-within:ring-purple-600 focus-within:border-purple-600 overflow-hidden bg-white dark:bg-slate-800">
                      <div className="flex items-center px-3.5 bg-slate-100 dark:bg-slate-700/50 border-r border-slate-300 dark:border-slate-700 text-sm font-medium text-slate-700 dark:text-slate-200">
                        🇮🇳 +91
                      </div>
                      <input
                        id="phone"
                        type="tel"
                        maxLength={10}
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ''))}
                        placeholder="98765 43210"
                        className="w-full px-3.5 py-2.5 text-sm outline-none bg-transparent text-slate-900 dark:text-white placeholder:text-slate-400"
                        required
                        autoFocus
                      />
                    </div>
                    <p className="mt-1 text-xs text-slate-500">
                      We will send an SMS with a 6-digit verification code.
                    </p>
                  </div>

                  <Button
                    type="submit"
                    disabled={loading || phoneNumber.length < 10}
                    className="w-full h-11 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-xl transition-all shadow-md shadow-purple-200 dark:shadow-none"
                  >
                    {loading ? (
                      <span className="flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Sending OTP...
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        Send OTP via SMS
                        <ArrowRight className="w-4 h-4" />
                      </span>
                    )}
                  </Button>
                </form>
              ) : (
                /* OTP Verification View */
                <form onSubmit={handleVerifyOtp} className="space-y-5">
                  <div className="text-center">
                    <p className="text-xs font-medium text-slate-600 dark:text-slate-400">
                      Verification code sent to
                    </p>
                    <div className="flex items-center justify-center gap-2 mt-0.5">
                      <span className="text-sm font-bold text-slate-900 dark:text-white">
                        +91 {phoneNumber.slice(-10)}
                      </span>
                      <button
                        type="button"
                        onClick={() => { setOtpView('phone'); setOtp(['', '', '', '', '', '']); }}
                        className="text-xs text-purple-600 hover:text-purple-700 font-medium inline-flex items-center gap-1"
                      >
                        <Edit3 className="w-3 h-3" /> Edit
                      </button>
                    </div>
                  </div>

                  {/* 6 Digit Inputs */}
                  <div className="flex justify-between gap-2 max-w-xs mx-auto">
                    {otp.map((digit, idx) => (
                      <input
                        key={idx}
                        ref={(el) => (otpInputRefs.current[idx] = el)}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleOtpChange(idx, e.target.value)}
                        onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                        className="w-11 h-12 text-center text-lg font-bold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-600 focus:border-purple-600 outline-none transition-all"
                      />
                    ))}
                  </div>

                  {/* Resend Timer */}
                  <div className="text-center">
                    {canResend ? (
                      <button
                        type="button"
                        onClick={() => handleSendOtp()}
                        disabled={loading}
                        className="text-xs font-semibold text-purple-600 hover:text-purple-700 underline"
                      >
                        Resend Code via SMS
                      </button>
                    ) : (
                      <p className="text-xs text-slate-500">
                        Resend OTP in <span className="font-semibold text-purple-600">{timer}s</span>
                      </p>
                    )}
                  </div>

                  <Button
                    type="submit"
                    disabled={loading || otp.join('').length < 6}
                    className="w-full h-11 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-xl transition-all shadow-md shadow-purple-200 dark:shadow-none"
                  >
                    {loading ? (
                      <span className="flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Verifying...
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        Verify & Sign In
                        <CheckCircle2 className="w-4 h-4" />
                      </span>
                    )}
                  </Button>
                </form>
              )}
            </div>
          )}

          {/* TAB 2: EMAIL & PASSWORD FLOW */}
          {tab === 'email' && (
            <form onSubmit={handleEmailLogin} className="space-y-4">
              <div>
                <Label htmlFor="email" className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 block">
                  Email Address
                </Label>
                <div className="relative">
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="h-11 pl-10 rounded-xl"
                    required
                    autoFocus
                  />
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <Label htmlFor="password" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Password
                  </Label>
                  <button
                    type="button"
                    onClick={handleForgotPassword}
                    className="text-xs font-medium text-purple-600 hover:text-purple-700 hover:underline"
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="h-11 pl-10 pr-10 rounded-xl"
                    required
                  />
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full h-11 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-xl transition-all shadow-md shadow-purple-200 dark:shadow-none"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Signing in...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    Sign In with Email
                    <ArrowRight className="w-4 h-4" />
                  </span>
                )}
              </Button>
            </form>
          )}

          {/* Card Footer: Switch to Sign Up */}
          <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-800 text-center">
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Don&apos;t have an account?{' '}
              <Link href="/signup" className="font-semibold text-purple-600 hover:text-purple-700 hover:underline">
                Create one now
              </Link>
            </p>
          </div>
        </div>

        {/* Security badge footer */}
        <div className="mt-6 flex items-center justify-center gap-2 text-xs text-slate-400">
          <ShieldCheck className="w-4 h-4 text-emerald-500" />
          <span>256-bit SSL encrypted • Safe & secure checkout</span>
        </div>
      </div>
    </div>
  );
}
