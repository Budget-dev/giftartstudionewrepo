'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';
import { Button } from '@/components/ui/button';
import { CheckCircle2, ShoppingBag, ArrowRight, Star, Heart, Sparkles, MapPin, ShieldCheck } from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useCart } from '@/lib/store/cart-context';

function SuccessContent() {
  const { clearCart } = useCart();
  const searchParams = useSearchParams();
  const orderParamId = searchParams.get('id') || searchParams.get('orderId');
  const paymentMethod = searchParams.get('payment');
  const paymentId = searchParams.get('paymentId');
  const paidAmount = searchParams.get('paid');
  const remainingCod = searchParams.get('remaining');
  const [orderId, setOrderId] = useState('');

  useEffect(() => {
    if (orderParamId) {
      setOrderId(orderParamId.length > 10 ? `GS-${orderParamId.slice(0, 8).toUpperCase()}` : orderParamId);
    } else {
      setOrderId(`GS-${Math.floor(100000 + Math.random() * 900000)}`);
    }
    clearCart();
  }, [orderParamId, clearCart]);

  return (
    <div className="container mx-auto px-4 pt-28 pb-12 lg:pt-36 lg:pb-16 text-center relative z-10">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.6, type: 'spring' }}
        className="max-w-2xl mx-auto space-y-12"
      >
        {/* Animated Icon */}
        <div className="relative w-32 h-32 mx-auto">
           <motion.div 
            initial={{ scale: 0 }} 
            animate={{ scale: 1 }} 
            transition={{ delay: 0.2, type: 'spring' }}
            className="absolute inset-0 bg-[#5f259f] rounded-full shadow-[0_20px_50px_rgba(95,37,159,0.3)] flex items-center justify-center text-white"
           >
              <CheckCircle2 className="h-16 w-16" />
           </motion.div>
           <motion.div 
            animate={{ rotate: 360 }} 
            transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
            className="absolute -inset-4 border-2 border-dashed border-purple-200 rounded-full"
           />
           <Sparkles className="absolute -top-4 -right-4 h-8 w-8 text-amber-400 animate-pulse" />
        </div>
        
        <div className="space-y-4">
          <h1 className="text-4xl md:text-6xl font-headline font-black text-slate-800 tracking-tight">Order Placed Successfully!</h1>
          <p className="text-lg text-slate-500 font-medium max-w-lg mx-auto">
            Your handcrafted treasures are now being prepared with love. We&apos;ve received your order and are processing it.
          </p>
        </div>

        <div className="bg-white p-8 md:p-10 rounded-[3rem] shadow-xl shadow-slate-100 border border-slate-50 grid gap-6 text-left relative overflow-hidden">
           <div className="absolute top-0 right-0 w-32 h-32 bg-purple-50 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
           
           <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 pb-6 border-b border-slate-50">
             <div className="space-y-1">
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Order Reference</p>
               <p className="text-xl font-black text-slate-800">{orderId}</p>
               {paymentId && (
                 <p className="text-[10px] font-mono font-bold text-slate-500">
                   Payment ID: <span className="text-[#5f259f]">{paymentId}</span>
                 </p>
               )}
             </div>
             <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-end">
               {paymentMethod === 'full' || paymentMethod === 'razorpay' ? (
                 <div className="bg-gradient-to-r from-purple-50 to-pink-50 text-[#5f259f] px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border border-purple-200 flex items-center gap-1.5 shadow-2xs">
                   <ShieldCheck className="h-3.5 w-3.5 text-[#5f259f]" />
                   PAID IN FULL VIA RAZORPAY {paidAmount ? `(₹${Number(paidAmount).toLocaleString()})` : ''}
                 </div>
               ) : (
                 <div className="bg-amber-50 text-amber-800 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border border-amber-200 flex flex-col sm:items-end gap-0.5 shadow-2xs">
                   <div className="flex items-center gap-1.5 text-[#5f259f]">
                     <ShieldCheck className="h-3.5 w-3.5 text-[#5f259f]" />
                     <span>₹{paidAmount || '100'} ADVANCE PAID VIA RAZORPAY</span>
                   </div>
                   {remainingCod && Number(remainingCod) > 0 && (
                     <span className="text-amber-700 font-bold text-[9px]">
                       Cash Due on Delivery: ₹{Number(remainingCod).toLocaleString()}
                     </span>
                   )}
                 </div>
               )}
             </div>
           </div>

           <div className="grid md:grid-cols-2 gap-8">
             <div className="space-y-4">
               <div className="flex items-center gap-3">
                 <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center text-[#5f259f]">
                   <Star className="h-5 w-5 fill-[#5f259f]" />
                 </div>
                 <div className="space-y-0.5">
                   <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Estimated Delivery</p>
                   <p className="text-xs font-bold text-slate-700">2-4 Business Days</p>
                 </div>
               </div>
             </div>
             <div className="space-y-4">
               <div className="flex items-center gap-3">
                 <div className="w-10 h-10 bg-rose-50 rounded-xl flex items-center justify-center text-rose-500">
                   <Heart className="h-5 w-5 fill-rose-500" />
                 </div>
                 <div className="space-y-0.5">
                   <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Rewards Earned</p>
                   <p className="text-xs font-bold text-slate-700">120 Magic Points</p>
                 </div>
               </div>
             </div>
           </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-5 justify-center pt-6">
          <Button asChild size="lg" className="rounded-2xl bg-[#5f259f] hover:bg-[#4a1b7e] text-white px-12 h-16 text-xs font-black uppercase tracking-widest shadow-xl shadow-purple-200 active:scale-95 transition-all gap-3">
            <Link href="/"><ShoppingBag className="h-5 w-5" /> Back to Studio</Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="rounded-2xl border-2 border-slate-200 text-slate-600 hover:bg-slate-50 h-16 text-xs font-black uppercase tracking-widest px-10 transition-all active:scale-95 gap-3">
            <Link href="/account"><ArrowRight className="h-5 w-5" /> View My Orders</Link>
          </Button>
        </div>
        
        <div className="flex items-center justify-center gap-3 text-[10px] font-black uppercase tracking-[0.2em] text-slate-300">
           <MapPin className="h-3 w-3" /> Crafted in Noida, UP • Delivered Worldwide
        </div>
      </motion.div>
    </div>
  );
}

export default function SuccessPage() {
  return (
    <main className="min-h-screen bg-[#FDFDFD] relative overflow-x-hidden">
      <Navbar />
      <Suspense fallback={<div className="py-40 text-center text-slate-400 font-bold">Loading order details...</div>}>
        <SuccessContent />
      </Suspense>
      <div className="hidden lg:block">
        <Footer />
      </div>
    </main>
  );
}
