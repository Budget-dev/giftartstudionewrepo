"use client";

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { 
  ShoppingBag, 
  Search, 
  Filter, 
  Download, 
  CheckCircle2, 
  Clock, 
  Truck, 
  AlertCircle, 
  MoreVertical, 
  Eye, 
  Loader2,
  Trash2,
  ChevronLeft,
  ChevronRight,
  ExternalLink
} from 'lucide-react';
import { useFirestore, useCollection } from '@/firebase';
import { collection, query, orderBy, doc, updateDoc, deleteDoc } from 'firebase/firestore';
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

export default function OrdersPage() {
  const db = useFirestore();
  const { toast } = useToast();

  const [searchTerm, setSearchTerm] = useState("");
  const [statusTab, setStatusTab] = useState<'All' | 'Pending' | 'Processing' | 'Shipped' | 'Delivered'>('All');
  const [paymentFilter, setPaymentFilter] = useState<'All' | 'Paid' | 'Pending' | 'COD'>('All');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  // Real collection from Firestore
  const ordersQuery = useMemo(() => {
    if (!db) return null;
    return query(collection(db, 'orders'), orderBy('createdAt', 'desc'));
  }, [db]);
  const { data: orders, loading } = useCollection<any>(ordersQuery);

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

  // Filtering
  const filteredOrders = useMemo(() => {
    if (!orders) return [];
    return orders.filter((order: any) => {
      if (statusTab !== 'All') {
        const orderStatus = (order.status || 'Pending').toLowerCase();
        if (orderStatus !== statusTab.toLowerCase()) return false;
      }

      if (paymentFilter !== 'All') {
        const payStatus = (order.paymentStatus || (order.paymentMethod === 'cod' ? 'COD' : 'Paid')).toLowerCase();
        if (paymentFilter === 'Paid' && !payStatus.includes('paid')) return false;
        if (paymentFilter === 'Pending' && !payStatus.includes('pending')) return false;
        if (paymentFilter === 'COD' && !payStatus.includes('cod')) return false;
      }

      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const matchesId = (order.id || '').toLowerCase().includes(term);
        const matchesName = (order.customerName || order.shippingAddress?.fullName || '').toLowerCase().includes(term);
        const matchesPhone = (order.phone || order.phoneNumber || order.shippingAddress?.phone || '').toLowerCase().includes(term);
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

  const updateStatus = async (orderId: string, newStatus: string) => {
    if (!db) return;
    try {
      await updateDoc(doc(db, 'orders', orderId), { status: newStatus });
      toast({ title: 'Status Updated', description: `Order #${orderId.slice(0, 8)} is now marked as ${newStatus}` });
    } catch {
      toast({ variant: 'destructive', title: 'Update Failed', description: 'Could not update order status.' });
    }
  };

  const handleDelete = async (orderId: string) => {
    if (!db || !confirm('Permanently delete this order from the system?')) return;
    try {
      await deleteDoc(doc(db, 'orders', orderId));
      toast({ title: 'Order Deleted' });
    } catch {
      toast({ variant: 'destructive', title: 'Error', description: 'Could not delete order.' });
    }
  };

  const handleExportCSV = () => {
    if (!filteredOrders.length) {
      toast({ title: 'No orders to export' });
      return;
    }
    const headers = ['Order ID', 'Customer Name', 'Phone', 'Email', 'Amount (INR)', 'Payment Status', 'Order Status', 'Date'];
    const rows = filteredOrders.map((o: any) => [
      o.id,
      `"${o.customerName || o.shippingAddress?.fullName || 'Customer'}"`,
      `"${o.phone || o.shippingAddress?.phone || ''}"`,
      `"${o.email || o.userEmail || ''}"`,
      o.total || 0,
      o.paymentStatus || (o.paymentMethod === 'cod' ? 'COD Due' : 'Paid'),
      o.status || 'Pending',
      o.createdAt?.toDate ? o.createdAt.toDate().toISOString() : ''
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `orders_export_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast({ title: 'Export Complete' });
  };

  return (
    <div className="space-y-7 animate-in fade-in duration-300">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-slate-400">
            <span>Dashboard</span>
            <span>&gt;</span>
            <span className="text-purple-600">Orders</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-800 tracking-tight mt-0.5">
            Customer Orders
          </h1>
          <p className="text-xs font-semibold text-slate-500">
            Manage customer fulfillment, delivery stages, and order statuses.
          </p>
        </div>

        <button
          onClick={handleExportCSV}
          className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white border border-slate-200/90 hover:bg-slate-50 text-slate-700 font-bold text-xs shadow-sm active:scale-95 transition-all"
        >
          <Download className="w-4 h-4 text-slate-500" />
          <span>Export Orders CSV</span>
        </button>
      </div>

      {/* Main Table Card */}
      <div className="bg-white rounded-[2.2rem] border border-slate-100 p-6 md:p-8 shadow-sm space-y-5">
        
        {/* Status Filter Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
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
                    ? "bg-purple-600 text-white shadow-sm"
                    : "bg-slate-50 text-slate-600 hover:bg-slate-100"
                )}
              >
                <span>{tab}</span>
                <span className={cn(
                  "text-[10px] px-1.5 py-0.2 rounded-full",
                  isActive ? "bg-white/20 text-white" : "bg-slate-200/70 text-slate-600"
                )}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search & Filter Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="relative sm:col-span-2">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              placeholder="Search by Order ID, customer name, phone, or email..."
              className="w-full h-10 pl-10 pr-4 rounded-xl bg-slate-50 border border-slate-200/80 text-xs font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-400"
            />
          </div>

          <select
            value={paymentFilter}
            onChange={(e: any) => { setPaymentFilter(e.target.value); setCurrentPage(1); }}
            className="h-10 px-3 rounded-xl bg-slate-50 border border-slate-200/80 text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-400"
          >
            <option value="All">All Payment Status</option>
            <option value="Paid">Paid Full</option>
            <option value="COD">COD (₹100 Paid Upfront)</option>
            <option value="Pending">Payment Pending</option>
          </select>
        </div>

        {/* Table */}
        <div className="overflow-x-auto rounded-xl border border-slate-100">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-extrabold text-[10px] uppercase tracking-wider border-b border-slate-100">
              <tr>
                <th className="py-3 px-4">Order ID</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Amount</th>
                <th className="py-3 px-4">Payment</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2 text-purple-600" />
                    <span>Loading real orders from database...</span>
                  </td>
                </tr>
              ) : paginatedOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <ShoppingBag className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="font-bold text-slate-600">No orders found</p>
                    <p className="text-[11px] text-slate-400 mt-1">
                      {searchTerm ? 'Try a different search term.' : 'Customer orders will show up here as they are placed.'}
                    </p>
                  </td>
                </tr>
              ) : (
                paginatedOrders.map((order: any) => {
                  const status = order.status || 'Pending';
                  const isPaid = order.paymentStatus === 'Paid' || (order.paymentMethod !== 'cod' && !order.paymentStatus);
                  const isCod = order.paymentMethod === 'cod';

                  const formattedDate = order.createdAt?.toDate 
                    ? order.createdAt.toDate().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                    : 'Recently';

                  return (
                    <tr key={order.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3 px-4">
                        <span className="font-black text-slate-800">
                          #{order.id.slice(0, 8).toUpperCase()}
                        </span>
                        <div className="text-[10px] text-slate-400">
                          {order.items?.length || 1} item(s)
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <p className="font-bold text-slate-800">
                          {order.customerName || order.shippingAddress?.fullName || 'Customer'}
                        </p>
                        <p className="text-[10px] text-slate-400">
                          {order.phone || order.phoneNumber || order.shippingAddress?.phone || '—'}
                        </p>
                      </td>

                      <td className="py-3 px-4 font-black text-slate-800">
                        ₹{(Number(order.total) || 0).toLocaleString()}
                      </td>

                      <td className="py-3 px-4">
                        {isPaid ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold text-[10px]">
                            <CheckCircle2 className="w-3 h-3 text-emerald-500" /> Paid
                          </span>
                        ) : isCod ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 font-bold text-[10px]">
                            <Clock className="w-3 h-3 text-amber-500" /> ₹100 Advance
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 font-bold text-[10px]">
                            Pending
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4">
                        <span className={cn(
                          "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full font-bold text-[10px]",
                          status === 'Delivered' && "bg-emerald-50 text-emerald-700",
                          status === 'Shipped' && "bg-purple-50 text-purple-700",
                          status === 'Processing' && "bg-sky-50 text-sky-700",
                          status === 'Pending' && "bg-amber-50 text-amber-700"
                        )}>
                          <span>{status}</span>
                        </span>
                      </td>

                      <td className="py-3 px-4 text-slate-500 text-[11px]">
                        {formattedDate}
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => { setSelectedOrder(order); setIsDetailsOpen(true); }}
                            className="text-purple-600 hover:text-purple-700 font-bold text-xs hover:underline"
                          >
                            View Details →
                          </button>

                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <button className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100">
                                <MoreVertical className="w-3.5 h-3.5" />
                              </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-40 rounded-xl text-xs font-bold">
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
                              <DropdownMenuItem onClick={() => handleDelete(order.id)} className="text-rose-600">
                                Delete Order
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

        {/* Pagination */}
        {filteredOrders.length > 0 && (
          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center gap-1">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center text-slate-600 disabled:opacity-40"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <span className="text-xs font-bold text-slate-600 px-2">
                Page {currentPage} of {totalPages}
              </span>
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center text-slate-600 disabled:opacity-40"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
            <p className="text-xs text-slate-400 font-semibold">
              Total {filteredOrders.length} orders
            </p>
          </div>
        )}
      </div>

      {/* Details Dialog */}
      {selectedOrder && (
        <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
          <DialogContent className="max-w-xl rounded-[2rem] p-6 max-h-[85vh] overflow-y-auto">
            <DialogHeader className="border-b border-slate-100 pb-3">
              <DialogTitle className="text-lg font-black text-slate-800">
                Order #{selectedOrder.id?.slice(0, 8).toUpperCase()}
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-400">
                Customer & fulfillment details
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 pt-2">
              <div className="bg-slate-50 p-4 rounded-xl space-y-2 text-xs">
                <p><strong>Name:</strong> {selectedOrder.customerName || selectedOrder.shippingAddress?.fullName || 'Customer'}</p>
                <p><strong>Phone:</strong> {selectedOrder.phone || selectedOrder.shippingAddress?.phone || '—'}</p>
                <p><strong>Email:</strong> {selectedOrder.email || selectedOrder.userEmail || '—'}</p>
                <p><strong>Address:</strong> {selectedOrder.shippingAddress?.addressLine1 || selectedOrder.shippingAddress?.address || '—'}, {selectedOrder.shippingAddress?.city} - {selectedOrder.shippingAddress?.postalCode || selectedOrder.shippingAddress?.pincode}</p>
                <p><strong>Payment Method:</strong> {selectedOrder.paymentMethod === 'cod' ? 'COD Partial (₹100 Paid Online)' : 'Full Online (Razorpay)'}</p>
              </div>

              <div>
                <h4 className="text-xs font-black uppercase text-slate-400 mb-2">Items</h4>
                <div className="space-y-2">
                  {selectedOrder.items?.map((item: any, i: number) => (
                    <div key={i} className="flex items-center justify-between p-2.5 rounded-xl border border-slate-100">
                      <div className="text-xs">
                        <p className="font-bold text-slate-800">{item.name}</p>
                        <p className="text-[10px] text-slate-400">Qty: {item.quantity || 1}</p>
                      </div>
                      <span className="font-black text-xs text-slate-800">
                        ₹{(Number(item.price) * (item.quantity || 1)).toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-3 rounded-xl bg-purple-50 text-purple-900 font-bold flex justify-between text-xs">
                <span>Total</span>
                <span>₹{(Number(selectedOrder.total) || 0).toLocaleString()}</span>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

    </div>
  );
}
