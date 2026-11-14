'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
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
  ArrowLeft,
  ChevronRight,
  PackageCheck,
  Smartphone,
  ChevronDown,
  ShoppingBag,
  Trash2,
  Check,
  Zap,
  Lock,
  Sparkles
} from 'lucide-react';
import Image from 'next/image';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { CheckoutSchema, type CheckoutFormData } from '@/lib/validation/checkout';
import { cn } from '@/lib/utils';
import { useUser, useFirestore } from '@/firebase';
import { collection, addDoc, serverTimestamp, query, where, getDocs, doc, updateDoc, increment } from 'firebase/firestore';
import Link from 'next/link';
import { PhonePePaymentSection } from '@/components/checkout/phonepe-payment-section';

declare global {
  interface Window {
    Razorpay: any;
  }
}

export default function CheckoutPage() {
  const { cart, subtotal, cartCount, clearCart, removeFromCart } = useCart();
  const { user } = useUser();
  const db = useFirestore();
  const { toast } = useToast();
  const router = useRouter();
  
  const [step, setStep] = useState<'address' | 'payment'>('address');
  const [isLocating, setIsLocating] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'razorpay' | 'phonepe' | 'cod'>('razorpay');
  const [upiTransactionId, setUpiTransactionId] = useState('');
  const [showMobileSummary, setShowMobileSummary] = useState(false);

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
          const existingIdx = list.findIndex(c => c.code.toLowerCase() === data.code?.toLowerCase());
          if (existingIdx !== -1) {
            list[existingIdx] = { id: doc.id, ...data };
          } else {
            list.push({ id: doc.id, ...data });
          }
        });
        setAvailableCoupons(list);
      } catch (err) {
        console.error("Failed to fetch coupons", err);
      }
    };
    fetchCoupons();
  }, [db]);

  const handleApplyCoupon = () => {
    if (!couponCodeInput.trim()) {
      toast({ variant: "destructive", title: "Error", description: "Please enter a coupon code." });
      return;
    }
    const cpn = availableCoupons.find(c => c.code.toLowerCase() === couponCodeInput.trim().toLowerCase());
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

  // Load Razorpay Checkout SDK Script
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

  // Preload Razorpay script on mount
  useEffect(() => {
    loadRazorpayScript();
  }, [loadRazorpayScript]);

  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      toast({
        variant: "destructive",
        title: "Geolocation Unavailable",
        description: "Your browser does not support geolocation. Please enter your address manually."
      });
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1`);
          if (!res.ok) throw new Error("Location fetch failed");
          const data = await res.json();
          const addr = data.address || {};
          
          setFormData(prev => ({
            ...prev,
            pincode: addr.postcode || prev.pincode,
            city: addr.city || addr.town || addr.village || addr.county || prev.city,
            state: addr.state || prev.state,
            addressLine1: [addr.road, addr.suburb, addr.neighbourhood].filter(Boolean).join(', ') || prev.addressLine1
          }));

          toast({
            title: "Location Detected!",
            description: "Your address details have been filled."
          });
        } catch (err) {
          toast({
            variant: "destructive",
            title: "Location Error",
            description: "Could not fetch address from coordinates. Please fill manually."
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
          msg = "Location details unavailable. Please fill in manually.";
        } else if (error.code === 3) {
          msg = "Location request timed out. Please fill in manually.";
        }
        toast({
          variant: "destructive",
          title: "Location Error",
          description: msg
        });
      }
    );
  };

  const handleAddressSubmit = () => {
    const valid = CheckoutSchema.safeParse(formData);
    if (!valid.success) {
      toast({ variant: "destructive", title: "Wait!", description: valid.error.errors[0].message });
      return;
    }
    setStep('payment');
    window.scrollTo(0, 0);
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
      console.error("Failed to update coupon usage count:", e);
    }
  };

  // 1. Razorpay Flow (Primary Online Payment)
  const handleRazorpayPayment = async () => {
    if (!db) return;
    setIsProcessing(true);

    try {
      // Step A: Load SDK script
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        toast({
          variant: "destructive",
          title: "SDK Error",
          description: "Could not load Razorpay payment gateway. Please check your internet connection."
        });
        setIsProcessing(false);
        return;
      }

      // Step B: Create Razorpay Order on server
      const orderRes = await fetch('/api/razorpay/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: total,
          receipt: `rcpt_${Date.now()}`,
          notes: {
            customerName: formData.fullName,
            customerEmail: formData.email,
            customerPhone: formData.phone
          }
        })
      });

      const orderData = await orderRes.json();

      if (!orderData.success || !orderData.orderId) {
        throw new Error(orderData.error || "Failed to initialize Razorpay order");
      }

      // Step C: Configure Razorpay Checkout modal
      const options = {
        key: orderData.keyId || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || 'rzp_live_U09TUzjJDbm5qH',
        amount: orderData.amount,
        currency: orderData.currency || 'INR',
        name: 'GiftArtStudio',
        description: 'Personalized Handcrafted Gifts',
        image: '/icon.png',
        order_id: orderData.orderId,
        prefill: {
          name: formData.fullName,
          email: formData.email,
          contact: formData.phone,
        },
        theme: {
          color: '#5f259f',
        },
        modal: {
          ondismiss: function () {
            setIsProcessing(false);
            toast({
              title: "Payment Cancelled",
              description: "You closed the payment window. Your items are safe in your bag."
            });
          }
        },
        handler: async function (response: any) {
          try {
            // Step D: Cryptographic Server-Side Signature Verification
            const verifyRes = await fetch('/api/razorpay/verify-payment', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              })
            });

            const verifyData = await verifyRes.json();

            if (!verifyData.success) {
              toast({
                variant: "destructive",
                title: "Security Alert",
                description: verifyData.error || "Payment signature mismatch. Order could not be verified."
              });
              setIsProcessing(false);
              return;
            }

            // Step E: Store Verified Order in Firestore
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
                customization: i.personalizationName,
                selectedColor: i.selectedColor,
                selectedCapacity: i.selectedCapacity
              })),
              total: total,
              discountAmount: discount,
              couponCode: appliedCoupon?.code || null,
              status: 'Paid',
              trackingStatus: 'Order Placed',
              shippingAddress: {
                line1: formData.addressLine1,
                line2: formData.addressLine2,
                city: formData.city,
                state: formData.state,
                pincode: formData.pincode
              },
              paymentMethod: 'Razorpay',
              paymentStatus: 'Paid',
              transactionId: response.razorpay_payment_id,
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              paidAmount: total,
              createdAt: serverTimestamp(),
            };

            const docRef = await addDoc(collection(db, 'orders'), orderDoc);
            await recordCouponUsage();

            clearCart();
            toast({
              title: "Payment Successful!",
              description: `Transaction ${response.razorpay_payment_id} verified.`
            });

            router.push(`/checkout/success?id=${docRef.id}&payment=razorpay&paymentId=${response.razorpay_payment_id}`);
          } catch (err: any) {
            console.error("Order save error:", err);
            toast({
              variant: "destructive",
              title: "Order Storage Error",
              description: "Payment was captured but order record failed. Please note your payment ID: " + response.razorpay_payment_id
            });
            setIsProcessing(false);
          }
        }
      };

      const rzpInstance = new window.Razorpay(options);

      rzpInstance.on('payment.failed', function (resp: any) {
        setIsProcessing(false);
        toast({
          variant: "destructive",
          title: "Payment Failed",
          description: resp.error?.description || "Payment was declined by your bank. Please try another card or UPI."
        });
      });

      rzpInstance.open();
    } catch (err: any) {
      console.error("Razorpay initiation error:", err);
      toast({
        variant: "destructive",
        title: "Payment Error",
        description: err.message || "Could not launch Razorpay. Please try again."
      });
      setIsProcessing(false);
    }
  };

  // 2. PhonePe Manual UPI or COD Flow
  const handleOtherOrder = async () => {
    if (!db) return;

    if (paymentMethod === 'phonepe') {
      if (!upiTransactionId.trim() || upiTransactionId.trim().length < 6) {
        toast({ 
          variant: "destructive", 
          title: "Transaction ID Required", 
          description: "Please enter the 12-digit UPI Transaction ID / UTR from PhonePe." 
        });
        return;
      }
    }

    setIsProcessing(true);
    
    try {
      const orderData = {
        userId: user?.uid || 'guest',
        customerName: formData.fullName,
        email: formData.email,
        phone: formData.phone,
        items: cart.map(i => ({ 
          id: i.id, 
          name: i.name, 
          price: i.price, 
          qty: i.quantity, 
          customization: i.personalizationName,
          selectedColor: i.selectedColor,
          selectedCapacity: i.selectedCapacity
        })),
        total: total,
        discountAmount: discount,
        couponCode: appliedCoupon?.code || null,
        status: paymentMethod === 'cod' ? 'Pending' : 'Pending Verification',
        trackingStatus: 'Order Placed',
        shippingAddress: {
          line1: formData.addressLine1,
          line2: formData.addressLine2,
          city: formData.city,
          state: formData.state,
          pincode: formData.pincode
        },
        paymentMethod: paymentMethod === 'phonepe' ? 'PhonePe UPI' : 'Cash on Delivery',
        paymentStatus: paymentMethod === 'phonepe' ? 'Paid (Pending Verification)' : 'Unpaid (COD)',
        transactionId: paymentMethod === 'phonepe' ? upiTransactionId.trim() : null,
        paidAmount: total,
        createdAt: serverTimestamp(),
      };

      const docRef = await addDoc(collection(db, 'orders'), orderData);
      await recordCouponUsage();

      clearCart();
      router.push(`/checkout/success?id=${docRef.id}&payment=${paymentMethod}`);
    } catch (err) {
      toast({ variant: "destructive", title: "Error", description: "Failed to place order." });
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePlaceOrder = () => {
    if (paymentMethod === 'razorpay') {
      handleRazorpayPayment();
    } else {
      handleOtherOrder();
    }
  };

  if (cart.length === 0 && !isProcessing) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-6">
           <PackageCheck className="h-16 w-16 text-slate-200" />
           <h2 className="text-2xl font-black text-slate-800 uppercase tracking-widest">Bag is Empty</h2>
           <Button asChild className="rounded-full bg-[#5f259f] text-white px-10 h-14"><Link href="/collections">Shop Now</Link></Button>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#F8FAFC]/30 relative overflow-x-hidden">
      {/* Ambient background blur glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[400px] sm:w-[500px] h-[400px] sm:h-[500px] rounded-full bg-purple-200/20 blur-[100px] sm:blur-[120px] pointer-events-none -z-10 animate-float" />
      <div className="absolute bottom-[20%] right-[-10%] w-[500px] sm:w-[600px] h-[500px] sm:h-[600px] rounded-full bg-pink-100/30 blur-[110px] sm:blur-[130px] pointer-events-none -z-10 animate-float" style={{ animationDelay: '2s' }} />
      <Navbar />
      <div className="container mx-auto px-4 pt-28 pb-12 lg:pt-36 lg:pb-16 max-w-6xl">
        
        {/* Progress Header */}
        <div className="relative flex items-center justify-center mb-10 md:mb-14 max-w-md mx-auto px-4">
          <div className="absolute left-4 right-4 top-1/2 -translate-y-1/2 h-[3px] bg-slate-100 -z-10 rounded-full overflow-hidden">
            <div 
              className={cn("h-full bg-gradient-to-r from-[#5f259f] via-[#7c3aed] to-[#ec4899] transition-all duration-500 ease-out", step === 'address' ? "w-0" : "w-full")}
            />
          </div>
          <div className="flex items-center justify-between w-full relative z-10">
            <button 
              onClick={() => setStep('address')}
              className="flex flex-col items-center gap-2.5 group cursor-pointer focus:outline-none"
            >
              <div className={cn(
                "w-11 h-11 rounded-full flex items-center justify-center font-black text-xs transition-all duration-300 border-2 active:scale-95",
                step === 'address' 
                  ? "bg-gradient-to-tr from-[#5f259f] to-[#7c3aed] border-[#5f259f] text-white shadow-lg shadow-purple-200/50 scale-110" 
                  : step === 'payment'
                    ? "bg-emerald-50 border-emerald-500 text-emerald-600 shadow-md shadow-emerald-50"
                    : "bg-white border-slate-200 text-slate-400 group-hover:border-slate-300 group-hover:text-slate-500"
              )}>
                {step === 'payment' ? <Check className="h-4 w-4 stroke-[3.5px]" /> : "1"}
              </div>
              <span className={cn(
                "text-[10px] font-black uppercase tracking-widest transition-colors duration-300",
                step === 'address' ? "text-[#5f259f]" : "text-slate-400 group-hover:text-slate-500"
              )}>
                Shipping
              </span>
            </button>

            <button 
              disabled={step === 'address' && !formData.phone}
              onClick={() => setStep('payment')}
              className="flex flex-col items-center gap-2.5 group cursor-pointer focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className={cn(
                "w-11 h-11 rounded-full flex items-center justify-center font-black text-xs transition-all duration-300 border-2 active:scale-95",
                step === 'payment' 
                  ? "bg-gradient-to-tr from-[#5f259f] to-[#7c3aed] border-[#5f259f] text-white shadow-lg shadow-purple-200/50 scale-110" 
                  : "bg-white border-slate-200 text-slate-400 group-hover:border-slate-300 group-hover:text-slate-500"
              )}>
                2
              </div>
              <span className={cn(
                "text-[10px] font-black uppercase tracking-widest transition-colors duration-300",
                step === 'payment' ? "text-[#5f259f]" : "text-slate-400 group-hover:text-slate-500"
              )}>
                Payment
              </span>
            </button>
          </div>
        </div>

        {/* Mobile Order Summary (Collapsible) */}
        <div className="block lg:hidden w-full mb-6">
          <button 
            onClick={() => setShowMobileSummary(!showMobileSummary)}
            className="w-full bg-white border border-slate-100 rounded-2xl p-4 flex items-center justify-between shadow-sm hover:bg-slate-50 transition-all focus:outline-none"
          >
            <div className="flex items-center gap-2 text-[#5f259f] font-black text-xs uppercase tracking-wider">
              <ShoppingBag className="h-4 w-4" />
              <span>{showMobileSummary ? 'Hide Order Summary' : 'Show Order Summary'}</span>
              <ChevronDown className={cn("h-4 w-4 transition-transform duration-300", showMobileSummary && "rotate-180")} />
            </div>
            <span className="font-black text-slate-800 text-sm">₹{total.toLocaleString()}</span>
          </button>
          
          {showMobileSummary && (
            <div className="bg-white border-x border-b border-slate-100 rounded-b-2xl p-5 -mt-2 space-y-6 animate-in fade-in slide-in-from-top-2 duration-300 shadow-inner">
              <div className="space-y-4 max-h-[200px] overflow-y-auto pr-1">
                {cart.map((item, idx) => (
                  <div key={idx} className="flex gap-3 items-center justify-between group">
                    <div className="flex gap-3 items-center min-w-0 flex-1">
                      <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-slate-50 border shrink-0">
                        <Image src={item.image} alt={item.name} fill className="object-cover" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] font-black uppercase truncate text-slate-800">{item.name}</p>
                        <p className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter mt-0.5">
                          Qty: {item.quantity} • {item.personalizationName || 'Standard'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2.5 shrink-0">
                      <p className="text-[10px] font-black text-slate-800">₹{(item.price * item.quantity).toLocaleString()}</p>
                      <button 
                        onClick={() => removeFromCart(item.id)} 
                        className="p-1 rounded-md bg-rose-50 text-rose-400 hover:bg-rose-500 hover:text-white transition-all cursor-pointer"
                        title="Remove item"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-4 border-t border-slate-100 space-y-3">
                <div className="flex gap-2">
                  <Input 
                    type="text" 
                    placeholder="COUPON CODE" 
                    value={couponCodeInput} 
                    onChange={(e) => setCouponCodeInput(e.target.value.toUpperCase())}
                    className="h-9 bg-slate-50 border-slate-200 text-slate-800 rounded-lg placeholder:text-slate-400 text-[10px] font-black uppercase tracking-wider text-center focus-visible:ring-[#5f259f]"
                  />
                  <Button 
                    onClick={handleApplyCoupon}
                    type="button"
                    className="h-9 bg-[#5f259f] hover:bg-[#4a1b7e] text-white rounded-lg text-[9px] font-black uppercase tracking-wider px-3"
                  >
                    Apply
                  </Button>
                </div>
                
                {appliedCoupon && (
                  <div className="flex justify-between items-center bg-emerald-50/50 border border-emerald-100 rounded-lg p-2.5 text-[9px] text-emerald-600 font-bold uppercase tracking-wider">
                    <span>{appliedCoupon.code} Applied!</span>
                    <button onClick={handleRemoveCoupon} className="text-slate-400 hover:text-slate-600 underline uppercase text-[8px] font-black tracking-widest ml-2">Remove</button>
                  </div>
                )}

                {availableCoupons && availableCoupons.length > 0 && (
                  <div className="space-y-1.5">
                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em]">Available Coupons:</p>
                    <div className="flex flex-wrap gap-1.5">
                      {availableCoupons.map((cpn: any) => (
                        <button
                          key={cpn.id}
                          onClick={() => {
                            setCouponCodeInput(cpn.code);
                            setAppliedCoupon(cpn);
                            toast({ title: "Coupon Applied", description: `${cpn.code} applied successfully!` });
                          }}
                          className="bg-purple-50/50 hover:bg-purple-100/50 border border-purple-100/50 rounded-md px-2 py-0.5 text-[8px] font-black uppercase text-[#5f259f] tracking-wider transition-all cursor-pointer"
                        >
                          {cpn.code} ({cpn.discountType === 'Percentage' ? `${cpn.value}% OFF` : `₹${cpn.value} OFF`})
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-slate-100 space-y-2">
                <div className="flex justify-between text-[9px] font-bold uppercase tracking-widest text-slate-400"><span>Subtotal</span><span className="text-slate-800">₹{subtotal.toLocaleString()}</span></div>
                {discount > 0 && (
                  <div className="flex justify-between text-[9px] font-bold uppercase tracking-widest text-emerald-600"><span>Discount</span><span>-₹{discount.toLocaleString()}</span></div>
                )}
                <div className="flex justify-between text-[9px] font-bold uppercase tracking-widest text-slate-400"><span>Shipping</span><span className={cn(shipping === 0 ? "text-emerald-600 font-bold" : "text-slate-800")}>{shipping === 0 ? 'FREE' : `₹${shipping}`}</span></div>
              </div>
            </div>
          )}
        </div>

        <div className="grid lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-8 space-y-6 w-full max-w-full overflow-x-hidden">
            {step === 'address' ? (
              <div className="bg-white/80 backdrop-blur-md rounded-3xl p-5 sm:p-8 md:p-10 shadow-[0_20px_50px_-15px_rgba(203,213,225,0.3)] border border-white/60 space-y-6 md:space-y-8">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
                   <div className="space-y-1">
                     <h2 className="text-lg sm:text-xl md:text-2xl font-black text-slate-800 uppercase tracking-tight">Delivery Address</h2>
                     <p className="text-[9px] sm:text-[10px] md:text-xs text-slate-400 font-bold uppercase">Provide accurate details for safe arrival</p>
                   </div>
                   <Button 
                     variant="outline" 
                     size="sm" 
                     onClick={handleDetectLocation} 
                     disabled={isLocating} 
                     className="w-full sm:w-auto h-11 sm:h-12 rounded-xl gap-2 font-black text-[9px] sm:text-[10px] uppercase border-2 border-slate-200/80 bg-white hover:bg-slate-50 hover:border-slate-300 text-slate-700 transition-all duration-300 active:scale-95 flex items-center justify-center shadow-sm"
                   >
                     {isLocating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Navigation className="h-3.5 w-3.5" />}
                     Detect My Location
                   </Button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                  <div className="space-y-1.5">
                    <Label className="text-[9px] font-black uppercase text-slate-500 ml-1">Full Name *</Label>
                    <Input value={formData.fullName} onChange={e => setFormData({...formData, fullName: e.target.value})} className="h-12 sm:h-14 rounded-xl sm:rounded-2xl bg-slate-50/40 border-slate-200/80 hover:border-slate-300 focus:bg-white focus:border-[#5f259f] focus-visible:ring-0 text-sm font-semibold transition-all duration-300" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[9px] font-black uppercase text-slate-500 ml-1">Email Address *</Label>
                    <Input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} placeholder="email@example.com" className="h-12 sm:h-14 rounded-xl sm:rounded-2xl bg-slate-50/40 border-slate-200/80 hover:border-slate-300 focus:bg-white focus:border-[#5f259f] focus-visible:ring-0 text-sm font-semibold transition-all duration-300" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[9px] font-black uppercase text-slate-500 ml-1">Phone *</Label>
                    <Input value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} placeholder="+91" className="h-12 sm:h-14 rounded-xl sm:rounded-2xl bg-slate-50/40 border-slate-200/80 hover:border-slate-300 focus:bg-white focus:border-[#5f259f] focus-visible:ring-0 text-sm font-semibold transition-all duration-300" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[9px] font-black uppercase text-slate-500 ml-1">Pincode *</Label>
                    <Input value={formData.pincode} onChange={e => setFormData({...formData, pincode: e.target.value})} maxLength={6} className="h-12 sm:h-14 rounded-xl sm:rounded-2xl bg-slate-50/40 border-slate-200/80 hover:border-slate-300 focus:bg-white focus:border-[#5f259f] focus-visible:ring-0 text-sm font-semibold transition-all duration-300" />
                  </div>
                  <div className="sm:col-span-2 space-y-1.5">
                    <Label className="text-[9px] font-black uppercase text-slate-500 ml-1">House No, Building, Road *</Label>
                    <Input value={formData.addressLine1} onChange={e => setFormData({...formData, addressLine1: e.target.value})} className="h-12 sm:h-14 rounded-xl sm:rounded-2xl bg-slate-50/40 border-slate-200/80 hover:border-slate-300 focus:bg-white focus:border-[#5f259f] focus-visible:ring-0 text-sm font-semibold transition-all duration-300" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[9px] font-black uppercase text-slate-500 ml-1">City *</Label>
                    <Input value={formData.city} onChange={e => setFormData({...formData, city: e.target.value})} className="h-12 sm:h-14 rounded-xl sm:rounded-2xl bg-slate-50/40 border-slate-200/80 hover:border-slate-300 focus:bg-white focus:border-[#5f259f] focus-visible:ring-0 text-sm font-semibold transition-all duration-300" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[9px] font-black uppercase text-slate-500 ml-1">State / Province *</Label>
                    <Input value={formData.state} onChange={e => setFormData({...formData, state: e.target.value})} className="h-12 sm:h-14 rounded-xl sm:rounded-2xl bg-slate-50/40 border-slate-200/80 hover:border-slate-300 focus:bg-white focus:border-[#5f259f] focus-visible:ring-0 text-sm font-semibold transition-all duration-300" />
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 flex justify-end">
                  <Button 
                    onClick={handleAddressSubmit} 
                    className="w-full sm:w-auto h-14 sm:h-16 px-10 sm:px-12 rounded-xl sm:rounded-2xl bg-gradient-to-r from-[#5f259f] via-[#7c3aed] to-[#ec4899] hover:from-[#4a1b7e] hover:to-[#db2777] active:scale-95 text-white font-black uppercase text-xs tracking-widest gap-2 shadow-lg shadow-purple-200 transition-all duration-300"
                  >
                    Continue to Payment <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ) : (
              <div className="bg-white/80 backdrop-blur-md rounded-3xl p-5 sm:p-8 md:p-10 shadow-[0_20px_50px_-15px_rgba(203,213,225,0.3)] border border-white/60 space-y-6 md:space-y-8">
                 <div className="flex items-center justify-between border-b border-slate-100 pb-5">
                    <div className="space-y-1">
                      <h2 className="text-lg sm:text-xl md:text-2xl font-black text-slate-800 uppercase tracking-tight">Payment Selection</h2>
                      <p className="text-[9px] sm:text-[10px] md:text-xs text-slate-400 font-bold uppercase">Select your preferred payment gateway</p>
                    </div>
                    <Button variant="ghost" onClick={() => setStep('address')} className="h-9 rounded-lg text-[9px] font-black uppercase tracking-widest text-[#5f259f] hover:bg-purple-50 transition-colors">Edit Address</Button>
                 </div>

                 <div className="grid gap-4">
                    
                    {/* Option 1: Razorpay Gateway (Primary Online Payment) */}
                    <div 
                      onClick={() => setPaymentMethod('razorpay')}
                      className={cn(
                        "p-4 sm:p-6 rounded-2xl border-2 cursor-pointer transition-all duration-300 flex items-center justify-between group active:scale-[0.99]", 
                        paymentMethod === 'razorpay' 
                          ? "border-[#5f259f] bg-gradient-to-br from-purple-50/80 via-white to-pink-50/40 shadow-lg shadow-purple-900/10 ring-2 ring-[#e9c9f2]" 
                          : "hover:border-slate-300 border-slate-200 bg-white"
                      )}
                    >
                       <div className="flex items-center gap-3 sm:gap-4">
                          <div className={cn(
                            "w-11 h-11 sm:w-12 sm:h-12 bg-white rounded-xl shadow-sm flex items-center justify-center transition-colors shrink-0",
                            paymentMethod === 'razorpay' ? "text-[#5f259f] border-2 border-purple-200" : "text-slate-400 border border-slate-200"
                          )}>
                             <CreditCard className="h-6 w-6" />
                          </div>
                          <div className="text-left min-w-0">
                             <div className="flex items-center gap-2 flex-wrap">
                               <span className={cn(
                                 "font-black text-xs sm:text-sm uppercase block tracking-tight",
                                 paymentMethod === 'razorpay' ? "text-purple-950" : "text-slate-800"
                               )}>
                                 Razorpay Secure Gateway
                               </span>
                               <span className="bg-gradient-to-r from-[#5f259f] to-[#ec4899] text-white text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider shadow-xs">
                                 Recommended
                               </span>
                             </div>
                             <span className="text-[10px] font-semibold text-slate-500 block mt-0.5">
                               UPI (GPay, PhonePe, Paytm), Cards (Visa, Master, RuPay), NetBanking & Wallets
                             </span>
                          </div>
                       </div>
                       {paymentMethod === 'razorpay' && (
                         <div className="w-6 h-6 rounded-full bg-[#5f259f] flex items-center justify-center text-white shrink-0 shadow-sm shadow-purple-300">
                           <Check className="h-3.5 w-3.5 stroke-[3]" />
                         </div>
                       )}
                    </div>

                    {/* Option 2: PhonePe & Direct UPI */}
                    <div 
                      onClick={() => setPaymentMethod('phonepe')}
                      className={cn(
                        "p-4 sm:p-6 rounded-2xl border-2 cursor-pointer transition-all duration-300 flex items-center justify-between group active:scale-[0.99]", 
                        paymentMethod === 'phonepe' 
                          ? "border-[#5f259f] bg-gradient-to-br from-purple-50/70 via-white to-violet-50/40 shadow-lg shadow-purple-900/10 ring-2 ring-[#e9c9f2]" 
                          : "hover:border-slate-300 border-slate-200 bg-white"
                      )}
                    >
                       <div className="flex items-center gap-3 sm:gap-4">
                          <div className={cn(
                            "w-11 h-11 sm:w-12 sm:h-12 bg-white rounded-xl shadow-sm flex items-center justify-center transition-colors shrink-0",
                            paymentMethod === 'phonepe' ? "text-[#5f259f] border border-purple-200" : "text-slate-400 border border-slate-200"
                          )}>
                             <Smartphone className="h-6 w-6" />
                          </div>
                          <div className="text-left min-w-0">
                             <div className="flex items-center gap-2">
                               <span className={cn(
                                 "font-black text-xs sm:text-sm uppercase block tracking-tight",
                                 paymentMethod === 'phonepe' ? "text-purple-950" : "text-slate-800"
                               )}>
                                 PhonePe Direct UPI & QR
                               </span>
                             </div>
                             <span className="text-[10px] font-semibold text-slate-500 block mt-0.5">
                               Pay via PhonePe app directly or scan custom UPI QR
                             </span>
                          </div>
                       </div>
                       {paymentMethod === 'phonepe' && (
                         <div className="w-6 h-6 rounded-full bg-[#5f259f] flex items-center justify-center text-white shrink-0 shadow-sm shadow-purple-300">
                           <Check className="h-3.5 w-3.5 stroke-[3]" />
                         </div>
                       )}
                    </div>

                    {/* Option 3: Cash on Delivery */}
                    <div 
                      onClick={() => setPaymentMethod('cod')}
                      className={cn(
                        "p-4 sm:p-6 rounded-2xl border-2 cursor-pointer transition-all duration-300 flex items-center justify-between group active:scale-[0.99]", 
                        paymentMethod === 'cod' 
                          ? "border-[#5f259f] bg-purple-50/40 shadow-lg shadow-purple-900/10 ring-2 ring-[#e9c9f2]" 
                          : "hover:border-slate-300 border-slate-200 bg-white"
                      )}
                    >
                       <div className="flex items-center gap-3 sm:gap-4">
                          <div className={cn(
                            "w-11 h-11 sm:w-12 sm:h-12 bg-white rounded-xl shadow-sm flex items-center justify-center transition-colors shrink-0",
                            paymentMethod === 'cod' ? "text-[#5f259f] border border-purple-200" : "text-slate-400 border border-slate-200"
                          )}>
                             <Truck className="h-6 w-6" />
                          </div>
                          <div className="text-left min-w-0">
                             <span className={cn(
                               "font-black text-xs sm:text-sm uppercase block tracking-tight",
                               paymentMethod === 'cod' ? "text-slate-900" : "text-slate-800"
                             )}>
                               Cash on Delivery
                             </span>
                             <span className="text-[10px] font-semibold text-slate-500 block mt-0.5">
                               Pay with cash when your package arrives at your door
                             </span>
                          </div>
                       </div>
                       {paymentMethod === 'cod' && (
                         <div className="w-6 h-6 rounded-full bg-[#5f259f] flex items-center justify-center text-white shrink-0 shadow-sm shadow-purple-300">
                           <Check className="h-3.5 w-3.5 stroke-[3]" />
                         </div>
                       )}
                    </div>
                 </div>

                 {/* Razorpay Banner Info */}
                 {paymentMethod === 'razorpay' && (
                   <div className="bg-gradient-to-r from-purple-50 to-pink-50/50 border border-purple-200 rounded-2xl p-4 sm:p-5 space-y-3">
                     <div className="flex items-center justify-between">
                       <span className="text-xs font-bold text-purple-950 flex items-center gap-2">
                         <Lock className="h-4 w-4 text-[#5f259f]" />
                         <span>Secured by Razorpay Payments</span>
                       </span>
                       <span className="text-[10px] font-black uppercase text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                         256-bit SSL
                       </span>
                     </div>
                     <p className="text-xs text-slate-600 leading-relaxed">
                       Clicking &ldquo;Pay with Razorpay&rdquo; will open the secure Razorpay payment window where you can complete your purchase using any UPI app (Google Pay, PhonePe, Paytm, CRED), Credit/Debit Card, or NetBanking with instant automated verification.
                     </p>
                   </div>
                 )}

                 {/* PhonePe Details, QR Code & Direct Redirection */}
                 {paymentMethod === 'phonepe' && (
                   <PhonePePaymentSection
                     amount={total}
                     transactionId={upiTransactionId}
                     onTransactionIdChange={setUpiTransactionId}
                     isProcessing={isProcessing}
                   />
                 )}

                 <div className="pt-6 border-t border-slate-100 space-y-6">
                    <div className="flex items-center gap-3 p-3.5 sm:p-4 bg-gradient-to-r from-emerald-50 to-teal-50/50 rounded-xl sm:rounded-2xl text-emerald-700 border border-emerald-100/60 shadow-sm">
                       <ShieldCheck className="h-5 w-5 shrink-0 text-emerald-500" />
                       <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest">100% Encrypted & Safe Transaction</span>
                    </div>

                    <Button 
                      disabled={isProcessing} 
                      onClick={handlePlaceOrder}
                      className={cn(
                        "w-full h-14 sm:h-16 rounded-xl sm:rounded-2xl active:scale-[0.98] text-white font-black uppercase text-xs sm:text-sm tracking-widest shadow-xl transition-all duration-300 flex items-center justify-center gap-2",
                        paymentMethod === 'razorpay'
                          ? "bg-gradient-to-r from-[#5f259f] via-[#7c3aed] to-[#ec4899] hover:from-[#4a1b7e] hover:to-[#db2777] shadow-purple-900/20"
                          : paymentMethod === 'phonepe'
                            ? "bg-gradient-to-r from-[#5f259f] to-[#7b2cbf] hover:from-[#4d1d82] hover:to-[#6a24a5] shadow-purple-900/20"
                            : "bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 shadow-indigo-200/50"
                      )}
                    >
                      {isProcessing ? (
                        <>
                          <Loader2 className="h-5 w-5 animate-spin" />
                          <span>Processing Secure Payment...</span>
                        </>
                      ) : (
                        <>
                          <Zap className="h-4 w-4 fill-white" />
                          <span>
                            {paymentMethod === 'razorpay' 
                              ? `Pay with Razorpay (₹${total.toLocaleString()})` 
                              : paymentMethod === 'phonepe'
                                ? `Confirm & Place Order (₹${total.toLocaleString()})`
                                : `Place COD Order (₹${total.toLocaleString()})`}
                          </span>
                          <ChevronRight className="h-4 w-4" />
                        </>
                      )}
                    </Button>
                 </div>
              </div>
            )}
          </div>

          {/* Sticky Summary */}
          <aside className="hidden lg:block lg:col-span-4 space-y-6 sticky top-32">
            <div className="bg-white/80 backdrop-blur-md rounded-3xl p-6 sm:p-8 text-slate-800 shadow-[0_20px_50px_-15px_rgba(203,213,225,0.3)] border border-white/60 space-y-8 relative overflow-hidden">
               <div className="absolute top-0 right-0 w-32 h-32 bg-purple-50/50 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
               <h3 className="text-lg font-black uppercase tracking-widest flex items-center gap-3 border-b border-slate-100 pb-6 text-slate-800">
                 Bag Review <Smartphone className="h-4 w-4 text-[#5f259f]" />
               </h3>
               
                <div className="space-y-6 max-h-[300px] overflow-y-auto scrollbar-hide pr-2">
                  {cart.map((item, idx) => (
                    <div key={idx} className="flex gap-4 items-center justify-between group">
                      <div className="flex gap-4 items-center min-w-0 flex-1">
                        <div className="relative w-14 h-14 rounded-xl overflow-hidden bg-slate-50 border border-slate-100 shrink-0">
                          <Image src={item.image} alt={item.name} fill className="object-cover" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[11px] font-black uppercase truncate text-slate-800">{item.name}</p>
                          <p className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter mt-1">
                            Qty: {item.quantity} • {item.personalizationName || 'Standard'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <p className="text-[11px] font-black text-slate-800">₹{(item.price * item.quantity).toLocaleString()}</p>
                        <button 
                          onClick={() => removeFromCart(item.id)} 
                          className="p-1.5 rounded-lg bg-rose-50 text-rose-400 hover:bg-rose-500 hover:text-white transition-all cursor-pointer"
                          title="Remove item"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

               {/* Coupon Code Input & Available Coupons */}
               <div className="pt-6 border-t border-slate-100 space-y-4">
                 <div className="flex gap-2">
                   <Input 
                     type="text" 
                     placeholder="COUPON CODE" 
                     value={couponCodeInput} 
                     onChange={(e) => setCouponCodeInput(e.target.value.toUpperCase())}
                     className="h-10 bg-slate-50/40 border-slate-200/80 hover:border-slate-300 focus:bg-white focus:border-[#5f259f] focus-visible:ring-0 text-xs font-black uppercase tracking-wider text-center transition-all duration-300"
                   />
                   <Button 
                     onClick={handleApplyCoupon}
                     type="button"
                     className="h-10 bg-gradient-to-r from-[#5f259f] to-[#7c3aed] hover:from-[#4a1b7e] hover:to-[#6d28d9] active:scale-95 text-white rounded-xl text-[10px] font-black uppercase tracking-wider px-4 transition-all duration-300 shadow-sm"
                   >
                     Apply
                   </Button>
                 </div>

                 {appliedCoupon && (
                   <div className="flex justify-between items-center bg-emerald-50/50 border border-emerald-100 rounded-xl p-3 text-[10px] text-emerald-600 font-bold uppercase tracking-wider">
                     <span>{appliedCoupon.code} Applied!</span>
                     <button onClick={handleRemoveCoupon} className="text-slate-400 hover:text-slate-600 underline uppercase text-[8px] font-black tracking-widest ml-2">Remove</button>
                   </div>
                 )}

                 {availableCoupons && availableCoupons.length > 0 && (
                   <div className="space-y-2">
                     <p className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em]">Available Coupons:</p>
                     <div className="flex flex-wrap gap-2">
                       {availableCoupons.map((cpn: any) => (
                         <button
                           key={cpn.id}
                           onClick={() => {
                             setCouponCodeInput(cpn.code);
                             setAppliedCoupon(cpn);
                             toast({ title: "Coupon Applied", description: `${cpn.code} applied successfully!` });
                           }}
                           className="bg-purple-50/50 hover:bg-purple-100/50 border border-purple-100/50 rounded-lg px-2.5 py-1 text-[9px] font-black uppercase text-[#5f259f] tracking-wider transition-all cursor-pointer hover:border-purple-300"
                         >
                           {cpn.code} ({cpn.discountType === 'Percentage' ? `${cpn.value}% OFF` : `₹${cpn.value} OFF`})
                         </button>
                       ))}
                     </div>
                   </div>
                 )}
               </div>

               <div className="pt-6 border-t border-slate-100 space-y-3">
                  <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-slate-400"><span>Subtotal</span><span className="text-slate-800">₹{subtotal.toLocaleString()}</span></div>
                  {discount > 0 && (
                    <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-emerald-600"><span>Discount</span><span>-₹{discount.toLocaleString()}</span></div>
                  )}
                  <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-slate-400"><span>Shipping</span><span className={cn(shipping === 0 ? "text-emerald-600 font-bold" : "text-slate-800")}>{shipping === 0 ? 'FREE' : `₹${shipping}`}</span></div>
                  <div className="flex justify-between items-end pt-4 border-t border-slate-50">
                     <div className="space-y-0.5">
                       <p className="text-[8px] font-black text-slate-400 uppercase tracking-[0.3em]">Payable Amount</p>
                       <p className="text-3xl font-black text-slate-900">₹{total.toLocaleString()}</p>
                     </div>
                  </div>
               </div>
            </div>
          </aside>
        </div>
      </div>
      <div className="hidden lg:block">
        <Footer />
      </div>
    </main>
  );
}
