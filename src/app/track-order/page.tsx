'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';
import { KidsDecor } from '@/components/kids-decor';
import { 
  Truck, 
  Search, 
  Package, 
  MapPin, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  ShoppingBag, 
  Loader2,
  Calendar,
  Phone,
  MessageCircle
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useFirestore } from '@/firebase';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import Image from 'next/image';
import Link from 'next/link';

const TRACKING_STEPS = [
  { status: 'Order Placed', label: 'Order Placed', desc: 'Crafting process started', icon: Clock },
  { status: 'Processing', label: 'Processing', desc: 'Customization in progress', icon: Package },
  { status: 'Packed', label: 'Packed', desc: 'Securely packaged for transit', icon: ShoppingBag },
  { status: 'Shipped', label: 'Shipped', desc: 'Handed over to courier', icon: Truck },
  { status: 'Out for Delivery', label: 'Out for Delivery', desc: 'Arriving at your location today', icon: MapPin },
  { status: 'Delivered', label: 'Delivered', desc: 'Delivered to your doorstep', icon: CheckCircle2 },
];

function TrackOrderContent() {
  const searchParams = useSearchParams();
  const db = useFirestore();

  const [searchInput, setSearchInput] = useState(searchParams.get('id') || '');
  const [loading, setLoading] = useState(false);
  const [order, setOrder] = useState<any | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const performSearch = async (term: string) => {
    const clean = term.trim().replace(/^#/, '');
    if (!clean) {
      setErrorMsg('Please enter an Order ID, Phone Number, or Payment ID');
      return;
    }
    if (!db) {
      setErrorMsg('Connecting to database... please wait a moment.');
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    setOrder(null);
    setHasSearched(true);

    try {
      // 1. Try direct doc lookup by ID
      const directRef = doc(db, 'orders', clean);
      const directSnap = await getDoc(directRef);
      if (directSnap.exists()) {
        setOrder({ id: directSnap.id, ...directSnap.data() });
        setLoading(false);
        return;
      }

      // 2. Try query by phone number
      const qPhone = query(collection(db, 'orders'), where('phone', '==', clean));
      const snapPhone = await getDocs(qPhone);
      if (!snapPhone.empty) {
        const first = snapPhone.docs[0];
        setOrder({ id: first.id, ...first.data() });
        setLoading(false);
        return;
      }

      // 3. Try query by razorpayPaymentId or razorpayOrderId
      const qPay = query(collection(db, 'orders'), where('razorpayPaymentId', '==', clean));
      const snapPay = await getDocs(qPay);
      if (!snapPay.empty) {
        const first = snapPay.docs[0];
        setOrder({ id: first.id, ...first.data() });
        setLoading(false);
        return;
      }

      // 4. Try case-insensitive or partial phone matching without +91
      const normalizedPhone = clean.replace(/^\+91/, '').replace(/\s+/g, '');
      if (normalizedPhone.length >= 10) {
        const qNorm = query(collection(db, 'orders'), where('phone', '==', normalizedPhone));
        const snapNorm = await getDocs(qNorm);
        if (!snapNorm.empty) {
          const first = snapNorm.docs[0];
          setOrder({ id: first.id, ...first.data() });
          setLoading(false);
          return;
        }
      }

      setErrorMsg(`No order found matching "${term}". Please check the Order ID or phone number used during checkout.`);
    } catch (err: any) {
      console.error('Track order lookup error:', err);
      setErrorMsg('Failed to query order details. Please verify your internet connection or contact support.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const initialId = searchParams.get('id');
    if (initialId && db) {
      performSearch(initialId);
    }
  }, [searchParams, db]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    performSearch(searchInput);
  };

  const getActiveStep = () => {
    if (!order) return 0;
    const tracking = (order.trackingStatus || '').toLowerCase();
    const status = (order.status || '').toLowerCase();

    if (tracking.includes('delivered') || status === 'delivered') return 5;
    if (tracking.includes('out for delivery')) return 4;
    if (tracking.includes('shipped') || tracking.includes('in transit') || status === 'shipped') return 3;
    if (tracking.includes('packed')) return 2;
    if (tracking.includes('processing') || status === 'processing') return 1;
    return 0; // Order Placed
  };

  const activeStep = getActiveStep();

  return (
    <div className="container mx-auto px-4 py-12 relative z-10 max-w-4xl">
      {/* Search Input Box */}
      <div className="bg-white rounded-[2.5rem] p-8 md:p-12 shadow-xl border border-sky-50 text-center space-y-6">
        <div className="w-16 h-16 bg-sky-50 rounded-2xl flex items-center justify-center mx-auto text-sky-600 shadow-inner">
          <Package className="h-8 w-8" />
        </div>

        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-slate-800">Enter Your Order Details</h2>
          <p className="text-sm text-slate-500 font-medium max-w-md mx-auto">
            Search by Order ID (from your confirmation screen), Mobile Number, or Razorpay Payment ID.
          </p>
        </div>

        <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-3 max-w-xl mx-auto">
          <Input 
            placeholder="e.g. Order ID, Phone (+91), or Payment ID" 
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="h-14 rounded-2xl border-2 focus-visible:ring-primary text-base font-medium px-5 flex-1" 
          />
          <Button 
            type="submit"
            disabled={loading}
            className="h-14 px-8 bg-primary-foreground hover:bg-primary-foreground/90 text-white rounded-2xl font-bold text-sm tracking-wide gap-2 shadow-lg shadow-sky-500/20 shrink-0"
          >
            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Search className="h-5 w-5" />}
            {loading ? 'Searching...' : 'Track Now'}
          </Button>
        </form>

        {errorMsg && (
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-sm font-medium flex items-center justify-center gap-2 max-w-xl mx-auto">
            <AlertCircle className="h-5 w-5 shrink-0 text-rose-500" />
            <span>{errorMsg}</span>
          </div>
        )}
      </div>

      {/* Result Card */}
      {order && (
        <div className="mt-10 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {/* Header Summary */}
          <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <div className="flex items-center gap-3">
                <h3 className="text-xl font-bold text-slate-900">Order #{order.id.slice(-8).toUpperCase()}</h3>
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-sky-50 text-sky-700 border border-sky-200">
                  {order.trackingStatus || order.status || 'Order Placed'}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1 flex items-center gap-2">
                <Calendar className="h-3.5 w-3.5" />
                Placed on {order.createdAt?.seconds ? new Date(order.createdAt.seconds * 1000).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Recently'}
                {order.customerName && ` • Recipient: ${order.customerName}`}
              </p>
            </div>
            <div className="text-left md:text-right">
              <span className="text-xs text-slate-400 block font-medium">Total Amount</span>
              <span className="text-2xl font-black text-slate-900">₹{order.total?.toLocaleString() || 0}</span>
              <span className="text-[11px] text-emerald-600 block font-semibold mt-0.5">
                {order.paymentType === 'cod_partial' ? `₹${order.paidAmount || 100} Advance Paid (₹${order.codBalance || 0} on Delivery)` : 'Full Payment Verified'}
              </span>
            </div>
          </div>

          {/* Stepper Timeline */}
          <div className="bg-white rounded-3xl p-6 md:p-10 shadow-sm border border-slate-100">
            <h4 className="text-base font-bold text-slate-900 mb-8">Delivery Progress</h4>
            
            <div className="grid grid-cols-2 md:grid-cols-6 gap-6 md:gap-2 relative">
              {TRACKING_STEPS.map((step, idx) => {
                const Icon = step.icon;
                const isCompleted = idx < activeStep;
                const isCurrent = idx === activeStep;

                return (
                  <div key={idx} className="flex flex-col items-center text-center group">
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all ${
                      isCompleted 
                        ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' 
                        : isCurrent 
                        ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30 ring-4 ring-purple-100 animate-pulse' 
                        : 'bg-slate-100 text-slate-400'
                    }`}>
                      <Icon className="h-6 w-6" />
                    </div>
                    <span className={`text-xs font-bold mt-3 ${isCompleted || isCurrent ? 'text-slate-900' : 'text-slate-400'}`}>
                      {step.label}
                    </span>
                    <span className="text-[10px] text-slate-400 font-medium mt-0.5 leading-tight max-w-[120px]">
                      {step.desc}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Details Grid: Address, Payment & Items */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Delivery Address */}
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 space-y-3">
              <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <MapPin className="h-4 w-4 text-purple-600" /> Delivery Address
              </h4>
              <div className="text-sm text-slate-600 space-y-1 bg-slate-50 p-4 rounded-2xl">
                <p className="font-bold text-slate-800">{order.customerName}</p>
                {order.shippingAddress ? (
                  <>
                    <p>{order.shippingAddress.line1} {order.shippingAddress.line2}</p>
                    <p>{order.shippingAddress.city}, {order.shippingAddress.state} - {order.shippingAddress.pincode}</p>
                  </>
                ) : (
                  <p className="italic text-slate-400">Address recorded on order slip</p>
                )}
                {order.phone && <p className="font-medium text-slate-700 pt-1">Contact: {order.phone}</p>}
              </div>
            </div>

            {/* Payment Summary */}
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 space-y-3">
              <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" /> Payment & Receipt
              </h4>
              <div className="text-sm text-slate-600 space-y-2 bg-slate-50 p-4 rounded-2xl">
                <div className="flex justify-between">
                  <span>Method:</span>
                  <span className="font-semibold text-slate-800">{order.paymentMethod || 'Razorpay'}</span>
                </div>
                {order.razorpayPaymentId && (
                  <div className="flex justify-between text-xs">
                    <span>Payment ID:</span>
                    <span className="font-mono text-slate-700">{order.razorpayPaymentId}</span>
                  </div>
                )}
                <div className="flex justify-between border-t border-slate-200 pt-2 font-bold text-slate-900">
                  <span>Total Order:</span>
                  <span>₹{order.total?.toLocaleString() || 0}</span>
                </div>
                {order.paymentType === 'cod_partial' && (
                  <div className="flex justify-between text-xs text-amber-700 font-semibold">
                    <span>Balance Due on Delivery:</span>
                    <span>₹{order.codBalance?.toLocaleString() || 0}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Ordered Items */}
          {order.items && order.items.length > 0 && (
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 space-y-4">
              <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <ShoppingBag className="h-4 w-4 text-sky-600" /> Ordered Items ({order.items.length})
              </h4>
              <div className="divide-y divide-slate-100">
                {order.items.map((item: any, idx: number) => (
                  <div key={idx} className="py-3 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600 font-bold text-sm shrink-0">
                        {item.name?.slice(0, 1) || 'G'}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-800">{item.name}</p>
                        <div className="flex flex-wrap gap-2 text-xs text-slate-500 mt-0.5">
                          <span>Qty: {item.qty || 1}</span>
                          {item.customization && <span className="text-purple-600 font-medium">Personalized: &quot;{item.customization}&quot;</span>}
                        </div>
                      </div>
                    </div>
                    <span className="text-sm font-bold text-slate-900 shrink-0">
                      ₹{((item.price || 0) * (item.qty || 1)).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Support CTA */}
          <div className="p-6 rounded-3xl bg-sky-50 border border-sky-100 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <h5 className="font-bold text-slate-800 text-sm">Need help with this order?</h5>
              <p className="text-xs text-slate-500 mt-0.5">Our studio team is here to assist with dispatch updates and customizations.</p>
            </div>
            <Button asChild className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs gap-2 shrink-0">
              <a href="https://wa.me/919988776655?text=Hi%20GiftArtStudio,%20I%20need%20an%20update%20on%20my%20order" target="_blank" rel="noopener noreferrer">
                <MessageCircle className="h-4 w-4" /> Chat on WhatsApp
              </a>
            </Button>
          </div>
        </div>
      )}

      {/* Default Info Cards when no search made */}
      {!order && !hasSearched && (
        <div className="grid md:grid-cols-3 gap-6 mt-16">
          {[
            { icon: CheckCircle2, title: 'Order Placed', desc: 'Crafting process started instantly.' },
            { icon: MapPin, title: 'In Transit', desc: 'Real-time updates to your city.' },
            { icon: Truck, title: 'Delivered', desc: 'Safely handed over with care.' },
          ].map((item, i) => (
            <div key={i} className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 text-center border border-white/60 shadow-sm">
              <item.icon className="h-6 w-6 text-sky-500 mx-auto mb-3" />
              <h4 className="font-bold text-slate-800 text-sm">{item.title}</h4>
              <p className="text-xs text-slate-500 font-medium mt-1">{item.desc}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function TrackOrderPage() {
  return (
    <main className="min-h-screen bg-slate-50/50 relative overflow-x-hidden">
      <Navbar />
      <KidsDecor />

      <div className="bg-[linear-gradient(135deg,#F0F9FF,#E0F2FE)] pt-28 pb-16 lg:pt-36 text-center border-b border-sky-100">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl md:text-5xl font-headline font-black text-slate-800 mb-3">
            Track Your <span className="text-primary-foreground italic">Order</span>
          </h1>
          <p className="text-base text-slate-600 max-w-xl mx-auto font-medium">
            Follow the live handcrafted journey of your personalized gifts.
          </p>
        </div>
      </div>

      <Suspense fallback={
        <div className="py-20 text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-sky-500" />
        </div>
      }>
        <TrackOrderContent />
      </Suspense>

      <Footer />
    </main>
  );
}
