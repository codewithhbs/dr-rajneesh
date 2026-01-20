"use client";

import React, { useState, useEffect, useCallback } from "react";
import { format } from "date-fns";
import Cookies from "js-cookie";
import axios from "axios";
import { Calendar } from "react-date-range";
import "react-date-range/dist/styles.css";
import "react-date-range/dist/theme/default.css";
import Swal from "sweetalert2";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  AlertCircle,
  CalendarIcon,
  Clock,
  CheckCircle2,
  Loader2,
  MapPin,
  User,
  Phone,
  Mail,
  CreditCard,
  FileText,
  ArrowRight,
  RefreshCw,
} from "lucide-react";

import { API_ENDPOINT } from "@/constant/url";
import { useSettings } from "@/hooks/use-settings";
import { useGetBookingById } from "@/hooks/booking-info";

interface Session {
  sessionNumber: number;
  date: string;
  time: string;
  status: string;
  _id: string;
}

interface BookingData {
  _id: string;
  bookingNumber: string;
  treatment_id: {
    _id: string;
    service_name: string;
    service_small_desc?: string;
  };
  session_booking_for_clinic: {
    _id: string;
    clinic_name: string;
    clinic_timings: { open_time: string; close_time: string; off_day: string };
    clinic_contact_details?: {
      phone_numbers?: string[];
      email?: string;
      clinic_address?: string;
    };
  };
  SessionDates: Session[];
  no_of_session_book: number;
  patient_details?: {
    name?: string;
    email?: string;
    phone?: string;
  };
  totalAmount?: number;
  nextSession?: Session;
  progressPercentage?: number;
  completedSessionsCount?: number;
}

interface Props {
  slug: string;
  bookingId: string;
}

// Loading Skeleton Component
const LoadingSkeleton = () => (
  <div className="max-w-6xl mx-auto mt-10 px-4">
    <Card className="shadow-2xl border-0 bg-gradient-to-br from-white to-gray-50">
      <CardHeader className="space-y-4">
        <div className="h-8 bg-gray-200 rounded-lg w-1/3 animate-pulse" />
        <div className="h-4 bg-gray-200 rounded w-2/3 animate-pulse" />
      </CardHeader>
      <CardContent className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-32 bg-gray-200 rounded-xl animate-pulse"
            />
          ))}
        </div>
        <div className="h-64 bg-gray-200 rounded-xl animate-pulse" />
      </CardContent>
    </Card>
  </div>
);

const RescheduleBooking: React.FC<Props> = ({ slug, bookingId }) => {
  const { settings, loading: settingsLoading } = useSettings();
  const {
    data: booking,
    isLoading: bookingLoading,
    error,
    refetch,
  } = useGetBookingById({ id: bookingId });

  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [reason, setReason] = useState<string>("");

  const [availability, setAvailability] = useState<{
    available: boolean;
    message?: string;
  } | null>(null);
  const [checkingAvail, setCheckingAvail] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const generateTimeSlots = useCallback(() => {
    if (!booking?.session_booking_for_clinic?.clinic_timings) return [];

    const { open_time = "10:00", close_time = "20:00" } =
      booking.session_booking_for_clinic.clinic_timings;
    const slots_per_hour = settings?.booking_config?.slots_per_hour || 2;

    const slots: string[] = [];
    const minutesPerSlot = 60 / slots_per_hour;

    let current = timeToMinutes(open_time);
    const end = timeToMinutes(close_time);

    while (current < end) {
      const h = Math.floor(current / 60)
        .toString()
        .padStart(2, "0");
      const m = (current % 60).toString().padStart(2, "0");
      slots.push(`${h}:${m}`);
      current += minutesPerSlot;
    }
    return slots;
  }, [booking, settings]);

  const timeToMinutes = (time: string): number => {
    const [h, m] = time.split(":").map(Number);
    return h * 60 + m;
  };

  const checkAvailability = useCallback(async () => {
    if (!selectedDate || !selectedTime || !booking) return;

    setCheckingAvail(true);
    setAvailability(null);

    const token = Cookies.get("token");
    const formattedDate = format(selectedDate, "yyyy-MM-dd");

    try {
      const res = await axios.post(
        `${API_ENDPOINT}/user/bookings/availability`,
        {
          date: formattedDate,
          time: selectedTime,
          clinic_id: booking.session_booking_for_clinic._id,
          service_id: booking.treatment_id._id,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      const avail = res.data?.data?.available ?? true;
      setAvailability({ available: avail, message: res.data?.message });
    } catch (err: any) {
      setAvailability({
        available: false,
        message: err.response?.data?.message || "This slot is not available",
      });
    } finally {
      setCheckingAvail(false);
    }
  }, [selectedDate, selectedTime, booking]);

  useEffect(() => {
    if (selectedDate && selectedTime) {
      checkAvailability();
    }
  }, [selectedDate, selectedTime, checkAvailability]);

const handleReschedule = async () => {
  if (!selectedSession || !selectedDate || !selectedTime) {
    Swal.fire({
      icon: "warning",
      title: "Missing Details",
      text: "Please select a new date and time.",
    });
    return;
  }

  if (!availability?.available) {
    Swal.fire({
      icon: "error",
      title: "Slot Unavailable",
      text: availability?.message || "Selected slot is unavailable.",
    });
    return;
  }

  // ✅ Confirmation before rescheduling
  const confirm = await Swal.fire({
    icon: "question",
    title: "Confirm Reschedule",
    text: "Are you sure you want to reschedule this session?",
    showCancelButton: true,
    confirmButtonText: "Yes, reschedule",
    cancelButtonText: "Cancel",
  });

  if (!confirm.isConfirmed) return;

  setSubmitting(true);

  const token = Cookies.get("token");
  const formattedDate = format(selectedDate, "yyyy-MM-dd");

  try {
    await axios.post(
      `${API_ENDPOINT}/booking/my-bookings/reschedule`,
      {
        bookingId,
        sessionNumber: selectedSession.sessionNumber,
        newDate: formattedDate,
        newTime: selectedTime,
        reason: reason.trim() || "Patient requested reschedule",
      },
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    Swal.fire({
      icon: "success",
      title: "Rescheduled!",
      text: "Session successfully rescheduled.",
      timer: 3000,
      showConfirmButton: false,
    });

    // Reset state
    setSelectedSession(null);
    setSelectedDate(null);
    setSelectedTime("");
    setReason("");
    setAvailability(null);
    refetch();
  } catch (err: any) {
    Swal.fire({
      icon: "error",
      title: "Reschedule Failed",
      text:
        err.response?.data?.message ||
        "Failed to reschedule. Please try again.",
    });
  } finally {
    setSubmitting(false);
  }
};

  const timeSlots = generateTimeSlots();

  if (bookingLoading || settingsLoading) {
    return <LoadingSkeleton />;
  }

  if (error || !booking) {
    return (
      <div className="max-w-6xl mx-auto mt-10 px-4">
        <Card className="shadow-2xl border-0">
          <CardContent className="p-12 text-center">
            <div className="flex flex-col items-center gap-4">
              <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center">
                <AlertCircle className="h-10 w-10 text-red-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900">
                Booking Not Found
              </h3>
              <p className="text-gray-600 max-w-md">
                We couldn't load the booking details. Please check the booking
                ID and try again.
              </p>
              <Button className="mt-4" onClick={() => window.location.reload()}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Retry
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const reschedulableSessions = booking.SessionDates.filter(
    (s) => s.status === "Pending" || s.status === "Confirmed",
  );

  if (reschedulableSessions.length === 0) {
    return (
      <div className="max-w-6xl mx-auto mt-10 px-4">
        <Card className="shadow-2xl border-0">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
            <CardTitle className="text-2xl">Reschedule Session</CardTitle>
            <CardDescription className="text-base">
              {booking.treatment_id.service_name}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-12 text-center">
            <div className="flex flex-col items-center gap-4">
              <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center">
                <AlertCircle className="h-10 w-10 text-amber-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900">
                No Sessions Available
              </h3>
              <p className="text-gray-600 max-w-md">
                All sessions in this booking have been completed or cancelled.
                No pending sessions available for rescheduling.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Pending":
        return "bg-amber-100 text-amber-800 border-amber-200";
      case "Confirmed":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "Completed":
        return "bg-green-100 text-green-800 border-green-200";
      case "Cancelled":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  return (
    <div className="max-w-6xl mx-auto mt-10 px-4 pb-10">
      {/* Header Card with Booking Details */}
      <Card className="shadow-2xl border-0 mb-6 overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 p-8 text-white">
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-bold">Reschedule Appointment</h1>
                <Badge className="bg-white/20 text-white border-white/30 text-sm px-3 py-1">
                  #{booking.bookingNumber}
                </Badge>
              </div>
              <p className="text-blue-100 text-lg">
                {booking.treatment_id.service_name}
              </p>
            </div>
            <div className="text-right">
              <div className="text-sm text-blue-100">Total Sessions</div>
              <div className="text-4xl font-bold">
                {booking.no_of_session_book}
              </div>
            </div>
          </div>
        </div>

        <CardContent className="p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                <MapPin className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <div className="text-sm text-gray-500 font-medium">Clinic</div>
                <div className="font-semibold text-gray-900">
                  {booking.session_booking_for_clinic.clinic_name}
                </div>
              </div>
            </div>

            {booking.patient_details?.name && (
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0">
                  <User className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <div className="text-sm text-gray-500 font-medium">
                    Patient
                  </div>
                  <div className="font-semibold text-gray-900">
                    {booking.patient_details.name}
                  </div>
                </div>
              </div>
            )}

            {booking.patient_details?.phone && (
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center flex-shrink-0">
                  <Phone className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <div className="text-sm text-gray-500 font-medium">
                    Contact
                  </div>
                  <div className="font-semibold text-gray-900">
                    {booking.patient_details.phone}
                  </div>
                </div>
              </div>
            )}

            {booking.totalAmount && (
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center flex-shrink-0">
                  <CreditCard className="w-5 h-5 text-indigo-600" />
                </div>
                <div>
                  <div className="text-sm text-gray-500 font-medium">
                    Total Amount
                  </div>
                  <div className="font-semibold text-gray-900">
                    ₹{booking.totalAmount.toLocaleString()}
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Main Reschedule Card */}
      <Card className="shadow-2xl border-0">
        <CardContent className="p-8 space-y-8">
          {message && (
            <Alert
              variant={message.type === "success" ? "default" : "destructive"}
              className={
                message.type === "success"
                  ? "bg-green-50 border-green-200 text-green-900"
                  : "bg-red-50 border-red-200"
              }
            >
              {message.type === "success" ? (
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              ) : (
                <AlertCircle className="h-5 w-5" />
              )}
              <AlertDescription className="font-medium">
                {message.text}
              </AlertDescription>
            </Alert>
          )}

          {/* Session Selection */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold">
                1
              </div>
              <Label className="text-xl font-bold text-gray-900">
                Select Session to Reschedule
              </Label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {booking.SessionDates.map((session) => {
                const canReschedule = ["Pending", "Confirmed"].includes(
                  session.status,
                );
                const isSelected = selectedSession?._id === session._id;

                return (
                  <div
                    key={session._id}
                    onClick={() => canReschedule && setSelectedSession(session)}
                    className={`group relative p-6 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
                      isSelected
                        ? "border-blue-600 bg-blue-50 shadow-lg scale-105"
                        : canReschedule
                          ? "border-gray-200 hover:border-blue-300 hover:shadow-md hover:scale-102"
                          : "border-gray-200 bg-gray-50 opacity-60 cursor-not-allowed"
                    }`}
                  >
                    {isSelected && (
                      <div className="absolute -top-2 -right-2 w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                        <CheckCircle2 className="w-5 h-5 text-white" />
                      </div>
                    )}

                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-lg font-bold text-gray-900">
                          Session {session.sessionNumber}
                        </span>
                        <Badge
                          className={`${getStatusColor(session.status)} border`}
                        >
                          {session.status}
                        </Badge>
                      </div>

                      <div className="flex items-center gap-2 text-gray-600">
                        <CalendarIcon className="w-4 h-4" />
                        <span className="font-medium">
                          {format(new Date(session.date), "EEEE, dd MMMM yyyy")}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-gray-600">
                        <Clock className="w-4 h-4" />
                        <span className="font-medium">{session.time}</span>
                      </div>

                      {!canReschedule && (
                        <p className="text-xs text-red-600 font-medium mt-2">
                          Cannot be rescheduled
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Date & Time Selection */}
          {selectedSession && (
            <>
              <div className="h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent" />

              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold">
                    2
                  </div>
                  <Label className="text-xl font-bold text-gray-900">
                    Choose New Date
                  </Label>
                </div>

                <div className="flex justify-center p-6 bg-gray-50 rounded-xl">
                  <Calendar
                    date={selectedDate || undefined}
                    onChange={(date) => {
                      setSelectedDate(date as Date);
                      setSelectedTime("");
                      setAvailability(null);
                    }}
                    minDate={new Date()}
                    className="border-0 shadow-lg rounded-lg overflow-hidden"
                  />
                </div>
              </div>

              {selectedDate && (
                <>
                  <div className="h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent" />

                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold">
                        3
                      </div>
                      <div>
                        <Label className="text-xl font-bold text-gray-900">
                          Choose Time Slot
                        </Label>
                        <p className="text-sm text-gray-600 mt-1">
                          {format(selectedDate, "EEEE, dd MMMM yyyy")}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
                      {timeSlots.map((slot) => {
                        const isSelected = selectedTime === slot;
                        return (
                          <Button
                            key={slot}
                            variant={isSelected ? "default" : "outline"}
                            onClick={() => setSelectedTime(slot)}
                            className={`h-14 text-base font-semibold transition-all ${
                              isSelected
                                ? "bg-blue-600 hover:bg-blue-700 shadow-lg scale-105"
                                : "hover:border-blue-400 hover:bg-blue-50"
                            }`}
                          >
                            {slot}
                          </Button>
                        );
                      })}
                    </div>

                    {checkingAvail && (
                      <div className="flex items-center justify-center gap-3 p-4 bg-blue-50 rounded-lg">
                        <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                        <span className="text-blue-900 font-medium">
                          Checking availability...
                        </span>
                      </div>
                    )}

                    {availability &&
                      !availability.available &&
                      !checkingAvail && (
                        <Alert
                          variant="destructive"
                          className="bg-red-50 border-red-200"
                        >
                          <AlertCircle className="h-5 w-5 text-red-600" />
                          <AlertDescription className="text-red-900 font-medium">
                            {availability.message}
                          </AlertDescription>
                        </Alert>
                      )}

                    {availability?.available &&
                      selectedTime &&
                      !checkingAvail && (
                        <Alert className="bg-green-50 border-green-200">
                          <CheckCircle2 className="h-5 w-5 text-green-600" />
                          <AlertDescription className="text-green-900 font-medium">
                            Perfect! This time slot is available for booking.
                          </AlertDescription>
                        </Alert>
                      )}
                  </div>

                  <div className="h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent" />

                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold">
                        4
                      </div>
                      <Label className="text-xl font-bold text-gray-900">
                        Reason for Rescheduling{" "}
                        <span className="text-gray-400 font-normal">
                          (Optional)
                        </span>
                      </Label>
                    </div>

                    <Textarea
                      placeholder="Please let us know why you need to reschedule this appointment..."
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      rows={4}
                      className="resize-none text-base border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>

                  <Button
                    size="lg"
                    className="w-full h-14 text-lg font-bold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg hover:shadow-xl transition-all"
                    onClick={handleReschedule}
                    disabled={
                      submitting ||
                      !selectedTime ||
                      checkingAvail ||
                      !availability?.available
                    }
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Rescheduling...
                      </>
                    ) : (
                      <>
                        Confirm Reschedule
                        <ArrowRight className="w-5 h-5 ml-2" />
                      </>
                    )}
                  </Button>
                </>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default RescheduleBooking;
