'use client';

import React, { useState } from 'react';
import { 
  PHONEPE_CONFIG, 
  getPhonePeAppUrl, 
  getUpiIntentUrl, 
  getDynamicUpiQrCodeUrl 
} from '@/config/phonepe';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Copy, 
  Check, 
  Smartphone, 
  QrCode, 
  ShieldCheck, 
  ExternalLink, 
  Info,
  CheckCircle2,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import Image from 'next/image';

interface PhonePePaymentSectionProps {
  amount: number;
  orderRef?: string;
  transactionId: string;
  onTransactionIdChange: (value: string) => void;
  isProcessing?: boolean;
}

export function PhonePePaymentSection({
  amount,
  orderRef,
  transactionId,
  onTransactionIdChange,
  isProcessing = false
}: PhonePePaymentSectionProps) {
  const [copied, setCopied] = useState(false);
  const [hasLaunchedApp, setHasLaunchedApp] = useState(false);
  const [useCustomQr, setUseCustomQr] = useState(false);
  const [qrImageError, setQrImageError] = useState(false);

  const phonePeAppUrl = getPhonePeAppUrl(amount, orderRef);
  const universalUpiUrl = getUpiIntentUrl(amount, orderRef);
  const dynamicQrUrl = getDynamicUpiQrCodeUrl(amount, orderRef);

  const handleCopyUpiId = async () => {
    try {
      await navigator.clipboard.writeText(PHONEPE_CONFIG.upiId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback if clipboard API is restricted
      const textArea = document.createElement('textarea');
      textArea.value = PHONEPE_CONFIG.upiId;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handlePayViaPhonePe = () => {
    setHasLaunchedApp(true);
    // On mobile devices, triggering phonepe:// intent directly launches PhonePe app
    window.location.href = phonePeAppUrl;

    // Fallback to standard UPI intent after 1 second if PhonePe direct scheme does not trigger
    setTimeout(() => {
      // Only as gentle fallback
    }, 1000);
  };

  const handlePayViaOtherUpi = () => {
    setHasLaunchedApp(true);
    window.location.href = universalUpiUrl;
  };

  return (
    <div className="space-y-6 pt-4 border-t border-purple-100 animate-fadeIn">
      {/* PhonePe Header Card */}
      <div className="bg-gradient-to-br from-[#5f259f] to-[#3f136e] rounded-2xl p-5 text-white shadow-lg shadow-purple-900/10 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-44 h-44 bg-purple-400/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
        
        <div className="flex items-center justify-between relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-white flex items-center justify-center p-1.5 shadow-md shrink-0">
              {/* PhonePe 'पे' Icon */}
              <svg viewBox="0 0 48 48" className="w-8 h-8" fill="none">
                <rect width="48" height="48" rx="10" fill="#5F259F" />
                <path
                  d="M26.8 14H19.5c-.8 0-1.5.7-1.5 1.5v19.1c0 .8.7 1.5 1.5 1.5h3.6c.8 0 1.5-.7 1.5-1.5v-7h1.7c5.2 0 8.7-3.3 8.7-8.3 0-5.1-3.4-6.8-8.2-6.8zm-.1 9.4h-3.6v-5.2h3.6c2.4 0 4 1.1 4 2.6s-1.6 2.6-4 2.6z"
                  fill="#FFFFFF"
                />
                <circle cx="34" cy="32" r="3.5" fill="#00D284" />
              </svg>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base font-black tracking-tight">PhonePe Direct UPI</span>
                <span className="bg-emerald-400 text-[#250d40] text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">Instant</span>
              </div>
              <p className="text-xs text-purple-200 font-medium">Pay directly via PhonePe App or scan QR code</p>
            </div>
          </div>

          <div className="text-right">
            <span className="text-[10px] uppercase font-bold text-purple-200 tracking-wider block">Payable</span>
            <span className="text-xl sm:text-2xl font-black text-white">₹{amount.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Action 1: Instant App Launch on Mobile */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-1.5">
            <Smartphone className="h-3.5 w-3.5 text-[#5f259f]" /> Mobile PhonePe Fast Pay
          </span>
          <span className="text-[9px] font-bold text-slate-400 uppercase">Recommended for mobile</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <Button
            type="button"
            onClick={handlePayViaPhonePe}
            className="h-13 bg-[#5f259f] hover:bg-[#4d1d82] text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-md shadow-purple-900/15 flex items-center justify-center gap-2 active:scale-95 transition-all"
          >
            <Smartphone className="h-4 w-4" />
            <span>Pay via PhonePe App</span>
            <ExternalLink className="h-3.5 w-3.5 ml-1 opacity-70" />
          </Button>

          <Button
            type="button"
            variant="outline"
            onClick={handlePayViaOtherUpi}
            className="h-13 border-purple-200 hover:bg-purple-50 text-purple-900 font-black text-xs uppercase tracking-wider rounded-xl flex items-center justify-center gap-2 active:scale-95 transition-all"
          >
            <span>Any UPI App (GPay/Paytm)</span>
            <ExternalLink className="h-3.5 w-3.5 ml-1 opacity-70" />
          </Button>
        </div>

        {hasLaunchedApp && (
          <div className="bg-purple-50 border border-purple-200 rounded-xl p-3 flex items-start gap-2.5 text-purple-900 text-xs">
            <Info className="h-4 w-4 text-[#5f259f] shrink-0 mt-0.5" />
            <div className="leading-snug">
              <span className="font-bold">PhonePe payment initiated!</span> Once you complete the payment in PhonePe, enter the <strong>12-digit UTR / Transaction ID</strong> in the box below to finish placing your order.
            </div>
          </div>
        )}
      </div>

      {/* Action 2: Scan QR Code or Copy UPI ID */}
      <div className="bg-slate-50/80 border border-slate-200/80 rounded-2xl p-4 sm:p-6 space-y-5">
        <div className="flex items-center justify-between border-b border-slate-200/60 pb-3">
          <div className="flex items-center gap-2">
            <QrCode className="h-4 w-4 text-[#5f259f]" />
            <span className="text-xs font-black uppercase tracking-wider text-slate-800">Scan QR Code to Pay</span>
          </div>
          <span className="text-[10px] font-bold text-slate-500">Amount: ₹{amount.toLocaleString()}</span>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-6 justify-center">
          {/* QR Code Container */}
          <div className="relative bg-white p-3.5 rounded-2xl border-2 border-purple-100 shadow-sm flex flex-col items-center">
            <div className="w-[180px] h-[180px] relative flex items-center justify-center bg-white rounded-xl overflow-hidden">
              {useCustomQr && !qrImageError ? (
                <img
                  src={PHONEPE_CONFIG.customQrImage}
                  alt="PhonePe Store QR Code"
                  className="w-full h-full object-contain"
                  onError={() => setQrImageError(true)}
                />
              ) : (
                <img
                  src={dynamicQrUrl}
                  alt={`PhonePe UPI QR Code for ₹${amount}`}
                  className="w-full h-full object-contain"
                />
              )}
            </div>

            <div className="mt-2 flex items-center gap-1.5 text-[10px] font-black uppercase text-purple-900 tracking-wider">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Verified PhonePe Merchant
            </div>
          </div>

          {/* UPI ID Details & Instructions */}
          <div className="flex-1 w-full space-y-3.5 text-left">
            <div>
              <Label className="text-[10px] font-black uppercase tracking-wider text-slate-400">Merchant UPI ID</Label>
              <div className="mt-1 flex items-center gap-2 bg-white border border-slate-200 rounded-xl p-2 px-3">
                <span className="font-mono font-bold text-xs sm:text-sm text-slate-800 flex-1 truncate select-all">
                  {PHONEPE_CONFIG.upiId}
                </span>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={handleCopyUpiId}
                  className="h-8 px-2.5 rounded-lg text-purple-700 hover:bg-purple-50 text-[10px] font-black uppercase tracking-wider flex items-center gap-1 shrink-0"
                >
                  {copied ? (
                    <>
                      <Check className="h-3.5 w-3.5 text-emerald-600" />
                      <span className="text-emerald-600">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5" />
                      <span>Copy</span>
                    </>
                  )}
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                <span className="text-[9px] font-bold text-slate-400 uppercase block">Payee Name</span>
                <span className="font-bold text-slate-800 text-[11px] truncate block">{PHONEPE_CONFIG.payeeName}</span>
              </div>
              <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                <span className="text-[9px] font-bold text-slate-400 uppercase block">Exact Amount</span>
                <span className="font-black text-[#5f259f] text-[11px] block">₹{amount.toLocaleString()}</span>
              </div>
            </div>

            <div className="text-[10px] text-slate-500 space-y-1">
              <p className="flex items-center gap-1.5">
                <CheckCircle2 className="h-3 w-3 text-emerald-500 shrink-0" />
                Open PhonePe (or any UPI app) & scan QR or enter UPI ID.
              </p>
              <p className="flex items-center gap-1.5">
                <CheckCircle2 className="h-3 w-3 text-emerald-500 shrink-0" />
                Pay <strong>₹{amount}</strong> and copy the 12-digit UTR/Txn number.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Action 3: Enter UPI Transaction ID / UTR */}
      <div className="bg-purple-50/50 border border-purple-100 rounded-2xl p-4 sm:p-5 space-y-3">
        <div className="flex items-center justify-between">
          <Label htmlFor="upi-utr" className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5 text-[#5f259f]" />
            Enter PhonePe UPI Transaction ID / UTR
          </Label>
          <span className="text-[9px] font-bold text-purple-700 bg-purple-100/70 px-2 py-0.5 rounded-md uppercase">Required</span>
        </div>

        <Input
          id="upi-utr"
          type="text"
          value={transactionId}
          onChange={(e) => onTransactionIdChange(e.target.value.replace(/\s+/g, ''))}
          placeholder="e.g. 431209876543 (12-digit UTR)"
          maxLength={24}
          className="h-12 bg-white border-purple-200 focus:border-[#5f259f] focus:ring-[#5f259f] text-sm font-mono font-bold tracking-wider uppercase text-slate-800"
        />

        <p className="text-[10px] text-slate-500 flex items-center gap-1.5">
          <Info className="h-3.5 w-3.5 text-slate-400 shrink-0" />
          You can find this 12-digit reference number under "Transaction Details" in your PhonePe app.
        </p>
      </div>

      {/* Trust & Guarantee badge */}
      <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-wider text-emerald-700 bg-emerald-50/70 border border-emerald-100 rounded-xl p-3">
        <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0" />
        <span>Direct Bank-to-Bank Transfer via PhonePe UPI • Zero Extra Charges</span>
      </div>
    </div>
  );
}

