"use client";

import React, { useState, useEffect, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import { useReactToPrint } from "react-to-print";
import {
  CalendarDays,
  Clock,
  MapPin,
  Phone,
  Mail,
  User,
  Download,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Star,
} from "lucide-react";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";

import axios from "axios";
import { format } from "date-fns";

const API_ENDPOINT = "http://localhost:7900/api/v1";

// Types
interface PatientDetails {
  name: string;
  email: string;
  phone: string;
}

interface TreatmentDetails {
  service_name: string;
  service_small_desc: string;
}

interface ClinicContactDetails {
  clinic_address: string;
  phone_numbers: string[];
  email: string;
}

interface ClinicTimings {
  open_time: string;
  close_time: string;
  off_day: string;
}

interface ClinicDetails {
  clinic_name: string;
  clinic_ratings: number;
  clinic_contact_details: ClinicContactDetails;
  clinic_timings: ClinicTimings;
  any_special_note?: string;
}

interface PaymentDetails {
  subtotal: number;
  tax: number;
}

interface PaymentInfo {
  status?: "completed" | "pending" | "failed";
  payment_method?: string;
  paymentDetails?: PaymentDetails;
}

interface SessionDate {
  date: string;
  time: string;
  sessionNumber: number;
  status: string;
}

interface Booking {
  bookingNumber: string;
  no_of_session_book: number;
  totalAmount: number;
  patient_details: PatientDetails;
  treatment_id?: TreatmentDetails;
  session_booking_for_clinic: ClinicDetails;
  payment_id: PaymentInfo;
  SessionDates: SessionDate[];
  createdAt?: string;
}

// Receipt Component (for PDF)
const ReceiptContent = React.forwardRef<HTMLDivElement, { booking: Booking }>(
  ({ booking }, ref) => {
    const formatDate = (dateString: string) =>
      new Date(dateString).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });

    const formatTime = (time: string) => {
      const [hours, minutes] = time.split(":");
      const h = parseInt(hours);
      const period = h >= 12 ? "PM" : "AM";
      const hour12 = h % 12 || 12;
      return `${hour12}:${minutes} ${period}`;
    };

    const formatCurrency = (amount: number) =>
      new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        minimumFractionDigits: 0,
      }).format(amount);

    const firstSession = booking.SessionDates[0];
    const tax = booking.payment_id.paymentDetails?.tax || 0;
    const subtotal = booking.totalAmount - tax;

    return (
      <div
        ref={ref}
        className="bg-white p-10 max-w-[800px] mx-auto font-sans"
        style={{ minHeight: "100vh" }}
      >
        {/* Header */}
        <div className="border-b-2 border-gray-300 pb-8 mb-8">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Back to Nature Spine Clinic
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                Dr. Rajneesh Kant • Spine & Pain Management Specialist
              </p>
            </div>
            <div className="text-right">
              <div className="text-green-600 font-bold text-xl tracking-widest">RECEIPT</div>
              <p className="text-xs text-gray-500 mt-1">
                {formatDate(booking.createdAt || new Date().toISOString())}
              </p>
            </div>
          </div>
        </div>

        {/* Patient & Booking Info */}
        <div className="grid grid-cols-2 gap-10 mb-10">
          <div>
            <p className="uppercase text-xs tracking-widest text-gray-500 mb-2">Bill To</p>
            <p className="font-semibold text-lg text-gray-900">{booking.patient_details.name}</p>
            <p className="text-sm text-gray-600">{booking.patient_details.email}</p>
            <p className="text-sm text-gray-600">{booking.patient_details.phone}</p>
          </div>

          <div className="text-right">
            <p className="uppercase text-xs tracking-widest text-gray-500 mb-2">Booking No.</p>
            <p className="font-mono font-bold text-xl text-gray-900">{booking.bookingNumber}</p>
            <p className="text-sm text-gray-600 mt-4">
              Status: <span className="font-semibold text-green-600">Confirmed</span>
            </p>
          </div>
        </div>

        {/* Treatment & Clinic */}
        <div className="grid grid-cols-2 gap-10 mb-10">
          <div>
            <p className="uppercase text-xs tracking-widest text-gray-500 mb-2">Treatment</p>
            <p className="font-semibold text-gray-900">{booking.treatment_id?.service_name}</p>
            <p className="text-sm text-gray-600 mt-1 leading-relaxed">
              {booking.treatment_id?.service_small_desc}
            </p>
          </div>

          <div>
            <p className="uppercase text-xs tracking-widest text-gray-500 mb-2">Clinic</p>
            <p className="font-semibold text-gray-900">
              {booking.session_booking_for_clinic.clinic_name}
            </p>
            <p className="text-sm text-gray-600 mt-2">
              {booking.session_booking_for_clinic.clinic_contact_details.clinic_address}
            </p>
          </div>
        </div>

        <Separator className="my-8" />

        {/* Session Details */}
        <div className="mb-10">
          <p className="uppercase text-xs tracking-widest text-gray-500 mb-4">Scheduled Session</p>
          <div className="bg-gray-50 p-6 rounded-xl border border-gray-200">
            <div className="flex justify-between">
              <div>
                <p className="font-semibold">Session {firstSession.sessionNumber}</p>
                <p className="text-lg font-medium mt-2">{formatDate(firstSession.date)}</p>
                <p className="text-gray-600">Time: {formatTime(firstSession.time)}</p>
              </div>
              <Badge variant="outline" className="bg-green-100 text-green-700 border-green-200">
                {firstSession.status}
              </Badge>
            </div>
          </div>
        </div>

        {/* Payment Summary */}
        <div>
          <p className="uppercase text-xs tracking-widest text-gray-500 mb-4">Payment Summary</p>
          <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-4">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Subtotal</span>
              <span>₹{subtotal.toLocaleString("en-IN")}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">GST (18%)</span>
              <span>₹{tax.toLocaleString("en-IN")}</span>
            </div>
            <Separator />
            <div className="flex justify-between text-lg font-bold">
              <span>Total Amount</span>
              <span className="text-green-600">₹{booking.totalAmount.toLocaleString("en-IN")}</span>
            </div>
            <p className="text-xs text-gray-500 text-center pt-2">
              Payment Method: {booking.payment_id.payment_method?.replace("_", " ").toUpperCase() || "PAY AT CLINIC"}
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-16 text-xs text-gray-500">
          <p>Thank you for choosing Dr. Rajneesh Kant - Back to Nature Spine Clinic</p>
          <p className="mt-2">For support: 093085 11357 | support@drrajneeshkant.com</p>
        </div>
      </div>
    );
  }
);

ReceiptContent.displayName = "ReceiptContent";

// Main Booking Success Page
const BookingSuccessContent = () => {
  const searchParams = useSearchParams();
  const bookingId = searchParams.get("bookingId");
  const receiptRef = useRef<HTMLDivElement>(null);

  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const handlePrint = useReactToPrint({
    contentRef: receiptRef,
    documentTitle: `Receipt-${booking?.bookingNumber || "Booking"}`,
  });

  // Fetch booking data
  useEffect(() => {
    if (!bookingId) {
      setError("No booking ID found");
      setLoading(false);
      return;
    }

    const fetchBooking = async () => {
      try {
        setLoading(true);
        const res = await axios.get(`${API_ENDPOINT}/booking/my-bookings/${bookingId}`);
        
        if (res.data?.data) {
          setBooking(res.data.data);
        } else {
          setError("Booking not found");
        }
      } catch (err) {
        console.error(err);
        setError("Failed to load booking details");
      } finally {
        setLoading(false);
      }
    };

    fetchBooking();
  }, [bookingId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8F7F4]">
        <div className="text-center">
          <Loader2 className="h-10 w-10 animate-spin mx-auto text-[#185FA5]" />
          <p className="mt-4 text-gray-600">Loading your booking details...</p>
        </div>
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8F7F4]">
        <Card className="max-w-md w-full">
          <CardContent className="pt-8 text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="font-semibold text-xl">Something went wrong</h3>
            <p className="text-gray-600 mt-2">{error || "Booking not found"}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const firstSession = booking.SessionDates[0];
  const tax = booking.payment_id.paymentDetails?.tax || 0;
  const subtotal = booking.totalAmount - tax;

  return (
    <div className="min-h-screen bg-[#F8F7F4] py-12 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Success Banner */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-6">
            <CheckCircle2 className="h-12 w-12 text-green-600" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900">Booking Confirmed!</h1>
          <p className="text-gray-600 mt-3 text-lg">
            Your appointment with Dr. Rajneesh Kant has been successfully booked.
          </p>
        </div>

        {/* Booking Number */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 mb-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <p className="text-sm text-gray-500">BOOKING NUMBER</p>
              <p className="font-mono text-3xl font-bold text-gray-900 mt-1">{booking.bookingNumber}</p>
            </div>
            <div className="flex gap-3">
              <Button onClick={handlePrint} variant="outline" className="flex items-center gap-2">
                <Download className="h-4 w-4" />
                Download Receipt
              </Button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-8 space-y-8">
            {/* Patient Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <User className="h-5 w-5 text-blue-600" />
                  Patient Information
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <p className="text-xs text-gray-500">NAME</p>
                  <p className="font-semibold mt-1">{booking.patient_details.name}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">EMAIL</p>
                  <p className="font-medium mt-1">{booking.patient_details.email}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">PHONE</p>
                  <p className="font-medium mt-1">{booking.patient_details.phone}</p>
                </div>
              </CardContent>
            </Card>

            {/* Treatment & Clinic */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <Card>
                <CardHeader>
                  <CardTitle>Treatment</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="font-semibold text-lg">{booking.treatment_id?.service_name}</p>
                  <p className="text-sm text-gray-600 mt-3 leading-relaxed">
                    {booking.treatment_id?.service_small_desc}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Clinic</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="font-semibold">{booking.session_booking_for_clinic.clinic_name}</p>
                  <p className="text-sm text-gray-600 mt-2">
                    {booking.session_booking_for_clinic.clinic_contact_details.clinic_address}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Session Schedule */}
            <Card>
              <CardHeader>
                <CardTitle>Scheduled Appointment</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-emerald-700 font-medium">Session {firstSession.sessionNumber}</p>
                      <p className="text-2xl font-bold text-gray-900 mt-2">
                        {format(new Date(firstSession.date), "dd MMMM yyyy")}
                      </p>
                      <p className="text-lg text-gray-700 mt-1">at {firstSession.time}</p>
                    </div>
                    <Badge className="bg-emerald-100 text-emerald-700">{firstSession.status}</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar - Payment & Clinic Info */}
          <div className="lg:col-span-4 space-y-8">
            <Card>
              <CardHeader>
                <CardTitle>Payment Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal</span>
                  <span>₹{subtotal.toLocaleString("en-IN")}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">GST (18%)</span>
                  <span>₹{tax.toLocaleString("en-IN")}</span>
                </div>
                <Separator />
                <div className="flex justify-between text-xl font-bold">
                  <span>Total</span>
                  <span className="text-green-600">₹{booking.totalAmount.toLocaleString("en-IN")}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Clinic Contact</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-gray-500 mt-0.5" />
                  <p>{booking.session_booking_for_clinic.clinic_contact_details.clinic_address}</p>
                </div>
                <div className="flex items-center gap-3">
                  <Phone className="h-5 w-5 text-gray-500" />
                  <p>{booking.session_booking_for_clinic.clinic_contact_details.phone_numbers[0]}</p>
                </div>
                <div className="flex items-center gap-3">
                  <Mail className="h-5 w-5 text-gray-500" />
                  <p>{booking.session_booking_for_clinic.clinic_contact_details.email}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Hidden Receipt for Printing */}
        <div className="hidden">
          <ReceiptContent ref={receiptRef} booking={booking} />
        </div>
      </div>
    </div>
  );
};

// Wrapper with Suspense
export default function BookingSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-[#F8F7F4]">
        <Loader2 className="h-10 w-10 animate-spin text-[#185FA5]" />
      </div>
    }>
      <BookingSuccessContent />
    </Suspense>
  );
}