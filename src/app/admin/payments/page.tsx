"use client";

import { useMemo, useState } from 'react';
import { 
  Search, 
  CreditCard, 
  ArrowUpRight, 
  ShieldCheck, 
  Clock, 
  DollarSign, 
  Receipt, 
  User, 
  Calendar, 
  CheckCircle2, 
  Sparkles,
  ExternalLink,
  Eye,
  Filter
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { useFirestore, useCollection } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { cn } from '@/lib/utils';

export default function AdminPaymentsPage() {
  const db = useFirestore();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<'all' | 'full' | 'cod_advance'>('all');
  const [selectedPayment, setSelectedPayment] = useState<any>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  const paymentsQuery = useMemo(() => {
    if (!db) return null;
    return query(collection(db, 'payments'), orderBy('createdAt', 'desc'));
  }, [db]);

  const { data: payments, loading } = useCollection<any>(paymentsQuery);

  // Filter and search logic
  const filteredPayments = useMemo(() => {
    if (!payments) return [];
    return payments.filter((p: any) => {
      const matchesSearch = 
        !searchTerm ||
        p.razorpayPaymentId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.orderId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.customerEmail?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.customerPhone?.includes(searchTerm);

      const matchesType = 
        filterType === 'all' || 
        (filterType === 'full' && (p.paymentType === 'full' || !p.paymentType)) ||
        (filterType === 'cod_advance' && (p.paymentType === 'cod_advance' || p.amount === 100));

      return matchesSearch && matchesType;
    });
  }, [payments, searchTerm, filterType]);

  // Aggregated metrics
  const metrics = useMemo(() => {
    if (!payments) return { totalCaptured: 0, fullOnlineTotal: 0, codAdvanceTotal: 0, pendingCodTotal: 0 };
    return payments.reduce((acc: any, p: any) => {
      const amount = Number(p.amount) || 0;
      acc.totalCaptured += amount;
      if (p.paymentType === 'cod_advance' || amount === 100) {
        acc.codAdvanceTotal += amount;
        acc.pendingCodTotal += Number(p.remainingCodBalance) || 0;
      } else {
        acc.fullOnlineTotal += amount;
      }
      return acc;
    }, { totalCaptured: 0, fullOnlineTotal: 0, codAdvanceTotal: 0, pendingCodTotal: 0 });
  }, [payments]);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-purple-50 text-[#5f259f] rounded-full text-xs font-bold uppercase tracking-wider mb-2 border border-purple-200">
            <CreditCard className="h-3.5 w-3.5 text-[#5f259f]" />
            <span>Razorpay Financial Ledger</span>
          </div>
          <h1 className="text-3xl font-headline font-black text-slate-800 uppercase tracking-tight">
            Payments & Collections
          </h1>
          <p className="text-sm text-slate-400 font-medium">
            Monitor real-time online Razorpay transactions, full prepaid orders, and ₹100 COD advance confirmations.
          </p>
        </div>
      </div>

      {/* Metric Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] font-black uppercase tracking-widest">Total Online Captured</span>
            <div className="w-9 h-9 rounded-xl bg-purple-50 flex items-center justify-center text-[#5f259f]">
              <DollarSign className="h-4 w-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900">
            ₹{metrics.totalCaptured.toLocaleString()}
          </div>
          <p className="text-[10px] font-bold text-emerald-600 flex items-center gap-1">
            <ShieldCheck className="h-3 w-3" /> 100% Razorpay Verified
          </p>
        </div>

        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] font-black uppercase tracking-widest">Full Online Prepaid</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
              <Receipt className="h-4 w-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-emerald-700">
            ₹{metrics.fullOnlineTotal.toLocaleString()}
          </div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Zero pending balance on delivery
          </p>
        </div>

        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] font-black uppercase tracking-widest">₹100 COD Advances</span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
              <Sparkles className="h-4 w-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-amber-700">
            ₹{metrics.codAdvanceTotal.toLocaleString()}
          </div>
          <p className="text-[10px] font-bold text-amber-700 uppercase tracking-wider">
            Secured confirmation fees
          </p>
        </div>

        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] font-black uppercase tracking-widest">Pending COD to Collect</span>
            <div className="w-9 h-9 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
              <Clock className="h-4 w-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-indigo-700">
            ₹{metrics.pendingCodTotal.toLocaleString()}
          </div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Payable in cash on delivery
          </p>
        </div>
      </div>

      {/* Main Ledger Table */}
      <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
        {/* Filter & Search Bar */}
        <div className="p-6 md:p-8 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by Payment ID, Order ID, Customer..." 
              className="pl-11 h-12 rounded-xl border-slate-200 focus-visible:ring-[#5f259f] bg-slate-50/50" 
            />
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant={filterType === 'all' ? 'default' : 'outline'}
              onClick={() => setFilterType('all')}
              className={cn(
                "h-10 rounded-xl text-xs font-bold tracking-tight",
                filterType === 'all' ? "bg-[#5f259f] hover:bg-[#4a1b7e] text-white" : "border-slate-200 text-slate-600"
              )}
            >
              All Payments ({payments?.length || 0})
            </Button>
            <Button
              type="button"
              variant={filterType === 'full' ? 'default' : 'outline'}
              onClick={() => setFilterType('full')}
              className={cn(
                "h-10 rounded-xl text-xs font-bold tracking-tight",
                filterType === 'full' ? "bg-emerald-600 hover:bg-emerald-700 text-white" : "border-slate-200 text-slate-600"
              )}
            >
              Full Prepaid
            </Button>
            <Button
              type="button"
              variant={filterType === 'cod_advance' ? 'default' : 'outline'}
              onClick={() => setFilterType('cod_advance')}
              className={cn(
                "h-10 rounded-xl text-xs font-bold tracking-tight",
                filterType === 'cod_advance' ? "bg-amber-600 hover:bg-amber-700 text-white" : "border-slate-200 text-slate-600"
              )}
            >
              COD Advances (₹100)
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="p-8 space-y-4 animate-pulse">
            {[0, 1, 2, 3, 4].map((idx) => (
              <div key={idx} className="flex items-center justify-between p-4 bg-slate-50/60 rounded-2xl gap-4">
                <div className="h-4 w-28 bg-slate-200 rounded-md" />
                <div className="h-4 w-32 bg-slate-200 rounded-md" />
                <div className="h-4 w-20 bg-slate-200 rounded-md" />
                <div className="h-6 w-24 bg-purple-100 rounded-full" />
                <div className="h-6 w-20 bg-emerald-100 rounded-full" />
              </div>
            ))}
          </div>
        ) : filteredPayments && filteredPayments.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow className="border-none bg-slate-50/50 hover:bg-slate-50/50">
                <TableHead className="px-8 font-black text-[10px] uppercase tracking-widest text-slate-400 h-14">Payment Ref</TableHead>
                <TableHead className="font-black text-[10px] uppercase tracking-widest text-slate-400 h-14">Order ID</TableHead>
                <TableHead className="font-black text-[10px] uppercase tracking-widest text-slate-400 h-14">Customer</TableHead>
                <TableHead className="font-black text-[10px] uppercase tracking-widest text-slate-400 h-14">Amount Paid Online</TableHead>
                <TableHead className="font-black text-[10px] uppercase tracking-widest text-slate-400 h-14">Payment Type</TableHead>
                <TableHead className="font-black text-[10px] uppercase tracking-widest text-slate-400 h-14">COD Balance Due</TableHead>
                <TableHead className="font-black text-[10px] uppercase tracking-widest text-slate-400 h-14">Status</TableHead>
                <TableHead className="font-black text-[10px] uppercase tracking-widest text-slate-400 h-14">Date</TableHead>
                <TableHead className="px-8 text-right h-14"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPayments.map((payment: any) => {
                const isCod = payment.paymentType === 'cod_advance' || payment.amount === 100;
                return (
                  <TableRow key={payment.id} className="hover:bg-slate-50/30 transition-colors border-slate-100">
                    <TableCell className="px-8 font-mono font-bold text-xs text-[#5f259f] select-all">
                      {payment.razorpayPaymentId || payment.id?.slice(0, 14)}
                    </TableCell>
                    <TableCell className="font-mono text-xs text-slate-600 uppercase">
                      {payment.orderId?.slice(0, 8) || 'N/A'}
                    </TableCell>
                    <TableCell>
                      <div className="font-bold text-sm text-slate-800">{payment.customerName || 'Guest Buyer'}</div>
                      <div className="text-[10px] font-medium text-slate-400">{payment.customerEmail || payment.customerPhone || ''}</div>
                    </TableCell>
                    <TableCell className="text-sm font-black text-slate-900">
                      ₹{payment.amount?.toLocaleString()}
                    </TableCell>
                    <TableCell>
                      {isCod ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                          <Sparkles className="h-3 w-3 text-amber-600" />
                          COD Advance (₹100)
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-purple-50 text-[#5f259f] border border-purple-200">
                          <ShieldCheck className="h-3 w-3 text-[#5f259f]" />
                          Full Prepaid
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-xs font-bold">
                      {isCod && payment.remainingCodBalance > 0 ? (
                        <span className="text-amber-700 font-extrabold bg-amber-50/80 px-2 py-0.5 rounded-md">
                          ₹{payment.remainingCodBalance?.toLocaleString()} due on delivery
                        </span>
                      ) : (
                        <span className="text-emerald-600 font-medium">₹0 (Paid in Full)</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                        {payment.status || 'Captured'}
                      </span>
                    </TableCell>
                    <TableCell className="text-xs text-slate-500 font-medium">
                      {payment.createdAt?.toDate ? payment.createdAt.toDate().toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' }) : 'N/A'}
                    </TableCell>
                    <TableCell className="px-8 text-right">
                      <Button
                        onClick={() => {
                          setSelectedPayment(payment);
                          setIsDetailsOpen(true);
                        }}
                        variant="ghost"
                        size="icon"
                        className="rounded-xl text-slate-400 hover:text-[#5f259f] hover:bg-purple-50"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        ) : (
          <div className="py-24 text-center space-y-3">
            <div className="w-16 h-16 rounded-2xl bg-purple-50 text-[#5f259f] flex items-center justify-center mx-auto">
              <Receipt className="h-8 w-8" />
            </div>
            <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight">No Payment Records Found</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Verified Razorpay transactions will appear here automatically when customers complete checkout.
            </p>
          </div>
        )}
      </div>

      {/* Payment Details Dialog */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="max-w-lg bg-white rounded-3xl p-8 border border-slate-100 shadow-2xl">
          <DialogHeader className="border-b border-slate-100 pb-5">
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle className="text-xl font-headline font-black text-slate-800 uppercase tracking-tight">
                  Payment Receipt
                </DialogTitle>
                <DialogDescription className="text-xs text-slate-400 font-medium uppercase tracking-wider mt-0.5">
                  Razorpay Transaction Details
                </DialogDescription>
              </div>
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                {selectedPayment?.status || 'Captured'}
              </span>
            </div>
          </DialogHeader>

          {selectedPayment && (
            <div className="space-y-5 pt-4 text-xs">
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 uppercase font-bold text-[10px]">Payment ID:</span>
                  <span className="font-mono font-black text-[#5f259f] select-all text-xs">{selectedPayment.razorpayPaymentId}</span>
                </div>
                {selectedPayment.razorpayOrderId && (
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400 uppercase font-bold text-[10px]">Razorpay Order ID:</span>
                    <span className="font-mono text-slate-600 text-xs">{selectedPayment.razorpayOrderId}</span>
                  </div>
                )}
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 uppercase font-bold text-[10px]">Store Order ID:</span>
                  <span className="font-mono font-bold text-slate-800 text-xs">{selectedPayment.orderId}</span>
                </div>
              </div>

              <div className="bg-purple-50/50 p-4 rounded-2xl border border-purple-100 space-y-2">
                <div className="flex justify-between items-center text-sm">
                  <span className="font-bold text-slate-700">Amount Charged Online:</span>
                  <span className="font-black text-[#5f259f] text-base">₹{selectedPayment.amount?.toLocaleString()}</span>
                </div>
                {selectedPayment.paymentType === 'cod_advance' && (
                  <>
                    <div className="flex justify-between items-center text-xs text-amber-800 pt-1 border-t border-purple-100">
                      <span className="font-bold">Payment Type:</span>
                      <span className="font-bold">Cash on Delivery (₹100 Advance Paid)</span>
                    </div>
                    {selectedPayment.remainingCodBalance > 0 && (
                      <div className="flex justify-between items-center text-xs text-amber-900 bg-amber-100/60 p-2 rounded-xl mt-1">
                        <span className="font-bold">Balance to Collect on Delivery:</span>
                        <span className="font-black text-sm">₹{selectedPayment.remainingCodBalance?.toLocaleString()}</span>
                      </div>
                    )}
                  </>
                )}
              </div>

              <div className="space-y-1.5 px-1">
                <div className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Customer Details</div>
                <div className="font-bold text-slate-800 text-sm">{selectedPayment.customerName}</div>
                <div className="text-slate-500">{selectedPayment.customerEmail}</div>
                <div className="text-slate-500">{selectedPayment.customerPhone}</div>
              </div>
            </div>
          )}

          <DialogFooter className="border-t border-slate-100 pt-5">
            <Button
              onClick={() => setIsDetailsOpen(false)}
              className="rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-black uppercase text-xs px-6"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
