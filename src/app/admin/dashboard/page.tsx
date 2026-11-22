"use client";

import { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  ShoppingBag,
  Users,
  CreditCard,
  CheckCircle2,
  Clock,
  Truck,
  AlertCircle,
  Download,
  Search,
  ArrowUpRight,
  ArrowDownRight,
  MoreVertical,
  Eye,
  Calendar,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Package,
  Layers,
  ArrowRight,
  Mail,
  Smartphone,
  Share2,
  MapPin,
  ExternalLink
} from 'lucide-react';
import { useFirestore, useCollection, useDoc } from '@/firebase';
import { collection, query, orderBy, doc, updateDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { cn } from '@/lib/utils';

export default function AdminDashboard() {
  const db = useFirestore();
  const { toast } = useToast();

  // Filter & Search states
  const [searchTerm, setSearchTerm] = useState("");
  const [statusTab, setStatusTab] = useState<'All' | 'Pending' | 'Processing' | 'Shipped' | 'Delivered'>('All');
  const [paymentFilter, setPaymentFilter] = useState<'All' | 'Paid' | 'Pending' | 'COD'>('All');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Selected Order for Modal
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  // Real Collections from Firestore (NO MOCK DATA)
  const ordersQuery = useMemo(() => {
    if (!db) return null;
    return query(collection(db, 'orders'), orderBy('createdAt', 'desc'));
  }, [db]);
  const usersCol = useMemo(() => db ? collection(db, 'users') : null, [db]);
  const productsCol = useMemo(() => db ? collection(db, 'products') : null, [db]);
  const analyticsDocRef = useMemo(() => db ? doc(db, 'analytics', 'link_tracking') : null, [db]);

  const { data: orders, loading: ordersLoading } = useCollection<any>(ordersQuery);
  const { data: customers } = useCollection<any>(usersCol);
  const { data: products } = useCollection<any>(productsCol);
  const { data: analyticsData } = useDoc<any>(analyticsDocRef);

  // Real Metric Calculations & Customer Tracking
  const stats = useMemo(() => {
    const totalOrders = orders?.length || 0;
    const totalRevenue = orders?.reduce((acc: number, curr: any) => {
      const amount = Number(curr.total) || 0;
      return acc + amount;
    }, 0) || 0;
    const totalCustomers = customers?.length || 0;
    const pendingOrdersCount = orders?.filter((o: any) => (o.status || 'Pending').toLowerCase() === 'pending').length || 0;

    // Track login methods: Email vs Phone OTP
    const emailUsers = customers?.filter((u: any) =>
      u.email || u.loginMethod === 'email' || u.authProvider === 'email'
    ).length || 0;

    const phoneUsers = customers?.filter((u: any) =>
      u.phoneNumber || u.phone || u.loginMethod === 'phone' || u.authProvider === 'phone'
    ).length || 0;

    const linkClicks = Number(analyticsData?.linkClicks) || Number(analyticsData?.sharedLinkClicks) || 0;

    return {
      totalOrders,
      totalRevenue,
      totalCustomers,
      pendingOrdersCount,
      emailUsers,
      phoneUsers,
      linkClicks
    };
  }, [orders, customers, analyticsData]);

  // Tab counts
  const tabCounts = useMemo(() => {
    if (!orders) return { All: 0, Pending: 0, Processing: 0, Shipped: 0, Delivered: 0 };
    return {
      All: orders.length,
      Pending: orders.filter((o: any) => (o.status || 'Pending').toLowerCase() === 'pending').length,
      Processing: orders.filter((o: any) => (o.status || '').toLowerCase() === 'processing').length,
      Shipped: orders.filter((o: any) => (o.status || '').toLowerCase() === 'shipped').length,
      Delivered: orders.filter((o: any) => (o.status || '').toLowerCase() === 'delivered').length,
    };
  }, [orders]);

  // Filtered Orders
  const filteredOrders = useMemo(() => {
    if (!orders) return [];
    return orders.filter((order: any) => {
      // Tab filter
      if (statusTab !== 'All') {
        const orderStatus = (order.status || 'Pending').toLowerCase();
        if (orderStatus !== statusTab.toLowerCase()) return false;
      }

      // Payment filter
      if (paymentFilter !== 'All') {
        const payStatus = (order.paymentStatus || (order.paymentMethod === 'cod' ? 'COD' : 'Paid')).toLowerCase();
        if (paymentFilter === 'Paid' && !payStatus.includes('paid')) return false;
        if (paymentFilter === 'Pending' && !payStatus.includes('pending')) return false;
        if (paymentFilter === 'COD' && !payStatus.includes('cod')) return false;
      }

      // Search term
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const matchesId = (order.id || '').toLowerCase().includes(term);
        const matchesName = (order.customerName || order.userName || '').toLowerCase().includes(term);
        const matchesPhone = (order.phone || order.phoneNumber || '').toLowerCase().includes(term);
        const matchesEmail = (order.email || order.userEmail || '').toLowerCase().includes(term);
        if (!matchesId && !matchesName && !matchesPhone && !matchesEmail) return false;
      }

      return true;
    });
  }, [orders, statusTab, paymentFilter, searchTerm]);

  // Pagination
  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage) || 1;
  const paginatedOrders = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredOrders.slice(start, start + itemsPerPage);
  }, [filteredOrders, currentPage, itemsPerPage]);

  // Quick Status Update
  const updateStatus = async (orderId: string, newStatus: string) => {
    if (!db) return;
    try {
      await updateDoc(doc(db, 'orders', orderId), { status: newStatus });
      toast({ title: 'Status Updated', description: `Order is now marked as ${newStatus}` });
    } catch {
      toast({ variant: 'destructive', title: 'Update Failed', description: 'Could not update order status.' });
    }
  };

  // Export CSV
  const handleExportCSV = () => {
    if (!filteredOrders.length) {
      toast({ title: 'Nothing to export', description: 'No orders match current filters.' });
      return;
    }
    const headers = ['Order ID', 'Customer Name', 'Phone', 'Email', 'Amount (INR)', 'Payment Status', 'Order Status', 'Date'];
    const rows = filteredOrders.map((o: any) => [
      o.id,
      `"${o.customerName || 'Customer'}"`,
      `"${o.phone || ''}"`,
      `"${o.email || ''}"`,
      o.total || 0,
      o.paymentStatus || 'Paid',
      o.status || 'Pending',
      o.createdAt?.toDate ? o.createdAt.toDate().toISOString() : ''
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `giftart_orders_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast({ title: 'Export Complete', description: 'Orders CSV downloaded successfully.' });
  };

  return (
    <div className="space-y-7 animate-in fade-in duration-300">

      {/* ========================================================
          HERO BANNER (With 3D Teddy Art matching reference)
         ======================================================== */}
      <div className="relative bg-gradient-to-r from-purple-100/50 via-white to-pink-50/60 rounded-[2.2rem] border border-white/80 p-6 md:p-8 shadow-sm overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-6">

        {/* Soft Background Cloud Glows */}
        <div className="absolute top-0 right-1/4 w-60 h-60 bg-purple-200/30 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-10 w-72 h-72 bg-pink-100/40 rounded-full blur-3xl pointer-events-none" />

        {/* Left Breadcrumbs & Title */}
        <div className="space-y-1 relative z-10">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-400">
            <span>Dashboard</span>
            <span>&gt;</span>
            <span className="text-purple-600">Overview</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-800 tracking-tight">
            Orders &amp; Studio Activity
          </h1>
          <p className="text-xs md:text-sm font-semibold text-slate-500">
            Manage and track all real customer orders, payments, and live store metrics.
          </p>
        </div>

        {/* Right 3D Teddy Bear with Floating Hearts & Stars */}
        <div className="relative flex items-center justify-end z-10 self-center md:self-auto shrink-0">
          {/* Floating animated hearts */}
          <span className="absolute -top-3 left-4 text-pink-400 text-lg animate-bounce">💖</span>
          <span className="absolute top-2 -left-3 text-purple-400 text-sm">💜</span>
          <span className="absolute -bottom-1 left-2 text-amber-300 text-sm">⭐</span>

          <img
            src="/auth/teddy_gift.png"
            alt="3D Teddy with Gift"
            className="w-24 md:w-28 h-auto drop-shadow-md select-none transform hover:scale-105 transition-transform"
          />
        </div>
      </div>

      {/* ========================================================
          4 STAT CARDS (Live Data from Firestore)
         ======================================================== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">

        {/* Card 1: Total Orders */}
        <div className="bg-white rounded-[1.8rem] p-5 border border-slate-100 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div className="w-11 h-11 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center shadow-inner">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-extrabold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full flex items-center gap-0.5">
              <ArrowUpRight className="w-3 h-3" /> Live
            </span>
          </div>
          <div className="mt-4 flex items-end justify-between">
            <div>
              <p className="text-[11px] font-bold text-slate-400">Total Orders</p>
              <h3 className="text-2xl font-black text-slate-800 tracking-tight mt-0.5">
                {ordersLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : stats.totalOrders.toLocaleString()}
              </h3>
            </div>
            {/* Sparkline curve */}
            <svg className="w-20 h-9 text-purple-400" viewBox="0 0 100 40" fill="none">
              <path d="M0 30 Q 25 35, 50 15 T 100 5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
            </svg>
          </div>
        </div>

        {/* Card 2: Total Revenue */}
        <div className="bg-white rounded-[1.8rem] p-5 border border-slate-100 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shadow-inner">
              <CreditCard className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-extrabold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full flex items-center gap-0.5">
              <ArrowUpRight className="w-3 h-3" /> Verified
            </span>
          </div>
          <div className="mt-4 flex items-end justify-between">
            <div>
              <p className="text-[11px] font-bold text-slate-400">Total Revenue</p>
              <h3 className="text-2xl font-black text-slate-800 tracking-tight mt-0.5">
                {ordersLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : `₹${stats.totalRevenue.toLocaleString()}`}
              </h3>
            </div>
            {/* Green Sparkline */}
            <svg className="w-20 h-9 text-emerald-400" viewBox="0 0 100 40" fill="none">
              <path d="M0 35 Q 30 20, 60 25 T 100 8" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
            </svg>
          </div>
        </div>

        {/* Card 3: Total Customers */}
        <div className="bg-white rounded-[1.8rem] p-5 border border-slate-100 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div className="w-11 h-11 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center shadow-inner">
              <Users className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-extrabold text-sky-600 bg-sky-50 px-2 py-0.5 rounded-full flex items-center gap-0.5">
              <Users className="w-3 h-3" /> Registered
            </span>
          </div>
          <div className="mt-4 flex items-end justify-between">
            <div>
              <p className="text-[11px] font-bold text-slate-400">Total Customers</p>
              <h3 className="text-2xl font-black text-slate-800 tracking-tight mt-0.5">
                {stats.totalCustomers.toLocaleString()}
              </h3>
            </div>
            {/* Blue Sparkline */}
            <svg className="w-20 h-9 text-sky-400" viewBox="0 0 100 40" fill="none">
              <path d="M0 25 Q 35 38, 70 12 T 100 6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
            </svg>
          </div>
        </div>

        {/* Card 4: Pending Orders */}
        <div className="bg-white rounded-[1.8rem] p-5 border border-slate-100 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div className="w-11 h-11 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shadow-inner">
              <Clock className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-extrabold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full flex items-center gap-0.5">
              Action Required
            </span>
          </div>
          <div className="mt-4 flex items-end justify-between">
            <div>
              <p className="text-[11px] font-bold text-slate-400">Pending Orders</p>
              <h3 className="text-2xl font-black text-slate-800 tracking-tight mt-0.5">
                {stats.pendingOrdersCount}
              </h3>
            </div>
            {/* Amber Sparkline */}
            <svg className="w-20 h-9 text-amber-400" viewBox="0 0 100 40" fill="none">
              <path d="M0 15 Q 40 10, 60 25 T 100 20" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
            </svg>
          </div>
        </div>
      </div>

      {/* ========================================================
          CUSTOMER ANALYTICS & SHARED LINK TRACKING
         ======================================================== */}
      <div className="bg-gradient-to-br from-[#1e1b4b] via-[#0f172a] to-[#2e1065] rounded-[2.2rem] p-6 md:p-8 text-white shadow-xl relative overflow-hidden border border-purple-500/20">
        <div className="absolute top-0 right-0 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-10 w-60 h-60 bg-pink-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-white/10">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[11px] font-black tracking-widest uppercase text-purple-300">Live Traffic & Customer Acquisition</span>
            </div>
            <h2 className="text-xl md:text-2xl font-black tracking-tight mt-1">Customer Analytics &amp; Link Tracking</h2>
            <p className="text-xs text-slate-300 mt-0.5">Real-time stats on registered users, authentication methods, and shared promotional links.</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1.5 rounded-full bg-white/10 border border-white/20 text-xs font-bold text-slate-200">
              Live Cloud Firestore
            </span>
          </div>
        </div>

        <div className="relative z-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
          {/* Card 1: Total Customer Registration */}
          <div className="bg-white/5 hover:bg-white/10 transition-colors backdrop-blur-md rounded-2xl p-5 border border-white/10 flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-300 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Total Customers</span>
              <Users className="w-4 h-4 text-sky-400" />
            </div>
            <div>
              <p className="text-3xl font-black text-white">{stats.totalCustomers.toLocaleString()}</p>
              <p className="text-[11px] text-slate-400 mt-1 font-medium">Total registered store members</p>
            </div>
          </div>

          {/* Card 2: Email ID Logins */}
          <div className="bg-white/5 hover:bg-white/10 transition-colors backdrop-blur-md rounded-2xl p-5 border border-white/10 flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-300 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Email ID Sign-ins</span>
              <Mail className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <p className="text-3xl font-black text-emerald-300">{stats.emailUsers.toLocaleString()}</p>
              <p className="text-[11px] text-slate-400 mt-1 font-medium">Logged in via Email / Password</p>
            </div>
          </div>

          {/* Card 3: Mobile Phone / OTP Logins */}
          <div className="bg-white/5 hover:bg-white/10 transition-colors backdrop-blur-md rounded-2xl p-5 border border-white/10 flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-300 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Mobile Number OTP</span>
              <Smartphone className="w-4 h-4 text-purple-400" />
            </div>
            <div>
              <p className="text-3xl font-black text-purple-300">{stats.phoneUsers.toLocaleString()}</p>
              <p className="text-[11px] text-slate-400 mt-1 font-medium">Logged in via Phone OTP</p>
            </div>
          </div>

          {/* Card 4: Shared Link Clicks */}
          <div className="bg-white/5 hover:bg-white/10 transition-colors backdrop-blur-md rounded-2xl p-5 border border-white/10 flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-300 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Shared Link Clicks</span>
              <Share2 className="w-4 h-4 text-pink-400" />
            </div>
            <div>
              <p className="text-3xl font-black text-pink-300">{stats.linkClicks.toLocaleString()}</p>
              <p className="text-[11px] text-slate-400 mt-1 font-medium">Visits from shared store URLs</p>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================
          ALL ORDERS TABLE (Matching Reference Mockup 1:1)
         ======================================================== */}
      <div className="bg-white rounded-[2.2rem] border border-slate-100 shadow-sm overflow-hidden p-6 md:p-8 space-y-5">

        {/* Top Table Bar: Title, Status Pills, Export Button */}
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 pb-3 border-b border-slate-100">

          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <ShoppingBag className="w-4 h-4" />
            </div>
            <h2 className="text-lg font-black text-slate-800 tracking-tight">All Orders</h2>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto w-full lg:w-auto scrollbar-hide py-1">
            {(['All', 'Pending', 'Processing', 'Shipped', 'Delivered'] as const).map((tab) => {
              const count = tabCounts[tab];
              const isActive = statusTab === tab;
              return (
                <button
                  key={tab}
                  onClick={() => { setStatusTab(tab); setCurrentPage(1); }}
                  className={cn(
                    "px-3.5 py-1.5 rounded-full text-xs font-bold transition-all shrink-0 flex items-center gap-1.5",
                    isActive
                      ? "bg-[#6d28d9] text-white shadow-sm shadow-purple-200"
                      : "bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                  )}
                >
                  <span>{tab}</span>
                  <span className={cn(
                    "text-[10px] px-1.5 py-0.2 rounded-full font-extrabold",
                    isActive ? "bg-white/20 text-white" : "bg-slate-200/70 text-slate-600"
                  )}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Export Button */}
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs shadow-sm transition-all self-end lg:self-auto"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Export</span>
          </button>
        </div>

        {/* Second Filter Row: Search & Dropdowns */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          {/* Search */}
          <div className="relative md:col-span-2">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              placeholder="Search by Order ID, customer name, phone..."
              className="w-full h-10 pl-10 pr-4 rounded-xl bg-slate-50/80 border border-slate-200/80 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-400 text-xs font-medium text-slate-800 placeholder:text-slate-400 shadow-inner"
            />
          </div>

          {/* Payment Status Dropdown */}
          <select
            value={paymentFilter}
            onChange={(e: any) => { setPaymentFilter(e.target.value); setCurrentPage(1); }}
            className="h-10 px-3 rounded-xl bg-slate-50/80 border border-slate-200/80 text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-400"
          >
            <option value="All">All Payment Status</option>
            <option value="Paid">Paid</option>
            <option value="Pending">Payment Pending</option>
            <option value="COD">COD Partial</option>
          </select>

          {/* Quick Actions */}
          <Link
            href="/admin/products"
            className="h-10 px-4 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 font-bold text-xs flex items-center justify-center gap-2 transition-colors"
          >
            <Package className="w-3.5 h-3.5" />
            <span>Manage Catalog</span>
          </Link>
        </div>

        {/* Orders Table */}
        <div className="overflow-x-auto rounded-2xl border border-slate-100">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/70 border-b border-slate-100 text-slate-500 font-extrabold text-[10px] uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-4">Order ID</th>
                <th className="py-3.5 px-4">Customer</th>
                <th className="py-3.5 px-4">Amount</th>
                <th className="py-3.5 px-4">Payment Status</th>
                <th className="py-3.5 px-4">Order Status</th>
                <th className="py-3.5 px-4">Date</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {ordersLoading ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-slate-400">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-purple-600" />
                    <span>Loading real orders from database...</span>
                  </td>
                </tr>
              ) : paginatedOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-slate-400">
                    <ShoppingBag className="w-10 h-10 text-slate-300 mx-auto mb-2 stroke-1" />
                    <p className="font-bold text-slate-600">No orders found</p>
                    <p className="text-[11px] text-slate-400 mt-1">
                      {searchTerm ? 'Try adjusting your search or filter criteria.' : 'When customers check out, their orders appear here in real-time.'}
                    </p>
                  </td>
                </tr>
              ) : (
                paginatedOrders.map((order: any) => {
                  const status = order.status || 'Pending';
                  const isPaid = order.paymentStatus === 'Paid' || (order.paymentMethod !== 'cod' && !order.paymentStatus);
                  const isCod = order.paymentMethod === 'cod';

                  const formattedDate = order.createdAt?.toDate
                    ? order.createdAt.toDate().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) +
                    ' • ' + order.createdAt.toDate().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
                    : 'Recently';

                  return (
                    <tr key={order.id} className="hover:bg-slate-50/60 transition-colors">
                      {/* Order ID with thumbnail */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-purple-50 flex items-center justify-center shrink-0 text-purple-600">
                            {order.items?.[0]?.image ? (
                              <img src={order.items[0].image} alt="" className="w-full h-full object-cover rounded-xl" />
                            ) : (
                              <img src="/auth/gift_logo_icon.png" alt="" className="w-5 h-5 object-contain" />
                            )}
                          </div>
                          <div>
                            <span className="font-black text-slate-800">
                              #{order.id.slice(0, 8).toUpperCase()}
                            </span>
                            <div className="text-[10px] text-slate-400 font-semibold">
                              {order.items?.length || 1} item(s)
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Customer */}
                      <td className="py-3.5 px-4">
                        <div>
                          <p className="font-bold text-slate-800">
                            {order.customerName || order.shippingAddress?.fullName || 'Valued Customer'}
                          </p>
                          <p className="text-[11px] text-slate-400 font-semibold">
                            {order.phone || order.phoneNumber || order.shippingAddress?.phone || '+91 98765 43210'}
                          </p>
                        </div>
                      </td>

                      {/* Amount */}
                      <td className="py-3.5 px-4 font-black text-slate-800">
                        ₹{(Number(order.total) || 0).toLocaleString()}
                      </td>

                      {/* Payment Status */}
                      <td className="py-3.5 px-4">
                        {isPaid ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 font-bold text-[10px]">
                            <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                            <span>Paid</span>
                          </span>
                        ) : isCod ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 font-bold text-[10px]">
                            <Clock className="w-3 h-3 text-amber-500" />
                            <span>₹100 Paid (COD Due)</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 font-bold text-[10px]">
                            <span>Pending</span>
                          </span>
                        )}
                      </td>

                      {/* Order Status */}
                      <td className="py-3.5 px-4">
                        <span className={cn(
                          "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-bold text-[10px]",
                          status === 'Delivered' && "bg-emerald-50 text-emerald-700",
                          status === 'Shipped' && "bg-purple-50 text-purple-700",
                          status === 'Processing' && "bg-sky-50 text-sky-700",
                          status === 'Pending' && "bg-amber-50 text-amber-700"
                        )}>
                          <span className={cn(
                            "w-1.5 h-1.5 rounded-full",
                            status === 'Delivered' && "bg-emerald-500",
                            status === 'Shipped' && "bg-purple-500",
                            status === 'Processing' && "bg-sky-500",
                            status === 'Pending' && "bg-amber-500"
                          )} />
                          <span>{status}</span>
                        </span>
                      </td>

                      {/* Date */}
                      <td className="py-3.5 px-4 text-slate-500 font-semibold text-[11px]">
                        {formattedDate}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => { setSelectedOrder(order); setIsDetailsOpen(true); }}
                            className="text-purple-600 hover:text-purple-700 hover:underline font-bold text-xs"
                          >
                            View Details →
                          </button>

                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <button className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100">
                                <MoreVertical className="w-4 h-4" />
                              </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-44 rounded-xl text-xs font-bold">
                              <DropdownMenuItem onClick={() => updateStatus(order.id, 'Processing')}>
                                Mark Processing
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => updateStatus(order.id, 'Shipped')}>
                                Mark Shipped
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => updateStatus(order.id, 'Delivered')}>
                                Mark Delivered
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => updateStatus(order.id, 'Pending')}>
                                Mark Pending
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Bottom Pagination matching reference */}
        {filteredOrders.length > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
            {/* Pagination buttons */}
            <div className="flex items-center gap-1.5">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                className="w-8 h-8 rounded-xl border border-slate-200 flex items-center justify-center text-slate-600 disabled:opacity-40 hover:bg-slate-50"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              {Array.from({ length: Math.min(totalPages, 5) }).map((_, i) => {
                const pageNum = i + 1;
                const isCurrent = currentPage === pageNum;
                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={cn(
                      "w-8 h-8 rounded-xl text-xs font-bold transition-all",
                      isCurrent
                        ? "bg-purple-600 text-white shadow-sm"
                        : "border border-slate-200 text-slate-600 hover:bg-slate-50"
                    )}
                  >
                    {pageNum}
                  </button>
                );
              })}

              {totalPages > 5 && (
                <>
                  <span className="text-slate-400 px-1">...</span>
                  <button
                    onClick={() => setCurrentPage(totalPages)}
                    className={cn(
                      "w-8 h-8 rounded-xl text-xs font-bold transition-all border border-slate-200 text-slate-600 hover:bg-slate-50",
                      currentPage === totalPages && "bg-purple-600 text-white"
                    )}
                  >
                    {totalPages}
                  </button>
                </>
              )}

              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                className="w-8 h-8 rounded-xl border border-slate-200 flex items-center justify-center text-slate-600 disabled:opacity-40 hover:bg-slate-50"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Showing Count */}
            <p className="text-xs font-semibold text-slate-400">
              Showing {Math.min((currentPage - 1) * itemsPerPage + 1, filteredOrders.length)}–{Math.min(currentPage * itemsPerPage, filteredOrders.length)} of {filteredOrders.length} orders
            </p>
          </div>
        )}
      </div>

      {/* ========================================================
          ORDER DETAILS MODAL
         ======================================================== */}
      {selectedOrder && (
        <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
          <DialogContent className="max-w-2xl rounded-[2rem] p-6 max-h-[85vh] overflow-y-auto">
            <DialogHeader className="border-b border-slate-100 pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <DialogTitle className="text-xl font-black text-slate-800">
                    Order #{selectedOrder.id?.slice(0, 8).toUpperCase()}
                  </DialogTitle>
                  <DialogDescription className="text-xs font-bold text-slate-400">
                    Placed on {selectedOrder.createdAt?.toDate ? selectedOrder.createdAt.toDate().toLocaleString() : 'Recent'}
                  </DialogDescription>
                </div>
                <div className="px-3 py-1 rounded-full bg-purple-50 text-purple-700 font-black text-xs">
                  {selectedOrder.status || 'Pending'}
                </div>
              </div>
            </DialogHeader>

            <div className="space-y-6 pt-2">
              {/* Customer & Shipping info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <div className="space-y-1">
                  <h4 className="text-[10px] font-black uppercase tracking-wider text-slate-400">Customer Details</h4>
                  <p className="font-bold text-sm text-slate-800">{selectedOrder.customerName || selectedOrder.shippingAddress?.fullName || 'Customer'}</p>
                  <p className="text-xs text-slate-600 font-semibold">{selectedOrder.phone || selectedOrder.shippingAddress?.phone || 'No phone'}</p>
                  <p className="text-xs text-slate-600">{selectedOrder.email || selectedOrder.userEmail || 'No email'}</p>
                </div>
                <div className="space-y-1">
                  <h4 className="text-[10px] font-black uppercase tracking-wider text-slate-400">Complete Delivery Address</h4>
                  <div className="text-xs text-slate-700 font-semibold leading-relaxed">
                    <p className="text-slate-900 font-bold">{selectedOrder.shippingAddress?.fullName || selectedOrder.customerName}</p>
                    <p>{selectedOrder.shippingAddress?.addressLine1 || selectedOrder.shippingAddress?.line1 || selectedOrder.shippingAddress?.address || '—'}</p>
                    {(selectedOrder.shippingAddress?.addressLine2 || selectedOrder.shippingAddress?.line2) && (
                      <p className="text-slate-500">{selectedOrder.shippingAddress?.addressLine2 || selectedOrder.shippingAddress?.line2}</p>
                    )}
                    <p className="font-bold text-slate-800">
                      {selectedOrder.shippingAddress?.city}, {selectedOrder.shippingAddress?.state} - {selectedOrder.shippingAddress?.postalCode || selectedOrder.shippingAddress?.pincode}
                    </p>
                    {selectedOrder.shippingAddress?.gpsCoords && (
                      <div className="pt-1.5 flex items-center gap-2">
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                          <MapPin className="w-3 h-3 text-emerald-600" />
                          GPS: {selectedOrder.shippingAddress.gpsCoords.lat.toFixed(4)}, {selectedOrder.shippingAddress.gpsCoords.lng.toFixed(4)}
                        </span>
                        <a
                          href={`https://maps.google.com/?q=${selectedOrder.shippingAddress.gpsCoords.lat},${selectedOrder.shippingAddress.gpsCoords.lng}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[11px] text-purple-600 hover:underline flex items-center gap-0.5 font-bold"
                        >
                          View Map <ExternalLink className="w-2.5 h-2.5" />
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Items List with Colour & Capacity variants */}
              <div>
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-3">Order Items (Variants &amp; Specs)</h4>
                <div className="space-y-3">
                  {selectedOrder.items?.map((item: any, i: number) => {
                    const itemColor = item.selectedColor || item.color;
                    const itemCapacity = item.selectedCapacity || item.capacity;

                    return (
                      <div key={i} className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-2xl border border-slate-100 bg-white gap-3 shadow-sm">
                        <div className="flex items-center gap-3">
                          <div className="w-14 h-14 rounded-2xl bg-slate-100 overflow-hidden relative shrink-0 border border-slate-100">
                            {item.image || item.variantImage ? (
                              <img src={item.image || item.variantImage} alt={item.name} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-slate-400 text-xs">📦</div>
                            )}
                          </div>
                          <div className="space-y-1">
                            <p className="font-bold text-xs text-slate-800 leading-snug">{item.name}</p>
                            <div className="flex flex-wrap items-center gap-1.5">
                              {/* Colour variant badge */}
                              {itemColor && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 font-bold text-[10px] border border-purple-200">
                                  <span>Colour:</span>
                                  <span className="font-extrabold">{itemColor}</span>
                                </span>
                              )}

                              {/* Capacity variant badge */}
                              {itemCapacity && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-sky-50 text-sky-700 font-bold text-[10px] border border-sky-200">
                                  <span>Capacity:</span>
                                  <span className="font-extrabold">{itemCapacity}</span>
                                </span>
                              )}

                              <span className="text-[10px] text-slate-400 font-semibold">
                                Qty: {item.quantity || 1}
                              </span>
                            </div>
                          </div>
                        </div>
                        <p className="font-black text-sm text-slate-800 shrink-0 self-end sm:self-center">
                          ₹{(Number(item.price) * (item.quantity || 1)).toLocaleString()}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Payment Summary */}
              <div className="p-4 rounded-2xl bg-purple-50/60 border border-purple-100/60 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-purple-900">Total Order Amount</span>
                  <div className="text-[10px] text-purple-600 font-semibold">
                    {selectedOrder.paymentMethod === 'cod' ? 'COD Order (₹100 Paid upfront)' : 'Full Prepaid Order'}
                  </div>
                </div>
                <span className="text-xl font-black text-purple-900">
                  ₹{(Number(selectedOrder.total) || 0).toLocaleString()}
                </span>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

    </div>
  );
}
