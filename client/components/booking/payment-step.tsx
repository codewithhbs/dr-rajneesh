"use client";

import { motion } from "framer-motion";
import { CreditCard, Wallet, Calendar, Shield, Award, Check } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import axios from "axios";
import Cookies from "js-cookie";
import { API_ENDPOINT } from "@/constant/url";
import { useSettings } from "@/hooks/use-settings";



interface PaymentStepProps {
  paymentMethod: string;
  setPaymentMethod: (method: string) => void;
  selectedClinic: any;
  selectedSessions: number;
  selectedDate: string;
  selectedTimeSlot: string;
  patientName: string;
  taxAmount: number,
  patientPhone: string;
  totalAmount: number;
  cardFee: number;
  finalAmount: number;
  setBookingStatus: (status: "booking" | "success" | "failed") => void;
  setBookingId: (id: string) => void;
  razorpayLoaded: boolean;
}

const PaymentStep = (props: PaymentStepProps) => {
  const {
    paymentMethod, setPaymentMethod, selectedClinic, selectedSessions,
    selectedDate, selectedTimeSlot, patientName, patientPhone, taxAmount,
    totalAmount, cardFee, finalAmount, setBookingStatus, setBookingId, razorpayLoaded
  } = props;
  const { settings } = useSettings()

  const handlePayment = async () => {
    let bookingId = null;
    let paymentId = null;
    const cookieToken = Cookies.get("token");

    if (!razorpayLoaded) {
      toast.error("Payment system is loading. Please try again.");
      return;
    }

    try {
      const bookingData = {
        clinic_id: selectedClinic?._id,
        patient_details: {
          name: patientName,
          phone: patientPhone,
        },
        date: selectedDate,
        time: selectedTimeSlot,
        sessions: selectedSessions,
        payment_method: paymentMethod,
        amount: finalAmount,
      };

      const response = await axios.post(
        `${API_ENDPOINT}/user/bookings/sessions`,
        bookingData,
        {
          headers: {
            Authorization: `Bearer ${cookieToken}`,
          },
        }
      );

      const { booking, payment } = response.data?.data;
      bookingId = booking?.id;
      paymentId = payment?.id;

      if (response.data.success) {
        const callbackUrl = `${API_ENDPOINT}/user/bookings/verify-payment?booking_id=${bookingId}&payment_id=${paymentId}`;

        const options: any = {
          key: payment?.key || "rzp_test_demo_key",
          amount: payment?.amount * 100, // Razorpay expects paise
          currency: "INR",
          name: "🏥 Dr. Rajneesh Kant Clinic",
          description: `Consultation - ${selectedSessions} Session(s)`,
          order_id: payment?.orderId || undefined,
          redirect: true,
          callback_url: callbackUrl,
          prefill: {
            name: patientName,
            contact: patientPhone,
          },
          theme: {
            color: "#3B82F6",
          },
          handler: function (response: any) {
            window.location.href =
              `${callbackUrl}&razorpay_payment_id=${response.razorpay_payment_id}` +
              `&razorpay_order_id=${response.razorpay_order_id}` +
              `&razorpay_signature=${response.razorpay_signature}`;
          },
          modal: {
            ondismiss: async () => {
              try {
                await axios.post(
                  `${API_ENDPOINT}/user/bookings/payment-failed`,
                  {
                    booking_id: bookingId,
                    payment_id: paymentId,
                    error_description: "Payment was cancelled by the user.",
                    cancellation_reason: "user_dismissed_modal",
                    timestamp: new Date().toISOString(),
                  },
                  {
                    headers: {
                      Authorization: `Bearer ${cookieToken}`,
                    },
                  }
                );
                setBookingStatus("failed");
              } catch (err: any) {
                setBookingStatus("failed");
              }
            },
            escape: false,
            backdropclose: false,
          },
        };

        // ✅ Include card-only method if paymentMethod is "card"
        if (paymentMethod === "card") {
          options.method = { card: true };
        } else {
          options.method = { card: false };
        }

        if (!(window as any).Razorpay) {
          toast.error("Payment gateway is still loading. Please refresh and try again.");
          return;
        }

        const rzp = new (window as any).Razorpay(options);
        rzp.on("payment.failed", () => setBookingStatus("failed"));
        rzp.open();
      } else {
        throw new Error(response.data?.message || "Booking request was not successful");
      }
    } catch (error: any) {
      console.error("Error processing payment:", error);
      setBookingStatus("failed");
      toast.error(error?.response?.data?.message || "Payment failed. Please try again.");
    }
  };


  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="space-y-6"
    >
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.4 }}
        className="text-center space-y-3"
      >
        <div className="inline-flex items-center justify-center w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full mb-3">
          <CreditCard className="h-5 w-5 text-white" />
        </div>
        <h2 className="text-xl font-semibold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
          Payment & Confirmation
        </h2>
        <p className="text-sm text-slate-600 max-w-xl mx-auto">
          Review your booking details and complete the payment
        </p>
      </motion.div>

      <div className="grid lg:grid-cols-2 gap-6 max-w-5xl mx-auto">
        {/* Booking Summary */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2, duration: 0.4 }}
        >
          <Card className="bg-gradient-to-br from-slate-50 to-white border border-slate-200 shadow-md">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-lg flex items-center justify-center mr-2">
                  <Calendar className="h-4 w-4 text-white" />
                </div>
                Booking Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid gap-3">
                <div className="flex justify-between items-center p-3 bg-white rounded-lg shadow-sm border">
                  <span className="text-slate-600 text-sm font-medium">Location:</span>
                  <span className="font-semibold text-slate-900 text-sm">{selectedClinic?.clinic_name}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-white rounded-lg shadow-sm border">
                  <span className="text-slate-600 text-sm font-medium">Sessions:</span>
                  <span className="font-semibold text-slate-900 text-sm">
                    {selectedSessions} session{selectedSessions > 1 ? "s" : ""}
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 bg-white rounded-lg shadow-sm border">
                  <span className="text-slate-600 text-sm font-medium">Date & Time:</span>
                  <div className="text-right">
                    <div className="font-semibold text-slate-900 text-sm">
                      {new Date(selectedDate).toLocaleDateString()}
                    </div>
                    <div className="text-xs text-slate-600">{selectedTimeSlot}</div>
                  </div>
                </div>
                <div className="flex justify-between items-center p-3 bg-white rounded-lg shadow-sm border">
                  <span className="text-slate-600 text-sm font-medium">Patient:</span>
                  <div className="text-right">
                    <div className="font-semibold text-slate-900 text-sm">{patientName}</div>
                    <div className="text-xs text-slate-600">+91-{patientPhone}</div>
                  </div>
                </div>
              </div>

              <Separator className="my-4" />

              <div className="space-y-2">
                <div className="flex justify-between items-center p-3 bg-white rounded-lg shadow-sm">
                  <span className="text-slate-600 text-sm font-medium">Subtotal:</span>
                  <span className="font-semibold text-lg text-slate-900">₹{totalAmount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-white rounded-lg shadow-sm">
                  <span className="text-slate-600 text-sm font-medium">Tax {settings?.payment_config?.tax_percentage}%:</span>
                  <span className="font-semibold text-lg text-slate-900">₹{taxAmount.toLocaleString()}</span>
                </div>
                {cardFee > 0 && (
                  <div className="flex justify-between items-center p-3 bg-orange-50 rounded-lg shadow-sm border border-orange-200">
                    <span className="text-orange-700 text-sm font-medium">Card Processing Fee ({settings?.payment_config.credit_card_fee}%):</span>
                    <span className="font-semibold text-orange-700 text-sm">₹{cardFee.toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between items-center p-4 bg-gradient-to-r from-emerald-100 to-teal-100 rounded-lg shadow-md border border-emerald-300">
                  <span className="font-semibold text-lg text-slate-900">Total Amount:</span>
                  <span className="text-2xl font-bold text-emerald-600">₹{finalAmount.toLocaleString()}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Payment Method */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3, duration: 0.4 }}
        >
          <Card className="bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200 shadow-md">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center">
                <div className="w-8 h-8 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-lg flex items-center justify-center mr-2">
                  <CreditCard className="h-4 w-4 text-white" />
                </div>
                Payment Method
              </CardTitle>
            </CardHeader>
            <CardContent>
              <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod} className="space-y-3">
                <motion.div whileHover={{ scale: 1.01 }} className="relative">
                  <RadioGroupItem value="online" id="online" className="peer sr-only" />
                  <Label
                    htmlFor="online"
                    className="flex items-center p-4 rounded-lg border border-slate-200 cursor-pointer hover:border-emerald-300 hover:bg-emerald-50 peer-data-[state=checked]:border-emerald-500 peer-data-[state=checked]:bg-gradient-to-r peer-data-[state=checked]:from-emerald-50 peer-data-[state=checked]:to-teal-50 transition-all duration-200 bg-white shadow-sm"
                  >
                    <div className="w-10 h-10 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full flex items-center justify-center mr-3">
                      <Wallet className="h-5 w-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-base text-slate-900">Online Payment</div>
                      <div className="text-slate-600 text-sm">UPI, Net Banking, Digital Wallet</div>
                      <div className="text-xs text-emerald-600 font-medium mt-1">✓ Secure & Instant</div>
                    </div>
                    {paymentMethod === "online" && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center"
                      >
                        <Check className="h-4 w-4 text-white" />
                      </motion.div>
                    )}
                  </Label>
                </motion.div>

                <motion.div whileHover={{ scale: 1.01 }} className="relative">
                  <RadioGroupItem value="card" id="card" className="peer sr-only" />
                  <Label
                    htmlFor="card"
                    className="flex items-center p-4 rounded-lg border border-slate-200 cursor-pointer hover:border-emerald-300 hover:bg-emerald-50 peer-data-[state=checked]:border-emerald-500 peer-data-[state=checked]:bg-gradient-to-r peer-data-[state=checked]:from-emerald-50 peer-data-[state=checked]:to-teal-50 transition-all duration-200 bg-white shadow-sm"
                  >
                    <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center mr-3">
                      <CreditCard className="h-5 w-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-base text-slate-900">Credit/Debit Card</div>
                      <div className="text-slate-600 text-sm">Visa, Mastercard, RuPay</div>
                      <div className="text-xs text-orange-600 font-medium mt-1">+ {settings?.payment_config.credit_card_fee}% processing fee</div>
                    </div>
                    <div className="text-right">
                      {paymentMethod === "card" && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center mb-2"
                        >
                          <Check className="h-4 w-4 text-white" />
                        </motion.div>
                      )}
                      {paymentMethod === "card" && (
                        <Badge
                          variant="secondary"
                          className="bg-orange-100 text-orange-700 border border-orange-300 text-xs"
                        >
                          +₹{cardFee?.toLocaleString()}
                        </Badge>
                      )}
                    </div>
                  </Label>
                </motion.div>
              </RadioGroup>

              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 0.4 }}
                className="mt-6 p-4 bg-white rounded-lg border border-emerald-300 shadow-sm"
              >
                <div className="flex items-center mb-3">
                  <Shield className="h-5 w-5 text-emerald-600 mr-2" />
                  <h4 className="font-semibold text-base text-slate-900">Secure Payment</h4>
                </div>
                <p className="text-slate-600 text-sm leading-relaxed">
                  Your payment information is encrypted and secure. We use industry-standard security measures to protect your data.
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6, duration: 0.4 }}
                className="mt-4"
              >
                <Button
                  onClick={handlePayment}
                  disabled={!paymentMethod}
                  size="lg"
                  className="w-full flex items-center justify-center bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 shadow-md hover:shadow-lg transition-all duration-200 disabled:opacity-50 text-base"
                >
                  <CreditCard className="h-5 w-5 mr-2" />
                  Complete Payment - ₹{finalAmount.toLocaleString()}
                </Button>
              </motion.div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default PaymentStep;
