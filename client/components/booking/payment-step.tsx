"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { CreditCard, Wallet } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useSettings } from "@/hooks/use-settings";
import { useGetAllClinic } from "@/hooks/common";
import { useService } from "@/hooks/use-service";
import { toast } from "sonner";
import axios from "axios";
import Cookies from "js-cookie";
import { format } from "date-fns";

const API_ENDPOINT = "https://api.drrajneeshkant.in/api/v1";
const convertTo24Hour = (time: string) => {
  const [timePart, modifier] = time.split(" ");
  let [hours, minutes] = timePart.split(":").map(Number);

  if (modifier === "PM" && hours !== 12) hours += 12;
  if (modifier === "AM" && hours === 12) hours = 0;

  return `${hours.toString().padStart(2, "0")}:${minutes
    .toString()
    .padStart(2, "0")}`;
};
// Fetch add-ons from API
const useAddOns = () => {
  const [addOns, setAddOns] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAddOns = async () => {
      try {
        const response = await axios.get(`${API_ENDPOINT}/add-on`);
        if (response.data.success) {
          // Filter only active add-ons and sort by position
          const activeAddOns = response.data.data
            .filter((addon: any) => addon.is_active)
            .sort((a: any, b: any) => a.position - b.position);
          setAddOns(activeAddOns);
        }
      } catch (error) {
        console.error("Failed to fetch add-ons:", error);
        setAddOns([]);
      } finally {
        setLoading(false);
      }
    };
    fetchAddOns();
  }, []);

  return { addOns, loading };
};

const STEPS = ["Patient", "Service", "Clinic", "Schedule", "Payment"];

export default function PaymentBookingFlow() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { settings } = useSettings();
  const { data: clinicsData } = useGetAllClinic();
  const { services } = useService();
  const { addOns, loading: addOnsLoading } = useAddOns();

  // Extract all data from URL params
  const [bookingData, setBookingData] = useState({
    // Patient Details
    name: "",
    phone: "",
    email: "",
    aadhaar: "",
    gender: "male",
    age: "",
    userId: "",
    // Service & Clinic
    service: "",
    clinic: "",
    // Schedule
    date: "",
    time: "",
    sessions: 1,
    // Payment
    paymentMethod: "online" as "online" | "card",
    addons: [] as string[],
  });

  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentModal, setPaymentModal] = useState({
    isOpen: false,
    status: "idle" as "idle" | "processing" | "success" | "failed",
    error: "",
  });

  // Load data from URL params
  useEffect(() => {
    const urlData = {
      name: searchParams.get("name") || "",
      phone: searchParams.get("phone") || "",
      email: searchParams.get("email") || "",
      aadhaar: searchParams.get("aadhhar") || "",
      gender: searchParams.get("gender") || "male",
      age: searchParams.get("age") || "",
      userId: searchParams.get("userId") || "",
      service: searchParams.get("service") || "",
      clinic: searchParams.get("clinic") || "",
      date: searchParams.get("date") || "",
      time: searchParams.get("time") || "",
      sessions: parseInt(searchParams.get("sessions") || "1"),
      paymentMethod: (searchParams.get("paymentMethod") || "online") as
        | "online"
        | "card",
      addons: searchParams.get("addons")?.split(",").filter(Boolean) || [],
    };

    setBookingData(urlData);

    console.log("📥 Loaded booking data from URL:", urlData);
  }, [searchParams]);

  // Get clinic and service details
  const selectedClinic =
    clinicsData && bookingData.clinic
      ? Object.values(clinicsData).find(
          (c: any) => c._id === bookingData.clinic,
        )
      : null;

  const selectedService = services?.find(
    (s: any) => s._id === bookingData.service,
  );

  // Toggle addon
  const toggleAddon = (id: string) => {
    setBookingData((prev) => ({
      ...prev,
      addons: prev.addons.includes(id)
        ? prev.addons.filter((x) => x !== id)
        : [...prev.addons, id],
    }));
  };

  // Calculate pricing
  const calculatePricing = useCallback(() => {
    const basePrice = 10000;
    const sessionPrice = 5000;
    const subtotal = bookingData.sessions * basePrice;

    const addonsTotal = addOns
      .filter((a: any) => bookingData.addons.includes(a._id))
      .reduce((sum, a: any) => sum + a.price, 0);

    const taxAmount =
      ((subtotal + addonsTotal) *
        (settings?.payment_config?.tax_percentage || 0)) /
      100;
    const creditCardFee =
      bookingData.paymentMethod === "card"
        ? ((subtotal + addonsTotal) *
            (settings?.payment_config?.credit_card_fee || 0)) /
          100
        : 0;

    const total = subtotal + addonsTotal + taxAmount + creditCardFee;

    return {
      basePrice,
      sessionPrice,
      subtotal,
      addonsTotal,
      tax: taxAmount,
      creditCardFee,
      total,
    };
  }, [
    bookingData.sessions,
    bookingData.addons,
    bookingData.paymentMethod,
    settings,
  ]);

  // Report payment failure
  const reportPaymentFailure = async (
    bookingId: string | null,
    paymentId: string | null,
    errorDescription: string,
    token: string | undefined,
  ) => {
    if (!bookingId) {
      console.warn("⚠️ Cannot report payment failure - no booking ID");
      return;
    }

    try {
      console.log("📡 Reporting payment failure", {
        bookingId,
        paymentId,
        errorDescription,
      });

      await axios.post(
        `${API_ENDPOINT}/user/bookings/payemnt-failed`,

        {
          booking_id: bookingId,
          payment_id: paymentId,
          error_description: errorDescription,
          failure_timestamp: new Date().toISOString(),
          user_agent: navigator.userAgent,
          page_url: window.location.href,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      console.log("✅ Payment failure reported successfully");
    } catch (error: any) {
      console.error("🚨 Failed to report payment failure:", error);
    }
  };

  // Handle booking submission
  // const handleBookingSubmit = useCallback(async () => {
  //   console.log('🚀 Booking submission started', { timestamp: new Date().toISOString(), bookingData })

  //   setIsProcessing(true)
  //   const cookieToken = Cookies.get('token')
  //   let bookingId = null
  //   let paymentId = null

  //   try {
  //     // Validate required fields
  //     if (!bookingData.name || !bookingData.phone || !bookingData.email || !bookingData.aadhaar) {
  //       throw new Error('Missing patient details')
  //     }
  //     if (!bookingData.service || !bookingData.clinic) {
  //       throw new Error('Missing service or clinic selection')
  //     }
  //     if (!bookingData.date || !bookingData.time) {
  //       throw new Error('Missing schedule details')
  //     }

  //     // Format date
  //     const formattedDate = format(new Date(bookingData.date), 'yyyy-MM-dd')
  //     console.log('📅 Date formatted:', { original: bookingData.date, formatted: formattedDate })

  //     // Calculate payment details
  //     const paymentDetails = calculatePricing()
  //     console.log('💰 Payment details calculated:', paymentDetails)

  //     // Prepare payload
  //     const payload = {
  //       service_id: bookingData.service,
  //       clinic_id: bookingData.clinic,
  //       date: formattedDate,
  //       time: convertTo24Hour(bookingData.time),
  //       sessions: bookingData.sessions,
  //       payment_method: bookingData.paymentMethod === 'online' ? 'razorpay' : 'card',
  //       patient_details: {
  //         name: bookingData.name,
  //         email: bookingData.email,
  //         phone: bookingData.phone,
  //         aadhar: bookingData.aadhaar
  //       },
  //       paymentDetails,
  //       addons: bookingData.addons
  //     }

  //     console.log('📦 Payload prepared:', payload)

  //     // Submit booking
  //     const response = await axios.post(
  //       `${API_ENDPOINT}/user/bookings/sessions`,
  //       payload,
  //       {
  //         headers: { Authorization: `Bearer ${cookieToken}` }
  //       }
  //     )

  //     console.log('✅ Booking API response:', response.data)

  //     const { booking, payment } = response.data?.data || {}
  //     bookingId = booking?.id
  //     paymentId = payment?.id

  //     console.log('🎫 Booking and payment IDs:', { bookingId, paymentId })

  //     if (response.data.success) {
  //       // Show processing modal
  //       setPaymentModal({ isOpen: true, status: 'processing', error: '' })

  //       // Construct callback URL
  //       const callbackUrl = `${API_ENDPOINT}/user/bookings/verify-payment?booking_id=${bookingId}&payment_id=${paymentId}`

  //       console.log('🔗 Callback URL:', callbackUrl)

  //       // Razorpay options
  //       const options: any = {
  //         key: payment?.key || 'rzp_test_demo_key',
  //         amount: payment?.amount * 100,
  //         currency: 'INR',
  //         name: '🏥 Dr. Rajneesh Kant Clinic',
  //         description: `${selectedService?.service_name || 'Consultation'} - ${bookingData.sessions} Session(s)`,
  //         order_id: payment?.orderId || undefined,
  //         redirect: true,
  //         callback_url: callbackUrl,
  //         prefill: {
  //           name: bookingData.name,
  //           email: bookingData.email,
  //           contact: bookingData.phone
  //         },
  //         theme: {
  //           color: '#3B82F6'
  //         },
  //         handler: function (response: any) {
  //           console.log('✅ Razorpay payment success', response)
  //           window.location.href = `${callbackUrl}&razorpay_payment_id=${response.razorpay_payment_id}&razorpay_order_id=${response.razorpay_order_id}&razorpay_signature=${response.razorpay_signature}`
  //         },
  //         modal: {
  //           ondismiss: async () => {
  //             console.log('❌ Payment modal dismissed by user')
  //             try {
  //               await axios.post(
  //                 `${API_ENDPOINT}/user/bookings/payment-failed`,
  //                 {
  //                   booking_id: bookingId,
  //                   payment_id: paymentId,
  //                   error_description: 'Payment was cancelled by the user.',
  //                   cancellation_reason: 'user_dismissed_modal',
  //                   timestamp: new Date().toISOString()
  //                 },
  //                 {
  //                   headers: { Authorization: `Bearer ${cookieToken}` }
  //                 }
  //               )

  //               setPaymentModal({
  //                 isOpen: true,
  //                 status: 'failed',
  //                 error: 'Payment was cancelled by the user.'
  //               })
  //             } catch (err) {
  //               console.error('🚨 Error reporting cancellation:', err)
  //               setPaymentModal({
  //                 isOpen: true,
  //                 status: 'failed',
  //                 error: 'Payment cancelled. Could not notify server.'
  //               })
  //             }
  //           },
  //           escape: false,
  //           backdropclose: false
  //         },
  //         retry: {
  //           enabled: true,
  //           max_count: 3
  //         },
  //         timeout: 600
  //       }

  //       // Restrict to card if selected
  //       if (bookingData.paymentMethod === 'card') {
  //         options.method = {
  //           card: true,
  //           netbanking: false,
  //           upi: false,
  //           wallet: false,
  //           emi: false,
  //           paylater: false
  //         }
  //       }else{
  //            options.method = {
  //           card: false,
  //           netbanking: true,
  //           upi: true,
  //           wallet: true,
  //           emi: true,
  //           paylater: true
  //         }
  //       }

  //       console.log('🎛️ Razorpay options:', options)

  //       // Initialize Razorpay
  //       if (!(window as any).Razorpay) {
  //         throw new Error('Razorpay SDK not loaded')
  //       }

  //       const rzp = new (window as any).Razorpay(options)

  //       rzp.on('payment.failed', function (response: any) {
  //         console.error('❌ Razorpay payment failed', response.error)
  //         reportPaymentFailure(bookingId, paymentId, response.error.description || 'Payment failed', cookieToken)
  //       })

  //       console.log('🚀 Opening Razorpay checkout')
  //       rzp.open()
  //     } else {
  //       throw new Error(response.data?.message || 'Booking request was not successful')
  //     }
  //   } catch (error: any) {
  //     console.error('🚨 Booking submission error:', error)

  //     if (bookingId) {
  //       await reportPaymentFailure(
  //         bookingId,
  //         paymentId,
  //         error?.response?.data?.message || error.message || 'Booking API failed.',
  //         cookieToken
  //       )
  //     }

  //     setPaymentModal({
  //       isOpen: true,
  //       status: 'failed',
  //       error: error?.response?.data?.message || error.message || 'Something went wrong.'
  //     })

  //     toast.error(error?.response?.data?.message || error.message || 'Booking failed')
  //   } finally {
  //     setIsProcessing(false)
  //     console.log('🏁 Booking submission completed')
  //   }
  // }, [bookingData, selectedService, calculatePricing])

  const handleBookingSubmit = useCallback(async () => {
    setIsProcessing(true);

    const cookieToken = Cookies.get("token");
    let bookingId: string | null = null;

    try {
      // Validation
      if (!bookingData.name) throw new Error("Patient name is required");
      if (!bookingData.phone) throw new Error("Patient phone is required");
      if (!bookingData.email) throw new Error("Patient email is required");
      if (!bookingData.aadhaar) throw new Error("Patient Aadhaar is required");
      if (!bookingData.service)
        throw new Error("Service selection is required");
      if (!bookingData.clinic) throw new Error("Clinic selection is required");
      if (!bookingData.date) throw new Error("Booking date is required");
      if (!bookingData.time) throw new Error("Booking time is required");
      if (!cookieToken) throw new Error("Authentication token missing");

      const formattedDate = format(new Date(bookingData.date), "yyyy-MM-dd");
      const formattedTime = convertTo24Hour(bookingData.time);

      const paymentDetails = calculatePricing();

      const payload = {
        service_id: bookingData.service,
        clinic_id: bookingData.clinic,
        date: formattedDate,
        time: formattedTime,
        sessions: bookingData.sessions,
        payment_method: bookingData.paymentMethod,
        patient_details: {
          name: bookingData.name,
          email: bookingData.email,
          phone: bookingData.phone,
          aadhar: bookingData.aadhaar,
        },
        paymentDetails,
        addons: bookingData.addons || [],
      };

      const response = await axios.post(
        `${API_ENDPOINT}/user/bookings/sessions`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${cookieToken}`,
          },
        },
      );

      if (!response?.data?.success) {
        throw new Error(response?.data?.message || "Booking request failed");
      }

      const { booking, payuFormHtml } = response.data?.data || {};
      bookingId = booking?.id || null;

      if (!bookingId) {
        throw new Error("Missing booking ID from server");
      }

      if (!payuFormHtml) {
        throw new Error("Missing PayU form from server");
      }

      setPaymentModal({
        isOpen: true,
        status: "processing",
        error: "",
      });

      // Inject PayU form
      const container = document.createElement("div");
      container.style.display = "none";
      container.innerHTML = payuFormHtml;

      document.body.appendChild(container);

      const form = container.querySelector("form") as HTMLFormElement | null;

      if (!form) {
        throw new Error("PayU form not found in HTML");
      }

      if (bookingData.paymentMethod !== "card") {
        // Remove card payment option
        const enforce = document.createElement("input");
        enforce.type = "hidden";
        enforce.name = "drop_category";
        enforce.value = "creditcard,debitcard";

        form.appendChild(enforce);
      }

      // Restrict to credit card only
      if (bookingData.paymentMethod === "card") {
        const pg = document.createElement("input");
        pg.type = "hidden";
        pg.name = "pg";
        pg.value = "CC";

        const enforce = document.createElement("input");
        enforce.type = "hidden";
        enforce.name = "enforce_paymethod";
        enforce.value = "creditcard";

        form.appendChild(pg);
        form.appendChild(enforce);
      }

      form.submit();
    } catch (error: any) {
      const errorMessage =
        error?.response?.data?.message ||
        error?.message ||
        "Something went wrong while creating booking.";

      if (bookingId) {
        try {
          await axios.post(
            `${API_ENDPOINT}/user/bookings/payment-failed`,
            {
              booking_id: bookingId,
              error_description: errorMessage,
              cancellation_reason: "initiation_failed",
              timestamp: new Date().toISOString(),
            },
            {
              headers: {
                Authorization: `Bearer ${cookieToken}`,
              },
            },
          );
        } catch {}
      }

      setPaymentModal({
        isOpen: true,
        status: "failed",
        error: errorMessage,
      });

      toast.error(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  }, [bookingData, calculatePricing]);

  const pricing = calculatePricing();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-xl overflow-hidden"
        >
          {/* Progress Bar */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6">
            <div className="flex justify-between items-center max-w-4xl mx-auto">
              {STEPS.map((step, index) => {
                const stepNum = index + 1;
                const isCompleted = stepNum <= 5;

                return (
                  <div key={step} className="flex items-center flex-1">
                    <div className="flex flex-col items-center flex-1">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all ${
                          isCompleted
                            ? "bg-green-500 text-white"
                            : "bg-blue-400 text-white"
                        }`}
                      >
                        {isCompleted ? "✓" : stepNum}
                      </div>
                      <span className="text-xs mt-2 font-medium text-white">
                        {step}
                      </span>
                    </div>
                    {index < STEPS.length - 1 && (
                      <div
                        className={`h-1 flex-1 mx-2 rounded ${isCompleted ? "bg-green-400" : "bg-blue-400"}`}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Booking Summary */}
          <div className="p-6 bg-slate-50 border-b">
            <h3 className="font-semibold text-lg mb-4">📋 Booking Summary</h3>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-slate-600">Patient:</span>
                <p className="font-semibold">{bookingData.name || "N/A"}</p>
                <p className="text-slate-500">{bookingData.phone || "N/A"}</p>
              </div>
              <div>
                <span className="text-slate-600">Service:</span>
                <p className="font-semibold">
                  {selectedService?.service_name ||
                    bookingData.service ||
                    "N/A"}
                </p>
              </div>
              <div>
                <span className="text-slate-600">Clinic:</span>
                <p className="font-semibold">
                  {selectedClinic?.clinic_name || bookingData.clinic || "N/A"}
                </p>
              </div>
              <div>
                <span className="text-slate-600">Schedule:</span>
                <p className="font-semibold">
                  {bookingData.date
                    ? new Date(bookingData.date).toLocaleDateString()
                    : "N/A"}
                </p>
                <p className="text-slate-500">
                  {bookingData.time || "N/A"} • {bookingData.sessions}{" "}
                  session(s)
                </p>
              </div>
            </div>
          </div>

          {/* Payment Section */}
          <div className="p-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="space-y-8"
            >
              <div className="text-center space-y-2">
                <h2 className="text-xl font-semibold text-slate-900">
                  Payment & Add-On Services
                </h2>
                <p className="text-sm text-slate-600">
                  Select optional treatments and choose payment method
                </p>
              </div>

              <div className="grid lg:grid-cols-2 gap-6 max-w-5xl mx-auto">
                {/* ADD-ONS */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">
                      Add-On Treatments (Optional)
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {addOnsLoading ? (
                      <div className="text-center py-8 text-slate-500">
                        Loading add-ons...
                      </div>
                    ) : addOns.length === 0 ? (
                      <div className="text-center py-8 text-slate-500">
                        No add-ons available
                      </div>
                    ) : (
                      addOns.map((addon: any) => {
                        const checked = bookingData.addons.includes(addon._id);
                        return (
                          <div
                            key={addon._id}
                            className={cn(
                              "flex items-start gap-3 p-4 rounded-lg border transition",
                              checked
                                ? "border-blue-500 bg-blue-50"
                                : "border-slate-200 bg-white",
                            )}
                          >
                            <Checkbox
                              checked={checked}
                              onCheckedChange={() => toggleAddon(addon._id)}
                            />
                            <div className="flex-1">
                              <p className="font-semibold text-slate-900">
                                {addon.title}
                              </p>
                            </div>
                            <div className="font-semibold text-slate-900">
                              ₹{addon.price.toLocaleString()}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </CardContent>
                </Card>

                {/* PAYMENT METHOD */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Payment Method</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <RadioGroup
                      value={bookingData.paymentMethod}
                      onValueChange={(v) =>
                        setBookingData((prev) => ({
                          ...prev,
                          paymentMethod: v as any,
                        }))
                      }
                      className="space-y-3"
                    >
                      <Label
                        htmlFor="online"
                        className="flex items-center gap-3 p-4 border rounded-lg cursor-pointer"
                      >
                        <RadioGroupItem value="online" id="online" />
                        <Wallet className="h-5 w-5 text-green-600" />
                        <span className="font-medium">
                          Online Payment (UPI/Net Banking)
                        </span>
                      </Label>

                      <Label
                        htmlFor="card"
                        className="flex items-center gap-3 p-4 border rounded-lg cursor-pointer"
                      >
                        <RadioGroupItem value="card" id="card" />
                        <CreditCard className="h-5 w-5 text-blue-600" />
                        <span className="font-medium">Credit / Debit Card</span>
                      </Label>
                    </RadioGroup>

                    {/* PRICING BREAKDOWN */}
                    <div className="mt-6 space-y-2 text-sm border-t pt-4">
                      <div className="flex justify-between">
                        <span>Sessions ({bookingData.sessions}x)</span>
                        <span>₹{pricing.sessionPrice}</span>
                      </div>
                      {pricing.addonsTotal > 0 && (
                        <div className="flex justify-between text-blue-600">
                          <span>Add-Ons</span>
                          <span>₹{pricing.addonsTotal.toLocaleString()}</span>
                        </div>
                      )}
                      {pricing.tax > 0 && (
                        <div className="flex justify-between text-slate-600">
                          <span>
                            Tax ({settings?.payment_config?.tax_percentage || 0}
                            %)
                          </span>
                          <span>₹{pricing.tax.toLocaleString()}</span>
                        </div>
                      )}
                      {pricing.creditCardFee > 0 && (
                        <div className="flex justify-between text-orange-600">
                          <span>
                            Card Processing Fee (
                            {settings?.payment_config?.credit_card_fee || 0}%)
                          </span>
                          <span>₹{pricing.creditCardFee.toLocaleString()}</span>
                        </div>
                      )}
                      <div className="flex justify-between font-bold text-lg border-t pt-2 mt-2">
                        <span>Total Amount</span>
                        <span className="text-green-600">
                          ₹{pricing.total.toLocaleString()}
                        </span>
                      </div>
                    </div>

                    <Button
                      onClick={handleBookingSubmit}
                      disabled={isProcessing}
                      className="w-full mt-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-semibold py-6 text-lg"
                    >
                      {isProcessing
                        ? "⏳ Processing..."
                        : `💳 Pay ₹${pricing.total.toLocaleString()}`}
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </div>

      {/* Payment Status Modal */}
      {paymentModal.isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-xl p-8 max-w-md w-full text-center"
          >
            {paymentModal.status === "processing" && (
              <>
                <div className="animate-spin w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">
                  Processing Payment...
                </h3>
                <p className="text-slate-600">
                  Please complete the payment in the Payu window
                </p>
              </>
            )}
            {paymentModal.status === "failed" && (
              <>
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-4xl">❌</span>
                </div>
                <h3 className="text-xl font-semibold mb-2 text-red-600">
                  Payment Failed
                </h3>
                <p className="text-slate-600 mb-4">{paymentModal.error}</p>
                <Button
                  onClick={() =>
                    setPaymentModal({
                      isOpen: false,
                      status: "idle",
                      error: "",
                    })
                  }
                >
                  Close
                </Button>
              </>
            )}
          </motion.div>
        </div>
      )}
    </div>
  );
}
