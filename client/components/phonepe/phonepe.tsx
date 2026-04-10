"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { CheckCircle, XCircle, Clock, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import axios from "axios";
import { toast } from "sonner";

const API_ENDPOINT = "https://api.drrajneeshkant.in/api/v1";

const PhonePeCallbackPage = () => {
  const searchParams = useSearchParams();
  const router = useRouter();

  const bookingId = searchParams.get("bookingId");
  const merchantOrderId = searchParams.get("merchantOrderId"); // Optional but useful

  const [status, setStatus] = useState<"checking" | "success" | "failed" | "pending">("checking");
  const [isPolling, setIsPolling] = useState(true);
  const [transactionId, setTransactionId] = useState<string | null>(null);

  // Poll payment status
  const checkPaymentStatus = useCallback(async () => {
    if (!bookingId) return;

    try {
      const res = await axios.get(
        `${API_ENDPOINT}/user/bookings/phonepe/status/${bookingId}`
      );

      const { status: paymentStatus, transactionId: txnId } = res.data;

      setTransactionId(txnId || null);

      if (paymentStatus === "completed") {
        setStatus("success");
        setIsPolling(false);
        toast.success("Payment completed successfully!");
      } else if (paymentStatus === "failed") {
        setStatus("failed");
        setIsPolling(false);
        toast.error("Payment failed. Please try again.");
      } 
      // Keep polling if still pending
      else {
        setStatus("pending");
      }
    } catch (error) {
      console.error("Status check failed:", error);
      setStatus("failed");
      setIsPolling(false);
      toast.error("Could not verify payment status");
    }
  }, [bookingId]);

  // Initial check + Polling
  useEffect(() => {
    if (!bookingId) {
      setStatus("failed");
      return;
    }

    // First immediate check
    checkPaymentStatus();

    // Poll every 3 seconds while pending
    const interval = setInterval(() => {
      if (isPolling && status === "pending") {
        checkPaymentStatus();
      } else {
        clearInterval(interval);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [bookingId, checkPaymentStatus, isPolling, status]);

  // Auto redirect after success
  useEffect(() => {
    if (status === "success") {
      const timer = setTimeout(() => {
        router.push(`/booking-success?bookingId=${bookingId}`);
      }, 2500);
      return () => clearTimeout(timer);
    }

    if (status === "failed") {
      const timer = setTimeout(() => {
        router.push(`/booking-failed?bookingId=${bookingId}`);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [status, bookingId, router]);

  return (
  <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardContent className="pt-10 pb-12 px-8 text-center">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.4 }}
          >
            {/* Status Icon */}
            {status === "checking" && (
              <div className="mx-auto w-20 h-20 flex items-center justify-center">
                <Loader2 className="w-20 h-20 text-blue-600 animate-spin" />
              </div>
            )}

            {status === "success" && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="mx-auto w-20 h-20 bg-green-100 rounded-full flex items-center justify-center"
              >
                <CheckCircle className="w-20 h-20 text-green-600" />
              </motion.div>
            )}

            {status === "failed" && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="mx-auto w-20 h-20 bg-red-100 rounded-full flex items-center justify-center"
              >
                <XCircle className="w-20 h-20 text-red-600" />
              </motion.div>
            )}

            {status === "pending" && (
              <div className="mx-auto w-20 h-20 flex items-center justify-center">
                <Clock className="w-20 h-20 text-amber-500" />
              </div>
            )}
          </motion.div>

          {/* Status Text */}
          <h1 className="mt-8 text-2xl font-semibold text-slate-900">
            {status === "checking" && "Verifying Payment..."}
            {status === "success" && "Payment Successful!"}
            {status === "failed" && "Payment Failed"}
            {status === "pending" && "Payment is Pending"}
          </h1>

          <p className="mt-3 text-slate-600 text-lg">
            {status === "checking" && "Please wait while we confirm your payment with PhonePe"}
            {status === "success" && "Thank you! Your booking has been confirmed."}
            {status === "failed" && "We couldn't process your payment. Please try again."}
            {status === "pending" && "Your payment is being processed. Please wait..."}
          </p>

          {transactionId && (
            <p className="mt-2 text-xs text-slate-500">
              Transaction ID: <span className="font-mono">{transactionId}</span>
            </p>
          )}

          {/* Action Buttons */}
          <div className="mt-10 space-y-3">
            {status === "success" && (
              <Button
                onClick={() => router.push(`/booking-success?bookingId=${bookingId}`)}
                className="w-full py-6 text-lg"
              >
                Go to Booking Details
              </Button>
            )}

            {status === "failed" && (
              <Button
                onClick={() => router.push(`/book-now`)}
                variant="outline"
                className="w-full py-6 text-lg"
              >
                Try Again
              </Button>
            )}

            {(status === "pending" || status === "checking") && (
              <Button
                disabled
                className="w-full py-6 text-lg bg-slate-100 text-slate-600"
              >
                Please wait...
              </Button>
            )}
          </div>

          <p className="mt-6 text-xs text-slate-500">
            Powered by PhonePe • Secure Payment
          </p>
        </CardContent>
      </Card>
    </div>

  
  );
};

export default PhonePeCallbackPage;