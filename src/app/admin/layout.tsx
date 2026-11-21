'use client';

import { AdminSidebar } from '@/components/admin/admin-sidebar';
import { Toaster } from '@/components/ui/toaster';
import { useUser, useDoc, useFirestore, useCollection } from '@/firebase';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { 
  Loader2, 
  Lock, 
  Search, 
  Bell, 
  ExternalLink, 
  ChevronDown, 
  User, 
  LogOut 
} from 'lucide-react';
import { doc, collection, query, where } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { useAuth } from '@/firebase';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";

const SUPER_ADMIN_EMAIL = "rohanswakkargiftartstudio@gmail.com";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading: authLoading } = useUser();
  const db = useFirestore();
  const auth = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [globalSearch, setGlobalSearch] = useState('');
  const [adminRole, setAdminRole] = useState<string | null>(null);
  const [shippingStaffName, setShippingStaffName] = useState<string>('');

  const isLoginPage = pathname === '/admin/login';
  const loading = authLoading;

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedRole = localStorage.getItem('admin_role');
      setAdminRole(storedRole);
      setShippingStaffName(localStorage.getItem('shipping_staff_name') || 'Shipping Logistics Staff');
    }
  }, [pathname]);

  const isShippingRole = adminRole === 'shipping';

  // Real pending notifications / orders count
  const pendingOrdersQuery = useMemo(() => {
    if (!db) return null;
    return query(collection(db, 'orders'), where('status', '==', 'Pending'));
  }, [db]);
  const { data: pendingOrders } = useCollection<any>(pendingOrdersQuery);
  const notificationCount = pendingOrders?.length || 0;

  useEffect(() => {
    if (!isLoginPage) {
      if (isShippingRole) {
        // Shipping personnel is restricted ONLY to orders
        if (!pathname.startsWith('/admin/orders')) {
          router.push('/admin/orders');
        }
        return;
      }

      if (!loading) {
        if (!user) {
          router.push('/admin/login');
        } else if (user.email !== SUPER_ADMIN_EMAIL) {
          router.push('/');
        }
      }
    }
  }, [user, loading, router, isLoginPage, isShippingRole, pathname]);

  const handleSignOut = async () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('admin_role');
      localStorage.removeItem('shipping_staff_name');
      document.cookie = "admin_role=; path=/; max-age=0";
    }
    await signOut(auth);
    router.push('/admin/login');
  };

  // Handle global search on enter
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (globalSearch.trim()) {
      router.push(`/admin/orders?search=${encodeURIComponent(globalSearch.trim())}`);
    }
  };

  if (isLoginPage) {
    return <>{children}</>;
  }

  // Allow Shipping Personnel directly into /admin/orders
  if (isShippingRole) {
    return (
      <div className="flex min-h-screen bg-[#f8f9fe]">
        <AdminSidebar />
        <main className="flex-1 flex flex-col min-w-0 overflow-x-hidden">
          {/* Shipping Top Header */}
          <header className="h-18 bg-white/90 backdrop-blur-md border-b border-slate-100 flex items-center justify-between px-8 sticky top-0 z-30 transition-all">
            <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-md">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={globalSearch}
                onChange={(e) => setGlobalSearch(e.target.value)}
                placeholder="Search orders to pack or ship..."
                className="w-full h-10 pl-11 pr-4 rounded-full bg-slate-50 border border-slate-200/70 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-400 text-xs font-medium text-slate-800 placeholder:text-slate-400 transition-all shadow-inner"
              />
            </form>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-purple-50 border border-purple-200 text-purple-700 font-bold text-xs">
                <span className="w-2 h-2 rounded-full bg-purple-600 animate-pulse" />
                <span>Shipping &amp; Fulfillment Portal</span>
              </div>

              {/* Shipping Staff Profile */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-2.5 p-1.5 pl-2 rounded-full hover:bg-slate-50 transition-colors border border-slate-200/60">
                    <div className="w-7 h-7 rounded-full bg-purple-600 text-white font-extrabold text-xs flex items-center justify-center shadow-sm">
                      S
                    </div>
                    <span className="text-xs font-bold text-slate-700 hidden md:inline">Shipping Staff</span>
                    <ChevronDown className="w-3 h-3 text-slate-400 mr-1" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 rounded-2xl p-2 shadow-xl border-slate-100">
                  <div className="px-3 py-2">
                    <p className="text-xs font-black text-slate-800">{shippingStaffName}</p>
                    <p className="text-[10px] text-purple-600 font-bold">Role: Shipping Personnel</p>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={handleSignOut}
                    className="flex items-center gap-2 text-xs font-bold text-rose-600 hover:text-rose-700 cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" /> Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </header>

          <div className="p-6 md:p-8 flex-1">
            {children}
          </div>
        </main>
        <Toaster />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center space-y-4">
          <Loader2 className="h-10 w-10 animate-spin text-purple-600 mx-auto" />
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Loading Admin Studio...</p>
        </div>
      </div>
    );
  }

  if (!user || user.email !== SUPER_ADMIN_EMAIL) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 p-4">
        <div className="max-w-md w-full bg-white rounded-[2.5rem] p-10 text-center shadow-2xl space-y-6">
          <div className="w-16 h-16 bg-rose-50 rounded-2xl flex items-center justify-center text-rose-500 mx-auto">
            <Lock className="h-8 w-8" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-black text-slate-800">Access Restricted</h2>
            <p className="text-xs text-slate-500 font-medium">
              This panel is reserved for authorized staff. Unauthorized access attempts are restricted.
            </p>
          </div>
          <Button asChild className="w-full h-12 rounded-xl bg-slate-900 font-bold text-xs uppercase tracking-wider">
            <Link href="/admin/login">Go to Staff Login</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#f8f9fe]">
      <AdminSidebar />
      <main className="flex-1 flex flex-col min-w-0 overflow-x-hidden">
        {/* Top Header matching reference image */}
        <header className="h-18 bg-white/90 backdrop-blur-md border-b border-slate-100 flex items-center justify-between px-8 sticky top-0 z-30 transition-all">
          {/* Search bar matching: "Search orders, customers... (⌘ + K)" */}
          <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={globalSearch}
              onChange={(e) => setGlobalSearch(e.target.value)}
              placeholder="Search orders, customers... (⌘ + K)"
              className="w-full h-10 pl-11 pr-4 rounded-full bg-slate-50 border border-slate-200/70 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-400 text-xs font-medium text-slate-800 placeholder:text-slate-400 transition-all shadow-inner"
            />
          </form>

          {/* Right Header Badges & Profile */}
          <div className="flex items-center gap-5">
            {/* Live Store Pill */}
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-100/80">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[11px] font-bold text-emerald-700">Live Store</span>
            </div>

            {/* Notification Bell */}
            <Link 
              href="/admin/orders" 
              className="relative p-2 rounded-xl text-slate-500 hover:bg-slate-100 transition-colors"
              title="Pending Orders"
            >
              <Bell className="w-4 h-4" />
              {notificationCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 bg-rose-500 text-white text-[9px] font-black rounded-full flex items-center justify-center px-1 shadow-sm">
                  {notificationCount > 9 ? '9+' : notificationCount}
                </span>
              )}
            </Link>

            {/* Admin Profile Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2.5 p-1.5 pl-2 rounded-full hover:bg-slate-50 transition-colors border border-slate-200/60">
                  <div className="w-7 h-7 rounded-full bg-purple-600 text-white font-extrabold text-xs flex items-center justify-center shadow-sm">
                    A
                  </div>
                  <span className="text-xs font-bold text-slate-700 hidden md:inline">Admin</span>
                  <ChevronDown className="w-3 h-3 text-slate-400 mr-1" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 rounded-2xl p-2 shadow-xl border-slate-100">
                <div className="px-3 py-2">
                  <p className="text-xs font-black text-slate-800">GiftArtStudio Owner</p>
                  <p className="text-[10px] text-slate-400 font-medium truncate">{user.email}</p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/" target="_blank" className="flex items-center gap-2 text-xs font-bold text-slate-600 cursor-pointer">
                    <ExternalLink className="w-3.5 h-3.5" /> View Public Store
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/admin/products" className="flex items-center gap-2 text-xs font-bold text-slate-600 cursor-pointer">
                    <User className="w-3.5 h-3.5" /> Manage Products
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={handleSignOut}
                  className="flex items-center gap-2 text-xs font-bold text-rose-600 hover:text-rose-700 cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" /> Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Page Content */}
        <div className="p-6 md:p-8 flex-1">
          {children}
        </div>
      </main>
      <Toaster />
    </div>
  );
}
