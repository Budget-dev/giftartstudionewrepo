/**
 * @fileOverview PhonePe & Direct UPI Payment Configuration
 * 
 * -------------------------------------------------------------
 * HOW TO CONFIGURE YOUR PHONEPE & UPI PAYMENT:
 * -------------------------------------------------------------
 * 1. UPI ID:
 *    Change `upiId` below to your own PhonePe UPI ID (e.g. "9876543210@ybl" or "yourname@ibl").
 *    Or set NEXT_PUBLIC_PHONEPE_UPI_ID in your .env.local file.
 * 
 * 2. Payee / Store Name:
 *    Change `payeeName` below to your store name as registered on PhonePe (e.g. "GiftMart").
 *    Or set NEXT_PUBLIC_PHONEPE_PAYEE_NAME in your .env.local file.
 * 
 * 3. Custom QR Code Image:
 *    Save your PhonePe QR code image to: `public/images/phonepe-qr.png`
 *    Or set `customQrImage` below to any image path/URL.
 *    If custom image is not yet added, a dynamic UPI QR code is automatically generated for the exact order amount!
 */

export interface PhonePeConfig {
  upiId: string;
  payeeName: string;
  customQrImage: string;
  notePrefix: string;
}

export const PHONEPE_CONFIG: PhonePeConfig = {
  // Your PhonePe UPI ID (Update this to your actual PhonePe UPI ID)
  upiId: process.env.NEXT_PUBLIC_PHONEPE_UPI_ID || "giftmart@ybl",

  // Your Store Name / Payee Name displayed in PhonePe
  payeeName: process.env.NEXT_PUBLIC_PHONEPE_PAYEE_NAME || "GiftMart",

  // Path to your custom PhonePe QR Code image placed in public/images/
  customQrImage: process.env.NEXT_PUBLIC_PHONEPE_QR_IMAGE || "/images/phonepe-qr.png",

  // Prefix for transaction note shown in UPI apps
  notePrefix: "Order at GiftMart",
};

/**
 * Universal UPI Intent URL
 * Works with PhonePe, Google Pay, Paytm, BHIM, etc.
 */
export function getUpiIntentUrl(amount: number, orderRef?: string): string {
  const note = orderRef ? `${PHONEPE_CONFIG.notePrefix} #${orderRef}` : PHONEPE_CONFIG.notePrefix;
  const params = new URLSearchParams({
    pa: PHONEPE_CONFIG.upiId,
    pn: PHONEPE_CONFIG.payeeName,
    am: amount.toFixed(2),
    cu: "INR",
    tn: note,
  });
  return `upi://pay?${params.toString()}`;
}

/**
 * Direct PhonePe App Deep Link
 * Tries to open PhonePe directly on mobile devices
 */
export function getPhonePeAppUrl(amount: number, orderRef?: string): string {
  const note = orderRef ? `${PHONEPE_CONFIG.notePrefix} #${orderRef}` : PHONEPE_CONFIG.notePrefix;
  const params = new URLSearchParams({
    pa: PHONEPE_CONFIG.upiId,
    pn: PHONEPE_CONFIG.payeeName,
    am: amount.toFixed(2),
    cu: "INR",
    tn: note,
  });
  return `phonepe://pay?${params.toString()}`;
}

/**
 * Generates a dynamic QR code image URL for the exact amount using standard UPI intent
 */
export function getDynamicUpiQrCodeUrl(amount: number, orderRef?: string): string {
  const upiUrl = getUpiIntentUrl(amount, orderRef);
  return `https://api.qrserver.com/v1/create-qr-code/?size=320x320&margin=12&format=svg&data=${encodeURIComponent(upiUrl)}`;
}

