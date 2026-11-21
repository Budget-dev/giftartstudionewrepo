'use client';

import { useState } from 'react';
import { Navbar } from '@/components/navbar';
import { Lock, Mail, ArrowRight, Loader2, ShieldCheck, Sparkles, Truck, KeyRound } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useRouter } from 'next/navigation';
import { useAuth, useFirestore } from '@/firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

const ADMIN_EMAIL = "rohanswakkargiftartstudio@gmail.com";
const SHIPPING_PASSCODES = ["SHIP2024", "SHIPPING", "DELIVERY786", "GIFTART_SHIP"];

export default function AdminLoginPage() {
  const [activeTab, setActiveTab] = useState<'admin' | 'shipping'>('admin');
  const [loading, setLoading] = useState(false);
  const [isSetupMode, setIsSetupMode] = useState(false);
  
  // Admin form
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Shipping form
  const [shippingId, setShippingId] = useState('');
  const [shippingPasscode, setShippingPasscode] = useState('');
  
  const auth = useAuth();
  const db = useFirestore();
  const router = useRouter();
  const { toast } = useToast();

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (email !== ADMIN_EMAIL) {
      toast({ variant: "destructive", title: "Access Denied", description: "This portal is for administrators only." });
      return;
    }
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      localStorage.setItem('admin_role', 'admin');
      localStorage.removeItem('shipping_staff_name');
      document.cookie = "admin_role=admin; path=/; max-age=86400";
      toast({ title: "Welcome Back, Chief!", description: "Admin dashboard access granted." });
      router.push('/admin/dashboard');
    } catch (error: any) {
      toast({ variant: "destructive", title: "Login Failed", description: error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleShippingLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const cleanPass = shippingPasscode.trim().toUpperCase();
    const cleanId = shippingId.trim().toLowerCase();

    // Validate shipping credentials
    const isValidPass = SHIPPING_PASSCODES.includes(cleanPass) || cleanPass === "SHIP123";
    const isValidId = cleanId.includes("shipping") || cleanId.includes("dispatch") || cleanId.includes("logistics") || cleanId.length >= 3;

    if (!isValidPass) {
      setLoading(false);
      toast({ 
        variant: "destructive", 
        title: "Invalid Shipping Passcode", 
        description: "Please enter the authorized shipping staff passcode (e.g., SHIP2024)." 
      });
      return;
    }

    try {
      // Store shipping session
      localStorage.setItem('admin_role', 'shipping');
      localStorage.setItem('shipping_staff_name', shippingId.trim() || 'Logistics Staff');
      document.cookie = "admin_role=shipping; path=/; max-age=86400";

      toast({ 
        title: "Shipping Access Granted", 
        description: "Fulfillment & Orders portal unlocked for shipping personnel." 
      });

      router.push('/admin/orders');
    } catch (error: any) {
      toast({ variant: "destructive", title: "Login Error", description: error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleAdminSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (email !== ADMIN_EMAIL) {
      toast({ variant: "destructive", title: "Invalid Email", description: "Setup is restricted to the pre-authorized admin email." });
      return;
    }
    
    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      await updateProfile(user, { displayName: 'Super Admin' });

      await setDoc(doc(db, 'users', user.uid), {
        uid: user.uid,
        displayName: 'Super Admin',
        email: email,
        role: 'admin',
        createdAt: serverTimestamp()
      });

      localStorage.setItem('admin_role', 'admin');
      document.cookie = "admin_role=admin; path=/; max-age=86400";

      toast({ title: "Admin Initialized!", description: "Permissions granted successfully." });
      router.push('/admin/dashboard');
    } catch (error: any) {
      toast({ variant: "destructive", title: "Setup Failed", description: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex flex-col bg-slate-900 overflow-x-hidden">
      <Navbar />
      
      <div className="flex-1 flex items-center justify-center p-4 py-12">
        <div className="w-full max-w-md bg-white rounded-[2.5rem] p-8 md:p-10 shadow-2xl border border-slate-800 text-center space-y-6 relative overflow-hidden">
          
          {/* Role Tabs */}
          <div className="grid grid-cols-2 p-1.5 bg-slate-100 rounded-2xl gap-1">
            <button
              type="button"
              onClick={() => setActiveTab('admin')}
              className={cn(
                "py-2.5 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5",
                activeTab === 'admin' 
                  ? "bg-white text-indigo-700 shadow-sm" 
                  : "text-slate-500 hover:text-slate-800"
              )}
            >
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
              <span>Admin Portal</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('shipping')}
              className={cn(
                "py-2.5 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5",
                activeTab === 'shipping' 
                  ? "bg-white text-purple-700 shadow-sm" 
                  : "text-slate-500 hover:text-slate-800"
              )}
            >
              <Truck className="w-3.5 h-3.5 text-purple-600" />
              <span>Shipping Staff</span>
            </button>
          </div>

          {activeTab === 'admin' ? (
            /* ADMIN LOGIN FORM */
            <div className="space-y-5 animate-in fade-in duration-200">
              <div className="space-y-1">
                <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center mx-auto text-indigo-600 mb-2 shadow-inner">
                  <ShieldCheck className="h-6 w-6" />
                </div>
                <h1 className="text-2xl font-headline font-black text-slate-800">
                  Chief <span className="text-indigo-600 italic">{isSetupMode ? 'Setup' : 'Login'}</span>
                </h1>
                <p className="text-[11px] text-slate-500 font-medium">
                  {isSetupMode ? 'Claim your Super Admin spot.' : 'Full access to analytics, products, and finances.'}
                </p>
              </div>

              <form onSubmit={isSetupMode ? handleAdminSetup : handleAdminLogin} className="space-y-3.5 text-left">
                <div className="space-y-1">
                  <Label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-1">Admin Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300" />
                    <Input 
                      required
                      type="email" 
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder={ADMIN_EMAIL} 
                      className="pl-11 h-12 rounded-xl border-2 focus-visible:ring-indigo-500 bg-slate-50/50" 
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-1">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300" />
                    <Input 
                      required
                      type="password" 
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="••••••••" 
                      className="pl-11 h-12 rounded-xl border-2 focus-visible:ring-indigo-500 bg-slate-50/50" 
                    />
                  </div>
                </div>

                <Button 
                  disabled={loading}
                  className="w-full h-12 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-black uppercase tracking-widest text-[10px] gap-2 shadow-lg"
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <>{isSetupMode ? 'Initialize' : 'Enter Dashboard'} <ArrowRight className="h-4 w-4" /></>}
                </Button>
              </form>

              <div className="pt-2">
                <button 
                  onClick={() => setIsSetupMode(!isSetupMode)}
                  className="flex items-center justify-center gap-2 w-full text-[9px] font-black uppercase tracking-[0.2em] text-indigo-400 hover:text-indigo-600 transition-colors"
                >
                  <Sparkles className="h-3 w-3" />
                  {isSetupMode ? 'Standard login' : 'First-Time Setup'}
                </button>
              </div>
            </div>
          ) : (
            /* SHIPPING STAFF LOGIN FORM */
            <div className="space-y-5 animate-in fade-in duration-200">
              <div className="space-y-1">
                <div className="w-12 h-12 bg-purple-50 rounded-2xl flex items-center justify-center mx-auto text-purple-600 mb-2 shadow-inner">
                  <Truck className="h-6 w-6" />
                </div>
                <h1 className="text-2xl font-headline font-black text-slate-800">
                  Shipping <span className="text-purple-600 italic">Personnel</span>
                </h1>
                <p className="text-[11px] text-slate-500 font-medium">
                  Role-based access to customer delivery orders and packing dispatch.
                </p>
              </div>

              <form onSubmit={handleShippingLogin} className="space-y-3.5 text-left">
                <div className="space-y-1">
                  <Label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-1">Staff ID or Name</Label>
                  <div className="relative">
                    <Truck className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300" />
                    <Input 
                      required
                      type="text" 
                      value={shippingId}
                      onChange={e => setShippingId(e.target.value)}
                      placeholder="e.g. shipping@giftartstudio.com or Dispatch Desk" 
                      className="pl-11 h-12 rounded-xl border-2 focus-visible:ring-purple-500 bg-slate-50/50" 
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <Label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-1">Shipping Passcode / PIN</Label>
                  <div className="relative">
                    <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300" />
                    <Input 
                      required
                      type="password" 
                      value={shippingPasscode}
                      onChange={e => setShippingPasscode(e.target.value)}
                      placeholder="Enter passkey (e.g. SHIP2024)" 
                      className="pl-11 h-12 rounded-xl border-2 focus-visible:ring-purple-500 bg-slate-50/50" 
                    />
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1 ml-1">Default staff key: <code className="bg-slate-100 text-purple-700 font-mono px-1.5 py-0.5 rounded">SHIP2024</code></p>
                </div>

                <Button 
                  disabled={loading}
                  className="w-full h-12 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-black uppercase tracking-widest text-[10px] gap-2 shadow-lg"
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Access Orders for Shipment <ArrowRight className="h-4 w-4" /></>}
                </Button>
              </form>

              <div className="p-3 bg-purple-50/70 border border-purple-100 rounded-xl text-left">
                <p className="text-[10px] text-purple-800 font-bold">🔒 Restricted Access Policy:</p>
                <p className="text-[10px] text-purple-600 mt-0.5">Shipping personnel can only view and manage orders requiring dispatch. Financial revenue, catalogs, and store settings are restricted.</p>
              </div>
            </div>
          )}

        </div>
      </div>
    </main>
  );
}
