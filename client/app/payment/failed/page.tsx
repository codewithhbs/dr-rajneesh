"use client";
export const dynamic = "force-dynamic";

import React, { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';

function PaymentFailedContent() {
  const searchParams = useSearchParams();

  const bookingId = searchParams.get("order_id");
  const merchant = searchParams.get("merchent");
  const payVia = searchParams.get("pay_via");
  const errorMessage = searchParams.get("error") || "Payment was declined or failed";

  return (
    <div className="max-w-4xl mx-auto mt-12 p-6">
      <div className="text-center mb-8">
        <div className="mx-auto w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mb-6">
          <span className="text-5xl">❌</span>
        </div>

        <h1 className="text-4xl font-bold text-red-600 mb-2">
          Payment Failed
        </h1>
        <p className="text-gray-600 text-lg">
          Unfortunately, we couldn't process your payment
        </p>
      </div>

      <div className="bg-white shadow-xl rounded-2xl p-8">
        {/* Error Message */}
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 mb-8">
          <p className="text-red-700 font-medium text-center">
            {errorMessage}
          </p>
        </div>

        {/* Booking Information */}
        {bookingId && (
          <div className="border-b pb-6 mb-6">
            <h2 className="text-2xl font-semibold mb-4">Booking Details</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-gray-500">Booking ID</p>
                <p className="font-medium text-gray-800">{bookingId}</p>
              </div>
              {merchant && (
                <div>
                  <p className="text-gray-500">Merchant</p>
                  <p className="font-medium">{merchant}</p>
                </div>
              )}
              {payVia && (
                <div>
                  <p className="text-gray-500">Payment Method</p>
                  <p className="font-medium">{payVia}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* What You Can Do Next */}
        <div className="mb-8">
          <h3 className="text-xl font-semibold mb-4">What would you like to do?</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Link
              href={`/payment?order_id=${bookingId}`}
              className="flex items-center justify-center gap-3 bg-blue-600 hover:bg-blue-700 text-white font-medium py-4 px-6 rounded-2xl transition-all"
            >
              🔄 Try Payment Again
            </Link>

            <Link
              href="/bookings"
              className="flex items-center justify-center gap-3 border border-gray-300 hover:bg-gray-50 font-medium py-4 px-6 rounded-2xl transition-all"
            >
              📋 View My Bookings
            </Link>
          </div>
        </div>

        {/* Support Info */}
        <div className="bg-gray-50 p-6 rounded-xl text-center">
          <p className="text-gray-700 font-medium mb-2">
            Need help with your payment?
          </p>
          <p className="text-sm text-gray-600">
            Contact our support team at{' '}
            <a href="mailto:support@yourclinic.com" className="text-blue-600 hover:underline">
              support@yourclinic.com
            </a>
          </p>
          <p className="text-xs text-gray-500 mt-4">
            Your booking has not been confirmed yet. No amount has been deducted.
          </p>
        </div>
      </div>

      <div className="text-center mt-8">
        <Link href="/" className="text-gray-500 hover:text-gray-700 underline">
          ← Back to Home
        </Link>
      </div>
    </div>
  );
}

export default function PaymentFailedPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[#F8F7F4]">
          <Loader2 className="h-10 w-10 animate-spin text-[#185FA5]" />
        </div>
      }
    >
      <PaymentFailedContent />
    </Suspense>
  );
}