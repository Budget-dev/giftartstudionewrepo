'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import { useFirestore, useCollection, useDoc } from '@/firebase';
import { collection, query, orderBy, doc } from 'firebase/firestore';
import { getOptimizedImageUrl } from '@/lib/image-optimizer';

interface PurchasePopupItem {
  id: string;
  buyerName: string;
  productName: string;
  location: string;
  timeLabel: string;
  imageUrl: string;
  productUrl?: string;
  active?: boolean;
  order?: number;
}

interface PopupSettings {
  enabled?: boolean;
  intervalSeconds?: number;
}

export function LivePurchaseNotifications() {
  const db = useFirestore();
  const [index, setIndex] = useState(0);
  const [show, setShow] = useState(false);
  const [stoppedByUser, setStoppedByUser] = useState(false);

  // Respect visitor's choice to stop popups for this session
  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (sessionStorage.getItem('gas_popups_stopped') === '1') {
        setStoppedByUser(true);
      }
    }
  }, []);

  // Global admin on/off toggle
  const settingsRef = useMemo(() => {
    if (!db) return null;
    return doc(db, 'settings', 'purchase_popups');
  }, [db]);
  const { data: settings } = useDoc<PopupSettings>(settingsRef);

  // Admin-configured custom popups (no hardcoded demo items)
  const popupsQuery = useMemo(() => {
    if (!db) return null;
    return query(collection(db, 'purchase_popups'), orderBy('order', 'asc'));
  }, [db]);
  const { data: rawPopups } = useCollection<PurchasePopupItem>(popupsQuery, 'live_purchase_popups');

  const activePopups = useMemo(() => {
    if (!rawPopups || rawPopups.length === 0) return [];
    return rawPopups.filter((p) => p.active !== false && p.productName);
  }, [rawPopups]);

  const isEnabled = settings?.enabled !== false && activePopups.length > 0 && !stoppedByUser;
  const cycleMs = Math.max(8, settings?.intervalSeconds || 16) * 1000;

  useEffect(() => {
    if (!isEnabled) {
      setShow(false);
      return;
    }

    const startTimer = setTimeout(() => {
      setShow(true);
    }, 6000);

    const interval = setInterval(() => {
      setShow(false);
      setTimeout(() => {
        setIndex((prev) => (prev + 1) % activePopups.length);
        setShow(true);
      }, 600);
    }, cycleMs);

    return () => {
      clearTimeout(startTimer);
      clearInterval(interval);
    };
  }, [isEnabled, activePopups.length, cycleMs]);

  useEffect(() => {
    if (!show || !isEnabled) return;
    const hideTimer = setTimeout(() => {
      setShow(false);
    }, 5500);
    return () => clearTimeout(hideTimer);
  }, [show, isEnabled]);

  if (!isEnabled) return null;

  const current = activePopups[index % activePopups.length];
  if (!current) return null;

  const handleStop = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShow(false);
    setStoppedByUser(true);
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('gas_popups_stopped', '1');
    }
  };

  const pillContent = (
    <div className="flex items-center gap-2 md:gap-2.5 min-w-0 flex-1">
      {/* Circular Product Thumbnail */}
      <div className="relative w-8 h-8 md:w-10 md:h-10 rounded-full bg-slate-100 overflow-hidden shrink-0 ring-2 ring-purple-100 shadow-xs">
        <img
          src={getOptimizedImageUrl(current.imageUrl, 120, 80)}
          alt={current.productName}
          loading="lazy"
          className="w-full h-full object-cover"
        />
        <span
          className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-emerald-500 ring-1 ring-white"
          aria-hidden="true"
        />
      </div>

      {/* Compact Two-Line Text */}
      <div className="flex-1 min-w-0 leading-tight">
        <p className="text-[10px] md:text-[11px] font-bold text-slate-800 truncate flex items-center gap-1">
          <span className="text-purple-700 font-extrabold shrink-0">
            {current.buyerName || 'Someone'}
          </span>
          <span className="text-slate-400 font-medium shrink-0">bought</span>
          <span className="truncate text-slate-900 font-black">{current.productName}</span>
        </p>
        <p className="text-[9px] md:text-[10px] text-slate-500 font-medium truncate flex items-center gap-1 mt-0.5">
          <CheckCircle2 className="w-2.5 h-2.5 text-emerald-500 shrink-0" />
          <span className="truncate">
            {current.timeLabel || 'Recently'}
            {current.location ? ` • ${current.location}` : ''}
          </span>
        </p>
      </div>
    </div>
  );

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.94 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 12, scale: 0.94 }}
          transition={{ type: 'spring', stiffness: 260, damping: 22 }}
          className="fixed bottom-[76px] md:bottom-6 left-3 md:left-6 z-[90] max-w-[calc(100vw-88px)] sm:max-w-[300px] md:max-w-[340px] bg-white/92 backdrop-blur-xl rounded-full shadow-[0_10px_30px_rgba(95,37,159,0.14)] border border-purple-100/90 py-1.5 pl-1.5 pr-2.5 md:py-2 md:pl-2 md:pr-3 flex items-center gap-1.5 md:gap-2"
        >
          {current.productUrl ? (
            <Link href={current.productUrl} className="flex-1 min-w-0">
              {pillContent}
            </Link>
          ) : (
            pillContent
          )}

          {/* Stop / Dismiss Button */}
          <button
            type="button"
            onClick={handleStop}
            title="Stop purchase notifications"
            aria-label="Stop purchase notifications"
            className="w-6 h-6 rounded-full bg-slate-100 hover:bg-rose-50 text-slate-400 hover:text-rose-500 transition-colors flex items-center justify-center shrink-0"
          >
            <X className="w-3 h-3" />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
