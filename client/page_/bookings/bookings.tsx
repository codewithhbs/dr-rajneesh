"use client";

import { useGetAllClinic } from "@/hooks/common";
import { useServiceBySlug } from "@/hooks/use-service";
import { useSettings } from "@/hooks/use-settings";
import { useMemo, useState, useEffect, useCallback } from "react";
import { Calendar } from "@/components/ui/calendar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Clock,
  MapPin,
  User,
  CreditCard,
  CalendarIcon,
  Sparkles,
  Heart,
  Shield,
  Phone,
  Mail,
  UserCheck,
  CheckCircle,
  FileDigit,
  Award,
  Star,
  Wallet,
  Lock,
  AlertCircle,
  XCircle 
} from "lucide-react";
import { API_ENDPOINT } from "@/constant/url";
import Cookies from "js-cookie";
import axios from "axios";

import { useBookingForm } from "@/hooks/use-booking-form";
import type {
  Clinic,
  BookingFormData,
  BookingAvailability,
  PricingBreakdown,
} from "@/types/booking";
import { PaymentStatusModal } from "@/components/models/payment-status-modal";
import Image from "next/image";
import { drImageurl } from "@/constant/Images";

interface EnhancedBookingsProps {
  searchParams: unknown;
}









export enum BookingStep {
  SELECTION = 1,
  CONFIRMATION = 2,
  PAYMENT = 3,
  SUCCESS = 4,
}
const EnhancedBookings = ({ searchParams }: EnhancedBookingsProps) => {
  const parsedParams = useMemo(() => {
    try {
      return typeof searchParams === "string"
        ? JSON.parse(searchParams)
        : searchParams;
    } catch (e) {
      console.error("Invalid searchParams:", e);
      return {};
    }
  }, [searchParams]);

  const sessions = Number.parseInt(parsedParams.sessions) || 1;
  const service = parsedParams.service || "N/A";

  // Your original hooks
  const { service: dbService, loading: serviceLoading } =
    useServiceBySlug(service);
  const { settings, loading: settingLoading } = useSettings();
  const { data: clinics, loading: isClinicLoading } = useGetAllClinic();

  // State management
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState("");
  const [selectedClinic, setSelectedClinic] = useState<Clinic | null>(null);
  const [paymentMethod, setPaymentMethod] = useState("razorpay");
  const [isProcessing, setIsProcessing] = useState(false);

  const [bookingStep, setBookingStep] = useState<BookingStep>(
    BookingStep.SELECTION
  );

  const [pastBookingData, setPastBookingData] =
    useState<BookingAvailability | null>(null);
    
  const [isCheckingAvailability, setIsCheckingAvailability] = useState(false);
  
  const [paymentModal, setPaymentModal] = useState<{
    isOpen: boolean;
    status: "success" | "failed" | "processing";
    error?: string;
  }>({ isOpen: false, status: "processing" });

  // Your original availability check function
  const checkAvailability = useCallback(async () => {
    if (
      !selectedDate ||
      !selectedTime ||
      !dbService?._id ||
      !selectedClinic?._id
    )
      return;

    const cookieToken = Cookies.get("token");
    setIsCheckingAvailability(true);
    const formattedDate = format(selectedDate, "yyyy-MM-dd");

    try {
      const response = await axios.post(
        `${API_ENDPOINT}/user/bookings/availability`,
        {
          date: formattedDate,
          time: selectedTime,
          service_id: dbService._id,
          clinic_id: selectedClinic._id,
        },
        {
          headers: {
            Authorization: `Bearer ${cookieToken}`,
            "Content-Type": "application/json",
          },
        }
      );

      setPastBookingData(response.data?.data);
    } catch (err: unknown) {
      console.log("err?.response?.data?.message", err);
      setPastBookingData({
        available: false,
        message: "Failed to check availability",
      });
    } finally {
      setIsCheckingAvailability(false);
    }
  }, [selectedDate, selectedTime, dbService?._id, selectedClinic?._id]);

  useEffect(() => {
    checkAvailability();
  }, []);

  // Your original time slot generation
  function timeToMinutes(timeString: string) {
    const [hours, minutes] = timeString.split(":").map(Number);
    return hours * 60 + minutes;
  }

  function generateTimeSlots(startTime: string, endTime: string) {
    if (!settings?.booking_config?.slots_per_hour) return [];

    const slots = [];
    const minutesPerSlot = 60 / settings.booking_config.slots_per_hour;

    let currentTime = timeToMinutes(startTime);
    const endTimeMinutes = timeToMinutes(endTime);

    while (currentTime < endTimeMinutes) {
      const hours = Math.floor(currentTime / 60);
      const minutes = currentTime % 60;
      const timeString = `${hours.toString().padStart(2, "0")}:${minutes
        .toString()
        .padStart(2, "0")}`;
      slots.push(timeString);
      currentTime += minutesPerSlot;
    }

    console.log("Generated slots:", slots);

    return slots;
  }



interface Booking {
  SessionDates: { date: string; time: string; status: string }[];
}

function getBookedSlotsForDate(bookings: Booking[], selectedDate: Date) {
  const dateString = selectedDate.toISOString().split("T")[0];
  const bookedSlots: string[] = [];

  bookings.forEach((booking) => {
    booking.SessionDates.forEach((session) => {
      const sessionDate = session.date.split("T")[0];
      if (sessionDate === dateString) {
        bookedSlots.push(session.time);
      }
    });
  });

  return bookedSlots;
}

const [bookingsFromAPI, setBookingsFromAPI] = useState<Booking[]>([]);
const [bookedSlots, setBookedSlots] = useState<string[]>([]);

// Fetch bookings from API
useEffect(() => {
  async function fetchBookings() {
    const res = await axios.get(`${API_ENDPOINT}/admin-bookings`);
    setBookingsFromAPI(res.data.data); 
  }
  fetchBookings();
}, []);

// Update booked slots when selected date changes
useEffect(() => {
  if (selectedDate) {
    const slots = getBookedSlotsForDate(bookingsFromAPI, selectedDate);
    setBookedSlots(slots);
  }
}, [selectedDate, bookingsFromAPI]);





  // Your original pricing calculation
  const calculatePricing = useCallback(
    (data: Partial<BookingFormData>): PricingBreakdown => {
      if (!dbService || !settings)
        return { subtotal: 0, tax: 0, creditCard: 0, total: 0 };

      const basePrice =
        dbService.service_per_session_discount_price ||
        dbService.service_per_session_price;
      const subtotal = basePrice * sessions;

      const taxAmount =
        (subtotal * (settings.payment_config?.tax_percentage || 0)) / 100;

      const creditCardAmount =
        data.payment_method === "card"
          ? (subtotal * (settings.payment_config?.credit_card_fee || 0)) / 100
          : 0;

      const total = subtotal + taxAmount + creditCardAmount;

      return {
        subtotal,
        tax: taxAmount,
        creditCard: creditCardAmount,
        total,
      };
    },
    [dbService, settings, sessions]
  );

  // Auto-select first available clinic and set default date/time

const today = new Date();
today.setHours(12, 0, 0, 0); // normalize timezone

// Auto-select the first available clinic
useEffect(() => {
  if (clinics && clinics.length > 0 && !selectedClinic) {
    const firstAvailableClinic = clinics.find((clinic) => {
      if (!clinic.BookingAvailabeAt) return false;
      const start = new Date(clinic.BookingAvailabeAt.start_date);
      const end = new Date(clinic.BookingAvailabeAt.end_date);
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
      return today >= start && today <= end;
    });

    if (firstAvailableClinic) {
      setSelectedClinic(firstAvailableClinic);
      const startDate = new Date(firstAvailableClinic.BookingAvailabeAt.start_date);
      const defaultDate = startDate > today ? startDate : today;
      setSelectedDate(defaultDate);
    } else {
      setSelectedDate(new Date());
    }
  }
}, [clinics, selectedClinic]);

// Helper to check if a date is within clinic availability
const isDateAvailable = (date) => {
  if (!selectedClinic?.BookingAvailabeAt) return true;
  const start = new Date(selectedClinic.BookingAvailabeAt.start_date);
  const end = new Date(selectedClinic.BookingAvailabeAt.end_date);
  return date >= start && date <= end;
};

const handleBookingSubmit = useCallback(
  async (data: BookingFormData) => {
    setIsProcessing(true);

    const cookieToken = Cookies.get("token");
    let bookingId: string | null = null;
    let paymentId: string | null = null;

    const reportPaymentFailure = async (
      bookingIdParam: string,
      paymentIdParam: string | null,
      errorDescription: string
    ) => {
      try {
        await axios.post(
          `${API_ENDPOINT}/user/bookings/payment-failed`,
          {
            booking_id: bookingIdParam,
            payment_id: paymentIdParam,
            error_description: errorDescription,
            cancellation_reason: "payment_initiation_failed",
            timestamp: new Date().toISOString(),
          },
          {
            headers: {
              Authorization: `Bearer ${cookieToken}`,
            },
          }
        );
      } catch (_) {}
    };

    try {
      if (!cookieToken) {
        throw new Error("Authentication token missing");
      }

      if (!data?.patient_details?.name) {
        throw new Error("Patient name is required");
      }

      if (!data?.patient_details?.email) {
        throw new Error("Patient email is required");
      }

      if (!data?.patient_details?.phone) {
        throw new Error("Patient phone is required");
      }

      if (!data?.service_id) {
        throw new Error("Service is required");
      }

      if (!data?.clinic_id) {
        throw new Error("Clinic is required");
      }

      if (!data?.date) {
        throw new Error("Date is required");
      }

      if (!data?.time) {
        throw new Error("Time is required");
      }

      const formattedDate = data.date
        ? format(new Date(data.date), "yyyy-MM-dd")
        : "";

      const paymentDetails = calculatePricing(data);

      const completeData = {
        ...data,
        date: formattedDate,
        paymentDetails,
        sessions,
      };

      const response = await axios.post(
        `${API_ENDPOINT}/user/bookings/sessions`,
        completeData,
        {
          headers: {
            Authorization: `Bearer ${cookieToken}`,
          },
        }
      );

      if (!response?.data?.success) {
        throw new Error(
          response?.data?.message || "Booking request was not successful"
        );
      }

      console.log(response.data)
      //  const { booking, payuFormHtml } = response.data?.data || {};
      const { booking, payment, payuFormHtml } = response.data?.data || {};

      bookingId = booking?.id || null;
      paymentId = payment?.id || null;

      if (!bookingId) {
        throw new Error("Booking ID not received from server");
      }

      if (!payuFormHtml) {
        throw new Error("PayU form not received from server");
      }

      setPaymentModal({
        isOpen: true,
        status: "processing",
        error: "",
      });

       const container = document.createElement("div");
      container.style.display = "none";
      container.innerHTML = payuFormHtml;

    document.body.appendChild(container);
      const form = container.querySelector("form") as HTMLFormElement | null;

  
      if (!form) {
        throw new Error("PayU form not found in server response");
      }

    if (data.payment_method !== "card") {
        // Remove card payment option
        const enforce = document.createElement("input");
        enforce.type = "hidden";
        enforce.name = "drop_category";
        enforce.value = "creditcard,debitcard";

        form.appendChild(enforce);
      }

      // Restrict to credit card only
      if (data.payment_method === "card") {
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
        "Something went wrong.";

      if (bookingId) {
        await reportPaymentFailure(bookingId, paymentId, errorMessage);
      }

      setPaymentModal({
        isOpen: true,
        status: "failed",
        error: errorMessage,
      });
    } finally {
      setIsProcessing(false);
    }
  },
  [sessions, calculatePricing]
);

const reportPaymentFailure = async (
  bookingId: string | null,
  paymentId: string | null,
  errorDescription: string,
  token: string
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
      timestamp: new Date().toISOString(),
    });

    const response = await axios.post(
      `${API_ENDPOINT}/user/bookings/payment-failed`,
      {
        booking_id: bookingId,
        payment_id: paymentId,
        error_description: errorDescription,
        failure_timestamp: new Date().toISOString(),
        user_agent: navigator.userAgent,
        page_url: window.location.href,
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    console.log("✅ Payment failure reported successfully", {
      status: response.status,
      data: response.data,
    });
  } catch (reportError: unknown) {
    console.error("🚨 Failed to report payment failure:", {
      error: reportError.message,
      status: reportError.response?.status,
      data: reportError.response?.data,
      timestamp: new Date().toISOString(),
    });
  }
};

// Optional: Add window event listeners for debugging redirect behavior
if (typeof window !== "undefined") {
  window.addEventListener("beforeunload", (event) => {
    console.log("🌐 Page is about to unload", {
      timestamp: new Date().toISOString(),
      url: window.location.href,
    });
  });

  window.addEventListener("pagehide", (event) => {
    console.log("🌐 Page is hidden", {
      timestamp: new Date().toISOString(),
      persisted: event.persisted,
    });
  });
}

  const handleDateSelect = (date: Date | undefined) => {
    if (!date) return;

    const normalized = new Date(date);
    normalized.setHours(0, 0, 0, 0);
    setSelectedDate(normalized);
  };

  const {
    formData,
    errors,
    isSubmitting,
    updateField,
    handleSubmit,
    getFieldError,
    pricing,
    isValid,
  } = useBookingForm({
    onSubmit: handleBookingSubmit,
    calculatePricing,
  });

  // Auto-populate form data from selected values
  useEffect(() => {
    if (dbService?._id && !formData.service_id) {
      updateField("service_id", dbService._id);
    }
  }, [dbService, formData.service_id, updateField]);

  useEffect(() => {
    if (selectedClinic?._id && formData.clinic_id !== selectedClinic._id) {
      updateField("clinic_id", selectedClinic._id);
    }
  }, [selectedClinic, formData.clinic_id, updateField]);

  useEffect(() => {
    if (selectedDate && formData.date !== selectedDate) {
      updateField("date", selectedDate);
    }
  }, [selectedDate, formData.date, updateField]);

  useEffect(() => {
    if (selectedTime && formData.time !== selectedTime) {
      updateField("time", selectedTime);
    }
  }, [selectedTime, formData.time, updateField]);

  useEffect(() => {
    if (paymentMethod && formData.payment_method !== paymentMethod) {
      updateField("payment_method", paymentMethod);
    }
  }, [paymentMethod, formData.payment_method, updateField]);

  // Auto-update calendar month based on selected clinic
  useEffect(() => {
    if (selectedClinic?.BookingAvailabeAt) {
      const startDate = new Date(selectedClinic.BookingAvailabeAt.start_date);
      const today = new Date();
      const defaultDate = startDate > today ? startDate : today;

      if (!selectedDate || !isDateAvailable(selectedDate)) {
        setSelectedDate(defaultDate);
      }
    }
  }, [selectedClinic, selectedDate]);

  if (serviceLoading || settingLoading || isClinicLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="container mx-auto p-6 space-y-6">
          <div className="text-center mb-8">
            <Skeleton className="h-12 w-96 mx-auto mb-4" />
            <Skeleton className="h-6 w-64 mx-auto" />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              <Skeleton className="h-64 w-full" />
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-48 w-full" />
            </div>
            <Skeleton className="h-96 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (bookingStep === BookingStep.SUCCESS) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 flex items-center justify-center">
        <div className="container mx-auto p-6 max-w-2xl">
          <Card className="border-2 border-green-200 shadow-xl">
            <CardHeader className="text-center bg-gradient-to-r from-green-50 to-blue-50">
              <CheckCircle className="w-20 h-20 mx-auto text-green-500 mb-4" />
              <CardTitle className="text-3xl text-green-600 flex items-center justify-center gap-2">
                <Sparkles className="w-8 h-8" />
                Booking Confirmed!
                <Heart className="w-8 h-8 text-red-500" />
              </CardTitle>
              <CardDescription className="text-lg">
                🎉 Your wellness journey begins now! You will receive a
                confirmation email shortly.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              <div className="bg-gradient-to-r from-green-50 to-blue-50 p-6 rounded-xl space-y-3">
                <h3 className="font-bold text-lg text-green-800 flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  Your Appointment Details
                </h3>
                <div className="space-y-2 text-gray-700">
                  <p>
                    <strong>🏥 Service:</strong> {dbService?.service_name}
                  </p>
                  <p>
                    <strong>📅 Date:</strong> {selectedDate?.toDateString()}
                  </p>
                  <p>
                    <strong>⏰ Time:</strong> {selectedTime}
                  </p>
                  <p>
                    <strong>🔢 Sessions:</strong> {sessions}
                  </p>
                  <p>
                    <strong>🏢 Clinic:</strong> {selectedClinic?.clinic_name}
                  </p>
                  <p>
                    <strong>💰 Total Paid:</strong> ₹
                    {pricing.total.toLocaleString()}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button
                  onClick={() => (window.location.href = "/bookings")}
                  className="w-full"
                  size="lg"
                >
                  <CalendarIcon className="w-5 h-5 mr-2" />
                  View My Bookings
                </Button>
                <Button
                  onClick={() => window.location.reload()}
                  variant="outline"
                  className="w-full"
                  size="lg"
                >
                  <Sparkles className="w-5 h-5 mr-2" />
                  Book Another Session
                </Button>
              </div>

              <div className="text-center text-sm text-gray-600 space-y-1">
                <p>📧 Confirmation email sent to your registered email</p>
                <p>
                  📱 SMS reminder will be sent 24 hours before your appointment
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="container mx-auto p-6">
          {/* Header with catchy copy */}
          {/* <div className="text-center mb-8">
                        <div className="flex items-center justify-center gap-2 mb-4">
                            <Sparkles className="w-8 h-8 text-blue-500" />
                            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                                Your Wellness Journey Starts Here
                            </h1>
                            <Heart className="w-8 h-8 text-red-500" />
                        </div>
                        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                            ✨ Book your premium consultation with India's most trusted wellness experts.
                            <span className="font-semibold text-blue-600"> Secure, Simple, Swift!</span>
                        </p>
                        <div className="flex items-center justify-center gap-6 mt-4 text-sm text-gray-500">
                            <div className="flex items-center gap-1">
                                <Shield className="w-4 h-4 text-green-500" />
                                <span>100% Secure</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <Zap className="w-4 h-4 text-yellow-500" />
                                <span>Instant Confirmation</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <Heart className="w-4 h-4 text-red-500" />
                                <span>Trusted by 50,000+ Patients</span>
                            </div>
                        </div>
                    </div> */}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Booking Section */}
            <div className="lg:col-span-2 mt-4 space-y-6">
              {/* Service Information */}
              <Card className="border-2 border-blue-100 shadow-xl rounded-lg hover:shadow-2xl transition-all duration-300">
                <CardHeader>
                  <div className="flex items-start gap-4">
                    {dbService?.service_images?.[0] && (
                      <Image
                        src={
                          dbService.service_images[0].url || "/placeholder.svg"
                        }
                        alt={dbService.service_name}
                        className="w-28 h-28 sm:w-24 sm:h-24 object-cover rounded-lg shadow-md"
                        width={112}
                        height={112}
                      />
                    )}

                    <div className="flex-1">
                      <CardTitle className="text-2xl text-dark-800 flex items-center gap-2 font-bold">
                        {dbService?.service_name}
                      </CardTitle>

                      <CardDescription className="mt-2 text-gray-700 text-sm sm:text-base leading-relaxed">
                        {dbService?.service_small_desc}
                      </CardDescription>

                      <div className="flex flex-wrap items-center gap-3 mt-3">
                        {/* Premium Sessions Badge */}
                        <Badge className="flex items-center gap-2 bg-gradient-to-r from-blue-400 to-blue-500 text-white px-3 py-1 rounded-lg shadow-md text-sm sm:text-base border-none">
                          <Award className="w-4 h-4 text-white-300" />
                          {sessions} Premium Session{sessions > 1 ? "s" : ""}
                        </Badge>

                        {/* Service Status Badge */}
                        <Badge className="flex items-center gap-2 bg-gradient-to-r from-green-400 to-green-500 text-white px-3 py-1 rounded-lg shadow-md text-sm sm:text-base border-none">
                          <Star className="w-4 h-4 text-white-400" />
                          {dbService?.service_status}
                        </Badge>

                        {/* Discount Badge */}
                        {dbService?.service_per_session_discount_price && (
                          <Badge className="flex items-center gap-2 bg-gradient-to-r from-teal-400 to-cyan-500 text-white px-3 py-1 rounded-lg shadow-md text-sm sm:text-base border-none">
                            <Sparkles className="w-4 h-4 text-white-500" />
                            Save ₹
                            {(
                              (dbService.service_per_session_price -
                                dbService.service_per_session_discount_price) *
                              sessions
                            ).toLocaleString()}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </CardHeader>
              </Card>

              {/* Doctor Information */}
              {dbService?.service_doctor && (
                <Card className="border-0 shadow-xl rounded-2xl overflow-hidden">
                  {/* Header */}
                  <CardHeader className="bg-gradient-to-r from-[#155DFC] to-blue-500 py-5 px-6 rounded shadow-md text-white">
                    <div className="flex items-center gap-3">
                      <UserCheck className="w-7 h-7 text-white" />
                      <h2 className="text-lg sm:text-xl font-bold">
                        Meet Your Expert Doctor
                      </h2>
                    </div>
                  </CardHeader>

                  {/* Content */}
                  <CardContent className="pt-6 px-6">
                    <div className="flex flex-col md:flex-row items-start gap-6">
                      {/* Doctor Avatar */}
                      <Avatar className="w-24 h-24 border-4 border-white shadow-lg">
                        <AvatarImage
                          src={
                            dbService?.service_doctor?.doctor_images?.[0]?.url ||
                            drImageurl
                          }
                        />
                        <AvatarFallback className="bg-purple-200 text-purple-800 text-xl font-bold">
                          {dbService?.service_doctor?.doctor_name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </AvatarFallback>
                      </Avatar>

                      {/* Doctor Info */}
                      <div className="flex-1">
                        <h3 className="text-2xl font-bold text-gray-900">
                          {dbService?.service_doctor?.doctor_name}
                        </h3>

                        {/* Specializations */}
                        <div className="flex flex-wrap gap-1 mt-2 text-sm font-medium">
                          {dbService?.service_doctor?.specialization?.map(
                            (spec, index, arr) => {
                              const cleanedSpec = spec
                                .replace(/['"\[\]\n]/g, "")
                                .trim();
                              return (
                                <span
                                  key={index}
                                  className="bg-gradient-to-r from-teal-400 to-cyan-500 px-2 py-1 rounded text-white"
                                >
                                  {cleanedSpec}
                                  {index < arr.length - 1 && ","}{" "}
                                </span>
                              );
                            }
                          )}
                        </div>

                        {/* Ratings */}
                        <div className="flex items-center gap-3 mt-4">
                          <div className="flex items-center gap-1">
                            {Array.from({ length: 5 }).map((_, i) => {
                              const rating =
                                dbService?.service_doctor?.doctor_ratings;
                              const fillPercent = Math.min(
                                Math.max(rating - i, 0),
                                1
                              ); // 0 to 1

                              return (
                                <div key={i} className="relative w-5 h-5">
                                  {/* Background star (inactive) */}
                                  <Star className="absolute w-5 h-5 text-gray-300" />

                                  {/* Foreground star (active) */}
                                  <Star
                                    className="absolute w-5 h-5 text-yellow-400"
                                    style={{
                                      clipPath: `inset(0 ${
                                        100 - fillPercent * 100
                                      }% 0 0)`,
                                    }}
                                  />
                                </div>
                              );
                            })}

                            <span className="ml-2 font-semibold text-lg text-gray-900">
                              {dbService?.service_doctor?.doctor_ratings.toFixed(
                                1
                              )}
                              /5
                            </span>
                          </div>

                          <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded-lg text-sm shadow-sm">
                            500+ Reviews
                          </span>
                        </div>

                        {/* Special Note */}
                        {dbService?.service_doctor?.unknown_special_note && (
                          <p className="text-gray-600 mt-3 italic bg-gray-50 p-3 rounded-lg shadow-sm">
                            💡 {dbService?.service_doctor?.unknown_special_note}
                          </p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Patient Details */}
              <Card className="border-2 py-0 border-green-100 shadow-lg">
                <CardHeader className="bg-gradient-to-r from-[#155DFC] to-blue-500 py-5 px-6 rounded-lg shadow-sm">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <User className="w-7 h-7 text-white" />
                      <h2 className="text-lg sm:text-xl font-semibold text-white">
                        Patient Information
                      </h2>
                    </div>
                    <p className="text-sm sm:text-base text-white sm:text-right">
                      Help us serve you better with your details
                    </p>
                  </div>
                </CardHeader>
                <CardContent className="pt-6 space-y-6">
                  {/* Row 1: Full Name & Phone */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Full Name */}
                    <div>
                      <Label
                        htmlFor="patient-name"
                        className="text-sm font-semibold text-gray-700"
                      >
                        Full Name *
                      </Label>
                      <div className="mt-2 relative">
                        <Input
                          id="patient-name"
                          placeholder="Enter your full name"
                          value={formData.patient_details?.name || ""}
                          onChange={(e) => {
                            const value = e.target.value.replace(
                              /[^a-zA-Z\s]/g,
                              ""
                            ); // only alphabets
                            updateField("patient_details.name", value);

                            if (!value.trim()) {
                              updateField(
                                "patient_details.nameError",
                                "Full name is required"
                              );
                            } else {
                              updateField("patient_details.nameError", "");
                            }
                          }}
                          className={`w-full rounded border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition ${
                            formData.patient_details?.nameError
                              ? "border-red-500"
                              : "border-gray-200"
                          }`}
                        />
                      </div>
                      {formData.patient_details?.nameError && (
                        <p className="text-red-500 text-xs mt-1">
                          {formData.patient_details?.nameError}
                        </p>
                      )}
                    </div>

                    {/* Phone Number */}
                    <div>
                      <Label
                        htmlFor="patient-phone"
                        className="text-sm font-semibold text-gray-700"
                      >
                        Phone Number *
                      </Label>
                      <div className="mt-2 relative">
                        <Phone className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                        <Input
                          id="patient-phone"
                          type="tel"
                          inputMode="numeric"
                          maxLength={10}
                          placeholder="10-digit mobile number"
                          value={formData.patient_details?.phone || ""}
                          onChange={(e) => {
                            const value = e.target.value.replace(/\D/g, ""); // only digits
                            updateField("patient_details.phone", value);

                            if (!/^\d{10}$/.test(value)) {
                              updateField(
                                "patient_details.phoneError",
                                "Phone number must be 10 digits"
                              );
                            } else {
                              updateField("patient_details.phoneError", "");
                            }
                          }}
                          className={`w-full rounded border pl-10 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition ${
                            formData.patient_details?.phoneError
                              ? "border-red-500"
                              : "border-gray-200"
                          }`}
                        />
                      </div>
                      {formData.patient_details?.phoneError && (
                        <p className="text-red-500 text-xs mt-1">
                          {formData.patient_details?.phoneError}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Row 2: Aadhar & Email */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Aadhar Number */}
                    <div>
                      <Label
                        htmlFor="patient-aadhar"
                        className="text-sm font-semibold text-gray-700"
                      >
                        Aadhar Number *
                      </Label>
                      <div className="mt-2 relative">
                        <FileDigit className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                        <Input
                          id="patient-aadhar"
                          type="text"
                          maxLength={12}
                          placeholder="12-digit Aadhar number"
                          value={formData.patient_details?.aadhar || ""}
                          onChange={(e) => {
                            const value = e.target.value.replace(/\D/g, ""); // only digits
                            updateField("patient_details.aadhar", value);

                            if (!/^\d{12}$/.test(value)) {
                              updateField(
                                "patient_details.aadharError",
                                "Aadhar number must be 12 digits"
                              );
                            } else {
                              updateField("patient_details.aadharError", "");
                            }
                          }}
                          className={`w-full rounded border pl-10 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition ${
                            formData.patient_details?.aadharError
                              ? "border-red-500"
                              : "border-gray-200"
                          }`}
                        />
                      </div>
                      {formData.patient_details?.aadharError && (
                        <p className="text-red-500 text-xs mt-1">
                          {formData.patient_details?.aadharError}
                        </p>
                      )}
                    </div>

                    {/* Email Address */}
                    <div>
                      <Label
                        htmlFor="patient-email"
                        className="text-sm font-semibold text-gray-700"
                      >
                        Email Address *
                      </Label>
                      <div className="mt-2 relative">
                        <Mail className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                        <Input
                          id="patient-email"
                          type="email"
                          placeholder="your.email@example.com"
                          value={formData.patient_details?.email || ""}
                          onChange={(e) => {
                            const value = e.target.value;
                            updateField("patient_details.email", value);

                            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                            if (value && !emailRegex.test(value)) {
                              updateField(
                                "patient_details.emailError",
                                "Invalid email address"
                              );
                            } else {
                              updateField("patient_details.emailError", "");
                            }
                          }}
                          className={`w-full rounded border pl-10 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition ${
                            formData.patient_details?.emailError
                              ? "border-red-500"
                              : "border-gray-200"
                          }`}
                        />
                      </div>
                      {formData.patient_details?.emailError && (
                        <p className="text-red-500 text-xs mt-1">
                          {formData.patient_details?.emailError}
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Clinic Selection */}
              <Card className="border-2 py-0 pb-4 border-orange-100 shadow-lg">
                <CardHeader className="bg-gradient-to-r from-[#155DFC] to-blue-500 py-5 px-6 rounded-lg rounded-t-2xl shadow-sm">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <MapPin className="w-7 h-7 text-white" />
                      <h2 className="text-lg sm:text-xl font-semibold text-white">
                        Choose Your Preferred Location
                      </h2>
                    </div>
                    <p className="text-sm sm:text-base text-white sm:text-right">
                      {` Select the clinic that's most convenient for you.`}
                    </p>
                  </div>
                </CardHeader>

                <CardContent className="pt-6">
                        <div className="space-y-4">
    {clinics && clinics.length > 0 ? (
      clinics.map((clinic) => {
        const start = new Date(clinic.BookingAvailabeAt?.start_date);
        const end = new Date(clinic.BookingAvailabeAt?.end_date);
        const isAvailable =
          clinic.BookingAvailabeAt &&
          today >= start &&
          today <= end;

        return (
          <div
            key={clinic._id}
            className={`flex items-start space-x-3 p-4 rounded-lg border-2 transition-colors ${
              selectedClinic?._id === clinic._id
                ? "border-orange-300"
                : "border-gray-100"
            } hover:border-orange-200 ${
              !isAvailable ? "opacity-60 cursor-not-allowed bg-gray-50" : ""
            }`}
          >
            <label
              className={`flex items-center gap-3 select-none ${
                !isAvailable ? "pointer-events-none" : "cursor-pointer"
              }`}
            >
              <input
                type="radio"
                name="clinic"
                checked={selectedClinic?._id === clinic._id}
                onChange={() => isAvailable && setSelectedClinic(clinic)}
                disabled={!isAvailable}
                className="hidden"
              />

              <span
                className={`w-6 h-6 flex items-center justify-center rounded-full border-2 transition ${
                  selectedClinic?._id === clinic._id
                    ? "bg-green-500 border-green-500 text-white"
                    : "border-gray-300"
                }`}
              >
                {selectedClinic?._id === clinic._id && "✔"}
              </span>

              <span
                className={`text-base font-medium transition ${
                  selectedClinic?._id === clinic._id
                    ? "text-green-600"
                    : "text-gray-700"
                }`}
              >
                {clinic.name}
              </span>
            </label>

            <div className="flex-1 ml-2">
                <div className="flex items-center gap-2">
                  <h4 className="font-semibold text-lg">{clinic.clinic_name}</h4>
                  {isAvailable ? (
                    <Badge className="flex items-center gap-1 px-3 py-1 rounded-lg shadow-md text-sm font-medium bg-green-500 text-white">
                      <CheckCircle className="w-4 h-4" />
                      Available
                    </Badge>
                  ) : (
                    <Badge className="flex items-center gap-1 px-3 py-1 rounded-lg shadow-md text-sm font-medium bg-red-500 text-white">
                      <XCircle className="w-4 h-4" />
                      Not Available
                    </Badge>
                  )}
                </div>

              {clinic.clinic_contact_details?.clinic_address && (
                <div className="flex items-start gap-2 bg-gray-100 rounded-lg p-2 mt-2">
                  <MapPin className="w-5 h-5 text-green-500 mt-0.5" />
                  <span className="text-gray-700 text-sm">
                    {clinic.clinic_contact_details.clinic_address}
                  </span>
                </div>
              )}

              <div className="flex flex-wrap gap-2 mt-2">
                {clinic.clinic_contact_details?.phone && (
                  <div className="flex items-center gap-1 bg-green-50 text-green-700 px-2 py-1 rounded-lg text-xs sm:text-sm shadow-sm hover:bg-green-100 transition-colors">
                    <Phone className="w-4 h-4" />
                    <span>{clinic.clinic_contact_details.phone}</span>
                  </div>
                )}
                {clinic.clinic_contact_details?.email && (
                  <div className="flex items-center gap-1 bg-blue-50 text-blue-700 px-2 py-1 rounded-lg text-xs sm:text-sm shadow-sm hover:bg-blue-100 transition-colors">
                    <Mail className="w-4 h-4" />
                    <span>{clinic.clinic_contact_details.email}</span>
                  </div>
                )}
              </div>

              {clinic.BookingAvailabeAt && (
                <p className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded mt-2">
                  📅 Available from {start.toDateString()} to {end.toDateString()}
                </p>
              )}
            </div>
          </div>
        );
      })
    ) : (
      <div className="text-center py-10 rounded-xl bg-gradient-to-r from-red-50 to-orange-50 border border-red-100 shadow-sm">
  <div className="flex flex-col items-center space-y-2">
    <XCircle className="w-10 h-10 text-red-400" />
    <h4 className="text-lg font-semibold text-red-600">No Clinics Available</h4>
    <p className="text-sm text-gray-600">Please check back later for new availability.</p>
  </div>
</div>

    )}
  </div>


                  {/* Error display */}
                  {getFieldError("clinic_id") && (
                    <p className="text-red-500 text-sm mt-2">
                      {getFieldError("clinic_id")}
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* Date Selection */}
              {selectedClinic && (
                <Card className="border-2 py-0 pb-4 border-indigo-100 shadow-lg">
                  <CardHeader className="bg-gradient-to-r from-[#155DFC] to-blue-500 py-5 px-6 rounded-lg shadow-sm">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <CalendarIcon className="w-7 h-7 text-white" />
                        <h2 className="text-lg sm:text-xl font-semibold text-white">
                          Pick Your Perfect Date
                        </h2>
                      </div>
                      <p className="text-sm sm:text-base text-white sm:text-right">
                        Choose a date that works best for your schedule
                      </p>
                    </div>
                  </CardHeader>

                  <CardContent className="pt-6">
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={handleDateSelect}
                      disabled={(date) => {
                        const today = new Date();
                        today.setHours(0, 0, 0, 0);
                        return date < today || !isDateAvailable(date);
                      }}
                      className="rounded-lg border-2 border-indigo-100 w-[450px] mx-auto"
                    />
                    {getFieldError("date") && (
                      <p className="text-red-500 text-sm mt-2 text-center">
                        {getFieldError("date")}
                      </p>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Time Selection */}
              {selectedDate && (
                <Card className="border-2 py-0 pb-4 border-teal-100 shadow-lg">
                  <CardHeader className="bg-gradient-to-r from-[#155DFC] to-blue-500 py-5 px-6 rounded-lg shadow-sm">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <Clock className="w-7 h-7 text-white" />
                        <h2 className="text-lg sm:text-xl font-semibold text-white">
                          Select Your Time Slot
                        </h2>
                      </div>
                      <p className="text-sm sm:text-base text-white sm:text-right">
                        {isCheckingAvailability
                          ? "🔍 Checking availability..."
                          : "🕒 Choose your preferred appointment time"}
                      </p>
                    </div>
                  </CardHeader>

                    <CardContent className="pt-6">

                            {/* Availability message below slots */}
                          {selectedTime && (
                            <div className="mt-4 mb-6 space-y-3">
                              {bookedSlots.includes(selectedTime) ? (
                                <div className="flex items-start gap-3 rounded-xl border border-red-300 bg-red-50 p-4 shadow-md">
                                  <span className="text-2xl">⚠️</span>
                                  <div className="flex flex-col">
                                    <p className="text-sm text-red-800 font-semibold">
                                      Time slot <strong>{selectedTime}</strong> is <strong>already booked</strong>
                                    </p>
                                    <p className="text-xs text-red-700 mt-1">
                                      Please choose another time slot.
                                    </p>
                                  </div>
                                </div>
                              ) : (

                            <div className="flex items-center gap-4 rounded-2xl border border-green-300 bg-green-50 p-4 shadow-sm transition-all duration-300 hover:shadow-md">
                              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 text-green-600">
                                <CheckCircle size={22} className="text-green-600" />
                              </div>
                              <div>
                                <p className="text-sm font-semibold text-green-800">
                                  Time slot <span className="font-bold text-green-900">{selectedTime}</span> is available!
                                </p>
                                <p className="text-xs text-green-600 mt-1">
                                  You can proceed to confirm your booking for this time.
                                </p>
                              </div>
                            </div>

                              )}
                            </div>
                          )}
                                                {getFieldError("time") && (
                        <p className="text-red-500 text-sm mt-2">
                          {getFieldError("time")}
                        </p>
                      )}

                    </CardContent>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 px-4 sm:px-6 md:px-8">
                  {selectedClinic && selectedClinic.clinic_timings &&
                    generateTimeSlots(
                      selectedClinic.clinic_timings.open_time,
                      selectedClinic.clinic_timings.close_time
                    ).map((time) => {
                      const isSlotBooked = bookedSlots.includes(time);
                      const isSelected = selectedTime === time;

                      return (
                        <button
                          key={time}
                          onClick={() => setSelectedTime(time)}
                          disabled={isSlotBooked || isCheckingAvailability}
                          className={`relative w-full py-2 px-2 rounded-xl border text-sm font-semibold transition-all duration-300 shadow-sm flex flex-col items-center justify-center text-center 
                            ${
                              isSelected
                                ? "bg-gradient-to-r from-green-600 to-green-500 text-white border-green-700 shadow-lg scale-[1.03]"
                                : isSlotBooked
                                ? "bg-red-100 text-red-700 border-red-300 cursor-not-allowed"
                                : "bg-green-50 text-green-800 border-green-300 hover:bg-green-100 hover:shadow-md hover:border-green-400"
                            }`}
                        >
                          <span className="text-base font-bold">{time}</span>

                          {isSlotBooked ? (
                            <span className="mt-1 flex items-center gap-1.5 text-xs font-medium text-red-600 bg-red-50 border border-red-200 rounded-full px-2 py-0.5">
                              <XCircle size={14} className="text-red-500" />
                              This slot is already booked
                            </span>
                          ) : (
                            <span
                              className={`mt-1 flex items-center gap-1.5 text-xs ${
                                isSelected ? "text-green-100" : "text-gray-500"
                              }`}
                            >
                              Tap a time slot to check its availability
                            </span>
                          )}

                          {isSlotBooked && (
                            <span
                              className="absolute top-2 right-2 w-2.5 h-2.5 bg-red-600 rounded-full"
                              title="Booked"
                            />
                          )}
                        </button>
                      );
                    })}
                </div>
                </Card>
              )}

              {/* Payment Method */}
              {selectedDate && selectedTime && (
                <Card className="border-2 py-0 pb-4 border-purple-100 shadow-lg">
                  <CardHeader className="bg-gradient-to-r from-[#155DFC] to-blue-500 py-5 px-6 rounded-lg shadow-sm">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6">
                        <CreditCard className="w-7 h-7 text-white" />
                        <div className="flex flex-col">
                          <h2 className="text-lg sm:text-xl font-semibold text-white">
                            Secure Payment Options
                          </h2>
                          <p className="text-sm sm:text-base text-white mt-1">
                            Choose your preferred payment method — all
                            transactions are 100% secure
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="pt-6">
                    <div className="space-y-4">
                      {/* Razorpay / UPI Checkbox */}
                      <div
                        className={`flex items-center space-x-3 p-4 rounded-2xl border-2 transition-colors ${
                          paymentMethod === "razorpay"
                            ? "border-green-500 bg-green-50"
                            : "border-gray-200 hover:border-green-300"
                        }`}
                      >
                        <input
                          type="checkbox"
                          id="razorpay"
                          checked={paymentMethod === "razorpay"}
                          onChange={() => setPaymentMethod("razorpay")}
                          className="appearance-none w-6 h-6 rounded-full border-2 border-gray-300 checked:bg-green-500 checked:border-green-500 checked:text-white flex-shrink-0 cursor-pointer relative before:content-['✔'] before:text-white before:absolute before:left-1/2 before:top-1/2 before:-translate-x-1/2 before:-translate-y-1/2"
                        />
                        <label
                          htmlFor="razorpay"
                          className="flex-1 cursor-pointer"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <Wallet className="w-6 h-6 text-blue-500" />
                              <div className="flex flex-col">
                                <p className="font-medium text-gray-800">
                                  UPI / Net Banking / Debit Card
                                </p>
                                <p className="text-sm text-gray-600">
                                  Powered by Razorpay - India's most trusted
                                  payment gateway
                                </p>
                              </div>
                            </div>
                            <Badge
                              variant="secondary"
                              className="rounded-lg bg-green-500 text-white font-semibold px-3 py-1 shadow-sm"
                            >
                              Recommended
                            </Badge>
                          </div>
                        </label>
                      </div>

                      {/* Credit Card Checkbox */}
                      <div
                        className={`flex items-center space-x-3 p-4 rounded-2xl border-2 transition-colors ${
                          paymentMethod === "card"
                            ? "border-green-500 bg-green-50"
                            : "border-gray-200 hover:border-green-300"
                        }`}
                      >
                        <input
                          type="checkbox"
                          id="card"
                          checked={paymentMethod === "card"}
                          onChange={() => setPaymentMethod("card")}
                          className="appearance-none w-6 h-6 rounded-full border-2 border-gray-300 checked:bg-green-500 checked:border-green-500 checked:text-white flex-shrink-0 cursor-pointer relative before:content-['✔'] before:text-white before:absolute before:left-1/2 before:top-1/2 before:-translate-x-1/2 before:-translate-y-1/2"
                        />
                        <label htmlFor="card" className="flex-1 cursor-pointer">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <CreditCard className="w-6 h-6 text-gray-700" />
                              <div className="flex flex-col">
                                <p className="font-medium text-gray-800">
                                  Credit Card
                                </p>
                                <p className="text-sm text-gray-600">
                                  All major credit cards accepted
                                </p>
                              </div>
                            </div>
                            {settings?.payment_config?.credit_card_fee > 0 && (
                              <Badge
                                variant="outline"
                                className="rounded-lg border border-orange-400 bg-orange-50 text-orange-700 font-medium px-3 py-1 shadow-sm"
                              >
                                +{settings.payment_config.credit_card_fee}% fee
                              </Badge>
                            )}
                          </div>
                        </label>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Error Display */}
              {errors.length > 0 && (
                <Alert className="border-red-200 bg-red-50">
                  <AlertDescription className="text-red-800">
                    <div className="space-y-1">
                      {errors
                        .filter((error) => !error.field)
                        .map((error, index) => (
                          <p key={index}>❌ {error.message}</p>
                        ))}
                    </div>
                  </AlertDescription>
                </Alert>
              )}
            </div>

            {/* Booking Summary Sidebar */}
            <div className="space-y-6 mt-4">
              <Card className="sticky py-0 pb-4 top-6 border-2 border-blue-200 shadow-lg">
                <CardHeader className="bg-gradient-to-r from-[#155DFC] to-blue-500 py-5 px-6 shadow-md">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <Sparkles className="w-7 h-7 text-white" />
                      <h2 className="text-lg sm:text-xl text-white font-semibold">
                        Booking Summary
                      </h2>
                    </div>
                    <p className="text-sm sm:text-base text-blue-100 sm:text-right">
                      Your wellness investment breakdown
                    </p>
                  </div>
                </CardHeader>

                <CardContent className="pt-6 space-y-4">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center border-b border-gray-200 pb-3">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-800">
                          {dbService?.service_name}
                        </h3>
                        <p className="mt-1 text-sm text-gray-500">
                          {sessions} Premium Session{sessions > 1 ? "s" : ""}
                        </p>
                      </div>
                    </div>

                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-100 shadow-sm">
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-600 font-medium">
                          Per Session
                        </span>
                        <div className="text-right">
                          {dbService?.service_per_session_discount_price && (
                            <span className="line-through text-gray-400 text-xs mr-2">
                              ₹
                              {dbService.service_per_session_price.toLocaleString()}
                            </span>
                          )}
                          <span className="text-green-600 font-semibold text-lg">
                            ₹
                            {(
                              dbService?.service_per_session_discount_price ||
                              dbService?.service_per_session_price ||
                              0
                            ).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Subtotal</span>
                      <span className="text-gray-900 font-semibold">
                        ₹{pricing.subtotal.toLocaleString()}
                      </span>
                    </div>

                    {pricing.tax > 0 && (
                      <div className="flex justify-between text-sm text-gray-600">
                        <span>
                          GST ({settings?.payment_config?.tax_percentage}%)
                        </span>
                        <span>₹{pricing.tax.toLocaleString()}</span>
                      </div>
                    )}

                    {pricing.creditCard > 0 && (
                      <div className="flex justify-between text-sm text-gray-600">
                        <span>
                          Credit card fee (
                          {settings?.payment_config?.credit_card_fee}%)
                        </span>
                        <span>₹{pricing.creditCard.toLocaleString()}</span>
                      </div>
                    )}
                  </div>

                  <Separator />

                  <div className="flex justify-between font-bold text-xl text-blue-600">
                    <span className="text-gray-900 font-semibold">
                      Total Amount
                    </span>
                    <span className="text-gray-900 font-semibold">
                      ₹ {pricing.total.toLocaleString()}
                    </span>
                  </div>

                  {selectedDate && selectedTime && selectedClinic && (
                    <div className="pt-4 space-y-3">
                      <Alert className="flex flex-col gap-2 border-l-4 border-green-400 bg-green-50 px-4 py-3 rounded-lg shadow-sm">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                          <p className="font-semibold text-dark-800 text-sm">
                            Your Appointment Details:
                          </p>
                        </div>
                        <div className="flex flex-col gap-1 pl-7">
                          <div className="flex items-center gap-2 text-dark-800 text-xs sm:text-sm">
                            <CalendarIcon className="w-4 h-4 text-dark-800" />
                            <span>{selectedDate.toDateString()}</span>
                          </div>
                          <div className="flex items-center gap-2 text-dark-800 text-xs sm:text-sm">
                            <Clock className="w-4 h-4 text-dark-800" />
                            <span>{selectedTime}</span>
                          </div>
                          <div className="flex items-center gap-2 text-dark-800 text-xs sm:text-sm">
                            <MapPin className="w-4 h-4 text-dark-800" />
                            <span>{selectedClinic.clinic_name}</span>
                          </div>
                        </div>
                      </Alert>

                      <Button
                        onClick={handleSubmit}
                        className="w-full bg-gradient-to-r from-[#155DFC] to-[#0092B8] 
                                        border-2 border-[#155DFC]  text-white font-semibold py-3 text-lg shadow-lg"
                        size="lg"
                        disabled={isSubmitting || !isValid}
                      >
                        {isSubmitting ? (
                          <div className="flex items-center gap-2">
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            Processing...
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <Shield className="w-5 h-5" />
                            Secure Pay ₹{pricing.total.toLocaleString()}
                          </div>
                        )}
                      </Button>

                      <div className="flex items-center justify-center gap-2 bg-gradient-to-r from-green-100 to-green-200 border border-green-300 shadow-md px-3 py-2 rounded-lg hover:shadow-lg transition duration-300">
                        <div className="flex items-center justify-center w-7 h-7 bg-green-600 rounded">
                          <Lock className="w-3 h-3 text-white" />
                        </div>
                        <span className="text-green-900 text-xs font-semibold">
                          256-bit SSL Encrypted Payment
                        </span>
                      </div>
                    </div>
                  )}

                  {(!selectedDate ||
                    !selectedTime ||
                    !selectedClinic ||
                    !isValid) && (
                    <Alert className="flex items-center gap-2 border-l-4 border-orange-400 bg-orange-50 px-3 py-2 rounded-md shadow-sm">
                      <AlertCircle className="w-4 h-4 text-orange-500 flex-shrink-0" />
                      <span className="text-orange-800 text-xs font-medium">
                        Please complete all required fields to proceed with
                        booking.
                      </span>
                    </Alert>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Status Modal */}
      <PaymentStatusModal
        isOpen={paymentModal.isOpen}
        onClose={() => setPaymentModal({ ...paymentModal, isOpen: false })}
        status={paymentModal.status}
        bookingDetails={
          paymentModal.status === "success" &&
          selectedDate &&
          selectedTime &&
          selectedClinic
            ? {
                service: dbService?.service_name || "",
                date: selectedDate.toDateString(),
                time: selectedTime,
                clinic: selectedClinic.clinic_name,
                amount: pricing.total,
                bookingId: `BK${Date.now()}`,
              }
            : undefined
        }
        error={paymentModal.error}
      />

      <div className="fixed bottom-0 left-0 w-full z-50 p-4 bg-white border-t border-gray-200 sm:hidden">
        <Button
          onClick={handleSubmit}
          className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold py-3 text-lg shadow-lg"
          size="lg"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              Processing...
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Secure Pay ₹{pricing.total.toLocaleString()}
            </div>
          )}
        </Button>
      </div>
    </>
  );
};

export default EnhancedBookings;
