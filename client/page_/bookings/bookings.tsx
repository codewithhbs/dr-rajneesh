"use client";

import { useGetAllClinic } from "@/hooks/common";
import { useServiceBySlug } from "@/hooks/use-service";
import { useSettings } from "@/hooks/use-settings";
import { useMemo, useState, useEffect, useCallback } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
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
  Clock, MapPin, User, CreditCard, CalendarIcon, Sparkles,
  Heart, Shield, Phone, Mail, UserCheck, CheckCircle,
  FileDigit, Award, Star, Lock, AlertCircle, XCircle,
} from "lucide-react";
import { API_ENDPOINT } from "@/constant/url";
import Cookies from "js-cookie";
import axios from "axios";
import { useBookingForm } from "@/hooks/use-booking-form";
import type { Clinic, BookingFormData, BookingAvailability, PricingBreakdown } from "@/types/booking";
import { PaymentStatusModal } from "@/components/models/payment-status-modal";
import Image from "next/image";
import { drImageurl } from "@/constant/Images";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

// ─── Types ───────────────────────────────────────────────────────────────────

interface EnhancedBookingsProps {
  searchParams: unknown;
}

interface Booking {
  SessionDates: { date: string; time: string; status: string }[];
}

export enum BookingStep {
  SELECTION = 1,
  CONFIRMATION = 2,
  PAYMENT = 3,
  SUCCESS = 4,
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function timeToMinutes(timeString: string): number {
  const [hours, minutes] = timeString.split(":").map(Number);
  return hours * 60 + minutes;
}

function generateTimeSlots(startTime: string, endTime: string, slotsPerHour: number): string[] {
  if (!slotsPerHour) return [];
  const slots: string[] = [];
  const minutesPerSlot = 60 / slotsPerHour;
  let current = timeToMinutes(startTime);
  const end = timeToMinutes(endTime);
  while (current < end) {
    const h = Math.floor(current / 60);
    const m = current % 60;
    slots.push(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`);
    current += minutesPerSlot;
  }
  return slots;
}

function getBookedSlotsForDate(bookings: Booking[], date: Date): string[] {
  const dateStr = date.toISOString().split("T")[0];
  return bookings.flatMap((b) =>
    b.SessionDates.filter((s) => s.date.split("T")[0] === dateStr).map((s) => s.time)
  );
}

// ─── Step Indicator ──────────────────────────────────────────────────────────

const steps = ["Details", "Schedule", "Payment", "Confirm"];

function StepIndicator({ currentStep }: { currentStep: number }) {
  return (
    <div className="flex items-center justify-center gap-0 mb-10">
      {steps.map((label, i) => {
        const idx = i + 1;
        const done = currentStep > idx;
        const active = currentStep === idx;
        return (
          <div key={label} className="flex items-center">
            <div className="flex flex-col items-center gap-1">
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-all duration-300 ${
                  done
                    ? "bg-emerald-500 border-emerald-500 text-white shadow-lg shadow-emerald-200"
                    : active
                    ? "bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-200 scale-110"
                    : "bg-white border-slate-200 text-slate-400"
                }`}
              >
                {done ? <CheckCircle className="w-4 h-4" /> : idx}
              </div>
              <span
                className={`text-xs font-semibold tracking-wide ${
                  active ? "text-blue-600" : done ? "text-emerald-500" : "text-slate-400"
                }`}
              >
                {label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div
                className={`w-16 h-0.5 mb-5 mx-1 transition-all duration-500 ${
                  currentStep > idx ? "bg-emerald-400" : "bg-slate-200"
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Section Header ──────────────────────────────────────────────────────────

function SectionHeader({ icon: Icon, title, subtitle }: { icon: React.ElementType; title: string; subtitle?: string }) {
  return (
    <div className="flex items-center gap-4 mb-6">
      <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-200 flex-shrink-0">
        <Icon className="w-5 h-5 text-white" />
      </div>
      <div>
        <h2 className="text-lg font-bold text-slate-800 leading-tight">{title}</h2>
        {subtitle && <p className="text-sm text-slate-500 mt-0.5">{subtitle}</p>}
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

const EnhancedBookings = ({ searchParams }: EnhancedBookingsProps) => {
  const router = useRouter();

  const parsedParams = useMemo(() => {
    try {
      return typeof searchParams === "string" ? JSON.parse(searchParams) : (searchParams as Record<string, string>) || {};
    } catch {
      return {};
    }
  }, [searchParams]);

  const sessions = parseInt(String(parsedParams.sessions)) || 1;
  const service = parsedParams.service || "N/A";

  const { service: dbService, loading: serviceLoading } = useServiceBySlug(service);
  const { settings, loading: settingLoading } = useSettings();
  const { data: clinics, loading: isClinicLoading } = useGetAllClinic();

  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState("");
  const [selectedClinic, setSelectedClinic] = useState<Clinic | null>(null);
  const [paymentMethod, setPaymentMethod] = useState("pay_at_clinic");
  const [isProcessing, setIsProcessing] = useState(false);
  const [bookingStep, setBookingStep] = useState<BookingStep>(BookingStep.SELECTION);
  const [bookingsFromAPI, setBookingsFromAPI] = useState<Booking[]>([]);
  const [bookedSlots, setBookedSlots] = useState<string[]>([]);
  const [isCheckingAvailability, setIsCheckingAvailability] = useState(false);
  const [paymentModal, setPaymentModal] = useState<{
    isOpen: boolean;
    status: "success" | "failed" | "processing";
    error?: string;
  }>({ isOpen: false, status: "processing" });

  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  // Fetch all bookings
  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const res = await axios.get(`${API_ENDPOINT}/admin-bookings`);
        setBookingsFromAPI(res.data.data || []);
      } catch {
        console.warn("Could not fetch bookings");
      }
    };
    fetchBookings();
  }, []);

  // Update booked slots when date changes
  useEffect(() => {
    if (selectedDate) {
      setBookedSlots(getBookedSlotsForDate(bookingsFromAPI, selectedDate));
    }
  }, [selectedDate, bookingsFromAPI]);

  // Auto-select first available clinic
  useEffect(() => {
    if (clinics && clinics.length > 0 && !selectedClinic) {
      const first = clinics.find((c) => {
        if (!c.BookingAvailabeAt) return false;
        const start = new Date(c.BookingAvailabeAt.start_date);
        const end = new Date(c.BookingAvailabeAt.end_date);
        end.setHours(23, 59, 59, 999);
        return today >= start && today <= end;
      });
      if (first) {
        setSelectedClinic(first);
        const start = new Date(first.BookingAvailabeAt.start_date);
        setSelectedDate(start > today ? start : new Date(today));
      } else {
        setSelectedDate(new Date(today));
      }
    }
  }, [clinics, selectedClinic, today]);

  // Sync date when clinic changes
  useEffect(() => {
    if (selectedClinic?.BookingAvailabeAt) {
      const start = new Date(selectedClinic.BookingAvailabeAt.start_date);
      const defaultDate = start > today ? start : new Date(today);
      if (!selectedDate || !isDateAvailable(selectedDate)) {
        setSelectedDate(defaultDate);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedClinic]);

  const isDateAvailable = useCallback(
    (date: Date) => {
      if (!selectedClinic?.BookingAvailabeAt) return true;
      const start = new Date(selectedClinic.BookingAvailabeAt.start_date);
      const end = new Date(selectedClinic.BookingAvailabeAt.end_date);
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
      return date >= start && date <= end;
    },
    [selectedClinic]
  );

  const calculatePricing = useCallback(
    (data: Partial<BookingFormData>): PricingBreakdown => {
      if (!dbService || !settings) return { subtotal: 0, tax: 0, creditCard: 0, total: 0 };
      const basePrice = dbService.service_per_session_discount_price || dbService.service_per_session_price;
      const subtotal = basePrice * sessions;
      const taxAmount = (subtotal * (settings.payment_config?.tax_percentage || 0)) / 100;
      const creditCardAmount =
        data.payment_method === "card"
          ? (subtotal * (settings.payment_config?.credit_card_fee || 0)) / 100
          : 0;
      return { subtotal, tax: taxAmount, creditCard: creditCardAmount, total: subtotal + taxAmount + creditCardAmount };
    },
    [dbService, settings, sessions]
  );

  const handleBookingSubmit = async () => {
    try {
      setIsProcessing(true);
      const token = Cookies.get("token");
      if (!token) { toast.error("Please login to continue"); return; }
      if (!selectedDate || !selectedTime || !selectedClinic || !dbService) {
        toast.error("Please complete all required fields");
        return;
      }

      const payload = {
        service_id: dbService._id,
        clinic_id: selectedClinic._id,
        date: format(selectedDate, "yyyy-MM-dd"),
        time: selectedTime,
        sessions,
        payment_method: paymentMethod,
        patient_details: {
          name: formData.patient_details?.name || "",
          email: formData.patient_details?.email || "",
          phone: formData.patient_details?.phone || "",
        },
      };

      const response = await axios.post(`${API_ENDPOINT}/user/bookings/sessions`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.data.success) throw new Error(response.data.message || "Booking failed");

      const { booking, gatewayData } = response.data.data || {};
      const bookingId = booking?.id || booking?._id;
      if (!bookingId) throw new Error("Booking ID not received");

      if (gatewayData?.method === "pay_at_clinic" || paymentMethod === "pay_at_clinic") {
        router.push(`/booking-success?bookingId=${bookingId}`);
        return;
      }
      if (gatewayData?.method === "phonepe" && gatewayData.redirect_url) {
        window.location.href = gatewayData.redirect_url;
        return;
      }
      router.push(`/booking-success?bookingId=${bookingId}`);
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } }; message?: string };
      toast.error(err?.response?.data?.message || err?.message || "Something went wrong. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const {
    formData, errors, isSubmitting, updateField, handleSubmit, getFieldError, pricing, isValid,
  } = useBookingForm({ onSubmit: handleBookingSubmit, calculatePricing });

  // Sync form fields
  useEffect(() => { if (dbService?._id && !formData.service_id) updateField("service_id", dbService._id); }, [dbService, formData.service_id, updateField]);
  useEffect(() => { if (selectedClinic?._id && formData.clinic_id !== selectedClinic._id) updateField("clinic_id", selectedClinic._id); }, [selectedClinic, formData.clinic_id, updateField]);
  useEffect(() => { if (selectedDate && formData.date !== selectedDate) updateField("date", selectedDate); }, [selectedDate, formData.date, updateField]);
  useEffect(() => { if (selectedTime && formData.time !== selectedTime) updateField("time", selectedTime); }, [selectedTime, formData.time, updateField]);
  useEffect(() => { if (paymentMethod && formData.payment_method !== paymentMethod) updateField("payment_method", paymentMethod); }, [paymentMethod, formData.payment_method, updateField]);

  const handleDateSelect = (date: Date | undefined) => {
    if (!date) return;
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    setSelectedDate(d);
    setSelectedTime("");
  };

  const timeSlots = useMemo(() => {
    if (!selectedClinic?.clinic_timings || !settings?.booking_config?.slots_per_hour) return [];
    return generateTimeSlots(
      selectedClinic.clinic_timings.open_time,
      selectedClinic.clinic_timings.close_time,
      settings.booking_config.slots_per_hour
    );
  }, [selectedClinic, settings]);

  // ─── Loading State ──────────────────────────────────────────────────────────

  if (serviceLoading || settingLoading || isClinicLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="w-full max-w-6xl px-6 space-y-6">
          <Skeleton className="h-14 w-80 mx-auto rounded-2xl" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              {[240, 160, 200, 300].map((h, i) => (
                <Skeleton key={i} className="w-full rounded-2xl" style={{ height: h }} />
              ))}
            </div>
            <Skeleton className="h-[500px] rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  // ─── Success State ──────────────────────────────────────────────────────────

  if (bookingStep === BookingStep.SUCCESS) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-blue-50 flex items-center justify-center p-6">
        <div className="w-full max-w-xl">
          <div className="bg-white rounded-3xl shadow-2xl overflow-hidden border border-emerald-100">
            <div className="bg-gradient-to-r from-emerald-500 to-teal-500 p-10 text-center">
              <div className="w-24 h-24 bg-white/20 backdrop-blur rounded-full flex items-center justify-center mx-auto mb-5 ring-4 ring-white/30">
                <CheckCircle className="w-12 h-12 text-white" />
              </div>
              <h1 className="text-3xl font-extrabold text-white mb-2">Booking Confirmed!</h1>
              <p className="text-emerald-100 text-base">Your wellness journey begins now.</p>
            </div>
            <div className="p-8 space-y-5">
              <div className="grid grid-cols-2 gap-4">
                {[
                  { icon: "🏥", label: "Service", val: dbService?.service_name },
                  { icon: "📅", label: "Date", val: selectedDate?.toDateString() },
                  { icon: "⏰", label: "Time", val: selectedTime },
                  { icon: "🏢", label: "Clinic", val: selectedClinic?.clinic_name },
                  { icon: "🔢", label: "Sessions", val: sessions },
                  { icon: "💰", label: "Total Paid", val: `₹${pricing.total.toLocaleString()}` },
                ].map(({ icon, label, val }) => (
                  <div key={label} className="bg-slate-50 rounded-2xl p-4">
                    <p className="text-xs text-slate-500 font-medium mb-1">{icon} {label}</p>
                    <p className="font-bold text-slate-800 text-sm">{val}</p>
                  </div>
                ))}
              </div>
              <div className="flex gap-3">
                <Button onClick={() => (window.location.href = "/bookings")} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white rounded-xl py-3 h-auto font-semibold">
                  <CalendarIcon className="w-4 h-4 mr-2" /> My Bookings
                </Button>
                <Button onClick={() => window.location.reload()} variant="outline" className="flex-1 rounded-xl py-3 h-auto font-semibold border-2">
                  <Sparkles className="w-4 h-4 mr-2" /> Book Another
                </Button>
              </div>
              <p className="text-center text-xs text-slate-400">📧 Confirmation email sent · 📱 Reminder 24h before</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ─── Main Render ─────────────────────────────────────────────────────────────

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&family=Sora:wght@600;700;800&display=swap');
        .booking-root { font-family: 'DM Sans', sans-serif; }
        .booking-root h1, .booking-root h2 { font-family: 'Sora', sans-serif; }
        .glass-card {
          background: rgba(255,255,255,0.85);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255,255,255,0.9);
        }
        .slot-btn { transition: all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1); }
        .slot-btn:hover:not(:disabled) { transform: translateY(-2px); }
        .slot-btn:active:not(:disabled) { transform: scale(0.96); }
        @keyframes pulse-ring {
          0% { box-shadow: 0 0 0 0 rgba(59,130,246,0.4); }
          70% { box-shadow: 0 0 0 10px rgba(59,130,246,0); }
          100% { box-shadow: 0 0 0 0 rgba(59,130,246,0); }
        }
        .pulse-ring { animation: pulse-ring 2s infinite; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        .fade-in { animation: fadeIn 0.4s ease forwards; }
      `}</style>

      <div className="booking-root min-h-screen bg-gradient-to-br from-slate-100 via-blue-50/60 to-indigo-50">

        {/* ── Decorative background blobs ── */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-40 -right-40 w-96 h-96 bg-blue-200/30 rounded-full blur-3xl" />
          <div className="absolute top-1/2 -left-20 w-72 h-72 bg-indigo-200/20 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-purple-200/20 rounded-full blur-3xl" />
        </div>

        <div className="relative container mx-auto px-4 py-8 max-w-7xl">

          {/* ── Page Header ── */}
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 bg-blue-50 border border-blue-100 text-blue-600 rounded-full px-4 py-1.5 text-sm font-semibold mb-4">
              <Sparkles className="w-4 h-4" /> Premium Health Booking
            </div>
            <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 mb-3 leading-tight">
              Book Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">Appointment</span>
            </h1>
            <p className="text-slate-500 text-lg max-w-xl mx-auto">
              Seamless scheduling with India&apos;s most trusted wellness specialists.
            </p>
          </div>

          {/* ── Layout ── */}
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6 items-start">

            {/* ────────── LEFT COLUMN ────────── */}
            <div className="space-y-5">

              {/* Service Card */}
              <div className="glass-card rounded-3xl p-6 shadow-lg fade-in">
                <SectionHeader icon={Award} title="Service Details" subtitle="What you're booking today" />
                <div className="flex gap-5 items-start">
                  {dbService?.service_images?.[0] && (
                    <Image
                      src={dbService.service_images[0].url || "/placeholder.svg"}
                      alt={dbService.service_name}
                      width={100} height={100}
                      className="w-24 h-24 object-cover rounded-2xl shadow-md flex-shrink-0 ring-2 ring-white"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-xl font-bold text-slate-900 mb-1">{dbService?.service_name}</h3>
                    <p className="text-slate-500 text-sm mb-3 line-clamp-2">{dbService?.service_small_desc}</p>
                    <div className="flex flex-wrap gap-2">
                      <span className="inline-flex items-center gap-1.5 bg-blue-50 text-blue-700 border border-blue-100 rounded-full px-3 py-1 text-xs font-semibold">
                        <Award className="w-3 h-3" /> {sessions} Session{sessions > 1 ? "s" : ""}
                      </span>
                      <span className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-full px-3 py-1 text-xs font-semibold">
                        <Star className="w-3 h-3" /> {dbService?.service_status}
                      </span>
                      {dbService?.service_per_session_discount_price && (
                        <span className="inline-flex items-center gap-1.5 bg-amber-50 text-amber-700 border border-amber-100 rounded-full px-3 py-1 text-xs font-semibold">
                          <Sparkles className="w-3 h-3" /> Save ₹{((dbService.service_per_session_price - dbService.service_per_session_discount_price) * sessions).toLocaleString()}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Doctor Card */}
              {dbService?.service_doctor && (
                <div className="glass-card rounded-3xl p-6 shadow-lg fade-in">
                  <SectionHeader icon={UserCheck} title="Your Expert Doctor" subtitle="Carefully matched for your needs" />
                  <div className="flex flex-col sm:flex-row gap-5">
                    <Avatar className="w-20 h-20 ring-4 ring-blue-100 shadow-lg flex-shrink-0">
                      <AvatarImage src={dbService.service_doctor?.doctor_images?.[0]?.url || drImageurl} />
                      <AvatarFallback className="bg-gradient-to-br from-blue-400 to-indigo-600 text-white text-xl font-bold">
                        {dbService.service_doctor?.doctor_name?.split(" ").map((n: string) => n[0]).join("")}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-slate-900">{dbService.service_doctor?.doctor_name}</h3>
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {dbService.service_doctor?.specialization?.map((spec: string, i: number) => (
                          <span key={i} className="bg-indigo-50 text-indigo-700 border border-indigo-100 text-xs font-medium rounded-full px-2.5 py-0.5">
                            {spec.replace(/['"\[\]\n]/g, "").trim()}
                          </span>
                        ))}
                      </div>
                      <div className="flex items-center gap-3 mt-3">
                        <div className="flex gap-0.5">
                          {Array.from({ length: 5 }).map((_, i) => {
                            const rating = dbService.service_doctor?.doctor_ratings || 0;
                            const fill = Math.min(Math.max(rating - i, 0), 1);
                            return (
                              <div key={i} className="relative w-4 h-4">
                                <Star className="absolute w-4 h-4 text-slate-200 fill-slate-200" />
                                <Star className="absolute w-4 h-4 text-amber-400 fill-amber-400" style={{ clipPath: `inset(0 ${100 - fill * 100}% 0 0)` }} />
                              </div>
                            );
                          })}
                        </div>
                        <span className="font-bold text-slate-700">{dbService.service_doctor?.doctor_ratings?.toFixed(1)}</span>
                        <span className="text-xs text-slate-400 bg-slate-100 rounded-full px-2 py-0.5">500+ Reviews</span>
                      </div>
                      {dbService.service_doctor?.unknown_special_note && (
                        <p className="mt-3 text-sm text-slate-600 bg-blue-50 border border-blue-100 rounded-xl px-4 py-2.5 italic">
                          💡 {dbService.service_doctor.unknown_special_note}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Patient Details */}
              <div className="glass-card rounded-3xl p-6 shadow-lg fade-in">
                <SectionHeader icon={User} title="Patient Information" subtitle="Help us serve you better" />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  {/* Full Name */}
                  <div>
                    <Label className="text-sm font-semibold text-slate-700 mb-1.5 block">Full Name *</Label>
                    <Input
                      placeholder="Your full name"
                      value={formData.patient_details?.name || ""}
                      onChange={(e) => {
                        const val = e.target.value.replace(/[^a-zA-Z\s]/g, "");
                        updateField("patient_details.name", val);
                        updateField("patient_details.nameError", val.trim() ? "" : "Full name is required");
                      }}
                      className={`rounded-xl border-2 h-11 transition-all ${formData.patient_details?.nameError ? "border-red-400 bg-red-50" : "border-slate-200 focus:border-blue-400"}`}
                    />
                    {formData.patient_details?.nameError && <p className="text-red-500 text-xs mt-1">{formData.patient_details.nameError}</p>}
                  </div>

                  {/* Phone */}
                  <div>
                    <Label className="text-sm font-semibold text-slate-700 mb-1.5 block">Phone Number *</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                      <Input
                        type="tel" inputMode="numeric" maxLength={10}
                        placeholder="10-digit mobile number"
                        value={formData.patient_details?.phone || ""}
                        onChange={(e) => {
                          const val = e.target.value.replace(/\D/g, "");
                          updateField("patient_details.phone", val);
                          updateField("patient_details.phoneError", /^\d{10}$/.test(val) ? "" : "Must be 10 digits");
                        }}
                        className={`pl-9 rounded-xl border-2 h-11 transition-all ${formData.patient_details?.phoneError ? "border-red-400 bg-red-50" : "border-slate-200 focus:border-blue-400"}`}
                      />
                    </div>
                    {formData.patient_details?.phoneError && <p className="text-red-500 text-xs mt-1">{formData.patient_details.phoneError}</p>}
                  </div>

                  {/* Aadhar */}
                  <div>
                    <Label className="text-sm font-semibold text-slate-700 mb-1.5 block">Aadhar Number *</Label>
                    <div className="relative">
                      <FileDigit className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                      <Input
                        type="text" maxLength={12}
                        placeholder="12-digit Aadhar number"
                        value={formData.patient_details?.aadhar || ""}
                        onChange={(e) => {
                          const val = e.target.value.replace(/\D/g, "");
                          updateField("patient_details.aadhar", val);
                          updateField("patient_details.aadharError", /^\d{12}$/.test(val) ? "" : "Must be 12 digits");
                        }}
                        className={`pl-9 rounded-xl border-2 h-11 transition-all ${formData.patient_details?.aadharError ? "border-red-400 bg-red-50" : "border-slate-200 focus:border-blue-400"}`}
                      />
                    </div>
                    {formData.patient_details?.aadharError && <p className="text-red-500 text-xs mt-1">{formData.patient_details.aadharError}</p>}
                  </div>

                  {/* Email */}
                  <div>
                    <Label className="text-sm font-semibold text-slate-700 mb-1.5 block">Email Address *</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                      <Input
                        type="email"
                        placeholder="your@email.com"
                        value={formData.patient_details?.email || ""}
                        onChange={(e) => {
                          const val = e.target.value;
                          updateField("patient_details.email", val);
                          updateField("patient_details.emailError", !val || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val) ? "" : "Invalid email");
                        }}
                        className={`pl-9 rounded-xl border-2 h-11 transition-all ${formData.patient_details?.emailError ? "border-red-400 bg-red-50" : "border-slate-200 focus:border-blue-400"}`}
                      />
                    </div>
                    {formData.patient_details?.emailError && <p className="text-red-500 text-xs mt-1">{formData.patient_details.emailError}</p>}
                  </div>
                </div>
              </div>

              {/* Clinic Selection */}
              <div className="glass-card rounded-3xl p-6 shadow-lg fade-in">
                <SectionHeader icon={MapPin} title="Choose Your Clinic" subtitle="Pick the most convenient location" />
                <div className="space-y-3">
                  {clinics && clinics.length > 0 ? clinics.map((clinic) => {
                    const start = new Date(clinic.BookingAvailabeAt?.start_date);
                    const end = new Date(clinic.BookingAvailabeAt?.end_date);
                    end.setHours(23, 59, 59, 999);
                    const isAvailable = clinic.BookingAvailabeAt && today >= start && today <= end;
                    const isSelected = selectedClinic?._id === clinic._id;

                    return (
                      <div
                        key={clinic._id}
                        onClick={() => isAvailable && setSelectedClinic(clinic)}
                        className={`relative rounded-2xl border-2 p-4 transition-all duration-200 ${
                          isSelected ? "border-blue-500 bg-blue-50/60 shadow-md" :
                          isAvailable ? "border-slate-200 hover:border-blue-300 hover:bg-slate-50 cursor-pointer" :
                          "border-slate-100 bg-slate-50 opacity-60 cursor-not-allowed"
                        }`}
                      >
                        <div className="flex items-start gap-4">
                          {/* Radio indicator */}
                          <div className={`mt-1 w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                            isSelected ? "border-blue-600 bg-blue-600" : "border-slate-300"
                          }`}>
                            {isSelected && <div className="w-2 h-2 bg-white rounded-full" />}
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap mb-2">
                              <h4 className="font-bold text-slate-800">{clinic.clinic_name}</h4>
                              <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${
                                isAvailable ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-600"
                              }`}>
                                {isAvailable ? <><CheckCircle className="w-3 h-3" /> Available</> : <><XCircle className="w-3 h-3" /> Unavailable</>}
                              </span>
                            </div>

                            {clinic.clinic_contact_details?.clinic_address && (
                              <div className="flex items-start gap-1.5 text-sm text-slate-500 mb-2">
                                <MapPin className="w-3.5 h-3.5 text-slate-400 mt-0.5 flex-shrink-0" />
                                <span>{clinic.clinic_contact_details.clinic_address}</span>
                              </div>
                            )}

                            <div className="flex flex-wrap gap-2">
                              {clinic.clinic_contact_details?.phone && (
                                <a href={`tel:${clinic.clinic_contact_details.phone}`} className="inline-flex items-center gap-1 text-xs bg-emerald-50 text-emerald-700 rounded-full px-2.5 py-1 hover:bg-emerald-100 transition-colors">
                                  <Phone className="w-3 h-3" /> {clinic.clinic_contact_details.phone}
                                </a>
                              )}
                              {clinic.clinic_contact_details?.email && (
                                <a href={`mailto:${clinic.clinic_contact_details.email}`} className="inline-flex items-center gap-1 text-xs bg-blue-50 text-blue-700 rounded-full px-2.5 py-1 hover:bg-blue-100 transition-colors">
                                  <Mail className="w-3 h-3" /> {clinic.clinic_contact_details.email}
                                </a>
                              )}
                            </div>

                            {clinic.BookingAvailabeAt && (
                              <p className="mt-2 text-xs text-blue-600 bg-blue-50 border border-blue-100 rounded-lg px-3 py-1.5 inline-block">
                                📅 {start.toDateString()} – {end.toDateString()}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  }) : (
                    <div className="text-center py-12 rounded-2xl bg-slate-50 border-2 border-dashed border-slate-200">
                      <XCircle className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                      <p className="font-semibold text-slate-500">No clinics available</p>
                      <p className="text-sm text-slate-400 mt-1">Please check back later.</p>
                    </div>
                  )}
                </div>
                {getFieldError("clinic_id") && <p className="text-red-500 text-sm mt-3">{getFieldError("clinic_id")}</p>}
              </div>

              {/* Date Selection */}
              {selectedClinic && (
                <div className="glass-card rounded-3xl p-6 shadow-lg fade-in">
                  <SectionHeader icon={CalendarIcon} title="Pick Your Date" subtitle="Choose a date that fits your schedule" />
                  <div className="flex justify-center">
                    <Calendar
                      mode="single"
                      selected={selectedDate ?? undefined}
                      onSelect={handleDateSelect}
                      disabled={(date) => {
                        const d = new Date(date);
                        d.setHours(0, 0, 0, 0);
                        return d < today || !isDateAvailable(d);
                      }}
                      className="rounded-2xl border-2 border-slate-100 shadow-sm"
                    />
                  </div>
                  {getFieldError("date") && <p className="text-red-500 text-sm mt-3 text-center">{getFieldError("date")}</p>}
                </div>
              )}

              {/* Time Slots */}
              {selectedDate && (
                <div className="glass-card rounded-3xl p-6 shadow-lg fade-in">
                  <SectionHeader icon={Clock} title="Select Time Slot" subtitle={isCheckingAvailability ? "Checking availability…" : "Pick your preferred time"} />

                  {selectedTime && (
                    <div className={`mb-5 flex items-start gap-3 rounded-2xl p-4 border ${
                      bookedSlots.includes(selectedTime)
                        ? "bg-red-50 border-red-200 text-red-700"
                        : "bg-emerald-50 border-emerald-200 text-emerald-700"
                    }`}>
                      {bookedSlots.includes(selectedTime) ? (
                        <><XCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                        <div><p className="font-semibold text-sm">Slot already booked</p><p className="text-xs mt-0.5">Please choose another time.</p></div></>
                      ) : (
                        <><CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                        <div><p className="font-semibold text-sm">{selectedTime} is available!</p><p className="text-xs mt-0.5">You can proceed to confirm this slot.</p></div></>
                      )}
                    </div>
                  )}

                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                    {timeSlots.map((time) => {
                      const booked = bookedSlots.includes(time);
                      const active = selectedTime === time;
                      return (
                        <button
                          key={time}
                          onClick={() => !booked && setSelectedTime(time)}
                          disabled={booked || isCheckingAvailability}
                          className={`slot-btn relative rounded-2xl py-3 px-2 text-sm font-bold border-2 flex flex-col items-center gap-1 ${
                            active
                              ? "bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-200 pulse-ring"
                              : booked
                              ? "bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed"
                              : "bg-white border-slate-200 text-slate-700 hover:border-blue-400 hover:bg-blue-50 hover:text-blue-700"
                          }`}
                        >
                          {time}
                          {booked && (
                            <span className="text-[10px] font-medium text-red-400 leading-none">Booked</span>
                          )}
                          {booked && <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-red-400 rounded-full" />}
                        </button>
                      );
                    })}
                  </div>
                  {getFieldError("time") && <p className="text-red-500 text-sm mt-3">{getFieldError("time")}</p>}
                </div>
              )}

              {/* Payment Method */}
              {selectedDate && selectedTime && (
                <div className="glass-card rounded-3xl p-6 shadow-lg fade-in">
                  <SectionHeader icon={CreditCard} title="Payment Method" subtitle="Choose how you'd like to pay" />
                  <div className="space-y-3">
                    <div
                      onClick={() => setPaymentMethod("pay_at_clinic")}
                      className={`flex items-center gap-4 p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                        paymentMethod === "pay_at_clinic"
                          ? "border-blue-500 bg-blue-50/70 shadow-sm"
                          : "border-slate-200 hover:border-blue-200"
                      }`}
                    >
                      <div className={`w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0 transition-colors ${
                        paymentMethod === "pay_at_clinic" ? "bg-blue-600" : "bg-slate-100"
                      }`}>
                        <Clock className={`w-5 h-5 ${paymentMethod === "pay_at_clinic" ? "text-white" : "text-slate-500"}`} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <p className="font-bold text-slate-800">Pay at Clinic</p>
                          <span className="text-xs bg-emerald-100 text-emerald-700 font-semibold rounded-full px-2.5 py-0.5">Recommended</span>
                        </div>
                        <p className="text-sm text-slate-500 mt-0.5">Pay when you visit on the day of appointment</p>
                      </div>
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                        paymentMethod === "pay_at_clinic" ? "border-blue-600 bg-blue-600" : "border-slate-300"
                      }`}>
                        {paymentMethod === "pay_at_clinic" && <div className="w-2 h-2 bg-white rounded-full" />}
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 flex items-center justify-center gap-2 text-xs text-slate-400">
                    <Shield className="w-3.5 h-3.5" />
                    <span>256-bit SSL secured · Your data is safe with us</span>
                  </div>
                </div>
              )}

              {/* Form Errors */}
              {errors.filter((e) => !e.field).length > 0 && (
                <Alert className="border-red-200 bg-red-50 rounded-2xl">
                  <AlertDescription className="text-red-700 space-y-1">
                    {errors.filter((e) => !e.field).map((e, i) => (
                      <p key={i} className="flex items-center gap-2"><XCircle className="w-4 h-4" /> {e.message}</p>
                    ))}
                  </AlertDescription>
                </Alert>
              )}
            </div>

            {/* ────────── RIGHT COLUMN — Sticky Summary ────────── */}
            <div className="lg:sticky lg:top-6 space-y-4">
              <div className="glass-card rounded-3xl p-6 shadow-xl border border-blue-100">
                {/* Header */}
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                    <Sparkles className="w-4 h-4 text-white" />
                  </div>
                  <h2 className="text-lg font-bold text-slate-900">Booking Summary</h2>
                </div>

                {/* Service */}
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-4 mb-4 border border-blue-100">
                  <p className="font-bold text-slate-800">{dbService?.service_name}</p>
                  <p className="text-sm text-slate-500 mt-0.5">{sessions} Session{sessions > 1 ? "s" : ""}</p>
                  <div className="flex items-baseline gap-2 mt-2">
                    {dbService?.service_per_session_discount_price && (
                      <span className="text-slate-400 line-through text-sm">₹{dbService.service_per_session_price?.toLocaleString()}</span>
                    )}
                    <span className="text-blue-700 font-extrabold text-lg">
                      ₹{(dbService?.service_per_session_discount_price || dbService?.service_per_session_price || 0).toLocaleString()}
                    </span>
                    <span className="text-slate-400 text-xs">/session</span>
                  </div>
                </div>

                {/* Price Breakdown */}
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between text-slate-600">
                    <span>Subtotal</span>
                    <span className="font-semibold text-slate-800">₹{pricing.subtotal.toLocaleString()}</span>
                  </div>
                  {pricing.tax > 0 && (
                    <div className="flex justify-between text-slate-500">
                      <span>GST ({settings?.payment_config?.tax_percentage}%)</span>
                      <span>₹{pricing.tax.toLocaleString()}</span>
                    </div>
                  )}
                  {pricing.creditCard > 0 && (
                    <div className="flex justify-between text-slate-500">
                      <span>Card fee ({settings?.payment_config?.credit_card_fee}%)</span>
                      <span>₹{pricing.creditCard.toLocaleString()}</span>
                    </div>
                  )}
                  <Separator className="my-2" />
                  <div className="flex justify-between text-base font-extrabold text-slate-900">
                    <span>Total</span>
                    <span className="text-blue-700">₹{pricing.total.toLocaleString()}</span>
                  </div>
                </div>

                {/* Appointment Summary */}
                {selectedDate && selectedTime && selectedClinic && (
                  <div className="mt-5 bg-emerald-50 border border-emerald-200 rounded-2xl p-4 space-y-2 text-sm">
                    <p className="font-bold text-emerald-800 flex items-center gap-2"><CheckCircle className="w-4 h-4" /> Appointment Details</p>
                    <div className="space-y-1.5 text-slate-600">
                      <div className="flex items-center gap-2"><CalendarIcon className="w-3.5 h-3.5 text-slate-400" />{selectedDate.toDateString()}</div>
                      <div className="flex items-center gap-2"><Clock className="w-3.5 h-3.5 text-slate-400" />{selectedTime}</div>
                      <div className="flex items-center gap-2"><MapPin className="w-3.5 h-3.5 text-slate-400" />{selectedClinic.clinic_name}</div>
                    </div>
                  </div>
                )}

                {/* CTA */}
                {selectedDate && selectedTime && selectedClinic ? (
                  <div className="mt-5 space-y-3">
                    <Button
                      onClick={handleSubmit}
                      disabled={isSubmitting || !isValid || bookedSlots.includes(selectedTime)}
                      className="w-full h-14 rounded-2xl text-base font-bold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg shadow-blue-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                      {isSubmitting ? (
                        <span className="flex items-center gap-2">
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          Processing…
                        </span>
                      ) : (
                        <span className="flex items-center gap-2">
                          <Shield className="w-5 h-5" />
                          Confirm Booking · ₹{pricing.total.toLocaleString()}
                        </span>
                      )}
                    </Button>
                    <div className="flex items-center justify-center gap-2 text-xs text-slate-400 bg-slate-50 rounded-xl py-2.5">
                      <Lock className="w-3.5 h-3.5" />
                      <span>256-bit SSL encrypted & secure</span>
                    </div>
                  </div>
                ) : (
                  <div className="mt-5 flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-2xl p-4 text-amber-800 text-sm">
                    <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    <span>Complete all fields above to proceed with your booking.</span>
                  </div>
                )}

                {/* Trust badges */}
                <div className="mt-5 grid grid-cols-3 gap-2 text-center">
                  {[
                    { icon: Shield, label: "Secure" },
                    { icon: CheckCircle, label: "Verified" },
                    { icon: Heart, label: "Trusted" },
                  ].map(({ icon: Icon, label }) => (
                    <div key={label} className="bg-slate-50 rounded-xl py-2.5 px-1">
                      <Icon className="w-4 h-4 text-blue-500 mx-auto mb-1" />
                      <p className="text-[10px] font-semibold text-slate-500">{label}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Payment Modal */}
      <PaymentStatusModal
        isOpen={paymentModal.isOpen}
        onClose={() => setPaymentModal((prev) => ({ ...prev, isOpen: false }))}
        status={paymentModal.status}
        bookingDetails={
          paymentModal.status === "success" && selectedDate && selectedTime && selectedClinic
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

      {/* Mobile sticky CTA */}
      <div className="fixed bottom-0 left-0 right-0 z-50 lg:hidden p-4 bg-white/90 backdrop-blur border-t border-slate-200 shadow-2xl">
        <Button
          onClick={handleSubmit}
          disabled={isSubmitting || !isValid || !selectedDate || !selectedTime || !selectedClinic || bookedSlots.includes(selectedTime)}
          className="w-full h-13 rounded-2xl text-base font-bold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg disabled:opacity-50"
        >
          {isSubmitting ? (
            <span className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Processing…
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <Shield className="w-4 h-4" />
              {selectedDate && selectedTime ? `Confirm · ₹${pricing.total.toLocaleString()}` : "Complete all fields to book"}
            </span>
          )}
        </Button>
      </div>
    </>
  );
};

export default EnhancedBookings;