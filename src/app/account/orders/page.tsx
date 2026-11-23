'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ShoppingBag, Package, ChevronRight, Truck, CheckCircle2, Clock, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { useUser, useCollection, useFirestore } from '@/firebase';
import { collection, query, where, doc, getDoc } from 'firebase/firestore';
import { useMemo, useState, useEffect } from 'react';

const STATUS_MAP: Record<string, string> = {
  'Delivered': 'bg-emerald-50 text-emerald-700 border-emerald-200',
  'Shipped': 'bg-blue-50 text-blue-700 border-blue-200',
  'Pending': 'bg-amber-50 text-amber-700 border-amber-200',
  'Confirmed': 'bg-purple-50 text-purple-700 border-purple-200',
  'Order Placed': 'bg-purple-50 text-purple-700 border-purple-200',
  'Processing': 'bg-sky-50 text-sky-700 border-sky-200',
  'Packed': 'bg-indigo-50 text-indigo-700 border-indigo-200',
  'Out for Delivery': 'bg-teal-50 text-teal-700 border-teal-200',
};

export default function MyOrdersPage() {
  const { user } = useUser();
  const db = useFirestore();
  const [localOrders, setLocalOrders] = useState<any[]>([]);
  const [localLoading, setLocalLoading] = useState(false);

  // Firestore query for authenticated user (WITHOUT compound index orderBy)
  const ordersQuery = useMemo(() => {
    if (!db || !user) return null;
    return query(
      collection(db, 'orders'),
      where('userId', '==', user.uid)
    );
  }, [db, user]);

  const { data: userOrders, loading: userOrdersLoading } = useCollection<any>(ordersQuery);

  // Also fetch any orders stored in localStorage (e.g. from guest/recent checkout)
  useEffect(() => {
    if (!db) return;
    try {
      const stored = localStorage.getItem('giftmart_recent_orders');
      if (stored) {
        const ids: string[] = JSON.parse(stored);
        if (Array.isArray(ids) && ids.length > 0) {
          setLocalLoading(true);
          Promise.all(ids.map(id => getDoc(doc(db, 'orders', id)).then(snap => snap.exists() ? { id: snap.id, ...snap.data() } : null)))
            .then(docs => {
              setLocalOrders(docs.filter(Boolean));
            })
            .finally(() => setLocalLoading(false));
        }
      }
    } catch (e) {
      console.warn("Could not load local orders", e);
    }
  }, [db]);

  // Merge and sort in memory by date descending
  const allOrders = useMemo(() => {
    const map = new Map<string, any>();
    if (userOrders) {
      userOrders.forEach(o => map.set(o.id, o));
    }
    localOrders.forEach(o => map.set(o.id, o));

    const list = Array.from(map.values());
    return list.sort((a, b) => {
      const timeA = a.createdAt?.seconds ? a.createdAt.seconds * 1000 : (a.createdAt?.toDate ? a.createdAt.toDate().getTime() : 0);
      const timeB = b.createdAt?.seconds ? b.createdAt.seconds * 1000 : (b.createdAt?.toDate ? b.createdAt.toDate().getTime() : 0);
      return timeB - timeA;
    });
  }, [userOrders, localOrders]);

  const loading = userOrdersLoading || localLoading;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            My Orders
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Track and view details of all your personalized gift orders.
          </p>
        </div>
        <Button asChild variant="outline" className="rounded-xl border-purple-200 text-purple-700 hover:bg-purple-50 h-10 font-medium text-xs">
          <Link href="/collections">Shop More Gifts</Link>
        </Button>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[0, 1, 2].map((idx) => (
            <div key={idx} className="rounded-2xl bg-white dark:bg-slate-900 p-6 shadow-sm border border-slate-100 dark:border-slate-800 animate-pulse flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-slate-100 dark:bg-slate-800 rounded-xl" />
                <div className="space-y-2">
                  <div className="h-4 w-32 bg-slate-200 dark:bg-slate-700 rounded" />
                  <div className="h-3 w-48 bg-slate-100 dark:bg-slate-800 rounded" />
                </div>
              </div>
              <div className="h-9 w-24 bg-slate-100 dark:bg-slate-800 rounded-xl" />
            </div>
          ))}
        </div>
      ) : allOrders.length > 0 ? (
        <div className="space-y-4">
          {allOrders.map((order) => {
            const isCOD = order.paymentType === 'cod_partial' || order.paymentMethod?.includes('Cash on Delivery');
            const statusText = order.trackingStatus || order.status || 'Order Placed';
            const dateStr = order.createdAt?.toDate ? order.createdAt.toDate().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Recently Placed';

            return (
              <Card key={order.id} className="border border-slate-200/80 dark:border-slate-800 shadow-sm rounded-2xl bg-white dark:bg-slate-900 overflow-hidden hover:shadow-md transition-shadow">
                <CardContent className="p-5 sm:p-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
                    <div className="space-y-1">
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-base text-slate-900 dark:text-white">
                          #{order.id?.slice(-8).toUpperCase()}
                        </span>
                        <span className={cn(
                          "px-2.5 py-0.5 rounded-full text-xs font-semibold border",
                          STATUS_MAP[statusText] || 'bg-purple-50 text-purple-700 border-purple-200'
                        )}>
                          {statusText}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500">
                        Placed on {dateStr}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button asChild size="sm" className="rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-medium gap-1.5 h-9">
                        <Link href={`/account/tracking?id=${order.id}`}>
                          <Truck className="w-3.5 h-3.5" /> Track Order
                        </Link>
                      </Button>
                    </div>
                  </div>

                  {/* Order items preview */}
                  <div className="pt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-2">
                      {order.items?.slice(0, 3).map((item: any, i: number) => (
                        <div key={i} className="flex items-center gap-3 text-xs">
                          <Package className="w-4 h-4 text-purple-500 shrink-0" />
                          <span className="font-medium text-slate-800 dark:text-slate-200">
                            {item.name || item.title}
                          </span>
                          <span className="text-slate-400">×{item.qty || 1}</span>
                          {item.customization && (
                            <span className="px-2 py-0.5 rounded bg-purple-50 text-purple-700 font-medium text-[10px]">
                              &quot;{item.customization}&quot;
                            </span>
                          )}
                        </div>
                      ))}
                      {order.items && order.items.length > 3 && (
                        <p className="text-[11px] text-slate-400 italic">
                          +{order.items.length - 3} more items in this order
                        </p>
                      )}
                    </div>

                    {/* Price breakdown */}
                    <div className="text-right sm:border-l sm:border-slate-100 dark:sm:border-slate-800 sm:pl-6 shrink-0">
                      <div className="text-base font-bold text-slate-900 dark:text-white">
                        ₹{Number(order.total || 0).toLocaleString('en-IN')}
                      </div>
                      {order.gstTotal ? (
                        <div className="text-[10px] text-slate-400">
                          Incl. ₹{Number(order.gstTotal).toLocaleString('en-IN')} GST
                        </div>
                      ) : null}
                      <div className="text-[11px] font-medium text-slate-500 mt-0.5">
                        {isCOD ? (
                          <span className="text-amber-600 dark:text-amber-400 font-semibold">
                            ₹100 Paid Advance • ₹{Number(order.codBalance || 0).toLocaleString('en-IN')} COD Due
                          </span>
                        ) : (
                          <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                            ✓ Paid in Full via Razorpay
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <div className="py-20 text-center bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 p-8 space-y-4">
          <div className="w-16 h-16 bg-purple-50 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto text-purple-600">
            <ShoppingBag className="w-8 h-8" />
          </div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">No Orders Yet</h2>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            You haven&apos;t placed any orders yet. Once you complete checkout, your orders and live tracking will appear right here.
          </p>
          <Button asChild className="rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold h-10 px-6">
            <Link href="/collections">Start Shopping</Link>
          </Button>
        </div>
      )}
    </div>
  );
}
