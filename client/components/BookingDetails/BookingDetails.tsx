// app/booking/[slug]/page.tsx
"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Phone, 
  Mail, 
  User, 
  IndianRupee, 
  AlertCircle,
  Printer,
  Building2,
  Stethoscope,
  Loader2,
  ExternalLink,
  CreditCard,
  Info,
  Timer,
  Package
} from "lucide-react";
import axios from "axios";

interface AddOn {
  addOnId: string;
  title: string;
  price: number;
  _id: string;
  addedAt: string;
  id: string;
}

interface SessionDate {
  sessionNumber: number;
  date: string;
  time: string;
  status: string;
  _id: string;
  rescheduleHistory: any[];
  id: string;
}

interface TreatmentInfo {
  _id: string;
  service_name: string;
  service_small_desc: string;
  service_desc: string;
  service_status: string;
  service_session_allowed_limit: number;
  service_per_session_price: number;
  service_per_session_discount_price: number;
  service_per_session_discount_percentage: number;
  service_tag: string;
  service_slug: string;
}

interface BookingData {
  patient_details: {
    name: string;
    email: string;
    phone: string;
    aadhar?: string;
  };
  cancellation: {
    refundEligible: boolean;
  };
  _id: string;
  treatment_id: TreatmentInfo;
  no_of_session_book: number;
  SessionDates: SessionDate[];
  session_booking_for_clinic: {
    clinic_name: string;
    clinic_contact_details: {
      email: string;
      phone_numbers: string[];
      clinic_address: string;
    };
    clinic_timings: {
      open_time: string;
      close_time: string;
      off_day: string;
    };
    clinic_images: { url: string; _id: string }[];
    clinic_map: string;
    any_special_note?: string;
    clinic_ratings?: number;
  };
  session_booking_for_doctor: {
    doctor_name: string;
    _id: string;
  };
  session_status: string;
  addOnsTotal: number;
  addOns: AddOn[];
  payment_id: {
    payment_details: {
      subtotal: string;
      tax: string;
      creditCardFee: string;
      total: string;
    };
    paymentMethod: string;
    razorpay_payment_id?: string;
  };
  totalAmount: number;
  amountPerSession: number;
  bookingNumber: string;
  nextSession?: SessionDate;
  progressPercentage: number;
  completedSessionsCount: number;
  createdAt: string;
}

export default function BookingDetails({ slug }: { slug: string  }) {
  const [booking, setBooking] = useState<BookingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const receiptRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchBookingDetails();
  }, []);

  const fetchBookingDetails = async () => {
    try {
      setLoading(true);
      const res = await axios.get(
        `https://drkm.api.adsdigitalmedia.com/api/v1/booking/my-bookings/${slug}`
      );
      if (res.data.success) {
        setBooking(res.data.data);
      } else {
        setError("Failed to load booking details");
      }
    } catch (err) {
      console.error("Failed to fetch booking details:", err);
      setError("Unable to load booking details. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

const handlePrint = () => {
  const printContent = receiptRef.current;
  if (!printContent) return;

  const printWindow = window.open("", "", "width=900,height=800");
  if (!printWindow) {
    alert("Please allow popups to print the receipt.");
    return;
  }

  printWindow.document.write(`
    <html>
      <head>
        <title>Receipt - ${booking?.bookingNumber || "Booking"}</title>
        <meta charset="utf-8">
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          body {
            font-family: 'Courier New', Courier, monospace;
            font-size: 13px;
            line-height: 1.5;
            color: #000;
            padding: 30px 40px;
            background: #fff;
          }
          .receipt {
            max-width: 800px;
            margin: 0 auto;
          }
          .header {
            text-align: center;
            border-bottom: 2px solid #000;
            padding-bottom: 15px;
            margin-bottom: 25px;
          }
          .header h1 {
            font-size: 22px;
            font-weight: bold;
            letter-spacing: 1px;
          }
          .header p {
            font-size: 13px;
            margin-top: 8px;
          }
          .section {
            margin-bottom: 22px;
          }
          .section-title {
            font-size: 15px;
            font-weight: bold;
            border-bottom: 1px solid #333;
            padding-bottom: 4px;
            margin-bottom: 10px;
            color: #1e40af;
          }
          .row {
            display: flex;
            justify-content: space-between;
            padding: 4px 0;
            font-size: 13px;
          }
          .row.label {
            font-weight: 600;
          }
          .session-item {
            background: #f5f5f5;
            padding: 12px;
            margin: 10px 0;
            border-left: 4px solid #2563eb;
            font-size: 13px;
          }
          .session-header {
            display: flex;
            justify-content: space-between;
            font-weight: bold;
            margin-bottom: 5px;
          }
          .status-badge {
            font-size: 11px;
            padding: 3px 8px;
            border-radius: 12px;
            background: #fef3c7;
            color: #92400e;
          }
          .status-badge.completed {
            background: #dcfce7;
            color: #166534;
          }
          .addon-item {
            padding: 8px 0;
            border-bottom: 1px dotted #999;
            display: flex;
            justify-content: space-between;
            font-size: 13px;
          }
          .payment-summary {
            background: #f8fafc;
            border: 2px solid #1e293b;
            padding: 18px;
            margin: 25px 0;
          }
          .total-row {
            display: flex;
            justify-content: space-between;
            padding: 6px 0;
            font-size: 14px;
          }
          .total-final {
            font-size: 18px;
            font-weight: bold;
            border-top: 2px solid #000;
            padding-top: 12px;
            margin-top: 10px;
            color: #166534;
          }
          .footer {
            text-align: center;
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px dashed #666;
            font-size: 12px;
            color: #555;
          }
          .non-refundable {
            color: #dc2626;
            font-weight: bold;
            margin-top: 15px;
            font-size: 13px;
          }
          @media print {
            body {
              padding: 20px;
              font-size: 12px;
            }
            .no-print { display: none; }
            @page { margin: 0.5cm; }
          }
        </style>
      </head>
      <body onload="window.print(); window.close()">
        ${printContent.innerHTML}
      </body>
    </html>
  `);

  printWindow.document.close();
  printWindow.focus();
};

  const formatDate = (isoString: string) => {
    return new Date(isoString).toLocaleDateString("en-IN", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatTime = (time: string) => {
    return time;
  };

  if (loading) {
    return (
      <div className="container mx-auto py-20 flex justify-center items-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin mx-auto text-blue-600 mb-4" />
          <p className="text-gray-600">Loading booking details...</p>
        </div>
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="container mx-auto py-10 text-center">
        <AlertCircle className="w-16 h-16 text-red-600 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-red-600">Booking Not Found</h2>
        <p className="mt-4 text-gray-600">{error || "Unable to load booking details."}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="container mx-auto py-8 px-4 max-w-7xl">
        {/* Header Section */}
        <div className="mb-8 bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
                Booking Details
              </h1>
              <p className="text-gray-600">
                Manage your appointment and view booking information
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Badge variant="secondary" className="text-base px-4 py-2 font-mono">
                {booking.bookingNumber}
              </Badge>
              <Badge 
                variant={booking.session_status === "Confirmed" ? "default" : "secondary"}
                className="text-base px-4 py-2"
              >
                {booking.session_status}
              </Badge>
              {!booking.cancellation.refundEligible && (
                <Badge variant="destructive" className="flex items-center gap-1 px-4 py-2">
                  <AlertCircle className="w-4 h-4" />
                  Non-Refundable
                </Badge>
              )}
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left Column - Patient & Quick Info */}
          <div className="lg:col-span-1 space-y-6">
            {/* Patient Details Card */}
            <Card className="shadow-lg border-0 overflow-hidden">
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 text-white">
                <div className="flex items-center gap-4">
                  <Avatar className="h-16 w-16 border-4 border-white/20">
                    <AvatarFallback className="bg-white/20 text-white text-xl">
                      {booking.patient_details.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm opacity-90">Patient</p>
                    <p className="text-xl font-bold">{booking.patient_details.name}</p>
                  </div>
                </div>
              </div>
              <CardContent className="pt-6 space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <Mail className="w-5 h-5 text-blue-600 flex-shrink-0" />
                    <span className="text-sm break-all">{booking.patient_details.email}</span>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <Phone className="w-5 h-5 text-green-600 flex-shrink-0" />
                    <span className="text-sm">{booking.patient_details.phone}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Session Progress Card */}
            <Card className="shadow-lg border-0">
              <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50">
                <CardTitle className="flex items-center gap-2 text-green-800">
                  <Calendar className="w-5 h-5" />
                  Session Progress
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="text-center mb-4">
                  <div className="text-4xl font-bold text-green-600 mb-2">
                    {booking.progressPercentage}%
                  </div>
                  <p className="text-sm text-gray-600">
                    {booking.completedSessionsCount} of {booking.no_of_session_book} sessions completed
                  </p>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div 
                    className="bg-gradient-to-r from-green-500 to-emerald-500 h-3 rounded-full transition-all"
                    style={{ width: `${booking.progressPercentage}%` }}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Treatment Info Card */}

            {booking.treatment_id && (
   <Card className="shadow-lg border-0">
              <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50">
                <CardTitle className="flex items-center gap-2 text-purple-800">
                  <Stethoscope className="w-5 h-5" />
                  Treatment
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <h3 className="font-bold text-lg mb-2">{booking.treatment_id.service_name}</h3>
                <p className="text-sm text-gray-600 mb-4">{booking.treatment_id.service_small_desc}</p>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Per Session:</span>
                  <div className="flex items-center gap-2">
                    {booking.treatment_id.service_per_session_discount_percentage > 0 && (
                      <span className="line-through text-gray-400">
                        ₹{booking.treatment_id.service_per_session_price}
                      </span>
                    )}
                    <span className="font-bold text-green-600">
                      ₹{booking.treatment_id.service_per_session_discount_price}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
            )}
         

            {/* Action Buttons */}
            <div className="space-y-3 ">
              <Link href={`/pages/reschedule-booking/${booking?.treatment_id?.service_slug}/${booking?._id}`}>
                <Button
                  className="w-full bg-gradient-to-r mb-2 from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700"
                  size="lg"
                >
                  <Timer className="w-5 h-5 mr-2" />
                  Reschedule Booking
                </Button>
              </Link>
              
              <Button 
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                size="lg"
                onClick={handlePrint}
              >
                <Printer className="w-5 h-5 mr-2" />
                Print Receipt
              </Button>
              
              <Button 
                variant="outline" 
                className="w-full border-2 hover:bg-gray-50"
                size="lg"
                asChild
              >
                <a 
                  href={booking.session_booking_for_clinic.clinic_map} 
                  target="_blank" 
                  rel="noopener noreferrer"
                >
                  <MapPin className="w-5 h-5 mr-2" />
                  Get Directions
                  <ExternalLink className="w-4 h-4 ml-2" />
                </a>
              </Button>
            </div>
          </div>

          {/* Right Column - Clinic, Doctor & Sessions */}
          <div className="lg:col-span-2 space-y-6">
            {/* Clinic & Doctor Info */}
            <Card className="shadow-lg border-0">
              <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50">
                <CardTitle className="flex items-center gap-2 text-purple-800">
                  <Building2 className="w-6 h-6" />
                  Appointment Details
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6 space-y-6">
                {/* Doctor Info */}
                <div className="flex items-start gap-4 p-4 bg-blue-50 rounded-xl border-l-4 border-blue-600">
                  <div className="p-3 bg-blue-600 rounded-full">
                    <Stethoscope className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-600 mb-1">Consulting Doctor</p>
                    <p className="text-2xl font-bold text-gray-900">
                      Dr. {booking.session_booking_for_doctor.doctor_name}
                    </p>
                  </div>
                </div>

                <Separator />

                {/* Clinic Info */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-bold text-gray-900">
                      {booking.session_booking_for_clinic.clinic_name}
                    </h3>
                    {booking.session_booking_for_clinic.clinic_ratings && (
                      <Badge variant="secondary" className="text-base">
                        ⭐ {booking.session_booking_for_clinic.clinic_ratings}
                      </Badge>
                    )}
                  </div>

                  <div className="grid gap-3">
                    <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                      <MapPin className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-gray-700">
                        {booking.session_booking_for_clinic.clinic_contact_details.clinic_address}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <Phone className="w-5 h-5 text-green-600 flex-shrink-0" />
                      <span className="text-sm">
                        {booking.session_booking_for_clinic.clinic_contact_details.phone_numbers[0]}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <Mail className="w-5 h-5 text-blue-600 flex-shrink-0" />
                      <span className="text-sm">
                        {booking.session_booking_for_clinic.clinic_contact_details.email}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <Clock className="w-5 h-5 text-purple-600 flex-shrink-0" />
                      <span className="text-sm">
                        {booking.session_booking_for_clinic.clinic_timings.open_time} - 
                        {booking.session_booking_for_clinic.clinic_timings.close_time} 
                        <span className="text-gray-500 ml-2">
                          (Closed on {booking.session_booking_for_clinic.clinic_timings.off_day})
                        </span>
                      </span>
                    </div>
                  </div>

                  {/* Clinic Images */}
                  {booking.session_booking_for_clinic.clinic_images.length > 0 && (
                    <div className="mt-4 grid grid-cols-2 gap-3">
                      {booking.session_booking_for_clinic.clinic_images.slice(0, 2).map((img) => (
                        <img
                          key={img._id}
                          src={img.url}
                          alt="Clinic"
                          className="rounded-xl w-full h-48 object-cover border-2 border-gray-100 shadow-md"
                        />
                      ))}
                    </div>
                  )}

                  {/* Special Note */}
                  {booking.session_booking_for_clinic.any_special_note && (
                    <div className="mt-4 p-4 bg-amber-50 border-l-4 border-amber-500 rounded-lg">
                      <div className="flex gap-2">
                        <Info className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="font-semibold text-amber-900 mb-1">Important Note</p>
                          <p className="text-sm text-amber-800">
                            {booking.session_booking_for_clinic.any_special_note}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Add-ons Card (if any) */}
            {booking.addOns && booking.addOns.length > 0 && (
              <Card className="shadow-lg border-0">
                <CardHeader className="bg-gradient-to-r from-amber-50 to-yellow-50">
                  <CardTitle className="flex items-center gap-2 text-amber-800">
                    <Package className="w-6 h-6" />
                    Additional Services
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="space-y-3">
                    {booking.addOns.map((addon) => (
                      <div 
                        key={addon._id}
                        className="flex items-center justify-between p-4 bg-amber-50 rounded-lg border border-amber-200"
                      >
                        <div>
                          <p className="font-semibold text-gray-900">{addon.title}</p>
                          <p className="text-xs text-gray-500">
                            Added on {formatDate(addon.addedAt)}
                          </p>
                        </div>
                        <p className="text-lg font-bold text-amber-700">₹{addon.price.toLocaleString()}</p>
                      </div>
                    ))}
                    <div className="flex justify-between items-center pt-3 border-t border-amber-200">
                      <span className="font-semibold text-gray-700">Add-ons Total:</span>
                      <span className="text-xl font-bold text-amber-600">
                        ₹{booking.addOnsTotal.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Session Schedule */}
            <Card className="shadow-lg border-0">
              <CardHeader className="bg-gradient-to-r from-indigo-50 to-blue-50">
                <CardTitle className="flex items-center gap-2 text-indigo-800">
                  <Calendar className="w-6 h-6" />
                  Session Schedule
                </CardTitle>
                <CardDescription className="text-base">
                  {booking.no_of_session_book} session(s) booked
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  {booking.SessionDates.map((session) => (
                    <div
                      key={session._id}
                      className={`p-5 rounded-xl border-2 transition-all ${
                        session.status === "Pending" 
                          ? "bg-gradient-to-r from-amber-50 to-orange-50 border-amber-300 shadow-md" 
                          : session.status === "Completed"
                          ? "bg-gradient-to-r from-green-50 to-emerald-50 border-green-300"
                          : "bg-gray-50 border-gray-200"
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-3">
                            <span className="font-bold text-lg">Session {session.sessionNumber}</span>
                            <Badge 
                              variant={session.status === "Pending" ? "secondary" : "default"}
                              className="text-sm"
                            >
                              {session.status}
                            </Badge>
                          </div>
                          <div className="flex flex-col sm:flex-row gap-4 text-sm text-gray-700">
                            <div className="flex items-center gap-2">
                              <Calendar className="w-4 h-4 text-blue-600" />
                              <span className="font-medium">{formatDate(session.date)}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Clock className="w-4 h-4 text-purple-600" />
                              <span className="font-medium">{formatTime(session.time)}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Next Session Highlight */}
                {booking.nextSession && (
                  <div className="mt-6 p-5 bg-gradient-to-r from-green-100 to-emerald-100 border-2 border-green-400 rounded-xl shadow-md">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-green-600 rounded-full">
                        <Calendar className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <p className="font-bold text-green-900 mb-1">Next Appointment</p>
                        <p className="text-green-800">
                          {formatDate(booking.nextSession.date)} at {formatTime(booking.nextSession.time)}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Payment Summary */}
            <Card className="shadow-lg border-0">
              <CardHeader className="bg-gradient-to-r from-emerald-50 to-green-50">
                <CardTitle className="flex items-center gap-2 text-emerald-800">
                  <IndianRupee className="w-6 h-6" />
                  Payment Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <span className="text-gray-700">Subtotal ({booking.no_of_session_book} sessions × ₹{booking.amountPerSession})</span>
                    <span className="font-semibold">₹{booking.payment_id.payment_details.subtotal}</span>
                  </div>
                  
                  {booking.addOnsTotal > 0 && (
                    <div className="flex justify-between items-center p-3 bg-amber-50 rounded-lg">
                      <span className="text-gray-700">Add-ons</span>
                      <span className="font-semibold text-amber-700">₹{booking.addOnsTotal.toLocaleString()}</span>
                    </div>
                  )}
                  
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <span className="text-gray-700">Tax & Fees</span>
                    <span className="font-semibold">₹{booking.payment_id.payment_details.tax}</span>
                  </div>
                  
                  {booking.payment_id.payment_details.creditCardFee !== "0" && (
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <span className="text-gray-700">Credit Card Fee</span>
                      <span className="font-semibold">₹{booking.payment_id.payment_details.creditCardFee}</span>
                    </div>
                  )}
                  
                  <Separator />
                  
                  <div className="flex justify-between items-center p-4 bg-gradient-to-r from-green-100 to-emerald-100 rounded-xl">
                    <span className="text-lg font-bold text-green-900">Total Paid</span>
                    <span className="text-2xl font-bold text-green-600">
                      ₹{booking.payment_id.payment_details.total}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm text-gray-600 p-3 bg-blue-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <CreditCard className="w-4 h-4" />
                      <span>Payment Method</span>
                    </div>
                    <span className="font-medium capitalize">{booking.payment_id.paymentMethod}</span>
                  </div>
                  
                  {booking.payment_id.razorpay_payment_id && (
                    <div className="text-xs text-gray-500 text-center font-mono">
                      Payment ID: {booking.payment_id.razorpay_payment_id}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

         <div className="hidden">
          <div ref={receiptRef}>
            <div className="receipt-container">
              <div className="header">
                <h1>APPOINTMENT RECEIPT</h1>
                <p style={{ fontSize: '14px', marginTop: '10px' }}>
                  Booking Number: {booking.bookingNumber}
                </p>
                <p style={{ fontSize: '12px', color: '#666', marginTop: '5px' }}>
                  Booked on: {formatDate(booking.createdAt)}
                </p>
              </div>

              <div className="section">
                <div className="section-title">Patient Information</div>
                <div className="info-row">
                  <span className="info-label">Name:</span>
                  <span>{booking.patient_details.name}</span>
                </div>
                <div className="info-row">
                  <span className="info-label">Email:</span>
                  <span>{booking.patient_details.email}</span>
                </div>
                <div className="info-row">
                  <span className="info-label">Phone:</span>
                  <span>{booking.patient_details.phone}</span>
                </div>
              </div>

             {booking?.treatment_id && (
               <div className="section">
                <div className="section-title">Treatment Information</div>
                <div className="info-row">
                  <span className="info-label">Service:</span>
                  <span>{booking.treatment_id.service_name}</span>
                </div>
                <div className="info-row">
                  <span className="info-label">Description:</span>
                  <span>{booking.treatment_id.service_small_desc}</span>
                </div>
              </div>
             )}

              <div className="section">
                <div className="section-title">Appointment Details</div>
                <div className="info-row">
                  <span className="info-label">Doctor:</span>
                  <span>Dr. {booking.session_booking_for_doctor.doctor_name}</span>
                </div>
                <div className="info-row">
                  <span className="info-label">Clinic:</span>
                  <span>{booking.session_booking_for_clinic.clinic_name}</span>
                </div>
                <div className="info-row">
                  <span className="info-label">Address:</span>
                  <span>{booking.session_booking_for_clinic.clinic_contact_details.clinic_address}</span>
                </div>
                <div className="info-row">
                  <span className="info-label">Contact:</span>
                  <span>{booking.session_booking_for_clinic.clinic_contact_details.phone_numbers[0]}</span>
                </div>
                <div className="info-row">
                  <span className="info-label">Status:</span>
                  <span>{booking.session_status}</span>
                </div>
              </div>

              <div className="section">
                <div className="section-title">Session Schedule</div>
                {booking.SessionDates.map((session) => (
                  <div key={session._id} className="session-item">
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <strong>Session {session.sessionNumber}</strong>
                      <span style={{ 
                        background: session.status === 'Pending' ? '#fef3c7' : '#dcfce7',
                        padding: '2px 8px',
                        borderRadius: '4px',
                        fontSize: '12px'
                      }}>
                        {session.status}
                      </span>
                    </div>
                    <div style={{ fontSize: '14px', color: '#555' }}>
                      📅 {formatDate(session.date)} | 🕐 {formatTime(session.time)}
                    </div>
                  </div>
                ))}
              </div>

              {booking.addOns && booking.addOns.length > 0 && (
                <div className="section">
                  <div className="section-title">Additional Services</div>
                  {booking.addOns.map((addon) => (
                    <div key={addon._id} className="addon-item">
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>{addon.title}</span>
                        <strong>₹{addon.price.toLocaleString()}</strong>
                      </div>
                    </div>
                  ))}
                  <div className="info-row" style={{ marginTop: '10px' }}>
                    <span className="info-label">Add-ons Total:</span>
                    <strong>₹{booking.addOnsTotal.toLocaleString()}</strong>
                  </div>
                </div>
              )}

              <div className="section">
                <div className="section-title">Payment Details</div>
                <div className="total-section">
                  <div className="total-row">
                    <span>Subtotal ({booking.no_of_session_book} sessions):</span>
                    <span>₹{booking.payment_id.payment_details.subtotal}</span>
                  </div>
                  {booking.addOnsTotal > 0 && (
                    <div className="total-row">
                      <span>Add-ons:</span>
                      <span>₹{booking.addOnsTotal.toLocaleString()}</span>
                    </div>
                  )}
                  <div className="total-row">
                    <span>Tax & Fees:</span>
                    <span>₹{booking.payment_id.payment_details.tax}</span>
                  </div>
                  {booking.payment_id.payment_details.creditCardFee !== "0" && (
                    <div className="total-row">
                      <span>Credit Card Fee:</span>
                      <span>₹{booking.payment_id.payment_details.creditCardFee}</span>
                    </div>
                  )}
                  <div className="total-row total-final">
                    <span>Total Paid:</span>
                    <span>₹{booking.payment_id.payment_details.total}</span>
                  </div>
                  <div style={{ marginTop: '10px', fontSize: '12px', textAlign: 'center', color: '#666' }}>
                    Payment Method: {booking.payment_id.paymentMethod.toUpperCase()}
                  </div>
                  {booking.payment_id.razorpay_payment_id && (
                    <div style={{ marginTop: '5px', fontSize: '11px', textAlign: 'center', color: '#999' }}>
                      Transaction ID: {booking.payment_id.razorpay_payment_id}
                    </div>
                  )}
                </div>
              </div>

              <div style={{ 
                marginTop: '40px', 
                paddingTop: '20px', 
                borderTop: '1px solid #ddd',
                textAlign: 'center',
                fontSize: '12px',
                color: '#666'
              }}>
                <p>Thank you for choosing our services!</p>
                <p style={{ marginTop: '10px' }}>For any queries, please contact the clinic.</p>
                {!booking.cancellation.refundEligible && (
                  <p style={{ marginTop: '10px', color: '#dc2626', fontWeight: 'bold' }}>
                    ⚠️ This booking is non-refundable
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}