import { NextResponse } from 'next/server';
import { createRazorpayOrder, RAZORPAY_KEY_ID } from '@/lib/razorpay';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { amount, receipt, notes } = body;

    const numAmount = Number(amount);
    if (!amount || isNaN(numAmount) || numAmount < 1 || numAmount > 500000) {
      return NextResponse.json(
        { success: false, error: 'Invalid order amount' },
        { status: 400 }
      );
    }

    const cleanReceipt = String(receipt || `rcpt_${Date.now()}`).slice(0, 40).replace(/[^a-zA-Z0-9_-]/g, '');

    const order = await createRazorpayOrder({
      amount: numAmount,
      receipt: cleanReceipt,
      notes: typeof notes === 'object' && notes !== null ? notes : {}
    });

    return NextResponse.json({
      success: true,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: RAZORPAY_KEY_ID
    });
  } catch (error: any) {
    console.error('Razorpay Create Order Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to initiate Razorpay order' },
      { status: 500 }
    );
  }
}
