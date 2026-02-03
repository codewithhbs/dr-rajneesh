"use client";
import React, { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  CalendarDays,
  Clock,
  MapPin,
  Phone,
  Mail,
  User,
  CreditCard,
  Printer,
  CheckCircle,
  AlertCircle,
  Loader2,
  Star,
  Activity,
  ClipboardList,
} from "lucide-react";
import { useGetBookingById } from "@/hooks/booking-info";
import { logo } from "@/constant/Images";

// Type definitions
interface PatientDetails {
  name: string;
  email: string;
  phone: string;
}

interface TreatmentDetails {
  service_name: string;
  service_small_desc: string;
  _id?: string;
  duration?: number;
  price?: number;
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
  _id?: string;
}

interface PaymentDetails {
  subtotal: string;
  tax: string;
  creditCardFee: string;
}

interface PaymentInfo {
  razorpay_order_id: string;
  paidAt: string;
  payment_details: PaymentDetails;
  _id?: string;
  razorpay_payment_id?: string;
  payment_method?: string;
  status?: "completed" | "pending" | "failed";
}

interface SessionDate {
  _id: string;
  date: string;
  time: string;
  sessionNumber: number;
  status: "Pending" | "Completed" | "Cancelled" | "Scheduled";
}

interface Booking {
  _id?: string;
  bookingNumber: string;
  no_of_session_book: number;
  totalAmount: number;
  priority: "Normal" | "High" | "Urgent";
  patient_details: PatientDetails;
  treatment_id?: TreatmentDetails;
  session_booking_for_clinic: ClinicDetails;
  payment_id: PaymentInfo;
  SessionDates: SessionDate[];
  createdAt?: string;
  updatedAt?: string;
  status?: "confirmed" | "pending" | "cancelled" | "completed";
  notes?: string;
  assigned_doctor?: string;
}

interface UseBookingByIdReturn {
  data: Booking | null;
  loading: boolean;
  error: string | null;
  refetch?: () => void;
}

// Type guard to check if booking has required fields
const isValidBooking = (booking: Booking | null): booking is Booking => {
  return !!(
    booking &&
    booking.bookingNumber &&
    booking.patient_details &&
    booking.session_booking_for_clinic &&
    booking.payment_id &&
    booking.SessionDates &&
    Array.isArray(booking.SessionDates)
  );
};

// Loading component for booking details
function BookingSuccessLoading() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading booking details...</p>
      </div>
    </div>
  );
}

// Main content component that uses useSearchParams
const BookingSuccessContent: React.FC = () => {
  const searchParams = useSearchParams();
  const bookingId: string | null = searchParams?.get("bookingId") ?? null;

  // Type the hook return value
  const { data, loading, error }: UseBookingByIdReturn = useGetBookingById({
    id: bookingId || "",
  });

  const handlePrint = (): void => {
    window.print();
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatTime = (time: string): string => {
    const [hours, minutes] = time.split(":");
    const hour24: number = parseInt(hours);
    const hour12: number =
      hour24 === 0 ? 12 : hour24 > 12 ? hour24 - 12 : hour24;
    const ampm: string = hour24 >= 12 ? "PM" : "AM";
    return `${hour12}:${minutes} ${ampm}`;
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(amount);
  };

  // Early return for invalid booking ID
  if (!bookingId) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <Alert className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            No booking ID found in the URL. Please check your booking link.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading booking details...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <Alert className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Failed to load booking details. Please try again or contact support.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // No data found
  if (!data || !isValidBooking(data)) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <Alert className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Booking not found. Please verify your booking ID.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // Type-safe booking data
  const booking: Booking = data;

  // Calculate session display logic
  const hasMultipleSessions: boolean = booking.no_of_session_book > 1;
  const hasOnlyOneSessionDate: boolean = booking.SessionDates.length === 1;
  const showNextSessionNote: boolean =
    hasMultipleSessions && hasOnlyOneSessionDate;

  // Get badge variant based on priority
  const getPriorityBadgeVariant = (
    priority: string
  ): "default" | "secondary" | "destructive" => {
    return priority === "Normal" ? "secondary" : "destructive";
  };

  // Get session status badge variant
  const getSessionStatusBadgeVariant = (
    status: string
  ): "default" | "secondary" => {
    return status === "Pending" ? "secondary" : "default";
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Print Styles */}
      <style jsx global>{`
        @media print {
          /* Hide browser header/footer with URL and date */
          @page {
            margin: 0.5in;
            size: A4;
          }

          .no-print {
            display: none !important;
          }
          .print-container {
            background: white !important;
            box-shadow: none !important;
            margin: 0 !important;
            padding: 15px !important;
            font-size: 12px !important;
            line-height: 1.4 !important;
          }
          .print-only {
            display: block !important;
          }
          body {
            background: white !important;
            -webkit-print-color-adjust: exact !important;
            color-adjust: exact !important;
          }

          /* Compact print layout */
          .print-header {
            font-size: 14px !important;
            margin-bottom: 15px !important;
          }
          .print-title {
            font-size: 16px !important;
            margin-bottom: 10px !important;
          }
          .print-card {
            margin-bottom: 12px !important;
            padding: 8px !important;
            border: none !important;
            box-shadow: none !important;
          }
          .print-card-title {
            font-size: 13px !important;
            margin-bottom: -10px !important;
          }
          .print-spacing {
            margin-bottom: -8px !important;
          }
          .print-text-sm {
            font-size: 10px !important;
          }

          /* Force page breaks to stay within 2 pages */
          .page-break-avoid {
            page-break-inside: avoid !important;
          }
          .page-break-after {
            page-break-after: always !important;
          }

          /* Hide overflow content that might cause extra pages */
          .print-container * {
            max-width: 100% !important;
            overflow: hidden !important;
          }
        }
        .print-only {
          display: none;
        }

        
      `}</style>

      <div className="container mx-auto p-6 max-w-4xl">
        {/* Header with Print Button */}
        <div className="flex justify-between items-center mb-6 no-print">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mt-7">
              Booking Confirmation
            </h1>
            <p className="text-gray-600 mt-1">
              Your appointment has been successfully booked 
            </p>
          </div>
          <Button
            onClick={handlePrint}
            className="flex items-center gap-2  text-white 
                                        bg-gradient-to-r from-[#155DFC] to-[#0092B8] 
                                        border-2 border-[#155DFC] "
          >
            <Printer className="h-4 w-4" />
            Print Receipt
          </Button>
        </div>

        {/* Success Alert */}
        <Alert className="mb-6 border-green-200 bg-green-50 no-print">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            Your booking has been confirmed! Payment of{" "}
            {formatCurrency(booking.totalAmount)} has been successfully
            processed.
          </AlertDescription>
        </Alert>

        <div className="print-container bg-white rounded-lg shadow-lg p-8">
          {/* Print Header with Clinic Logo and Info */}
          <div className="print-only mb-6 print-header">
            <div className="flex items-center justify-center mb-4">
              <div className="text-center">
                {/* Clinic Logo */}
                <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-2">
                  <Image src={logo} width={120} height={120} alt="logo" />
                </div>
                <h1 className="text-lg font-bold text-gray-900">
                  Dr. Rajneesh Kant
                </h1>
                <p className="text-sm text-gray-700 font-medium">
                  Physiotherapist | Osteopath | Chiropractor
                </p>
                <div className="mt-1 text-xs text-gray-600">
                  <p>
                    {
                      booking.session_booking_for_clinic.clinic_contact_details
                        .clinic_address
                    }
                  </p>
                  <p>
                    Phone:{" "}
                    {
                      booking.session_booking_for_clinic.clinic_contact_details
                        .phone_numbers[0]
                    }{" "}
                    | Email:{" "}
                    {
                      booking.session_booking_for_clinic.clinic_contact_details
                        .email
                    }
                  </p>
                </div>
              </div>
            </div>
            <div className="border-t border-gray-300 mb-4"></div>
          </div>

          {/* Receipt Header */}
          <div className="text-center mb-8 no-print">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Treatment Booking Receipt
            </h2>
            <p className="text-gray-600">
              Booking ID:{" "}
              <span className="font-mono font-semibold">
                {booking.bookingNumber}
              </span>
            </p>
            <p className="text-sm text-gray-500">
              Booked on{" "}
              {new Date(booking.payment_id.paidAt).toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          </div>

          {/* Print Receipt Header */}
          <div className="print-only text-center mb-4 print-title">
            <h2 className="text-base font-bold text-gray-900 mb-1">
              APPOINTMENT RECEIPT
            </h2>
            <p className="text-xs text-gray-600">
              Booking ID:{" "}
              <span className="font-mono font-semibold">
                {booking.bookingNumber}
              </span>
            </p>
            <p className="text-xs text-gray-500">
              Date:{" "}
              {new Date(booking.payment_id.paidAt).toLocaleDateString("en-US", {
                year: "numeric",
                month: "short",
                day: "numeric",
              })}
            </p>
          </div>

          <div
            className={`grid grid-cols-1 mt-4 gap-6 ${
              booking.treatment_id ? "md:grid-cols-2" : "md:grid-cols-1"
            }`}
          >
            {/* Patient Information */}
            <Card className="print-card bg-blue-50 rounded-lg border border-gray-200 shadow-md">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-sm font-semibold text-gray-800">
                  Patient Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 print-spacing text-sm">
                <div className="flex items-center gap-2">
                  <User className="h-3 w-3 text-gray-500" />{" "}
                  {/* Icon for Name */}
                  <span className="font-medium text-gray-700">Name:</span>
                  <span className="text-gray-900">
                    {booking.patient_details.name}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="h-3 w-3 text-gray-500" />
                  <span className="text-gray-900">
                    Email: {booking.patient_details.email}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="h-3 w-3 text-gray-500" />
                  <span className="text-gray-900">
                    Phone: {booking.patient_details.phone}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Treatment Information */}
            {booking.treatment_id && (
              <Card className="print-card bg-blue-50 rounded-lg border border-gray-200 shadow-md">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm print-card-title">
                    Treatment Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 print-spacing">
                  <div className="flex items-center gap-2">
                    <Activity className="h-4 w-4 text-gray-500" />{" "}
                    {/* Icon for Service */}
                    <h4 className="font-semibold text-sm">
                      {booking.treatment_id.service_name}
                    </h4>
                  </div>
                  <p className="text-gray-600 text-xs ml-6">
                    {booking.treatment_id.service_small_desc}
                  </p>

                  <div className="flex items-center gap-2 text-xs">
                    <ClipboardList className="h-4 w-4 text-gray-500" />{" "}
                    {/* Icon for Sessions */}
                    <span className="font-medium">Sessions:</span>
                    <Badge variant="secondary" className="text-xs">
                      {booking.no_of_session_book} Sessions
                    </Badge>
                  </div>

                  <div className="flex items-center gap-2 text-xs">
                    <Star className="h-4 w-4 text-gray-500" />{" "}
                    {/* Icon for Priority */}
                    <span className="font-medium">Priority:</span>
                    <Badge
                      variant={getPriorityBadgeVariant(booking.priority)}
                      className="text-xs"
                    >
                      {booking.priority}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Clinic Information */}
          <Card className="mt-6 print-card bg-blue-100 rounded-lg border border-gray-200 shadow-lg p-4">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg font-semibold text-gray-800">
                <MapPin className="h-5 w-5 text-gray-600" />
                Clinic Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Clinic Name and Rating */}
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-gray-900 text-base flex items-center gap-2">
                  {booking.session_booking_for_clinic.clinic_name}
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    <span className="text-sm font-medium text-gray-700">
                      {booking.session_booking_for_clinic.clinic_ratings}
                    </span>
                  </div>
                </h4>
              </div>

              {/* Clinic Address */}
              <p className="text-gray-700 text-sm">
                {
                  booking.session_booking_for_clinic.clinic_contact_details
                    .clinic_address
                }
              </p>

              <div className="grid md:grid-cols-2 gap-4">
                {/* Contact Info */}
                <div className="bg-white p-3 rounded-lg shadow-sm space-y-2 border border-gray-100">
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-gray-500" />
                    <span className="text-gray-800 text-sm">
                      {
                        booking.session_booking_for_clinic
                          .clinic_contact_details.phone_numbers[0]
                      }
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-gray-500" />
                    <span className="text-gray-800 text-sm">
                      {
                        booking.session_booking_for_clinic
                          .clinic_contact_details.email
                      }
                    </span>
                  </div>
                </div>

                {/* Timings */}
                <div className="bg-white p-3 rounded-lg shadow-sm space-y-2 border border-gray-100">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-gray-500" />
                    <span className="text-gray-800 text-sm">
                      {formatTime(
                        booking.session_booking_for_clinic.clinic_timings
                          .open_time
                      )}{" "}
                      -{" "}
                      {formatTime(
                        booking.session_booking_for_clinic.clinic_timings
                          .close_time
                      )}
                    </span>
                  </div>
                  <div className="inline-block bg-red-100 text-red-700 font-semibold text-sm px-2 py-1 rounded">
                    Closed on{" "}
                    {booking.session_booking_for_clinic.clinic_timings.off_day}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Session Information */}
          <Card className="mt-4 print-card page-break-avoid bg-blue-50 rounded-lg border border-gray-200 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm print-card-title">
                <CalendarDays className="h-4 w-4 text-gray-500" />
                Session Schedule
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {booking.SessionDates.map(
                (session: SessionDate, index: number) => (
                  <div
                    key={`${session._id}-${index}`}
                    className="flex justify-between items-center p-3 border border-gray-200 rounded-md mb-2 last:mb-0 bg-white shadow-sm hover:bg-blue-50 transition"
                  >
                    <div>
                      <h4 className="font-semibold text-sm text-gray-800">
                        Session {session.sessionNumber}
                      </h4>
                      <p className="text-gray-600 text-xs">
                        {formatDate(session.date)}
                      </p>
                      <p className="text-gray-500 text-xs">
                        at {formatTime(session.time)}
                      </p>
                    </div>
                    <Badge
                      variant={getSessionStatusBadgeVariant(session.status)}
                      className="text-xs font-semibold px-3 py-1 rounded shadow-sm"
                    >
                      {session.status}
                    </Badge>
                  </div>
                )
              )}

              {showNextSessionNote && (
                <Alert className="mt-2 no-print p-2 bg-yellow-50 border-yellow-200 text-yellow-800 rounded-md flex items-center gap-2 text-xs">
                  <AlertCircle className="h-3 w-3" />
                  <AlertDescription>
                    Next session date will be scheduled by the doctor.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          {/* Payment Information */}
          <Card className="mt-4 print-card page-break-avoid bg-gradient-to-r from-blue-50 to-white rounded-lg shadow-md border border-gray-200">
            <CardHeader className="pb-2 bg-blue-100 rounded-t-lg px-4 py-2">
              <CardTitle className="flex items-center gap-2 text-sm font-semibold text-gray-800 print-card-title">
                <CreditCard className="h-4 w-4 text-blue-600" />
                Payment Details
              </CardTitle>
            </CardHeader>

            <CardContent className="px-4 py-3">
              <div className="space-y-2 text-xs">
                <div className="flex justify-between bg-blue-50 px-2 py-1 rounded">
                  <span>Subtotal ({booking.no_of_session_book} sessions):</span>
                  <span className="font-medium">
                    {formatCurrency(
                      parseInt(booking.payment_id.payment_details.subtotal)
                    )}
                  </span>
                </div>
                <div className="flex justify-between bg-blue-50 px-2 py-1 rounded">
                  <span>Tax (GST):</span>
                  <span className="font-medium">
                    {formatCurrency(
                      parseInt(booking.payment_id.payment_details.tax)
                    )}
                  </span>
                </div>
                {parseInt(booking.payment_id.payment_details.creditCardFee) >
                  0 && (
                  <div className="flex justify-between bg-blue-50 px-2 py-1 rounded">
                    <span>Processing Fee:</span>
                    <span className="font-medium">
                      {formatCurrency(
                        parseInt(
                          booking.payment_id.payment_details.creditCardFee
                        )
                      )}
                    </span>
                  </div>
                )}

                <Separator className="my-2" />

                <div className="flex justify-between font-bold text-sm bg-blue-100 px-3 py-2 rounded-lg shadow-sm">
                  <span>Total Amount:</span>
                  <span>{formatCurrency(booking.totalAmount)}</span>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between bg-green-100 text-green-900 px-3 py-2 rounded-lg shadow-sm no-print">
                <div className="flex items-center gap-2 font-semibold">
                  <CheckCircle className="h-4 w-4" />
                  Payment Completed
                </div>
                <div className="text-xs text-green-800 font-medium">
                  ID: {booking.payment_id.razorpay_order_id}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Footer */}
          <div className="mt-8 text-center text-gray-500 text-sm border-t pt-6 no-print">
            <p>Thank you for choosing our services!</p>
            <p>
              For any queries, please contact the clinic or our support team.
            </p>
          </div>

          {/* Print Footer */}
          <div className="print-only mt-8 text-center text-gray-600 text-sm border-t pt-6">
            <p className="font-medium">
              Thank you for choosing Dr. Rajneesh Kant Clinic!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

// Main page component with proper Suspense wrapping
const Page: React.FC = () => {
  return (
    <Suspense fallback={<BookingSuccessLoading />}>
      <BookingSuccessContent />
    </Suspense>
  );
};

export default Page;
