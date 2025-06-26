"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MapPin,
  Phone,
  CreditCard,
  Wallet,
  ChevronLeft,
  ChevronRight,
  Check,
  User,
  Sun,
  Star,
  CheckCircle,
  XCircle,
  Calendar,
  Clock,
  Home,
  UserCheck,
  Send,
  Shield,
  Sparkles,
  Heart,
  Award
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import Cookies from "js-cookie";
import { useGetAllClinic } from "@/hooks/common";

interface ClinicInfo {
  _id: string;
  clinic_name: string;
  address: string;
  phones: string[];
}

interface TimeSlot {
  time: string;
  available: boolean;
}

const BookNowConsultations = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [bookingStatus, setBookingStatus] = useState<
    "booking" | "success" | "failed"
  >("booking");
  const [selectedLocation, setSelectedLocation] = useState<string>("");
  const [selectedSessions, setSelectedSessions] = useState<number>(1);
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string>("");
  const [patientName, setPatientName] = useState<string>("");
  const [patientPhone, setPatientPhone] = useState<string>("");
  const [otp, setOtp] = useState<string>("");
  const [isOtpSent, setIsOtpSent] = useState<boolean>(false);
  const [isOtpVerified, setIsOtpVerified] = useState<boolean>(false);
  const [paymentMethod, setPaymentMethod] = useState<string>("online");
  const [bookingId, setBookingId] = useState<string>("");
  const [availableDates, setAvailableDates] = useState([]);
  const [selectedClinic, setSelectedClinic] = useState(null);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [razorpayLoaded, setRazorpayLoaded] = useState(false);
  const { data } = useGetAllClinic();
  const containerRef = useRef<HTMLDivElement>(null);

  const sessionPrice = 10000;
  const sessionMRP = 12000;
  const cardFeePercentage = 2.5;

  const totalAmount = selectedSessions * sessionPrice;
  const cardFee =
    paymentMethod === "card" ? (totalAmount * cardFeePercentage) / 100 : 0;
  const finalAmount = totalAmount + cardFee;

  const progress = (currentStep / 4) * 100;

  // Scroll to top when step changes
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  }, [currentStep]);

  useEffect(() => {
    if (
      selectedLocation !== "" &&
      currentStep === 1 &&
      data &&
      data[selectedLocation]
    ) {
      setSelectedClinic(data[selectedLocation]);
      toast.success(
        `Great choice! ${data[selectedLocation].clinic_name} is ready to serve you.`
      );
      setTimeout(() => {
        setCurrentStep(2);
      }, 1500);
    }
  }, [selectedLocation, currentStep, data]);

  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => setRazorpayLoaded(true);
    document.body.appendChild(script);
    return () => {
      document.body.removeChild(script);
    };
  }, []);

  const fetchAvailableDates = useCallback(async (clinicId) => {
    if (!clinicId) return;

    setIsLoadingSlots(true);
    try {
      const response = await fetch(
        `http://localhost:8000/api/v1/get-available-date?_id=${clinicId}`
      );
      const result = await response.json();

      if (result.availableDates) {
        setAvailableDates(result.availableDates);
      }
    } catch (error) {
      console.error("Error fetching available dates:", error);
      toast.error("Failed to load available dates");
    } finally {
      setIsLoadingSlots(false);
    }
  }, []);

  useEffect(() => {
    if (selectedClinic && selectedClinic._id) {
      fetchAvailableDates(selectedClinic._id);
    }
  }, [selectedClinic, fetchAvailableDates]);

  const handleSendOtp = async () => {
    if (patientPhone.length !== 10) return;

    setIsRegistering(true);
    try {
      const response = await fetch(
        "http://localhost:8000/api/v1/register-patinet",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            phone: patientPhone,
            name: patientName,
          }),
        }
      );

      const result = await response.json();

      if (response.ok) {
        setIsOtpSent(true);
        toast.success(`OTP sent to +91-${patientPhone}`);
      } else {
        toast.error(result.message || "Failed to send OTP");
      }
    } catch (error) {
      console.error("Error sending OTP:", error);
      toast.error("Failed to send OTP");
    } finally {
      setIsRegistering(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (otp.length !== 4) return;

    setIsVerifyingOtp(true);
    try {
      const response = await fetch("http://localhost:8000/api/v1/verify-otp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          phone: patientPhone,
          otp: otp,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        setIsOtpVerified(true);
        toast.success("Phone number verified successfully!");
        // Store verification token if provided
        if (result.token) {
          Cookies.set("verification_token", result.token, { expires: 1 });
        }
      } else {
        toast.error(result.message || "Invalid OTP");
      }
    } catch (error) {
      console.error("Error verifying OTP:", error);
      toast.error("Failed to verify OTP");
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  const handleResendOtp = async () => {
    try {
      const response = await fetch("http://localhost:8000/api/v1/resend-otp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          phone: patientPhone,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        toast.success("OTP resent successfully");
      } else {
        toast.error(result.message || "Failed to resend OTP");
      }
    } catch (error) {
      console.error("Error resending OTP:", error);
      toast.error("Failed to resend OTP");
    }
  };

  const handleNext = () => {
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handlePayment = async () => {
    if (!razorpayLoaded) {
      toast.error("Payment system is loading. Please try again.");
      return;
    }

    try {
      // Create booking with payment
      const bookingData = {
        clinic_id: selectedClinic._id,
        patient_name: patientName,
        patient_phone: patientPhone,
        appointment_date: selectedDate,
        appointment_time: selectedTimeSlot,
        sessions: selectedSessions,
        payment_method: paymentMethod,
        amount: finalAmount,
      };

      const response = await fetch(
        "http://localhost:8000/api/v1/booking-with-pay",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${Cookies.get("verification_token") || ""}`,
          },
          body: JSON.stringify(bookingData),
        }
      );

      const result = await response.json();

      if (response.ok && result.razorpay_order) {
        // Initialize Razorpay
        const options = {
          key: result.razorpay_key || "rzp_test_your_key_here", // Replace with your test key
          amount: result.razorpay_order.amount,
          currency: result.razorpay_order.currency,
          name: selectedClinic.clinic_name,
          description: `Consultation Booking - ${selectedSessions} session(s)`,
          order_id: result.razorpay_order.id,
          handler: function (response) {
            // Payment successful
            setBookingId(result.booking_id || `BK${Date.now()}`);
            setBookingStatus("success");

            // Store payment response in cookies and session
            const paymentData = {
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_signature: response.razorpay_signature,
              booking_id: result.booking_id,
              amount: finalAmount,
              timestamp: new Date().toISOString(),
            };

            Cookies.set("last_payment", JSON.stringify(paymentData), {
              expires: 30,
            });
            sessionStorage.setItem(
              "payment_response",
              JSON.stringify(paymentData)
            );

            toast.success(
              "Payment successful! Your consultation has been booked."
            );
          },
          modal: {
            ondismiss: function () {
              toast.error("Payment cancelled");
            },
          },
          prefill: {
            name: patientName,
            contact: patientPhone,
          },
          theme: {
            color: "#3B82F6",
          },
        };

        const rzp = new window.Razorpay(options);
        rzp.on("payment.failed", function (response) {
          setBookingStatus("failed");
          toast.error("Payment failed. Please try again.");
          console.error("Payment failed:", response.error);
        });

        rzp.open();
      } else {
        setBookingStatus("failed");
        toast.error(result.message || "Failed to initiate payment");
      }
    } catch (error) {
      console.error("Error processing payment:", error);
      setBookingStatus("failed");
      toast.error("Payment processing failed. Please try again.");
    }
  };

  const resetBooking = () => {
    setBookingStatus("booking");
    setCurrentStep(1);
    setSelectedLocation("");
    setSelectedSessions(1);
    setSelectedDate("");
    setSelectedTimeSlot("");
    setPatientName("");
    setPatientPhone("");
    setOtp("");
    setIsOtpSent(false);
    setIsOtpVerified(false);
    setPaymentMethod("online");
    setBookingId("");
  };

  const canProceedFromStep = (step: number): boolean => {
    switch (step) {
      case 1:
        return selectedLocation !== "";
      case 2:
        return selectedSessions > 0;
      case 3:
        return (
          selectedDate !== "" &&
          selectedTimeSlot !== "" &&
          patientName !== "" &&
          isOtpVerified
        );
      case 4:
        return paymentMethod !== "";
      default:
        return false;
    }
  };

  // Success Screen
  if (bookingStatus === "success") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 py-8 px-4">
        <div className="max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          >
            <Card className="shadow-2xl border-0 bg-white/80 backdrop-blur-sm">
              <CardContent className="p-8 text-center">
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{
                    delay: 0.3,
                    type: "spring",
                    stiffness: 200,
                    damping: 10,
                  }}
                  className="mb-8"
                >
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-emerald-400 to-teal-500 rounded-full blur-xl opacity-30 animate-pulse"></div>
                    <CheckCircle className="h-24 w-24 text-emerald-500 mx-auto relative z-10" />
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{
                        duration: 2,
                        repeat: Number.POSITIVE_INFINITY,
                        ease: "linear",
                      }}
                      className="absolute -top-2 -right-2 z-20"
                    >
                      <Sparkles className="h-8 w-8 text-yellow-400" />
                    </motion.div>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5, duration: 0.6 }}
                >
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent mb-3">
                    Booking Confirmed! 🎉
                  </h1>
                  <p className="text-xl text-gray-600 mb-8">
                    Your consultation has been successfully booked.
                  </p>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7, duration: 0.6 }}
                  className="bg-gradient-to-br from-gray-50 to-white rounded-2xl p-8 mb-8 text-left shadow-inner"
                >
                  <h3 className="font-bold text-xl text-gray-900 mb-6 flex items-center">
                    <div className="w-10 h-10 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full flex items-center justify-center mr-3">
                      <Calendar className="h-5 w-5 text-white" />
                    </div>
                    Booking Details
                  </h3>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="flex justify-between items-center p-3 bg-white rounded-lg shadow-sm">
                        <span className="text-gray-600 font-medium">
                          Booking ID:
                        </span>
                        <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">
                          {bookingId}
                        </Badge>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-white rounded-lg shadow-sm">
                        <span className="text-gray-600 font-medium">
                          Patient:
                        </span>
                        <span className="font-semibold text-gray-900">
                          {patientName}
                        </span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-white rounded-lg shadow-sm">
                        <span className="text-gray-600 font-medium">
                          Phone:
                        </span>
                        <span className="font-semibold text-gray-900">
                          +91-{patientPhone}
                        </span>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center p-3 bg-white rounded-lg shadow-sm">
                        <span className="text-gray-600 font-medium">
                          Location:
                        </span>
                        <span className="font-semibold text-gray-900">
                          {selectedClinic?.clinic_name}
                        </span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-white rounded-lg shadow-sm">
                        <span className="text-gray-600 font-medium">Date:</span>
                        <span className="font-semibold text-gray-900">
                          {new Date(selectedDate).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-white rounded-lg shadow-sm">
                        <span className="text-gray-600 font-medium">Time:</span>
                        <span className="font-semibold text-gray-900">
                          {selectedTimeSlot}
                        </span>
                      </div>
                    </div>
                  </div>

                  <Separator className="my-6" />

                  <div className="flex justify-between items-center p-4 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl">
                    <div className="flex items-center">
                      <Award className="h-6 w-6 text-emerald-600 mr-2" />
                      <span className="text-lg font-semibold text-gray-900">
                        Total Paid:
                      </span>
                    </div>
                    <span className="text-2xl font-bold text-emerald-600">
                      ₹{finalAmount.toLocaleString()}
                    </span>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.9, duration: 0.6 }}
                  className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 mb-8 border border-blue-200"
                >
                  <div className="flex items-start">
                    <Shield className="h-6 w-6 text-blue-600 mr-3 mt-1 flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold text-blue-900 mb-2">
                        Important Instructions
                      </h4>
                      <p className="text-sm text-blue-800 leading-relaxed">
                        Please arrive 15 minutes before your appointment time.
                        Bring a valid ID and any relevant medical documents.
                        You'll receive a confirmation SMS shortly.
                      </p>
                    </div>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.1, duration: 0.6 }}
                  className="flex flex-col sm:flex-row gap-4 justify-center"
                >
                  <Button
                    onClick={resetBooking}
                    variant="outline"
                    size="lg"
                    className="flex items-center border-2 border-gray-300 hover:border-gray-400 hover:bg-gray-50"
                  >
                    <Home className="h-5 w-5 mr-2" />
                    Book Another
                  </Button>
                  <Button
                    size="lg"
                    className="flex items-center bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 shadow-lg hover:shadow-xl transition-all duration-300"
                  >
                    <Calendar className="h-5 w-5 mr-2" />
                    Add to Calendar
                  </Button>
                </motion.div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    );
  }

  // Failed Screen
  if (bookingStatus === "failed") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-pink-50 py-8 px-4">
        <div className="max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          >
            <Card className="shadow-2xl border-0 bg-white/80 backdrop-blur-sm">
              <CardContent className="p-8 text-center">
                <motion.div
                  initial={{ scale: 0, rotate: 180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{
                    delay: 0.3,
                    type: "spring",
                    stiffness: 200,
                    damping: 10,
                  }}
                  className="mb-8"
                >
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-red-400 to-orange-500 rounded-full blur-xl opacity-30 animate-pulse"></div>
                    <XCircle className="h-24 w-24 text-red-500 mx-auto relative z-10" />
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5, duration: 0.6 }}
                >
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-transparent mb-3">
                    Booking Failed 😔
                  </h1>
                  <p className="text-xl text-gray-600 mb-8">
                    We couldn't process your payment. Please try again.
                  </p>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7, duration: 0.6 }}
                  className="bg-gradient-to-br from-gray-50 to-white rounded-2xl p-8 mb-8 text-left shadow-inner"
                >
                  <h3 className="font-bold text-xl text-gray-900 mb-6 flex items-center">
                    <div className="w-10 h-10 bg-gradient-to-r from-red-500 to-orange-500 rounded-full flex items-center justify-center mr-3">
                      <Clock className="h-5 w-5 text-white" />
                    </div>
                    Attempted Booking Details
                  </h3>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="flex justify-between items-center p-3 bg-white rounded-lg shadow-sm">
                        <span className="text-gray-600 font-medium">
                          Patient:
                        </span>
                        <span className="font-semibold text-gray-900">
                          {patientName}
                        </span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-white rounded-lg shadow-sm">
                        <span className="text-gray-600 font-medium">
                          Phone:
                        </span>
                        <span className="font-semibold text-gray-900">
                          +91-{patientPhone}
                        </span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-white rounded-lg shadow-sm">
                        <span className="text-gray-600 font-medium">
                          Location:
                        </span>
                        <span className="font-semibold text-gray-900">
                          {selectedClinic?.clinic_name}
                        </span>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center p-3 bg-white rounded-lg shadow-sm">
                        <span className="text-gray-600 font-medium">Date:</span>
                        <span className="font-semibold text-gray-900">
                          {new Date(selectedDate).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-white rounded-lg shadow-sm">
                        <span className="text-gray-600 font-medium">Time:</span>
                        <span className="font-semibold text-gray-900">
                          {selectedTimeSlot}
                        </span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-white rounded-lg shadow-sm">
                        <span className="text-gray-600 font-medium">
                          Sessions:
                        </span>
                        <span className="font-semibold text-gray-900">
                          {selectedSessions} session
                          {selectedSessions > 1 ? "s" : ""}
                        </span>
                      </div>
                    </div>
                  </div>

                  <Separator className="my-6" />

                  <div className="flex justify-between items-center p-4 bg-gradient-to-r from-red-50 to-orange-50 rounded-xl">
                    <span className="text-lg font-semibold text-gray-900">
                      Amount:
                    </span>
                    <span className="text-2xl font-bold text-red-600">
                      ₹{finalAmount.toLocaleString()}
                    </span>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.9, duration: 0.6 }}
                  className="bg-gradient-to-r from-red-50 to-orange-50 rounded-xl p-6 mb-8 border border-red-200"
                >
                  <div className="flex items-start">
                    <XCircle className="h-6 w-6 text-red-600 mr-3 mt-1 flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold text-red-900 mb-2">
                        Payment Failed
                      </h4>
                      <p className="text-sm text-red-800 leading-relaxed">
                        Your payment could not be processed. Please check your
                        payment details and try again. If the issue persists,
                        contact our support team.
                      </p>
                    </div>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.1, duration: 0.6 }}
                  className="flex flex-col sm:flex-row gap-4 justify-center"
                >
                  <Button
                    onClick={resetBooking}
                    variant="outline"
                    size="lg"
                    className="flex items-center border-2 border-gray-300 hover:border-gray-400 hover:bg-gray-50"
                  >
                    <Home className="h-5 w-5 mr-2" />
                    Start Over
                  </Button>
                  <Button
                    onClick={() => setBookingStatus("booking")}
                    size="lg"
                    className="flex items-center bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 shadow-lg hover:shadow-xl transition-all duration-300"
                  >
                    <CreditCard className="h-5 w-5 mr-2" />
                    Try Payment Again
                  </Button>
                </motion.div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    );
  }

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="space-y-8"
          >
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="text-center space-y-4"
            >
              <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full mb-4">
                <MapPin className="h-5 w-5 text-white" />
              </div>
              <h2 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                Choose Your Location
              </h2>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                Select the clinic location that's most convenient for your
                consultation
              </p>
            </motion.div>

            <RadioGroup
              value={selectedLocation}
              onValueChange={setSelectedLocation}
              className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-5xl mx-auto"
            >
              {data &&
                Object.entries(data).map(([key, clinic], index) => (
                  <motion.div
                    key={key}
                    initial={{ opacity: 0, x: index === 0 ? -50 : 50 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{
                      delay: index * 0.2 + 0.4,
                      duration: 0.6,
                      ease: "easeOut",
                    }}
                    className="relative group"
                  >
                    <RadioGroupItem
                      value={key}
                      id={key}
                      className="peer sr-only"
                    />
                    <Label
                      htmlFor={key}
                      className="block h-full p-8 rounded-2xl border-2 border-gray-200 bg-white shadow-lg cursor-pointer transition-all duration-300 hover:border-blue-400 hover:shadow-xl hover:scale-105 peer-data-[state=checked]:border-blue-500 peer-data-[state=checked]:bg-gradient-to-br peer-data-[state=checked]:from-blue-50 peer-data-[state=checked]:to-purple-50 peer-data-[state=checked]:shadow-2xl peer-data-[state=checked]:scale-105"
                    >
                      <div className="flex items-center justify-between mb-6">
                        <h3 className="text-2xl font-bold text-gray-900">
                          {clinic.clinic_name}
                        </h3>
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                          <MapPin className="h-6 w-6 text-white" />
                        </div>
                      </div>

                      <p className="text-gray-600 mb-6 leading-relaxed">
                        {clinic?.clinic_contact_details.clinic_address}
                      </p>

                      <div className="space-y-3">
                        <h4 className="font-semibold text-gray-900 flex items-center">
                          <Phone className="h-4 w-4 mr-2 text-blue-500" />
                          Contact Numbers
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {clinic?.clinic_contact_details.phone_numbers.map(
                            (phone, phoneIndex) => (
                              <Badge
                                key={phoneIndex}
                                variant="secondary"
                                className="text-sm px-3 py-1 bg-gradient-to-r from-blue-100 to-purple-100 text-blue-700 border border-blue-300 rounded-full hover:from-blue-200 hover:to-purple-200 transition-all duration-200"
                              >
                                {phone}
                              </Badge>
                            )
                          )}
                        </div>
                      </div>

                      {selectedLocation === key && (
                        <motion.div
                          initial={{ scale: 0, rotate: -180 }}
                          animate={{ scale: 1, rotate: 0 }}
                          transition={{
                            type: "spring",
                            stiffness: 200,
                            damping: 10,
                          }}
                          className="absolute -top-3 -right-3"
                        >
                          <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center shadow-lg">
                            <Check className="h-6 w-6 text-white" />
                          </div>
                        </motion.div>
                      )}
                    </Label>
                  </motion.div>
                ))}
            </RadioGroup>
          </motion.div>
        );

      case 2:
        return (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="space-y-8"
          >
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="text-center space-y-4"
            >
              <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full mb-4">
                <Star className="h-5 w-5 text-white" />
              </div>
              <h2 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                Select Sessions
              </h2>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                Choose the number of consultation sessions you need
              </p>
            </motion.div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-6 max-w-6xl mx-auto">
              {[1, 2, 3, 4, 5, 6].map((num, index) => (
                <motion.div
                  key={num}
                  initial={{ opacity: 0, scale: 0.8, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  transition={{
                    delay: index * 0.1 + 0.4,
                    duration: 0.5,
                    ease: "easeOut",
                  }}
                  className="relative group"
                >
                  <input
                    type="radio"
                    id={`session-${num}`}
                    name="sessions"
                    value={num}
                    checked={selectedSessions === num}
                    onChange={() => setSelectedSessions(num)}
                    className="peer sr-only"
                  />

                  <Label
                    htmlFor={`session-${num}`}
                    className="flex flex-col items-center justify-between h-full p-6 rounded-2xl border-2 border-gray-200 bg-white cursor-pointer shadow-lg transition-all duration-300 hover:border-green-400 hover:shadow-xl hover:scale-105 peer-checked:border-green-500 peer-checked:bg-gradient-to-br peer-checked:from-green-50 peer-checked:to-emerald-50 peer-checked:shadow-2xl peer-checked:scale-105"
                  >
                    <div className="text-center space-y-3">
                      <div className="text-3xl font-bold text-gray-900">
                        {num}
                      </div>
                      <div className="text-sm text-gray-600 font-medium">
                        Session{num > 1 ? "s" : ""}
                      </div>
                    </div>

                    <div className="text-center mt-4 space-y-1">
                      <div className="text-xl font-bold text-green-600">
                        ₹{(num * sessionPrice).toLocaleString()}
                      </div>
                      <div className="text-sm text-gray-400 line-through">
                        ₹{(num * sessionMRP).toLocaleString()}
                      </div>
                      <div className="text-xs text-green-600 font-semibold">
                        Save ₹
                        {(num * (sessionMRP - sessionPrice)).toLocaleString()}
                      </div>
                    </div>

                    {selectedSessions === num && (
                      <motion.div
                        initial={{ scale: 0, rotate: -180 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{
                          type: "spring",
                          stiffness: 200,
                          damping: 10,
                        }}
                        className="absolute -top-3 -right-3"
                      >
                        <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center shadow-lg">
                          <Check className="h-5 w-5 text-white" />
                        </div>
                      </motion.div>
                    )}
                  </Label>
                </motion.div>
              ))}
            </div>
          </motion.div>
        );

      case 3:
        return (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="space-y-8"
          >
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="text-center space-y-4"
            >
              <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full mb-4">
                <Calendar className="h-5 w-5 text-white" />
              </div>
              <h2 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                Schedule & Details
              </h2>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                Select your preferred date, time and provide your contact
                information
              </p>
            </motion.div>

            {/* Single Row Layout for Date, Time, and Patient Info */}
            <div className="grid lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
              {/* Date Selection */}
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3, duration: 0.5 }}
                className="space-y-6"
              >
                <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 shadow-xl">
                  <CardContent className="p-6">
                    <div className="flex items-center mb-4">
                      <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-lg flex items-center justify-center mr-3">
                        <Calendar className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <Label className="text-lg font-bold text-gray-900 block">
                          Select Date
                        </Label>
                        <p className="text-sm text-gray-600">
                          Choose appointment date
                        </p>
                      </div>
                    </div>

                    <Input
                      id="date"
                      type="date"
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      min={new Date().toISOString().split("T")[0]}
                      className="w-full h-14 text-lg border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-blue-500 transition-colors duration-200 bg-white"
                    />
                  </CardContent>
                </Card>

                {/* Time Slots */}
                <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-200 shadow-xl">
                  <CardContent className="p-6">
                    <div className="flex items-center mb-4">
                      <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center mr-3">
                        <Clock className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <Label className="text-lg font-bold text-gray-900 block">
                          Select Time
                        </Label>
                        <p className="text-sm text-gray-600">
                          Pick convenient time
                        </p>
                      </div>
                    </div>

                    {/* Morning Slots */}
                    {availableDates.find((d) => d.date === selectedDate)
                      ?.slots && (
                      <div className="mb-6">
                        <div className="flex items-center mb-3">
                          <Sun className="h-5 w-5 text-yellow-500 mr-2" />
                          <h4 className="font-semibold text-gray-900">
                            Available Slots
                          </h4>
                        </div>
                        {isLoadingSlots ? (
                          <div className="text-center py-4">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mx-auto"></div>
                            <p className="text-sm text-gray-500 mt-2">
                              Loading slots...
                            </p>
                          </div>
                        ) : (
                          <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                            {availableDates
                              .find((d) => d.date === selectedDate)
                              ?.slots.map((slot) => (
                                <motion.div
                                  key={slot.time}
                                  whileHover={{
                                    scale:
                                      slot.status === "Available" ? 1.05 : 1,
                                  }}
                                >
                                  <input
                                    type="radio"
                                    id={slot.time}
                                    name="timeSlot"
                                    value={slot.time}
                                    checked={selectedTimeSlot === slot.time}
                                    onChange={() =>
                                      slot.status === "Available" &&
                                      setSelectedTimeSlot(slot.time)
                                    }
                                    disabled={slot.status !== "Available"}
                                    className="peer sr-only"
                                  />
                                  <Label
                                    htmlFor={slot.time}
                                    className={`block p-3 text-center text-sm rounded-lg border-2 cursor-pointer transition-all duration-200 ${
                                      selectedTimeSlot === slot.time
                                        ? "bg-gradient-to-r from-purple-500 to-pink-500 border-transparent text-white shadow-lg"
                                        : slot.status === "Available"
                                        ? "border-gray-200 hover:border-purple-400 hover:bg-purple-50 bg-white"
                                        : "border-gray-100 bg-gray-50 text-gray-400 cursor-not-allowed opacity-60"
                                    }`}
                                  >
                                    <div>{slot.time}</div>
                                    <div className="text-xs mt-1">
                                      {slot.available > 0
                                        ? `${slot.available} slots`
                                        : "Full"}
                                    </div>
                                  </Label>
                                </motion.div>
                              ))}
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>

              {/* Patient Information - Full Width */}
              <motion.div
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4, duration: 0.5 }}
                className="lg:col-span-2"
              >
                <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 shadow-xl h-full">
                  <CardContent className="p-8">
                    <div className="flex items-center mb-6">
                      <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl flex items-center justify-center mr-4">
                        <User className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <h3 className="text-2xl font-bold text-gray-900">
                          Patient Information
                        </h3>
                        <p className="text-gray-600">
                          Enter your contact details
                        </p>
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                      {/* Patient Name - Full Width Row */}
                      <div className="md:col-span-2">
                        <Label
                          htmlFor="name"
                          className="text-lg font-semibold text-gray-700 mb-3 block flex items-center"
                        >
                          <UserCheck className="h-5 w-5 mr-2 text-green-600" />
                          Patient Name
                        </Label>
                        <Input
                          id="name"
                          type="text"
                          placeholder="Enter your full name"
                          value={patientName}
                          onChange={(e) => setPatientName(e.target.value)}
                          className="w-full h-14 text-lg border-2 border-gray-200 rounded-xl focus:border-green-500 focus:ring-green-500 transition-colors duration-200 bg-white"
                        />
                      </div>

                      {/* Phone Number */}
                      <div>
                        <Label
                          htmlFor="phone"
                          className="text-lg font-semibold text-gray-700 mb-3 block flex items-center"
                        >
                          <Phone className="h-5 w-5 mr-2 text-green-600" />
                          Phone Number
                        </Label>
                        <div className="flex gap-3">
                          <div className="flex-1 relative">
                            <Input
                              id="phone"
                              type="tel"
                              placeholder="Enter 10-digit number"
                              value={patientPhone}
                              onChange={(e) =>
                                setPatientPhone(
                                  e.target.value.replace(/\D/g, "").slice(0, 10)
                                )
                              }
                              className="w-full h-14 text-lg border-2 border-gray-200 rounded-xl focus:border-green-500 focus:ring-green-500 transition-colors duration-200 bg-white pl-16"
                            />
                            <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 font-medium">
                              +91
                            </div>
                          </div>
                          <Button
                            type="button"
                            onClick={handleSendOtp}
                            disabled={
                              patientPhone.length !== 10 ||
                              isOtpSent ||
                              isRegistering
                            }
                            size="lg"
                            className={`h-14 px-6 rounded-xl font-medium transition-all duration-200 ${
                              isOtpSent
                                ? "bg-green-500 hover:bg-green-600 text-white"
                                : "bg-blue-600 hover:bg-blue-700 text-white hover:shadow-lg"
                            }`}
                          >
                            {isRegistering ? (
                              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                            ) : isOtpSent ? (
                              <Check className="h-5 w-5" />
                            ) : (
                              <Send className="h-5 w-5" />
                            )}
                          </Button>
                        </div>
                      </div>

                      {/* OTP Verification */}
                      <AnimatePresence>
                        {isOtpSent && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.3 }}
                          >
                            <Label
                              htmlFor="otp"
                              className="text-lg font-semibold text-gray-700 mb-3 block flex items-center"
                            >
                              <Shield className="h-5 w-5 mr-2 text-green-600" />
                              Enter OTP
                            </Label>
                            <div className="flex gap-3">
                              <Input
                                id="otp"
                                type="text"
                                placeholder="Enter 4-digit OTP (try 1234)"
                                value={otp}
                                onChange={(e) =>
                                  setOtp(
                                    e.target.value
                                      .replace(/\D/g, "")
                                      .slice(0, 4)
                                  )
                                }
                                className="flex-1 h-14 text-lg border-2 border-gray-200 rounded-xl focus:border-green-500 focus:ring-green-500 transition-colors duration-200 bg-white text-center font-mono tracking-widest"
                                disabled={isOtpVerified}
                              />
                              <Button
                                type="button"
                                onClick={handleVerifyOtp}
                                disabled={
                                  otp.length !== 4 ||
                                  isOtpVerified ||
                                  isVerifyingOtp
                                }
                                size="lg"
                                className={`h-14 px-6 rounded-xl font-medium transition-all duration-200 ${
                                  isOtpVerified
                                    ? "bg-green-500 hover:bg-green-600 text-white"
                                    : "bg-purple-600 hover:bg-purple-700 text-white hover:shadow-lg"
                                }`}
                              >
                                {isVerifyingOtp ? (
                                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                ) : isOtpVerified ? (
                                  <Check className="h-5 w-5" />
                                ) : (
                                  <Shield className="h-5 w-5" />
                                )}
                              </Button>
                            </div>
                            {isOtpSent && !isOtpVerified && (
                              <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.3, duration: 0.4 }}
                                className="mt-3 text-center"
                              >
                                <Button
                                  type="button"
                                  variant="ghost"
                                  onClick={handleResendOtp}
                                  className="text-sm text-blue-600 hover:text-blue-700"
                                >
                                  Resend OTP
                                </Button>
                              </motion.div>
                            )}

                            {isOtpVerified && (
                              <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2, duration: 0.4 }}
                                className="mt-4 p-4 bg-green-100 border border-green-300 rounded-xl"
                              >
                                <p className="text-green-800 font-medium flex items-center">
                                  <CheckCircle className="h-5 w-5 mr-2" />
                                  Phone number verified successfully!
                                </p>
                              </motion.div>
                            )}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    {/* Appointment Summary */}
                    {(selectedDate || selectedTimeSlot) && (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4 }}
                        className="mt-8 p-6 bg-white rounded-xl border-2 border-green-300 shadow-lg"
                      >
                        <h4 className="font-bold text-xl text-gray-900 mb-4 flex items-center">
                          <Calendar className="h-5 w-5 mr-2 text-green-600" />
                          Appointment Summary
                        </h4>
                        <div className="grid md:grid-cols-2 gap-4">
                          {selectedDate && (
                            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                              <span className="text-gray-600 font-medium">
                                Date:
                              </span>
                              <span className="font-bold text-gray-900">
                                {new Date(selectedDate).toLocaleDateString(
                                  "en-US",
                                  {
                                    weekday: "short",
                                    month: "short",
                                    day: "numeric",
                                  }
                                )}
                              </span>
                            </div>
                          )}
                          {selectedTimeSlot && (
                            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                              <span className="text-gray-600 font-medium">
                                Time:
                              </span>
                              <span className="font-bold text-gray-900">
                                {selectedTimeSlot}
                              </span>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          </motion.div>
        );

      case 4:
        return (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="space-y-8"
          >
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="text-center space-y-4"
            >
              <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full mb-4">
                <CreditCard className="h-5 w-5 text-white" />
              </div>
              <h2 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                Payment & Confirmation
              </h2>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                Review your booking details and complete the payment
              </p>
            </motion.div>

            <div className="grid lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
              {/* Booking Summary */}
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3, duration: 0.5 }}
              >
                <Card className="bg-gradient-to-br from-gray-50 to-white border-2 border-gray-200 shadow-xl">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-2xl flex items-center">
                      <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-lg flex items-center justify-center mr-3">
                        <Calendar className="h-5 w-5 text-white" />
                      </div>
                      Booking Summary
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid gap-4">
                      <div className="flex justify-between items-center p-4 bg-white rounded-xl shadow-sm border">
                        <span className="text-gray-600 font-medium">
                          Location:
                        </span>
                        <span className="font-bold text-gray-900">
                          {selectedClinic?.clinic_name}
                        </span>
                      </div>
                      <div className="flex justify-between items-center p-4 bg-white rounded-xl shadow-sm border">
                        <span className="text-gray-600 font-medium">
                          Sessions:
                        </span>
                        <span className="font-bold text-gray-900">
                          {selectedSessions} session
                          {selectedSessions > 1 ? "s" : ""}
                        </span>
                      </div>
                      <div className="flex justify-between items-center p-4 bg-white rounded-xl shadow-sm border">
                        <span className="text-gray-600 font-medium">
                          Date & Time:
                        </span>
                        <div className="text-right">
                          <div className="font-bold text-gray-900">
                            {new Date(selectedDate).toLocaleDateString()}
                          </div>
                          <div className="text-sm text-gray-600">
                            {selectedTimeSlot}
                          </div>
                        </div>
                      </div>
                      <div className="flex justify-between items-center p-4 bg-white rounded-xl shadow-sm border">
                        <span className="text-gray-600 font-medium">
                          Patient:
                        </span>
                        <div className="text-right">
                          <div className="font-bold text-gray-900">
                            {patientName}
                          </div>
                          <div className="text-sm text-gray-600">
                            +91-{patientPhone}
                          </div>
                        </div>
                      </div>
                    </div>

                    <Separator className="my-6" />

                    <div className="space-y-3">
                      <div className="flex justify-between items-center p-4 bg-white rounded-xl shadow-sm">
                        <span className="text-gray-600 font-medium">
                          Subtotal:
                        </span>
                        <span className="font-bold text-xl text-gray-900">
                          ₹{totalAmount.toLocaleString()}
                        </span>
                      </div>
                      {cardFee > 0 && (
                        <div className="flex justify-between items-center p-4 bg-orange-50 rounded-xl shadow-sm border border-orange-200">
                          <span className="text-orange-700 font-medium">
                            Card Processing Fee (2.5%):
                          </span>
                          <span className="font-bold text-orange-700">
                            ₹{cardFee.toLocaleString()}
                          </span>
                        </div>
                      )}
                      <div className="flex justify-between items-center p-6 bg-gradient-to-r from-emerald-100 to-teal-100 rounded-xl shadow-lg border-2 border-emerald-300">
                        <span className="font-bold text-xl text-gray-900">
                          Total Amount:
                        </span>
                        <span className="text-3xl font-bold text-emerald-600">
                          ₹{finalAmount.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Payment Method */}
              <motion.div
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4, duration: 0.5 }}
              >
                <Card className="bg-gradient-to-br from-emerald-50 to-teal-50 border-2 border-emerald-200 shadow-xl">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-2xl flex items-center">
                      <div className="w-10 h-10 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-lg flex items-center justify-center mr-3">
                        <CreditCard className="h-5 w-5 text-white" />
                      </div>
                      Payment Method
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <RadioGroup
                      value={paymentMethod}
                      onValueChange={setPaymentMethod}
                      className="space-y-4"
                    >
                      <motion.div
                        whileHover={{ scale: 1.02 }}
                        className="relative"
                      >
                        <RadioGroupItem
                          value="online"
                          id="online"
                          className="peer sr-only"
                        />
                        <Label
                          htmlFor="online"
                          className="flex items-center p-6 rounded-xl border-2 border-gray-200 cursor-pointer hover:border-emerald-300 hover:bg-emerald-50 peer-data-[state=checked]:border-emerald-500 peer-data-[state=checked]:bg-gradient-to-r peer-data-[state=checked]:from-emerald-50 peer-data-[state=checked]:to-teal-50 transition-all duration-300 bg-white shadow-lg"
                        >
                          <div className="w-12 h-12 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full flex items-center justify-center mr-4">
                            <Wallet className="h-6 w-6 text-white" />
                          </div>
                          <div className="flex-1">
                            <div className="font-bold text-lg text-gray-900">
                              Online Payment
                            </div>
                            <div className="text-gray-600">
                              UPI, Net Banking, Digital Wallet
                            </div>
                            <div className="text-sm text-emerald-600 font-medium mt-1">
                              ✓ Secure & Instant
                            </div>
                          </div>
                          {paymentMethod === "online" && (
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              className="w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center"
                            >
                              <Check className="h-5 w-5 text-white" />
                            </motion.div>
                          )}
                        </Label>
                      </motion.div>

                      <motion.div
                        whileHover={{ scale: 1.02 }}
                        className="relative"
                      >
                        <RadioGroupItem
                          value="card"
                          id="card"
                          className="peer sr-only"
                        />
                        <Label
                          htmlFor="card"
                          className="flex items-center p-6 rounded-xl border-2 border-gray-200 cursor-pointer hover:border-emerald-300 hover:bg-emerald-50 peer-data-[state=checked]:border-emerald-500 peer-data-[state=checked]:bg-gradient-to-r peer-data-[state=checked]:from-emerald-50 peer-data-[state=checked]:to-teal-50 transition-all duration-300 bg-white shadow-lg"
                        >
                          <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center mr-4">
                            <CreditCard className="h-6 w-6 text-white" />
                          </div>
                          <div className="flex-1">
                            <div className="font-bold text-lg text-gray-900">
                              Credit/Debit Card
                            </div>
                            <div className="text-gray-600">
                              Visa, Mastercard, RuPay
                            </div>
                            <div className="text-sm text-orange-600 font-medium mt-1">
                              + 2.5% processing fee
                            </div>
                          </div>
                          <div className="text-right">
                            {paymentMethod === "card" && (
                              <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                className="w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center mb-2"
                              >
                                <Check className="h-5 w-5 text-white" />
                              </motion.div>
                            )}
                            {paymentMethod === "card" && (
                              <Badge
                                variant="secondary"
                                className="bg-orange-100 text-orange-700 border border-orange-300"
                              >
                                +₹{cardFee.toLocaleString()}
                              </Badge>
                            )}
                          </div>
                        </Label>
                      </motion.div>
                    </RadioGroup>

                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.6, duration: 0.5 }}
                      className="mt-8 p-6 bg-white rounded-xl border-2 border-emerald-300 shadow-lg"
                    >
                      <div className="flex items-center mb-4">
                        <Shield className="h-6 w-6 text-emerald-600 mr-3" />
                        <h4 className="font-bold text-lg text-gray-900">
                          Secure Payment
                        </h4>
                      </div>
                      <p className="text-gray-600 text-sm leading-relaxed">
                        Your payment information is encrypted and secure. We use
                        industry-standard security measures to protect your
                        data.
                      </p>
                    </motion.div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          </motion.div>
        );

      default:
        return null;
    }
  };

  return (
    <div
      ref={containerRef}
      className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 py-8 px-4"
    >
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          <Card className="shadow-2xl border-0 bg-white/90 backdrop-blur-sm overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 text-white relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-purple-600/20 backdrop-blur-sm"></div>
              <div className="relative z-10">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3, duration: 0.6 }}
                  className="text-center space-y-4"
                >
                  <div className="flex items-center justify-center space-x-3">
                    <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                      <Heart className="h-6 w-6 text-white" />
                    </div>
                    <CardTitle className="text-3xl font-bold">
                      Book Your Consultation
                    </CardTitle>
                    <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                      <Sparkles className="h-6 w-6 text-white" />
                    </div>
                  </div>
                  <CardDescription className="text-blue-100 text-lg">
                    Step {currentStep} of 4 -{" "}
                    {currentStep === 1
                      ? "Choose Location"
                      : currentStep === 2
                      ? "Select Sessions"
                      : currentStep === 3
                      ? "Schedule & Details"
                      : "Payment & Confirmation"}
                  </CardDescription>
                </motion.div>

                <motion.div
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ delay: 0.5, duration: 0.8, ease: "easeOut" }}
                  className="mt-6"
                >
                  <div className="w-full bg-white/20 rounded-full h-3 overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${progress}%` }}
                      transition={{ delay: 0.7, duration: 1, ease: "easeOut" }}
                      className="h-full bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full shadow-lg"
                    />
                  </div>
                  <div className="flex justify-between mt-2 text-sm text-blue-100">
                    <span
                      className={
                        currentStep >= 1 ? "font-semibold text-white" : ""
                      }
                    >
                      Location
                    </span>
                    <span
                      className={
                        currentStep >= 2 ? "font-semibold text-white" : ""
                      }
                    >
                      Sessions
                    </span>
                    <span
                      className={
                        currentStep >= 3 ? "font-semibold text-white" : ""
                      }
                    >
                      Schedule
                    </span>
                    <span
                      className={
                        currentStep >= 4 ? "font-semibold text-white" : ""
                      }
                    >
                      Payment
                    </span>
                  </div>
                </motion.div>
              </div>
            </CardHeader>

            <CardContent className="p-8 min-h-[400px]">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentStep}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.5, ease: "easeInOut" }}
                >
                  {renderStepContent()}
                </motion.div>
              </AnimatePresence>
            </CardContent>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.6 }}
              className="flex justify-between items-center p-8 bg-gradient-to-r from-gray-50 to-white border-t border-gray-200"
            >
              <Button
                variant="outline"
                onClick={handlePrevious}
                disabled={currentStep === 1}
                size="lg"
                className="flex items-center border-2 border-gray-300 hover:border-gray-400 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="h-5 w-5 mr-2" />
                Previous
              </Button>

              <div className="flex items-center space-x-2 text-sm text-gray-600">
                {Array.from({ length: 4 }, (_, i) => (
                  <motion.div
                    key={i}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: i * 0.1 + 0.6, duration: 0.3 }}
                    className={`w-3 h-3 rounded-full transition-all duration-300 ${
                      i + 1 === currentStep
                        ? "bg-gradient-to-r from-blue-500 to-purple-500 scale-125"
                        : i + 1 < currentStep
                        ? "bg-green-500"
                        : "bg-gray-300"
                    }`}
                  />
                ))}
              </div>

              {currentStep < 4 ? (
                <Button
                  onClick={handleNext}
                  disabled={!canProceedFromStep(currentStep)}
                  size="lg"
                  className="flex items-center bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                  <ChevronRight className="h-5 w-5 ml-2" />
                </Button>
              ) : (
                <Button
                  onClick={handlePayment}
                  disabled={!canProceedFromStep(currentStep)}
                  size="lg"
                  className="flex items-center bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <CreditCard className="h-5 w-5 mr-2" />
                  Complete Payment
                </Button>
              )}
            </motion.div>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default BookNowConsultations;
