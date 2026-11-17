'use client';

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';
import { useCart } from '@/lib/store/cart-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  MapPin,
  ShieldCheck,
  Loader2,
  Navigation,
  CreditCard,
  Truck,
  PackageCheck,
  ChevronDown,
  ShoppingBag,
  Trash2,
  Check,
  Zap,
  Lock,
  Sparkles,
  AlertCircle,
  AlertTriangle,
  RotateCcw,
  CheckCircle2,
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import Image from 'next/image';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { CheckoutSchema, type CheckoutFormData } from '@/lib/validation/checkout';
import { cn } from '@/lib/utils';
import { useUser, useFirestore } from '@/firebase';
import { collection, addDoc, serverTimestamp, query, where, getDocs, doc, updateDoc, increment } from 'firebase/firestore';
import Link from 'next/link';

declare global {
  interface Window {
    Razorpay: any;
  }
}

export default function CheckoutPage() {
  const { cart, subtotal, clearCart, removeFromCart } = useCart();
  const { user } = useUser();
  const db = useFirestore();
  const { toast } = useToast();
  const router = useRouter();

  const [step, setStep] = useState<'address' | 'payment'>('address');
  const [isLocating, setIsLocating] = useState(false);
  const [isPincodeSearching, setIsPincodeSearching] = useState(false);
  const [gpsLocationName, setGpsLocationName] = useState<string | null>(null);
  const [gpsCoords, setGpsCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'full' | 'cod_advance' | 'cod_pure'>('full');
  const [showMobileSummary, setShowMobileSummary] = useState(false);
  const [paymentError, setPaymentError] = useState<{
    failed: boolean;
    reason: string;
    type?: 'cancelled' | 'failed' | 'error';
    paymentId?: string;
  } | null>(null);

  const [paymentSuccessData, setPaymentSuccessData] = useState<{
    paymentId: string;
    amount: number;
    paymentType: string;
  } | null>(null);

  const paymentFailureOccurredRef = useRef<boolean>(false);

  const [formData, setFormData] = useState<CheckoutFormData>({
    fullName: user?.displayName || '',
    email: user?.email || '',
    phone: '',
    pincode: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
  });

  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        fullName: prev.fullName || user.displayName || '',
        email: prev.email || user.email || '',
      }));
    }
  }, [user]);

  const DEFAULT_COUPONS = [
    { id: 'default-welcome10', code: 'WELCOME10', discountType: 'Percentage', value: 10, status: 'Active' },
    { id: 'default-magic50', code: 'MAGIC50', discountType: 'Fixed', value: 50, status: 'Active' },
    { id: 'default-festive100', code: 'FESTIVE100', discountType: 'Fixed', value: 100, status: 'Active' },
  ];

  const [couponCodeInput, setCouponCodeInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null);
  const [availableCoupons, setAvailableCoupons] = useState<any[]>(DEFAULT_COUPONS);

  useEffect(() => {
    if (!db) return;
    const fetchCoupons = async () => {
      try {
        const q = query(collection(db, 'coupons'), where('status', '==', 'Active'));
        const querySnapshot = await getDocs(q);
        const list: any[] = [...DEFAULT_COUPONS];
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          const existingIdx = list.findIndex(c => c.code?.toLowerCase() === data.code?.toLowerCase());
          if (existingIdx !== -1) {
            list[existingIdx] = { id: doc.id, ...data };
          } else {
            list.push({ id: doc.id, ...data });
          }
        });
        setAvailableCoupons(list);
      } catch (err) {
        console.warn("Failed to fetch coupons", err);
      }
    };
    fetchCoupons();
  }, [db]);

  const handleApplyCoupon = () => {
    if (!couponCodeInput.trim()) {
      toast({ variant: "destructive", title: "Error", description: "Please enter a coupon code." });
      return;
    }
    const cpn = availableCoupons.find(c => c.code?.toLowerCase() === couponCodeInput.trim().toLowerCase());
    if (!cpn) {
      toast({ variant: "destructive", title: "Invalid Coupon", description: "This coupon code does not exist or is expired." });
      return;
    }
    setAppliedCoupon(cpn);
    toast({ title: "Coupon Applied", description: `${cpn.code} applied successfully!` });
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponCodeInput('');
    toast({ title: "Coupon Removed" });
  };

  const shipping = subtotal >= 999 ? 0 : 99;
  const discount = useMemo(() => {
    if (!appliedCoupon) return 0;
    if (appliedCoupon.discountType === 'Percentage') {
      return Math.round((subtotal * appliedCoupon.value) / 100);
    }
    return Math.min(appliedCoupon.value, subtotal);
  }, [appliedCoupon, subtotal]);

  const total = Math.max(0, subtotal - discount + shipping);
  const codAdvanceAmount = Math.min(100, total);
  const codRemainingAmount = Math.max(0, total - codAdvanceAmount);

  // Preload Razorpay Checkout SDK Script
  const loadRazorpayScript = useCallback((): Promise<boolean> => {
    return new Promise((resolve) => {
      if (typeof window !== 'undefined' && window.Razorpay) {
        resolve(true);
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  }, []);

  useEffect(() => {
    loadRazorpayScript();
  }, [loadRazorpayScript]);

  // Indian Pincode Auto-Resolution API
  const handlePincodeChange = async (val: string) => {
    const clean = val.replace(/\D/g, '').slice(0, 6);
    setFormData(prev => ({ ...prev, pincode: clean }));

    if (clean.length === 6) {
      setIsPincodeSearching(true);
      try {
        const pinRes = await fetch(`https://api.postalpincode.in/pincode/${clean}`);
        const pinData = await pinRes.json();
        if (pinData && pinData[0] && pinData[0].Status === 'Success' && pinData[0].PostOffice?.[0]) {
          const po = pinData[0].PostOffice[0];
          setFormData(prev => ({
            ...prev,
            city: po.District || po.Block || prev.city,
            state: po.State || prev.state,
          }));
          toast({
            title: "Pincode Detected",
            description: `${po.District || po.Block}, ${po.State}`
          });
        }
      } catch (err) {
        console.warn("Pincode API lookup note:", err);
      } finally {
        setIsPincodeSearching(false);
      }
    }
  };

  // Live GPS Mobile Location Detection via OpenStreetMap / Nominatim
  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      toast({
        variant: "destructive",
        title: "Geolocation Unavailable",
        description: "Your browser does not support GPS. Please enter your address manually."
      });
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          setGpsCoords({ lat: latitude, lng: longitude });

          // Reverse geocode with OpenStreetMap Nominatim
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1`);
          if (!res.ok) throw new Error("Location fetch failed");
          const data = await res.json();
          const addr = data.address || {};

          const resolvedPincode = (addr.postcode || '').replace(/\D/g, '').slice(0, 6);
          const resolvedCity = addr.city || addr.town || addr.village || addr.county || addr.state_district || '';
          const resolvedState = addr.state || '';
          const streetParts = [addr.road, addr.suburb, addr.neighbourhood, addr.residential].filter(Boolean);
          const resolvedLine1 = streetParts.length > 0 ? streetParts.join(', ') : '';

          setFormData(prev => ({
            ...prev,
            pincode: resolvedPincode || prev.pincode,
            city: resolvedCity || prev.city,
            state: resolvedState || prev.state,
            addressLine1: resolvedLine1 || prev.addressLine1
          }));

          const locLabel = [resolvedCity, resolvedState].filter(Boolean).join(', ') || 'Current Location';
          setGpsLocationName(locLabel);

          toast({
            title: "GPS Location Detected!",
            description: `Address pre-filled for ${locLabel}.`
          });
        } catch (err) {
          console.warn("GPS lookup note:", err);
          toast({
            variant: "destructive",
            title: "GPS Detection Note",
            description: "Coordinates fetched. Please confirm pincode and street name manually."
          });
        } finally {
          setIsLocating(false);
        }
      },
      (error) => {
        setIsLocating(false);
        let msg = "Could not detect location. Please fill in manually.";
        if (error.code === 1) {
          msg = "Location permission denied. Please allow location access in your browser settings.";
        } else if (error.code === 2) {
          msg = "GPS signal weak or unavailable. Please fill in manually.";
        } else if (error.code === 3) {
          msg = "Location request timed out. Please fill in manually.";
        }
        toast({
          variant: "destructive",
          title: "Location Note",
          description: msg
        });
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 30000 }
    );
  };

  const handleAddressSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const valid = CheckoutSchema.safeParse(formData);
    if (!valid.success) {
      toast({ variant: "destructive", title: "Wait!", description: valid.error.errors[0].message });
      return;
    }
    setStep('payment');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Helper to record coupon increment
  const recordCouponUsage = async () => {
    if (!appliedCoupon || !db) return;
    try {
      if (appliedCoupon.id && !appliedCoupon.id.startsWith('default-')) {
        const couponDocRef = doc(db, 'coupons', appliedCoupon.id);
        await updateDoc(couponDocRef, { usageCount: increment(1) });
      }
    } catch (e) {
      console.warn("Failed to update coupon usage count:", e);
    }
  };

  // Unified Order Placement Function to Firestore
  const completeAndSaveOrder = async (orderInfo: {
    transactionId: string;
    paymentType: 'full' | 'cod_advance' | 'cod_pure';
    paidAmount: number;
    balanceAmount: number;
    status: string;
    paymentMethodName: string;
  }) => {
    if (!db) return;

    try {
      const orderDoc = {
        userId: user?.uid || 'guest',
        customerName: formData.fullName,
        email: formData.email,
        phone: formData.phone,
        items: cart.map(i => ({
          id: i.id,
          name: i.name,
          price: i.price,
          qty: i.quantity,
          customization: i.personalizationName || null,
          selectedColor: i.selectedColor || null,
          selectedCapacity: i.selectedCapacity || null
        })),
        total: total,
        paidAmount: orderInfo.paidAmount,
        codBalance: orderInfo.balanceAmount,
        advancePaid: orderInfo.paidAmount,
        discountAmount: discount,
        couponCode: appliedCoupon?.code || null,
        status: orderInfo.status,
        trackingStatus: 'Order Placed',
        shippingAddress: {
          line1: formData.addressLine1,
          line2: formData.addressLine2 || '',
          city: formData.city,
          state: formData.state,
          pincode: formData.pincode,
          gpsCoords: gpsCoords || null
        },
        paymentMethod: orderInfo.paymentMethodName,
        paymentType: orderInfo.paymentType,
        paymentStatus: orderInfo.paidAmount >= total 
          ? 'Paid' 
          : orderInfo.paidAmount > 0 
          ? `Advance Paid (₹${orderInfo.paidAmount} Paid, ₹${orderInfo.balanceAmount} COD Balance)` 
          : `Pending (₹${orderInfo.balanceAmount} Due on Delivery)`,
        transactionId: orderInfo.transactionId,
        razorpayPaymentId: orderInfo.transactionId.startsWith('COD_') ? null : orderInfo.transactionId,
        createdAt: serverTimestamp(),
      };

      const orderRef = await addDoc(collection(db, 'orders'), orderDoc);

      // Ledger entry in payments collection
      try {
        const paymentDoc = {
          orderId: orderRef.id,
          razorpayPaymentId: orderInfo.transactionId.startsWith('COD_') ? null : orderInfo.transactionId,
          amount: orderInfo.paidAmount,
          currency: 'INR',
          paymentType: orderInfo.paymentType,
          paymentMethod: orderInfo.transactionId.startsWith('COD_') ? 'Cash on Delivery' : 'Razorpay',
          status: orderInfo.paidAmount > 0 ? 'Captured' : 'Pending',
          userId: user?.uid || 'guest',
          customerName: formData.fullName,
          customerEmail: formData.email,
          customerPhone: formData.phone,
          totalOrderAmount: total,
          remainingCodBalance: orderInfo.balanceAmount,
          createdAt: serverTimestamp(),
        };
        await addDoc(collection(db, 'payments'), paymentDoc);
      } catch (payErr) {
        console.warn("Payment ledger note:", payErr);
      }

      await recordCouponUsage();

      // Save order id in local storage for guest / recent orders
      try {
        const existing = JSON.parse(localStorage.getItem('giftmart_recent_orders') || '[]');
        const updated = Array.from(new Set([orderRef.id, ...existing])).slice(0, 20);
        localStorage.setItem('giftmart_recent_orders', JSON.stringify(updated));
      } catch (e) {
        console.warn("Recent order storage note:", e);
      }

      clearCart();

      toast({
        title: "Order Placed Successfully!",
        description: `Order #${orderRef.id.slice(-8).toUpperCase()} has been confirmed.`
      });

      router.push(`/checkout/success?id=${orderRef.id}&payment=${orderInfo.paymentType}&paid=${orderInfo.paidAmount}&remaining=${orderInfo.balanceAmount}&paymentId=${encodeURIComponent(orderInfo.transactionId)}`);
    } catch (err: any) {
      console.error("Order save error:", err);
      toast({
        variant: "destructive",
        title: "Order Recording Note",
        description: err.message || "Failed to record order. Please note your payment ID: " + orderInfo.transactionId
      });
      setIsProcessing(false);
      setPaymentSuccessData(null);
    }
  };

  // Place Order Action (Direct Razorpay Client Standard Checkout or Instant COD)
  const handlePlaceOrder = async () => {
    if (!db) return;
    paymentFailureOccurredRef.current = false;
    setPaymentError(null);
    setIsProcessing(true);

    // Case 1: Pure Cash on Delivery (Zero Online Payment Required)
    if (paymentMethod === 'cod_pure') {
      await completeAndSaveOrder({
        transactionId: `COD_${Date.now()}`,
        paymentType: 'cod_pure',
        paidAmount: 0,
        balanceAmount: total,
        status: 'Confirmed',
        paymentMethodName: 'Cash on Delivery (Pay on Delivery)'
      });
      return;
    }

    // Case 2 & 3: Online Payment via Razorpay (Full Payment or ₹100 Advance)
    const isFullPayment = paymentMethod === 'full';
    const amountToCharge = isFullPayment ? total : codAdvanceAmount;

    try {
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded || typeof window.Razorpay === 'undefined') {
        toast({
          variant: "destructive",
          title: "Gateway Loading Note",
          description: "Razorpay script is still loading. Please check your internet connection and tap again."
        });
        setIsProcessing(false);
        return;
      }

      const keyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || 'rzp_live_U09TUzjJDbm5qH';

      const options = {
        key: keyId,
        amount: Math.round(amountToCharge * 100), // in paise
        currency: 'INR',
        name: 'GiftArtStudio',
        description: isFullPayment
          ? `Full Online Payment (₹${total.toLocaleString()})`
          : `₹100 COD Confirmation Fee (Remaining ₹${codRemainingAmount.toLocaleString()} on Delivery)`,
        image: '/icon.png',
        prefill: {
          name: formData.fullName,
          email: formData.email,
          contact: formData.phone,
        },
        notes: {
          customerName: formData.fullName,
          customerPhone: formData.phone,
          customerEmail: formData.email,
          orderTotal: String(total),
          paymentType: isFullPayment ? 'full_online' : 'cod_advance_100',
        },
        theme: {
          color: '#7c3aed',
        },
        modal: {
          ondismiss: function () {
            setIsProcessing(false);
            if (!paymentFailureOccurredRef.current) {
              const msg = "Payment window was closed before completion. No money was deducted from your account. Please tap 'Try Paying Again' to complete your order, or choose Cash on Delivery.";
              setPaymentError({
                failed: true,
                type: 'cancelled',
                reason: msg,
              });
              toast({
                variant: "destructive",
                title: "Payment Cancelled / Incomplete",
                description: "You closed the payment screen before completing payment. Please tap 'Try Paying Again' or switch to Cash on Delivery."
              });
            }
          }
        },
        handler: async function (response: any) {
          if (!response.razorpay_payment_id) {
            toast({
              variant: "destructive",
              title: "Payment Error",
              description: "No payment confirmation received from Razorpay."
            });
            setIsProcessing(false);
            return;
          }

          // Catch and show immediate success overlay on the website
          setPaymentSuccessData({
            paymentId: response.razorpay_payment_id,
            amount: amountToCharge,
            paymentType: isFullPayment ? 'full' : 'cod_advance'
          });
          setIsProcessing(true);

          await completeAndSaveOrder({
            transactionId: response.razorpay_payment_id,
            paymentType: isFullPayment ? 'full' : 'cod_advance',
            paidAmount: amountToCharge,
            balanceAmount: isFullPayment ? 0 : codRemainingAmount,
            status: isFullPayment ? 'Paid' : 'Confirmed',
            paymentMethodName: isFullPayment ? 'Razorpay (Full Payment)' : 'Cash on Delivery (₹100 Advance Paid)'
          });
        }
      };

      const rzpInstance = new window.Razorpay(options);

      rzpInstance.on('payment.failed', function (resp: any) {
        paymentFailureOccurredRef.current = true;
        setIsProcessing(false);
        const reason = resp.error?.description || resp.error?.reason || "Payment was declined by your bank or UPI. Please try another card or UPI mode.";
        setPaymentError({
          failed: true,
          type: 'failed',
          reason: `${reason}. Please tap 'Try Paying Again' or switch to Cash on Delivery.`,
          paymentId: resp.error?.metadata?.payment_id
        });
        toast({
          variant: "destructive",
          title: "Payment Failed / Declined",
          description: reason
        });
      });

      rzpInstance.open();
    } catch (err: any) {
      console.error("Razorpay initiation error:", err);
      setIsProcessing(false);
      setPaymentError({
        failed: true,
        type: 'error',
        reason: err.message || "Could not launch Razorpay. Please verify details."
      });
      toast({
        variant: "destructive",
        title: "Payment Gateway Error",
        description: err.message || "Could not launch Razorpay. Please verify details."
      });
    }
  };

  const renderPaymentAlert = () => {
    if (!paymentError || !paymentError.failed) return null;

    const isCancelled = paymentError.type === 'cancelled';

    return (
      <div className={cn(
        "p-4 sm:p-5 rounded-2xl border-2 space-y-3 transition-all animate-in fade-in slide-in-from-top-2 text-left",
        isCancelled
          ? "bg-amber-50/95 border-amber-300 text-amber-950 shadow-sm shadow-amber-200/50"
          : "bg-rose-50/95 border-rose-300 text-rose-950 shadow-sm shadow-rose-200/50"
      )}>
        <div className="flex items-start gap-3">
          <div className={cn(
            "w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5",
            isCancelled ? "bg-amber-200 text-amber-900" : "bg-rose-200 text-rose-900"
          )}>
            {isCancelled ? <AlertTriangle className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <h4 className="font-extrabold text-sm sm:text-base">
                {isCancelled ? "Payment Cancelled / Incomplete" : "Payment Failed / Declined"}
              </h4>
              <button
                type="button"
                onClick={() => setPaymentError(null)}
                className="text-slate-400 hover:text-slate-700 text-lg leading-none p-1 font-bold"
                aria-label="Dismiss alert"
              >
                ×
              </button>
            </div>
            <p className="text-xs sm:text-sm mt-1 leading-relaxed opacity-90">
              {paymentError.reason}
            </p>
            {paymentError.paymentId && (
              <p className="text-[11px] font-mono font-bold mt-1 opacity-80">
                Gateway Reference ID: {paymentError.paymentId}
              </p>
            )}
          </div>
        </div>

        {/* Quick Retry & Alternative Payment Actions */}
        <div className="pt-2 border-t border-current/15 flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <Button
            type="button"
            size="sm"
            onClick={handlePlaceOrder}
            className="rounded-xl bg-purple-600 hover:bg-purple-700 active:scale-[0.98] text-white font-bold text-xs gap-1.5 shadow-md shadow-purple-600/20"
          >
            <RotateCcw className="h-3.5 w-3.5" /> Try Paying Again
          </Button>

          {paymentMethod !== 'cod_pure' && (
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => {
                setPaymentMethod('cod_pure');
                setPaymentError(null);
                toast({
                  title: "Switched to Cash on Delivery",
                  description: `Pay ₹${total.toLocaleString()} in cash when order arrives. Zero online payment required.`
                });
              }}
              className="rounded-xl border-slate-300 hover:bg-white text-slate-800 font-bold text-xs gap-1.5"
            >
              <PackageCheck className="h-3.5 w-3.5 text-purple-600" /> Switch to Pure COD (Pay on Delivery)
            </Button>
          )}
        </div>
      </div>
    );
  };

  if (cart.length === 0 && !isProcessing) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-50/50">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-6 pt-32">
          <PackageCheck className="h-16 w-16 text-slate-300" />
          <h2 className="text-2xl font-black text-slate-800 uppercase tracking-widest">Your Bag is Empty</h2>
          <Button asChild className="rounded-2xl bg-purple-600 hover:bg-purple-700 text-white px-8 h-12 font-bold">
            <Link href="/collections">Shop Handcrafted Gifts</Link>
          </Button>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50/60 relative overflow-x-hidden pb-16">
      <Navbar />

      <div className="container mx-auto px-4 pt-24 pb-12 lg:pt-32 lg:pb-16 max-w-5xl">

        {/* Streamlined Stepper Header */}
        <div className="flex items-center justify-center gap-3 mb-6 max-w-sm mx-auto">
          <button
            onClick={() => setStep('address')}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all",
              step === 'address'
                ? "bg-purple-600 text-white shadow-md shadow-purple-600/20"
                : "bg-white text-slate-600 border border-slate-200"
            )}
          >
            <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-[10px]">1</span>
            <span>Delivery</span>
          </button>

          <span className="text-slate-300 font-bold">→</span>

          <button
            onClick={() => formData.fullName && formData.phone && formData.pincode && setStep('payment')}
            disabled={!formData.phone}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed",
              step === 'payment'
                ? "bg-purple-600 text-white shadow-md shadow-purple-600/20"
                : "bg-white text-slate-600 border border-slate-200"
            )}
          >
            <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-[10px]">2</span>
            <span>Payment</span>
          </button>
        </div>

        {/* Mobile Compact Order Summary */}
        <div className="block lg:hidden w-full mb-6">
          <button
            type="button"
            onClick={() => setShowMobileSummary(!showMobileSummary)}
            className="w-full bg-white border border-slate-200/80 rounded-2xl p-3.5 flex items-center justify-between shadow-xs"
          >
            <div className="flex items-center gap-2 text-purple-700 font-bold text-xs">
              <ShoppingBag className="h-4 w-4" />
              <span>{showMobileSummary ? 'Hide Items' : `View Bag (${cart.length} items)`}</span>
              <ChevronDown className={cn("h-4 w-4 transition-transform duration-200", showMobileSummary && "rotate-180")} />
            </div>
            <span className="font-extrabold text-slate-900 text-sm">₹{total.toLocaleString()}</span>
          </button>

          {showMobileSummary && (
            <div className="bg-white border-x border-b border-slate-200/80 rounded-b-2xl p-4 -mt-2 space-y-4 animate-in fade-in duration-200">
              <div className="space-y-3 max-h-48 overflow-y-auto">
                {cart.map((item, idx) => (
                  <div key={idx} className="flex gap-3 items-center justify-between text-xs">
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <div className="relative w-10 h-10 rounded-lg overflow-hidden bg-slate-100 shrink-0 border border-slate-100">
                        <Image src={item.image} alt={item.name} fill className="object-cover" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-bold text-slate-800 truncate text-xs">{item.name}</p>
                        <p className="text-[10px] text-slate-400">Qty: {item.quantity} {item.personalizationName ? `• ${item.personalizationName}` : ''}</p>
                      </div>
                    </div>
                    <span className="font-bold text-slate-900 shrink-0">₹{(item.price * item.quantity).toLocaleString()}</span>
                  </div>
                ))}
              </div>

              {/* Coupon Row */}
              <div className="pt-3 border-t border-slate-100 flex gap-2">
                <Input
                  type="text"
                  placeholder="COUPON"
                  value={couponCodeInput}
                  onChange={(e) => setCouponCodeInput(e.target.value.toUpperCase())}
                  className="h-9 text-xs uppercase font-bold"
                />
                <Button onClick={handleApplyCoupon} type="button" className="h-9 px-3 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold">
                  Apply
                </Button>
              </div>

              <div className="pt-2 border-t border-slate-100 text-xs space-y-1 font-medium text-slate-600">
                <div className="flex justify-between"><span>Subtotal:</span><span>₹{subtotal.toLocaleString()}</span></div>
                {discount > 0 && <div className="flex justify-between text-emerald-600"><span>Discount:</span><span>-₹{discount.toLocaleString()}</span></div>}
                <div className="flex justify-between"><span>Shipping:</span><span>{shipping === 0 ? 'FREE' : `₹${shipping}`}</span></div>
                <div className="flex justify-between font-bold text-slate-900 pt-1 border-t border-slate-100"><span>Total:</span><span>₹{total.toLocaleString()}</span></div>
              </div>
            </div>
          )}
        </div>

        {/* Main Step Grid */}
        <div className="grid lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-8 space-y-6">

            {/* Step 1: Delivery Address Form */}
            {step === 'address' && (
              <div className="bg-white rounded-3xl p-5 sm:p-8 shadow-sm border border-slate-200/80 space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                  <div>
                    <h2 className="text-xl font-bold text-slate-900">Delivery Address</h2>
                    <p className="text-xs text-slate-500 mt-0.5">Where should we deliver your handcrafted gifts?</p>
                  </div>

                  {/* 1-Tap Mobile GPS Auto-Detect Button */}
                  <Button
                    type="button"
                    onClick={handleDetectLocation}
                    disabled={isLocating}
                    variant="outline"
                    className="h-10 px-4 rounded-xl border-purple-200 bg-purple-50/70 hover:bg-purple-100 text-purple-700 text-xs font-bold flex items-center justify-center gap-2 shadow-xs shrink-0"
                  >
                    {isLocating ? <Loader2 className="h-4 w-4 animate-spin text-purple-600" /> : <Navigation className="h-4 w-4 text-purple-600" />}
                    <span>{isLocating ? 'Detecting GPS...' : '📍 Auto-Detect My Location'}</span>
                  </Button>
                </div>

                {/* GPS Location Confirmation Badge */}
                {gpsLocationName && (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between text-xs text-emerald-800">
                    <div className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-emerald-600 shrink-0" />
                      <span>GPS Coordinates verified for <strong>{gpsLocationName}</strong></span>
                    </div>
                    {gpsCoords && (
                      <span className="text-[10px] text-emerald-600 font-mono hidden sm:inline">
                        ({gpsCoords.lat.toFixed(3)}, {gpsCoords.lng.toFixed(3)})
                      </span>
                    )}
                  </div>
                )}

                <form onSubmit={handleAddressSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-slate-700">Full Name *</Label>
                    <Input
                      required
                      placeholder="e.g. Rahul Sharma"
                      value={formData.fullName}
                      onChange={e => setFormData({ ...formData, fullName: e.target.value })}
                      className="h-12 rounded-xl text-sm"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-slate-700">Mobile Phone Number *</Label>
                    <Input
                      required
                      type="tel"
                      placeholder="e.g. 9876543210"
                      value={formData.phone}
                      onChange={e => setFormData({ ...formData, phone: e.target.value })}
                      className="h-12 rounded-xl text-sm font-medium"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-slate-700">Email Address *</Label>
                    <Input
                      required
                      type="email"
                      placeholder="e.g. rahul@example.com"
                      value={formData.email}
                      onChange={e => setFormData({ ...formData, email: e.target.value })}
                      className="h-12 rounded-xl text-sm"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center">
                      <Label className="text-xs font-bold text-slate-700">PIN Code (6 Digits) *</Label>
                      {isPincodeSearching && <span className="text-[10px] text-purple-600 font-semibold flex items-center gap-1"><Loader2 className="h-3 w-3 animate-spin" /> Verifying...</span>}
                    </div>
                    <Input
                      required
                      maxLength={6}
                      placeholder="e.g. 560001"
                      value={formData.pincode}
                      onChange={e => handlePincodeChange(e.target.value)}
                      className="h-12 rounded-xl text-sm font-semibold tracking-wide"
                    />
                  </div>

                  <div className="sm:col-span-2 space-y-1.5">
                    <Label className="text-xs font-bold text-slate-700">House No, Flat, Street Address *</Label>
                    <Input
                      required
                      placeholder="e.g. Flat 302, Green Valley Apartments, MG Road"
                      value={formData.addressLine1}
                      onChange={e => setFormData({ ...formData, addressLine1: e.target.value })}
                      className="h-12 rounded-xl text-sm"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-slate-700">City / District *</Label>
                    <Input
                      required
                      placeholder="e.g. Bengaluru"
                      value={formData.city}
                      onChange={e => setFormData({ ...formData, city: e.target.value })}
                      className="h-12 rounded-xl text-sm"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-slate-700">State *</Label>
                    <Input
                      required
                      placeholder="e.g. Karnataka"
                      value={formData.state}
                      onChange={e => setFormData({ ...formData, state: e.target.value })}
                      className="h-12 rounded-xl text-sm"
                    />
                  </div>

                  <div className="sm:col-span-2 pt-2">
                    <Button
                      type="submit"
                      className="w-full h-13 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-purple-600/20"
                    >
                      <span>Proceed to Payment Options</span>
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </form>
              </div>
            )}

            {/* Step 2: Payment Selection Form */}
            {step === 'payment' && (
              <div className="bg-white rounded-3xl p-5 sm:p-8 shadow-sm border border-slate-200/80 space-y-6">
                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                  <div>
                    <h2 className="text-xl font-bold text-slate-900">Select Payment Method</h2>
                    <p className="text-xs text-slate-500 mt-0.5">Delivering to {formData.city}, {formData.pincode}</p>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setStep('address')}
                    className="text-xs font-bold text-purple-700 hover:bg-purple-50 h-9 rounded-xl"
                  >
                    Edit Address
                  </Button>
                </div>

                {/* Top Payment Notice / Decline Retry Box */}
                {renderPaymentAlert()}

                {/* 3 Clear, Responsive Payment Options */}
                <div className="space-y-3.5">

                  {/* Option 1: Full Online Payment via Razorpay */}
                  <div
                    onClick={() => setPaymentMethod('full')}
                    className={cn(
                      "p-4 rounded-2xl border-2 cursor-pointer transition-all flex items-start gap-3.5",
                      paymentMethod === 'full'
                        ? "border-purple-600 bg-purple-50/40 ring-1 ring-purple-600/30"
                        : "border-slate-200 hover:border-slate-300 bg-white"
                    )}
                  >
                    <div className={cn(
                      "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 mt-0.5",
                      paymentMethod === 'full' ? "bg-purple-600 text-white" : "bg-slate-100 text-slate-500"
                    )}>
                      <CreditCard className="h-5 w-5" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <span className="font-bold text-sm text-slate-900">Pay Full Online (100% Prepaid)</span>
                        <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded-full">
                          Fastest Dispatch
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-1">
                        Pay ₹{total.toLocaleString()} via Razorpay using UPI (GPay, PhonePe, Paytm), Cards, or NetBanking.
                      </p>
                      <div className="mt-2 text-xs font-semibold text-emerald-700">
                        Pay Now: ₹{total.toLocaleString()} • Balance on Delivery: ₹0
                      </div>
                    </div>

                    <div className={cn(
                      "w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-1",
                      paymentMethod === 'full' ? "border-purple-600 bg-purple-600 text-white" : "border-slate-300"
                    )}>
                      {paymentMethod === 'full' && <Check className="h-3 w-3 stroke-[3]" />}
                    </div>
                  </div>

                  {/* Option 2: Cash on Delivery with ₹100 Advance */}
                  <div
                    onClick={() => setPaymentMethod('cod_advance')}
                    className={cn(
                      "p-4 rounded-2xl border-2 cursor-pointer transition-all flex items-start gap-3.5",
                      paymentMethod === 'cod_advance'
                        ? "border-purple-600 bg-purple-50/40 ring-1 ring-purple-600/30"
                        : "border-slate-200 hover:border-slate-300 bg-white"
                    )}
                  >
                    <div className={cn(
                      "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 mt-0.5",
                      paymentMethod === 'cod_advance' ? "bg-purple-600 text-white" : "bg-slate-100 text-slate-500"
                    )}>
                      <Truck className="h-5 w-5" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <span className="font-bold text-sm text-slate-900">Cash on Delivery (₹100 Booking Advance)</span>
                        <span className="px-2 py-0.5 bg-purple-100 text-purple-800 text-[10px] font-bold rounded-full">
                          ₹100 Online Advance
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-1">
                        Pay ₹{codAdvanceAmount} online now to confirm customization. Pay ₹{codRemainingAmount.toLocaleString()} in cash when order arrives.
                      </p>
                      <div className="mt-2 text-xs font-semibold text-purple-700">
                        Pay Now: ₹{codAdvanceAmount} • Balance on Delivery: ₹{codRemainingAmount.toLocaleString()}
                      </div>
                    </div>

                    <div className={cn(
                      "w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-1",
                      paymentMethod === 'cod_advance' ? "border-purple-600 bg-purple-600 text-white" : "border-slate-300"
                    )}>
                      {paymentMethod === 'cod_advance' && <Check className="h-3 w-3 stroke-[3]" />}
                    </div>
                  </div>

                  {/* Option 3: Pure Cash on Delivery (Pay 100% on Delivery) */}
                  <div
                    onClick={() => setPaymentMethod('cod_pure')}
                    className={cn(
                      "p-4 rounded-2xl border-2 cursor-pointer transition-all flex items-start gap-3.5",
                      paymentMethod === 'cod_pure'
                        ? "border-purple-600 bg-purple-50/40 ring-1 ring-purple-600/30"
                        : "border-slate-200 hover:border-slate-300 bg-white"
                    )}
                  >
                    <div className={cn(
                      "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 mt-0.5",
                      paymentMethod === 'cod_pure' ? "bg-purple-600 text-white" : "bg-slate-100 text-slate-500"
                    )}>
                      <PackageCheck className="h-5 w-5" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <span className="font-bold text-sm text-slate-900">Cash on Delivery (Pay on Delivery)</span>
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-700 text-[10px] font-bold rounded-full">
                          No Online Payment
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-1">
                        Order confirmed immediately. Pay the full amount of ₹{total.toLocaleString()} in cash to the delivery partner.
                      </p>
                      <div className="mt-2 text-xs font-semibold text-slate-700">
                        Pay Now: ₹0 • Balance on Delivery: ₹{total.toLocaleString()}
                      </div>
                    </div>

                    <div className={cn(
                      "w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-1",
                      paymentMethod === 'cod_pure' ? "border-purple-600 bg-purple-600 text-white" : "border-slate-300"
                    )}>
                      {paymentMethod === 'cod_pure' && <Check className="h-3 w-3 stroke-[3]" />}
                    </div>
                  </div>

                </div>

                {/* In-Page Payment Notice / Decline Retry Box */}
                {renderPaymentAlert()}

                {/* Safe Transaction Note */}
                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 flex items-center gap-2.5 text-xs text-slate-600">
                  <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span>256-Bit SSL Encrypted & Protected by Razorpay Payments</span>
                </div>

                {/* Responsive Multi-Line CTA Button */}
                <Button
                  type="button"
                  disabled={isProcessing}
                  onClick={handlePlaceOrder}
                  className="w-full h-auto min-h-[3.5rem] py-3.5 px-4 rounded-2xl bg-purple-600 hover:bg-purple-700 active:scale-[0.99] text-white shadow-lg shadow-purple-600/25 transition-all flex flex-col items-center justify-center"
                >
                  {isProcessing ? (
                    <div className="flex items-center gap-2 font-bold text-sm">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Confirming Order...</span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center text-center leading-tight">
                      <span className="font-extrabold text-sm sm:text-base">
                        {paymentMethod === 'full'
                          ? `Pay ₹${total.toLocaleString()} via Razorpay`
                          : paymentMethod === 'cod_advance'
                          ? `Pay ₹${codAdvanceAmount} Advance & Confirm COD`
                          : `Confirm COD Order (₹${total.toLocaleString()})`}
                      </span>
                      <span className="text-[11px] opacity-85 font-medium mt-0.5">
                        {paymentMethod === 'full'
                          ? 'Instant 100% Prepaid Dispatch'
                          : paymentMethod === 'cod_advance'
                          ? `Remaining ₹${codRemainingAmount.toLocaleString()} Due on Delivery`
                          : 'Zero Online Payment • Pay Cash at Doorstep'}
                      </span>
                    </div>
                  )}
                </Button>
              </div>
            )}
          </div>

          {/* Desktop Sidebar Summary */}
          <aside className="hidden lg:block lg:col-span-4 space-y-6 sticky top-28">
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200/80 space-y-6">
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <ShoppingBag className="h-4 w-4 text-purple-600" />
                <span>Bag Summary ({cart.length})</span>
              </h3>

              <div className="space-y-3 max-h-56 overflow-y-auto pr-1">
                {cart.map((item, idx) => (
                  <div key={idx} className="flex gap-3 items-center justify-between text-xs">
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <div className="relative w-10 h-10 rounded-lg overflow-hidden bg-slate-100 shrink-0 border border-slate-100">
                        <Image src={item.image} alt={item.name} fill className="object-cover" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-bold text-slate-800 truncate text-xs">{item.name}</p>
                        <p className="text-[10px] text-slate-400">Qty: {item.quantity} {item.personalizationName ? `• ${item.personalizationName}` : ''}</p>
                      </div>
                    </div>
                    <span className="font-bold text-slate-900 shrink-0">₹{(item.price * item.quantity).toLocaleString()}</span>
                  </div>
                ))}
              </div>

              {/* Coupon Row */}
              <div className="pt-3 border-t border-slate-100 flex gap-2">
                <Input
                  type="text"
                  placeholder="COUPON"
                  value={couponCodeInput}
                  onChange={(e) => setCouponCodeInput(e.target.value.toUpperCase())}
                  className="h-9 text-xs uppercase font-bold"
                />
                <Button onClick={handleApplyCoupon} type="button" className="h-9 px-3 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold">
                  Apply
                </Button>
              </div>

              {appliedCoupon && (
                <div className="flex justify-between items-center bg-emerald-50 border border-emerald-100 rounded-xl p-2.5 text-xs text-emerald-700 font-bold">
                  <span>{appliedCoupon.code} Applied!</span>
                  <button onClick={handleRemoveCoupon} className="text-slate-400 hover:text-slate-600 underline text-[10px]">Remove</button>
                </div>
              )}

              <div className="pt-3 border-t border-slate-100 text-xs space-y-2 font-medium text-slate-600">
                <div className="flex justify-between"><span>Subtotal:</span><span>₹{subtotal.toLocaleString()}</span></div>
                {discount > 0 && <div className="flex justify-between text-emerald-600 font-bold"><span>Discount:</span><span>-₹{discount.toLocaleString()}</span></div>}
                <div className="flex justify-between"><span>Shipping:</span><span>{shipping === 0 ? 'FREE' : `₹${shipping}`}</span></div>
                <div className="flex justify-between font-extrabold text-slate-900 text-sm pt-2 border-t border-slate-100">
                  <span>Final Total:</span>
                  <span>₹{total.toLocaleString()}</span>
                </div>
              </div>

              <div className="p-3 bg-purple-50/60 rounded-2xl border border-purple-100 text-xs text-purple-900 space-y-1">
                <p className="font-bold flex items-center gap-1.5">
                  <Truck className="h-3.5 w-3.5 text-purple-600" /> Handcrafted & Dispatched in 2-4 Days
                </p>
                <p className="text-[11px] text-slate-500">Free delivery on orders above ₹999.</p>
              </div>
            </div>
          </aside>
        </div>

      </div>

      {/* Fullscreen Overlay when payment succeeded and order is being generated */}
      {paymentSuccessData && (
        <div className="fixed inset-0 z-[100] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl text-center space-y-4 animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle2 className="h-10 w-10 animate-bounce" />
            </div>
            <div>
              <span className="px-3 py-1 bg-emerald-50 text-emerald-700 text-xs font-black uppercase tracking-wider rounded-full border border-emerald-200">
                Payment Verified
              </span>
              <h3 className="text-xl font-black text-slate-900 mt-2">Payment Received Successfully!</h3>
              <p className="text-xs text-slate-500 font-mono mt-1">
                Razorpay ID: <span className="font-bold text-purple-700">{paymentSuccessData.paymentId}</span>
              </p>
            </div>

            <div className="p-4 bg-purple-50 rounded-2xl border border-purple-100 flex items-center justify-center gap-3 text-xs font-semibold text-purple-800">
              <Loader2 className="h-5 w-5 animate-spin text-purple-600 shrink-0" />
              <span className="text-left">Generating your order and saving confirmation... Please do not close this window.</span>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </main>
  );
}
